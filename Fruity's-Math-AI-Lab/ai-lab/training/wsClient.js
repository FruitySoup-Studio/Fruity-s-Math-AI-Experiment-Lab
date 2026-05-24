/**
 * ai-lab/training/wsClient.js
 * WebSocket client for Mode 2 backend training.
 * Connects to ws://localhost:8765 (the FastAPI/PyTorch server).
 * Exposes the same { start, stop, isActive } API as WorkerBridge
 * so neuralNetwork.js doesn't need to know which mode is active.
 *
 * Server message protocol (received):
 *   { type: 'ready' }
 *   { type: 'metrics', loss, acc, epoch, batch }
 *   { type: 'weights', layerWeights: [...] }
 *   { type: 'activations', acts: [...] }
 *   { type: 'done', finalLoss, finalAcc, epochs }
 *   { type: 'error', message }
 *
 * Client message protocol (sent):
 *   { type: 'start', config: {...} }
 *   { type: 'stop' }
 *
 * To run the server:
 *   pip install fastapi uvicorn websockets torch torchvision
 *   python ai-lab/training/server.py
 *
 * Depends on: state.js (LAB, miniHistory), canvas.js (log, toast, showLiveEq),
 *             ui.js (updateMetric, D), runtime.js (stopRunning)
 */

const WsClient = (() => {
  const WS_URL  = 'ws://localhost:8765';
  let _ws       = null;
  let _active   = false;
  let _onDone   = null;
  let _statusEl = null;

  function setStatus(msg, type) {
    if (!_statusEl) _statusEl = document.getElementById('ws-status-badge');
    if (_statusEl) {
      _statusEl.textContent = msg;
      _statusEl.className   = `ws-status-badge ${type || ''}`;
    }
  }

  /* ── Handle incoming server message ── */
  function handleMessage(raw) {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    if (!_active) return;

    switch (data.type) {

      case 'ready':
        setStatus('Connected · Training', 'connected');
        log('[WS] Server ready — PyTorch training started', 'success');
        toast('Backend training running…');
        break;

      case 'metrics': {
        const s = LAB.state;
        s.loss  = data.loss;
        s.acc   = data.acc;
        s.epoch = data.epoch;
        miniHistory.push(data.loss);
        if (!s.secHistory) s.secHistory = [];
        s.secHistory.push((data.acc ?? 0) * 100);
        LAB.state.secHistory = s.secHistory;

        updateMetric('loss',  data.loss);
        updateMetric('acc',   `${((data.acc ?? 0) * 100).toFixed(1)}%`);
        updateMetric('epoch', data.epoch);
        LAB.iteration++;
        D.statsIter.textContent = `ep ${data.epoch}`;
        showLiveEq(
          'h^{(l)}=\\sigma(W^{(l)}h^{(l-1)}+b^{(l)})',
          `Loss=${data.loss.toFixed(4)}  Acc=${((data.acc ?? 0) * 100).toFixed(1)}%`
        );
        if (LAB.iteration % 20 === 0)
          log(`[WS] Epoch ${data.epoch}  Loss=${data.loss.toFixed(4)}  Acc=${((data.acc ?? 0) * 100).toFixed(1)}%`);
        break;
      }

      case 'weights':
        if (data.layerWeights) LAB.state.weights = data.layerWeights;
        break;

      case 'activations':
        if (data.acts) LAB.state.activations = data.acts;
        break;

      case 'done':
        _active = false; _ws = null;
        setStatus('Disconnected', '');
        log(`[WS] Training complete — Loss=${data.finalLoss?.toFixed(4)}  Acc=${data.finalAcc?.toFixed(1)}%`, 'success');
        toast(`Done! Final acc: ${data.finalAcc?.toFixed(1)}%`);
        ExperimentTracker.save({
          algo: 'neural_network', mode: 'websocket',
          finalLoss: data.finalLoss, finalAcc: data.finalAcc, epochs: data.epochs,
          lossHistory: miniHistory.slice(),
        });
        if (typeof _onDone === 'function') _onDone(data);
        stopRunning();
        break;

      case 'error':
        _active = false; _ws = null;
        setStatus('Error', 'error');
        log(`[WS] Server error: ${data.message}`, 'error');
        toast('Server error — see log');
        stopRunning();
        break;
    }
  }

  /* ── Open connection and start training ── */
  function start(config) {
    if (_ws) stop();

    setStatus('Connecting…', 'connecting');
    log(`[WS] Connecting to ${WS_URL}…`, 'info');

    try {
      _ws = new WebSocket(WS_URL);
    } catch (e) {
      log(`[WS] Cannot open WebSocket: ${e.message}`, 'error');
      toast('Cannot reach backend — is the server running?');
      return;
    }

    _ws.onopen = () => {
      _active = true;
      setStatus('Connected · Starting', 'connecting');
      _ws.send(JSON.stringify({ type: 'start', config }));
    };

    _ws.onmessage = (e) => handleMessage(e.data);

    _ws.onerror = () => {
      setStatus('Connection failed', 'error');
      log('[WS] Connection error — is the server running?', 'error');
      toast('Cannot reach backend server');
      _active = false; _ws = null;
      stopRunning();
    };

    _ws.onclose = () => {
      if (_active) {
        setStatus('Disconnected', '');
        log('[WS] Server disconnected', 'info');
        _active = false; _ws = null;
        stopRunning();
      }
    };
  }

  /* ── Send stop and close ── */
  function stop() {
    if (_ws && _ws.readyState === WebSocket.OPEN) {
      _ws.send(JSON.stringify({ type: 'stop' }));
      setTimeout(() => { _ws?.close(); _ws = null; }, 300);
    }
    _active = false;
    setStatus('Disconnected', '');
  }

  return {
    start,
    stop,
    isActive: () => _active,
    onDone:   (fn) => { _onDone = fn; },
  };
})();
