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
