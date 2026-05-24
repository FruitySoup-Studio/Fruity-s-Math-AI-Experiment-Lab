/**
 * ai-lab/core/dataSystem.js
 * Sample datasets, CSV/paste parsing, column mapping, data import events.
 * Depends on: state.js (LAB, DATA_STORE), utils.js (randn, normalizeXY), ui.js (D)
 * Must load after utils.js and ui.js.
 */

/* ═══════════════════════════════════
   BUILT-IN SAMPLE DATASETS
═══════════════════════════════════ */
const SAMPLES = {
  linear: () => {
    const pts = [];
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 4;
      pts.push({ x, y: 1.8 * x + 0.5 + randn() * 0.5, label: 0 });
    }
    return pts;
  },

  nonlinear: () => {
    const pts = [];
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 4;
      pts.push({ x, y: Math.sin(x * 1.5) + randn() * 0.3, label: 0 });
    }
    return pts;
  },

  clusters: () => {
    const centers = [[1.5, 1.5], [-1.5, 1], [0, -1.8], [1.8, -1], [-1, -1.5]];
    const pts = [];
    centers.forEach((c, k) => {
      for (let i = 0; i < 20; i++)
        pts.push({ x: c[0] + randn() * 0.45, y: c[1] + randn() * 0.45, label: k });
    });
    return pts;
  },

  moons: () => {
    const pts = [];
    for (let i = 0; i < 60; i++) {
      const t = Math.PI * i / 30;
      if (i < 30)
        pts.push({ x: Math.cos(t) * 2 + randn() * 0.18, y: Math.sin(t) * 2 + randn() * 0.18, label: 0 });
      else
        pts.push({ x: (Math.cos(t) + 1) * 2 + randn() * 0.18, y: (-Math.sin(t) + 0.5) * 2 + randn() * 0.18, label: 1 });
    }
    return normalizeXY(pts);
  },

  iris: () => {
    const data = [
      [5.1,3.5,0],[4.9,3.0,0],[4.7,3.2,0],[4.6,3.1,0],[5.0,3.6,0],[5.4,3.9,0],[4.6,3.4,0],[5.0,3.4,0],
      [4.4,2.9,0],[4.9,3.1,0],[7.0,3.2,1],[6.4,3.2,1],[6.9,3.1,1],[5.5,2.3,1],[6.5,2.8,1],[5.7,2.8,1],
      [6.3,3.3,1],[4.9,2.4,1],[6.6,2.9,1],[5.2,2.7,1],[6.3,3.3,2],[5.8,2.7,2],[7.1,3.0,2],[6.3,2.9,2],
      [6.5,3.0,2],[7.6,3.0,2],[4.9,2.5,2],[7.3,2.9,2],[6.7,2.5,2],[7.2,3.6,2],
    ];
    return normalizeXY(data.map(([x, y, label]) => ({ x, y, label })));
  },

  xor: () => {
    const pts = [];
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * 4, y = (Math.random() - 0.5) * 4;
      pts.push({ x, y, label: (x * y > 0) ? 0 : 1 });
    }
    return pts;
  },

  spiral: () => {
    const pts = [];
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 50; i++) {
        const t = i / 50 * Math.PI * 4 + k * Math.PI;
        const r = i / 50 * 2 + 0.2;
        pts.push({ x: r * Math.cos(t) + randn() * 0.1, y: r * Math.sin(t) + randn() * 0.1, label: k });
      }
    }
    return normalizeXY(pts);
  },

  circles: () => {
    const pts = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = (Math.random() < 0.5) ? 0.8 : 1.8;
      pts.push({ x: r * Math.cos(angle) + randn() * 0.12, y: r * Math.sin(angle) + randn() * 0.12, label: r < 1.5 ? 0 : 1 });
    }
    return normalizeXY(pts);
  },
};

/* ═══════════════════════════════════
   CSV PARSING
═══════════════════════════════════ */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) throw new Error('Empty data');

  const sep = lines[0].includes('\t') ? '\t' : ',';
  const rows = lines.map(l => l.split(sep).map(c => c.trim()));

  const firstRow = rows[0];
  const hasHeader = isNaN(parseFloat(firstRow[0]));
  const headers = hasHeader ? firstRow : firstRow.map((_, i) => `col${i}`);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  if (dataRows.length < 2)      throw new Error('Need at least 2 data rows');
  if (dataRows[0].length < 2)   throw new Error('Need at least 2 columns (x, y)');

  return { headers, rows: dataRows };
}

function applyColumnMapping(headers, rows, xi, yi, li) {
  const pts = [];
  for (const row of rows) {
    const x = parseFloat(row[xi]);
    const y = parseFloat(row[yi]);
    if (isNaN(x) || isNaN(y)) continue;
    const label = (li >= 0 && row[li] !== undefined) ? (parseFloat(row[li]) || 0) : 0;
    pts.push({ x, y, label });
  }
  if (!pts.length) throw new Error('No valid numeric rows found');
  return normalizeXY(pts);
}

function populateColSelects(headers) {
  [D.colX, D.colY, D.colLabel].forEach(sel => { sel.innerHTML = ''; });
  D.colLabel.innerHTML = '<option value="-1">None</option>';
  headers.forEach((h, i) => {
    [D.colX, D.colY, D.colLabel].forEach(sel => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = h;
      sel.appendChild(opt);
    });
  });
  D.colX.value     = 0;
  D.colY.value     = Math.min(1, headers.length - 1);
  D.colLabel.value = headers.length >= 3 ? 2 : -1;
  D.colMapSection.style.display = 'block';
}

