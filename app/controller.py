from __future__ import print_function
from app import db
from app.models import CurrentRates, TransactionHistory, DailyHistory
from sqlalchemy import func, cast, DATE
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


def execute_transaction(amount, purchase_type, date=None):

    # transaction needs to take in a date param optionally, and modify model defaults.

    print(type(date), type(datetime.today()), datetime.today())

    # okay, so execute now gets a date in the form of a day.
    if datetime.today().date() == date.date():
        timestamp = datetime.now()
    else:
        timestamp = date

    print('received transaction for timestamp: {0}'.format(timestamp))

    # insert a transaction & update balance.
    #This should include adding system time when button was pressed, which can then be gathered for Daily View

    new_transaction = TransactionHistory(amount, timestamp, purchase_type)
    print('new transaction created: {0}, {1}'.format(new_transaction.amount, new_transaction.timestamp))

    # print('dying now....')
    # return True

    db.session.add(new_transaction)
    db.session.commit()

    # this will need to change if the day is not today...
    update_daily_history(new_transaction, start_date=timestamp.date())

    current_rates = get_current_rates()
    current_rates['balance'] -= amount  # at this point, all transactions are debits.
    update_rates(current_rates)


def get_recent_transactions(start=None, end=None):

    """get all recent transactions"""

    recent_transactions = db.session.query(TransactionHistory)

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


def generate_summary_on_transactions(transaction_list):
    pay_rate = 30
    start_date = transaction_list[-1]["timestamp"]
    end_date = transaction_list[0]["timestamp"]

    print(start_date, end_date)

    return transaction_list


def get_filtered_summary(filter_list):
    """recreate a daily summary with certain transactions filtered out."""

    #ORMify this:
# select * from daily_history d
# left outer join (select date(timestamp) as transaction_day, purchase_type, sum(amount)
# from transaction_history
# where purchase_type in ('Booze', 'Smokes')
# group by date(timestamp), purchase_type) t on d.day = t.transaction_day order by day desc, purchase_type;

    # get all transactions in filter list
    transaction_subquery = db.session.query(func.DATE(TransactionHistory.timestamp).label('transaction_day'),
                                            TransactionHistory.purchase_type,
                                            func.sum(TransactionHistory.amount).label('amount'))

    transaction_subquery = transaction_subquery.filter(TransactionHistory.purchase_type.in_(filter_list))

    transaction_subquery = transaction_subquery.group_by(func.DATE(TransactionHistory.timestamp))
    transaction_subquery = transaction_subquery.group_by(TransactionHistory.purchase_type).subquery()

    full_query = db.session.query(DailyHistory.day, DailyHistory.credits, transaction_subquery)
    full_query = full_query.outerjoin(transaction_subquery, DailyHistory.day == transaction_subquery.c.transaction_day)

    full_query = full_query.order_by(DailyHistory.day).order_by(transaction_subquery.c.transaction_day)

    result = full_query.all()

    # The following wonky code will transpose our row-wise data into a more usable column-wise format based on filters
        #Output Data Model:
    #datum = {day: date, cat1: amount1, cat2: amount2, total: amount1 + amount2, balance: prev_bal - total}

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

    return transformed_data


def get_daily_summary(start_date=None, end_date=None):
    """retrieve a full summary of all days"""

    daily_summary = db.session.query(DailyHistory)

    if start_date and end_date:
        daily_summary = daily_summary.filter(DailyHistory.day >= start_date, DailyHistory.day <= end_date)

    daily_summary = daily_summary.order_by(DailyHistory.day.desc()).all()

    for e in daily_summary:
        print(e)

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
    print(get_filtered_summary(['Booze', 'Smokes', 'Cab', 'Dinning Out', 'Groceries', 'Coffee', 'Bar']))


    # transaction = TransactionHistory(10, 'Booze')
    # print(func.DATE(transaction.timestamp).execute())





    # t_list = db.session.query(TransactionHistory).order_by(TransactionHistory.timestamp.desc()).all()
    # for t in t_list:
    #     update_daily_history(t)