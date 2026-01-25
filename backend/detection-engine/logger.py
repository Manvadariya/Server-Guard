"""
ServerGuard - Structured Logging Module
Provides industry-standard JSON logging configuration.
"""

import logging
import json
import sys
import datetime
from typing import Any, Dict

class JSONFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings for logging.
    Ideal for ingestion by Splunk, Datadog, ELK stack, etc.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        # Merge extra fields if they exist (passed via extra=...)
        if hasattr(record, "extra_fields"):
            log_record.update(record.extra_fields)

        return json.dumps(log_record)

def setup_logger(name: str) -> logging.Logger:
    """
    Configures a logger with JSON formatting and stdout handler.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers if function is called multiple times
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    return logger

# Global logger instance
logger = setup_logger("detection_engine")
