/**
 * charts.js — Pure SVG chart rendering for time-series data.
 *
 * Draws smooth line charts with a filled area gradient.
 * Uses the SVG <path> element with cubic bezier curves.
 * No external libraries. No canvas. Just math and SVG strings.
 *
 * Called by main.js as a subscriber to state notifications.
 */

// SVG namespace constant
const SVG_NS = 'http://www.w3.org/2000/svg';

// Chart configuration per series
const CHART_CONFIG = {
  cpu: {
    svgId:      'chart-cpu',
    color:      '#00d4ff',
    fillStart:  'rgba(0,212,255,0.25)',
    fillEnd:    'rgba(0,212,255,0.0)',
    gradId:     'grad-cpu',
  },
  memory: {
    svgId:      'chart-mem',
    color:      '#7c6fff',
    fillStart:  'rgba(124,111,255,0.25)',
    fillEnd:    'rgba(124,111,255,0.0)',
    gradId:     'grad-mem',
  },
};

// Grid lines at these % levels
const GRID_LEVELS = [25, 50, 75, 100];

// Internal cache: keeps references to SVG elements per chart
const _charts = {};

/**
 * Initialize both charts by inserting static SVG elements (grid, gradient defs).
 * Called once from main.js at startup.
 */
export function initCharts() {
  for (const [key, cfg] of Object.entries(CHART_CONFIG)) {
    const svg = document.getElementById(cfg.svgId);
    if (!svg) continue;

    // Use a fixed viewBox; CSS will scale via preserveAspectRatio=none
    svg.setAttribute('viewBox', '0 0 300 100');

    // Gradient definition
    const defs = _el('defs');
    const grad = _el('linearGradient');
    grad.id = cfg.gradId;
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');

    const stop1 = _el('stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', cfg.fillStart);

    const stop2 = _el('stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', cfg.fillEnd);

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    // Grid lines
    for (const level of GRID_LEVELS) {
      const y   = 100 - level; // flip: 0% = bottom
      const line = _el('line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(y));
      line.setAttribute('x2', '300');
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', '#1e2530');
      line.setAttribute('stroke-width', '0.5');
      if (level < 100) {
        line.setAttribute('stroke-dasharray', '2 4');
      }
      svg.appendChild(line);

      // Label
      const text = _el('text');
      text.setAttribute('x', '2');
      text.setAttribute('y', String(y - 1));
      text.setAttribute('font-size', '6');
      text.setAttribute('fill', '#3a4557');
      text.setAttribute('font-family', 'IBM Plex Mono, monospace');
      text.textContent = level + '%';
      svg.appendChild(text);
    }

    // Area fill path (dynamic — updated on each render)
    const area = _el('path');
    area.setAttribute('fill', `url(#${cfg.gradId})`);
    area.setAttribute('stroke', 'none');
    svg.appendChild(area);

    // Line path (dynamic)
    const line = _el('path');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', cfg.color);
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-linejoin', 'round');
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);

    _charts[key] = { svg, area, line };
  }
}

/**
 * Render both charts from the current state snapshot.
 * Called on every state notification by main.js.
 *
 * @param {object} snapshot — state snapshot containing history arrays
 */
export function renderCharts(snapshot) {
  _drawChart('cpu',    snapshot.history.cpu);
  _drawChart('memory', snapshot.history.memory);
}

// ── Internal ──

/**
 * Update the SVG paths for one chart.
 * @param {string} key   — 'cpu' | 'memory'
 * @param {number[]} data — array of 0–100 values (oldest first)
 */
function _drawChart(key, data) {
  const chart = _charts[key];
  if (!chart || data.length < 2) return;

  const W = 300, H = 100;
  const n = data.length;

  // Map data points to SVG coords
  // x: spread evenly across width
  // y: flip so 100% = top (y=0), 0% = bottom (y=H)
  const pts = data.map((v, i) => ({
    x: (i / (n - 1)) * W,
    y: H - clamp(v, 0, 100),
  }));

  // Build a smooth cubic bezier path through the points
  const linePath = _smoothPath(pts);

  // Area path: same line + closing rectangle at bottom
  const areaPath = linePath
    + ` L ${pts[pts.length - 1].x},${H} L ${pts[0].x},${H} Z`;

  chart.line.setAttribute('d', linePath);
  chart.area.setAttribute('d', areaPath);
}

/**
 * Generate a smooth SVG path string using catmull-rom → cubic bezier conversion.
 * Produces visually smooth curves without overshooting.
 *
 * @param {{ x: number, y: number }[]} pts
 * @returns {string} SVG path data starting with M
 */
function _smoothPath(pts) {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let d = `M ${r(pts[0].x)} ${r(pts[0].y)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;

    // Catmull-Rom → cubic bezier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${r(cp1x)} ${r(cp1y)}, ${r(cp2x)} ${r(cp2y)}, ${r(p2.x)} ${r(p2.y)}`;
  }

  return d;
}

// ── Utilities ──

/** Create an SVG element. */
function _el(tag) {
  return document.createElementNS(SVG_NS, tag);
}

/** Round to 2 decimal places for clean SVG output. */
function r(n) { return Math.round(n * 100) / 100; }

/** Clamp value to [min, max]. */
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
