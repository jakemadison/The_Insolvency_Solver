from __future__ import print_function
from controller import get_current_rates, update_rates, get_day_rows, insert_new_day
from datetime import datetime


def daily_increase():
    current_rates = get_current_rates()
    daily_rate = current_rates.get('daily', False)

    if daily_rate:
        current_rates['balance'] += daily_rate
        update_rates(current_rates)


def create_new_day():
    # check for the existence of a day row as a precaution.  If it doesn't exist, create a new row
    today = datetime.now().date()
    existing = get_day_rows(today)

    print('check for existence of day revealed: {0}'.format(existing))

    if not existing:
        print('no existing record found.  Inserting a new day.')
        insert_new_day(today)
        return True

    else:
        return False


def _set_direct_balance(amt):
    current_rates = get_current_rates()
    current_rates['balance'] = amt
    update_rates(current_rates)


if __name__ == "__main__":

    # increase current rates:
    daily_increase()

    # insert a new day row in daily summary:
    create_new_day()
