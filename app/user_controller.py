from models import User
from app import db


def add_user(resp):

    # some auths contain a nick, some don't, use first portion of email if not
    nickname = resp.nickname
    if nickname is None or nickname == "":
        nickname = resp.email.split('@')[0]

    user = User(nickname=nickname, email=resp.email)
    db.session.add(user)
    db.session.commit()


def change_info_view(user, show_or_hide):
    qry = db.session.query(User).filter_by(id=user.id)
    qry.update({"hidden_info_pref": show_or_hide})
    db.session.commit()