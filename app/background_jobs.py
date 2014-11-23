from __future__ import print_function
from user_controller import get_all_users
from controller import get_day_rows, insert_new_day, get_days_missing
from rates_controller import get_current_rates, update_rates
from datetime import datetime, timedelta

import logging
from app import setup_logger
logger = logging.getLogger(__name__)
setup_logger(logger)
logger.setLevel(logging.INFO)


def daily_increase(user):
    current_rates = get_current_rates(user)
    daily_rate = current_rates.get('daily', False)

    if daily_rate:
        current_rates['balance'] += daily_rate
        update_rates(user, current_rates)


def create_new_day(user):
    # check for the existence of a day row as a precaution.  If it doesn't exist, create a new row
    today = datetime.now().date()
    existing = get_day_rows(user, today)

    logger.info('check for existence of day revealed: {0}'.format(existing))

    if not existing:
        logger.info('no existing record found.  finding days missing...')

        most_recent_day = get_days_missing(user)[0]

        number_of_missing_days = today - most_recent_day
        number_of_missing_days = number_of_missing_days.days

        print('most recent day: {0}, '
              'no missing days: {1}'.format(most_recent_day,
                                            number_of_missing_days))

        for each_date in range(number_of_missing_days):

            current_date = most_recent_day + timedelta(days=each_date+1)

            print('current date number: {0}, date: {1}'.format(each_date, current_date))

            # insert_new_day(user, today)
            insert_new_day(user, current_date)

        return True
    else:
        return False


def backfill_missing_days(user):
    pass


def _set_direct_balance(amt, user):
    current_rates = get_current_rates(user)
    current_rates['balance'] = amt
    update_rates(user, current_rates)


if __name__ == "__main__":

    users = get_all_users()

    for u in users:

        logger.info('increasing daily amounts for user: {0}'.format(u))
        # increase current rates:
        daily_increase(u)

        logger.info('creating new day row for user: {0}'.format(u))
        # insert a new day row in daily summary:
        create_new_day(u)
        logger.info('------')
        # break
