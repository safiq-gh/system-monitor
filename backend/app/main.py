from fastapi import FastAPI
from app.routes import metrics
from fastapi.middleware.cors import CORSMiddleware
import logging
import time # <-- New import needed for TTL
from app.state import agents
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

app = FastAPI(title="System Health Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api")

# The TTL threshold in seconds (how long before an agent is considered "dead")
AGENT_TIMEOUT = 2 

@app.post("/ingest")
def ingest(data: dict):
    host = data.get("host")
    if not host:
        return {"error": "No host identifier provided"}, 400
        
    # Inject the server-side timestamp
    data["last_seen"] = time.time()
    agents[host] = data
    
    return {"status": "ok"}

@app.get("/agents")
def get_agents():
    current_time = time.time()
    
    # Dictionary comprehension to filter out dead agents
    active_agents = {
        host: data for host, data in agents.items() 
        if current_time - data.get("last_seen", 0) < AGENT_TIMEOUT
    }
    
    # Optional: Clean up the actual dictionary so it doesn't grow indefinitely over months
    keys_to_delete = [h for h in agents.keys() if h not in active_agents]
    for k in keys_to_delete:
        del agents[k]
        
    return active_agents

@app.post("/disconnect")
def disconnect_agent(data: dict):
    host = data.get("host")
    if host in agents:
        del agents[host]
    return {"status": "removed"}
