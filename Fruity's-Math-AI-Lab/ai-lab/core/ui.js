/**
 * ai-lab/core/ui.js
 * All DOM element references, UI builders, and selectAlgo.
 * Depends on: state.js (LAB, miniHistory), ai-lab-data.js (AI_ALGORITHMS, ALGO_ORDER)
 * Must load after state.js. Must load before canvas.js and dataSystem.js.
 *
 * NOTE: D is populated at parse time. This is safe because ui.js loads at
 * the bottom of <body> — the DOM is fully parsed before any script here runs.
 */

/* ── DOM element references ── */
const D = {
  tabs:            document.getElementById('algo-tabs'),
  infoIcon:        document.getElementById('info-icon'),
  infoName:        document.getElementById('info-name'),
  infoFamily:      document.getElementById('info-family'),
  infoDesc:        document.getElementById('info-desc'),
  infoMath:        document.getElementById('info-math'),
  infoSteps:       document.getElementById('info-steps'),
  infoApps:        document.getElementById('info-apps'),
  infoComplex:     document.getElementById('info-complexity'),
  vizTitle:        document.getElementById('viz-title'),
  vizControls:     document.getElementById('viz-controls'),
  vizWelcome:      document.getElementById('viz-welcome'),
  canvasArea:      document.getElementById('canvas-area'),
  canvas:          document.getElementById('main-canvas'),
  liveEqBar:       document.getElementById('live-eq-bar'),
  liveEqDisp:      document.getElementById('live-eq-display'),
  liveEqVals:      document.getElementById('live-eq-values'),
  metricCards:     document.getElementById('metric-cards'),
  miniChartW:      document.getElementById('mini-chart-wrap'),
  miniChart:       document.getElementById('mini-chart'),
  miniLabel:       document.getElementById('mini-chart-label'),
  statsIter:       document.getElementById('stats-iteration'),
  logOutput:       document.getElementById('log-output'),
  btnPlay:         document.getElementById('btn-play'),
  btnReset:        document.getElementById('btn-reset'),
  btnStep:         document.getElementById('btn-step'),
  btnLogClear:     document.getElementById('log-clear-btn'),
  toast:           document.getElementById('toast'),
  speedSlider:     document.getElementById('speed-slider'),
  speedVal:        document.getElementById('speed-val'),
  dataCountBadge:  document.getElementById('data-count-badge'),
  dataActiveBadge: document.getElementById('data-active-badge'),
  dataStatus:      document.getElementById('data-status'),
  dropZone:        document.getElementById('drop-zone'),
  csvInput:        document.getElementById('csv-file-input'),
  pasteArea:       document.getElementById('data-paste-area'),
  btnLoadPaste:    document.getElementById('btn-load-paste'),
  btnClearData:    document.getElementById('btn-clear-data'),
  colMapSection:   document.getElementById('col-map-section'),
  colX:            document.getElementById('col-x'),
  colY:            document.getElementById('col-y'),
  colLabel:        document.getElementById('col-label'),
  btnApplyCols:    document.getElementById('btn-apply-cols'),
  sampleBtns:          document.querySelectorAll('.sample-btn'),
  // Phase 5
  evoPanel:            document.getElementById('evo-panel'),
  evoPopulation:       document.getElementById('evo-population'),
  btnEvoInit:          document.getElementById('btn-evo-init'),
  btnEvoRun:           document.getElementById('btn-evo-run'),
  btnEvoMutate:        document.getElementById('btn-evo-mutate'),
  btnEvoApply:         document.getElementById('btn-evo-apply'),
  builderArea:         document.getElementById('builder-area'),
  builderCanvas:       document.getElementById('builder-canvas'),
  btnBuilderDense:     document.getElementById('btn-builder-dense'),
  btnBuilderDropout:   document.getElementById('btn-builder-dropout'),
  btnBuilderExport:    document.getElementById('btn-builder-export'),
  btnBuilderReset:     document.getElementById('btn-builder-reset'),
  builderUnitSlider:   document.getElementById('builder-unit-slider'),
  builderUnitVal:      document.getElementById('builder-unit-val'),
  expListContainer:    document.getElementById('exp-list-container'),
  expCompareContainer: document.getElementById('exp-compare-container'),
  expCompareChart:     document.getElementById('exp-compare-chart'),
  btnExpCompare:       document.getElementById('btn-exp-compare'),
  btnExpClear:         document.getElementById('btn-exp-clear'),
  expTrackerPanel:     document.getElementById('exp-tracker-panel'),
};

