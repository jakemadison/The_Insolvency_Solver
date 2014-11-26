from __future__ import print_function
from app import db
from datetime import timedelta
from sqlalchemy import func
from sqlalchemy.ext.declarative import declarative_base
from flask.ext.login import UserMixin
from social.storage.sqlalchemy_orm import SQLAlchemyUserMixin, \
                                          SQLAlchemyAssociationMixin, \
                                          SQLAlchemyNonceMixin, \
                                          SQLAlchemyCodeMixin, \
                                          BaseSQLAlchemyStorage

from social.apps.flask_app.default import models

import logging
from app import setup_logger
logger = logging.getLogger(__name__)
setup_logger(logger)
logger.setLevel(logging.INFO)

# Base = declarative_base()
# Base.query = db.session.query_property()


class User(db.Model, UserMixin):

    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), index=True, unique=True)
    nickname = db.Column(db.String(64), index=True, unique=True)
    username = db.Column(db.String(64), index=True, unique=True)
    openid = db.Column(db.String(64), index=True, unique=True)
    hidden_info_pref = db.Column(db.Boolean, default=False)

    def is_guest(self):
        if self.email == 'guest@guest.com':
            return True
        else:
            return False

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        try:
            return unicode(self.id)  # python 2
        except NameError:
            return str(self.id)  # python 3

    def __repr__(self):
        return '<User {0}>'.format(self.email)


class UserSocialAuth(db.Model, SQLAlchemyUserMixin):
        """Social Auth association model"""
        uid = db.Column(db.String(255))
        user_id = db.Column(db.Integer, db.ForeignKey("user.id"),
                            nullable=False, index=True)
        user = db.relationship(User, backref=db.backref('social_auth',
                                                          lazy='dynamic'))

        @classmethod
        def username_max_length(cls):
            return User.__table__.columns.get('username').type.length

        @classmethod
        def user_model(cls):
            return User


class Nonce(db.Model, SQLAlchemyNonceMixin):
    """One use numbers"""
    pass


class Association(db.Model, SQLAlchemyAssociationMixin):
    """OpenId account association"""
    pass


class Code(db.Model, SQLAlchemyCodeMixin):
    pass


class CurrentRates(db.Model):

    __tablename__ = 'current_rates'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    type = db.Column(db.String(64), unique=False)
    amount = db.Column(db.Integer, default=0)

    def __init__(self, rate_type, amount, user_id):
        self.type = rate_type
        self.amount = amount
        self.user_id = user_id

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
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))

    def __init__(self, day, user_id):

        self.day = day
        self.user_id = user_id

        current_rate = db.session.query(CurrentRates).filter(CurrentRates.type == 'daily').first().amount
        self.credits = current_rate

        prev_day = day - timedelta(days=1)
        logger.info(prev_day)
        logger.info(current_rate)
        prev_balance = db.session.query(DailyHistory).filter(DailyHistory.day == func.DATE(prev_day)).first()

        if prev_balance is None:
            #then this is our first day ever!
            self.balance = 0
        else:
            prev_balance = prev_balance.balance
            self.balance = prev_balance

        logger.info(prev_balance)

        self.balance += current_rate

    def update_day(self, amount):
        """update values for summary on day of transaction"""

        if amount >= 0:
            self.debits += amount
            self.balance -= amount
        else:
            self.credits += amount
            self.balance += amount

    def update_historical_days(self, amount):
        """update all days' balance after historical transaction"""
        if amount >= 0:
            self.balance -= amount
        else:
            self.balance += amount


class TransactionHistory(db.Model):

    __tablename__ = 'transaction_history'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.TIMESTAMP)
    amount = db.Column(db.Integer, default=0)
    purchase_type = db.Column(db.String(64), default=None)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))

    def __init__(self, user_id, amount, transaction_timestamp, purchase_type=None):
        self.user_id = user_id
        self.amount = amount
        self.timestamp = transaction_timestamp
        self.purchase_type = purchase_type


class FlaskStorage(BaseSQLAlchemyStorage):
    user = None
    nonce = None
    association = None
    code = None



# Set the references in the storage class
FlaskStorage.user = UserSocialAuth
FlaskStorage.nonce = Nonce
FlaskStorage.association = Association
FlaskStorage.code = Code


