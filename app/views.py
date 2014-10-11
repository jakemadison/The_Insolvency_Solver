from __future__ import print_function
from app import app
from flask import render_template, request, jsonify, redirect, url_for
from controller import get_current_rates, update_rates, execute_transaction, get_recent_transactions, get_daily_summary
from datetime import datetime, timedelta

@app.route('/')
@app.route('/index')
def index():

    rates = get_current_rates()
    transactions = get_recent_transactions()
    return render_template('index.html', title='Insolvency_Solver',
                           rates=rates, transactions=transactions)


@app.route('/settings')
def settings():
    rates = get_current_rates()

    rates['monthly_balance'] = rates['income_per_month'] - (rates['rent'] + rates['bills'] + rates['other_costs'])

    return render_template('settings.html', rates=rates)


@app.route('/daily_summary')
def daily_summary():
    rates = get_current_rates()
    daily_summary = get_daily_summary()

    return render_template('daily_summary.html', rates=rates, daily_summary=daily_summary)


@app.route('/metrics')
def metrics():
    rates = get_current_rates()
    return render_template('metrics.html', rates=rates)


@app.route('/total_savings')
def total_savings():
    rates = get_current_rates()
    return render_template('total_savings.html', rates=rates)


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
        parsed_date = datetime.strptime(transaction_date, '%b %d %Y')
    else:
        parsed_date = datetime.today()

    # move this back up after finished with testing of transaction date.
    if transaction_amount == 0:
        return redirect(url_for('index'))

    execute_transaction(transaction_amount, purchase_type, parsed_date)

    return redirect(url_for('index'))


#ROUTES FOR METRICS:
@app.route('/get_daily_metrics')
def get_daily_metrics():

    start_date = request.args.get('start_date', None)
    end_date = request.args.get('end_date', None)

    print('hey guess what???? I received: {0}, {1}'.format(start_date, end_date))
    print(start_date == '0')

    if start_date != '0' and end_date != '0':
        start = datetime.strptime(start_date, '%b %d %Y')
        delta = timedelta(days=1)
        start = start - delta
        end = datetime.strptime(end_date, '%b %d %Y')
    else:
        start = None
        end = None

    daily_summary = get_daily_summary(start, end)
    return jsonify({"summary": daily_summary, "success": True})