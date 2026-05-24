/**
 * ai-lab/algorithms/attention.js
 * Transformer self-attention heatmap with multi-head simulation.
 * Depends on: state.js, utils.js (randn, lerp, softmax), canvas.js, ui.js (D, updateMetric)
 */

function initATT() {
  const seqLen = parseInt(document.getElementById('ctrl-seqlen')?.value || 6);
  const scores  = Array.from({ length: seqLen }, () => Array.from({ length: seqLen }, () => randn()));
  const weights = scores.map(row => softmax(row));
  const tokens  = ['The','cat','sat','on','the','mat','near','that','old','wall','by','the'].slice(0, seqLen);
  LAB.state = {
    seqLen,
    heads:      parseInt(document.getElementById('ctrl-heads')?.value || 2),
    weights,
    tokens,
    activeHead: 0,
    entropy:    0,
    maxAttn:    0,
  };
  miniHistory = [];
}

function stepATT() {
  const s = LAB.state;
  s.activeHead = Math.floor(LAB.iteration / 4) % s.heads;

  // Slowly evolve attention weights
  s.weights = s.weights.map(row => {
    const p = row.map(v => Math.max(0, v + (Math.random() - 0.5) * 0.025));
    const sm = p.reduce((a, b) => a + b, 0);
    return p.map(v => v / sm);
  });

  s.entropy  = s.weights.reduce((sum, row) =>
    sum + row.reduce((s, w) => s - (w > 0 ? w * Math.log(w) : 0), 0) / s.seqLen, 0);
  s.maxAttn = Math.max(...s.weights.flat());

  miniHistory.push(s.entropy);
  updateMetric('entropy', s.entropy);
  updateMetric('maxAttn', s.maxAttn);
  updateMetric('head',    `H${s.activeHead}`);
  D.statsIter.textContent = `head ${s.activeHead}`;
  showLiveEq(
    '\\text{Att}=\\text{softmax}\\!\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)\\!V',
    `n=${s.seqLen} heads=${s.heads} H=${s.entropy.toFixed(3)}`
  );
  highlightStep(Math.min(5, Math.floor(LAB.iteration / 6)));
  if (LAB.iteration % 8 === 0)
    log(`head=${s.activeHead} entropy=${s.entropy.toFixed(3)} maxAttn=${s.maxAttn.toFixed(3)}`);
}

