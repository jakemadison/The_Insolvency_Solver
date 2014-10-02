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


@app.route('/submit', methods=['POST'])
def submit():

    rent = int(request.form['rent'])
    bills = int(request.form['bills'])
    daily = int(request.form['daily_spend'])

    print('received values, rent: {0}, bills: {1}, daily: {2}'.format(rent, bills, daily))

    updates_rates_dict = {"rent": rent, "bills": bills, "daily": daily}

    result = update_rates(updates_rates_dict)

    return redirect(url_for('index'))


@app.route('/submit_transaction', methods=['POST'])
def submit_transaction():

    transaction_amount = int(request.form['transaction'])
    print('received a new transaction in the amount of: {0}'.format(transaction_amount))

    execute_transaction(transaction_amount)

    return redirect(url_for('index'))