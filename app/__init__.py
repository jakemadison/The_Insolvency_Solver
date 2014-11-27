from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
import os
from flask.ext.login import LoginManager
from flask.ext.openid import OpenID
from config import basedir
import logging
from flask.ext.security import Security, SQLAlchemyUserDatastore
from flask.ext.social import Social, SQLAlchemyConnectionDatastore, login_failed


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


try:
    from local_settings import LOCAL_SECRET_KEY, FACEBOOK_APP_ID, FACEBOOK_APP_SEC
    app.config['SECRET_KEY'] = LOCAL_SECRET_KEY
    app.config['SOCIAL_FACEBOOK'] = {'consumer_key': FACEBOOK_APP_ID, 'consumer_secret': FACEBOOK_APP_SEC}

except ImportError, e:
    logger.error('local settings was unavailable.  FB login won"t work: {0}'.format(e))

db = SQLAlchemy(app)


lm = LoginManager()
lm.init_app(app)
oid = OpenID(app, os.path.join(basedir, 'tmp'))

from app import views, models


# init social and security:
security_ds = SQLAlchemyUserDatastore(db, models.User, models.Role)
social_ds = SQLAlchemyConnectionDatastore(db, models.Connection)
app.security = Security(app, security_ds)
app.social = Social(app, social_ds)



