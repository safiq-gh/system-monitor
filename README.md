# System Monitoring Dashboard

A lightweight full-stack application for monitoring real-time system metrics using a FastAPI backend and a minimal JavaScript frontend.

## Overview

This project demonstrates two progressively improved architectures for collecting and displaying system resource metrics:

- **v1 – Foundation:** REST API with HTTP polling
- **v2 – Real-Time:** WebSocket-based real-time streaming

The application exposes system-level metrics such as CPU, memory, disk usage, and active processes through APIs, and visualizes them via a browser-based dashboard.

## Features

- Real-time system metrics (CPU, memory, disk, processes)
- REST API built with FastAPI
- Structured JSON responses
- HTTP polling (5s interval) for live updates
- WebSocket support for event-driven real-time updates (v2)
- Lightweight frontend using vanilla JavaScript
- Basic error handling for API failures

## Tech Stack

**Backend**
- Python 3.10+
- FastAPI
- psutil
- Uvicorn

**Frontend**
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- WebSocket API

**Environment**
- Linux (WSL2 / Ubuntu 22.04)

## Architecture

### v1 – REST + Polling

```
Browser
  │
  │ HTTP GET (every 5s)
  ▼
FastAPI REST API
  │
  ▼
Operating System Metrics (psutil)
```

### v2 – WebSocket (Real-Time)

```
Browser
  ⇄ WebSocket (persistent connection)
FastAPI WebSocket Endpoint
  │
  ▼
Operating System Metrics (psutil)
```

## API Reference

### v1 REST Endpoints

| Endpoint         | Method | Description                    |
|------------------|--------|--------------------------------|
| `/api/cpu`       | GET    | CPU usage percentage           |
| `/api/memory`    | GET    | Memory usage statistics        |
| `/api/disk`      | GET    | Disk usage statistics          |
| `/api/processes` | GET    | Top CPU-consuming processes    |

### v2 WebSocket Endpoint

| Endpoint          | Description                               |
|-------------------|-------------------------------------------|
| `/api/ws/metrics` | Streams live system metrics as JSON       |

**Sample Payload:**

```json
{
  "cpu": 27.3,
  "memory": 62.1,
  "disk": 44.8,
  "processes": [
    { "pid": 1234, "name": "python", "cpu": 12.3, "memory": 4.1 }
  ]
}
```

## Installation

### Prerequisites

- Python 3.10+
- pip
- Linux environment (WSL2 or native)

### Setup Instructions

1. Clone the repository:

```bash
git clone <repository-url>
cd system-monitoring-dashboard
```

2. Create and activate virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

## Running the Application

1. Start the backend:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

2. Start the frontend (open a new terminal):

```bash
cd frontend
python -m http.server 5500
```

3. Open in browser:

```
http://localhost:5500
```

## Design Decisions

- **REST to WebSocket Progression:** v1 uses HTTP polling for simplicity; v2 replaces it with WebSockets for real-time, event-driven architecture
- **No Frontend Frameworks:** Raw DOM manipulation and WebSocket handling to emphasize fundamental concepts
- **No Persistence:** Real-time metrics only; no database layer
- **Defensive System Programming:** Handles restricted and short-lived OS processes; avoids blocking the async event loop

## Known Limitations

- Single-machine monitoring only
- No historical data or trend analysis
- No authentication or access control
- Development server only
- Metrics reflect the Linux environment, not bare-metal Windows
- Browser may close idle WebSocket connections (handled via reconnection logic)

## Project Status

- v1 – Foundation: Complete and tagged
- v2 – Real-Time: Complete and tagged

## Learning Outcomes

This project demonstrates:

- REST API design with FastAPI
- System metric collection using psutil
- Client–server communication patterns
- Polling vs. event-driven architectures
- Asynchronous programming in Python
- WebSocket lifecycle handling
- Clean project structure and versioned scope control

---

**Note:** This is a learning project designed to demonstrate fundamental concepts in system monitoring and real-time web applications.
