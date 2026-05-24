/**
 * ai-lab/core/state.js
 * Global runtime state for the AI Lab.
 * No DOM references. No external dependencies.
 * Must load first.
 */

const LAB = {
  currentAlgo:  null,
  running:      false,
  animFrame:    null,
  iteration:    0,
  speed:        40,
  lastStep:     0,
  state:        {},
  lossHistory:  [],
  // Phase 4: training mode — 'simulate' | 'tfjs' | 'websocket'
  trainingMode: 'simulate',
  // Phase 4: chart toggle mode (set by ui.js)
  chartMode:    'primary',
  // Phase 5: neuroevolution
  generation:   0,
  population:   [],
  bestGenome:   null,
  evoHistory:   [],
  // Phase 5: architecture builder export
  builderArch:  null,
};

const DATA_STORE = {
  raw:      null,        // Array of {x, y, label} from import
  source:   'synthetic', // 'synthetic' | 'sample:name' | 'csv' | 'paste'
  columns:  [],          // header names if CSV
  colX:     0,
  colY:     1,
  colLabel: -1,
};

// Shared mini-chart history — reset by each algorithm init
let miniHistory = [];