/* ── Metric definitions per algorithm ── */
const METRIC_DEFS = {
  gradient_descent:  [
    { id: 'loss',   label: 'Loss',      color: '#4de8f4' },
    { id: 'grad',   label: '‖∇L‖',     color: '#f472b6' },
    { id: 'theta0', label: 'θ₀',        color: '#a78bfa' },
    { id: 'theta1', label: 'θ₁',        color: '#fbbf24' },
  ],
  neural_network:    [
    { id: 'loss',  label: 'Loss',     color: '#a78bfa' },
    { id: 'acc',   label: 'Accuracy', color: '#34d399' },
    { id: 'epoch', label: 'Epoch',    color: '#f472b6' },
    { id: 'lr',    label: 'LR',       color: '#fbbf24' },
  ],
  backpropagation:   [
    { id: 'loss',      label: 'Loss',  color: '#f472b6' },
    { id: 'grad_norm', label: '‖∇W‖', color: '#4de8f4' },
    { id: 'layer',     label: 'Layer', color: '#a78bfa' },
  ],
  linear_regression: [
    { id: 'loss',      label: 'MSE',       color: '#34d399' },
    { id: 'r2',        label: 'R²',        color: '#4de8f4' },
    { id: 'slope',     label: 'Slope',     color: '#fbbf24' },
    { id: 'intercept', label: 'Intercept', color: '#f472b6' },
  ],
  kmeans:            [
    { id: 'inertia', label: 'Inertia',   color: '#fbbf24' },
    { id: 'moved',   label: 'Δ Cents.',  color: '#4de8f4' },
    { id: 'iter',    label: 'Iter',      color: '#a78bfa' },
  ],
  pca:               [
    { id: 'var1',  label: 'PC1 Var',  color: '#fb923c' },
    { id: 'var2',  label: 'PC2 Var',  color: '#4de8f4' },
    { id: 'total', label: 'Explained', color: '#34d399' },
  ],
  attention:         [
    { id: 'entropy', label: 'Entropy', color: '#f87171' },
    { id: 'maxAttn', label: 'Max Wt',  color: '#4de8f4' },
    { id: 'head',    label: 'Head',    color: '#a78bfa' },
  ],
  svm:               [
    { id: 'margin', label: 'Margin', color: '#4ade80' },
    { id: 'sv',     label: 'SVs',    color: '#f472b6' },
    { id: 'iter',   label: 'Iter',   color: '#4de8f4' },
  ],
  decision_tree:     [
    { id: 'depth', label: 'Depth',     color: '#60a5fa' },
    { id: 'nodes', label: 'Nodes',     color: '#f472b6' },
    { id: 'gini',  label: 'Root Gini', color: '#fbbf24' },
  ],
};

