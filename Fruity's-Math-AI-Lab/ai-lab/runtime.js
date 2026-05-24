/**
 * ai-lab/runtime.js
 * Animation loop, run/stop/step controls, keyboard shortcuts, resize handler.
 * Must load LAST — depends on every other module.
 */

/* ═══════════════════════════════════
   ANIMATION LOOP
═══════════════════════════════════ */
function startRunning() {
  if (LAB.running) return;
  LAB.running = true;
  D.btnPlay.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;

  function loop(ts) {
    if (!LAB.running) return;
    if (ts - LAB.lastStep >= LAB.speed) {
      LAB.lastStep = ts;
      if (LAB.currentAlgo) {
        ALGO_STEP[LAB.currentAlgo]?.();
        LAB.iteration++;
        D.statsIter.textContent = `iter ${LAB.iteration}`;
      }
    }
    drawFrame();
    LAB.animFrame = requestAnimationFrame(loop);
  }
  LAB.animFrame = requestAnimationFrame(loop);
}

function stopRunning() {
  LAB.running = false;
  cancelAnimationFrame(LAB.animFrame);
  D.btnPlay.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run`;
  // Phase 4: stop any active training worker/ws
  if (typeof WorkerBridge !== 'undefined' && WorkerBridge.isActive()) WorkerBridge.stop();
  if (typeof WsClient     !== 'undefined' && WsClient.isActive())     WsClient.stop();
}

/* ═══════════════════════════════════
   BUTTON WIRING
═══════════════════════════════════ */
D.btnPlay.addEventListener('click', () => {
  if (!LAB.currentAlgo) { toast('Select an algorithm first!'); return; }
  LAB.running ? stopRunning() : startRunning();
});

D.btnReset.addEventListener('click', () => {
  stopRunning();
  if (LAB.currentAlgo) {
    LAB.iteration   = 0;
    LAB.lossHistory = [];
    miniHistory     = [];
    initAlgo(LAB.currentAlgo);
    drawFrame();
    toast('Reset!');
    log('Reset.', 'info');
    document.querySelectorAll('.info-step-item').forEach(e => e.classList.remove('active-step'));
  }
});

D.btnStep.addEventListener('click', () => {
  if (!LAB.currentAlgo) { toast('Select an algorithm first!'); return; }
  stopRunning();
  ALGO_STEP[LAB.currentAlgo]?.();
  LAB.iteration++;
  drawFrame();
});

D.btnLogClear.addEventListener('click', () => { D.logOutput.innerHTML = ''; });

/* Speed slider */
D.speedSlider.addEventListener('input', () => {
  LAB.speed = parseInt(D.speedSlider.value);
  D.speedVal.textContent = `${LAB.speed}ms`;
});

/* Welcome cards */
document.querySelectorAll('.welcome-card')
  .forEach(c => c.addEventListener('click', () => selectAlgo(c.dataset.algo)));

/* Keyboard shortcuts */
document.addEventListener('keydown', e => {
  if (e.key === ' ')                   { e.preventDefault(); D.btnPlay.click(); }
  if (e.key === 'ArrowRight')          { D.btnStep.click(); }
  if (e.key === 'r' || e.key === 'R')  { D.btnReset.click(); }
});

/* Resize */
window.addEventListener('resize', () => { if (LAB.currentAlgo) drawFrame(); });

/* ═══════════════════════════════════
   PHASE 5 — EVOLUTION & BUILDER WIRING
═══════════════════════════════════ */

// ── Evolution buttons ──
D.btnEvoInit?.addEventListener('click', () => {
  MutationEngine.initPopulation();
  renderEvoPopulation();
  drawFrame();
  toast('Population initialised');
});

D.btnEvoRun?.addEventListener('click', () => {
  if (MutationEngine.isRunning()) {
    MutationEngine.stop();
    D.btnEvoRun.textContent = 'Evolve';
    toast('Evolution paused');
  } else {
    if (!LAB.population?.length) MutationEngine.initPopulation();
    MutationEngine.start();
    D.btnEvoRun.textContent = 'Pause';
    // Refresh population grid every 500ms while running
    const evoRefreshTimer = setInterval(() => {
      renderEvoPopulation();
      if (!MutationEngine.isRunning()) {
        clearInterval(evoRefreshTimer);
        D.btnEvoRun.textContent = 'Evolve';
      }
    }, 500);
  }
});

D.btnEvoMutate?.addEventListener('click', () => {
  MutationEngine.mutateBest();
  renderEvoPopulation();
});

D.btnEvoApply?.addEventListener('click', () => {
  MutationEngine.applyBest();
});

// ── Architecture builder buttons ──
D.btnBuilderDense?.addEventListener('click', () => {
  ArchBuilder.addLayer('dense');
});
D.btnBuilderDropout?.addEventListener('click', () => {
  ArchBuilder.addLayer('dropout');
});
D.btnBuilderExport?.addEventListener('click', () => {
  const sizes = ArchBuilder.exportToNN();
  if (sizes) toast(`Exported [${sizes.join('→')}]`);
});
D.btnBuilderReset?.addEventListener('click', () => {
  ArchBuilder.reset();
  toast('Builder reset');
});
D.builderUnitSlider?.addEventListener('input', () => {
  const v = D.builderUnitSlider.value;
  if (D.builderUnitVal) D.builderUnitVal.textContent = v;
  ArchBuilder.editSelected(v);
});

// ── Experiment tracker buttons ──
D.btnExpCompare?.addEventListener('click', () => {
  if (!D.expCompareContainer || !D.expCompareChart) return;
  const showing = D.expCompareContainer.style.display !== 'none';
  D.expCompareContainer.style.display = showing ? 'none' : 'block';
  if (!showing) {
    ExperimentTracker.renderComparePanel(D.expCompareChart);
  }
});

D.btnExpClear?.addEventListener('click', () => {
  ExperimentTracker.clear();
  refreshExpPanel();
  if (D.expCompareContainer) D.expCompareContainer.style.display = 'none';
});

/* ═══════════════════════════════════
   INIT — entry point
═══════════════════════════════════ */
function init() {
  buildTabs();
  wireDatImport();
  log('AI Lab ready. Select an algorithm above.', 'info');
  log('Shortcuts: [Space] Run/Pause  [→] Step  [R] Reset', 'info');
  log('Import CSV or choose a sample dataset in the left panel.', 'info');

  // Phase 5: builder is lazy-mounted on first open (via the toggle click handler)

  // Phase 5: show experiment tracker panel, populate list
  if (D.expTrackerPanel) D.expTrackerPanel.style.display = 'block';
  refreshExpPanel();

  // Phase 5 fix: builder toggle — swap canvas ↔ builder panel
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-show-builder]');
    if (!btn) return;
    const builderVisible = D.builderArea && D.builderArea.style.display !== 'none';
    if (D.canvasArea)  D.canvasArea.style.display  = builderVisible ? 'flex'  : 'none';
    if (D.builderArea) D.builderArea.style.display = builderVisible ? 'none'  : 'block';
    // Remount builder if canvas not yet initialised (first open)
    if (!builderVisible && D.builderCanvas && typeof ArchBuilder !== 'undefined') {
      if (!D.builderCanvas._mounted) {
        ArchBuilder.mount(D.builderCanvas);
        D.builderCanvas._mounted = true;
      }
    }
    btn.textContent = builderVisible ? '⬛ Builder' : '▶ Visualize';
  });

  setTimeout(() => selectAlgo('gradient_descent'), 300);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else setTimeout(init, 0);
