from __future__ import print_function
from app import app
from flask import render_template, request, jsonify, redirect, url_for
from flask import g
from rates_controller import get_current_rates, update_rates
from user_controller import add_user, change_info_view
from controller import get_daily_summary
from transaction_controller import get_recent_transactions, get_filtered_summary
from transaction_controller import execute_transaction, get_sum_category_per_day
from datetime import datetime, timedelta
from flask.ext.login import login_user, logout_user, current_user
from models import User
from app import lm, oid

import logging
from app import setup_logger
logger = logging.getLogger(__name__)
setup_logger(logger)
logger.setLevel(logging.INFO)


@app.before_request
def before_request_happens():
    logger.info("NEW REQUEST:")
    g.user = current_user

    if g.user.is_anonymous():
        user = User.query.filter_by(email='guest@guest.com').first()
        g.user = user

    logger.info('current user is: {0}'.format(g.user))


#####
# Functions for handling user login:
#####
@lm.user_loader
def load_user(u_id):
    return User.query.get(int(u_id))


@app.route('/login_user', methods=['GET', 'POST'])
@oid.loginhandler
def login_user_function():

    logger.info('I am attempting to login now...')

    try:
        url = request.form["url"]
    except Exception, e:

        return jsonify({'there were so many errors': str(e)})

    logger.info('getting oid results now: ')

    oid_results = oid.try_login(url, ask_for=['nickname', 'email'])

    return oid_results


@oid.after_login
def after_login_function(resp):

    logger.info('running after_login function now...')

    # user = g.user

    if resp.email is None or resp.email == "":
        logger.warn('Invalid login. Please try again.')
        return redirect(url_for('/index'))

    user = User.query.filter_by(email=resp.email).first()

    # if totally new user:
    # if user is None or user.is_authenticated() is False:
    if user is None:
        logger.info('response: {0}'.format(resp))
        add_user(resp)
        user = User.query.filter_by(email=resp.email).first()

    logger.info('Now attempting to log in now: {0}'.format(user))

    login_user(user, remember=True)

    return redirect(request.args.get('next') or url_for('index'))


@app.route('/logout')
def logout_view():
    logout_user()
    logger.info("successful logout for user: {0}".format(g.user))

    # rates = get_current_rates()
    # transactions = get_recent_transactions()
    # return render_template('index.html', title='Insolvency_Solver',
    #                        rates=rates, transactions=transactions)
    return jsonify({'message': 'look how logged out you are!'})


# Main Page Building Routes:
@app.route('/')
@app.route('/index')
@oid.loginhandler
def build_index():

    user = g.user

    rates = get_current_rates(user)
    transactions = get_recent_transactions(user)
    return render_template('index.html', title='Insolvency_Solver',
                           rates=rates, transactions=transactions, u=user)


@app.route('/settings')
def get_settings():

    user = g.user

    rates = get_current_rates(user)

    rates['monthly_balance'] = rates['income_per_month'] - (rates['rent'] + rates['bills'] + rates['other_costs'])
    rates['max_spending'] = rates['monthly_balance']/30

    return render_template('settings.html', rates=rates, u=user)


@app.route('/daily_summary')
def get_daily_summary_view():

    user = g.user

    rates = get_current_rates(user)
    daily_summary = get_daily_summary(user)

    return render_template('daily_summary.html', rates=rates, daily_summary=daily_summary, u=user)


@app.route('/transaction_metrics')
def transaction_metrics():
    user = g.user
    rates = get_current_rates(user)
    transactions = get_recent_transactions(user)

    transaction_categories = list(set([t['purchase_type'] for t in transactions]))
    transaction_categories.sort()

    return render_template('transaction_metrics.html', rates=rates,
                           transactions=transactions,
                           transaction_categories=transaction_categories, u=user)


@app.route('/metrics')
def metrics():
    user = g.user
    rates = get_current_rates(user)
    return render_template('metrics.html', rates=rates, u=user)


@app.route('/calendar')
def calendar():
    user = g.user
    rates = get_current_rates(user)
    return render_template('calendar.html', rates=rates, u=user)


