from fastapi import APIRouter
from app.services.system_stats import (
    get_cpu_usage,
    get_memory_usage,
    get_disk_usage,
)
from app.services.system_stats import get_top_processes
from app.config import TOP_PROCESS_LIMIT
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import logging


logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/cpu")
def cpu():
    logger.info("CPU metrics requested")
    return {"cpu_percent": get_cpu_usage()}

@router.get("/cpu")
def cpu():
    return {"cpu_percent": get_cpu_usage()}

@router.get("/memory")
def memory():
    return get_memory_usage()

@router.get("/disk")
def disk():
    return get_disk_usage()

@router.get("/processes")
def processes():
    return get_top_processes(limit=TOP_PROCESS_LIMIT)


@router.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await asyncio.to_thread(
                lambda: {
                    "cpu": get_cpu_usage(),
                    "memory": get_memory_usage()["percent"],
                    "disk": get_disk_usage()["percent"],
                    "processes": get_top_processes(limit=TOP_PROCESS_LIMIT),
                }
            )

            await websocket.send_json(data)
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        print("WebSocket client disconnected")

