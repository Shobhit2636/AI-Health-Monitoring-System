import sys
import logging
from loguru import logger
from app.core.config import settings


class InterceptHandler(logging.Handler):
    """Route stdlib logging into loguru."""
    def emit(self, record: logging.LogRecord):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        frame, depth = sys._getframe(6), 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging():
    log_level = "DEBUG" if settings.ENVIRONMENT == "development" else "INFO"

    logger.remove()

    # Console
    logger.add(
        sys.stdout,
        level=log_level,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    )

    # File — rotating logs
    logger.add(
        "logs/health_app_{time:YYYY-MM-DD}.log",
        level="INFO",
        rotation="1 day",
        retention="30 days",
        compression="zip",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} - {message}",
    )

    # Error file
    logger.add(
        "logs/errors.log",
        level="ERROR",
        rotation="1 week",
        retention="90 days",
        compression="zip",
    )

    # Intercept stdlib loggers
    for name in ["uvicorn", "uvicorn.error", "uvicorn.access", "fastapi", "sqlalchemy"]:
        log = logging.getLogger(name)
        log.handlers = [InterceptHandler()]
        log.propagate = False

    logger.info(f"Logging setup complete (level={log_level}, env={settings.ENVIRONMENT})")
