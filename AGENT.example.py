"""
SysMon Agent — production-grade system metrics reporter.
Single file, no frameworks, fully compatible with /ingest endpoint.
"""

import os
import sys
import time
import socket
import signal
import platform
import psutil
import requests
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────
load_dotenv()

SERVER_URL = os.getenv("SERVER_URL", "http://localhost:8000/ingest")
if not SERVER_URL:
    raise ValueError("SERVER_URL is not set")

POLL_INTERVAL   = float(os.getenv("POLL_INTERVAL", "0.2"))   # seconds between sends
BACKOFF_BASE    = 1.0    # initial retry delay (seconds)
BACKOFF_MAX     = 30.0   # cap on retry delay
BACKOFF_FACTOR  = 2.0    # multiplier per failure
REQUEST_TIMEOUT = 5      # seconds

# ── Static metadata (collected once at startup) ────────
HOST_NAME  = socket.gethostname()
IP_ADDRESS = socket.gethostbyname(HOST_NAME)
OS_NAME    = platform.system()          # e.g. "Linux", "Windows", "Darwin"
OS_VERSION = platform.release()         # e.g. "6.1.0-21-amd64"

# ── Session ───────────────────────────────────────────
session = requests.Session()
session.headers.update({"Content-Type": "application/json"})

# ── State ─────────────────────────────────────────────
_retry_delay = BACKOFF_BASE   # current backoff delay; reset on success

# ── Shutdown handler ──────────────────────────────────
def _shutdown(sig, frame):
    """Send a disconnect signal then exit cleanly."""
    print("\n👋 Shutting down — notifying server…")
    disconnect_url = SERVER_URL.replace("/api/ingest", "/api/disconnect")
    try:
        requests.post(
            disconnect_url,
            json={"host": HOST_NAME},
            timeout=2,
        )
        print("✅ Disconnect signal sent.")
    except Exception:
        pass   # Server may already be down — that's fine
    sys.exit(0)

signal.signal(signal.SIGINT,  _shutdown)
signal.signal(signal.SIGTERM, _shutdown)

# ── Helpers ───────────────────────────────────────────
def _collect() -> dict:
    """
    Gather current system metrics.

    cpu_percent uses interval=None so it returns the value since the
    last call — accurate without blocking when poll cycle is ~2s.
    On the very first call it may return 0.0; that's acceptable.
    """
    return {
        # Identity
        "host":       HOST_NAME,
        "ip":         IP_ADDRESS,
        "os":         OS_NAME,
        "os_version": OS_VERSION,

        # Liveness — lets backend detect stale agents
        "timestamp":  time.time(),

        # Metrics
        "cpu":    psutil.cpu_percent(interval=None),
        "memory": psutil.virtual_memory().percent,
        "disk":   psutil.disk_usage("/").percent,
    }


def _send(payload: dict) -> bool:
    """
    POST payload to /ingest.
    Returns True on success, False on any failure.
    """
    response = session.post(SERVER_URL, json=payload, timeout=REQUEST_TIMEOUT)
    if response.status_code == 200:
        return True
    print(f"⚠️  Server rejected payload: HTTP {response.status_code}")
    return False


# ── Boot ──────────────────────────────────────────────
print(f"🚀 SysMon Agent started")
print(f"   Host : {HOST_NAME} ({IP_ADDRESS})")
print(f"   OS   : {OS_NAME} {OS_VERSION}")
print(f"   Dest : {SERVER_URL}")
print(f"   Poll : every {POLL_INTERVAL}s")

# Warm up psutil's CPU counter so first real reading isn't 0.0
psutil.cpu_percent(interval=None)

# ── Main loop ─────────────────────────────────────────
while True:
    payload = _collect()

    try:
        ok = _send(payload)

        if ok:
            _retry_delay = BACKOFF_BASE   # reset backoff on success
            time.sleep(POLL_INTERVAL)
        else:
            # Server is up but unhappy — back off gently
            print(f"⏳ Retrying in {_retry_delay:.0f}s…")
            time.sleep(_retry_delay)
            _retry_delay = min(_retry_delay * BACKOFF_FACTOR, BACKOFF_MAX)

    except requests.exceptions.RequestException as exc:
        # Network-level failure — back off more aggressively
        print(f"❌ Connection failed ({exc.__class__.__name__}). Retrying in {_retry_delay:.0f}s…")
        time.sleep(_retry_delay)
        _retry_delay = min(_retry_delay * BACKOFF_FACTOR, BACKOFF_MAX)

