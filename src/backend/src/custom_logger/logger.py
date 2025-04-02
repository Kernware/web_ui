import logging
from datetime import datetime

class CustomFormatter(logging.Formatter):
    def __init__(self, fmt=None, datefmt=None, style="%", prefix="ROOT"):
        super().__init__(fmt, datefmt, style)
        self.prefix = prefix

    def format(self, record):
        record.prefix = self.prefix
        record.asctime = datetime.now().strftime(self.datefmt)
        return super().format(record)


def create_logger(
    logger_name: str,
    prefix: str,
    loglevel: int = logging.DEBUG
) -> logging.Logger:

    # if the logger already exists we can just return it, adding another handler
    # would lead to double messages
    if logger_name in logging.Logger.manager.loggerDict:
        return logging.getLogger(logger_name)

    # create new logger
    fmt = f'%(prefix)s | %(levelname)-7s | %(asctime)s.%(msecs)03d | %(message)s'
    formatter = CustomFormatter(
        fmt=fmt,
        datefmt="%Y-%m-%d %H:%M:%S",
        prefix=prefix,
    )

    logger = logging.getLogger(logger_name)
    logger.propagate = False

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    logger.setLevel(loglevel)
    return logger
