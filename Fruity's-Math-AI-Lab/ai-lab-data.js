/**
 * Created By Jevante Boley All Rights Reserved Powered By FruitySoup Studio
 * Fruity's — AI Algorithms Library
 * Complete algorithm definitions with deep descriptions, LaTeX equations, Created By Jevante Boxley All Rights Reserved
 * step-by-step explanations, applications, and complexity analysis.
 */

const AI_ALGORITHMS = {

  gradient_descent: {
    id: 'gradient_descent', name: 'Gradient Descent', icon: '∇',
    family: 'Optimization', color: '#4de8f4',
    description: 'Gradient descent is the fundamental engine of machine learning. It minimizes a loss function L(θ) by iteratively stepping parameters in the direction of steepest descent — opposite to the gradient. Imagine a ball rolling down a mountainous landscape: it always moves toward the lowest nearby valley. The learning rate α controls step size. Too large → overshoots, oscillates or diverges. Too small → converges slowly. Modern deep learning uses variants like Adam that adapt α per-parameter.',
    equations: [
      { label: 'Parameter Update Rule', latex: '\\theta_{t+1} = \\theta_t - \\alpha \\nabla_{\\theta} \\mathcal{L}(\\theta_t)' },
      { label: 'MSE Loss Gradient', latex: '\\nabla_{\\theta} \\mathcal{L} = -\\frac{2}{n} X^T(y - X\\theta)' },
      { label: 'Convergence Bound', latex: '\\mathcal{L}(\\theta_{t+1}) \\leq \\mathcal{L}(\\theta_t) - \\frac{\\alpha}{2}\\|\\nabla \\mathcal{L}(\\theta_t)\\|^2' },
    ],
    steps: [
      'Initialize parameters θ randomly',
      'Compute forward pass: predictions ŷ = f(x; θ)',
      'Calculate loss L(θ) = (1/n)Σ(yᵢ − ŷᵢ)²',
      'Compute gradient ∇L(θ) via partial derivatives',
      'Update parameters: θ ← θ − α·∇L(θ)',
      'Check convergence; repeat from step 2',
    ],
    applications: ['Neural Network Training', 'Logistic Regression', 'Linear Regression', 'SVM optimization', 'LLM fine-tuning'],
    complexity: { time: 'O(n·d) per step', space: 'O(d)' },
  },

  neural_network: {
    id: 'neural_network', name: 'Neural Network', icon: '⬡',
    family: 'Deep Learning', color: '#a78bfa',
    description: 'A feedforward neural network stacks layers of parameterized transformations. Each neuron computes a weighted sum of its inputs, adds a bias, then applies a non-linear activation function. Stacking these layers allows the network to learn hierarchical representations — early layers detect simple features, deeper layers compose them into complex patterns. The universal approximation theorem guarantees that a single hidden layer with enough neurons can approximate any continuous function.',
    equations: [
      { label: 'Layer Output', latex: 'h^{(l)} = \\sigma(W^{(l)} h^{(l-1)} + b^{(l)})' },
      { label: 'ReLU Activation', latex: '\\text{ReLU}(z) = \\max(0, z)' },
      { label: 'Softmax Output', latex: '\\hat{y}_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}' },
      { label: 'Cross-Entropy Loss', latex: '\\mathcal{L} = -\\sum_i y_i \\log(\\hat{y}_i)' },
    ],
    steps: [
      'Define architecture: layer sizes [d_in, h₁, ..., d_out]',
      'Initialize weights W ~ N(0, √(2/d_in)) — He init',
      'Forward pass: propagate input through each layer',
      'Apply non-linear activations (ReLU, sigmoid, etc.)',
      'Compute loss between output and target labels',
      'Backpropagate gradients and update weights',
    ],
    applications: ['Image Recognition', 'Language Modeling', 'Speech Recognition', 'Drug Discovery', 'AlphaGo'],
    complexity: { time: 'O(n·Σ dₗ·dₗ₊₁)', space: 'O(Σ dₗ·dₗ₊₁)' },
  },

  backpropagation: {
    id: 'backpropagation', name: 'Backpropagation', icon: '↺',
    family: 'Deep Learning', color: '#f472b6',
    description: 'Backpropagation efficiently computes gradients of the loss with respect to every weight in a network using the chain rule of calculus. Starting from the output layer, it propagates error signals backward. Without this O(W) algorithm, computing gradients would require perturbing each weight individually — O(W²) times slower. It is the core algorithm making deep learning tractable.',
    equations: [
      { label: 'Chain Rule', latex: '\\frac{\\partial \\mathcal{L}}{\\partial w} = \\frac{\\partial \\mathcal{L}}{\\partial a} \\cdot \\frac{\\partial a}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}' },
      { label: 'Output Delta', latex: '\\delta^{(L)} = \\nabla_a \\mathcal{L} \\odot \\sigma\'(z^{(L)})' },
      { label: 'Hidden Delta', latex: '\\delta^{(l)} = (W^{(l+1)})^T \\delta^{(l+1)} \\odot \\sigma\'(z^{(l)})' },
      { label: 'Weight Gradient', latex: '\\frac{\\partial \\mathcal{L}}{\\partial W^{(l)}} = \\delta^{(l)} (h^{(l-1)})^T' },
    ],
    steps: [
      'Forward pass: compute all activations h⁽ˡ⁾',
      'Compute loss L at the output layer',
      'Output delta: δ⁽ᴸ⁾ = ∇_a L ⊙ σ\'(z⁽ᴸ⁾)',
      'Propagate: δ⁽ˡ⁾ = Wᵀδ⁽ˡ⁺¹⁾ ⊙ σ\'(z⁽ˡ⁾)',
      'Compute ∂L/∂W⁽ˡ⁾ = δ⁽ˡ⁾(h⁽ˡ⁻¹⁾)ᵀ',
      'Update all weights simultaneously',
    ],
    applications: ['Training CNNs', 'Training Transformers', 'Training RNNs', 'Any differentiable computation graph'],
    complexity: { time: 'O(W) — same as forward pass', space: 'O(W + L) for activations' },
  },

  linear_regression: {
    id: 'linear_regression', name: 'Linear Regression', icon: '≈',
    family: 'Supervised Learning', color: '#34d399',
    description: 'Linear regression finds the best-fit hyperplane through data by minimizing squared residuals. The normal equation gives an exact closed-form solution. Gradient descent is used instead when n or d is large. Ridge (L2) and Lasso (L1) regularization prevent overfitting by penalizing large weights, trading bias for variance reduction.',
    equations: [
      { label: 'Model', latex: '\\hat{y} = \\mathbf{x}^T \\boldsymbol{\\theta} = \\theta_0 + \\theta_1 x_1 + \\ldots + \\theta_d x_d' },
      { label: 'MSE Loss', latex: '\\mathcal{L}(\\boldsymbol{\\theta}) = \\frac{1}{2n}\\|X\\boldsymbol{\\theta} - y\\|^2' },
      { label: 'Normal Equation', latex: '\\boldsymbol{\\theta}^* = (X^T X)^{-1} X^T y' },
      { label: 'Ridge Penalty', latex: '\\mathcal{L}_{\\text{ridge}} = \\frac{1}{2n}\\|X\\theta - y\\|^2 + \\lambda\\|\\theta\\|^2' },
    ],
    steps: [
      'Collect n samples, each with d features',
      'Augment X with a column of ones for bias θ₀',
      'Closed form: θ* = (XᵀX)⁻¹Xᵀy',
      'Or iterate: θ ← θ − (α/n)Xᵀ(Xθ − y)',
      'Evaluate: R² = 1 − SS_res/SS_tot',
      'Add regularization λ if overfitting detected',
    ],
    applications: ['House Price Prediction', 'Stock Forecasting', 'Medical Dosage', 'Economic Modeling'],
    complexity: { time: 'O(nd) gradient / O(d³) normal eq.', space: 'O(nd)' },
  },

  kmeans: {
    id: 'kmeans', name: 'K-Means Clustering', icon: '◎',
    family: 'Unsupervised Learning', color: '#fbbf24',
    description: 'K-Means partitions n data points into k clusters by minimizing the within-cluster sum of squared distances to cluster centroids. It alternates: assignment (each point → nearest centroid) and update (centroids → mean of assigned points). This provably converges, but to a local optimum. K-means++ initialization dramatically improves quality by spreading initial centroids apart.',
    equations: [
      { label: 'Cluster Assignment', latex: 'z_i = \\arg\\min_{k} \\|x_i - \\mu_k\\|^2' },
      { label: 'Centroid Update', latex: '\\mu_k = \\frac{1}{|C_k|} \\sum_{i \\in C_k} x_i' },
      { label: 'Objective (Inertia)', latex: 'J = \\sum_{k=1}^{K} \\sum_{i \\in C_k} \\|x_i - \\mu_k\\|^2' },
    ],
    steps: [
      'Choose K (number of clusters)',
      'Initialize K centroids (random or k-means++)',
      'Assign each point to nearest centroid',
      'Recompute each centroid as cluster mean',
      'Compute inertia J = Σₖ Σᵢ∈Cₖ ‖xᵢ − μₖ‖²',
      'Repeat until centroids stop moving',
    ],
    applications: ['Customer Segmentation', 'Image Compression', 'Anomaly Detection', 'Document Clustering', 'Genomics'],
    complexity: { time: 'O(n·K·d) per iteration', space: 'O(n·d + K·d)' },
  },

  pca: {
    id: 'pca', name: 'PCA', icon: '↗',
    family: 'Dimensionality Reduction', color: '#fb923c',
    description: 'PCA finds the directions of maximum variance in high-dimensional data by computing eigenvectors of the covariance matrix. The top k eigenvectors define a new coordinate system where the first axis captures the most variance. This compresses data from d → k dimensions while preserving maximum structure — crucial for visualization and combating the curse of dimensionality.',
    equations: [
      { label: 'Covariance Matrix', latex: '\\Sigma = \\frac{1}{n-1} X^T X \\quad (\\text{zero-mean } X)' },
      { label: 'Eigendecomposition', latex: '\\Sigma v_k = \\lambda_k v_k' },
      { label: 'Projection', latex: 'Z = X V_k, \\quad V_k = [v_1, \\ldots, v_k]' },
      { label: 'Explained Variance', latex: '\\text{EVR}_k = \\frac{\\sum_{i=1}^{k} \\lambda_i}{\\sum_{j=1}^{d} \\lambda_j}' },
    ],
    steps: [
      'Center data: X ← X − mean(X)',
      'Compute covariance matrix Σ = XᵀX/(n−1)',
      'Eigendecompose: Σ = VΛVᵀ',
      'Sort eigenvectors by eigenvalue descending',
      'Select top k components V_k',
      'Project data: Z = X·Vₖ (k-dimensional)',
    ],
    applications: ['Face Recognition (Eigenfaces)', 'Data Visualization', 'Noise Reduction', 'Feature Engineering'],
    complexity: { time: 'O(n·d² + d³)', space: 'O(n·d)' },
  },

  attention: {
    id: 'attention', name: 'Attention Mechanism', icon: '◈',
    family: 'Deep Learning / NLP', color: '#f87171',
    description: 'Attention allows a model to selectively focus on different parts of input when producing each output. Queries Q, Keys K, and Values V are computed from the input. Attention weights are query-key dot products scaled by √dₖ and normalized with softmax. Outputs are weighted sums of values. Multi-head attention runs H parallel attention operations, letting the model attend to different aspects simultaneously. This is the core of all modern Transformers (GPT, BERT, etc.).',
    equations: [
      { label: 'Scaled Dot-Product Attention', latex: '\\text{Att}(Q,K,V) = \\text{softmax}\\!\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)\\!V' },
      { label: 'Q / K / V Projections', latex: 'Q = XW_Q,\\; K = XW_K,\\; V = XW_V' },
      { label: 'Attention Weight', latex: 'a_{ij} = \\frac{\\exp(q_i \\cdot k_j / \\sqrt{d_k})}{\\sum_l \\exp(q_i \\cdot k_l / \\sqrt{d_k})}' },
      { label: 'Multi-Head', latex: '\\text{MHA} = [h_1;\\ldots;h_H]W_O' },
    ],
    steps: [
      'Project input X to Q, K, V using learned matrices',
      'Compute scores: S = QKᵀ / √dₖ',
      'Normalize to weights: A = softmax(S)',
      'Context output: out = A·V',
      'Project output with Wₒ',
      'Multi-head: repeat H times, concatenate, project',
    ],
    applications: ['GPT / ChatGPT', 'BERT', 'Machine Translation', 'Image Captioning', 'AlphaFold'],
    complexity: { time: 'O(n²·d) — quadratic in n', space: 'O(n²) attention matrix' },
  },

  svm: {
    id: 'svm', name: 'Support Vector Machine', icon: '⟂',
    family: 'Supervised Learning', color: '#4ade80',
    description: 'SVMs find the maximum-margin hyperplane separating two classes. Only the "support vectors" — points closest to the boundary — matter. The kernel trick implicitly maps data into higher-dimensional spaces where linear separation becomes possible, without explicit computation. SVMs remain excellent for small, high-dimensional datasets and are theoretically well-understood.',
    equations: [
      { label: 'Decision Function', latex: 'f(x) = \\text{sign}(w^T x + b)' },
      { label: 'Margin Width', latex: '\\text{margin} = \\frac{2}{\\|w\\|}' },
      { label: 'Hard-Margin Objective', latex: '\\min_{w,b} \\frac{1}{2}\\|w\\|^2 \\quad\\text{s.t. } y_i(w^T x_i + b) \\geq 1' },
      { label: 'RBF Kernel', latex: 'K(x_i, x_j) = \\exp(-\\gamma\\|x_i - x_j\\|^2)' },
    ],
    steps: [
      'Choose kernel: linear, polynomial, or RBF',
      'Formulate: maximize margin = 2/‖w‖',
      'Solve dual QP to find support vector coefficients αᵢ',
      'Support vectors are points where αᵢ > 0',
      'Classify: f(x) = sign(Σ αᵢyᵢK(xᵢ,x) + b)',
      'Tune C (soft-margin) and kernel hyperparameters',
    ],
    applications: ['Text Classification', 'Bioinformatics', 'Handwriting Recognition', 'Anomaly Detection'],
    complexity: { time: 'O(n²) to O(n³)', space: 'O(n·d)' },
  },

  decision_tree: {
    id: 'decision_tree', name: 'Decision Tree', icon: '⑂',
    family: 'Supervised Learning', color: '#60a5fa',
    description: 'Decision trees recursively partition feature space with binary splits that maximize information gain (or minimize Gini impurity). Fully interpretable — every prediction is a path of if/else rules. Random Forests ensemble hundreds of trees (each trained on a bootstrapped subset) to dramatically reduce variance while keeping low bias. XGBoost adds boosting: sequential trees each correcting the previous one\'s residuals.',
    equations: [
      { label: 'Gini Impurity', latex: 'G(t) = 1 - \\sum_{k=1}^{K} p_k^2' },
      { label: 'Entropy', latex: 'H(t) = -\\sum_{k=1}^{K} p_k \\log_2 p_k' },
      { label: 'Information Gain', latex: 'IG = H(t) - \\frac{|t_L|}{|t|}H(t_L) - \\frac{|t_R|}{|t|}H(t_R)' },
      { label: 'Best Split', latex: '(f^*,\\tau^*) = \\arg\\max_{f,\\tau} IG(t,f,\\tau)' },
    ],
    steps: [
      'At current node, evaluate all (feature, threshold) splits',
      'Compute information gain for each candidate',
      'Choose split maximizing IG / minimizing Gini',
      'Partition data: left (≤ τ), right (> τ)',
      'Recurse on each child until max depth or min samples',
      'Leaf predicts majority class or mean value',
    ],
    applications: ['Credit Scoring', 'Medical Diagnosis', 'Fraud Detection', 'Customer Churn', 'Feature Selection'],
    complexity: { time: 'O(n·d·log n) build', space: 'O(n)' },
  },
};

const ALGO_ORDER = [
  'gradient_descent', 'neural_network', 'backpropagation',
  'linear_regression', 'kmeans', 'pca', 'attention', 'svm', 'decision_tree'
];
