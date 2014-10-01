from __future__ import print_function
from app import app
from flask import render_template, request, jsonify


@app.route('/')
@app.route('/index')
def index():

    balance = 30
    rent = 400
    bills = 450
    daily = 30

    return render_template('index.html', title='Insolvency_Solver',
                           balance=balance, rent=rent,
                           bills=bills, daily=daily)


@app.route('/submit', methods=['POST'])
def submit():

    rent = int(request.form['rent'])
    bills = int(request.form['bills'])
    daily = int(request.form['daily_spend'])

    print('received values, rent: {0}, bills: {1}, daily: {2}'.format(rent, bills, daily))

    return jsonify({"success": True})