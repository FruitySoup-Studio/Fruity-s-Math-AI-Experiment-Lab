/**
 * ai-lab/core/canvas.js
 * Canvas helpers: grid, axes, arrows, mini loss chart, live equation, log, toast.
 * Depends on: state.js (LAB, miniHistory), ui.js (D)
 * Must load after ui.js.
 */

/* ── Main canvas context (resizes to container) ── */
function getCtx() {
  const canvas = D.canvas, wrap = D.canvasArea;
  const w = wrap.clientWidth || 600, h = wrap.clientHeight || 400;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return canvas.getContext('2d');
}

/* ── Background grid ── */
function drawGrid(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(80,130,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 38) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 38) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.restore();
}

/* ── Axis lines with labels ── */
function drawAxes(ctx, cx, cy, w, h, xl = 'x', yl = 'y') {
  ctx.save();
  ctx.strokeStyle = 'rgba(140,160,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy);  ctx.lineTo(w, cy);  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0);  ctx.lineTo(cx, h);  ctx.stroke();
  ctx.fillStyle = 'rgba(140,160,255,0.45)';
  ctx.font = '11px Space Mono,monospace';
  ctx.fillText(xl, w - 16, cy - 5);
  ctx.fillText(yl, cx + 5, 13);
  ctx.restore();
}

/* ── Arrow from (x1,y1) to (x2,y2) ── */
function drawArrow(ctx, x1, y1, x2, y2, color, size = 8) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.translate(x2, y2); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size / 2); ctx.lineTo(-size, size / 2); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* ── Mini loss / metric sparkline ── */
// miniCtx captured after D is defined (D.miniChart exists at this point)
const miniCtx = D.miniChart ? D.miniChart.getContext('2d') : null;

/**
 * drawMiniChart — Phase 3 upgrade.
 * Renders primary metric (miniHistory) as filled area + line.
 * When LAB.chartMode is 'secondary' and LAB.state.secHistory exists,
 * renders that track instead (e.g. accuracy for neural net).
 * Always overlays a dim secondary ghost line when both tracks exist.
 */
