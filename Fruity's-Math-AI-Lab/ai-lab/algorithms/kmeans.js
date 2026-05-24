/**
 * ai-lab/algorithms/kmeans.js
 * K-Means clustering with K-Means++ initialization and Voronoi tinting.
 * Depends on: state.js, utils.js (randn, dist2, dist, hexRgb, rgbAlpha), canvas.js, ui.js (D, updateMetric), dataSystem.js (getDataForAlgo)
 */

// Cluster color palette — one color per centroid
const KC = ['#4de8f4','#f472b6','#34d399','#fbbf24','#a78bfa','#f87171','#60a5fa','#fb923c'];

function initKM() {
  const K   = parseInt(document.getElementById('ctrl-k')?.value || 3);
  const raw = getDataForAlgo('kmeans');
  let pts;

  if (raw && raw.length >= K * 3) {
    pts = raw.map(p => [p.x, p.y]);
    log(`K-Means: using ${pts.length} imported pts`, 'info');
  } else {
    pts = [];
    for (let k = 0; k < K; k++) {
      const cx = (Math.random() - 0.5) * 3, cy = (Math.random() - 0.5) * 3;
      for (let i = 0; i < 18; i++) pts.push([cx + randn() * 0.55, cy + randn() * 0.55]);
    }
  }

  // K-Means++ centroid initialization
  const cents = [];
  cents.push(pts[Math.floor(Math.random() * pts.length)].slice());
  while (cents.length < K) {
    const d = pts.map(p => Math.min(...cents.map(c => dist2(p[0], p[1], c[0], c[1]))));
    const s = d.reduce((a, b) => a + b, 0);
    let r = Math.random() * s;
    for (let i = 0; i < pts.length; i++) {
      r -= d[i];
      if (r <= 0) { cents.push(pts[i].slice()); break; }
    }
    // Safety: ensure we always reach K
    if (cents.length < K && cents.length === K - 1)
      cents.push(pts[Math.floor(Math.random() * pts.length)].slice());
  }

  LAB.state = { pts, cents, labels: new Array(pts.length).fill(0), K, inertia: Infinity, moved: 0 };
  miniHistory = [];
}

function stepKM() {
  const s = LAB.state;

  // Assignment step
  s.labels = s.pts.map(p => {
    let b = 0, bd = Infinity;
    s.cents.forEach((c, k) => { const d = dist2(p[0], p[1], c[0], c[1]); if (d < bd) { bd = d; b = k; } });
    return b;
  });

  // Update step
  let moved = 0;
  s.cents = s.cents.map((_, k) => {
    const cl = s.pts.filter((_, i) => s.labels[i] === k);
    if (!cl.length) return s.cents[k];
    const nx = cl.reduce((a, p) => a + p[0], 0) / cl.length;
    const ny = cl.reduce((a, p) => a + p[1], 0) / cl.length;
    moved += dist(nx, ny, s.cents[k][0], s.cents[k][1]);
    return [nx, ny];
  });
  s.moved = moved;

  // Inertia (WCSS)
  s.inertia = s.pts.reduce((sum, p, i) =>
    sum + dist2(p[0], p[1], s.cents[s.labels[i]][0], s.cents[s.labels[i]][1]), 0);

  miniHistory.push(s.inertia);
  updateMetric('inertia', s.inertia);
  updateMetric('moved',   s.moved);
  updateMetric('iter',    LAB.iteration);
  D.statsIter.textContent = `iter ${LAB.iteration}`;
  showLiveEq('\\mu_k=\\frac{1}{|C_k|}\\sum_{i\\in C_k}x_i', `K=${s.K} inertia=${s.inertia.toFixed(2)} Δμ=${s.moved.toFixed(4)}`);
  highlightStep(Math.min(5, LAB.iteration < 1 ? 0 : LAB.iteration < 4 ? 2 : 3));
  if (LAB.iteration % 5 === 0)
    log(`iter=${LAB.iteration} inertia=${s.inertia.toFixed(2)} Δ=${s.moved.toFixed(5)}`);
}

function drawKM() {
  const ctx = getCtx();
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const s = LAB.state;
  if (!s.pts) return;

  const PAD  = 36;
  const allX = s.pts.map(p => p[0]), allY = s.pts.map(p => p[1]);
  const xMin = Math.min(...allX) - 0.25, xMax = Math.max(...allX) + 0.25;
  const yMin = Math.min(...allY) - 0.25, yMax = Math.max(...allY) + 0.25;
  const mX = x => PAD + ((x - xMin) / (xMax - xMin)) * (w - 2 * PAD);
  const mY = y => h - PAD - ((y - yMin) / (yMax - yMin)) * (h - 2 * PAD);

  drawAxes(ctx, mX(0), mY(0), w, h);

  // Voronoi background tint (2×2 pixel blocks for performance)
  const id = ctx.createImageData(w, h);
  for (let px = 0; px < w; px += 2) {
    for (let py = 0; py < h; py += 2) {
      const wx = xMin + ((px - PAD) / (w - 2 * PAD)) * (xMax - xMin);
      const wy = yMin + ((h - PAD - py) / (h - 2 * PAD)) * (yMax - yMin);
      let b = 0, bd = Infinity;
      s.cents.forEach((c, k) => { const d = dist2(wx, wy, c[0], c[1]); if (d < bd) { bd = d; b = k; } });
      const [r, g, bv] = hexRgb(KC[b % KC.length]);
      const i = (py * w + px) * 4;
      id.data[i] = r; id.data[i + 1] = g; id.data[i + 2] = bv; id.data[i + 3] = 18;
    }
  }
  ctx.putImageData(id, 0, 0);

  // Data points
  s.pts.forEach((p, i) => {
    const col = KC[s.labels[i] % KC.length];
    ctx.beginPath(); ctx.arc(mX(p[0]), mY(p[1]), 5, 0, Math.PI * 2);
    ctx.fillStyle = rgbAlpha(col, 0.8); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
  });

  // Centroids
  s.cents.forEach((c, k) => {
    const col = KC[k % KC.length], cx = mX(c[0]), cy = mY(c[1]);
    const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
    grd.addColorStop(0, rgbAlpha(col, 0.55)); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
    // Crosshair
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13);
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = '#000'; ctx.font = 'bold 9px Syne,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(k + 1, cx, cy + 3);
  });

  // Info overlay
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.58)'; ctx.fillRect(PAD, PAD - 8, 196, 40);
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 10px Space Mono,monospace'; ctx.fillText(`Inertia: ${(s.inertia || 0).toFixed(2)}`,              PAD + 7, PAD + 9);
  ctx.fillStyle = '#4de8f4';                                                ctx.fillText(`K=${s.K}  n=${s.pts.length}  Iter=${LAB.iteration}`, PAD + 7, PAD + 26);
}
