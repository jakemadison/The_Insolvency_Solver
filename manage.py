from app import db
from social.apps.flask_app.default import models as social_models


def main():
    # db.create_all()

    print social_models.FlaskStorage




# User.Base.metadata.create_all(engine)
# models.PSABase.metadata.create_all(engine)

if __name__ == '__main__':
    main()