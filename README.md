# System Monitoring Dashboard

<<<<<<< HEAD
A lightweight full-stack system monitoring web application that demonstrates two progressively improved architectures for collecting and displaying system resource metrics.

## 🎯 Overview

This project showcases the evolution from traditional REST APIs with HTTP polling to modern WebSocket-based real-time updates:

- **v1 – Foundation:** REST APIs with HTTP polling  
- **v2 – Real-Time:** WebSocket-based, server-pushed updates  

Built as a learning-focused system to understand backend–frontend data flow, API design, and real-time communication without relying on heavy frameworks or external platforms.

## 📋 Version Overview

### v1 – Foundation (Completed)
- REST API–based system monitoring
- HTTP polling for periodic updates
- Simple, explicit client–server interaction

### v2 – Real-Time (Completed)
- WebSocket-based real-time data streaming
- Event-driven updates without polling
- Persistent client–server connection
=======
![Dashboard](assets/SysMon.png)

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
>>>>>>> 50076f804956f8284534b2bc5e09e00bde0af542

## 🛠️ Tech Stack

<<<<<<< HEAD
### Backend
- Python 3.10+
- FastAPI
- psutil
- uvicorn (with WebSocket support)

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- WebSocket API (v2)

### Environment
- Ubuntu 22.04 (WSL2)
- Development setup only

## 🏗️ Architecture

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

- Simple request–response model
- Easy to reason about
- Inefficient for frequent updates
=======
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
>>>>>>> 50076f804956f8284534b2bc5e09e00bde0af542

### v2 – WebSocket (Real-Time)

<<<<<<< HEAD
```
Browser
   ⇄ WebSocket (persistent connection)
FastAPI WebSocket Endpoint
   │
   ▼
Operating System Metrics (psutil)
```

- Server pushes updates
- No repeated HTTP requests
- Data updates without page refresh

## 🔌 API Reference

### v1 Endpoints

| Endpoint         | Method | Description                     |
|------------------|--------|---------------------------------|
| `/api/cpu`       | GET    | CPU usage percentage            |
| `/api/memory`    | GET    | Memory usage statistics         |
| `/api/disk`      | GET    | Disk usage statistics           |
| `/api/processes` | GET    | Top CPU-consuming processes     |

All endpoints return JSON.

### v2 WebSocket Endpoint

| Endpoint          | Description                                  |
|-------------------|----------------------------------------------|
| `/api/ws/metrics` | Streams live system metrics as JSON objects  |

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

## 🚀 Setup Instructions

### Prerequisites

- Python 3.10+
- pip
- Linux environment (WSL2 or native)

### Installation

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

### Running the Application

1. **Start the Backend:**
```bash
cd backend
python -m uvicorn app.main:app
```

2. **Start the Frontend:**
```bash
cd frontend
python -m http.server 5500
```

3. **Open in Browser:**
```
http://localhost:5500
```

## 🎓 Key Design Decisions

### REST → WebSocket Progression

- **v1** uses HTTP polling to keep behavior explicit and beginner-friendly
- **v2** replaces polling with WebSockets to demonstrate real-time, event-driven systems
- Both versions are kept to show architectural evolution

### No Frontend Frameworks

- Focuses on raw DOM manipulation and WebSocket handling
- Avoids build tools and hidden abstractions

### No Persistence

- Metrics are real-time only
- Avoids premature database complexity
- Emphasizes data flow over storage

### Defensive System Programming

- Handles restricted and short-lived OS processes
- Avoids blocking the async event loop
- Uses background threads for metric collection in v2

## ⚠️ Known Limitations

- Single-machine monitoring only
- No historical data or trend analysis
- No authentication or access control
- Development server only
- Metrics reflect the WSL2 Linux environment, not bare-metal Windows
- Browser behavior may close idle WebSocket connections (handled via reconnection logic)

## 💡 Learning Outcomes

This project demonstrates:

- REST API design with FastAPI
- System metric collection using psutil
- Client–server communication patterns
- Difference between polling and event-driven architectures
- Asynchronous programming pitfalls and solutions
- WebSocket lifecycle handling
- Clean project structure and versioned scope control

## 📊 Project Status

- ✅ **v1 – Foundation:** Complete and tagged
- ✅ **v2 – Real-Time:** Complete and tagged

Further versions would focus on persistence, visualization, or multi-node monitoring, but are intentionally out of scope for this project.

---

**Note:** This is a learning project designed to demonstrate fundamental concepts in system monitoring and real-time web applications.
=======
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
>>>>>>> 50076f804956f8284534b2bc5e09e00bde0af542
