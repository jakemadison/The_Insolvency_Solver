import logging
import app


def setup_logger(logger_instance):

    if logger_instance.handlers:  # prevents the loading of duplicate handlers/log output
        return

    formatter = logging.Formatter('(%(asctime)s: %(name)s: %(levelname)s): %(message)s')

    if True:
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        logger_instance.addHandler(ch)
    else:
        ch = logging.FileHandler('./insolvency_logger.log')
        ch.setLevel(logging.INFO)
        ch.setFormatter(formatter)
        app.logger.addHandler(ch)


def get_logger():
    logger = logging.getLogger(__name__)
    setup_logger(logger)
    logger.setLevel(logging.INFO)
    return logger