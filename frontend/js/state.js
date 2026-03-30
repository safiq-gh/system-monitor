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

// ── History buffer size (one sample per second ≈ 60s window) ──
const HISTORY_LEN = 60;

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
export function update(payload) {
  const m = _state.metrics;

  // ── CPU — backend sends a plain float, e.g. 23.5 ──
  if (payload.cpu != null) {
    m.cpu.percent = clamp(payload.cpu, 0, 100);
    pushHistory(_state.history.cpu, m.cpu.percent);
  }

  // ── Memory — backend sends a plain float percent ──
  if (payload.memory != null) {
    m.memory.percent = clamp(payload.memory, 0, 100);
    pushHistory(_state.history.memory, m.memory.percent);
  }

  // ── Disk — backend sends a plain float percent ──
  if (payload.disk != null) {
    m.disk.percent = clamp(payload.disk, 0, 100);
  }

  // ── Network — not in backend payload; leave as null so render hides it ──

  // ── Processes — backend uses "cpu" and "memory" field names ──
  if (Array.isArray(payload.processes)) {
    // Normalise field names to internal convention and sort by cpu desc
    m.processes = payload.processes
      .slice()
      .sort((a, b) => (b.cpu ?? 0) - (a.cpu ?? 0))
      .slice(0, 15)
      .map(p => ({
        pid:           p.pid,
        name:          p.name,
        cpu_percent:   p.cpu,    // normalise → cpu_percent for render.js
        memory_percent: p.memory, // normalise → memory_percent for render.js
        status:        p.status ?? null,
      }));
  }

  m.timestamp = Date.now();
  _notify();
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
