from __future__ import print_function
from app import db
from app.models import CurrentRates, TransactionHistory


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


def calculate_relative_rates(new_rates_dict):
    pass


def execute_transaction(amount):

    # insert a transaction & update balance.
    #This should include adding system time when button was pressed, which can then be gathered for Daily View

    new_transaction = TransactionHistory(amount)
    db.session.add(new_transaction)
    db.session.commit()

    current_rates = get_current_rates()
    current_rates['balance'] -= amount  # at this point, all transactions are debits.
    update_rates(current_rates)


def get_recent_transactions():

    recent_transactions = db.session.query(TransactionHistory).order_by(TransactionHistory.timestamp.desc()).all()

    transaction_list = []
    for e in recent_transactions:
        transaction = {"id": e.id,
                       "timestamp": e.timestamp.strftime("%d-%m-%Y %H:%M:%S"),
                       "amount": '$'+str(e.amount)+'.00'}
        transaction_list.append(transaction)

    return transaction_list


if __name__ == "__main__":
    # rates = get_current_rates()
    # update_rates(rates)
    # execute_transaction(13)
    get_recent_transactions()