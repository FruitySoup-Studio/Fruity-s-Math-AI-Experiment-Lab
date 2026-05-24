/**
 * app.js — Fruity's Lab Main Application
 * Orchestrates: Symbol Library, Equation Builder, Explanation Engine,  CREATED BY JEVANTE BOXLEY
 *               Calculator (math.js), Tooltips, and UI interactions.
 */

/* ════════════
   STATE
════════════════════ */
const State = {
  activeSymbol: null,        // Currently selected symbol object
  currentEquation: '',       // Raw expression string
  varValues: {},             // { varName: numericValue }
  tooltipTimeout: null,
};

/* ═════════════
   DOM REF
══════════════════════ */
const DOM = {
  symbolCategories: document.getElementById('symbol-categories'),
  symbolSearch:     document.getElementById('symbol-search'),
  equationInput:    document.getElementById('equation-input'),
  renderedMath:     document.getElementById('rendered-math'),
  explanationText:  document.getElementById('explanation-text'),
  resultDisplay:    document.getElementById('result-display'),
  resultSteps:      document.getElementById('result-steps'),
  varInputs:        document.getElementById('var-inputs'),
  detailInner:      document.getElementById('detail-inner'),
  tooltip:          document.getElementById('tooltip'),
  ttSymbol:         document.getElementById('tt-symbol'),
  ttName:           document.getElementById('tt-name'),
  ttDesc:           document.getElementById('tt-desc'),
  ttExample:        document.getElementById('tt-example'),
  toast:            document.getElementById('toast'),
  btnEval:          document.getElementById('btn-eval'),
  btnClear:         document.getElementById('btn-clear'),
  btnCopy:          document.getElementById('btn-copy'),
  btnRandom:        document.getElementById('btn-random'),
  btnBackspace:     document.getElementById('btn-backspace'),
};

/* ════════
   SYMBOL LIB BUILDER
═══════════════════════════ */

/**
 * Render the full symbol library sidebar.
 * @param {string} filter - search query string
 */
function renderSymbolLibrary(filter = '') {
  const query = filter.toLowerCase().trim();
  DOM.symbolCategories.innerHTML = '';
  let anyVisible = false;

  Object.entries(SYMBOL_DATA).forEach(([key, category]) => {
    const filtered = query
      ? category.symbols.filter(s =>
          s.glyph.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          s.shortName.toLowerCase().includes(query) ||
          s.explanation.toLowerCase().includes(query)
        )
      : category.symbols;

    if (filtered.length === 0) return;
    anyVisible = true;

    const catEl = document.createElement('div');
    catEl.className = 'sym-category';
    catEl.innerHTML = `<div class="sym-category-title">${category.label}</div>`;

    const grid = document.createElement('div');
    grid.className = 'sym-grid';

    filtered.forEach(sym => {
      const btn = document.createElement('button');
      btn.className = 'sym-btn';
      btn.dataset.key = key;
      btn.dataset.name = sym.name;
      btn.title = sym.name;
      btn.innerHTML = `
        <span class="sym-glyph">${sym.glyph}</span>
        <span class="sym-short-name">${sym.shortName}</span>
      `;

      // Click: show detail panel + insert peni....
      btn.addEventListener('click', () => onSymbolClick(sym, key, btn));

      // Hover: show mini tooltip
      btn.addEventListener('mouseenter', (e) => showTooltip(sym, e));
      btn.addEventListener('mouseleave', hideTooltip);

      grid.appendChild(btn);
    });

    catEl.appendChild(grid);
    DOM.symbolCategories.appendChild(catEl);
  });

  if (!anyVisible) {
    DOM.symbolCategories.innerHTML = `<div class="no-results">No symbols found for "<strong>${filter}</strong>"</div>`;
  }
}

/* ════════════════
   SYMBOL CLICK HANDLER
═════════════════════════════ */

function onSymbolClick(sym, categoryKey, btnEl) {
  // Highlight active button
  document.querySelectorAll('.sym-btn').forEach(b => b.classList.remove('active-symbol'));
  btnEl.classList.add('active-symbol');

  // Show detail panel
  renderDetailPanel(sym, SYMBOL_DATA[categoryKey].label);

  // Insert symbol into equation input
  insertAtCursor(sym.insert);
  State.activeSymbol = sym;
}

