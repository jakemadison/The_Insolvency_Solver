from __future__ import print_function
from app import db
from app.models import CurrentRates, TransactionHistory, DailyHistory
from sqlalchemy import func
from datetime import datetime


def get_current_rates():

    current_rates = db.session.query(CurrentRates).all()

    rates_dict = {str(e.type): e.amount for e in current_rates}

    return rates_dict


def update_rates(new_rates_dict):

    for col_type, value in new_rates_dict.iteritems():

        print('updating {0} with {1}'.format(col_type, value))
        active_row = db.session.query(CurrentRates).filter(CurrentRates.type == col_type)
        active_row.update({CurrentRates.amount: value})
        db.session.commit()
        db.session.flush()

        cr = get_current_rates()
        print('current values should be: {0}'.format(cr))

    return True


def update_daily_history(transaction):
    # discover if we already have a day record.  If we do, update that one =+ transaction
    # if we do not, then add a new one.  Should be able to use this to populate existing records
    # transaction = TransactionHistory(10, 'Booze')

    existing_day = get_day_row(func.DATE(transaction.timestamp))

    if not existing_day:
        print('inserting new row for day')
        insert_new_day(func.DATE(transaction.timestamp))
        return True

    else:
        print('updating existing row')
        existing_day.update_day(transaction.amount)
        db.session.commit()
        return True


def execute_transaction(amount, purchase_type, timestamp=None):

    # transaction needs to take in a date param optionally, and modify model defaults.

    print('received transaction for timestamp: {0}'.format(timestamp))

    # insert a transaction & update balance.
    #This should include adding system time when button was pressed, which can then be gathered for Daily View

    new_transaction = TransactionHistory(amount, purchase_type)
    db.session.add(new_transaction)
    db.session.commit()

    update_daily_history(new_transaction)

    current_rates = get_current_rates()
    current_rates['balance'] -= amount  # at this point, all transactions are debits.
    update_rates(current_rates)


def get_recent_transactions():

    """get all recent transactions"""

    recent_transactions = db.session.query(TransactionHistory).order_by(TransactionHistory.timestamp.desc()).all()

    transaction_list = []
    for e in recent_transactions:
        transaction = {"id": e.id,
                       "timestamp": e.timestamp.strftime("%b %d %Y: %I:%M:%S %p"),
                       "amount": '$'+str(e.amount)+'.00',
                       "purchase_type": e.purchase_type}
        transaction_list.append(transaction)

    return transaction_list


def get_daily_summary():
    """retrieve a full summary of all days"""

    daily_summary = db.session.query(DailyHistory).order_by(DailyHistory.day.desc()).all()

    daily_list = []
    for d in daily_summary:
        day = {"id": d.id, "date": d.day.strftime("%b %d %Y"),
               "credits": d.credits, "debits": d.debits, "balance": d.balance}
        daily_list.append(day)

    return daily_list


def get_day_row(date):
    """check for the existence of a day row for date"""
    day_row = db.session.query(DailyHistory).filter(DailyHistory.day == date).first()
    return day_row


def insert_new_day(date=None):
    """insert a new day row at specified date"""

    if date is None:
        date = datetime.now()

    new_day = DailyHistory(date)
    db.session.add(new_day)
    db.session.commit()
    print('created new row for day: {0}'.format(new_day))


if __name__ == "__main__":
    # rates = get_current_rates()
    # update_rates(rates)
    # execute_transaction(13)
    # print(get_recent_transactions())

    transaction = TransactionHistory(10, 'Booze')
    print(func.DATE(transaction.timestamp).execute())





    # t_list = db.session.query(TransactionHistory).order_by(TransactionHistory.timestamp.desc()).all()
    # for t in t_list:
    #     update_daily_history(t)