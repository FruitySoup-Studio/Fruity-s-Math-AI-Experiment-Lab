/**
 * ai-lab/algorithms/linearRegression.js
 * Ordinary Least Squares via gradient descent with live line fit.
 * Depends on: state.js, utils.js (randn), canvas.js, ui.js (D, updateMetric), dataSystem.js (getDataForAlgo)
 */

function initLR() {
  const noise = parseFloat(document.getElementById('ctrl-noise')?.value || 0.3);
  const raw   = getDataForAlgo('linear_regression');
  let data;
  if (raw && raw.length >= 4) {
    data = raw.map(p => [p.x, p.y]);
    log(`Linear regression: using ${data.length} imported pts`, 'info');
  } else {
    data = Array.from({ length: 50 }, () => {
      const x = (Math.random() - 0.5) * 4;
      return [x, 1.8 * x + 0.5 + randn() * noise * 2];
    });
  }
  LAB.state = { data, theta0: randn(), theta1: randn(), lr: 0.05, loss: Infinity, r2: 0 };
  miniHistory = [];
}

function stepLR() {
  const s = LAB.state, n = s.data.length;
  let g0 = 0, g1 = 0, loss = 0;
  for (const [x, y] of s.data) {
    const e = s.theta1 * x + s.theta0 - y;
    g0 += e; g1 += e * x; loss += e * e;
  }
  g0 /= n; g1 /= n; loss /= (2 * n);
  s.theta0 -= s.lr * g0;
  s.theta1 -= s.lr * g1;
  s.loss = loss;

  // R² coefficient of determination
  const ym  = s.data.reduce((a, [, y]) => a + y, 0) / n;
  const sst = s.data.reduce((a, [, y]) => a + (y - ym) ** 2, 0);
  const ssr = s.data.reduce((a, [x, y]) => a + (y - (s.theta1 * x + s.theta0)) ** 2, 0);
  s.r2 = 1 - ssr / sst;

  miniHistory.push(loss);
  updateMetric('loss',      loss);
  updateMetric('r2',        s.r2.toFixed(4));
  updateMetric('slope',     s.theta1);
  updateMetric('intercept', s.theta0);
  D.statsIter.textContent = `iter ${LAB.iteration}`;
  showLiveEq('\\hat{y}=\\theta_1 x+\\theta_0', `θ₀=${s.theta0.toFixed(3)} θ₁=${s.theta1.toFixed(3)} MSE=${loss.toFixed(4)}`);
  highlightStep(Math.min(5, Math.floor(LAB.iteration / 10)));
  if (LAB.iteration % 10 === 0)
    log(`θ₁=${s.theta1.toFixed(3)} θ₀=${s.theta0.toFixed(3)} MSE=${loss.toFixed(4)} R²=${s.r2.toFixed(3)}`);
}