function drawATT() {
  const ctx = getCtx();
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const s = LAB.state;
  if (!s.weights) return;

  const n  = s.seqLen;
  // Phase 3: layout — heatmap left, token flow arcs right
  const cs     = Math.min(Math.floor((Math.min(w * 0.55, h) - 80) / n), 54);
  const sx     = 40, sy = (h - n * cs) / 2;
  const FLOW_X = sx + n * cs + 60;   // x start of flow arc panel

  // ── Heatmap (left panel) ──────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const val = s.weights[i][j], x = sx + j * cs, y = sy + i * cs;
      const r   = Math.floor(lerp(15, 248, val ** 0.5));
      const g   = Math.floor(lerp(25, 80, val));
      const bv  = Math.floor(lerp(80, 72, val));

      ctx.fillStyle = `rgb(${r},${g},${bv})`;
      ctx.fillRect(x, y, cs - 1, cs - 1);
      if (cs > 26) {
        ctx.fillStyle = val > 0.38 ? '#fff' : 'rgba(200,220,255,0.65)';
        ctx.font = '8px Space Mono,monospace'; ctx.textAlign = 'center';
        ctx.fillText(val.toFixed(2), x + cs / 2, y + cs / 2 + 3);
      }
    }
  }

  // Token labels
  ctx.font = 'bold 10px Syne,sans-serif'; ctx.textAlign = 'center';
  s.tokens.forEach((t, j) => {
    ctx.fillStyle = '#4de8f4'; ctx.fillText(t, sx + j * cs + cs / 2, sy - 7);
    ctx.fillStyle = '#a78bfa'; ctx.fillText(t, sx - 8, sy + j * cs + cs / 2 + 3);
  });

  // Colour scale bar
  const scx = sx + n * cs + 10, sh = n * cs;
  for (let p = 0; p < sh; p++) {
    const t = 1 - p / sh;
    const r = Math.floor(lerp(15, 248, t ** 0.5)), g = Math.floor(lerp(25, 80, t)), bv = Math.floor(lerp(80, 72, t));
    ctx.fillStyle = `rgb(${r},${g},${bv})`; ctx.fillRect(scx, sy + p, 10, 1);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(scx, sy, 10, sh);
  ctx.fillStyle = '#8b9cc8'; ctx.font = '7px Space Mono,monospace'; ctx.textAlign = 'left';
  ctx.fillText('1', scx + 12, sy + 7); ctx.fillText('0', scx + 12, sy + sh);

  // ── Phase 3: Animated attention flow arcs (right panel) ──────────────
  if (FLOW_X + 40 < w) {
    const TOK_X  = FLOW_X + 20;
    const TOK_H  = n > 1 ? (h - 80) / (n - 1) : 0;
    const tokY   = i => 40 + i * TOK_H;

    // Panel divider
    ctx.strokeStyle = 'rgba(80,130,255,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(FLOW_X - 10, 20); ctx.lineTo(FLOW_X - 10, h - 20); ctx.stroke();

    // Panel label
    ctx.fillStyle = 'rgba(167,139,250,0.55)'; ctx.font = 'bold 8px Space Mono,monospace';
    ctx.textAlign = 'center'; ctx.fillText('FLOW', TOK_X + (w - TOK_X) / 2, 16);

    // Animated flow arcs: for each (from, to) pair with weight above threshold
    const THRESH = 0.12;
    const ANIM_T = (LAB.iteration % 20) / 20;  // 0..1 animation phase
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const wt = s.weights[i][j];
        if (wt < THRESH) continue;
        const alpha = Math.min(0.75, wt * 1.4);
        const iy = tokY(i), jy = tokY(j);
        // Bezier arc
        const ctrl = TOK_X + 60 + wt * 40;
        ctx.beginPath();
        ctx.moveTo(TOK_X, iy); ctx.bezierCurveTo(ctrl, iy, ctrl, jy, TOK_X, jy);
        ctx.strokeStyle = `rgba(167,139,250,${alpha * 0.35})`;
        ctx.lineWidth = lerp(0.5, 2.5, wt); ctx.stroke();

        // Animated particle along the arc
        const t = (ANIM_T + (i * n + j) / (n * n)) % 1;
        // Cubic bezier position
        const bx = v => {
          const mt = 1 - v;
          return mt*mt*mt*TOK_X + 3*mt*mt*v*ctrl + 3*mt*v*v*ctrl + v*v*v*TOK_X;
        };
        const by = v => {
          const mt = 1 - v;
          return mt*mt*mt*iy + 3*mt*mt*v*iy + 3*mt*v*v*jy + v*v*v*jy;
        };
        const px = bx(t), py = by(t);
        const pAlpha = Math.sin(t * Math.PI) * alpha;
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${pAlpha})`; ctx.fill();
      }
    }

    // Token nodes (right side)
    s.tokens.forEach((tok, i) => {
      const ty = tokY(i);
      // Glow proportional to total attention received
      const received = s.weights.reduce((sum, row) => sum + row[i], 0) / n;
      const glow = ctx.createRadialGradient(TOK_X, ty, 2, TOK_X, ty, 20);
      glow.addColorStop(0, `rgba(167,139,250,${received * 0.6})`);
      glow.addColorStop(1, 'rgba(167,139,250,0)');
      ctx.beginPath(); ctx.arc(TOK_X, ty, 20, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
      ctx.beginPath(); ctx.arc(TOK_X, ty, 8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167,139,250,${0.2 + received * 0.6})`;
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
      // Token label
      ctx.fillStyle = '#e8f0ff'; ctx.font = '9px Space Mono,monospace'; ctx.textAlign = 'left';
      ctx.fillText(tok, TOK_X + 13, ty + 3);
    });
  }

  // Info overlay
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(8, 8, 172, 38);
  ctx.fillStyle = '#f87171'; ctx.font = 'bold 10px Space Mono,monospace';
  ctx.fillText(`Head ${s.activeHead}/${s.heads}  n=${s.seqLen}`, 14, 24);
  ctx.fillStyle = '#4de8f4';
  ctx.fillText(`H=${s.entropy.toFixed(3)}  max=${s.maxAttn.toFixed(3)}`, 14, 38);
}
