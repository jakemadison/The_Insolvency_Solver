from __future__ import print_function
from datetime import datetime
from app.models import TransactionHistory, DailyHistory, User
from controller import update_daily_history
from rates_controller import update_rates, get_current_rates
from app import db
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

import logging
from app import setup_logger
logger = logging.getLogger(__name__)
setup_logger(logger)
logger.setLevel(logging.INFO)


def recreate_daily_history(user):

    """at a small cost to performance, we can generalize transaction edits -> daily history updates
    by pulling the entire transaction history for the user, and recreating the daily history...
    use: first date in daily history (in case there were no transactions on the first day), iterate
    until the present day using 'credits' section of daily history for our rate (in case rate changed at some point)
    and update daily history balance."""

    pass


def execute_transaction(user, amount, purchase_type, date=None):

    # transaction needs to take in a date param optionally, and modify model defaults.

    logger.info("{0}, {1}, {2}".format(type(date), type(datetime.today()), datetime.today()))

    # okay, so execute now gets a date in the form of a day.
    if datetime.today().date() == date.date():
        timestamp = datetime.now()
    else:
        timestamp = date

    logger.info('received transaction for timestamp: {0}'.format(timestamp))

    # insert a transaction & update balance.
    # This should include adding system time when button was pressed, which can then be gathered for Daily View

    new_transaction = TransactionHistory(user.id, amount, timestamp, purchase_type)
    logger.info('new transaction created: {0}, {1}'.format(new_transaction.amount, new_transaction.timestamp))

    try:
        db.session.add(new_transaction)
        db.session.commit()

    except SQLAlchemyError, e:
        logger.error('sql error executing transaction: {0}'.format(e))
        db.session.rollback()

    # this will need to change if the day is not today...
    update_daily_history(user, new_transaction, start_date=timestamp.date())

    current_rates = get_current_rates(user)
    current_rates['balance'] -= amount  # at this point, all transactions are debits.
    update_rates(user, current_rates)


def get_recent_transactions(user, start=None, end=None):

    """get all recent transactions"""

    recent_transactions = db.session.query(TransactionHistory).filter(TransactionHistory.user_id == user.id)

    if start and end:

        recent_transactions = recent_transactions.filter(TransactionHistory.timestamp >= start,
                                                         TransactionHistory.timestamp <= end)

    recent_transactions = recent_transactions.order_by(TransactionHistory.timestamp.desc()).all()

    transaction_list = []
    for e in recent_transactions:
        transaction = {"id": e.id,
                       # "timestamp": e.timestamp.strftime("%b %d %Y: %I:%M:%S %p"),
                       "timestamp": e.timestamp.strftime("%d/%m/%Y"),
                       "amount": str(e.amount),
                       "purchase_type": e.purchase_type}
        transaction_list.append(transaction)

    return transaction_list


def get_sum_category_per_day():

    recent_transactions = db.session.query(func.sum(TransactionHistory.amount).label('amount'),
                                           func.DATE(TransactionHistory.timestamp).label('day'),
                                           TransactionHistory.purchase_type)

    recent_transactions = recent_transactions.group_by(func.DATE(TransactionHistory.timestamp))
    recent_transactions = recent_transactions.order_by(TransactionHistory.timestamp.desc())

    sum_transactions = []

    for row in recent_transactions.all():
        day_record = {'day': str(row.day), 'purchase_type': str(row.purchase_type), 'amount': row.amount}
        sum_transactions.append(day_record)

    return sum_transactions


def get_filtered_summary(user, filter_list):
    """recreate a daily summary with certain transactions filtered out."""

    # ORM-ify this:
# select * from daily_history d
# left outer join (select date(timestamp) as transaction_day, purchase_type, sum(amount)
# from transaction_history
# where purchase_type in ('Booze', 'Smokes')
# group by date(timestamp), purchase_type) t on d.day = t.transaction_day order by day desc, purchase_type;

    # get all transactions in filter list
    transaction_subquery = db.session.query(func.DATE(TransactionHistory.timestamp).label('transaction_day'),
                                            TransactionHistory.purchase_type,
                                            func.sum(TransactionHistory.amount).label('amount'))

    transaction_subquery = transaction_subquery.filter(TransactionHistory.user_id == user.id)

    if len(filter_list) > 0:
        transaction_subquery = transaction_subquery.filter(TransactionHistory.purchase_type.in_(filter_list))

    transaction_subquery = transaction_subquery.group_by(func.DATE(TransactionHistory.timestamp))

    # print('subquery results: ')
    # for x in transaction_subquery.all():
    #     print(x)

    # transaction subquery brings up the correct results, for sure, summed as we would expect.

    transaction_subquery = transaction_subquery.group_by(TransactionHistory.purchase_type).subquery()

    full_query = db.session.query(DailyHistory.day, DailyHistory.credits,
                                  transaction_subquery).filter(DailyHistory.user_id == user.id)

    full_query = full_query.outerjoin(transaction_subquery,
                                      DailyHistory.day == transaction_subquery.c.transaction_day)

    full_query = full_query.order_by(DailyHistory.day).order_by(transaction_subquery.c.transaction_day)

    # full_query = db.session.query(DailyHistory.day, DailyHistory.credits, transaction_subquery)
    # full_query = full_query.filter(DailyHistory.user_id == user.id)  # this might break things...
    # full_query = full_query.filter(DailyHistory.user_id == user.id, TransactionHistory.user_id == user.id)

    result = full_query.all()

    # The following wonky code will transpose our row-wise data into a
    # more usable column-wise format based on filters

    #  Output Data Model:
    # datum = {day: date, cat1: amount1, cat2: amount2, total: amount1 + amount2, balance: prev_bal - total}

    transformed_data = []
    prev_balance = result[0][1]

    datum = {'day': result[0][0], 'balance': prev_balance, 'total': 0}
    for f in filter_list:
        datum[f] = 0

    for x in result:
        if x[0] == datum['day']:
            if x[4]:
                datum[x[3]] = x[4]
                datum['total'] += x[4]
                datum['balance'] -= x[4]

        else:
            prev_bal = datum['balance']  # carry our prev balance forward
            transformed_data.append(datum)  # add record to our stack and start a new one

            datum = {'balance': prev_bal + x[1], 'total': 0, 'day': x[0]}  # init a new record
            for f in filter_list:
                datum[f] = 0

            if x[4]:  # populate that record with the current data
                datum[x[3]] = x[4]
                datum['total'] += x[4]
                datum['balance'] -= x[4]

    transformed_data.append(datum)  # add our final record

    for x in transformed_data:
        x['day'] = x['day'].strftime("%d/%m")

    for each in transformed_data:
        logger.debug(each)

    return transformed_data


if __name__ == "__main__":
    u = db.session.query(User).filter(User.id == 3).first()
    fs = get_filtered_summary(u, ["Test", "Food"])
    logger.info(fs)