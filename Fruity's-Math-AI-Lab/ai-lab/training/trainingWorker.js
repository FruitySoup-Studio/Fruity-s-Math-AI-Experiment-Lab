/**
 * ai-lab/training/trainingWorker.js
 * Web Worker — runs entirely off the main thread.
 * Imports TF.js, builds a real model, trains it, and streams
 * live metrics back to the main thread via postMessage.
 *
 * Message protocol (received from main thread):
 *   { type: 'start', config: { layers, act, lr, epochs, batchSize, data, inputSize, numClasses } }
 *   { type: 'stop' }
 *
 * Message protocol (sent to main thread):
 *   { type: 'ready' }
 *   { type: 'metrics', loss, acc, epoch, batch, totalBatches }
 *   { type: 'weights', layerWeights: [ { w: Float32Array, shape, b: Float32Array } ] }
 *   { type: 'activations', acts: number[][] }
 *   { type: 'done', finalLoss, finalAcc, epochs }
 *   { type: 'error', message }
 */

/* global tf */
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');

let model    = null;
let stopFlag = false;

/* ── Message router ── */
self.onmessage = async ({ data }) => {
  if (data.type === 'start') {
    stopFlag = false;
    try { await runTraining(data.config); }
    catch (e) { self.postMessage({ type: 'error', message: e.message }); }
  }
  if (data.type === 'stop') {
    stopFlag = true;
    if (model) { model.dispose(); model = null; }
  }
};

/* ══════════════════════════════════════════════════════════════
   MODEL BUILDER
══════════════════════════════════════════════════════════════ */
function buildModel(inputSize, hiddenSizes, numClasses, act, lr) {
  const m = tf.sequential();

  // Input + first hidden
  m.add(tf.layers.dense({
    units:           hiddenSizes[0],
    inputShape:      [inputSize],
    activation:      act,
    kernelInitializer: 'glorotUniform',
    biasInitializer:   'zeros',
  }));

  // Additional hidden layers
  for (let i = 1; i < hiddenSizes.length; i++) {
    m.add(tf.layers.dense({
      units:      hiddenSizes[i],
      activation: act,
      kernelInitializer: 'glorotUniform',
    }));
  }

  // Output layer
  m.add(tf.layers.dense({
    units:      numClasses,
    activation: numClasses === 2 ? 'sigmoid' : 'softmax',
  }));

  m.compile({
    optimizer: tf.train.adam(lr),
    loss:      numClasses === 2 ? 'binaryCrossentropy' : 'categoricalCrossentropy',
    metrics:   ['accuracy'],
  });

  return m;
}

/* ══════════════════════════════════════════════════════════════
   TRAINING LOOP
══════════════════════════════════════════════════════════════ */
async function runTraining(cfg) {
  const {
    layers     = 2,
    act        = 'relu',
    lr         = 0.001,
    epochs     = 200,
    batchSize  = 32,
    data       = [],
    inputSize  = 2,
    numClasses = 2,
  } = cfg;

  // Hidden layer sizes based on `layers` selection
  const hiddenSizes = layers === 1 ? [8] : layers === 2 ? [12, 8] : [16, 12, 8];

  // ── Build model ──
  model = buildModel(inputSize, hiddenSizes, numClasses, act, lr);
  self.postMessage({ type: 'ready' });

  // ── Prepare tensors ──
  let xs, ys;
  tf.tidy(() => {
    const xArr = data.map(d => d.x);
    const yRaw = data.map(d => d.label);

    xs = tf.tensor2d(xArr, [xArr.length, inputSize]);
    if (numClasses === 2) {
      ys = tf.tensor2d(yRaw.map(v => [v]), [yRaw.length, 1]);
    } else {
      ys = tf.oneHot(tf.tensor1d(yRaw, 'int32'), numClasses).toFloat();
    }
  });

  // ── Epoch loop ──
  let finalLoss = 0, finalAcc = 0;
  const totalBatches = Math.ceil(data.length / batchSize);

  for (let ep = 0; ep < epochs; ep++) {
    if (stopFlag) break;

    // Train one epoch using fit() with batchSize
    const history = await model.fit(xs, ys, {
      epochs:    1,
      batchSize,
      shuffle:   true,
      verbose:   0,
      callbacks: {
        onBatchEnd: async (batch, logs) => {
          if (stopFlag) model.stopTraining = true;
          // Stream batch-level metrics
          self.postMessage({
            type:         'metrics',
            loss:         logs.loss,
            acc:          logs.acc ?? logs.accuracy ?? 0,
            epoch:        ep,
            batch,
            totalBatches,
          });
          // Yield to allow stop messages to arrive
          await tf.nextFrame();
        },
      },
    });

    if (stopFlag) break;

    finalLoss = history.history.loss[0];
    finalAcc  = history.history.acc?.[0] ?? history.history.accuracy?.[0] ?? 0;

    // ── Extract weight arrays for visualization (every epoch) ──
    const layerWeights = [];
    for (const layer of model.layers) {
      const wts = layer.getWeights();
      if (wts.length === 2) {
        const wData = await wts[0].data();
        const bData = await wts[1].data();
        layerWeights.push({
          w:     Array.from(wData),
          shape: wts[0].shape,
          b:     Array.from(bData),
        });
      }
    }
    self.postMessage({ type: 'weights', layerWeights });

    // ── Run one forward pass for activation visualization ──
    const sample = data[Math.floor(Math.random() * data.length)];
    if (sample) {
      const actArrays = await getActivations(sample.x);
      self.postMessage({ type: 'activations', acts: actArrays });
    }

    // Yield between epochs so stop messages can arrive
    await tf.nextFrame();
  }

  // Cleanup tensors
  xs.dispose(); ys.dispose();

  self.postMessage({ type: 'done', finalLoss, finalAcc: finalAcc * 100, epochs });
  model.dispose(); model = null;
}

/* ══════════════════════════════════════════════════════════════
   ACTIVATION EXTRACTOR
   Runs a forward pass through each layer and collects activations.
══════════════════════════════════════════════════════════════ */
async function getActivations(inputArr) {
  if (!model || !inputArr) return [];
  const acts = [];

  // Input activations
  acts.push(inputArr.map(v => Math.max(0, Math.min(1, (v + 1) / 2))));  // normalise to 0-1

  // Hidden + output activations via intermediate models
  const inputTensor = tf.tensor2d([inputArr], [1, inputArr.length]);
  let current = inputTensor;

  for (const layer of model.layers) {
    const output = layer.apply(current);
    const data   = await output.data();
    const shape  = output.shape;

    // Flatten to 1D and collect
    const flat = Array.from(data);
    acts.push(flat);

    if (current !== inputTensor) current.dispose();
    current = output;
  }
  current.dispose();
  inputTensor.dispose();

  return acts;
}
