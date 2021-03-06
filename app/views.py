from __future__ import print_function
from app import app
from flask import render_template, request, jsonify, redirect, url_for
from flask import g
from rates_controller import get_current_rates, update_rates
from user_controller import add_user, change_info_view, update_user_nickname
from controller import get_daily_summary, reset_user_account
from transaction_controller import get_recent_transactions, get_filtered_summary, delete_transaction_record
from transaction_controller import execute_transaction, get_sum_category_per_day
from datetime import datetime, timedelta
from flask.ext.login import login_user, logout_user, current_user
from models import User
from app import lm, oid
from utilities import execute_git_log
from oauth import OAuthSignIn
import time
import json

import logging
from app import setup_logger
logger = logging.getLogger(__name__)
setup_logger(logger)
logger.setLevel(logging.INFO)


@app.before_request
def before_request_happens():
    g.user = current_user

    if g.user.is_anonymous():
        user = User.query.filter_by(email='guest@guest.com').first()
        g.user = user

    remote_address = request.remote_addr

    if app.debug or (not app.debug and remote_address != '127.0.0.1'):
        logger.info('NEW REQUEST: current user is: {0}.  From Ip: {1}'.format(g.user, remote_address))

    g.commit = execute_git_log()


#####
# Functions for handling user login:
#####
@lm.user_loader
def load_user(u_id):
    return User.query.get(int(u_id))


@app.route('/authorize/<provider>')
def oauth_authorize(provider):

    try:
        if not current_user.is_anonymous():
            return redirect(url_for('build_index'))
        oauth = OAuthSignIn.get_provider(provider)
    except Exception, e:
        logger.error('some error happened: {0}'.format(e))
        return redirect(url_for('build_index'))

    return oauth.authorize()


@app.route('/callback/<provider>')
def oauth_callback(provider):
    if not current_user.is_anonymous():
        return redirect(url_for('build_index'))

    oauth = OAuthSignIn.get_provider(provider)
    social_id, username, email = oauth.callback()

    if social_id is None:
        logger.error('Authentication failed.')
        return redirect(url_for('build_index'))

    user = User.query.filter_by(social_id=social_id).first()

    if not user:
        user = add_user(social_id, username, email)

    if user:
        login_user(user, True)

    return redirect(url_for('build_index'))


@app.route('/logout')
def logout_view():
    logout_user()
    logger.info("successful logout for user: {0}".format(g.user))

    # rates = get_current_rates()
    # transactions = get_recent_transactions()
    # return render_template('index.html', title='Insolvency_Solver',
    #                        rates=rates, transactions=transactions)
    # return jsonify({'message': 'look how logged out you are!'})
    return redirect(url_for('build_index'))


# let's put all of this rates crap in an app.context_processor as available functions
# then change the templates to just use those when they need them.
@app.context_processor
def template_functions():

    user = g.user

    # rates and transactions should get placed in a context processor...
    # probably the same with our commit object?
    rates = get_current_rates(user)

    rates['monthly_balance'] = rates['income_per_month'] - (rates['rent'] + rates['bills'] + rates['other_costs'])
    rates['max_spending'] = rates['monthly_balance']/30

    transactions = get_recent_transactions(user)
    transaction_categories = list(set([t['purchase_type'] for t in transactions]))
    transaction_categories.sort()

    title = 'Insolvency_Solver'

    return dict(rates=rates, transactions=transactions, u=user,
                transaction_categories=transaction_categories, title=title)


# Main Page Building Routes:
@app.route('/')
@app.route('/index')
@oid.loginhandler
def build_index():
    return render_template('index.html', title='Insolvency_Solver')


@app.route('/settings')
def get_settings():
    return render_template('settings.html')


@app.route('/daily_summary')
def get_daily_summary_view():

    user = g.user
    daily_summary = get_daily_summary(user)

    print('daily summary: {0}'.format(daily_summary))

    return render_template('daily_summary.html', daily_summary=daily_summary)


@app.route('/transaction_metrics')
def transaction_metrics():
    return render_template('transaction_metrics.html')


@app.route('/calendar')
def calendar():
    return render_template('calendar.html')


###############
# POST ROUTES:
###############
@app.route('/change_nickname', methods=['POST'])
def change_nickname():

    user = g.user
    nickname = request.form['nickname']

    logger.info("entered change nickname function".format(nickname, user))

    if len(nickname) == 0 or len(nickname) > 50:
        return jsonify({'message': 'noooooope'})

    result = None
    # result = update_user_nickname(user, nickname)
    return jsonify({'message': result})


@app.route('/change_info_display', methods=['POST'])
def show_hide_info():
    hiding = request.form['hidden']
    user = g.user

    # guests can't permanently hide info, because I say so.
    if user.is_guest():
        return jsonify({'success': False})

    logger.info("hiding: {0}, user: {1}".format(hiding, user))
    change_info_view(user, hiding)

    return jsonify({'success': True})


