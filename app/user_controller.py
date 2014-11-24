from __future__ import print_function
from app.models import User, CurrentRates, DailyHistory
from app import db
from datetime import datetime
from sqlalchemy import exc

import logging
from app import setup_logger
logger = logging.getLogger(__name__)
setup_logger(logger)
logger.setLevel(logging.INFO)


def get_all_users():
    users = db.session.query(User).all()
    return users


def add_user(resp):

    logger.info('new user found! {0}'.format(resp))
    # some auths contain a nick, some don't, use first portion of email if not
    nickname = resp.nickname
    if nickname is None or nickname == "":
        nickname = resp.email.split('@')[0]

    # Add a new user to the user table:
    user = User(nickname=nickname, email=resp.email)

    try:

        db.session.add(user)
        db.session.commit()

        # Add a line in rates table for our new user:
        current_rates_init = [('rent', 500, user.id), ('bills', 500, user.id), ('balance', 30, user.id),
                              ('daily', 30, user.id), ('income_per_month', 2000, user.id),
                              ('other_costs', 0, user.id), ('savings_per_month', 1000, user.id)]

        for each_rate in current_rates_init:
            db.session.add(CurrentRates(each_rate[0], each_rate[1], each_rate[2]))

        db.session.commit()

        # add a line in Daily History for new user:
        db.session.add(DailyHistory(datetime.now(), user.id))
        db.session.commit()

    except exc.SQLAlchemyError, e:
        logger.error('sql error! : {0}'.format(e))
        db.session.rollback()
        return False

    else:
        return True


def change_info_view(user, show_or_hide):

    try:
        qry = db.session.query(User).filter_by(id=user.id)
        qry.update({"hidden_info_pref": show_or_hide})

    except exc.SQLAlchemyError, e:
        logger.error('shit went wonky: {0}'.format(e))
        db.session.rollback()
        return False

    else:
        db.session.commit()


def update_user_nickname(user, nickname):
    try:
        qry = db.session.quer(User).filter_by(id=user.id)
        qry.update({"nickname": nickname})
        db.session.commit()

    except exc.SQLAlchemyError, e:
        logger.error('shit went wonky: {0}'.format(e))
        return False

    else:
        return True


if __name__ == "__main__":
    user_list = get_all_users()
    for u in user_list:
        logger.info(u)