/**
 * ai-lab/training/architectureBuilder.js
 * Drag-and-drop neural architecture builder.
 * Renders onto #builder-canvas (injected into ai-lab.html by Phase 5).
 * Lets users click to add layers, drag to reorder, click layers to edit,
 * and export the architecture to the NN algorithm.
 *
 * Depends on: state.js (LAB), canvas.js (log, toast),
 *             ui.js (initAlgo, drawFrame)
 */

const ArchBuilder = (() => {

  /* ─── Layer type catalogue ─── */
  const LAYER_TYPES = {
    input:   { label: 'Input',    color: '#a78bfa', icon: '→'  },
    dense:   { label: 'Dense',    color: '#4de8f4', icon: '⬛'  },
    dropout: { label: 'Dropout',  color: '#fbbf24', icon: '✕'  },
    output:  { label: 'Output',   color: '#34d399', icon: '★'  },
  };

  /* ─── State ─── */
  let _canvas  = null;
  let _ctx     = null;
  let _layers  = [];          // [{type, units, rate, id}]
  let _drag    = null;        // {idx, startX, startY, curX, curY}
  let _sel     = null;        // selected layer idx
  let _dirty   = false;

  /* ─── Default architecture ─── */
  function defaultArch() {
    return [
      { id: uid(), type: 'input',   units: 2,    rate: 0 },
      { id: uid(), type: 'dense',   units: 12,   rate: 0 },
      { id: uid(), type: 'dense',   units: 8,    rate: 0 },
      { id: uid(), type: 'dropout', units: 0,    rate: 0.2 },
      { id: uid(), type: 'output',  units: 2,    rate: 0 },
    ];
  }

  function uid() { return Math.random().toString(36).slice(2, 8); }

  /* ─── Layout constants ─── */
  const LAYER_W  = 76, LAYER_H = 54, GAP = 20, PAD_Y = 20;
  const CONN_H   = 18;   // connector triangle height

  function layerX(i) { return PAD_Y + i * (LAYER_W + GAP); }
  function layerY()   { return 60; }

  /* ─── Render ─── */
  function render() {
    if (!_ctx) return;
    const w = _canvas.width, h = _canvas.height;
    _ctx.clearRect(0, 0, w, h);

    // Background
    _ctx.fillStyle = 'rgba(10,14,30,0.95)';
    _ctx.fillRect(0, 0, w, h);

    // Grid
    _ctx.strokeStyle = 'rgba(80,130,255,0.06)';
    _ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      _ctx.beginPath(); _ctx.moveTo(x, 0); _ctx.lineTo(x, h); _ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      _ctx.beginPath(); _ctx.moveTo(0, y); _ctx.lineTo(w, y); _ctx.stroke();
    }

    const layers = _drag ? reorderPreview() : _layers;

    // Connection lines
    for (let i = 0; i < layers.length - 1; i++) {
      const x1 = layerX(i)  + LAYER_W / 2;
      const x2 = layerX(i + 1) + LAYER_W / 2;
      const y1 = layerY()   + LAYER_H;
      const y2 = layerY();
      _ctx.beginPath();
      _ctx.moveTo(x1, y1);
      _ctx.bezierCurveTo(x1, y1 + 14, x2, y2 - 14, x2, y2);
      _ctx.strokeStyle = 'rgba(80,130,255,0.22)';
      _ctx.lineWidth   = 2;
      _ctx.stroke();
    }

    // Layer cards
    layers.forEach((layer, i) => {
      const x   = layerX(i), y = layerY();
      const def = LAYER_TYPES[layer.type] || LAYER_TYPES.dense;
      const sel = _sel === i;
      const isDragging = _drag && _drag.idx === i;

      if (isDragging) {
        // Ghost at original position
        _ctx.globalAlpha = 0.25;
        drawLayerCard(_ctx, x, y, layer, def, false);
        _ctx.globalAlpha = 1;
        // Floating card at cursor
        drawLayerCard(_ctx, _drag.curX - LAYER_W / 2, _drag.curY - LAYER_H / 2, layer, def, true);
      } else {
        drawLayerCard(_ctx, x, y, layer, def, sel);
      }
    });

    // "+ Add" button zones
    const addY = layerY() + LAYER_H + 26;
    _ctx.fillStyle = 'rgba(77,232,244,0.08)';
    _ctx.strokeStyle = 'rgba(77,232,244,0.25)';
    _ctx.lineWidth = 1;
    _ctx.setLineDash([3, 3]);
    _ctx.beginPath();
    _ctx.roundRect?.(10, addY, 58, 24, 4) || _ctx.rect(10, addY, 58, 24);
    _ctx.fill(); _ctx.stroke();
    _ctx.setLineDash([]);
    _ctx.fillStyle = 'rgba(77,232,244,0.7)';
    _ctx.font = 'bold 9px Space Mono,monospace';
    _ctx.textAlign = 'center';
    _ctx.fillText('+ Dense', 39, addY + 15);
    _ctx.fillText('+ Drop',  39, addY + 32);

    // Selected layer edit panel
    if (_sel !== null && _layers[_sel]) {
      drawEditPanel(_ctx, w, h, _layers[_sel], _sel);
    }

    // Title
    _ctx.textAlign = 'left';
    _ctx.fillStyle = 'rgba(167,139,250,0.55)';
    _ctx.font = 'bold 9px Space Mono,monospace';
    _ctx.fillText(`ARCH BUILDER  |  ${_layers.length} layers`, 10, 14);
    _ctx.fillStyle = 'rgba(139,156,200,0.4)';
    _ctx.font = '8px Space Mono,monospace';
    _ctx.fillText('click=select  drag=reorder  dbl-click=delete', 10, 26);
  }

  function drawLayerCard(ctx, x, y, layer, def, highlight) {
    // Shadow glow
    if (highlight) {
      ctx.shadowBlur  = 16;
      ctx.shadowColor = def.color;
    }
    // Card background
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, LAYER_W, LAYER_H, 6);
    else ctx.rect(x, y, LAYER_W, LAYER_H);
    ctx.fillStyle   = highlight
      ? def.color.replace('#', 'rgba(').replace(/(..)(..)(..)/, (_, r, g, b) =>
          `${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},0.22)`)
      : 'rgba(15,20,45,0.95)';
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth   = highlight ? 2 : 1.2;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // Icon
    ctx.fillStyle   = def.color;
    ctx.font        = '14px sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText(def.icon, x + LAYER_W / 2, y + 20);

    // Type label
    ctx.fillStyle = highlight ? '#fff' : def.color;
    ctx.font      = 'bold 8px Space Mono,monospace';
    ctx.fillText(def.label, x + LAYER_W / 2, y + 33);

    // Unit/rate label
    ctx.fillStyle = 'rgba(200,220,255,0.65)';
    ctx.font      = '8px Space Mono,monospace';
    const detail  = layer.type === 'dropout'
      ? `p=${layer.rate}`
      : layer.type === 'input' || layer.type === 'output'
        ? `${layer.units}u`
        : `${layer.units}u`;
    ctx.fillText(detail, x + LAYER_W / 2, y + 46);
    ctx.textAlign = 'left';
  }

  function drawEditPanel(ctx, w, h, layer, idx) {
    const def = LAYER_TYPES[layer.type] || LAYER_TYPES.dense;
    const px  = 10, py = layerY() + LAYER_H + 58, pw = Math.min(220, w - 20), ph = 68;
    ctx.fillStyle   = 'rgba(10,14,30,0.95)';
    ctx.strokeStyle = def.color;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, 5);
    else ctx.rect(px, py, pw, ph);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = def.color;
    ctx.font = 'bold 9px Space Mono,monospace';
    ctx.fillText(`Layer ${idx + 1}: ${def.label}`, px + 8, py + 14);

    ctx.fillStyle = 'rgba(200,220,255,0.65)';
    ctx.font = '8px Space Mono,monospace';
    if (layer.type === 'dropout') {
      ctx.fillText(`Dropout rate: ${layer.rate}  (use slider below)`, px + 8, py + 30);
    } else if (layer.type !== 'input') {
      ctx.fillText(`Units: ${layer.units}  (use slider below)`, px + 8, py + 30);
    }
    ctx.fillStyle = 'rgba(139,156,200,0.45)';
    ctx.fillText('Dbl-click card to delete layer', px + 8, py + 46);
    ctx.fillText('Click canvas bg to deselect',   px + 8, py + 58);
  }

  /* ─── Drag reorder preview ─── */
  function reorderPreview() {
    if (!_drag) return _layers;
    const layers  = [..._layers];
    const target  = Math.round((_drag.curX - PAD_Y - LAYER_W / 2) / (LAYER_W + GAP));
    const clamped = Math.max(0, Math.min(layers.length - 1, target));
    const item    = layers.splice(_drag.idx, 1)[0];
    layers.splice(clamped, 0, item);
    return layers;
  }

  /* ─── Hit testing ─── */
  function hitLayer(mx, my) {
    for (let i = _layers.length - 1; i >= 0; i--) {
      const x = layerX(i), y = layerY();
      if (mx >= x && mx <= x + LAYER_W && my >= y && my <= y + LAYER_H) return i;
    }
    return -1;
  }

  /* ─── Event handlers ─── */
  function onMouseDown(e) {
    const { mx, my } = evCoords(e);
    const hi = hitLayer(mx, my);

    // Check "add" button zones
    const addY = layerY() + LAYER_H + 26;
    if (mx >= 10 && mx <= 68) {
      if (my >= addY && my <= addY + 18) {
        addLayer('dense');   return;
      }
      if (my >= addY + 18 && my <= addY + 36) {
        addLayer('dropout'); return;
      }
    }

    if (hi >= 0) {
      _sel  = hi;
      _drag = { idx: hi, startX: mx, startY: my, curX: mx, curY: my };
    } else {
      _sel  = null;
      _drag = null;
    }
    render();
    emitChange();
  }

  function onMouseMove(e) {
    if (!_drag) return;
    const { mx, my } = evCoords(e);
    _drag.curX = mx; _drag.curY = my;
    render();
  }

  function onMouseUp(e) {
    if (!_drag) return;
    const { mx } = evCoords(e);
    const target  = Math.round((mx - PAD_Y - LAYER_W / 2) / (LAYER_W + GAP));
    const clamped = Math.max(0, Math.min(_layers.length - 1, target));
    if (clamped !== _drag.idx) {
      const item = _layers.splice(_drag.idx, 1)[0];
      _layers.splice(clamped, 0, item);
      _sel = clamped;
    }
    _drag = null;
    render();
    emitChange();
  }

  function onDblClick(e) {
    const { mx, my } = evCoords(e);
    const hi = hitLayer(mx, my);
    if (hi < 0) return;
    const l = _layers[hi];
    if (l.type === 'input' || l.type === 'output') { toast('Cannot delete input/output layers'); return; }
    _layers.splice(hi, 1);
    _sel = null;
    render();
    emitChange();
    log(`Deleted layer ${hi + 1}`, 'info');
  }

  function evCoords(e) {
    const r  = _canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (_canvas.width  / r.width);
    const my = (e.clientY - r.top)  * (_canvas.height / r.height);
    return { mx, my };
  }

  /* ─── Add/remove layers ─── */
  function addLayer(type) {
    const outIdx = _layers.findIndex(l => l.type === 'output');
    const pos    = outIdx >= 0 ? outIdx : _layers.length;
    const layer  = type === 'dropout'
      ? { id: uid(), type: 'dropout', units: 0,  rate: 0.2 }
      : { id: uid(), type: 'dense',   units: 8,  rate: 0   };
    _layers.splice(pos, 0, layer);
    _sel = pos;
    _canvas.width = canvasWidth();
    render();
    emitChange();
    log(`Added ${type} layer at position ${pos + 1}`, 'info');
  }

  function canvasWidth() {
    return PAD_Y * 2 + _layers.length * (LAYER_W + GAP) + 40;
  }

  /* ─── Export architecture to NN algorithm ─── */
  function exportToNN() {
    const dense = _layers.filter(l => l.type === 'dense' || l.type === 'output');
    const inputL = _layers.find(l => l.type === 'input');
    const inputSize = inputL?.units ?? 2;
    const sizes  = [inputSize, ...dense.map(l => l.units)];
    log(`Architecture exported: [${sizes.join(' → ')}]`, 'success');
    toast(`Exported: [${sizes.join('→')}]`);
    // Store in LAB for neuralNetwork.js to pick up
    LAB.builderArch = { sizes, layers: JSON.parse(JSON.stringify(_layers)) };
    if (LAB.currentAlgo === 'neural_network') {
      initAlgo('neural_network');
      drawFrame();
    }
    return sizes;
  }

  /* ─── Unit/rate editing via DOM slider ─── */
  function editSelected(value) {
    if (_sel === null || !_layers[_sel]) return;
    const l = _layers[_sel];
    if (l.type === 'dropout')         l.rate  = +parseFloat(value).toFixed(2);
    else if (l.type !== 'input')      l.units = parseInt(value);
    render();
    emitChange();
  }

  /* ─── Emit change for external listeners ─── */
  const _listeners = [];
  function emitChange() {
    _dirty = true;
    _listeners.forEach(fn => fn(_layers));
  }
  function onChange(fn) { _listeners.push(fn); }

  /* ─── Mount onto a canvas element ─── */
  function mount(canvasEl) {
    _canvas  = canvasEl;
    _ctx     = canvasEl.getContext('2d');
    _layers  = defaultArch();
    _canvas.width  = canvasWidth();
    _canvas.height = 210;

    _canvas.addEventListener('mousedown',  onMouseDown);
    _canvas.addEventListener('mousemove',  onMouseMove);
    _canvas.addEventListener('mouseup',    onMouseUp);
    _canvas.addEventListener('dblclick',   onDblClick);

    render();
    log('Architecture builder ready — drag layers to reorder, dbl-click to delete', 'info');
  }

  function getArchitecture() { return _layers; }
  function reset()           { _layers = defaultArch(); _sel = null; _canvas.width = canvasWidth(); render(); emitChange(); }

  return { mount, reset, exportToNN, editSelected, onChange, getArchitecture, addLayer };
})();
