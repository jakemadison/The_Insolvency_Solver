from app import db
from datetime import datetime


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
            self.credits = 0
        else:
            self.credits = amount
            self.debits = 0

        self.balance = self.credits - self.debits

    def update_day(self, amount):

        if amount >= 0:
            self.debits += amount
        else:
            self.credits += amount

        self.balance = self.credits - self.debits


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