/**
 * ai-lab/algorithms/gradientDescent.js
 * Gradient Descent on a 2D loss landscape.
 * Depends on: state.js, utils.js (clamp, randn), canvas.js (getCtx, drawGrid, drawAxes, drawArrow, showLiveEq, highlightStep, log), ui.js (D, updateMetric)
 */

function lossGD(x, y) {
  return (1 - x) ** 2 + 2 * (y - x * x) ** 2 + 0.04 * Math.sin(3 * x) * Math.cos(3 * y);
}

function gradGD(x, y) {
  const e = 1e-4;
  return [
    (lossGD(x + e, y) - lossGD(x - e, y)) / (2 * e),
    (lossGD(x, y + e) - lossGD(x, y - e)) / (2 * e),
  ];
}

function initGD() {
  const lr = parseFloat(document.getElementById('ctrl-lr')?.value || 0.05);
  LAB.state = {
    theta:    [Math.random() * 6 - 3, Math.random() * 6 - 3],
    lr,
    path:     [],
    loss:     Infinity,
    gradNorm: 0,
  };
  LAB.state.path.push([...LAB.state.theta]);
  miniHistory = [];
}

function stepGD() {
  const s = LAB.state;
  const [gx, gy] = gradGD(s.theta[0], s.theta[1]);
  s.theta[0] = clamp(s.theta[0] - s.lr * gx, -4, 4);
  s.theta[1] = clamp(s.theta[1] - s.lr * gy, -4, 4);
  s.path.push([...s.theta]);
  if (s.path.length > 120) s.path.shift();
  s.loss     = lossGD(s.theta[0], s.theta[1]);
  s.gradNorm = Math.sqrt(gx * gx + gy * gy);
  miniHistory.push(s.loss);
  updateMetric('loss', s.loss);
  updateMetric('grad', s.gradNorm);
  updateMetric('theta0', s.theta[0]);
  updateMetric('theta1', s.theta[1]);
  D.statsIter.textContent = `iter ${LAB.iteration}`;
  showLiveEq(
    '\\theta_{t+1}=\\theta_t-\\alpha\\nabla\\mathcal{L}',
    `α=${s.lr.toFixed(3)} ‖∇L‖=${s.gradNorm.toFixed(4)} L=${s.loss.toFixed(4)}`
  );
  highlightStep(Math.min(4, Math.floor(LAB.iteration / 5)));
  if (LAB.iteration % 8 === 0)
    log(`θ=(${s.theta[0].toFixed(3)},${s.theta[1].toFixed(3)}) L=${s.loss.toFixed(5)}`);
}

