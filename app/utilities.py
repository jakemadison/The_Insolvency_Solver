from __future__ import print_function
from datetime import datetime
from app import basedir
import logging
from app import setup_logger
logger = logging.getLogger(__name__)
setup_logger(logger)
logger.setLevel(logging.INFO)


def get_recent_commit():

    try:
        with open(basedir+'/.git/logs/HEAD', 'rb') as h_file:
            current_line = None
            for line in h_file:
                if ' commit ' in line:
                    current_line = line.strip()

        current_line = current_line.split(' ')
        date = current_line[5]

        translated_date = datetime.fromtimestamp(int(date)).strftime('%Y-%m-%d %H:%M:%S')

    except Exception, e:
        logger.error(e)
        translated_date = 'unknown'

    return translated_date

if __name__ == "__main__":
    print(get_recent_commit())