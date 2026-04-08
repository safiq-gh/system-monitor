/**
 * main.js — Application entry point.
 *
 * Wires modules together. Does not contain business logic.
 *
 * Boot sequence:
 *   1. Initialize charts (insert static SVG structure)
 *   2. Subscribe render.js and charts.js to state notifications
 *   3. Open WebSocket connection via ws.js
 *
 * Data flow (after boot):
 *   WebSocket message
 *     → ws.js parses JSON
 *       → state.update() mutates state + notifies subscribers
 *         → render.js updates DOM cards / table
 *         → charts.js redraws SVG paths
 *         → logs.js (called directly by ws.js for system messages)
 */

import * as state  from './state.js';
import * as ws     from './ws.js';
import { render }  from './render.js';
import { renderAgents } from "./render.js";
import { initCharts, renderCharts } from './charts.js';
import { addLog }  from './logs.js';

// 1. Prepare charts (static SVG structure must exist before first data arrives)
initCharts();

// 2. Subscribe both rendering systems to state changes
//    Both receive the same snapshot object on each update.
state.subscribe(snapshot => {
  render(snapshot);
  renderCharts(snapshot);
});

// 3. Open WebSocket — all further updates are event-driven
ws.connect();

// Startup log
addLog('INFO', 'SysMon dashboard initialised');

// Keep track of who is currently online
let knownAgents = new Set();

async function fetchAgents() {
  try {
    // Replace with your static ngrok or local IP
    const res = await fetch("https://resulted-buffalo-arrival-donation.trycloudflare.com/agents", {
      headers: { "ngrok-skip-browser-warning": "true", "Accept": "application/json" } 
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    // --- 🚨 Smart Agent Tracking ---
    const currentAgents = new Set(Object.keys(data));
    
    // Check for dropped agents
    for (const agent of knownAgents) {
      if (!currentAgents.has(agent)) {
        addLog('WARN', `Agent connection lost: ${agent}`);
      }
    }
    
    // Check for new agents
    for (const agent of currentAgents) {
      if (!knownAgents.has(agent)) {
        addLog('INFO', `New agent connected: ${agent}`);
      }
    }
    
    // Update our tracker
    knownAgents = currentAgents;
    // ------------------------------

    renderAgents(data);
  } catch (err) {
    // Don't spam the log panel if the server is restarting, just use console
    console.error("[fetchAgents] failed:", err);
  }
}

// Wait for DOM before polling — not needed for <script type="module"> (deferred by default)
// but harmless and explicit
document.addEventListener("DOMContentLoaded", () => {
  fetchAgents();                      // immediate first call, don't wait 2s
  setInterval(fetchAgents, 2000);
});
