/**
 * render.js — Updates the DOM based on state snapshots.
 *
 * Called by main.js whenever state notifies subscribers.
 * Contains zero business logic — only formatting and DOM writes.
 *
 * Actual backend WS payload (what we actually receive):
 *   cpu:       number  (plain float %)
 *   memory:    number  (plain float %)
 *   disk:      number  (plain float %)
 *   processes: Array<{ pid, name, cpu, memory }>
 *   network:   NOT sent — card is hidden on first render
 */

// ── Cached DOM refs (fetched once to avoid repeated querySelector) ──
const els = {
  dot:       document.getElementById('connection-dot'),
  label:     document.getElementById('connection-label'),
  timestamp: document.getElementById('last-update'),

  cpuValue:  document.getElementById('cpu-value'),
  cpuBar:    document.getElementById('cpu-bar'),
  cpuMeta:   document.getElementById('cpu-meta'),

  memValue:  document.getElementById('mem-value'),
  memBar:    document.getElementById('mem-bar'),
  memMeta:   document.getElementById('mem-meta'),

  diskValue: document.getElementById('disk-value'),
  diskBar:   document.getElementById('disk-bar'),
  diskMeta:  document.getElementById('disk-meta'),

  procCount: document.getElementById('proc-count'),
  procBody:  document.getElementById('proc-table-body'),

  netValue: document.getElementById('net-value'),
  netBar:   document.getElementById('net-bar'),
  netMeta:  document.getElementById('net-meta'),
};

// ── Disconnect overlay (injected once on demand) ──
let _overlayEl = null;

/**
 * Master render entry point.
 * Called by main.js on every state notification.
 *
 * @param {object} snapshot — from state.getSnapshot()
 */
export function render(snapshot) {
  renderConnection(snapshot.connection);
  if (snapshot.metrics.timestamp) {
    renderMetrics(snapshot.metrics);
    renderProcesses(snapshot.metrics.processes);
  }
}

// ── Connection indicator ──

function renderConnection(status) {
  els.dot.className     = `status-dot status-dot--${status}`;
  els.label.textContent = status.toUpperCase();

  if (status === 'connected') {
    _removeOverlay();
  } else if (status === 'disconnected') {
    _showOverlay();
  }
}

// ── Metric cards ──

function renderMetrics(m) {
  // Timestamp
  els.timestamp.textContent = m.timestamp
    ? new Date(m.timestamp).toLocaleTimeString()
    : '--:--:--';

  // CPU — backend sends plain float, e.g. 23.5
  if (m.cpu.percent != null) {
    const pct = m.cpu.percent;
    els.cpuValue.textContent = fmt1(pct) + '%';
    els.cpuBar.style.width   = pct + '%';
    els.cpuMeta.textContent  = fmt1(pct) + '% utilisation';
    setAlertClass(document.getElementById('card-cpu'), pct);
  }

  // Memory — backend sends plain float percent
  if (m.memory.percent != null) {
    const pct = m.memory.percent;
    els.memValue.textContent = fmt1(pct) + '%';
    els.memBar.style.width   = pct + '%';
    els.memMeta.textContent  = fmt1(pct) + '% utilisation';
    setAlertClass(document.getElementById('card-mem'), pct);
  }

  // Disk — backend sends plain float percent
  if (m.disk.percent != null) {
    const pct = m.disk.percent;
    els.diskValue.textContent = fmt1(pct) + '%';
    els.diskBar.style.width   = pct + '%';
    els.diskMeta.textContent  = fmt1(pct) + '% utilisation';
    setAlertClass(document.getElementById('card-disk'), pct);
  }

  // Network Speed
  if (m.network && m.network.speed_recv != null) {
  const up = m.network.speed_send;
  const down = m.network.speed_recv;
  const total = up + down;

  // Cap visual gauge at roughly 5MB/s for the progress bar (adjustable)
  const visualPct = Math.min((total / 5000) * 100, 100); 

  els.netValue.innerHTML = `${total.toFixed(0)}<span class="mc-unit">KB/s</span>`;
  els.netBar.style.width = visualPct + '%';
  els.netMeta.textContent = `↑ ${up.toFixed(1)} · ↓ ${down.toFixed(1)}`;

  // Update the SVG Ring (bypasses the MutationObserver)
  if (window.setRing) window.setRing('ring-net', visualPct);
  }
}

