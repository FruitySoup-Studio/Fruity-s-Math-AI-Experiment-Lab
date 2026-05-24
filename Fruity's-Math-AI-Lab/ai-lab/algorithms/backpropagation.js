/**
 * ai-lab/algorithms/backpropagation.js
 * Backpropagation visualization with animated gradient flow.
 * IMPORTANT: Depends on forwardNN defined in neuralNetwork.js.
 * Must load AFTER neuralNetwork.js.
 * Also depends on: state.js, utils.js (randn, lerp), canvas.js, ui.js (D, updateMetric)
 */

function initBP() {
  const depth = parseInt(document.getElementById('ctrl-depth')?.value || 3);
  const sizes = [3, ...Array(depth - 1).fill(4), 2];
  LAB.state = {
    sizes,
    weights: sizes.slice(0, -1).map((s, i) =>
      Array.from({ length: sizes[i + 1] }, () =>
        Array.from({ length: s }, () => randn() * 0.5)
      )
    ),
    activations:  null,
    currentLayer: depth,
    loss:         2.0,
    phase:        'forward',
    gradNorm:     0,
  };
  miniHistory = [];
}

function stepBP() {
  const s = LAB.state;
  // forwardNN is defined in neuralNetwork.js (loads before this file)
  s.activations = forwardNN(
    Array.from({ length: s.sizes[0] }, () => randn()),
    s.weights,
    'relu'
  );

  if (s.phase === 'forward') {
    s.currentLayer = s.sizes.length - 1;
    s.phase = 'backward';
    s.loss  = Math.max(0.01, s.loss * 0.991 + (Math.random() - 0.5) * 0.025);
    highlightStep(0);
  } else {
    s.currentLayer = Math.max(0, s.currentLayer - 1);
    if (s.currentLayer === 0) {
      s.phase = 'forward';
      highlightStep(5);
    } else {
      highlightStep(s.sizes.length - s.currentLayer);
    }
  }

  s.gradNorm = Math.random() * 2 * s.loss;
  miniHistory.push(s.loss);
  // Phase 3: secondary track = gradient norm
  if (!s.secHistory) s.secHistory = [];
  s.secHistory.push(s.gradNorm);
  LAB.state.secHistory = s.secHistory;
  updateMetric('loss',      s.loss);
  updateMetric('grad_norm', s.gradNorm);
  updateMetric('layer',     `L${s.currentLayer}`);
  D.statsIter.textContent = s.phase;
  showLiveEq(
    '\\delta^{(l)}=(W^{(l+1)})^T\\delta^{(l+1)}\\odot\\sigma\'(z^{(l)})',
    `phase=${s.phase} L=${s.currentLayer} ‖δ‖=${s.gradNorm.toFixed(3)}`
  );
  if (LAB.iteration % 8 === 0)
    log(`${s.phase}: layer ${s.currentLayer}  loss=${s.loss.toFixed(4)}`);
}

