/**
 * ai-lab/training/workerBridge.js
 * Main-thread interface to the TF.js Web Worker.
 * Spawns trainingWorker.js, receives streamed metrics/weights/activations,
 * writes them into LAB.state, and keeps the render loop in sync.
 *
 * Depends on: state.js (LAB), canvas.js (log, toast, drawFrame),
 *             ui.js (updateMetric, D)
 * Must load before neuralNetwork.js references it.
 */

const WorkerBridge = (() => {
  let _worker   = null;
  let _active   = false;
  let _onDone   = null;

  /* ── Reconstruct weight arrays (Float32 flat → nested JS arrays) ── */
  function rebuildWeights(layerWeights, sizes) {
    if (!layerWeights || !layerWeights.length) return null;
    const weights = [];
    for (let l = 0; l < layerWeights.length; l++) {
      const { w, shape } = layerWeights[l];
      const [rows, cols] = shape;  // [in, out] from TF — transpose to [out][in]
      const mat = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) row.push(w[r * cols + c]);
        mat.push(row);
      }
      weights.push(mat);
    }
    return weights;
  }

  /* ── Start a TF.js training run ── */
  function start(config) {
    if (_worker) stop();            // terminate any existing worker first

    _active = true;
    _worker = new Worker('ai-lab/training/trainingWorker.js');

    _worker.onmessage = ({ data }) => {
      if (!_active) return;

      switch (data.type) {

        case 'ready':
          log('TF.js model built — training started', 'success');
          toast('TF.js training running…');
          break;

        case 'metrics': {
          const s = LAB.state;
          s.loss  = data.loss;
          s.acc   = data.acc;
          s.epoch = data.epoch;
          s.batch = data.batch;

          // Feed mini-chart
          miniHistory.push(data.loss);
          if (!s.secHistory) s.secHistory = [];
          s.secHistory.push(data.acc * 100);
          LAB.state.secHistory = s.secHistory;

          updateMetric('loss',  data.loss);
          updateMetric('acc',   `${(data.acc * 100).toFixed(1)}%`);
          updateMetric('epoch', data.epoch);
          updateMetric('lr',    config.lr?.toFixed(4) ?? '0.001');

          LAB.iteration++;
          D.statsIter.textContent = `ep ${data.epoch} b ${data.batch}`;

          showLiveEq(
            'h^{(l)}=\\sigma(W^{(l)}h^{(l-1)}+b^{(l)})',
            `Loss=${data.loss.toFixed(4)}  Acc=${(data.acc * 100).toFixed(1)}%`
          );

          // Throttle log output
          if (LAB.iteration % 20 === 0)
            log(`[TF.js] Epoch ${data.epoch}  Loss=${data.loss.toFixed(4)}  Acc=${(data.acc * 100).toFixed(1)}%`);
          break;
        }

        case 'weights': {
          const rebuilt = rebuildWeights(data.layerWeights, LAB.state.sizes);
          if (rebuilt) LAB.state.weights = rebuilt;
          break;
        }

        case 'activations':
          // acts is an array of 1D arrays per layer
          if (data.acts && data.acts.length) LAB.state.activations = data.acts;
          break;

        case 'done':
          _active = false;
          _worker = null;
          log(`[TF.js] Training complete — Loss=${data.finalLoss.toFixed(4)}  Acc=${data.finalAcc.toFixed(1)}%  Epochs=${data.epochs}`, 'success');
          toast(`Done! Final acc: ${data.finalAcc.toFixed(1)}%`);
          // Save to experiment tracker
          ExperimentTracker.save({
            algo:      'neural_network',
            mode:      'tfjs',
            config,
            finalLoss: data.finalLoss,
            finalAcc:  data.finalAcc,
            epochs:    data.epochs,
            lossHistory: miniHistory.slice(),
          });
          if (typeof _onDone === 'function') _onDone(data);
          stopRunning();
          break;

        case 'error':
          _active = false;
          _worker = null;
          log(`[TF.js] Worker error: ${data.message}`, 'error');
          toast('TF.js error — see log');
          stopRunning();
          break;
      }
    };

    _worker.onerror = (e) => {
      log(`[TF.js] Worker crashed: ${e.message}`, 'error');
      toast('Worker crashed — check browser console');
      _active = false; _worker = null;
      stopRunning();
    };

    _worker.postMessage({ type: 'start', config });
  }

  /* ── Stop and terminate the worker ── */
  function stop() {
    if (_worker) {
      _worker.postMessage({ type: 'stop' });
      setTimeout(() => { if (_worker) { _worker.terminate(); _worker = null; } }, 400);
    }
    _active = false;
  }

  /* ── Public API ── */
  return {
    start,
    stop,
    isActive: () => _active,
    onDone:   (fn) => { _onDone = fn; },
  };
})();
