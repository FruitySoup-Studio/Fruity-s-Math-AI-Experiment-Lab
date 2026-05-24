/**
 * ai-lab/algorithms/svm.js
 * Support Vector Machine — SMO-lite online update with margin visualization.
 * Depends on: state.js, utils.js (randn), canvas.js, ui.js (D, updateMetric), dataSystem.js (getDataForAlgo)
 */

function initSVM() {
  const kernel = document.getElementById('ctrl-kernel')?.value || 'linear';
  const raw    = getDataForAlgo('svm');
  let data;

  if (raw && raw.length >= 10) {
    data = raw.map(p => [p.x, p.y, p.label && p.label !== 0 ? 1 : -1]);
    log(`SVM: using ${data.length} imported pts`, 'info');
  } else {
    data = Array.from({ length: 60 }, () => {
      const cls = Math.random() < 0.5 ? 1 : -1;
      if (kernel === 'rbf') {
        const r = (Math.random() < 0.5 ? 0.6 : 1.6) + randn() * 0.2;
        const a = Math.random() * Math.PI * 2;
        return [r * Math.cos(a) * cls, r * Math.sin(a), cls];
      }
      return [(Math.random() - 0.5) * 3 + cls * 0.8 + randn() * 0.4, (Math.random() - 0.5) * 3 + randn() * 0.4, cls];
    });
  }

  LAB.state = { data, kernel, w: [0.1, 0.3], b: 0, margin: 0, sv: 0, iter: 0 };
  miniHistory = [];
}

function stepSVM() {
  const s = LAB.state;
  const lr = 0.025;
  s.iter++;

  // Pegasos / online hinge-loss update
  for (const [x1, x2, y] of s.data) {
    const sc = s.w[0] * x1 + s.w[1] * x2 + s.b;
    if (y * sc < 1) { s.w[0] += lr * y * x1; s.w[1] += lr * y * x2; s.b += lr * y; }
  }
  // Weight decay
  s.w[0] *= 0.999; s.w[1] *= 0.999;

  const wn = Math.sqrt(s.w[0] ** 2 + s.w[1] ** 2) + 1e-9;
  s.margin = 2 / wn;
  s.sv     = s.data.filter(([x1, x2, y]) => Math.abs(y * (s.w[0] * x1 + s.w[1] * x2 + s.b) - 1) < 0.5).length;

  miniHistory.push(s.margin);
  updateMetric('margin', s.margin);
  updateMetric('sv',     s.sv);
  updateMetric('iter',   s.iter);
  D.statsIter.textContent = `iter ${s.iter}`;
  showLiveEq('\\text{margin}=\\frac{2}{\\|w\\|}', `w=(${s.w[0].toFixed(3)},${s.w[1].toFixed(3)}) b=${s.b.toFixed(3)} margin=${s.margin.toFixed(3)}`);
  highlightStep(Math.min(5, Math.floor(LAB.iteration / 8)));
  if (LAB.iteration % 8 === 0)
    log(`w=(${s.w[0].toFixed(3)},${s.w[1].toFixed(3)}) margin=${s.margin.toFixed(3)} SVs=${s.sv}`);
}

