from __future__ import print_function
from app import db
from app.models import DailyHistory
from datetime import datetime


def get_daily_summary(start_date=None, end_date=None):
    """retrieve a full summary of all days.  this is used by the views."""

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


def update_daily_history(user, transaction, start_date):
    """following a transaction, update our daily history values"""

    # discover if we already have a day record.  If we do, update that one =+ transaction
    # if we do not, then add a new one.  Should be able to use this to populate existing records
    # transaction = TransactionHistory(10, 'Booze')

    existing_days = db.session.query(DailyHistory).filter(DailyHistory.day >= start_date,
                                                          DailyHistory.user_id == user.id).all()

    for day in existing_days:

        print('updating existing row: {0}'.format(day.day))

        if day.day == start_date:
            day.update_day(transaction.amount)
        else:
            day.update_historical_days(transaction.amount)

        db.session.commit()

    return True


def get_day_rows(start_date):
    """return all day rows >= dates.  Used by creating a new day"""
    day_rows = db.session.query(DailyHistory).filter(DailyHistory.day >= start_date).all()
    return day_rows


def insert_new_day(user, date=None):
    """insert a new day row at specified date. Used for creating a new day"""

    if date is None:
        date = datetime.now()  # this might need to be .date() as well..

    new_day = DailyHistory(date, user.id)
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

