/**
 * state.js — Single source of truth for all dashboard data.
 *
 * Data flow:
 *   ws.js receives raw WebSocket payload
 *     → calls state.update(payload)
 *       → state stores raw + derived values
 *         → notifies subscribers (render.js, charts.js, logs.js)
 *
 * Nothing outside this module writes to state directly.
 * Consumers subscribe via state.subscribe(callback).
 */

import { addLog } from './logs.js';
// ── History buffer size (one sample per second ≈ 60s window) ──
const HISTORY_LEN = 60;

let _knownAgents = new Set();
let _lastAlertTime = 0; // Prevents log spamming

// ── Internal state object ──
const _state = {
  connection: 'connecting', // 'connecting' | 'connected' | 'disconnected'

  // Latest raw snapshot from WebSocket
  metrics: {
    cpu:     { percent: null, cores: null, freq: null },
    memory:  { percent: null, used: null, total: null },
    disk:    { percent: null, used: null, total: null },
    network: { bytes_sent: null, bytes_recv: null, speed_send: null, speed_recv: null },
    processes: [],
    timestamp: null,
  },

  // Rolling history arrays for charting (fixed-length, oldest at [0])
  history: {
    cpu:    [],
    memory: [],
    disk:   [],
    net:    [],
  },

  // Previous network bytes for delta calculation
  _prevNetwork: { sent: null, recv: null, ts: null },
};

// ── Subscriber list ──
const _subscribers = [];

/** Register a callback to be called on every state change. */
export function subscribe(fn) {
  _subscribers.push(fn);
}

/** Notify all subscribers with the current state (read-only snapshot). */
function _notify() {
  const snapshot = getSnapshot();
  for (const fn of _subscribers) {
    try { fn(snapshot); } catch (e) { console.error('[state] subscriber error:', e); }
  }
}

/**
 * Primary update function called by ws.js on each incoming message.
 * Mutates internal state, derives computed fields, then notifies.
 *
 * Actual backend payload shape (metrics.py / system_stats.py):
 * {
 *   cpu:       number          — plain float percent (0-100)
 *   memory:    number          — plain float percent (0-100)
 *   disk:      number          — plain float percent (0-100)
 *   processes: Array<{
 *     pid:    number,
 *     name:   string,
 *     cpu:    number,          — field is "cpu", NOT "cpu_percent"
 *     memory: number           — field is "memory", NOT "memory_percent"
 *   }>
 * }
 * Note: network is NOT sent by the backend — that card is hidden gracefully.
 *
 * @param {object} payload — Raw parsed JSON from WebSocket
 */

// state.js

export function update(message) {
  // 1. Handle History Dump
  if (message.type === 'history') {
    if (Array.isArray(message.data)) {
      message.data.forEach(sample => processSample(sample, true));
    }
    return;
  }

  // 2. Handle Live Update (Nested)
  if (message.type === 'live' && message.metrics) {
    processSample(message.metrics, false);
    
    // Immediate Agent update
    if (message.agents) {
      import('./render.js').then(m => m.renderAgents(message.agents));
    }
    // Inside the live update block
    if (message.metrics.cpu > 80) {
      addLog('WARN', `High CPU detected: ${message.metrics.cpu}%`);
    }
  } 
  // 3. Fallback for older/flat formats
  else {
    processSample(message, false);
  }

  _state.metrics.timestamp = Date.now();
  _notify();
}

function processSample(payload, isHistoryDump) {
  // Guard clause: if payload is null/undefined, exit early to prevent crash
  if (!payload) return; 

  const m = _state.metrics;
  // Use the timestamp from the server, or fallback to browser time
  const now = payload.timestamp || Date.now();

  // Update CPU
  if (payload.cpu != null) {
    m.cpu.percent = clamp(payload.cpu, 0, 100);
    pushHistory(_state.history.cpu, m.cpu.percent);
  }

  // Update Memory
  if (payload.memory != null) {
    m.memory.percent = clamp(payload.memory, 0, 100);
    pushHistory(_state.history.memory, m.memory.percent);
  }

  // Update Disk
  if (payload.disk != null) {
    m.disk.percent = clamp(payload.disk, 0, 100);
    pushHistory(_state.history.disk, m.disk.percent);
  }

  // Update Network (Deltas for speed)
    if (payload.network) {
      
      // 1. FIXED: Removed '!isHistoryDump' so speed calculates during initial load replay
      if (_state._prevNetwork.ts) {
        const timeDiff = (now - _state._prevNetwork.ts) / 1000;
        if (timeDiff > 0) {
          const sentDiff = payload.network.bytes_sent - _state._prevNetwork.sent;
          const recvDiff = payload.network.bytes_recv - _state._prevNetwork.recv;
          
          m.network.speed_send = Math.max(0, sentDiff / timeDiff / 1024);
          m.network.speed_recv = Math.max(0, recvDiff / timeDiff / 1024);
        }
      }
      
      _state._prevNetwork = { 
        sent: payload.network.bytes_sent, 
        recv: payload.network.bytes_recv, 
        ts: now 
      };

      const totalSpeed = (m.network.speed_send || 0) + (m.network.speed_recv || 0);
      
      // 2. Map to 0-100 scale for the SVG viewbox (assuming 5MB/s = 100% height)
      const normalizedNet = Math.min((totalSpeed / 5000) * 100, 100);
      pushHistory(_state.history.net, normalizedNet);
    }

    // Update Processes
    if (Array.isArray(payload.processes)) {
      m.processes = payload.processes
        .slice()
        .sort((a, b) => (b.cpu ?? 0) - (a.cpu ?? 0))
        .slice(0, 15)
        .map(p => ({
          pid: p.pid,
          name: p.name,
          cpu_percent: p.cpu,
          memory_percent: p.memory,
          status: p.status ?? null,
        }));
    }
}

/**
 * Update connection status and notify subscribers.
 * @param {'connecting'|'connected'|'disconnected'} status
 */
export function setConnection(status) {
  _state.connection = status;
  _notify();
}

/**
 * Returns a shallow snapshot of state for subscribers.
 * History arrays are returned as-is (read-only by convention).
 */
export function getSnapshot() {
  return {
    connection: _state.connection,
    metrics:    _state.metrics,
    history:    _state.history,
  };
}

// ── Helpers ──

/** Push a value into a fixed-length circular buffer. */
function pushHistory(arr, value) {
  arr.push(value);
  if (arr.length > HISTORY_LEN) arr.shift();
}

/** Clamp a number between min and max. */
function clamp(v, min, max) {
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}
