from __future__ import print_function
from app import app
from flask import render_template, request, jsonify, redirect, url_for, session
from flask import g
from controller import get_current_rates, get_sum_category_per_day, update_rates, execute_transaction
from controller import add_user, get_recent_transactions, get_daily_summary, get_filtered_summary
from datetime import datetime, timedelta
from flask.ext.login import login_user, logout_user, current_user
from models import User
from app import lm, oid


@app.before_request
def before_request_happens():
    print("NEW REQUEST:")
    g.user = current_user

    print('current user is: ', g.user)



#####
# Functions for handling user login:
#####
@lm.user_loader
def load_user(id):
    return User.query.get(int(id))


@app.route('/login_user', methods=['GET', 'POST'])
@oid.loginhandler
def login_user_function():

    print('I am attempting to login now...')

    try:
        url = request.form["url"]
    except Exception, e:

        return jsonify({'there were so many errors': str(e)})

    print('getting oid results now: ')

    oid_results = oid.try_login(url, ask_for=['nickname', 'email'])

    return oid_results


@oid.after_login
def after_login_function(resp):

    print('running after_login function now...')

    user = g.user

    if resp.email is None or resp.email == "":
        print('Invalid login. Please try again.')
        return redirect(url_for('/index'))

    # if totally new user:
    if user is None:
        print('response: {0}'.format(resp))

        add_user(resp)

    user = User.query.filter_by(email=resp.email).first()

    print('Now attempting to log in now: ', user)

    login_user(user, remember=True)

    # return redirect(oid.get_next_url())

    # return jsonify({'success': True})
    #
    return redirect(request.args.get('next') or url_for('index'))
    # return redirect(request.args.get('next'))

@app.route('/logout')
def logout_view():
    logout_user()
    print("successful logout for user: {0}".format(g.user))
    return jsonify({'message': 'look how logged out you are!'})





@app.route('/')
@app.route('/index')
@oid.loginhandler
def build_index():

    # if g.user is None or not g.user.is_authenticated():
    #     pass

    rates = get_current_rates()
    transactions = get_recent_transactions()
    return render_template('index.html', title='Insolvency_Solver',
                           rates=rates, transactions=transactions)


@app.route('/settings')
def get_settings():
    rates = get_current_rates()

    rates['monthly_balance'] = rates['income_per_month'] - (rates['rent'] + rates['bills'] + rates['other_costs'])
    rates['max_spending'] = rates['monthly_balance']/30

    return render_template('settings.html', rates=rates)


@app.route('change_info_display', methods=['POST'])
def show_hide_info():
    hiding = request.form['hidden']





@app.route('/daily_summary')
def get_daily_summary():
    rates = get_current_rates()
    daily_summary = get_daily_summary()

    return render_template('daily_summary.html', rates=rates, daily_summary=daily_summary)


@app.route('/transaction_metrics')
def transaction_metrics():
    rates = get_current_rates()
    transactions = get_recent_transactions()

    transaction_categories = list(set([t['purchase_type'] for t in transactions]))
    transaction_categories.sort()

    return render_template('transaction_metrics.html', rates=rates,
                           transactions=transactions,
                           transaction_categories=transaction_categories)


@app.route('/metrics')
def metrics():
    rates = get_current_rates()
    return render_template('metrics.html', rates=rates)


@app.route('/calendar')
def calendar():
    rates = get_current_rates()
    return render_template('calendar.html', rates=rates)


# POST ROUTES:
@app.route('/submit_monthly', methods=['POST'])
def submit_monthly():

    updates_rates_dict = {str(k): int(str(v)) for (k, v) in request.form.iteritems()}
    print('update received with values: {0}'.format(updates_rates_dict))

    current_rates = get_current_rates()

    monthly_balance = updates_rates_dict['income_per_month'] - (updates_rates_dict['rent'] +
                                                                updates_rates_dict['bills'] +
                                                                updates_rates_dict['other_costs'])

    monthly_spending = current_rates['daily'] * 30

    updates_rates_dict['savings_per_month'] = monthly_balance - monthly_spending

    result = update_rates(updates_rates_dict)

    return redirect(url_for('settings'))


@app.route('/submit_savings', methods=['POST'])
def submit_savings():

    updates_rates_dict = {str(k): int(str(v)) for (k, v) in request.form.iteritems()}
    print('update received with values: {0}'.format(updates_rates_dict))

    monthly_balance = updates_rates_dict['income_per_month'] - (updates_rates_dict['rent'] +
                                                            updates_rates_dict['bills'] +
                                                            updates_rates_dict['other_costs'])

    result = update_rates(updates_rates_dict)

    return redirect(url_for('settings'))


@app.route('/submit_spending', methods=['POST'])
def submit_spending():

    updates_rates_dict = {str(k): int(str(v)) for (k, v) in request.form.iteritems()}
    print('update received with values: {0}'.format(updates_rates_dict))
    result = update_rates(updates_rates_dict)

    return redirect(url_for('settings'))


@app.route('/submit_transaction', methods=['POST'])
def submit_transaction():

    print('transaction submitted.')

    try:
        transaction_amount = request.form['transaction']

        if transaction_amount == '':  # this can die after date is finished.  value error will catch ''
            transaction_amount = 0
        else:
            transaction_amount = int(transaction_amount)

        purchase_type = request.form['purchase']
        transaction_date = request.form['transaction_date']
    except ValueError, e:
        print('value error on input: {0}'.format(str(e)))
        return redirect(url_for('index'))

    print('received a new transaction, amount: {0}, type: {1}, date: {2}'.format(transaction_amount,
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
        return redirect(url_for('index'))

    execute_transaction(transaction_amount, purchase_type, parsed_date)

    return redirect(url_for('index'))


#ROUTES FOR METRICS:
@app.route('/get_spending_data')
def get_spending_data():

    """this will be our new main function for getting all required data
    using filters for transaction chart section"""

    filters = request.args.get('filters', '')
    filter_array = [str(x) for x in filters.split(',')]

    if len(filter_array):
        daily_summary = get_filtered_summary(filter_array)
    else:
        daily_summary = get_daily_summary()

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

        print("got it!")
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

    print('hey guess what???? I received: {0}, {1}'.format(start_date, end_date))
    print('hey guess what???? I received: {0}'.format(filters))

    filter_array = [str(x) for x in filters.split(',')]

    if len(filter_array):
        print('yerrrrp', filter_array)

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


