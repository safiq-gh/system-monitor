/**
 * logs.js — Terminal-style log panel.
 *
 * Provides addLog() which is called from:
 *   - ws.js  (connection lifecycle events)
 *   - render.js (could be extended)
 *
 * Features:
 *   - Color-coded levels: INFO / WARN / ERROR / DATA
 *   - Auto-scroll (toggleable)
 *   - Bounded buffer to prevent memory growth
 */

const MAX_ENTRIES  = 200;  // hard cap on DOM nodes in the log panel
const panel        = document.getElementById('log-panel');
const clearBtn     = document.getElementById('log-clear');
const scrollBtn    = document.getElementById('log-scroll');

// Track how many entries are in the DOM
let _entryCount = 0;
let _autoScroll = true;

// ── Init controls ──
clearBtn?.addEventListener('click', () => {
  panel.innerHTML = '';
  _entryCount = 0;
  addLog('INFO', 'Log cleared');
});

scrollBtn?.addEventListener('click', () => {
  _autoScroll = !_autoScroll;
  scrollBtn.classList.toggle('log-btn--active', _autoScroll);
  scrollBtn.textContent = _autoScroll ? 'AUTO↓' : 'MANUAL';
  if (_autoScroll) _scrollToBottom();
});

/**
 * Append a new log entry to the panel.
 *
 * @param {'INFO'|'WARN'|'ERROR'|'DATA'} level
 * @param {string} message
 */
export function addLog(level, message) {
  if (!panel) return;

  const safeLevel = _safeLevel(level);
  const entry = _buildEntry(safeLevel, String(message));

  panel.appendChild(entry);
  _entryCount++;

  // Trim oldest entries when over the limit (single DOM removal)
  if (_entryCount > MAX_ENTRIES) {
    panel.firstElementChild?.remove();
    _entryCount--;
  }

  if (_autoScroll) _scrollToBottom();
}

// ── Build a log DOM node ──

function _buildEntry(level, message) {
  const row = document.createElement('div');
  row.className = `log-entry log-level--${level}`;

  const time = document.createElement('span');
  time.className = 'log-entry__time';
  time.textContent = _timestamp();

  const badge = document.createElement('span');
  badge.className = 'log-entry__level';
  badge.textContent = level;

  const msg = document.createElement('span');
  msg.className = 'log-entry__msg';
  msg.textContent = message; // textContent = safe, no XSS risk

  row.appendChild(time);
  row.appendChild(badge);
  row.appendChild(msg);
  return row;
}

// ── Helpers ──

function _scrollToBottom() {
  // requestAnimationFrame ensures scroll happens after paint
  requestAnimationFrame(() => {
    panel.scrollTop = panel.scrollHeight;
  });
}

function _timestamp() {
  return new Date().toLocaleTimeString('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Normalise unknown level strings to 'DATA'. */
function _safeLevel(level) {
  const valid = ['INFO', 'WARN', 'ERROR', 'DATA'];
  const up = String(level).toUpperCase();
  return valid.includes(up) ? up : 'DATA';
}
