# System Monitoring Dashboard

A lightweight full-stack application for monitoring real-time system metrics using a FastAPI backend and a minimal JavaScript frontend.

## Overview

This project exposes system-level metrics such as CPU, memory, disk usage, and active processes through REST APIs, and visualizes them via a browser-based dashboard.

## Features

- Real-time system metrics (CPU, memory, disk, processes)
- REST API built with FastAPI
- Structured JSON responses
- HTTP polling (5s interval) for live updates
- Lightweight frontend using vanilla JavaScript
- Basic error handling for API failures

## Tech Stack

**Backend**
- Python
- FastAPI
- psutil
- Uvicorn

**Frontend**
- HTML, CSS
- JavaScript (Fetch API)

**Environment**
- Linux (WSL2 / Ubuntu)

## API Endpoints

| Endpoint         | Description                     |
|-----------------|---------------------------------|
| `/api/cpu`       | CPU usage (%)                  |
| `/api/memory`    | Memory usage (MB, %)           |
| `/api/disk`      | Disk usage (GB, %)             |
| `/api/processes` | Top processes by CPU usage     |

## Architecture
```bash
Browser (JS Dashboard)
↓ HTTP (Polling)
FastAPI Backend (REST API)
↓
psutil
↓
System Metrics (OS)
```

## Setup

```bash
# Clone repo
git clone <your-repo-url>
cd system-monitoring-dashboard

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn psutil

# Run server
uvicorn main:app --reload
```