/**
 * Add/remove warn/alert CSS classes based on threshold.
 * warn ≥ 75%, alert ≥ 90%
 */
function setAlertClass(card, pct) {
  if (!card) return;
  card.classList.toggle('warn',  pct >= 75 && pct < 90);
  card.classList.toggle('alert', pct >= 90);
}

// ── Process table ──
// Backend sends: { pid, name, cpu, memory }
// state.js normalises these to: { pid, name, cpu_percent, memory_percent }

function renderProcesses(procs) {
  if (!Array.isArray(procs) || procs.length === 0) return;

  els.procCount.textContent = `${procs.length} running`;

  // 1. Check if the system is under heavy load (any process > 85%)
  const isSystemStressed = procs.some(p => p.cpu_percent > 85);
  const procCard = document.querySelector('.process-card');
  
  if (isSystemStressed) {
    procCard.classList.add('alert'); // Triggers your CSS flash
  } else {
    procCard.classList.remove('alert');
  }

  // 2. Build rows, adding a specific class for "Heavy" processes
  els.procBody.innerHTML = procs.map(p => {
    // Flag processes using more than 50% CPU for a visual highlight
    const isHeavy = p.cpu_percent > 50 ? 'proc-row--heavy' : '';
    
    return `
      <tr class="${isHeavy}">
        <td>${p.pid ?? '--'}</td>
        <td title="${escHtml(p.name ?? '')}">${escHtml(truncate(p.name ?? '--', 22))}</td>
        <td>${fmt1(p.cpu_percent ?? 0)}</td>
        <td>${fmt1(p.memory_percent ?? 0)}</td>
        <td><span class="proc-status proc-status--${statusClass(p.status)}">${statusLabel(p.status)}</span></td>
      </tr>
    `;
  }).join('');
}

// ── Disconnect overlay ──

function _showOverlay() {
  if (_overlayEl) return;
  _overlayEl = document.createElement('div');
  _overlayEl.className = 'disconnect-overlay';
  _overlayEl.innerHTML = `
    <div class="disconnect-box">
      <h2>⚠ DISCONNECTED</h2>
      <p>Lost connection to backend — attempting to reconnect…</p>
    </div>
  `;
  document.body.appendChild(_overlayEl);
}

function _removeOverlay() {
  if (_overlayEl) { _overlayEl.remove(); _overlayEl = null; }
}

// ── Formatters ──

/** Format a number to 1 decimal place. */
function fmt1(n) { return (n ?? 0).toFixed(1); }

/** Escape HTML special chars to prevent XSS from process names. */
function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/** Truncate string with ellipsis. */
function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/**
 * Map process status to CSS modifier.
 * Backend's psutil doesn't include status in the payload,
 * so we default to 'running' for processes that appear in top list.
 */
function statusClass(s) {
  if (!s) return 'running';
  const lower = s.toLowerCase();
  if (lower === 'running') return 'running';
  if (lower.includes('zombie')) return 'zombie';
  return 'sleeping';
}

function statusLabel(s) {
  if (!s) return 'RUNNING';
  return s.toUpperCase();
}

export function renderAgents(agents) {
  const container = document.getElementById("agents");
  if (!container) {
    console.error("[renderAgents] #agents not found");
    return;
  }

  const list = Object.values(agents || {});

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = '<div class="agents-empty">No agents connected…</div>';
    return;
  }

  list.forEach(a => {
    const div = document.createElement("div");
    div.className = "agent-item";                    // ← was "agent-card", must be "agent-item"

    const cpuHigh  = a.cpu    > 80 ? "agent-high" : "";
    const memHigh  = a.memory > 80 ? "agent-high" : "";
    const diskHigh = a.disk   > 90 ? "agent-high" : "";

    div.innerHTML = `
      <div class="agent-item__title">${a.host ?? "unknown"}</div>
      <div class="agent-item__metric">
        <span>CPU</span>
        <span class="${cpuHigh}">${a.cpu ?? "--"}%</span>
      </div>
      <div class="agent-item__metric">
        <span>MEM</span>
        <span class="${memHigh}">${a.memory ?? "--"}%</span>
      </div>
      <div class="agent-item__metric">
        <span>DISK</span>
        <span class="${diskHigh}">${a.disk ?? "--"}%</span>
      </div>
    `;
    container.appendChild(div);
  });
}
