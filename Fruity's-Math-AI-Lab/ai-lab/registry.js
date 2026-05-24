/**
 * ai-lab/registry.js
 * Algorithm dispatch maps. Connects string IDs to init/step/draw functions.
 * MUST load after ALL algorithm files.
 * Depends on all 9 algorithm files + canvas.js (drawMiniChart)
 */

const ALGO_INIT = {
  gradient_descent:  initGD,
  neural_network:    initNN,
  backpropagation:   initBP,
  linear_regression: initLR,
  kmeans:            initKM,
  pca:               initPCA,
  attention:         initATT,
  svm:               initSVM,
  decision_tree:     initDT,
};

const ALGO_STEP = {
  gradient_descent:  stepGD,
  neural_network:    stepNN,
  backpropagation:   stepBP,
  linear_regression: stepLR,
  kmeans:            stepKM,
  pca:               stepPCA,
  attention:         stepATT,
  svm:               stepSVM,
  decision_tree:     stepDT,
};

const ALGO_DRAW = {
  gradient_descent:  drawGD,
  neural_network:    drawNN,
  backpropagation:   drawBP,
  linear_regression: drawLR,
  kmeans:            drawKM,
  pca:               drawPCA,
  attention:         drawATT,
  svm:               drawSVM,
  decision_tree:     drawDT,
};

/** Initialize the currently selected algorithm */
function initAlgo(id) {
  ALGO_INIT[id]?.();
}

/** Draw one visualization frame + update the mini chart */
function drawFrame() {
  if (LAB.currentAlgo && ALGO_DRAW[LAB.currentAlgo]) {
    ALGO_DRAW[LAB.currentAlgo]();
    drawMiniChart();
  }
}