# POST ROUTES:
@app.route('/change_info_display', methods=['POST'])
def show_hide_info():
    hiding = request.form['hidden']
    user = g.user

    #guests can't permanently hide info, because I say so.
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


@app.route('/submit_spending', methods=['POST'])
def submit_spending():
    user = g.user

    updates_rates_dict = {str(k): int(str(v)) for (k, v) in request.form.iteritems()}
    logger.info('update received with values: {0}'.format(updates_rates_dict))

    for v in updates_rates_dict.values():
        if v > 100000:
            return jsonify({'message': "what are you tryin' to pull here, buddy?"})



    result = update_rates(user, updates_rates_dict)

    return redirect(url_for('settings'))


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
            raise ValueError

        purchase_type = request.form['purchase']
        transaction_date = request.form['transaction_date']
    except ValueError, e:
        logger.warn('value error on input: {0}'.format(str(e)))
        return redirect(url_for('build_index'))

    logger.info('received a new transaction, amount: {0}, type: {1}, date: {2}'.format(transaction_amount,
                                                                                       purchase_type,
                                                                                       transaction_date))

    if purchase_type:
        purchase_type = purchase_type.title()

    # parse transaction_date here.
    if transaction_date:
        parsed_date = datetime.strptime(transaction_date, '%d/%m/%Y')
    else:
        parsed_date = datetime.today()

    # move this back up after finished with testing of transaction date.
    if transaction_amount == 0:
        return redirect(url_for('build_index'))

    execute_transaction(user, transaction_amount, purchase_type, parsed_date)

    return redirect(url_for('build_index'))


#ROUTES FOR METRICS:
@app.route('/get_spending_data')
def get_spending_data():

    """this will be our new main function for getting all required data
    using filters for transaction chart section"""

    user = g.user

    filters = request.args.get('filters', '')
    filter_array = [str(x) for x in filters.split(',')]

    # filtered daily summary can just do it all now.
    daily_summary = get_filtered_summary(user, filter_array)

    transaction_summary = get_sum_category_per_day()
    transaction_categories = list(set([t['purchase_type'] for t in transaction_summary]))

    return jsonify({'transaction_summary': transaction_summary,
                    'daily_summary': daily_summary,
                    'categories': transaction_categories})





# TO BE DEPRECATED:

@app.route('/get_transaction_summary')
def get_transaction_summary():
    """This returns a daily list of sum(amount) per category"""

    transaction_summary = get_sum_category_per_day()
    return jsonify({'transaction_summary': transaction_summary})


@app.route('/get_transaction_metrics')
def get_transaction_metrics():

    start_date = request.args.get('start_date', None)
    end_date = request.args.get('end_date', None)

    if start_date != '0' and end_date != '0':

        logger.info("got it!")
        start = datetime.strptime(start_date, '%d/%m/%Y')
        # delta = timedelta(days=1)
        # start = start - delta
        end = datetime.strptime(end_date, '%d/%m/%Y')
    else:
        start = None
        end = None

    transaction_list = get_recent_transactions(start, end)

    transaction_categories = list(set([t['purchase_type'] for t in transaction_list]))
    transaction_categories.sort()

    return jsonify({"transactions": transaction_list, "categories": transaction_categories, "success": True})



@app.route('/get_daily_metrics')
def get_daily_metrics():

    """this is used by main metrics page, and is set to get nixed."""

    start_date = request.args.get('start_date', None)
    end_date = request.args.get('end_date', None)
    filters = request.args.get('filters', None)

    logger.info('hey guess what???? I received: {0}, {1}'.format(start_date, end_date))
    logger.info('hey guess what???? I received: {0}'.format(filters))

    filter_array = [str(x) for x in filters.split(',')]

    if len(filter_array):
        logger.info('yerrrrp {0}'.format(filter_array))

    if start_date != '0' and end_date != '0':
        start = datetime.strptime(start_date, '%d/%m/%Y')
        delta = timedelta(days=1)
        start = start - delta
        end = datetime.strptime(end_date, '%d/%m/%Y')
    else:
        start = None
        end = None

    if len(filter_array) and False:
        daily_summary = get_filtered_summary(filter_array)
    else:
        daily_summary = get_daily_summary(start, end)

    return jsonify({"summary": daily_summary, "success": True})