/* ═════════════════
   DEETS PANEL
═══════════════════════ */

function renderDetailPanel(sym, categoryLabel) {
  const examplesHtml = sym.examples.map(ex =>
    `<div class="detail-example-chip" data-expr="${escapeAttr(ex)}">${ex}</div>`
  ).join('');

  DOM.detailInner.innerHTML = `
    <div class="detail-card">
      <div class="detail-big-symbol">${sym.glyph}</div>
      <div class="detail-symbol-name">${sym.name}</div>
      <div class="detail-category-badge">${categoryLabel}</div>

      <div class="detail-section-label">Plain English</div>
      <div class="detail-section-content">${sym.explanation}</div>

      <div class="detail-divider"></div>

      <div class="detail-section-label">Mathematical Definition</div>
      <div class="detail-definition">${sym.definition}</div>

      <div class="detail-section-label">Examples</div>
      <div class="detail-examples">${examplesHtml}</div>

      <button class="btn-insert-symbol" data-insert="${escapeAttr(sym.insert)}">
        ↳ Insert into Equation
      </button>
    </div>
  `;

  // Example chips: click to load on equation
  DOM.detailInner.querySelectorAll('.detail-example-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const raw = chip.dataset.expr;
      // Strip = ... part for computation
      const eqPart = raw.split('=')[0].trim();
      DOM.equationInput.value = eqPart;
      State.currentEquation = eqPart;
      onEquationChange();
      DOM.equationInput.focus();
    });
  });

  // Insert butt
  DOM.detailInner.querySelector('.btn-insert-symbol')?.addEventListener('click', () => {
    insertAtCursor(sym.insert);
  });
}

/* ═════════════════════
   EQUATION INPUT
═══════════════════════ */

DOM.equationInput.addEventListener('input', debounce(() => {
  State.currentEquation = DOM.equationInput.value;
  onEquationChange();
}, 180));

DOM.equationInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    evaluateEquation();
  }
});

function onEquationChange() {
  const expr = State.currentEquation;

  // Render math
  renderMath(expr);

  // Update explanation
  updateExplanation(expr);

  // Detect variables → show input fields
  updateVarInputs(expr);
}

/* ── Insert text at cursor position ── */
function insertAtCursor(text) {
  const el = DOM.equationInput;
  el.focus();
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const before = el.value.slice(0, start);
  const after  = el.value.slice(end);
  el.value = before + text + after;
  const newPos = start + text.length;
  el.setSelectionRange(newPos, newPos);
  State.currentEquation = el.value;
  onEquationChange();
}

/* ══════════════════
   MATH RENDERING (KaTeX)
═══════════════════════════ */

