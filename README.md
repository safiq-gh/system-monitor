# System Monitoring Dashboard (v1 – Foundation)

A lightweight full-stack web application that collects and displays real-time system resource metrics. Built as a learning project to demonstrate full-stack development fundamentals, REST API design, and client-server communication using HTTP polling.

---

## Project Scope

### Included in v1 – Foundation

- Backend REST API using FastAPI to expose system metrics
- Collection of CPU usage, memory usage, disk usage, and top processes via `psutil`
- JSON response format for all endpoints
- Frontend interface displaying metrics in a tabular format
- HTTP polling mechanism for periodic data refresh (5-second interval)
- Single-page application with vanilla JavaScript
- Basic error handling for API failures
- Static file serving via FastAPI

### Intentionally Excluded from v1

- User authentication and authorization
- Database or persistent storage
- Historical data tracking or time-series visualization
- Alerting or notification system
- WebSocket or server-sent events for real-time updates
- Multi-server or distributed monitoring
- Configuration management
- Production deployment setup (HTTPS, reverse proxy, etc.)
- Unit tests and integration tests
- Containerization

---

## Tech Stack

**Backend**
- Python 3.8+
- FastAPI (web framework)
- psutil (system metrics library)
- uvicorn (ASGI server)

**Frontend**
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Fetch API for HTTP requests

**Environment**
- Ubuntu 22.04 (WSL2)
- Development server only

---

## Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│                      Web Browser                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  HTML + CSS + JavaScript                          │  │
│  │  - Displays metrics in tables                     │  │
│  │  - Polls /api/* every 5 seconds                   │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP GET (polling)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  REST API Endpoints                               │  │
│  │  - /api/cpu        → CPU usage %                  │  │
│  │  - /api/memory     → Memory usage MB/%            │  │
│  │  - /api/disk       → Disk usage GB/%              │  │
│  │  - /api/processes  → Top 10 processes by CPU      │  │
│  └────────────────┬──────────────────────────────────┘  │
│                   │                                      │
│  ┌────────────────▼──────────────────────────────────┐  │
│  │  psutil library                                   │  │
│  │  - Queries system metrics                         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │  Ubuntu (WSL2)  │
           │  System Metrics │
           └─────────────────┘
```

---

## API Endpoints

| Endpoint          | Method | Description                              | Response Fields                                      |
|-------------------|--------|------------------------------------------|------------------------------------------------------|
| `/api/cpu`        | GET    | Current CPU usage percentage             | `{ "cpu_percent": float }`                           |
| `/api/memory`     | GET    | Memory usage in MB and percentage        | `{ "used_mb": float, "total_mb": float, "percent": float }` |
| `/api/disk`       | GET    | Disk usage in GB and percentage          | `{ "used_gb": float, "total_gb": float, "percent": float }` |
| `/api/processes`  | GET    | Top 10 processes sorted by CPU usage     | `{ "processes": [ { "pid": int, "name": str, "cpu_percent": float, "memory_mb": float } ] }` |

All endpoints return JSON with appropriate HTTP status codes (200 for success, 500 for server errors).

---

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip package manager
- Ubuntu environment (WSL2 or native Linux)

### Installation

1. Clone or extract the project directory:
```bash
   cd system-monitoring-dashboard
```

2. Create a virtual environment:
```bash
   python3 -m venv venv
   source venv/bin/activate
```

3. Install dependencies:
```bash
   pip install fastapi uvicorn psutil
```

### Running the Application

1. Start the backend server:
```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. Open a web browser and navigate to:
```
   http://localhost:8000
```

3. The dashboard will automatically begin polling for system metrics every 5 seconds.

### Stopping the Application

Press `Ctrl+C` in the terminal running the uvicorn server.

---

## Key Design Decisions

### HTTP Polling vs. WebSockets

- **Choice**: HTTP polling with 5-second intervals
- **Rationale**: Simpler to implement for v1, no connection state management required, adequate for non-critical monitoring use case
- **Tradeoff**: Higher network overhead and latency compared to WebSockets, but acceptable for learning and low-frequency updates

### FastAPI for Backend

- **Choice**: FastAPI over Flask or Django
- **Rationale**: Built-in async support, automatic OpenAPI documentation, modern Python type hints, lightweight
- **Tradeoff**: Less mature ecosystem than Flask, but better performance and developer experience

### Vanilla JavaScript (No Framework)

- **Choice**: Plain JavaScript without React/Vue/Angular
- **Rationale**: Demonstrates fundamental DOM manipulation and HTTP client concepts, reduces build complexity, appropriate for single-page dashboard
- **Tradeoff**: More verbose code for DOM updates, but keeps dependencies minimal and concepts transparent

### No Data Persistence

- **Choice**: Metrics are not stored in a database
- **Rationale**: v1 focuses on real-time monitoring only, avoids database setup and schema design complexity
- **Tradeoff**: No historical analysis or trend visualization, addressed in future versions

### psutil for Metrics Collection

- **Choice**: psutil library over parsing `/proc` files directly
- **Rationale**: Cross-platform abstraction, well-tested, handles edge cases, simpler API
- **Tradeoff**: External dependency, but standard in Python ecosystem

---

## Known Limitations

- **No historical data**: Only displays current snapshot, cannot show trends over time
- **Single-server only**: Cannot monitor multiple machines
- **Polling inefficiency**: HTTP polling creates unnecessary requests when metrics haven't changed significantly
- **No error recovery**: Frontend does not gracefully handle prolonged backend outages
- **Process filtering**: Shows top 10 processes only, no search or filtering options
- **No responsive design**: UI is optimized for desktop browsers only
- **Development server**: Uses uvicorn development mode, not suitable for production traffic
- **Hardcoded refresh interval**: 5-second polling interval cannot be configured without code changes
- **No metric thresholds**: Does not indicate when resources are critically low

---

## Planned Improvements

### v2 – Data Persistence and Visualization

- Add SQLite database for storing metric snapshots
- Implement time-series line charts using Chart.js or D3.js
- Add date range filtering for historical data
- Expose `/api/history` endpoint for time-based queries

### v3 – Real-Time and Scalability

- Replace HTTP polling with WebSocket connections
- Add configurable alert thresholds with browser notifications
- Implement multi-server monitoring with server selection UI
- Add basic authentication for production use
- Containerize with Docker for easier deployment

### Future Considerations

- Network I/O metrics (bytes sent/received)
- GPU monitoring (if applicable)
- Process-level drill-down (memory maps, open files, threads)
- Export metrics in Prometheus-compatible format

---

## Learning Goals

This project was built to develop practical skills in:

- Designing and implementing RESTful APIs with proper HTTP semantics
- Collecting system metrics programmatically using Python libraries
- Implementing client-server communication patterns
- Working with asynchronous JavaScript (Fetch API, Promises)
- Structuring a full-stack application with clear separation of concerns
- Writing technical documentation for software projects
- Understanding the tradeoffs between polling and event-driven architectures

The v1 scope intentionally omits production features to focus on core full-stack development patterns and working software over comprehensive functionality.