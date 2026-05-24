/**
 * ai-lab/core/utils.js
 * Pure math, statistics, and color utilities.
 * No DOM. No state references.
 * Depends on: state.js (none — standalone)
 */

/** Box-Muller Gaussian sample */
function randn() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp   = (a, b, t)   => a + (b - a) * t;
const dist2  = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;
const dist   = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));

const sigmoid = x => 1 / (1 + Math.exp(-x));
const relu    = x => Math.max(0, x);

function softmax(arr) {
  const m = Math.max(...arr);
  const e = arr.map(x => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map(v => v / s);
}

/** Parse a CSS hex color string to [r, g, b] */
function hexRgb(hex = '#4de8f4') {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Return an rgba() string from a hex color and alpha */
function rgbAlpha(hex, a) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Normalize an array of {x, y, label} points to the [-2, 2] range.
 * Label is preserved as-is.
 */
function normalizeXY(pts) {
  if (!pts.length) return pts;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;
  return pts.map(p => ({
    x:     ((p.x - xMin) / xRange) * 4 - 2,
    y:     ((p.y - yMin) / yRange) * 4 - 2,
    label: p.label ?? 0,
  }));
}
