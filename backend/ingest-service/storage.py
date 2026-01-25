"""
Server Guard - Ingest Service Storage
Lightweight thread-safe JSON storage for server telemetry logs.
"""

import json
import os
from datetime import datetime
from typing import List, Optional
from pathlib import Path
from threading import Lock

# Storage configuration
STORAGE_DIR = Path(__file__).parent / "data"
EVENTS_FILE = STORAGE_DIR / "server_events.json"

# Thread-safe lock for file operations
_file_lock = Lock()

def init_storage() -> None:
    """Initialize storage directory and file"""
    STORAGE_DIR.mkdir(exist_ok=True)

    if not EVENTS_FILE.exists():
        with open(EVENTS_FILE, 'w') as f:
            json.dump([], f)

def save_telemetry(event: dict) -> bool:
    """
    Store a single telemetry event (Log/Flow) to the JSON file.
    Keeps a rolling window of the last 1000 events to save disk space.
    """
    try:
        with _file_lock:
            # Read existing events
            events = []
            if EVENTS_FILE.exists():
                try:
                    with open(EVENTS_FILE, 'r') as f:
                        events = json.load(f)
                except (json.JSONDecodeError, FileNotFoundError):
                    events = []

            # Append new event
            events.append(event)

            # Keep only last 1000 events (Rolling buffer)
            if len(events) > 1000:
                events = events[-1000:]

            # Write back
            with open(EVENTS_FILE, 'w') as f:
                json.dump(events, f, indent=2, default=str)

            return True

    except Exception as e:
        print(f"❌ Storage error: {e}")
        return False

def get_recent_telemetry(limit: int = 50) -> List[dict]:
    """
    Get recent telemetry events for the Dashboard.
    Returns the newest events first (LIFO).
    """
    try:
        with _file_lock:
            if not EVENTS_FILE.exists():
                return []

            with open(EVENTS_FILE, 'r') as f:
                events = json.load(f)

            # Return newest first
            events.reverse()
            return events[:limit]

    except (json.JSONDecodeError, FileNotFoundError):
        return []

def get_event_count() -> int:
    """Return total number of events currently stored."""
    try:
        with _file_lock:
             if not EVENTS_FILE.exists():
                return 0
             with open(EVENTS_FILE, 'r') as f:
                 events = json.load(f)
             return len(events)
    except:
        return 0

def clear_storage() -> bool:
    """Clear all stored events (Useful for resetting the demo)"""
    try:
        with _file_lock:
            with open(EVENTS_FILE, 'w') as f:
                json.dump([], f)
            return True
    except Exception as e:
        print(f"❌ Clear error: {e}")
        return False

# Auto-initialize on import
init_storage()
