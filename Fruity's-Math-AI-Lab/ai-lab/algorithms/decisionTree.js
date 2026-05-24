/**
 * ai-lab/algorithms/decisionTree.js
 * Decision Tree — recursive CART build with Gini impurity and depth animation.
 * Depends on: state.js, utils.js (rgbAlpha), canvas.js, ui.js (D, updateMetric), dataSystem.js (getDataForAlgo)
 */

/** Count total nodes in a tree */
function countNodes(t) { return t.leaf ? 1 : 1 + countNodes(t.left) + countNodes(t.right); }

/** Measure maximum depth of a tree */
function treeDepth(t) { return t.leaf ? 0 : 1 + Math.max(treeDepth(t.left), treeDepth(t.right)); }

function initDT() {
  const maxDepth = parseInt(document.getElementById('ctrl-depth')?.value || 3);
  const raw = getDataForAlgo('decision_tree');
  let data;

  if (raw && raw.length >= 10) {
    data = raw.map(p => [p.x, p.y, Math.round(p.label) || 0]);
    log(`Decision Tree: using ${data.length} imported pts`, 'info');
  } else {
    data = Array.from({ length: 70 }, () => {
      const x1 = (Math.random() - 0.5) * 4, x2 = (Math.random() - 0.5) * 4;
      return [x1, x2, (x1 * x2 > 0) ? 0 : 1 ^ (Math.random() < 0.1 ? 1 : 0)];
    });
  }

  /** Recursive CART builder using alternating axis splits */
  function buildTree(idx, depth) {
    if (depth >= maxDepth || idx.length < 4) {
      const cs  = idx.map(i => data[i][2]);
      const c0  = cs.filter(c => c === 0).length;
      const p   = c0 / cs.length;
      return { leaf: true, cls: c0 > cs.length / 2 ? 0 : 1, n: idx.length, gini: 2 * p * (1 - p) };
    }
    const feat = depth % 2;
    const vals = idx.map(i => data[i][feat]);
    const tau  = (Math.max(...vals) + Math.min(...vals)) / 2;
    const left  = idx.filter(i => data[i][feat] <= tau);
    const right = idx.filter(i => data[i][feat] >  tau);
    if (!left.length || !right.length) {
      const cs = idx.map(i => data[i][2]);
      const c0 = cs.filter(c => c === 0).length;
      return { leaf: true, cls: c0 > cs.length / 2 ? 0 : 1, n: idx.length, gini: 0 };
    }
    const nc  = idx.length;
    const cs  = idx.map(i => data[i][2]);
    const c0  = cs.filter(c => c === 0).length;
    const g   = 1 - (c0 / nc) ** 2 - ((nc - c0) / nc) ** 2;
    return { feat, tau, n: nc, depth, gini: g, left: buildTree(left, depth + 1), right: buildTree(right, depth + 1) };
  }

  const tree = buildTree(Array.from({ length: data.length }, (_, i) => i), 0);
  LAB.state  = { data, tree, maxDepth, highlightDepth: 0 };
  miniHistory = [];
}

function stepDT() {
  const s     = LAB.state;
  s.highlightDepth = LAB.iteration % (s.maxDepth + 1);
  const nodes  = countNodes(s.tree);
  const depth  = treeDepth(s.tree);
  miniHistory.push(s.tree.gini * 100);
  updateMetric('depth', depth);
  updateMetric('nodes', nodes);
  updateMetric('gini',  s.tree.gini.toFixed(4));
  D.statsIter.textContent = `depth ${s.highlightDepth}`;
  showLiveEq('G(t)=1-\\sum_k p_k^2', `depth=${depth} nodes=${nodes} gini=${s.tree.gini.toFixed(4)} n=${s.data.length}`);
  highlightStep(Math.min(5, Math.floor(LAB.iteration / 6)));
  if (LAB.iteration % 8 === 0)
    log(`depth=${depth} nodes=${nodes} gini=${s.tree.gini.toFixed(4)}`);
}

function drawDT() {
  const ctx = getCtx();
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const s = LAB.state;
  if (!s.tree) return;

  /** Recursively draw a node and its children */
  function drawNode(node, x, y, spread, depth) {
    const isHL = depth === s.highlightDepth;
    const r    = isHL ? 20 : 15;
    const col  = node.leaf ? (node.cls === 0 ? '#4de8f4' : '#f87171') : '#a78bfa';

    if (!node.leaf) {
      const lx = x - spread, ly = y + 78, rx = x + spread, ry = y + 78;
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(lx, ly - r);
      ctx.strokeStyle = isHL ? 'rgba(167,139,250,0.8)' : 'rgba(167,139,250,0.28)';
      ctx.lineWidth   = isHL ? 2 : 1.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(rx, ry - r); ctx.stroke();
      drawNode(node.left,  lx, ly, spread * 0.48, depth + 1);
      drawNode(node.right, rx, ry, spread * 0.48, depth + 1);
    }

    if (isHL) {
      ctx.beginPath(); ctx.arc(x, y, r + 7, 0, Math.PI * 2);
      ctx.fillStyle = rgbAlpha(col, 0.10); ctx.fill();
    }

    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle   = rgbAlpha(col, 0.22);
    ctx.strokeStyle = col;
    ctx.lineWidth   = isHL ? 2.5 : 1.5;
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isHL ? col : 'rgba(200,220,255,0.8)';
    ctx.font      = `${isHL ? 'bold ' : ''}8px Space Mono,monospace`;
    ctx.textAlign = 'center';
    if (node.leaf) {
      ctx.fillText(`C${node.cls}`, x, y + 3);
    } else {
      ctx.fillText(`x${node.feat + 1}`, x,     y - 3);
      ctx.fillText(`≤${node.tau?.toFixed(1)}`, x, y + 7);
    }

    // Gini tooltip on highlighted split nodes
    if (!node.leaf && isHL) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + r + 3, y - 13, 86, 22);
      ctx.fillStyle = '#fbbf24'; ctx.font = '8px Space Mono,monospace';
      ctx.fillText(`G=${node.gini.toFixed(3)}`, x + r + 7, y + 3);
    }
  }

  drawNode(s.tree, w / 2, 48, w * 0.21, 0);

  // Info overlay
  ctx.fillStyle = 'rgba(0,0,0,0.58)'; ctx.fillRect(10, 10, 190, 38);
  ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 10px Space Mono,monospace'; ctx.textAlign = 'left';
  ctx.fillText(`Nodes: ${countNodes(s.tree)}  Depth: ${treeDepth(s.tree)}`, 16, 26);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`Root Gini: ${s.tree.gini.toFixed(4)}  n=${s.data.length}`, 16, 42);
}