/* ── Hardcoded control HTML per algorithm ── */
const CTRL_HTML = {
  gradient_descent: `
    <label>α (LR) <input type="range" id="ctrl-lr" min="0.001" max="0.5" step="0.001" value="0.05"> <span class="ctrl-val" id="val-lr">0.05</span></label>
    <label>Loss <select id="ctrl-loss"><option value="mse">MSE</option><option value="mae">MAE</option></select></label>`,
  neural_network: `
    <label>Layers <select id="ctrl-layers"><option value="1">1 Hidden</option><option value="2" selected>2 Hidden</option><option value="3">3 Hidden</option></select></label>
    <label>Activation <select id="ctrl-act"><option value="relu" selected>ReLU</option><option value="sigmoid">Sigmoid</option><option value="tanh">Tanh</option></select></label>
    <label>LR <input type="range" id="ctrl-lr-nn" min="0.0001" max="0.01" step="0.0001" value="0.001"> <span class="ctrl-val" id="val-lr-nn">0.001</span></label>
    <label>Epochs <input type="range" id="ctrl-epochs" min="20" max="500" step="20" value="100"> <span class="ctrl-val" id="val-epochs">100</span></label>
    <label>Batch <select id="ctrl-batch"><option value="8">8</option><option value="16">16</option><option value="32" selected>32</option><option value="64">64</option></select></label>
    <div class="viz-mode-toggle" style="margin-top:4px">
      <button class="viz-mode-btn active" data-tmode="simulate" title="Simulated training (instant)">Simulate</button>
      <button class="viz-mode-btn"        data-tmode="tfjs"     title="Real TF.js training in browser Web Worker">TF.js</button>
      <button class="viz-mode-btn"        data-tmode="websocket" title="PyTorch backend via WebSocket (run server.py)">WS</button>
    </div>
    <span id="ws-status-badge" class="ws-status-badge" style="display:none"></span>
  `,
  backpropagation: `
    <label>Depth <select id="ctrl-depth"><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option></select></label>`,
  linear_regression: `
    <label>Noise <input type="range" id="ctrl-noise" min="0.05" max="1" step="0.05" value="0.3"> <span class="ctrl-val" id="val-noise">0.3</span></label>
    <label>Reg <select id="ctrl-reg"><option value="none">None</option><option value="ridge">Ridge L2</option></select></label>`,
  kmeans: `
    <label>K <input type="range" id="ctrl-k" min="2" max="8" step="1" value="3"> <span class="ctrl-val" id="val-k">3</span></label>
    <label>Init <select id="ctrl-init"><option value="random">Random</option><option value="kpp" selected>K-Means++</option></select></label>`,
  pca: `
    <label>Components <select id="ctrl-dims"><option value="1" selected>→1D</option><option value="2">→2D</option></select></label>`,
  attention: `
    <label>Seq Len <input type="range" id="ctrl-seqlen" min="4" max="10" step="1" value="6"> <span class="ctrl-val" id="val-seqlen">6</span></label>
    <label>Heads <select id="ctrl-heads"><option value="1">1</option><option value="2" selected>2</option><option value="4">4</option></select></label>`,
  svm: `
    <label>Kernel <select id="ctrl-kernel"><option value="linear" selected>Linear</option><option value="rbf">RBF</option></select></label>
    <label>C <input type="range" id="ctrl-c" min="0.1" max="10" step="0.1" value="1.0"> <span class="ctrl-val" id="val-c">1.0</span></label>`,
  decision_tree: `
    <label>Max Depth <input type="range" id="ctrl-depth" min="1" max="5" step="1" value="3"> <span class="ctrl-val" id="val-depth">3</span></label>
    <label>Metric <select id="ctrl-metric"><option value="gini" selected>Gini</option><option value="entropy">Entropy</option></select></label>`,
};

/* ── Build the algorithm tab strip ── */
function buildTabs() {
  D.tabs.innerHTML = '';
  ALGO_ORDER.forEach(id => {
    const algo = AI_ALGORITHMS[id];
    if (!algo) return;
    const btn = document.createElement('button');
    btn.className = 'algo-tab-btn';
    btn.dataset.id = id;
    btn.innerHTML = `<span class="tab-icon">${algo.icon}</span><span class="tab-label">${algo.name}</span>`;
    btn.addEventListener('click', () => selectAlgo(id));
    D.tabs.appendChild(btn);
  });
}