function drawLR() {
  const ctx = getCtx();
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const s = LAB.state;
  if (!s.data) return;

  // Phase 3 — split: left 78% = scatter + fit, right 22% = residual histogram
  const HIST_W  = Math.floor(w * 0.20);
  const PLOT_W  = w - HIST_W - 8;
  const PAD     = 46;

  const xs = s.data.map(([x]) => x), ys = s.data.map(([, y]) => y);
  const xMin = Math.min(...xs) - 0.4, xMax = Math.max(...xs) + 0.4;
  const yMin = Math.min(...ys) - 0.4, yMax = Math.max(...ys) + 0.4;
  const mX = x => PAD + ((x - xMin) / (xMax - xMin)) * (PLOT_W - 2 * PAD);
  const mY = y => h - PAD - ((y - yMin) / (yMax - yMin)) * (h - 2 * PAD);

  drawAxes(ctx, mX(0), mY(0), PLOT_W, h);

  // Phase 3 — 1σ confidence band around regression line
  const residuals = s.data.map(([x, y]) => y - (s.theta1 * x + s.theta0));
  const sigma     = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / Math.max(1, s.data.length - 2));
  const BAND_PTS  = 60;
  ctx.beginPath();
  for (let i = 0; i <= BAND_PTS; i++) {
    const x  = xMin + (i / BAND_PTS) * (xMax - xMin);
    const yh = s.theta1 * x + s.theta0;
    const py = mY(yh + sigma);
    i === 0 ? ctx.moveTo(mX(x), py) : ctx.lineTo(mX(x), py);
  }
  for (let i = BAND_PTS; i >= 0; i--) {
    const x  = xMin + (i / BAND_PTS) * (xMax - xMin);
    const yh = s.theta1 * x + s.theta0;
    ctx.lineTo(mX(x), mY(yh - sigma));
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(77,232,244,0.08)'; ctx.fill();
  ctx.strokeStyle = 'rgba(77,232,244,0.18)'; ctx.lineWidth = 1; ctx.stroke();

  // 2σ outer band
  ctx.beginPath();
  for (let i = 0; i <= BAND_PTS; i++) {
    const x  = xMin + (i / BAND_PTS) * (xMax - xMin);
    const yh = s.theta1 * x + s.theta0;
    i === 0 ? ctx.moveTo(mX(x), mY(yh + 2 * sigma)) : ctx.lineTo(mX(x), mY(yh + 2 * sigma));
  }
  for (let i = BAND_PTS; i >= 0; i--) {
    const x  = xMin + (i / BAND_PTS) * (xMax - xMin);
    const yh = s.theta1 * x + s.theta0;
    ctx.lineTo(mX(x), mY(yh - 2 * sigma));
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(77,232,244,0.03)'; ctx.fill();

  // Residual lines (colour-coded: red = above, blue = below)
  for (const [x, y] of s.data) {
    const yh  = s.theta1 * x + s.theta0;
    const pos = y > yh;
    ctx.strokeStyle = pos ? 'rgba(248,113,113,0.30)' : 'rgba(77,232,244,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mX(x), mY(y)); ctx.lineTo(mX(x), mY(yh)); ctx.stroke();
  }

  // Data points — colour by residual magnitude
  for (const [x, y] of s.data) {
    const res   = y - (s.theta1 * x + s.theta0);
    const mag   = Math.min(1, Math.abs(res) / (sigma * 2 + 0.01));
    const r     = Math.round(lerp(167, 248, mag));
    const g     = Math.round(lerp(139, 113, mag));
    const bv    = Math.round(lerp(250, 113, mag));
    ctx.beginPath(); ctx.arc(mX(x), mY(y), 5, 0, Math.PI * 2);
    ctx.fillStyle   = `rgba(${r},${g},${bv},0.85)`;
    ctx.strokeStyle = `rgba(${r},${g},${bv},1)`; ctx.lineWidth = 1.5;
    ctx.fill(); ctx.stroke();
  }

  // Regression line (glowing)
  ctx.beginPath();
  ctx.moveTo(mX(xMin), mY(s.theta1 * xMin + s.theta0));
  ctx.lineTo(mX(xMax), mY(s.theta1 * xMax + s.theta0));
  ctx.strokeStyle = '#4de8f4'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(77,232,244,0.25)'; ctx.lineWidth = 8; ctx.stroke();

  // ── Residual histogram (right panel) ──────────────────────────────────
  const HIST_X  = PLOT_W + 8;
  const HIST_BINS = 12;
  const rMin    = Math.min(...residuals), rMax = Math.max(...residuals);
  const rRange  = rMax - rMin + 1e-9;
  const bins    = new Array(HIST_BINS).fill(0);
  for (const r of residuals) {
    const bi = Math.min(HIST_BINS - 1, Math.floor(((r - rMin) / rRange) * HIST_BINS));
    bins[bi]++;
  }
  const maxBin  = Math.max(...bins);
  const bH      = (h - 2 * PAD) / HIST_BINS;

  // Histogram divider line
  ctx.strokeStyle = 'rgba(80,130,255,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(HIST_X - 4, PAD); ctx.lineTo(HIST_X - 4, h - PAD); ctx.stroke();

  // Histogram label
  ctx.fillStyle = 'rgba(77,232,244,0.5)'; ctx.font = 'bold 8px Space Mono,monospace';
  ctx.textAlign = 'center'; ctx.fillText('RESIDUALS', HIST_X + HIST_W / 2, PAD - 6); ctx.textAlign = 'left';

  for (let bi = 0; bi < HIST_BINS; bi++) {
    const frac    = bins[bi] / (maxBin + 1e-9);
    const barW    = frac * (HIST_W - 18);
    const by      = h - PAD - (bi + 1) * bH;
    // Colour: middle bins (near-zero residuals) = green, outer = red
    const dist    = Math.abs(bi - HIST_BINS / 2) / (HIST_BINS / 2);
    const r2      = Math.round(lerp(52, 248, dist));
    const g2      = Math.round(lerp(211, 113, dist));
    const bv2     = Math.round(lerp(153, 113, dist));
    ctx.fillStyle = `rgba(${r2},${g2},${bv2},0.65)`;
    ctx.fillRect(HIST_X, by, barW, bH - 1);
    if (bins[bi] > 0) {
      ctx.fillStyle = 'rgba(232,240,255,0.45)'; ctx.font = '7px Space Mono,monospace';
      ctx.fillText(bins[bi], HIST_X + barW + 2, by + bH / 2 + 3);
    }
  }
  // Zero residual line
  const zeroY = h - PAD - ((0 - rMin) / rRange) * (h - 2 * PAD);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(HIST_X - 4, zeroY); ctx.lineTo(HIST_X + HIST_W, zeroY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '7px Space Mono,monospace';
  ctx.fillText('0', HIST_X + HIST_W - 10, zeroY - 2);

  // σ label
  ctx.fillStyle = 'rgba(77,232,244,0.6)'; ctx.font = '8px Space Mono,monospace';
  ctx.fillText(`σ=${sigma.toFixed(3)}`, HIST_X, h - PAD + 12);

  // Info overlay
  ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(PAD, PAD - 8, 210, 58);
  ctx.fillStyle = '#4de8f4'; ctx.font = 'bold 10px Space Mono,monospace';
  ctx.fillText(`ŷ=${s.theta1.toFixed(3)}x+${s.theta0.toFixed(3)}`, PAD + 7, PAD + 9);
  ctx.fillStyle = '#34d399';
  ctx.fillText(`MSE=${(s.loss || 0).toFixed(5)}  σ=${sigma.toFixed(3)}`, PAD + 7, PAD + 25);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`R²=${(s.r2 || 0).toFixed(4)}  n=${s.data.length}`, PAD + 7, PAD + 42);
}