function drawBP() {
  const ctx = getCtx();
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const s = LAB.state;
  if (!s.sizes) return;

  const PAD = 36, lc = s.sizes.length, xS = (w - 2 * PAD) / (lc - 1);
  const isActive  = l => s.phase === 'backward' ? l >= s.currentLayer : l <= s.currentLayer;
  const isCurConn = l => s.phase === 'backward' && l === s.currentLayer - 1;

  // Phase 3 Connections — multi-particle gradient streams on active backward edges
  // Gradient magnitude ∝ loss; used to vary edge brightness
  const gradScale = clamp(s.gradNorm / (s.loss + 0.01), 0.2, 2.0);
  for (let l = 0; l < lc - 1; l++) {
    const x1 = PAD + l * xS, x2 = PAD + (l + 1) * xS;
    const n1 = s.sizes[l], n2 = s.sizes[l + 1];
    const active = isActive(l), isCur = isCurConn(l);
    for (let i = 0; i < n1; i++) {
      for (let j = 0; j < n2; j++) {
        const y1 = h / 2 + (i - (n1 - 1) / 2) * Math.min(40, (h - 80) / n1);
        const y2 = h / 2 + (j - (n2 - 1) / 2) * Math.min(40, (h - 80) / n2);
        if (isCur) {
          // Edge line — brightness ∝ gradient norm
          const edgeAlpha = clamp(0.35 + gradScale * 0.25, 0.35, 0.85);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(244,114,182,${edgeAlpha})`;
          ctx.lineWidth = clamp(1 + gradScale * 0.8, 1, 3); ctx.stroke();

          // 4 staggered particles flowing x2→x1 (backward)
          const period = 10;
          for (let p = 0; p < 4; p++) {
            const phase = ((LAB.iteration + p * (period / 4)) % period) / period;
            const ax = lerp(x2, x1, phase);
            const ay = lerp(y2, y1, phase);
            const pAlpha = Math.sin(phase * Math.PI) * 0.9 + 0.1;
            const pRadius = 2.5 + gradScale * 0.8;
            // Glow halo
            const glow = ctx.createRadialGradient(ax, ay, 0, ax, ay, pRadius * 3);
            glow.addColorStop(0, `rgba(244,114,182,${pAlpha * 0.6})`);
            glow.addColorStop(1, 'rgba(244,114,182,0)');
            ctx.beginPath(); ctx.arc(ax, ay, pRadius * 3, 0, Math.PI * 2);
            ctx.fillStyle = glow; ctx.fill();
            // Core dot
            ctx.beginPath(); ctx.arc(ax, ay, clamp(pRadius, 1.5, 4), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(244,114,182,${pAlpha})`; ctx.fill();
          }
        } else {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.strokeStyle = active ? 'rgba(77,232,244,0.22)' : 'rgba(80,100,160,0.08)';
          ctx.lineWidth   = active ? 1 : 0.7;
          ctx.stroke();
        }
      }
    }
  }

  // Neurons
  for (let l = 0; l < lc; l++) {
    const x = PAD + l * xS, n = s.sizes[l], active = isActive(l), isCur = l === s.currentLayer;
    for (let i = 0; i < n; i++) {
      const y = h / 2 + (i - (n - 1) / 2) * Math.min(40, (h - 80) / n), r = isCur ? 18 : 13;
      if (isCur) {
        ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(244,114,182,0.45)'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle   = active ? (isCur ? 'rgba(244,114,182,0.38)' : 'rgba(77,232,244,0.18)') : 'rgba(50,60,100,0.28)';
      ctx.strokeStyle = isCur ? '#f472b6' : active ? '#4de8f4' : '#3a4570';
      ctx.lineWidth   = isCur ? 2.5 : 1.5;
      ctx.fill(); ctx.stroke();
      const av = s.activations?.[l]?.[i] ?? 0;
      ctx.fillStyle = active ? '#e8f0ff' : '#4a5680';
      ctx.font = '8px Space Mono,monospace'; ctx.textAlign = 'center'; ctx.fillText(av.toFixed(2), x, y + 3);
    }
  }

  // Phase 3: phase label + gradient norm readout
  ctx.textAlign = 'center';
  if (s.phase === 'backward' && s.currentLayer > 0) {
    ctx.fillStyle = 'rgba(244,114,182,0.9)'; ctx.font = 'bold 13px Syne,sans-serif';
    ctx.fillText('← gradient flow', w / 2, 20);
    // Gradient norm badge
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(w / 2 - 72, 26, 144, 18);
    ctx.fillStyle = 'rgba(244,114,182,0.8)'; ctx.font = '9px Space Mono,monospace';
    ctx.fillText(`‖∇W‖ = ${(s.gradNorm || 0).toFixed(4)}  scale = ${gradScale.toFixed(2)}×`, w / 2, 38);
  } else {
    ctx.fillStyle = 'rgba(77,232,244,0.9)'; ctx.font = 'bold 13px Syne,sans-serif';
    ctx.fillText('→ forward pass', w / 2, 20);
  }
  ctx.textAlign = 'left';
}