/* ── Wire controls: sliders and selects trigger re-init ── */
function buildControls(id) {
  D.vizControls.innerHTML = CTRL_HTML[id] || '';
  D.vizControls.querySelectorAll('input[type=range]').forEach(inp => {
    const valEl = document.getElementById('val-' + inp.id.replace('ctrl-', ''));
    if (valEl) {
      inp.addEventListener('input', () => {
        valEl.textContent = inp.value;
        if (LAB.running) { stopRunning(); initAlgo(id); startRunning(); }
        else { initAlgo(id); drawFrame(); }
      });
    }
  });
  D.vizControls.querySelectorAll('select, input[type=checkbox]').forEach(inp => {
    inp.addEventListener('change', () => {
      if (LAB.running) { stopRunning(); initAlgo(id); startRunning(); }
      else { initAlgo(id); drawFrame(); }
    });
  });

  // Phase 4: wire training-mode toggle buttons
  D.vizControls.querySelectorAll('.viz-mode-btn[data-tmode]').forEach(btn => {
    btn.addEventListener('click', () => {
      D.vizControls.querySelectorAll('.viz-mode-btn[data-tmode]')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const newMode = btn.dataset.tmode;
      // Stop any active training before switching mode
      if (LAB.running) stopRunning();
      if (typeof WorkerBridge !== 'undefined') WorkerBridge.stop();
      if (typeof WsClient     !== 'undefined') WsClient.stop();
      LAB.trainingMode = newMode;
      // Show/hide WS status badge
      const badge = document.getElementById('ws-status-badge');
      if (badge) badge.style.display = newMode === 'websocket' ? 'inline' : 'none';
      initAlgo(id);
      drawFrame();
      log(`Training mode: ${newMode}`, 'info');
      if (newMode === 'tfjs')      toast('TF.js mode — click Run to train in browser');
      if (newMode === 'websocket') toast('WS mode — run server.py then click Run');
    });
  });

  // Sync lr-nn slider display
  const lrNnEl = document.getElementById('ctrl-lr-nn');
  const lrNnVal = document.getElementById('val-lr-nn');
  if (lrNnEl && lrNnVal) {
    lrNnEl.addEventListener('input', () => { lrNnVal.textContent = parseFloat(lrNnEl.value).toFixed(4); });
  }
}

/* ── Build metric cards for selected algorithm ── */
function buildMetricCards(id) {
  const defs = METRIC_DEFS[id] || [];
  D.metricCards.innerHTML = defs.map(m => `
    <div class="metric-card" id="mc-${m.id}">
      <div class="mc-label">${m.label}</div>
      <div class="mc-value" id="mv-${m.id}" style="color:${m.color}">—</div>
    </div>`).join('');
  D.miniChartW.style.display = 'block';

  // Phase 3: chart-mode toggle — shown for algorithms with secondary metric (accuracy)
  LAB.chartMode = 'primary';  // reset on algorithm switch
  const hasSecondary = ['neural_network', 'backpropagation'].includes(id);
  const labelMap = {
    neural_network:  ['Loss', 'Acc'],
    backpropagation: ['Loss', '‖∇W‖'],
  };
  const [lbl1, lbl2] = labelMap[id] || ['Loss', ''];

  if (hasSecondary) {
    D.miniLabel.innerHTML = `
      <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="font-family:var(--font-mono);font-size:.60rem;font-weight:700;text-transform:uppercase;letter-spacing:.10em;color:var(--cyan)">${lbl1 + ' Curve'}</span>
        <span id="chart-toggle-row" class="chart-toggle-row" style="display:flex;gap:4px;margin-left:auto">
          <button class="chart-toggle-btn active" data-track="primary">${lbl1}</button>
          <button class="chart-toggle-btn acc" data-track="secondary">${lbl2}</button>
        </span>
      </span>`;
    // Wire chart toggle
    setTimeout(() => {
      document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.chart-toggle-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          LAB.chartMode = btn.dataset.track;
          // Update label text
          const labelEl = D.miniLabel.querySelector('span > span:first-child');
          if (labelEl) labelEl.textContent = (LAB.chartMode === 'secondary' ? lbl2 : lbl1) + ' Curve';
        });
      });
    }, 0);
  } else {
    D.miniLabel.textContent = id === 'kmeans' ? 'Inertia' : 'Loss Curve';
  }
}

/* ── Phase 5: Refresh experiment list panel ── */
function refreshExpPanel() {
  if (typeof ExperimentTracker === 'undefined') return;
  if (D.expListContainer) ExperimentTracker.renderPanel(D.expListContainer);
}

/* ── Phase 5: Render evolution population grid ── */
function renderEvoPopulation() {
  if (!D.evoPopulation || !LAB.population?.length) return;
  const pop = LAB.population;
  D.evoPopulation.innerHTML = pop.map((g, i) => {
    const isBest = i === 0;
    const fitness = g.fitness != null ? g.fitness.toFixed(3) : '—';
    const acc     = g.acc     != null ? `${(g.acc * 100).toFixed(1)}%` : '—';
    return `
      <div class="evo-genome ${isBest ? 'best' : ''}" title="[${g.layers.join(',')}] ${g.activation} lr=${g.lr}">
        <span class="evo-rank">${isBest ? '★' : i + 1}</span>
        <span class="evo-arch">[${g.layers.join('·')}]</span>
        <span class="evo-act">${g.activation.slice(0,4)}</span>
        <span class="evo-fit ${isBest ? 'best' : ''}">${fitness}</span>
        <span class="evo-acc">${acc}</span>
      </div>`;
  }).join('');
}

