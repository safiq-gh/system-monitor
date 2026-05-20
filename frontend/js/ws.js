/**
 * ws.js — WebSocket lifecycle management.
 *
 * Responsibilities:
 *   1. Open a single WebSocket connection to the backend
 *   2. Parse incoming JSON messages → forward to state.update()
 *   3. Auto-reconnect with simple exponential backoff on disconnect
 *   4. Update connection status in state
 *
 * No UI logic lives here. No circular deps: only imports state.js.
 */

import * as state from './state.js';
import { addLog } from './logs.js';

const WS_URL          = 'ws://127.0.0.1:8000/api/ws/metrics';
const RECONNECT_BASE  = 1000;   // ms — initial reconnect delay
const RECONNECT_MAX   = 30000;  // ms — cap backoff at 30s
const RECONNECT_MULT  = 1.5;    // backoff multiplier

let _socket    = null;
let _retryMs   = RECONNECT_BASE;
let _retryTimer = null;
let _intentionalClose = false;

/** Open the WebSocket. Called once from main.js at startup. */
export function connect() {
  _intentionalClose = false;
  _openSocket();
}

/** Gracefully close the connection (no reconnect). */
export function disconnect() {
  _intentionalClose = true;
  if (_socket) _socket.close();
}

// ── Internal ──

function _openSocket() {
  // Guard: don't stack connections
  if (_socket && _socket.readyState <= WebSocket.OPEN) return;

  addLog('INFO', `Connecting to ${WS_URL}`);
  state.setConnection('connecting');

  _socket = new WebSocket(WS_URL);

  _socket.addEventListener('open', _onOpen);
  _socket.addEventListener('message', _onMessage);
  _socket.addEventListener('close', _onClose);
  _socket.addEventListener('error', _onError);
}

function _onOpen() {
  _retryMs = RECONNECT_BASE; // reset backoff
  state.setConnection('connected');
  addLog('INFO', 'WebSocket connected');
}

/**
 * Parse each incoming message and forward to state.
 * Silently drops malformed frames — never throws.
 */
function _onMessage(event) {
  let payload;
  try {
    payload = JSON.parse(event.data);
  } catch {
    addLog('WARN', 'Received non-JSON frame — ignored');
    return;
  }

  // Forward raw payload to state for processing
  state.update(payload);

}

function _onClose(event) {
  state.setConnection('disconnected');

  if (_intentionalClose) {
    addLog('INFO', 'WebSocket closed intentionally');
    return;
  }

  addLog('WARN', `Connection lost (code ${event.code}). Reconnecting in ${Math.round(_retryMs / 1000)}s…`);
  _scheduleReconnect();
}

function _onError() {
  // 'error' is always followed by 'close', so we let _onClose handle reconnect.
  addLog('ERROR', 'WebSocket error — see browser console for details');
}

function _scheduleReconnect() {
  clearTimeout(_retryTimer);
  _retryTimer = setTimeout(() => {
    addLog('INFO', `Attempting reconnect…`);
    _openSocket();
  }, _retryMs);

  // Grow backoff, capped at max
  _retryMs = Math.min(_retryMs * RECONNECT_MULT, RECONNECT_MAX);
}
