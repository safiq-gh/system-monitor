import psutil
import requests
import time
import socket

SERVER = "http://<YOUR_SERVER_IP>:8000/ingest"
HOST = socket.gethostname()

while True:
    data = {
        "host": HOST,
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent
    }

    try:
        requests.post(SERVER, json=data)
    except:
        pass

    time.sleep(2)
