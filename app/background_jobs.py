from __future__ import print_function
from controller import get_current_rates, update_rates


def daily_increase():
    current_rates = get_current_rates()
    daily_rate = current_rates.get('daily', False)

    if daily_rate:
        current_rates['balance'] += daily_rate
        update_rates(current_rates)


def _set_direct_balance(amt):
    current_rates = get_current_rates()
    current_rates['balance'] = amt
    update_rates(current_rates)


if __name__ == "__main__":
    daily_increase()
    # _set_direct_balance(30)