@app.route('/submit_monthly', methods=['POST'])
def submit_monthly():

    """receives a set of updated figures for monthly income & costs.  determines what our original ratio of
    spending vs. savings was, and attempts to apply that ratio to the new monthly net balance, in order to set a new
    daily credits vs. monthly spending fulcrum"""

    user = g.user

    # this needs to be able to deal with missing values, and validation of values coming in too
    # I can receive changes in bills, rent, other, and income

    updates_rates_dict = {str(k): int(str(v)) for (k, v) in request.form.iteritems() if k and v}
    logger.info('update received with values: {0}'.format(updates_rates_dict))

    for v in updates_rates_dict.values():
        if v > 100000:
            return jsonify({'message': "what are you tryin' to pull here, buddy?"})

    current_rates = get_current_rates(user)

    # fill out missing values in update_rates:
    for rate, value in current_rates.iteritems():
        if rate not in updates_rates_dict:
            updates_rates_dict[rate] = current_rates[rate]

    old_monthly_balance = current_rates['income_per_month'] - (current_rates['rent'] +
                                                               current_rates['bills'] +
                                                               current_rates['other_costs'])

    monthly_balance = updates_rates_dict['income_per_month'] - (updates_rates_dict['rent'] +
                                                                updates_rates_dict['bills'] +
                                                                updates_rates_dict['other_costs'])

    # discover the ratio of spending vs savings in our old rates:
    old_monthly_spending = current_rates['daily'] * 30
    current_credit_ratio = float(old_monthly_spending)/float(old_monthly_balance)

    if monthly_balance < 0:
        return jsonify({'message':
                        'monthly costs exceed monthly income. You wont be able to save any money with me :<'})

    # using our previous ratio, determine the new spending amount given the new monthly balance:
    new_monthly_spending = current_credit_ratio * monthly_balance
    updates_rates_dict['daily'] = int(new_monthly_spending / 30)
    updates_rates_dict['savings_per_month'] = int(monthly_balance - new_monthly_spending)

    # This can get moved higher now...
    if len(updates_rates_dict) == 0:
        return jsonify({'updating with the following': updates_rates_dict,
                        'current rates': current_rates,
                        'month balance': monthly_balance,
                        'current ratio': current_credit_ratio,
                        'new spending': new_monthly_spending})

    result = update_rates(user, updates_rates_dict)

    return redirect(url_for('get_settings'))


@app.route('/submit_savings', methods=['POST'])
def submit_savings():

    """this deals with changes from the settings page to amount of savings vs daily rate"""

    user = g.user
    updates_rates_dict = {str(k): int(str(v)) for (k, v) in request.form.iteritems() if k and v}
    logger.info('update received with values: {0}'.format(updates_rates_dict))

    for v in updates_rates_dict.values():
        if v > 100000:
            return jsonify({'message': "what are you tryin' to pull here, buddy?"})

    current_rates = get_current_rates(user)
    # fill out missing values in update_rates:
    for rate, value in current_rates.iteritems():
        if rate not in updates_rates_dict:
            updates_rates_dict[rate] = current_rates[rate]

    monthly_balance = current_rates['income_per_month'] - (current_rates['rent'] +
                                                           current_rates['bills'] +
                                                           current_rates['other_costs'])

    updates_rates_dict['savings_per_month'] = monthly_balance - (updates_rates_dict['daily'] * 30)

    result = update_rates(user, updates_rates_dict)

    return redirect(url_for('get_settings'))


@app.route('/submit_transaction', methods=['POST'])
def submit_transaction():

    """This is the main entry point for submitting a new transaction to the DB"""

    user = g.user

    logger.info('transaction submitted.')

    try:
        transaction_amount = request.form['transaction']

        if transaction_amount == '':  # this can die after date is finished.  value error will catch ''
            transaction_amount = 0
        else:
            transaction_amount = int(transaction_amount)

        if transaction_amount > 100000:
            return redirect(url_for('build_index'))

        purchase_type = request.form['purchase']
        transaction_date = request.form['transaction_date']
    except ValueError, e:
        logger.warn('value error on input: {0}'.format(str(e)))
        return redirect(url_for('build_index'))

    logger.info('received a new transaction, '
                'amount: {0}, type: {1}, date: {2}'.format(transaction_amount, purchase_type, transaction_date))

    if purchase_type:
        purchase_type = purchase_type.title()

    # parse transaction_date here.
    if transaction_date:
        try:
            parsed_date = datetime.strptime(transaction_date, '%d/%m/%Y')
        except ValueError, val:
            logger.error('dammit there was a value error for some reason: {v}'.format(v=val))
            return redirect(url_for('build_index'))
    else:
        parsed_date = datetime.today()

    # move this back up after finished with testing of transaction date.
    if transaction_amount == 0:
        return redirect(url_for('build_index'))

    execute_transaction(user, transaction_amount, purchase_type, parsed_date)

    return redirect(url_for('build_index'))


@app.route('/delete_transaction', methods=['POST'])
def receive_delete_transaction():

    user = g.user
    transaction_ids = None

    print('made it to delete... ')

    try:
        transaction_array = json.loads(request.form.getlist('transaction_ids')[0])
        print(transaction_array)
        # transaction_array = json.loads(request.args.get('transaction_ids'))
        # print(transaction_array)
        parsed_array = [int(x) for x in transaction_array]

    except ValueError, e:
        logger.error('there was a problem getting transaction ids,'
                     ' user: {0}, id: {1}, e: {2}'.format(user, transaction_ids, e))
        return jsonify({'message': 'failed'})

    print('received delete transactions: {0}'.format(parsed_array))

    for transaction_id in parsed_array:
        delete_transaction_record(user, transaction_id)

    return jsonify({'message': 'success!'})


@app.route('/reset_account', methods=['POST'])
def reset_account():
    print('received a request to reset and account')
    user = g.user

    result = reset_user_account(user)

    return jsonify({'message': result})


# ROUTES FOR METRICS:
@app.route('/get_spending_data')
def get_spending_data():

    """this will be our new main function for getting all required data
    using filters for transaction chart section"""

    user = g.user

    filters = request.args.get('filters', '')
    filter_array = [str(x) for x in filters.split(',')]

    # filtered daily summary can just do it all now.
    daily_summary = get_filtered_summary(user, filter_array)

    for d in daily_summary:
        d['day'] = d['day'].strftime("%d/%m")

    return jsonify({'daily_summary': daily_summary})



