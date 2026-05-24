/**
 * ai-lab/algorithms/neuralNetwork.js
 * Neural Network visualization with live weight updates.
 * Exports forwardNN — also consumed by backpropagation.js.
 * MUST load before backpropagation.js.
 * Depends on: state.js, utils.js (randn, clamp, relu, sigmoid, softmax), canvas.js, ui.js, dataSystem.js (getDataForAlgo)
 */

/**
 * Forward pass through a fully-connected network.
 * Returns array of activation vectors for every layer (including input).
 * @param {number[]}   input   - Input vector
 * @param {number[][][]} weights - [layer][neuron_out][neuron_in]
 * @param {string}     actFn   - 'relu' | 'sigmoid' | 'tanh'
 * @returns {number[][]} activations per layer
 */
function forwardNN(input, weights, actFn) {
  let h = input;
  const acts = [h];
  for (let l = 0; l < weights.length; l++) {
    const z = weights[l].map(row => row.reduce((s, w, i) => s + w * (h[i] || 0), 0));
    // Last layer: softmax; hidden layers: chosen activation
    h = l === weights.length - 1
      ? softmax(z)
      : z.map(v =>
          actFn === 'relu'    ? relu(v)    :
          actFn === 'sigmoid' ? sigmoid(v) :
          Math.tanh(v)
        );
    acts.push(h);
  }
  return acts;
}

function initNN() {
  // Stop any running worker/ws before reinitialising
  if (typeof WorkerBridge !== 'undefined') WorkerBridge.stop();
  if (typeof WsClient     !== 'undefined') WsClient.stop();

  const layers = parseInt(document.getElementById('ctrl-layers')?.value || 2);
  const act    = document.getElementById('ctrl-act')?.value || 'relu';
  const sizes  = [3, ...(layers === 1 ? [5] : layers === 2 ? [6, 4] : [8, 6, 4]), 2];
  const weights = sizes.slice(0, -1).map((s, i) =>
    Array.from({ length: sizes[i + 1] }, () =>
      Array.from({ length: s }, () => randn() * 0.5)
    )
  );

  // Adapt to real data if available
  const rawPts = getDataForAlgo('neural_network');
  let trainData = null;
  let inputSize  = 3;
  let numClasses = 2;
  if (rawPts && rawPts.length >= 8) {
    sizes[0] = 2; inputSize = 2;
    const classes = [...new Set(rawPts.map(p => p.label))].sort();
    numClasses = Math.max(2, classes.length);
    sizes[sizes.length - 1] = numClasses;
    trainData = rawPts.map(p => ({ x: [p.x, p.y], label: classes.indexOf(p.label) }));
    log(`Neural net: using ${rawPts.length} real pts, ${classes.length} classes`, 'info');
  }

  // Build synthetic data for TF.js/WS mode when no real data loaded
  if (!trainData) {
    trainData = Array.from({ length: 200 }, () => {
      const x1 = (Math.random() - 0.5) * 4, x2 = (Math.random() - 0.5) * 4;
      return { x: [x1, x2, x1 * x2], label: (x1 * x2 > 0) ? 0 : 1 };
    });
    inputSize = 3;
  }

  LAB.state = {
    sizes, weights, act, loss: 1.5, acc: 0, epoch: 0,
    activations: null, trainData, inputSize, numClasses,
    secHistory: [],
  };
  miniHistory = [];

  // Phase 4 — launch real training if mode is not 'simulate'
  const mode   = LAB.trainingMode || 'simulate';
  const lr     = parseFloat(document.getElementById('ctrl-lr-nn')?.value || 0.001);
  const epochs = parseInt(document.getElementById('ctrl-epochs')?.value || 100);
  const batch  = parseInt(document.getElementById('ctrl-batch')?.value  || 32);

  if (mode === 'tfjs' && typeof WorkerBridge !== 'undefined') {
    log(`Initialising TF.js worker — lr=${lr} epochs=${epochs} batch=${batch}`, 'info');
    WorkerBridge.start({
      layers, act, lr, epochs, batchSize: batch,
      data: trainData, inputSize, numClasses,
    });
    LAB.state.tfMode = true;
  } else if (mode === 'websocket' && typeof WsClient !== 'undefined') {
    log(`Connecting to WS backend — lr=${lr} epochs=${epochs}`, 'info');
    WsClient.start({
      layers, act, lr, epochs, batchSize: batch,
      data: trainData, inputSize, numClasses,
    });
    LAB.state.tfMode = true;
  } else {
    LAB.state.tfMode = false;
    if (mode !== 'simulate')
      log('TF.js/WS not available — using simulate mode', 'info');
  }
}

