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
from app.services.system_stats import get_full_stats, history_buffer
import time
from app.state import agents

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/cpu")
def cpu():
    logger.info("CPU metrics requested")
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
            # 1. Get local stats
            data = await asyncio.to_thread(get_full_stats)
            
            # 2. Get active agents (using the TTL logic from Phase 1)
            current_time = time.time()
            active_agents = {
                host: info for host, info in agents.items() 
                if current_time - info.get("last_seen", 0) < 10
            }
            
            # 3. Bundle them together
            payload = {
                "type": "live",
                "metrics": data,
                "agents": active_agents
            }
            
            await websocket.send_json(payload)
            
            # 4. High-Frequency Tick
            # Change this to 0.2 for "Gaming Monitor" levels of responsiveness
            await asyncio.sleep(0.5) 

    except WebSocketDisconnect:
        logger.info("Client disconnected")
