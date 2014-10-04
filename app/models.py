from __future__ import print_function
from app import db
from datetime import datetime, timedelta


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

    def __init__(self, day, amount):

        self.day = day

        if amount >= 0:
            self.debits = amount
            self.credits = 0  # + daily amount
        else:
            self.credits = amount
            self.debits = 0  # + daily amount

        opening_balance = self._get_opening_balance()

        self.balance = opening_balance  # this doesn't actually deal with no spending days at all.

        self.balance += self.credits
        self.balance -= self.debits

    def update_day(self, amount):

        if amount >= 0:
            self.debits += amount
            self.balance -= amount
        else:
            self.credits += amount
            self.balance += amount

    def _get_opening_balance(self):

        my_day = db.session.query(DailyHistory).filter(DailyHistory.day == self.day).first().day
        delta = my_day - timedelta(days=1)

        prev_balance = db.session.query(DailyHistory)
        prev_balance = prev_balance.filter(DailyHistory.day == delta).first().balance

        return prev_balance


class TransactionHistory(db.Model):

    __tablename__ = 'transaction_history'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.TIMESTAMP)
    amount = db.Column(db.Integer, default=0)
    purchase_type = db.Column(db.String(64), default=None)

    def __init__(self, amount, purchase_type=None):
        self.amount = amount
        self.timestamp = datetime.now()
        self.purchase_type = purchase_type