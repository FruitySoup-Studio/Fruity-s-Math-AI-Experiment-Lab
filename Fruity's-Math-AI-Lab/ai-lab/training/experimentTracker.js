/**
 * ai-lab/training/experimentTracker.js
 * Saves and loads experiment results to/from localStorage.
 * Each experiment is stored under key 'ailab_exp_{timestamp}'.
 * Foundation for Phase 5 comparison and discovery systems.
 *
 * No DOM dependencies at module level — all DOM access is on-demand.
 */

const ExperimentTracker = (() => {
  const PREFIX   = 'ailab_exp_';
  const MAX_EXPS = 50;   // cap to avoid filling localStorage

  /* ── Save a completed experiment ── */
  function save(exp) {
    try {
      const key  = PREFIX + Date.now();
      const data = {
        id:          key,
        timestamp:   new Date().toISOString(),
        algo:        exp.algo        ?? 'unknown',
        mode:        exp.mode        ?? 'simulate',
        config:      exp.config      ?? {},
        finalLoss:   exp.finalLoss   ?? null,
        finalAcc:    exp.finalAcc    ?? null,
        epochs:      exp.epochs      ?? null,
        lossHistory: (exp.lossHistory ?? []).slice(-200),  // cap to 200 points
      };
      localStorage.setItem(key, JSON.stringify(data));
      pruneOld();
      log(`Experiment saved: ${data.algo} (${data.mode}) — acc=${data.finalAcc?.toFixed(1) ?? '?'}%`, 'success');
      return key;
    } catch (e) {
      log(`Experiment save failed: ${e.message}`, 'error');
      return null;
    }
  }

  /* ── List all saved experiments, newest first ── */
  function list() {
    const exps = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith(PREFIX)) continue;
      try {
        exps.push(JSON.parse(localStorage.getItem(key)));
      } catch { /* skip corrupt entries */ }
    }
    return exps.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /* ── Load a single experiment by key ── */
  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  /* ── Delete a single experiment ── */
  function remove(key) {
    localStorage.removeItem(key);
  }

  /* ── Clear all experiments ── */
  function clear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    log(`Cleared ${keys.length} saved experiments`, 'info');
  }

  /* ── Prune oldest entries if over MAX_EXPS ── */
  function pruneOld() {
    const all = list();
    if (all.length > MAX_EXPS) {
      all.slice(MAX_EXPS).forEach(e => localStorage.removeItem(e.id));
    }
  }

  /* ── Render experiment history panel into a DOM element ── */
  function renderPanel(containerEl) {
    if (!containerEl) return;
    const exps = list();
    if (!exps.length) {
      containerEl.innerHTML = '<div class="exp-empty">No saved experiments yet.<br>Run a TF.js or WebSocket training session to record one.</div>';
      return;
    }
    containerEl.innerHTML = exps.map(e => `
      <div class="exp-row" data-key="${e.id}">
        <div class="exp-row-header">
          <span class="exp-algo-badge">${e.algo.replace('_', ' ')}</span>
          <span class="exp-mode-badge ${e.mode}">${e.mode}</span>
          <span class="exp-time">${new Date(e.timestamp).toLocaleString()}</span>
        </div>
        <div class="exp-row-metrics">
          ${e.finalLoss  != null ? `<span class="exp-metric loss">Loss <strong>${e.finalLoss.toFixed(4)}</strong></span>` : ''}
          ${e.finalAcc   != null ? `<span class="exp-metric acc">Acc <strong>${e.finalAcc.toFixed(1)}%</strong></span>` : ''}
          ${e.epochs     != null ? `<span class="exp-metric ep">Ep <strong>${e.epochs}</strong></span>` : ''}
        </div>
        <div class="exp-row-actions">
          <button class="exp-btn load-btn" data-key="${e.id}">Load</button>
          <button class="exp-btn del-btn"  data-key="${e.id}">✕</button>
        </div>
      </div>`).join('');

    // Wire load / delete buttons
    containerEl.querySelectorAll('.load-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const exp = load(btn.dataset.key);
        if (exp) {
          miniHistory = exp.lossHistory || [];
          log(`Loaded experiment: ${exp.algo} (${exp.mode})  Loss=${exp.finalLoss?.toFixed(4)}`, 'info');
          toast(`Experiment loaded`);
          drawFrame();
        }
      });
    });
    containerEl.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        remove(btn.dataset.key);
        renderPanel(containerEl);
      });
    });
  }

  /* ── Compare up to 3 experiments side-by-side ── */
  function compare(keys) {
    const exps = keys.map(k => load(k)).filter(Boolean);
    if (exps.length < 2) { toast('Select at least 2 experiments to compare'); return null; }
    return exps;
  }

  /* ── Render a comparison mini-chart onto a canvas element ── */
  function renderComparePanel(containerEl) {
    if (!containerEl) return;
    const exps = list().slice(0, 6);   // compare up to 6
    if (exps.length < 2) {
      containerEl.innerHTML = '<div class="exp-empty">Save at least 2 experiments to compare curves.</div>';
      return;
    }

    const COLORS = ['#4de8f4','#f472b6','#34d399','#fbbf24','#a78bfa','#f87171'];
    const H = 110, W = containerEl.clientWidth || 240;

    containerEl.innerHTML = `
      <canvas id="compare-canvas" width="${W}" height="${H}" style="width:100%;display:block;"></canvas>
      <div class="compare-legend" id="compare-legend"></div>`;

    const canvas = document.getElementById('compare-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = 'rgba(10,14,30,0.9)'; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(80,130,255,0.07)'; ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(t => {
      const y = Math.round(H * t);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    });

    // Find global min/max across all loss histories
    const allVals = exps.flatMap(e => e.lossHistory || []).filter(v => isFinite(v));
    if (!allVals.length) return;
    const gMin = Math.min(...allVals) * 0.95;
    const gMax = Math.max(...allVals) * 1.05 + 1e-9;
    const mapY  = v => H - 8 - ((v - gMin) / (gMax - gMin)) * (H - 16);

    // Plot each curve
    exps.forEach((exp, ci) => {
      const vals = (exp.lossHistory || []).slice(-100);
      if (vals.length < 2) return;
      const col = COLORS[ci % COLORS.length];
      ctx.beginPath();
      vals.forEach((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        i === 0 ? ctx.moveTo(x, mapY(v)) : ctx.lineTo(x, mapY(v));
      });
      ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.stroke();

      // End-point dot
      const lastX = W, lastY = mapY(vals[vals.length - 1]);
      ctx.beginPath(); ctx.arc(lastX - 2, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
    });

    // Legend
    const leg = document.getElementById('compare-legend');
    if (leg) {
      leg.innerHTML = exps.map((e, ci) => `
        <span class="cmp-entry" style="color:${COLORS[ci % COLORS.length]}">
          ■ ${e.algo.replace('_',' ')} ${e.mode}
          <strong>${e.finalLoss?.toFixed(3) ?? '?'}</strong>
        </span>`).join('');
    }
  }

  return { save, list, load, remove, clear, renderPanel, compare, renderComparePanel };
})();
