from __future__ import print_function
from app import app
from flask import render_template, request, jsonify, redirect, url_for
from controller import get_current_rates, update_rates, execute_transaction


@app.route('/')
@app.route('/index')
def index():

    rates = get_current_rates()
    return render_template('index.html', title='Insolvency_Solver',
                           rates=rates)


@app.route('/settings')
def settings():
    rates = get_current_rates()
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

@app.route('/submit', methods=['POST'])
def submit():

    updates_rates_dict = {str(k): int(str(v)) for (k, v) in request.form.iteritems()}
    print('update received with values: {0}'.format(updates_rates_dict))

    result = update_rates(updates_rates_dict)

    return redirect(url_for('settings'))


@app.route('/submit_transaction', methods=['POST'])
def submit_transaction():

    transaction_amount = int(request.form['transaction'])
    print('received a new transaction in the amount of: {0}'.format(transaction_amount))

    execute_transaction(transaction_amount)

    return redirect(url_for('index'))