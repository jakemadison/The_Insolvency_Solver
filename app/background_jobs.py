from __future__ import print_function
from user_controller import get_all_users
from controller import get_day_rows, insert_new_day
from rates_controller import get_current_rates, update_rates
from datetime import datetime


def daily_increase(user):
    current_rates = get_current_rates(user)
    daily_rate = current_rates.get('daily', False)

    if daily_rate:
        current_rates['balance'] += daily_rate
        update_rates(user, current_rates)


def create_new_day(user):
    # check for the existence of a day row as a precaution.  If it doesn't exist, create a new row
    today = datetime.now().date()
    existing = get_day_rows(today)

    print('check for existence of day revealed: {0}'.format(existing))

    if not existing:
        print('no existing record found.  Inserting a new day.')
        insert_new_day(user, today)
        return True

    else:
        return False


def _set_direct_balance(amt, user):
    current_rates = get_current_rates(user)
    current_rates['balance'] = amt
    update_rates(user, current_rates)


if __name__ == "__main__":

    users = get_all_users()

    for u in users:
        # increase current rates:
        daily_increase(u)

        # insert a new day row in daily summary:
        create_new_day(u)
