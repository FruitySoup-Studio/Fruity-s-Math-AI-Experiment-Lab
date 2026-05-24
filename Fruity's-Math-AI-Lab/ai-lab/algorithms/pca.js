/**
 * ai-lab/algorithms/pca.js
 * Principal Component Analysis — analytic covariance eigen-decomposition.
 * Depends on: state.js, utils.js (randn), canvas.js, ui.js (D, updateMetric), dataSystem.js (getDataForAlgo)
 */

function initPCA() {
  const raw = getDataForAlgo('pca');
  let data;

  if (raw && raw.length >= 6) {
    data = raw.map(p => [p.x, p.y]);
    log(`PCA: using ${data.length} imported pts`, 'info');
  } else {
    const angle = Math.random() * Math.PI;
    data = Array.from({ length: 80 }, () => {
      const t = randn() * 2;
      return [Math.cos(angle) * t + randn() * 0.3, Math.sin(angle) * t + randn() * 0.3];
    });
  }

  // Center data
  const n = data.length;
  const mx = data.reduce((a, p) => a + p[0], 0) / n;
  const my = data.reduce((a, p) => a + p[1], 0) / n;
  data.forEach(p => { p[0] -= mx; p[1] -= my; });

  // 2×2 covariance matrix
  let cxx = 0, cxy = 0, cyy = 0;
  for (const [x, y] of data) { cxx += x * x; cxy += x * y; cyy += y * y; }
  cxx /= n; cxy /= n; cyy /= n;

  // Analytic eigendecomposition
  const trace = cxx + cyy, det = cxx * cyy - cxy * cxy;
  const disc  = Math.sqrt(Math.max(0, (trace / 2) ** 2 - det));
  const lam1  = trace / 2 + disc;
  const lam2  = trace / 2 - disc;

  let v1 = [1, 0];
  if (Math.abs(cxy) > 1e-8) {
    const nx = lam1 - cyy;
    const d  = Math.sqrt(nx * nx + cxy * cxy);
    v1 = [nx / d, cxy / d];
  }
  const v2 = [-v1[1], v1[0]];

  const tot  = lam1 + lam2 + 1e-9;
  const proj = data.map(([x, y]) => {
    const t = x * v1[0] + y * v1[1];
    return [t * v1[0], t * v1[1]];
  });

  LAB.state = { data, pc1: v1, pc2: v2, var1: lam1 / tot, var2: lam2 / tot, proj };
  miniHistory = [];
}

