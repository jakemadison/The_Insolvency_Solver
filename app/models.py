from __future__ import print_function
from app import db
from datetime import datetime, timedelta
from sqlalchemy import func


class CurrentRates(db.Model):

    __tablename__ = 'current_rates'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(64), unique=True)
    amount = db.Column(db.Integer, default=0)

    def __repr__(self):
        r = str({"type": self.type, "amount": self.amount})
        return r


class DailyHistory(db.Model):

    """
    Note, the model expects credits to come in as LESS THAN ZERO
    while expecting debits to come in as >= 0
    """

    __tablename__ = 'daily_history'

    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Date)
    credits = db.Column(db.Integer, default=0)
    debits = db.Column(db.Integer, default=0)
    balance = db.Column(db.Integer, default=0)

    def __init__(self, day):

        self.day = day

        current_rate = db.session.query(CurrentRates).filter(CurrentRates.type == 'daily').first().amount
        self.credits = current_rate

        prev_day = day - timedelta(days=1)
        print(prev_day)
        print(current_rate)
        prev_balance = db.session.query(DailyHistory).filter(DailyHistory.day == func.DATE(prev_day)).first().balance

        print(prev_balance)
        self.balance = prev_balance
        self.balance += current_rate

    def update_day(self, amount):

        if amount >= 0:
            self.debits += amount
            self.balance -= amount
        else:
            self.credits += amount
            self.balance += amount


class TransactionHistory(db.Model):

    __tablename__ = 'transaction_history'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.TIMESTAMP)
    amount = db.Column(db.Integer, default=0)
    purchase_type = db.Column(db.String(64), default=None)

    def __init__(self, amount, transaction_timestamp, purchase_type=None):
        self.amount = amount
        self.timestamp = transaction_timestamp
        self.purchase_type = purchase_type