function stepNN() {
  const s = LAB.state;

  // Phase 4: if real training is running in worker/ws, stepNN is a no-op —
  // the worker posts updates directly into LAB.state via workerBridge/wsClient.
  if (s.tfMode) {
    D.statsIter.textContent = `ep ${s.epoch ?? 0}`;
    return;
  }

  let input, target;
  if (s.trainData && s.trainData.length) {
    const pt = s.trainData[LAB.iteration % s.trainData.length];
    input  = pt.x;
    target = pt.label;
  } else {
    input  = Array.from({ length: s.sizes[0] }, () => randn());
    target = Math.random() < 0.5 ? 0 : 1;
  }

  s.activations = forwardNN(input, s.weights, s.act);

  // Simulated loss convergence with realistic noise
  s.loss  = Math.max(0.01, s.loss * 0.988 + (Math.random() - 0.485) * 0.035);
  s.acc   = Math.min(0.99, 1 - s.loss / 2 + (Math.random() - 0.5) * 0.04);
  s.epoch = Math.floor(LAB.iteration / 10);

  // Simulated weight update
  for (let l = 0; l < s.weights.length; l++)
    for (let i = 0; i < s.weights[l].length; i++)
      for (let j = 0; j < s.weights[l][i].length; j++)
        s.weights[l][i][j] += (Math.random() - 0.5) * 0.04 * s.loss;

  miniHistory.push(s.loss);
  // Phase 3: populate secondary history (accuracy) for dual-track chart
  if (!s.secHistory) s.secHistory = [];
  s.secHistory.push(s.acc * 100);
  LAB.state.secHistory = s.secHistory;
  updateMetric('loss',  s.loss);
  updateMetric('acc',   `${(s.acc * 100).toFixed(1)}%`);
  updateMetric('epoch', s.epoch);
  updateMetric('lr',    '0.001');
  D.statsIter.textContent = `epoch ${s.epoch}`;
  showLiveEq('h^{(l)}=\\sigma(W^{(l)}h^{(l-1)}+b^{(l)})', `Loss=${s.loss.toFixed(4)} Acc=${(s.acc * 100).toFixed(1)}%`);
  highlightStep(Math.min(5, Math.floor(LAB.iteration / 8)));
  if (LAB.iteration % 10 === 0)
    log(`Epoch ${s.epoch} Loss=${s.loss.toFixed(4)} Acc=${(s.acc * 100).toFixed(1)}%`);
}