function drawSVM() {
  const ctx = getCtx();
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const s = LAB.state;
  if (!s.data) return;

  const PAD = 36;
  const mX  = x => PAD + ((x + 3) / 6) * (w - 2 * PAD);
  const mY  = y => h - PAD - ((y + 3) / 6) * (h - 2 * PAD);
  // Inverse maps: pixel → data space
  const iX  = px => ((px - PAD) / (w - 2 * PAD)) * 6 - 3;
  const iY  = py => (1 - (py - PAD) / (h - 2 * PAD)) * 6 - 3;

  // Phase 3 — Full ImageData confidence raster ─────────────────────────────
  // Score function: linear uses w·x+b; RBF uses RBF kernel SVM proxy
  const RBF_GAMMA = 1.2;
  function score(wx, wy) {
    if (s.kernel === 'linear') return s.w[0] * wx + s.w[1] * wy + s.b;
    // RBF proxy: weighted sum of support-vector kernel evaluations
    let sc = s.b;
    for (const [x1, x2, y] of s.data) {
      const d2  = (wx - x1) ** 2 + (wy - x2) ** 2;
      const kv  = Math.exp(-RBF_GAMMA * d2);
      sc += 0.08 * y * kv;          // simplified dual weight
    }
    return sc;
  }

  // Rasterise at half resolution (every 2px) for performance
  const STEP = 2;
  const id   = ctx.createImageData(w, h);
  for (let py = PAD; py < h - PAD; py += STEP) {
    for (let px = PAD; px < w - PAD; px += STEP) {
      const sc    = score(iX(px), iY(py));
      const conf  = Math.tanh(Math.abs(sc) * 0.8);   // 0..1 confidence
      let r, g, b;
      if (sc > 0) {
        // Positive class: cyan tint
        r = Math.round(20  + conf * 40);
        g = Math.round(60  + conf * 140);
        b = Math.round(100 + conf * 130);
      } else {
        // Negative class: red tint
        r = Math.round(80  + conf * 140);
        g = Math.round(20  + conf * 20);
        b = Math.round(30  + conf * 30);
      }
      const alpha = Math.round(conf * 58 + 8);   // 8..66
      // Write 2×2 block
      for (let dy = 0; dy < STEP && py + dy < h; dy++) {
        for (let dx = 0; dx < STEP && px + dx < w; dx++) {
          const idx = ((py + dy) * w + (px + dx)) * 4;
          id.data[idx]     = r;
          id.data[idx + 1] = g;
          id.data[idx + 2] = b;
          id.data[idx + 3] = alpha;
        }
      }
    }
  }
  ctx.putImageData(id, 0, 0);
  // ─────────────────────────────────────────────────────────────────────────

  drawAxes(ctx, mX(0), mY(0), w, h);

  // Decision boundary + margin zone (linear only — already visible via raster for RBF)
  if (s.kernel === 'linear' && Math.abs(s.w[1]) > 1e-6) {
    [-1, 0, 1].forEach((off, i) => {
      const px1 = -3, px2 = 3;
      ctx.beginPath();
      ctx.moveTo(mX(px1), mY((-s.w[0] * px1 - s.b + off) / s.w[1]));
      ctx.lineTo(mX(px2), mY((-s.w[0] * px2 - s.b + off) / s.w[1]));
      if (i === 1) {
        ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2.5; ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(74,222,128,0.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([6, 4]);
      }
      ctx.stroke(); ctx.setLineDash([]);
    });

    // Margin zone fill between the two dashed lines
    if (Math.abs(s.w[1]) > 1e-6) {
      const px1 = -3, px2 = 3;
      const y1a = (-s.w[0] * px1 - s.b + 1) / s.w[1];
      const y2a = (-s.w[0] * px2 - s.b + 1) / s.w[1];
      const y1b = (-s.w[0] * px1 - s.b - 1) / s.w[1];
      const y2b = (-s.w[0] * px2 - s.b - 1) / s.w[1];
      ctx.beginPath();
      ctx.moveTo(mX(px1), mY(y1a)); ctx.lineTo(mX(px2), mY(y2a));
      ctx.lineTo(mX(px2), mY(y2b)); ctx.lineTo(mX(px1), mY(y1b));
      ctx.closePath();
      ctx.fillStyle = 'rgba(74,222,128,0.07)'; ctx.fill();
    }
  }

  // Data points + support vector highlights
  for (const [x1, x2, y] of s.data) {
    const sc   = score(x1, x2);
    const isSV = Math.abs(y * sc - 1) < 0.5;
    const px   = mX(x1), py = mY(x2);

    if (isSV) {
      // Outer glow ring
      const glow = ctx.createRadialGradient(px, py, 6, px, py, 18);
      glow.addColorStop(0, y > 0 ? 'rgba(77,232,244,0.25)' : 'rgba(248,113,113,0.25)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fillStyle = glow; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    ctx.beginPath(); ctx.arc(px, py, isSV ? 8 : 5, 0, Math.PI * 2);
    ctx.fillStyle   = y > 0 ? 'rgba(77,232,244,0.90)' : 'rgba(248,113,113,0.90)';
    ctx.strokeStyle = isSV ? '#fff' : (y > 0 ? '#4de8f4' : '#f87171');
    ctx.lineWidth   = isSV ? 2.5 : 1.2;
    ctx.fill(); ctx.stroke();

    // SV label
    if (isSV) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 8px Space Mono,monospace';
      ctx.textAlign = 'center'; ctx.fillText('SV', px, py - 11); ctx.textAlign = 'left';
    }
  }

  // Confidence colour-scale legend
  const LEG_X = w - PAD - 12, LEG_Y = PAD, LEG_H = 100, LEG_W = 12;
  for (let p = 0; p < LEG_H; p++) {
    const t = 1 - p / LEG_H;   // 1 = top = positive
    const c = t > 0.5
      ? `rgba(${Math.round(20+t*40)},${Math.round(60+t*140)},${Math.round(100+t*130)},0.85)`
      : `rgba(${Math.round(80+(1-t)*140)},${Math.round(20+(1-t)*20)},${Math.round(30+(1-t)*30)},0.85)`;
    ctx.fillStyle = c; ctx.fillRect(LEG_X, LEG_Y + p, LEG_W, 1);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.strokeRect(LEG_X, LEG_Y, LEG_W, LEG_H);
  ctx.fillStyle = 'rgba(139,156,200,0.6)'; ctx.font = '8px Space Mono,monospace';
  ctx.textAlign = 'center';
  ctx.fillText('+', LEG_X + LEG_W / 2, LEG_Y - 3);
  ctx.fillText('-', LEG_X + LEG_W / 2, LEG_Y + LEG_H + 10);
  ctx.textAlign = 'left';

  // Info overlay
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(PAD, PAD - 8, 210, 56);
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 10px Space Mono,monospace';
  ctx.fillText(`Margin: ${(s.margin || 0).toFixed(4)}`, PAD + 7, PAD + 9);
  ctx.fillStyle = '#4de8f4';
  ctx.fillText(`SVs: ${s.sv}  kernel=${s.kernel}`, PAD + 7, PAD + 25);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`n=${s.data.length}  iter=${s.iter}`, PAD + 7, PAD + 41);
}
