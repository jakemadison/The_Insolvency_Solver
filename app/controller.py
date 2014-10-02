from __future__ import print_function
from app import db
from app.models import CurrentRates


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

if __name__ == "__main__":
    rates = get_current_rates()
    update_rates(rates)