/* ── Update a single metric card value ── */
function updateMetric(id, val) {
  const el = document.getElementById('mv-' + id);
  if (el) {
    el.textContent = typeof val === 'number'
      ? (val > 1000 ? val.toFixed(0) : val > 100 ? val.toFixed(1) : val.toFixed(4))
      : val;
  }
}

/* ── Select and initialize an algorithm ── */
function selectAlgo(id) {
  if (!AI_ALGORITHMS[id]) return;
  stopRunning();
  LAB.currentAlgo = id;
  LAB.iteration   = 0;
  LAB.lossHistory = [];
  LAB.state       = {};
  miniHistory     = [];

  // Highlight active tab
  document.querySelectorAll('.algo-tab-btn')
    .forEach(b => b.classList.toggle('active', b.dataset.id === id));

  const algo = AI_ALGORITHMS[id];
  D.infoIcon.textContent  = algo.icon;
  D.infoIcon.style.color  = algo.color;
  D.infoName.textContent  = algo.name;
  D.infoFamily.textContent = algo.family;
  D.infoDesc.textContent  = algo.description;
  D.vizTitle.textContent  = algo.name;

  // Phase 5 fix: show/hide builder toggle button in toolbar
  const existingBuilderBtn = document.getElementById('btn-show-builder');
  if (existingBuilderBtn) existingBuilderBtn.remove();
  if (id === 'neural_network') {
    const builderBtn = document.createElement('button');
    builderBtn.id        = 'btn-show-builder';
    builderBtn.className = 'btn-action secondary builder-toggle-btn';
    builderBtn.dataset.showBuilder = '1';
    builderBtn.setAttribute('data-show-builder', '1');
    builderBtn.title     = 'Toggle Architecture Builder';
    builderBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> Builder';
    // Insert before the run button
    const vizActions = document.querySelector('.viz-actions');
    if (vizActions) vizActions.insertBefore(builderBtn, vizActions.firstChild);
  } else {
    // Ensure canvas visible, builder hidden when switching away from NN
    if (D.canvasArea  && D.canvasArea.style.display  === 'none') D.canvasArea.style.display  = 'flex';
    if (D.builderArea && D.builderArea.style.display !== 'none') D.builderArea.style.display = 'none';
  }

  // Render equations via KaTeX
  D.infoMath.innerHTML = algo.equations.map((eq, i) => `
    <div class="eq-block">
      <div class="eq-label-sm">${eq.label}</div>
      <div class="eq-render" id="eq_r_${i}"></div>
    </div>
  `).join('');
  requestAnimationFrame(() => {
    algo.equations.forEach((eq, i) => {
      const el = document.getElementById(`eq_r_${i}`);
      if (el && window.katex) {
        try { katex.render(eq.latex, el, { throwOnError: false, displayMode: true }); }
        catch (e) { el.textContent = eq.latex; }
      }
    });
  });

  D.infoSteps.innerHTML = algo.steps.map((s, i) =>
    `<li class="info-step-item" data-i="${i}">${s}</li>`).join('');
  D.infoApps.innerHTML  = algo.applications.map(a =>
    `<span class="app-tag">${a}</span>`).join('');
  D.infoComplex.innerHTML = `
    <div class="complexity-chip time"><span>⏱</span>${algo.complexity.time}</div>
    <div class="complexity-chip space"><span>💾</span>${algo.complexity.space}</div>
  `;

  D.vizWelcome.style.display = 'none';
  D.canvasArea.style.display = 'flex';
  D.liveEqBar.style.display  = 'flex';

  buildControls(id);
  buildMetricCards(id);
  initAlgo(id);
  drawFrame();
  log(`Loaded: ${algo.name}`, 'info');

  // Phase 5: show/hide evo panel for neural_network; refresh experiment list
  if (D.evoPanel)        D.evoPanel.style.display        = id === 'neural_network' ? 'block' : 'none';
  if (D.expTrackerPanel) D.expTrackerPanel.style.display = 'block';
  refreshExpPanel();
}