function renderMath(expr) {
  if (!expr || !expr.trim()) {
    DOM.renderedMath.innerHTML = '<span class="placeholder-text">Your equation will appear here…</span>';
    return;
  }

  try {
    // Use math.js to get a parsed node, then convert to LaTeX
    const node = math.parse(expr);
    const latex = node.toTex({ parenthesis: 'auto' });

    DOM.renderedMath.innerHTML = '';
    katex.render(latex, DOM.renderedMath, {
      throwOnError: false,
      displayMode: true,
      macros: { "\\cdot": "\\cdot" }
    });
  } catch (e) {
    // Fallback: show raw with basic substitutions
    try {
      const fallback = expr
        .replace(/\*/g, '·')
        .replace(/sqrt\(/g, '√(')
        .replace(/\bpi\b/g, 'π')
        .replace(/\bInfinity\b/g, '∞');
      DOM.renderedMath.textContent = fallback;
    } catch {
      DOM.renderedMath.textContent = expr;
    }
  }
}

/* ═════════════
   LIVE! EXPLANATION
══════════════════════ */

function updateExplanation(expr) {
  if (!expr || !expr.trim()) {
    DOM.explanationText.innerHTML = 'Start building an equation by clicking symbols from the library or typing below.';
    DOM.explanationText.classList.remove('has-content');
    return;
  }

  const text = MathParser.explain(expr);
  if (text) {
    DOM.explanationText.innerHTML = text;
    DOM.explanationText.classList.add('has-content');
  } else {
    DOM.explanationText.innerHTML = `Interpreting: <span class="math-word">${escapeHtml(expr)}</span>`;
    DOM.explanationText.classList.add('has-content');
  }
}

/* ═══════════════════
   VARIABLE DETECTION & INPUTS
══════════════════════════════════════ */

function updateVarInputs(expr) {
  const vars = MathParser.detectVariables(expr);
  DOM.varInputs.innerHTML = '';

  if (vars.length === 0) {
    DOM.varInputs.innerHTML = '<span style="color:var(--text-muted);font-size:0.75rem;">No free variables detected.</span>';
    return;
  }

  vars.forEach(v => {
    const group = document.createElement('div');
    group.className = 'var-input-group';
    const currentVal = State.varValues[v] ?? '';
    group.innerHTML = `
      <span class="var-input-label">${v}</span>
      <span class="var-input-eq">=</span>
      <input
        class="var-input-field"
        type="number"
        step="any"
        placeholder="value"
        value="${currentVal}"
        data-var="${v}"
        aria-label="Value for variable ${v}"
      />
    `;
    const input = group.querySelector('input');
    input.addEventListener('input', () => {
      State.varValues[v] = input.value !== '' ? parseFloat(input.value) : undefined;
    });
    DOM.varInputs.appendChild(group);
  });
}

/* ═══════
   CALCULATOR (math.js)
═════════════════════════ */

function evaluateEquation() {
  const expr = State.currentEquation.trim();
  if (!expr) {
    showResult('idle');
    return;
  }

  try {
    // Build a scope with variable substitutions
    const scope = {};
    Object.entries(State.varValues).forEach(([k, v]) => {
      if (v !== undefined && !isNaN(v)) scope[k] = v;
    });

    const result = math.evaluate(expr, scope);

    // Format result
    let formatted;
    if (typeof result === 'number') {
      // Show up to 10 significant figures, remove the Zs and Ds if not needed
      if (Number.isInteger(result)) {
        formatted = result.toString();
      } else {
        formatted = parseFloat(result.toPrecision(10)).toString();
      }
    } else if (typeof result === 'object' && result.mathType === 'Complex') {
      formatted = math.format(result, { precision: 6 });
    } else if (Array.isArray(result) || (result && result.isMatrix)) {
      formatted = math.format(result, { precision: 6 });
    } else {
      formatted = String(result);
    }

    showResult('value', formatted, expr);
  } catch (err) {
    let msg = err.message || 'Invalid expression';
    // Make error friendlier
    if (msg.includes('Undefined symbol')) {
      const sym = msg.match(/symbol (\w+)/)?.[1];
      msg = sym
        ? `Variable "${sym}" has no value. Assign it below.`
        : 'One or more variables need values. Assign them below.';
    }
    showResult('error', msg);
  }
}

function showResult(type, value = '', expr = '') {
  DOM.resultSteps.innerHTML = '';

  if (type === 'idle') {
    DOM.resultDisplay.innerHTML = `<span class="result-idle">Press <kbd>Evaluate</kbd> to compute</span>`;
    return;
  }

  if (type === 'error') {
    DOM.resultDisplay.innerHTML = `<span class="result-error">⚠ ${escapeHtml(value)}</span>`;
    return;
  }

  if (type === 'value') {
    DOM.resultDisplay.innerHTML = `
      <span class="result-value">${escapeHtml(value)}</span>
    `;
    // Show formatted steps hint
    DOM.resultSteps.innerHTML = `<span style="color:var(--text-muted)">${escapeHtml(expr)} = ${escapeHtml(value)}</span>`;
    return;
  }
}

/* ══════════
   JUST THE TIP
═════════════════════ */

function showTooltip(sym, event) {
  clearTimeout(State.tooltipTimeout);

  DOM.ttSymbol.textContent  = sym.glyph;
  DOM.ttName.textContent    = sym.name;
  DOM.ttDesc.textContent    = sym.explanation;
  DOM.ttExample.textContent = sym.examples[0] || '';

  positionTooltip(event);
  DOM.tooltip.classList.add('visible');
  DOM.tooltip.setAttribute('aria-hidden', 'false');
}

function positionTooltip(event) {
  const tt   = DOM.tooltip;
  const x    = event.clientX;
  const y    = event.clientY;
  const vpW  = window.innerWidth;
  const vpH  = window.innerHeight;
  const ttW  = 250;
  const ttH  = 120;

  let left = x + 16;
  let top  = y - 10;

  if (left + ttW > vpW - 16) left = x - ttW - 8;
  if (top + ttH > vpH - 16)  top  = vpH - ttH - 16;

  tt.style.left = `${left}px`;
  tt.style.top  = `${top}px`;
}

function hideTooltip() {
  State.tooltipTimeout = setTimeout(() => {
    DOM.tooltip.classList.remove('visible');
    DOM.tooltip.setAttribute('aria-hidden', 'true');
  }, 120);
}

/* ═════════════════════
   QUICK INSERT BUTTS
═══════════════════════ */

document.querySelectorAll('.qbtn[data-insert]').forEach(btn => {
  btn.addEventListener('click', () => {
    insertAtCursor(btn.dataset.insert);
  });
});

DOM.btnBackspace.addEventListener('click', () => {
  const el = DOM.equationInput;
  const start = el.selectionStart;
  const end   = el.selectionEnd;
  if (start === end && start > 0) {
    el.value = el.value.slice(0, start - 1) + el.value.slice(end);
    el.setSelectionRange(start - 1, start - 1);
  } else if (start !== end) {
    el.value = el.value.slice(0, start) + el.value.slice(end);
    el.setSelectionRange(start, start);
  }
  State.currentEquation = el.value;
  onEquationChange();
});

/* ══════════════
   HEADER BUTTS
═════════════════ */

DOM.btnEval.addEventListener('click', evaluateEquation);

DOM.btnClear.addEventListener('click', () => {
  DOM.equationInput.value = '';
  State.currentEquation = '';
  State.varValues = {};
  onEquationChange();
  showResult('idle');
  showToast('Equation cleared.');
  document.querySelectorAll('.sym-btn').forEach(b => b.classList.remove('active-symbol'));
  DOM.detailInner.innerHTML = `
    <div class="detail-empty">
      <div class="detail-empty-icon">⟨ · ⟩</div>
      <p>Click any symbol to see its full definition, examples, and usage.</p>
    </div>
  `;
});

DOM.btnCopy.addEventListener('click', () => {
  const eq = State.currentEquation;
  if (!eq) {
    showToast('Nothing to copy.');
    return;
  }
  navigator.clipboard.writeText(eq).then(() => {
    showToast('Equation copied to clipboard!');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = eq;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Equation copied!');
  });
});

DOM.btnRandom.addEventListener('click', () => {
  const ex = RANDOM_EXAMPLES[Math.floor(Math.random() * RANDOM_EXAMPLES.length)];
  DOM.equationInput.value = ex.eq;
  State.currentEquation = ex.eq;
  State.varValues = {};
  onEquationChange();
  showToast(`Loaded: ${ex.label}`);
  // Auto-evaluate
  setTimeout(() => evaluateEquation(), 200);
});

/* ═════
   SEARCH
════════════════ */

DOM.symbolSearch.addEventListener('input', debounce((e) => {
  renderSymbolLibrary(e.target.value);
}, 200));

/* ════════
   TOASTED
════════════ */

let toastTimer;
function showToast(msg) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), 2400);
}

/* ════════════════
   UTILITIES
═════════════════ */

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ═════════════════
   KEYBOARD SHAWTYS
══════════════════════ */

document.addEventListener('keydown', (e) => {
  // Ctrl+Enter to evaluate
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    evaluateEquation();
    e.preventDefault();
  }
  // Escape to close tooltips
  if (e.key === 'Escape') hideTooltip();
});

/* ═════════
   INIT
══════════ */

function init() {
  // Build symbol library
  renderSymbolLibrary();

  // Load a welcoming example
  const welcome = 'sqrt(3^2 + 4^2)';
  DOM.equationInput.value = welcome;
  State.currentEquation = welcome;

  // Delay init to let KaTeX / math.js load
  setTimeout(() => {
    onEquationChange();
    evaluateEquation();
  }, 350);

  // Animate entrance
  document.querySelectorAll('.glass-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100 + i * 80);
  });

  console.log('%c🔬 Fruity\\'s Lab loaded.', 'color:#4de8f4;font-size:16px;font-weight:bold;');
}

// Wait for all deferred scripts to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Scripts are deferred, wait a tick
  setTimeout(init, 0);
}