function drawMiniChart() {
  if (!miniCtx) return;

  // Decide which history is the primary display track
  const mode    = LAB.chartMode || 'primary';
  const secHist = LAB.state?.secHistory;
  const primary = (mode === 'secondary' && secHist?.length > 1) ? secHist : miniHistory;
  if (primary.length < 2) return;

  const mw = D.miniChart.width  = D.miniChart.parentElement.clientWidth - 20;
  const mh = D.miniChart.height = 120;
  miniCtx.clearRect(0, 0, mw, mh);

  // ── Subtle grid lines ──
  miniCtx.strokeStyle = 'rgba(80,130,255,0.07)';
  miniCtx.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach(t => {
    const y = Math.round(mh * t) + 0.5;
    miniCtx.beginPath(); miniCtx.moveTo(0, y); miniCtx.lineTo(mw, y); miniCtx.stroke();
  });

  // ── Helper to render one track ──
  function renderTrack(vals, color, alpha, dim) {
    const mn = Math.min(...vals) * 0.95;
    const mx = Math.max(...vals) * 1.05 + 1e-9;
    const mapY = v => mh - 8 - (v - mn) / (mx - mn) * (mh - 20);
    const xAt  = i => (i / (vals.length - 1)) * mw;

    if (!dim) {
      // Filled area
      const gr = miniCtx.createLinearGradient(0, 0, 0, mh);
      gr.addColorStop(0, color.replace(')', `,)`).replace('rgb', 'rgba'));
      gr.addColorStop(1, color.replace(')', ',0.01)').replace('rgb', 'rgba'));
      miniCtx.beginPath();
      miniCtx.moveTo(0, mh);
      vals.forEach((v, i) => miniCtx.lineTo(xAt(i), mapY(v)));
      miniCtx.lineTo(mw, mh);
      miniCtx.closePath();
      miniCtx.fillStyle = gr;
      miniCtx.fill();
    }

    // Line
    miniCtx.beginPath();
    vals.forEach((v, i) => i === 0 ? miniCtx.moveTo(xAt(i), mapY(v)) : miniCtx.lineTo(xAt(i), mapY(v)));
    miniCtx.strokeStyle = dim ? color.replace(')', ',0.18)').replace('rgb', 'rgba') : color;
    miniCtx.lineWidth   = dim ? 1 : 1.8;
    miniCtx.stroke();

    if (!dim) {
      // Endpoint glow dot
      const lastX = xAt(vals.length - 1), lastY = mapY(vals[vals.length - 1]);
      const glow = miniCtx.createRadialGradient(lastX, lastY, 1, lastX, lastY, 7);
      glow.addColorStop(0, color.replace(')', ',0.6)').replace('rgb', 'rgba'));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      miniCtx.beginPath(); miniCtx.arc(lastX, lastY, 7, 0, Math.PI * 2);
      miniCtx.fillStyle = glow; miniCtx.fill();
      miniCtx.beginPath(); miniCtx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      miniCtx.fillStyle = color; miniCtx.fill();

      // Latest value
      const latest = vals[vals.length - 1];
      const label  = latest < 0.01 ? latest.toExponential(2) : latest > 100 ? latest.toFixed(0) : latest.toFixed(4);
      miniCtx.fillStyle = color;
      miniCtx.font = 'bold 9px Space Mono,monospace';
      miniCtx.textAlign = 'right';
      miniCtx.fillText(label, mw - 2, 11);
      miniCtx.textAlign = 'left';

      // Trend arrow (last 10 vs first 10)
      if (vals.length >= 20) {
        const recent = vals.slice(-10).reduce((a,b)=>a+b,0)/10;
        const old    = vals.slice(0,10).reduce((a,b)=>a+b,0)/10;
        const arrow  = recent < old * 0.98 ? '▼' : recent > old * 1.02 ? '▲' : '▶';
        const acolor = mode === 'secondary' ? '#34d399' : (arrow === '▼' ? '#34d399' : arrow === '▲' ? '#f87171' : '#8b9cc8');
        miniCtx.fillStyle = acolor;
        miniCtx.font = '9px Space Mono,monospace';
        miniCtx.fillText(arrow, 3, 11);
      }

      // Y-axis ghost labels
      miniCtx.fillStyle = 'rgba(139,156,200,0.38)';
      miniCtx.font = '8px Space Mono,monospace';
      miniCtx.fillText(mx.toFixed(2), 3, 20);
      miniCtx.fillText(mn.toFixed(2), 3, mh - 2);
    }
  }

  // Determine colours based on mode
  const primaryColor = mode === 'secondary' ? '#34d399' : '#4de8f4';

  // Ghost overlay of the other track
  if (mode === 'secondary' && miniHistory.length > 1) {
    renderTrack(miniHistory.slice(-100), '#4de8f4', 0.15, true);
  } else if (mode !== 'secondary' && secHist?.length > 1) {
    renderTrack(secHist.slice(-100), '#34d399', 0.15, true);
  }

  renderTrack(primary.slice(-100), primaryColor, 0.28, false);
}

/* ── Live equation display ── */
function showLiveEq(latex, vals) {
  if (!window.katex) return;
  try { katex.render(latex, D.liveEqDisp, { throwOnError: false, displayMode: true }); }
  catch (e) { D.liveEqDisp.textContent = latex; }
  D.liveEqVals.textContent = vals || '';
}

/* ── Highlight the active algorithm step in the sidebar ── */
function highlightStep(i) {
  document.querySelectorAll('.info-step-item')
    .forEach((el, j) => el.classList.toggle('active-step', j === i));
}

/* ── Append a log entry ── */
function log(msg, type = 'info') {
  const e = document.createElement('div');
  e.className = `log-entry log-${type}`;
  e.textContent = `[${String(LAB.iteration).padStart(4, '0')}] ${msg}`;
  D.logOutput.appendChild(e);
  D.logOutput.scrollTop = D.logOutput.scrollHeight;
  // Keep log bounded
  while (D.logOutput.children.length > 200)
    D.logOutput.removeChild(D.logOutput.firstChild);
}

/* ── Toast notification ── */
let toastTimer;
function toast(msg) {
  D.toast.textContent = msg;
  D.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => D.toast.classList.remove('show'), 2400);
}
