# System Monitoring Dashboard (v1 – Foundation)

A lightweight system monitoring web application built for learning and experimentation.

This project is designed for **students and developers** who want to understand how system monitoring tools work internally, rather than just using existing enterprise solutions.

---

## Project Scope (v1 – Foundation)

Version 1 focuses on the basics:

- Collecting system metrics from the operating system
- Exposing metrics through a Python backend API
- Displaying the data in a simple web interface
- Snapshot-based monitoring using HTTP polling

This version intentionally avoids real-time streaming, historical storage, alerts, and authentication.

---

## Tech Stack

**Backend**
- Python
- FastAPI
- psutil

**Frontend**
- HTML
- CSS
- Vanilla JavaScript

**Environment**
- Ubuntu (WSL2)

---

## Architecture Overview


The backend reads system metrics from the OS and exposes them as JSON over HTTP.  
The frontend periodically fetches this data and renders it in the browser.

---

## Setup Instructions

1. Clone the repository
2. Create and activate a Python virtual environment
3. Install dependencies from `requirements.txt`
4. Run the FastAPI backend
5. Open the frontend in a browser

(Exact commands are intentionally kept simple and documented in commits.)

---

## Known Limitations

- Metrics reflect the Linux environment running under WSL2, not bare-metal Windows
- Data is snapshot-based (polling)
- No historical data persistence
- Single-machine monitoring only

---

## Planned Improvements

- v2: Real-time monitoring using WebSockets or Server-Sent Events
- v3: Basic insights such as trends and anomaly highlighting

---

## Learning Goals

- Understand how system metrics are collected
- Learn backend–frontend data flow
- Practice API design and separation of concerns
- Build a complete, versioned full-stack project
