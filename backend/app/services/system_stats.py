import psutil
import time
from app.config import TOP_PROCESS_LIMIT
from collections import deque


history_buffer = deque(maxlen=60)

def get_cpu_usage():
    try:
        return psutil.cpu_percent(interval=0)
    except Exception:
        return 0

def get_memory_usage():
    try:
        mem = psutil.virtual_memory()
        return {
            "total": mem.total,
            "used": mem.used,
            "percent": mem.percent,
        }
    except Exception:
        return 0

def get_disk_usage():
    try:
        disk = psutil.disk_usage("/")
        return {
            "total": disk.total,
            "used": disk.used,
            "percent": disk.percent,
        }
    except Exception:
        return 0

def get_top_processes(limit=5):
    processes = []

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            cpu = proc.info['cpu_percent']
            mem = proc.info['memory_percent']

            # Skip processes with no data yet
            if cpu is None or mem is None:
                continue

            processes.append({
                "pid": proc.info['pid'],
                "name": proc.info['name'] or "unknown",
                "cpu": round(cpu, 2),
                "memory": round(mem, 2)
            })

        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    processes.sort(key=lambda p: p["cpu"], reverse=True)
    return processes[:limit]


def get_network_usage():
    try:
        net = psutil.net_io_counters()
        return {
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv
        }
    except Exception:
        return {"bytes_sent": 0, "bytes_recv": 0}

def get_full_stats():
    """Compiles all stats and appends them to the history buffer."""
    stats = {
        "cpu": get_cpu_usage(),
        "memory": get_memory_usage()["percent"],
        "disk": get_disk_usage()["percent"],
        "network": get_network_usage(),
        "processes": get_top_processes(limit=TOP_PROCESS_LIMIT),
        "timestamp": int(time.time() * 1000) # Milliseconds for JS compatibility
    }
    history_buffer.append(stats)
    return stats
