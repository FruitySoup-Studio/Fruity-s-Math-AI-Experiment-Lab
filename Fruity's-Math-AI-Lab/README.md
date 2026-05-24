# Fruity's Lab · AI Labb

This is the smaller version of my Math-AI-Lab Tool that is used in your browser. Experiment with Equations and Drag and Drop your own Data sets to see how the nodels interacts with it Visually. Play around with your own Math and see what you can discover. Open to collaborating and building onto my beta version. 
---

## Quick Start

> **A local HTTP server is required.** Web Workers (used for TF.js training) cannot run from `file://` URLs.

```bash or zsh
# Python 3
cd path/to/C.A.C
python -m http.server 8080

# Node.js
npx serve .
```

Then open **http://localhost:8080** in your browser.

- **Math Symbol Explorer** → `index.html`
- **AI Algorithm Lab**     → `ai-lab.html`

---

## Project Structure

```
C.A.C/
├── index.html              Math symbol explorer + equation parser
├── app.js                  Symbol library, equation builder, calculator
├── parser.js               Tokenizer + LaTeX + explanation engine
├── data.js                 102 symbols across 11 math categories
├── style.css               Fruity's Lab styles
│
├── ai-lab.html             AI Lab — main entry point
├── ai-lab.css              AI Lab styles
├── ai-lab-data.js          Algorithm definitions (9 algorithms)
│
└── ai-lab/
    ├── core/
    │   ├── state.js        Global runtime state (LAB, DATA_STORE)
    │   ├── utils.js        Pure math utilities
    │   ├── ui.js           DOM refs, tab builder, metric cards
    │   ├── canvas.js       Canvas helpers, mini-chart, log, toast
    │   └── dataSystem.js   Sample datasets, CSV import, data wiring
    │
    ├── algorithms/
    │   ├── neuralNetwork.js     + activation heatmap, TF.js/WS hooks
    │   ├── backpropagation.js   + animated gradient particle streams
    │   ├── gradientDescent.js   + contour lines, glowing fade trail
    │   ├── linearRegression.js  + confidence bands, residual histogram
    │   ├── kmeans.js            + Voronoi background tinting
    │   ├── pca.js               + animated projection, variance ring
    │   ├── attention.js         + bezier attention flow arcs
    │   ├── svm.js               + ImageData confidence raster
    │   └── decisionTree.js      + depth-highlight animation
    │
    ├── registry.js         Algorithm dispatch maps
    ├── runtime.js          Animation loop, button wiring, init
    │
    └── training/
        ├── trainingWorker.js    TF.js Web Worker (real training)
        ├── workerBridge.js      Main-thread worker bridge
        ├── wsClient.js          WebSocket client for backend mode
        ├── experimentTracker.js localStorage save/load/compare
        ├── mutationEngine.js    Neuroevolution + genetic search
        ├── architectureBuilder.js  Drag-drop layer canvas editor
        └── server.py            FastAPI + PyTorch backend server
```

---

## AI Lab — 9 Algorithms

| Algorithm | What you see |
|---|---|
| Gradient Descent | Loss landscape heatmap, iso-contour lines, glowing descent trail |
| Neural Network | Live weight network, per-layer activation heatmap |
| Backpropagation | Animated 4-particle gradient streams, grad-norm badge |
| Linear Regression | Regression line, 1σ/2σ confidence bands, residual histogram |
| K-Means | Voronoi regions, centroid crosshairs, inertia sparkline |
| PCA | Animated projection onto principal axes, variance ring chart |
| Self-Attention | Heatmap + animated bezier flow arcs between tokens |
| SVM | Full confidence raster (linear + RBF kernels), margin zone |
| Decision Tree | Recursive CART build, depth-highlight animation |

---

## Data Import

- **Sample datasets** — Linear, Nonlinear, Clusters, Moons, Iris, XOR, Spiral, Circles
- **Upload CSV** — drag-and-drop or click, column mapping UI shown automatically
- **Paste data** — paste CSV text directly (comma or tab separated)

---

## Keyboard Shawtys

| Key | Action |
|---|---|
| `Space` | Run / Pause |
| `→` | Step one iteration |
| `R` | Reset algorithm |

---

## Training Modes (Neural Network only)

Select **Neural Network** → choose a mode in the controls panel.

### Simulate (default)
Instant visual feedback with simulated loss convergence. No setup required.

### TF.js — real browser training
Trains a real `tf.sequential()` model in a **Web Worker** so the UI never freezes.
Streams live loss, accuracy, weights, and per-layer activations every batch.

**Requires the local HTTP server** (not `file://`). Click **Run** to start.

### WebSocket — PyTorch backend

```bash
pip install fastapi uvicorn websockets torch
python ai-lab/training/server.py
```

Server runs at `ws://localhost:8765`. Select **WS**, then click **Run**.
Streams batch metrics and epoch weights/activations from a real PyTorch model.

---

## Architecture Builder

Click the **Builder** button in the toolbar (visible when Neural Network is selected).

| Action | How |
|---|---|
| Add Dense layer | `+ Dense` button |
| Add Dropout layer | `+ Dropout` button |
| Reorder layers | Drag a layer card left or right |
| Delete a layer | Double-click a layer card |
| Edit units / dropout rate | Click a layer to select, use the Units/Rate slider |
| Apply to training | **Export → NN** |
| Return to visualization | **▶ Visualize** button |

---

## Neuro-evo

Right panel → **⚗ Neuroevolution** (visible when Neural Network is selected).

| Button | Action |
|---|---|
| **Init** | Create a random population of 8 architecture genomes |
| **Evolve** | Run genetic search (~8 gen/sec). Click again to pause |
| **Mutate Best** | Add a mutated copy of the best genome to the population |
| **Apply Best** | Copy the best genome's architecture to the NN algorithm |

Population grid shows each genome ranked by fitness (accuracy − 0.4 × loss). ★ = current best.

---

## Experiment Tracker

Every completed TF.js or WebSocket run is saved to `localStorage` (max 50).

| Control | Action |
|---|---|
| **Compare** | Overlay loss curves of up to 6 saved runs |
| **Clear All** | Delete all saved experiments |
| **Load** | Restore a run's loss history to the mini-chart |
| **✕** | Delete one experiment |

---

## Math Symbol Explorer (`index.html`)

102 symbols across 11 categories:

**Arithmetic · Algebra · Trigonometry · Calculus · Sets · Logic · Constants · Greek · Linear Algebra · Optimization · Neural Net Math**

Type any equation for plain-English explanation and LaTeX rendering. Supported functions include:

- Standard: `sqrt`, `sin`, `log`, `factorial`, `sum`, `prod` …
- Linear algebra: `norm(`, `det(`, `transpose(`, `dot(`, `matmul(`, `svd(` …
- Optimization: `grad(`, `hessian(`, `argmin(`, `argmax(`, `clip(` …
- Neural net: `sigmoid(`, `relu(`, `tanh(`, `gelu(`, `softmax(` …
- Loss functions: `crossentropy(`, `mse(`, `mae(`, `kldiv(` …

---

## Browser Requirements

Chrome 90+ · Firefox 112+ · Safari 16+ · Edge 90+

Requires ES2020+ (optional chaining `?.`, nullish coalescing `??`).

---

## Development Notes

- No build tools, no bundler — pure browser-native JavaScript
- Script load order in `ai-lab.html` is strict (see inline comments)
- `state.js` loads first; `runtime.js` loads last
- `neuralNetwork.js` must load before `backpropagation.js` (exports `forwardNN`)
- Training modules load before algorithm modules (no algorithm dependencies)
