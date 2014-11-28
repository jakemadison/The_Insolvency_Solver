from __future__ import print_function
from datetime import datetime
from app import basedir
from subprocess import check_output, STDOUT
import logging
from app import setup_logger
logger = logging.getLogger(__name__)
setup_logger(logger)
logger.setLevel(logging.INFO)


def execute_git_log():

    """run git log and parse it to get our most recent commit and display it"""

    try:
        history = check_output(["git", "--git-dir", basedir + '/.git', "log", "--no-merges"], stderr=STDOUT)

        history = history.split("\n")[0:6]

        commit = {"commit": history[0],
                  "author": history[1],
                  "date": history[2],
                  "message": history[4].strip()}

    except Exception, e:
        logger.error("there was an error! {0}".format(e))
        commit = {"commit": "unknown",
                  "author": "unknown",
                  "date": "unknown",
                  "message": "unknown"}

        try:
            out = check_output(["git", "--git-dir", basedir + '/.git', "status"], stderr=STDOUT)
            logger.info("this was out: {0}".format(out))

        except Exception, e:
            logger.error("there was another error! {0}".format(e))

    return commit


if __name__ == "__main__":
    message = execute_git_log()
    print(message)