from fastapi import FastAPI
from app.routes import metrics
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

app = FastAPI(title="System Health Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api")

agents = {}

@app.post("/ingest")
def ingest(data: dict):
    host = data.get("host")
    agents[host] = data
    return {"status": "ok"}


@app.get("/agents")
def get_agents():
    return agents
