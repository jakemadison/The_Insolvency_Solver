from __future__ import print_function
from app import db
from app.models import CurrentRates, TransactionHistory, DailyHistory, User
from sqlalchemy import func, cast, DATE, update
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


def update_daily_history(transaction, start_date):
    # discover if we already have a day record.  If we do, update that one =+ transaction
    # if we do not, then add a new one.  Should be able to use this to populate existing records
    # transaction = TransactionHistory(10, 'Booze')

    existing_days = get_day_rows(start_date)

    for day in existing_days:

        print('updating existing row: {0}'.format(day.day))

        if day.day == start_date:
            day.update_day(transaction.amount)
        else:
            day.update_historical_days(transaction.amount)

        db.session.commit()

    return True


def get_daily_summary(start_date=None, end_date=None):
    """retrieve a full summary of all days"""

    daily_summary = db.session.query(DailyHistory)

    if start_date and end_date:
        daily_summary = daily_summary.filter(DailyHistory.day >= start_date, DailyHistory.day <= end_date)

    daily_summary = daily_summary.order_by(DailyHistory.day.desc()).all()

    # for e in daily_summary:
    #     print(e)

    daily_list = []
    for d in daily_summary:
        # day = {"id": d.id, "date": d.day.strftime("%b %d %Y"),
        day = {"id": d.id, "date": d.day.strftime("%a %d"),
               "credits": d.credits, "debits": d.debits, "balance": d.balance}
        daily_list.append(day)

    return daily_list


def get_day_rows(start_date):
    """return all day rows >= dates"""
    day_rows = db.session.query(DailyHistory).filter(DailyHistory.day >= start_date).all()
    return day_rows


def insert_new_day(date=None):
    """insert a new day row at specified date"""

    if date is None:
        date = datetime.now()  # this might need to be .date() as well..

    new_day = DailyHistory(date)
    db.session.add(new_day)
    db.session.commit()
    print('created new row for day: {0}'.format(new_day))


if __name__ == "__main__":
    # rates = get_current_rates()
    # update_rates(rates)
    # execute_transaction(13)
    # print(get_filtered_summary(['Booze', 'Smokes', 'Cab', 'Dinning Out', 'Groceries', 'Coffee', 'Bar']))
    pass

    # transaction = TransactionHistory(10, 'Booze')
    # print(func.DATE(transaction.timestamp).execute())

    # t_list = db.session.query(TransactionHistory).order_by(TransactionHistory.timestamp.desc()).all()
    # for t in t_list:
    #     update_daily_history(t)

