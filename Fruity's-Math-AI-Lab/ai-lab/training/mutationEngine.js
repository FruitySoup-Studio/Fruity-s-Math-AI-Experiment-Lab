/**
 * ai-lab/training/mutationEngine.js
 * Architecture mutation, neuroevolution, and hyperparameter evolution.
 *
 * Exposes MutationEngine — a singleton that manages a population of
 * architecture genomes, evaluates them (simulated fitness or real TF.js),
 * selects survivors, mutates offspring, and streams progress into LAB.state.
 *
 * Depends on: state.js (LAB, miniHistory), canvas.js (log, toast),
 *             ui.js (updateMetric, D), workerBridge.js (WorkerBridge)
 */

const MutationEngine = (() => {

  /* ══════════════════════════════════════════════════════════
     GENOME SCHEMA
     A genome fully describes one neural architecture candidate.
  ══════════════════════════════════════════════════════════ */
  const ACTIVATIONS  = ['relu', 'sigmoid', 'tanh', 'gelu'];
  const OPTIMIZERS   = ['adam', 'sgd', 'rmsprop'];
  const LAYER_RANGE  = { min: 1, max: 4 };
  const NEURON_RANGE = { min: 4, max: 32 };
  const LR_OPTIONS   = [0.1, 0.01, 0.005, 0.001, 0.0005, 0.0001];

  function randomGenome() {
    const numLayers = LAYER_RANGE.min + Math.floor(Math.random() * (LAYER_RANGE.max - LAYER_RANGE.min + 1));
    return {
      id:         Date.now() + Math.random(),
      layers:     Array.from({ length: numLayers }, () =>
                    NEURON_RANGE.min + Math.floor(Math.random() * (NEURON_RANGE.max - NEURON_RANGE.min + 1))),
      activation: ACTIVATIONS[Math.floor(Math.random() * ACTIVATIONS.length)],
      optimizer:  OPTIMIZERS[Math.floor(Math.random() * OPTIMIZERS.length)],
      lr:         LR_OPTIONS[Math.floor(Math.random() * LR_OPTIONS.length)],
      dropout:    Math.random() < 0.4 ? +(Math.random() * 0.4).toFixed(2) : 0,
      fitness:    null,   // filled after evaluation
      loss:       null,
      acc:        null,
    };
  }

  /* ══════════════════════════════════════════════════════════
     MUTATION OPERATORS
  ══════════════════════════════════════════════════════════ */
  function mutate(genome) {
    const g = JSON.parse(JSON.stringify(genome));   // deep clone
    g.id      = Date.now() + Math.random();
    g.fitness = null; g.loss = null; g.acc = null;

    const roll = Math.random();

    if (roll < 0.20) {
      // Add a layer
      if (g.layers.length < LAYER_RANGE.max) {
        const pos = Math.floor(Math.random() * (g.layers.length + 1));
        g.layers.splice(pos, 0, NEURON_RANGE.min + Math.floor(Math.random() * (NEURON_RANGE.max - NEURON_RANGE.min + 1)));
      }
    } else if (roll < 0.35) {
      // Remove a layer
      if (g.layers.length > LAYER_RANGE.min) {
        g.layers.splice(Math.floor(Math.random() * g.layers.length), 1);
      }
    } else if (roll < 0.55) {
      // Change neuron count in a random layer
      const idx = Math.floor(Math.random() * g.layers.length);
      g.layers[idx] = NEURON_RANGE.min + Math.floor(Math.random() * (NEURON_RANGE.max - NEURON_RANGE.min + 1));
    } else if (roll < 0.65) {
      // Mutate activation
      g.activation = ACTIVATIONS[Math.floor(Math.random() * ACTIVATIONS.length)];
    } else if (roll < 0.75) {
      // Mutate optimizer
      g.optimizer = OPTIMIZERS[Math.floor(Math.random() * OPTIMIZERS.length)];
    } else if (roll < 0.85) {
      // Mutate learning rate
      g.lr = LR_OPTIONS[Math.floor(Math.random() * LR_OPTIONS.length)];
    } else {
      // Mutate dropout
      g.dropout = Math.random() < 0.5 ? 0 : +(Math.random() * 0.4).toFixed(2);
    }

    return g;
  }

  /* ── Single-point crossover ── */
  function crossover(a, b) {
    const child = JSON.parse(JSON.stringify(a));
    child.id      = Date.now() + Math.random();
    child.fitness = null; child.loss = null; child.acc = null;

    // Cross layers at midpoint
    const alen = a.layers.length, blen = b.layers.length;
    const cut  = Math.floor(Math.min(alen, blen) / 2);
    child.layers     = [...a.layers.slice(0, cut), ...b.layers.slice(cut)];
    child.activation = Math.random() < 0.5 ? a.activation : b.activation;
    child.optimizer  = Math.random() < 0.5 ? a.optimizer  : b.optimizer;
    child.lr         = Math.random() < 0.5 ? a.lr         : b.lr;
    child.dropout    = Math.random() < 0.5 ? a.dropout    : b.dropout;

    return child;
  }

  /* ══════════════════════════════════════════════════════════
     SIMULATED FITNESS EVALUATION
     Fast approximation so evolution works without TF.js training.
     Penalises very large or very small networks, rewards
     good activation functions for typical data distributions.
  ══════════════════════════════════════════════════════════ */
  function simulateFitness(genome) {
    const totalParams = genome.layers.reduce((s, n) => s + n, 0);
    const depth       = genome.layers.length;

    // Base loss: smaller networks converge faster on simple data
    let loss = 0.45 + Math.random() * 0.3;
    loss -= depth * 0.02;                   // deeper = slightly better
    loss -= totalParams * 0.001;            // more params = slightly better
    if (genome.activation === 'relu')  loss -= 0.06;
    if (genome.activation === 'gelu')  loss -= 0.04;
    if (genome.optimizer   === 'adam') loss -= 0.05;
    if (genome.dropout > 0)            loss -= genome.dropout * 0.1;
    loss += (Math.random() - 0.5) * 0.12;  // noise
    loss  = Math.max(0.01, Math.min(1.5, loss));

    const acc = Math.min(0.99, Math.max(0.30, 1 - loss * 0.65 + (Math.random() - 0.5) * 0.08));
    return { loss: +loss.toFixed(4), acc: +acc.toFixed(4), fitness: +(acc - loss * 0.4).toFixed(4) };
  }

  /* ══════════════════════════════════════════════════════════
     EVOLUTION STATE
  ══════════════════════════════════════════════════════════ */
  const POP_SIZE   = 8;
  const ELITE_K    = 2;
  let   _running   = false;
  let   _stopFlag  = false;
  let   _genTimer  = null;

  /* ── Initialise a random population ── */
  function initPopulation() {
    LAB.population  = Array.from({ length: POP_SIZE }, randomGenome);
    LAB.generation  = 0;
    LAB.bestGenome  = null;
    LAB.evoHistory  = [];   // [{gen, bestFitness, meanFitness}]
    miniHistory     = [];
    log(`Evolution initialised — population ${POP_SIZE}`, 'info');
  }

  /* ── Evaluate the whole population (simulated) ── */
  function evaluatePopulation() {
    for (const g of LAB.population) {
      if (g.fitness !== null) continue;   // already evaluated
      const r = simulateFitness(g);
      g.fitness = r.fitness; g.loss = r.loss; g.acc = r.acc;
    }
    LAB.population.sort((a, b) => b.fitness - a.fitness);
  }

  /* ── One generation of selection + reproduction ── */
  function evolveOneGeneration() {
    evaluatePopulation();

    const best  = LAB.population[0];
    const mean  = LAB.population.reduce((s, g) => s + g.fitness, 0) / LAB.population.length;
    LAB.generation++;
    LAB.bestGenome = best;
    LAB.evoHistory.push({ gen: LAB.generation, bestFitness: best.fitness, meanFitness: mean });
    miniHistory.push(best.fitness * 100);   // chart shows best fitness %

    // Update metrics
    updateMetric('loss',  best.loss);
    updateMetric('acc',   `${(best.acc * 100).toFixed(1)}%`);
    updateMetric('epoch', LAB.generation);
    updateMetric('lr',    best.lr);
    D.statsIter.textContent = `gen ${LAB.generation}`;

    showLiveEq(
      '\\theta^* = \\arg\\max_{\\theta} F(\\theta)',
      `gen=${LAB.generation} best=${best.fitness.toFixed(3)} mean=${mean.toFixed(3)}`
    );
    highlightStep(Math.min(4, Math.floor(LAB.generation / 5)));

    // Elites survive unchanged
    const elites   = LAB.population.slice(0, ELITE_K);
    const children = [];

    // Fill rest with crossover + mutation
    while (children.length < POP_SIZE - ELITE_K) {
      const ai = Math.floor(Math.random() * ELITE_K + 1);
      const bi = Math.floor(Math.random() * (LAB.population.length - 1)) + 1;
      const a  = LAB.population[ai] ?? LAB.population[0];
      const b  = LAB.population[bi] ?? LAB.population[1];
      const child = Math.random() < 0.6 ? crossover(a, b) : mutate(a);
      children.push(child);
    }

    LAB.population = [...elites, ...children];

    if (LAB.generation % 3 === 0)
      log(`Gen ${LAB.generation}: best=${best.fitness.toFixed(4)} layers=[${best.layers}] act=${best.activation} opt=${best.optimizer} lr=${best.lr}`, 'info');
  }

  /* ── Run evolution loop ── */
  function start() {
    if (_running) return;
    if (!LAB.population || !LAB.population.length) initPopulation();
    _running   = true;
    _stopFlag  = false;

    function tick() {
      if (_stopFlag) { _running = false; return; }
      evolveOneGeneration();
      drawFrame();
      _genTimer = setTimeout(tick, 120);   // ~8 generations/sec — visible
    }
    tick();
    toast('Evolution running…');
  }

  function stop() {
    _stopFlag = true;
    clearTimeout(_genTimer);
    _running = false;
  }

  /* ── Generate a single random mutation of the best genome ── */
  function mutateBest() {
    if (!LAB.bestGenome) { toast('Run evolution first to get a best genome'); return; }
    const child = mutate(LAB.bestGenome);
    LAB.population.push(child);
    log(`Manual mutation: [${child.layers}] ${child.activation} lr=${child.lr}`, 'info');
    toast('Mutant added to population');
  }

  /* ── Apply best genome to NN algorithm ── */
  function applyBest() {
    if (!LAB.bestGenome) { toast('No best genome yet — run evolution first'); return; }
    const g = LAB.bestGenome;
    // Reflect into NN controls if visible
    const ctrlLayers = document.getElementById('ctrl-layers');
    const ctrlAct    = document.getElementById('ctrl-act');
    if (ctrlLayers) ctrlLayers.value = Math.min(3, g.layers.length);
    if (ctrlAct)    ctrlAct.value    = g.activation === 'gelu' ? 'relu' : g.activation;
    log(`Applied best genome: layers=[${g.layers}] act=${g.activation} lr=${g.lr}`, 'success');
    toast(`Best genome applied — fitness=${g.fitness.toFixed(3)}`);
    if (LAB.currentAlgo === 'neural_network') {
      initAlgo('neural_network');
      drawFrame();
    }
  }

  return {
    initPopulation,
    start,
    stop,
    mutateBest,
    applyBest,
    isRunning:    () => _running,
    getPopulation:() => LAB.population || [],
    getBest:      () => LAB.bestGenome,
  };
})();
