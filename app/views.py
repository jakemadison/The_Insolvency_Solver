from __future__ import print_function
from app import app
from flask import render_template, request, jsonify, redirect, url_for
from controller import get_current_rates, update_rates, execute_transaction, get_recent_transactions


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
    return render_template('daily_summary.html', rates=rates)


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

    try:
        transaction_amount = int(request.form['transaction'])
    except ValueError:
        return redirect(url_for('index'))

    print('received a new transaction in the amount of: {0}'.format(transaction_amount))

    if transaction_amount == 0:
        return redirect(url_for('index'))

    execute_transaction(transaction_amount)

    return redirect(url_for('index'))