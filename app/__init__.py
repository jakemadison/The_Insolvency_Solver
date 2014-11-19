from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
import os
from flask.ext.login import LoginManager
from flask.ext.openid import OpenID
from config import basedir
import logging


def setup_logger(logger_instance):

    if logger.handlers:  # prevents the loading of duplicate handlers/log output
        return

    formatter = logging.Formatter('(%(asctime)s: %(name)s: %(levelname)s): %(message)s')

    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    logger_instance.addHandler(ch)

    ch = logging.FileHandler(basedir+'/insolvency_logger.log')
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)


logger = logging.getLogger(__name__)
setup_logger(logger)
logger.setLevel(logging.DEBUG)
logger.info('completed logger config. beginning to load application.')

app = Flask(__name__)
app.config.from_object('config')

db = SQLAlchemy(app)


lm = LoginManager()
lm.init_app(app)
oid = OpenID(app, os.path.join(basedir, 'tmp'))


from app import views, models