function drawGD() {
  const ctx = getCtx();
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const PAD  = 28;
  const STEP = 2;          // raster step — 2px for performance
  const mapX = x => PAD + ((x + 4) / 8) * (w - 2 * PAD);
  const mapY = y => h - PAD - ((y + 4) / 8) * (h - 2 * PAD);
  const iX   = px => -4 + ((px - PAD) / (w - 2 * PAD)) * 8;
  const iY   = py => -4 + ((h - PAD - py) / (h - 2 * PAD)) * 8;

  // Phase 3 — full ImageData heatmap at STEP resolution
  const id = ctx.createImageData(w, h);
  for (let py = PAD; py < h - PAD; py += STEP) {
    for (let px = PAD; px < w - PAD; px += STEP) {
      const lv = lossGD(iX(px), iY(py));
      const t  = Math.min(1, lv / 8);
      const r  = Math.round(lerp(20,  220, t));
      const g  = Math.round(lerp(180,  70, t));
      const bv = Math.round(lerp(210,  70, t));
      for (let dy = 0; dy < STEP && py + dy < h; dy++) {
        for (let dx = 0; dx < STEP && px + dx < w; dx++) {
          const idx = ((py + dy) * w + (px + dx)) * 4;
          id.data[idx]     = r;
          id.data[idx + 1] = g;
          id.data[idx + 2] = bv;
          id.data[idx + 3] = 220;
        }
      }
    }
  }
  ctx.putImageData(id, 0, 0);

  // Phase 3 — contour lines at fixed loss levels
  const LEVELS = [0.3, 0.8, 1.6, 2.8, 4.5, 6.5];
  LEVELS.forEach((lv, li) => {
    ctx.beginPath();
    let first = true;
    const cSteps = 80;
    // Marching-squares lite: sample rows and connect iso-crossings
    for (let ci = 0; ci <= cSteps; ci++) {
      const wx = -4 + (ci / cSteps) * 8;
      let prev = null;
      for (let cj = 0; cj <= cSteps; cj++) {
        const wy  = -4 + (cj / cSteps) * 8;
        const cur = lossGD(wx, wy);
        if (prev !== null && ((prev < lv && cur >= lv) || (prev >= lv && cur < lv))) {
          const frac = (lv - prev) / (cur - prev + 1e-9);
          const cy   = -4 + ((cj - 1 + frac) / cSteps) * 8;
          const sx   = mapX(wx), sy = mapY(cy);
          if (first) { ctx.moveTo(sx, sy); first = false; } else { ctx.lineTo(sx, sy); }
        }
        prev = cur;
      }
    }
    const alpha = lerp(0.55, 0.18, li / LEVELS.length);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth   = li === 0 ? 1.5 : 0.8;
    ctx.stroke();
    // Level label
    if (!first) {
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.font = '8px Space Mono,monospace'; ctx.textAlign = 'left';
      ctx.fillText(lv.toFixed(1), PAD + 4 + li * 28, h - PAD - 4);
    }
  });

  drawAxes(ctx, mapX(0), mapY(0), w, h, 'θ₀', 'θ₁');

  // Optimal marker (θ*)
  const [ox, oy] = [mapX(0.8), mapY(0.64)];
  const starGlow = ctx.createRadialGradient(ox, oy, 2, ox, oy, 18);
  starGlow.addColorStop(0, 'rgba(255,255,255,0.5)');
  starGlow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(ox, oy, 18, 0, Math.PI * 2); ctx.fillStyle = starGlow; ctx.fill();
  ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Space Mono,monospace';
  ctx.fillText('θ*', ox + 10, oy + 4);

  const s = LAB.state;

  // Phase 3 — glowing trail: gradient opacity from oldest to newest
  if (s.path && s.path.length > 1) {
    const trail = s.path;
    for (let i = 1; i < trail.length; i++) {
      const t     = i / trail.length;
      const alpha = lerp(0.06, 0.85, t);
      const lw    = lerp(0.8, 2.5, t);
      ctx.beginPath();
      ctx.moveTo(mapX(trail[i - 1][0]), mapY(trail[i - 1][1]));
      ctx.lineTo(mapX(trail[i][0]),     mapY(trail[i][1]));
      ctx.strokeStyle = `rgba(255,230,60,${alpha})`;
      ctx.lineWidth   = lw;
      ctx.stroke();
    }
  }

  // Current position + gradient arrow
  if (s.theta) {
    const px = mapX(s.theta[0]), py = mapY(s.theta[1]);
    const [gx, gy] = gradGD(s.theta[0], s.theta[1]);
    // Gradient arrow (negated = descent direction)
    drawArrow(ctx, px, py, px - gx * 16, py + gy * 16, '#f87171', 7);
    // Position glow
    const posGlow = ctx.createRadialGradient(px, py, 3, px, py, 22);
    posGlow.addColorStop(0, 'rgba(255,224,77,0.65)');
    posGlow.addColorStop(1, 'rgba(255,224,77,0)');
    ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); ctx.fillStyle = posGlow; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe04d'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  // Info overlay
  ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(PAD, PAD, 172, 54);
  ctx.fillStyle = '#4de8f4'; ctx.font = 'bold 10px Space Mono,monospace';
  ctx.fillText(`L=${(s.loss || 0).toFixed(5)}`, PAD + 8, PAD + 17);
  ctx.fillStyle = '#f472b6';
  ctx.fillText(`‖∇L‖=${(s.gradNorm || 0).toFixed(5)}`, PAD + 8, PAD + 33);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`Iter=${LAB.iteration}`, PAD + 8, PAD + 49);
}
