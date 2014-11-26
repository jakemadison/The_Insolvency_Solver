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


try:
    from local_settings import LOCAL_SECRET_KEY
    app.config['SECRET_KEY'] = LOCAL_SECRET_KEY

except ImportError, e:
    pass


from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker


# Attempting to set up engine here:

db = SQLAlchemy(app)
engine = db.engine
db_session = db.session

lm = LoginManager()
lm.init_app(app)
oid = OpenID(app, os.path.join(basedir, 'tmp'))

from app import views, models

# register social blueprint:
from social.apps.flask_app.routes import social_auth

app.register_blueprint(social_auth)


# failing here;
try:
    # from social.apps.flask_app.default.models import init_social
    from social.apps.flask_app.template_filters import backends
    app.context_processor(backends)
    # init_social(app, db)

    # from app.models import User
    # from social.apps.flask_app.default import models as social_models

    # User.Base.metadata.create_all(engine)  # create all tables using metadata
    # social_models.PSABase.metadata.create_all(engine)

except KeyError, e:
    logger.error('key error again: {0}'.format(e))