function loadDataIntoStore(pts, source) {
  DATA_STORE.raw    = pts;
  DATA_STORE.source = source;
  const n = pts.length;
  setDataStatus(`✓ ${n} points loaded from ${source}`, 'success');
  D.dataCountBadge.textContent      = `${n} pts · ${source}`;
  D.dataActiveBadge.style.display   = 'inline';
  if (LAB.currentAlgo) {
    stopRunning();
    initAlgo(LAB.currentAlgo);
    drawFrame();
  }
  log(`Data loaded: ${n} points (${source})`, 'success');
}

function setDataStatus(msg, type = '') {
  D.dataStatus.textContent = msg;
  D.dataStatus.className   = 'data-status' + (type ? ' ' + type : '');
}

/** Return real imported data if available, else null (callers use synthetic fallback) */
function getDataForAlgo(algo) {
  if (DATA_STORE.raw && DATA_STORE.raw.length >= 2) return DATA_STORE.raw;
  return null;
}

/* ═══════════════════════════════════
   DATA IMPORT EVENT WIRING
═══════════════════════════════════ */
function wireDatImport() {
  // Sample dataset buttons
  D.sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.sample;
      const fn = SAMPLES[name];
      if (!fn) return;
      D.sampleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      try {
        const pts = fn();
        loadDataIntoStore(pts, `sample:${name}`);
        toast(`Loaded sample: ${btn.textContent.trim()}`);
      } catch (e) { setDataStatus('Error: ' + e.message, 'error'); }
    });
  });

  // Drop zone → file picker
  D.dropZone.addEventListener('click',     () => D.csvInput.click());
  D.dropZone.addEventListener('dragover',  e  => { e.preventDefault(); D.dropZone.classList.add('drag-over'); });
  D.dropZone.addEventListener('dragleave', ()  => D.dropZone.classList.remove('drag-over'));
  D.dropZone.addEventListener('drop', e => {
    e.preventDefault();
    D.dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) readCSVFile(file);
  });
  D.csvInput.addEventListener('change', () => {
    if (D.csvInput.files[0]) readCSVFile(D.csvInput.files[0]);
  });

  // Paste load
  D.btnLoadPaste.addEventListener('click', () => {
    const text = D.pasteArea.value.trim();
    if (!text) { setDataStatus('Paste some data first.', 'warn'); return; }
    try {
      const { headers, rows } = parseCSV(text);
      DATA_STORE.columns = headers;
      DATA_STORE._rows   = rows;
      if (rows[0].length >= 3) {
        populateColSelects(headers);
        setDataStatus(`Parsed ${rows.length} rows · ${headers.length} cols. Map columns below.`, '');
      } else {
        const pts = applyColumnMapping(headers, rows, 0, 1, rows[0].length >= 3 ? 2 : -1);
        D.sampleBtns.forEach(b => b.classList.remove('active'));
        loadDataIntoStore(pts, 'paste');
        D.colMapSection.style.display = 'none';
        toast(`Loaded ${pts.length} points from paste`);
      }
    } catch (e) { setDataStatus('Parse error: ' + e.message, 'error'); }
  });

  // Apply column mapping
  D.btnApplyCols.addEventListener('click', () => {
    if (!DATA_STORE._rows) { setDataStatus('Load data first.', 'warn'); return; }
    try {
      const xi = parseInt(D.colX.value);
      const yi = parseInt(D.colY.value);
      const li = parseInt(D.colLabel.value);
      const pts = applyColumnMapping(DATA_STORE.columns, DATA_STORE._rows, xi, yi, li);
      D.sampleBtns.forEach(b => b.classList.remove('active'));
      loadDataIntoStore(pts, DATA_STORE.source === 'paste' ? 'paste' : 'csv');
      D.colMapSection.style.display = 'none';
      toast(`Applied mapping: ${pts.length} points`);
    } catch (e) { setDataStatus('Mapping error: ' + e.message, 'error'); }
  });

  // Clear data → back to synthetic
  D.btnClearData.addEventListener('click', () => {
    DATA_STORE.raw    = null;
    DATA_STORE.source = 'synthetic';
    D.dataActiveBadge.style.display = 'none';
    D.dataCountBadge.textContent    = 'synthetic';
    D.colMapSection.style.display   = 'none';
    D.pasteArea.value = '';
    D.sampleBtns.forEach(b => b.classList.remove('active'));
    setDataStatus('');
    if (LAB.currentAlgo) { stopRunning(); initAlgo(LAB.currentAlgo); drawFrame(); }
    toast('Using synthetic data');
    log('Cleared imported data — using synthetic', 'info');
  });
}

function readCSVFile(file) {
  setDataStatus(`Reading ${file.name}…`);
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const { headers, rows } = parseCSV(e.target.result);
      DATA_STORE.columns = headers;
      DATA_STORE._rows   = rows;
      DATA_STORE.source  = 'csv';
      D.sampleBtns.forEach(b => b.classList.remove('active'));
      if (rows[0].length >= 3) {
        populateColSelects(headers);
        setDataStatus(`"${file.name}" · ${rows.length} rows · ${headers.length} cols. Map columns below.`);
      } else {
        const pts = applyColumnMapping(headers, rows, 0, 1, rows[0].length >= 3 ? 2 : -1);
        loadDataIntoStore(pts, 'csv');
        toast(`Loaded ${pts.length} points from ${file.name}`);
      }
    } catch (e) { setDataStatus('Error: ' + e.message, 'error'); }
  };
  reader.readAsText(file);
}