function drawNN() {
  const ctx = getCtx();
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  const s = LAB.state;
  if (!s.sizes) return;

  // Phase 3: split canvas — top 62% = network, bottom 38% = activation heatmap
  const SPLIT   = Math.floor(h * 0.62);
  const HMAP_Y  = SPLIT + 2;
  const HMAP_H  = h - HMAP_Y - 2;

  // ── TOP: network diagram ──
  // Draw grid only in upper region
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, SPLIT); ctx.clip();
  drawGrid(ctx, w, SPLIT);
  ctx.restore();

  const PAD = 36, lc = s.sizes.length, xS = (w - 2 * PAD) / (lc - 1);
  const netTop = 20, netBot = SPLIT - 24;
  const neuronY = (layer, i) => {
    const n = s.sizes[layer];
    const mid = (netTop + netBot) / 2;
    return mid + (i - (n - 1) / 2) * Math.min(44, (netBot - netTop) / Math.max(n, 1));
  };

  // Connections
  for (let l = 0; l < lc - 1; l++) {
    const x1 = PAD + l * xS, x2 = PAD + (l + 1) * xS;
    const n1 = s.sizes[l], n2 = s.sizes[l + 1];
    for (let i = 0; i < n1; i++) {
      for (let j = 0; j < n2; j++) {
        const wv    = s.weights[l]?.[j]?.[i] || 0;
        const alpha = clamp(Math.abs(wv) * 0.55, 0.04, 0.48);
        ctx.strokeStyle = wv > 0 ? `rgba(77,232,244,${alpha})` : `rgba(248,113,113,${alpha})`;
        ctx.lineWidth   = clamp(Math.abs(wv) * 1.4, 0.3, 2.4);
        ctx.beginPath();
        ctx.moveTo(x1, neuronY(l, i));
        ctx.lineTo(x2, neuronY(l + 1, j));
        ctx.stroke();
      }
    }
  }

  // Neurons
  for (let l = 0; l < lc; l++) {
    const x    = PAD + l * xS;
    const acts = s.activations?.[l];
    const col  = l === 0 ? '167,139,250' : l === lc - 1 ? '52,211,153' : '77,232,244';
    const strokeCol = l === 0 ? '#a78bfa' : l === lc - 1 ? '#34d399' : '#4de8f4';
    for (let i = 0; i < s.sizes[l]; i++) {
      const y   = neuronY(l, i);
      const val = clamp(acts?.[i] ?? 0.5, 0, 1);
      const r   = 15;
      const gr  = ctx.createRadialGradient(x, y, 2, x, y, r * 2);
      gr.addColorStop(0, `rgba(${col},${val * 0.8 + 0.1})`);
      gr.addColorStop(1, `rgba(${col},0)`);
      ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col},${0.18 + val * 0.5})`;
      ctx.strokeStyle = strokeCol; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8f0ff'; ctx.font = '8px Space Mono,monospace';
      ctx.textAlign = 'center'; ctx.fillText(val.toFixed(2), x, y + 3);
    }
  }

  // Layer labels
  const labels = ['In', ...Array(lc - 2).fill(0).map((_, i) => `H${i + 1}`), 'Out'];
  ctx.textAlign = 'center';
  for (let l = 0; l < lc; l++) {
    const x = PAD + l * xS;
    ctx.fillStyle = l === 0 ? '#a78bfa' : l === lc - 1 ? '#34d399' : '#4de8f4';
    ctx.font = 'bold 10px Syne,sans-serif';
    ctx.fillText(labels[l], x, SPLIT - 6);
  }
  ctx.textAlign = 'left';

  // Divider line between network and heatmap
  ctx.strokeStyle = 'rgba(80,130,255,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, SPLIT); ctx.lineTo(w, SPLIT); ctx.stroke();

  // ── BOTTOM: Activation heatmap ──
  // Each column = one layer, each row = one neuron, colour = activation magnitude
  if (s.activations && HMAP_H > 20) {
    const cellW = Math.floor((w - 2 * PAD) / lc);
    const maxN  = Math.max(...s.sizes);
    const cellH = Math.max(2, Math.floor(HMAP_H / maxN));

    // Heatmap label
    ctx.fillStyle = 'rgba(77,232,244,0.45)';
    ctx.font = 'bold 8px Space Mono,monospace';
    ctx.fillText('ACTIVATION MAP', PAD, HMAP_Y + 10);

    for (let l = 0; l < lc; l++) {
      const acts = s.activations[l] || [];
      const x    = PAD + l * cellW;
      const col  = l === 0 ? [167,139,250] : l === lc - 1 ? [52,211,153] : [77,232,244];
      for (let i = 0; i < s.sizes[l]; i++) {
        const val  = clamp(acts[i] ?? 0, 0, 1);
        const cy   = HMAP_Y + 16 + i * cellH;
        const alpha = 0.08 + val * 0.82;
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
        ctx.fillRect(x + 2, cy, cellW - 4, cellH - 1);
        // Bright border on high activations
        if (val > 0.6) {
          ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.6)`;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2, cy, cellW - 4, cellH - 1);
        }
        // Value text if cell is tall enough
        if (cellH >= 11) {
          ctx.fillStyle = val > 0.4 ? 'rgba(232,240,255,0.9)' : 'rgba(74,86,128,0.7)';
          ctx.font = '7px Space Mono,monospace'; ctx.textAlign = 'center';
          ctx.fillText(val.toFixed(2), x + cellW / 2, cy + cellH - 2);
        }
      }
    }

    // Colour-scale legend bar
    const barX = w - 80, barY = HMAP_Y + 14, barW = 60, barH = 6;
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, 'rgba(30,40,80,1)');
    grad.addColorStop(1, 'rgba(77,232,244,1)');
    ctx.fillStyle = grad; ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = 'rgba(80,130,255,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = 'rgba(139,156,200,0.6)'; ctx.font = '7px Space Mono,monospace'; ctx.textAlign = 'left';
    ctx.fillText('0', barX - 1, barY + barH + 8); ctx.textAlign = 'right';
    ctx.fillText('1', barX + barW + 1, barY + barH + 8); ctx.textAlign = 'left';
  }

  // ── Info overlay (top-left) ──
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(10, 10, 168, 38);
  ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 10px Space Mono,monospace';
  ctx.fillText(`L=${(s.loss || 0).toFixed(5)}`, 18, 26);
  ctx.fillStyle = '#34d399';
  ctx.fillText(`Acc=${((s.acc || 0) * 100).toFixed(1)}%  Ep=${s.epoch || 0}`, 18, 42);
}