function stepPCA() {
  const s = LAB.state;
  // Phase 3: animate projection lerp factor (0→1 over ~40 steps)
  s.lerpT = Math.min(1, (s.lerpT || 0) + 0.025);
  miniHistory.push(s.var1 * 100);
  updateMetric('var1',  `${(s.var1 * 100).toFixed(1)}%`);
  updateMetric('var2',  `${(s.var2 * 100).toFixed(1)}%`);
  updateMetric('total', `${(s.var1 * 100).toFixed(1)}%`);
  D.statsIter.textContent = `PC ${(LAB.iteration % 2) + 1}`;
  showLiveEq('Z=XV_k \\quad\\Sigma v_k=\\lambda_k v_k', `PC1=${(s.var1 * 100).toFixed(1)}% PC2=${(s.var2 * 100).toFixed(1)}%`);
  highlightStep(Math.min(5, Math.floor(LAB.iteration / 8)));
  if (LAB.iteration % 10 === 0)
    log(`PC1=${(s.var1 * 100).toFixed(1)}% PC2=${(s.var2 * 100).toFixed(1)}% n=${s.data.length}`);
}
function drawPCA() {
  const ctx = getCtx();
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const s = LAB.state;
  if (!s.data) return;

  const cx = w / 2, cy = h / 2, sc = Math.min(w, h) / 6;
  const t  = s.lerpT ?? 1;   // Phase 3 animation lerp

  drawAxes(ctx, cx, cy, w, h);

  // Animated projection lines (fade in as lerpT grows)
  for (let i = 0; i < s.data.length; i++) {
    const [x, y]  = s.data[i];
    const [px, py] = s.proj[i];
    const lx = lerp(x, px, t), ly = lerp(y, py, t);
    ctx.beginPath();
    ctx.moveTo(cx + x  * sc, cy - y  * sc);
    ctx.lineTo(cx + lx * sc, cy - ly * sc);
    ctx.strokeStyle = `rgba(251,146,60,${t * 0.18})`; ctx.lineWidth = 1; ctx.stroke();
  }

  // Original points
  for (const [x, y] of s.data) {
    ctx.beginPath(); ctx.arc(cx + x * sc, cy - y * sc, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(167,139,250,0.55)'; ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
  }

  // Animated projected points
  for (let i = 0; i < s.data.length; i++) {
    const [x, y]  = s.data[i];
    const [px, py] = s.proj[i];
    const lx = lerp(x, px, t), ly = lerp(y, py, t);
    ctx.beginPath(); ctx.arc(cx + lx * sc, cy - ly * sc, 5, 0, Math.PI * 2);
    ctx.fillStyle   = `rgba(251,146,60,${0.4 + t * 0.5})`;
    ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
  }

  // PC axes with variance-proportional line width + glow
  const len = Math.min(w, h) * 0.38;
  [[s.pc1, '#fb923c', 'PC1', s.var1], [s.pc2, '#4de8f4', 'PC2', s.var2]].forEach(([v, col, lbl, vr]) => {
    const lw = 1.5 + vr * 4;
    // Glow halo
    ctx.beginPath(); ctx.moveTo(cx - v[0] * len, cy + v[1] * len); ctx.lineTo(cx + v[0] * len, cy - v[1] * len);
    ctx.strokeStyle = col === '#fb923c' ? 'rgba(251,146,60,0.18)' : 'rgba(77,232,244,0.18)';
    ctx.lineWidth = lw + 8; ctx.stroke();
    // Main line
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = col; ctx.font = `bold ${10 + Math.round(vr * 4)}px Syne,sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(lbl, cx + v[0] * len + 14 * v[0], cy - v[1] * len - 14 * v[1]);
    ctx.font = '8px Space Mono,monospace';
    ctx.fillText(`${(vr * 100).toFixed(1)}%`, cx + v[0] * len + 14 * v[0], cy - v[1] * len - 14 * v[1] + 12);
  });

  // Phase 3 — Variance ring chart (top-right)
  const pcx = w - 78, pcy = 74, pr = 42;
  const startAngle = -Math.PI / 2;
  // Background ring
  ctx.beginPath(); ctx.arc(pcx, pcy, pr, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(80,130,255,0.12)'; ctx.lineWidth = 10; ctx.stroke();
  // PC1 arc (animated)
  ctx.beginPath(); ctx.arc(pcx, pcy, pr, startAngle, startAngle + Math.PI * 2 * s.var1 * t);
  ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 10; ctx.stroke();
  // PC2 arc (animated, after PC1)
  ctx.beginPath(); ctx.arc(pcx, pcy, pr,
    startAngle + Math.PI * 2 * s.var1,
    startAngle + Math.PI * 2 * (s.var1 + s.var2) * t);
  ctx.strokeStyle = 'rgba(77,232,244,0.65)'; ctx.lineWidth = 10; ctx.stroke();
  // Centre text
  ctx.fillStyle = '#fb923c'; ctx.font = 'bold 11px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${(s.var1 * 100).toFixed(0)}%`, pcx, pcy - 4);
  ctx.fillStyle = 'rgba(139,156,200,0.7)'; ctx.font = '8px Space Mono,monospace';
  ctx.fillText('PC1', pcx, pcy + 10);
  // Legend swatches
  ctx.textAlign = 'left'; ctx.font = '8px Space Mono,monospace';
  ctx.fillStyle = '#fb923c'; ctx.fillRect(pcx - pr - 2, pcy + pr + 8, 8, 8);
  ctx.fillStyle = 'rgba(200,220,255,0.6)'; ctx.fillText('PC1', pcx - pr + 10, pcy + pr + 16);
  ctx.fillStyle = 'rgba(77,232,244,0.65)'; ctx.fillRect(pcx - pr - 2, pcy + pr + 22, 8, 8);
  ctx.fillStyle = 'rgba(200,220,255,0.6)'; ctx.fillText('PC2', pcx - pr + 10, pcy + pr + 30);

  // Info overlay
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(12, 12, 215, 42);
  ctx.fillStyle = '#fb923c'; ctx.font = 'bold 10px Space Mono,monospace';
  ctx.fillText(`PC1: ${(s.var1 * 100).toFixed(1)}% variance explained`, 19, 28);
  ctx.fillStyle = '#4de8f4';
  ctx.fillText(`PC2: ${(s.var2 * 100).toFixed(1)}%  n=${s.data.length}`, 19, 44);
}