from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
import app as a
import os
from flask.ext.login import LoginManager
from flask.ext.openid import OpenID
from config import basedir
import logging

from logger_controller import get_logger
logger = get_logger()

logger.info('completed logger config. beginning to load application.')

app = Flask(__name__)
app.config.from_object('config')

db = SQLAlchemy(app)


lm = LoginManager()
lm.init_app(app)
oid = OpenID(app, os.path.join(basedir, 'tmp'))


from app import views, models