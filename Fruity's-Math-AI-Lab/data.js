/**
 * data.js — Symbol Library Data
 * Complete symbol definitions for Fruity's Lab   CREATED BY JEVANTE BOXLEY
 * This WAS HARD TO DO AND TOOK A LONG TIME SO PLEASE APPRECIATE IT
 * Each symbol has: glyph, name, shortName, category, insert (math.js string),
 *   explanation, definition, examples[]
 */

const SYMBOL_DATA = {

  /* ─── Arithmetic ─── */
  arithmetic: {
    label: "Arithmetic",
    symbols: [
      {
        glyph: "+", name: "Addition", shortName: "Add",
        insert: "+",
        explanation: "Adds two numbers or expressions together.",
        definition: "a + b is the sum of a and b.",
        examples: ["2 + 3 = 5", "x + 7", "a + b + c"]
      },
      {
        glyph: "−", name: "Subtraction", shortName: "Subtract",
        insert: "-",
        explanation: "Subtracts the second number from the first.",
        definition: "a − b is the difference of a and b.",
        examples: ["10 − 4 = 6", "x − 2", "a − b"]
      },
      {
        glyph: "×", name: "Multiplication", shortName: "Multiply",
        insert: "*",
        explanation: "Multiplies two numbers or expressions.",
        definition: "a × b is the product of a and b.",
        examples: ["4 × 5 = 20", "3 * x", "a * b"]
      },
      {
        glyph: "÷", name: "Division", shortName: "Divide",
        insert: "/",
        explanation: "Divides the first number by the second.",
        definition: "a ÷ b = a / b, the quotient of a and b.",
        examples: ["12 ÷ 4 = 3", "x / 2", "(a + b) / c"]
      },
      {
        glyph: "=", name: "Equals", shortName: "Equals",
        insert: "=",
        explanation: "Asserts that two expressions have the same value.",
        definition: "a = b means a and b are equal.",
        examples: ["x + 1 = 5", "2 + 2 = 4"]
      },
      {
        glyph: "≠", name: "Not Equal", shortName: "≠",
        insert: "!=",
        explanation: "Asserts that two expressions are not equal.",
        definition: "a ≠ b means a and b have different values.",
        examples: ["3 ≠ 4", "x ≠ 0"]
      },
      {
        glyph: "<", name: "Less Than", shortName: "Less",
        insert: "<",
        explanation: "The left side is smaller than the right side.",
        definition: "a < b means a is strictly less than b.",
        examples: ["2 < 5", "x < 10"]
      },
      {
        glyph: ">", name: "Greater Than", shortName: "Greater",
        insert: ">",
        explanation: "The left side is larger than the right side.",
        definition: "a > b means a is strictly greater than b.",
        examples: ["7 > 3", "x > 0"]
      },
      {
        glyph: "≤", name: "Less or Equal", shortName: "≤",
        insert: "<=",
        explanation: "The left side is smaller than or equal to the right.",
        definition: "a ≤ b means a is less than or equal to b.",
        examples: ["x ≤ 10", "2 ≤ 2"]
      },
      {
        glyph: "≥", name: "Greater or Equal", shortName: "≥",
        insert: ">=",
        explanation: "The left side is larger than or equal to the right.",
        definition: "a ≥ b means a is greater than or equal to b.",
        examples: ["x ≥ 0", "5 ≥ 5"]
      },
      {
        glyph: "%", name: "Modulo", shortName: "Mod",
        insert: " mod ",
        explanation: "Returns the remainder after dividing two numbers.",
        definition: "a mod b is the remainder when a is divided by b.",
        examples: ["10 mod 3 = 1", "7 mod 2 = 1"]
      },
      {
        glyph: "!", name: "Factorial", shortName: "Fact.",
        insert: "!",
        explanation: "Multiplies all positive integers up to that number.",
        definition: "n! = n × (n−1) × … × 2 × 1",
        examples: ["5! = 120", "3! = 6", "0! = 1"]
      }
    ]
  },

  /* ─── Algebra ─── */
  algebra: {
    label: "Algebra",
    symbols: [
      {
        glyph: "xⁿ", name: "Exponent / Power", shortName: "Power",
        insert: "^",
        explanation: "Raises a base to a given power — multiplied by itself n times.",
        definition: "aⁿ = a × a × … × a (n times)",
        examples: ["2^3 = 8", "x^2", "a^n"]
      },
      {
        glyph: "√", name: "Square Root", shortName: "√",
        insert: "sqrt(",
        explanation: "Finds the number that, multiplied by itself, equals the value inside.",
        definition: "√a = b such that b² = a, b ≥ 0",
        examples: ["sqrt(9) = 3", "sqrt(16) = 4", "sqrt(a^2 + b^2)"]
      },
      {
        glyph: "∛", name: "Cube Root", shortName: "∛",
        insert: "cbrt(",
        explanation: "Finds the number that, cubed, equals the value inside.",
        definition: "∛a = b such that b³ = a",
        examples: ["cbrt(27) = 3", "cbrt(8) = 2", "cbrt(-8) = -2"]
      },
      {
        glyph: "|x|", name: "Absolute Value", shortName: "Abs",
        insert: "abs(",
        explanation: "Returns the distance from zero — always non-negative.",
        definition: "|a| = a if a ≥ 0; −a if a < 0",
        examples: ["abs(-5) = 5", "abs(3) = 3", "abs(x - 2)"]
      },
      {
        glyph: "log", name: "Logarithm", shortName: "Log",
        insert: "log(",
        explanation: "The power to which a base must be raised to get a number.",
        definition: "log_b(a) = c means b^c = a",
        examples: ["log(100) = 2 (base 10)", "log(1000)", "log(e) = 1"]
      },
      {
        glyph: "ln", name: "Natural Log", shortName: "Ln",
        insert: "log(",
        explanation: "Logarithm with base e (Euler's number).",
        definition: "ln(a) = log_e(a)",
        examples: ["log(e) = 1", "log(e^2) = 2"]
      },
      {
        glyph: "n√", name: "Nth Root", shortName: "nRoot",
        insert: "nthRoot(",
        explanation: "Generalizes square root: finds b such that b^n = a.",
        definition: "ⁿ√a = a^(1/n)",
        examples: ["nthRoot(16, 4) = 2", "nthRoot(32, 5) = 2"]
      },
      {
        glyph: "⌊x⌋", name: "Floor", shortName: "Floor",
        insert: "floor(",
        explanation: "Rounds down to the nearest integer.",
        definition: "⌊x⌋ = largest integer ≤ x",
        examples: ["floor(3.7) = 3", "floor(-1.2) = -2"]
      },
      {
        glyph: "⌈x⌉", name: "Ceiling", shortName: "Ceil",
        insert: "ceil(",
        explanation: "Rounds up to the nearest integer.",
        definition: "⌈x⌉ = smallest integer ≥ x",
        examples: ["ceil(3.2) = 4", "ceil(-1.8) = -1"]
      }
    ]
  },

  /* ─── Trigonometry ─── */
  trig: {
    label: "Trigonometry",
    symbols: [
      {
        glyph: "sin", name: "Sine", shortName: "Sin",
        insert: "sin(",
        explanation: "Ratio of opposite side to hypotenuse in a right triangle.",
        definition: "sin(θ) = opposite / hypotenuse",
        examples: ["sin(pi/2) = 1", "sin(0) = 0", "sin(pi/6) = 0.5"]
      },
      {
        glyph: "cos", name: "Cosine", shortName: "Cos",
        insert: "cos(",
        explanation: "Ratio of adjacent side to hypotenuse in a right triangle.",
        definition: "cos(θ) = adjacent / hypotenuse",
        examples: ["cos(0) = 1", "cos(pi) = -1", "cos(pi/3) = 0.5"]
      },
      {
        glyph: "tan", name: "Tangent", shortName: "Tan",
        insert: "tan(",
        explanation: "Ratio of opposite to adjacent side; sin/cos.",
        definition: "tan(θ) = sin(θ) / cos(θ)",
        examples: ["tan(pi/4) = 1", "tan(0) = 0"]
      },
      {
        glyph: "sin⁻¹", name: "Arcsine", shortName: "Asin",
        insert: "asin(",
        explanation: "Inverse of sine — returns the angle whose sine is the input.",
        definition: "asin(x) = θ such that sin(θ) = x",
        examples: ["asin(1) = π/2", "asin(0.5) ≈ 0.5236"]
      },
      {
        glyph: "cos⁻¹", name: "Arccosine", shortName: "Acos",
        insert: "acos(",
        explanation: "Inverse of cosine — returns the angle whose cosine is the input.",
        definition: "acos(x) = θ such that cos(θ) = x",
        examples: ["acos(1) = 0", "acos(0) = π/2"]
      },
      {
        glyph: "tan⁻¹", name: "Arctangent", shortName: "Atan",
        insert: "atan(",
        explanation: "Inverse of tangent — returns the angle whose tangent is the input.",
        definition: "atan(x) = θ such that tan(θ) = x",
        examples: ["atan(1) = π/4", "atan(0) = 0"]
      }
    ]
  },

  /* ─── Calculus ─── */
  calculus: {
    label: "Calculus",
    symbols: [
      {
        glyph: "∑", name: "Summation", shortName: "Sum",
        insert: "sum(",
        explanation: "Adds up a sequence of terms according to an index rule.",
        definition: "∑ᵢ₌₁ⁿ f(i) = f(1) + f(2) + … + f(n)",
        examples: ["sum(i, i, 1, 5) = 15", "∑ᵢ₌₀¹⁰ i²"]
      },
      {
        glyph: "∏", name: "Product", shortName: "Prod",
        insert: "prod(",
        explanation: "Multiplies a sequence of terms according to an index rule.",
        definition: "∏ᵢ₌₁ⁿ f(i) = f(1) × f(2) × … × f(n)",
        examples: ["∏ᵢ₌₁⁵ i = 5! = 120"]
      },
      {
        glyph: "∫", name: "Integral", shortName: "Integral",
        insert: "integrate(",
        explanation: "Computes the area under a curve between two bounds.",
        definition: "∫ₐᵇ f(x) dx — area under f(x) from a to b",
        examples: ["∫₀¹ x² dx = 1/3", "∫ sin(x) dx = −cos(x) + C"]
      },
      {
        glyph: "∂", name: "Partial Derivative", shortName: "∂",
        insert: "derivative(",
        explanation: "Derivative with respect to one variable while others are held constant.",
        definition: "∂f/∂x — rate of change of f with x fixed",
        examples: ["∂(x²y)/∂x = 2xy", "∂(xy)/∂y = x"]
      },
      {
        glyph: "d/dx", name: "Derivative", shortName: "d/dx",
        insert: "derivative(",
        explanation: "The instantaneous rate of change of a function with respect to x.",
        definition: "d/dx f(x) = lim_{h→0} [f(x+h) − f(x)] / h",
        examples: ["d/dx(x²) = 2x", "d/dx(sin x) = cos x"]
      },
      {
        glyph: "lim", name: "Limit", shortName: "Limit",
        insert: "lim(",
        explanation: "The value a function approaches as its input approaches a point.",
        definition: "lim_{x→a} f(x) = L means f(x) → L as x → a",
        examples: ["lim_{x→0} sin(x)/x = 1", "lim_{x→∞} 1/x = 0"]
      },
      {
        glyph: "Δ", name: "Delta / Change", shortName: "Delta",
        insert: "delta",
        explanation: "Represents a finite change or difference in a variable.",
        definition: "Δx = x₂ − x₁ (change in x)",
        examples: ["Δy / Δx ≈ slope", "Δt = t₂ − t₁"]
      },
      {
        glyph: "∞", name: "Infinity", shortName: "Inf",
        insert: "Infinity",
        explanation: "A concept describing something without any bound or end.",
        definition: "∞ is not a number but represents unbounded growth",
        examples: ["lim_{x→∞} 1/x = 0", "∑ᵢ₌₁^∞ 1/2^i = 1"]
      }
    ]
  },

  /* ─── Set Theory ─── */
  sets: {
    label: "Set Theory",
    symbols: [
      {
        glyph: "∈", name: "Element Of", shortName: "∈",
        insert: " ∈ ",
        explanation: "Indicates that an element belongs to a set.",
        definition: "x ∈ A means x is a member of set A.",
        examples: ["3 ∈ {1, 2, 3}", "x ∈ ℝ"]
      },
      {
        glyph: "∉", name: "Not Element Of", shortName: "∉",
        insert: " ∉ ",
        explanation: "Indicates an element does NOT belong to a set.",
        definition: "x ∉ A means x is not a member of set A.",
        examples: ["5 ∉ {1, 2, 3}", "0 ∉ ℕ"]
      },
      {
        glyph: "⊂", name: "Proper Subset", shortName: "⊂",
        insert: " ⊂ ",
        explanation: "Set A is contained in set B but is not equal to B.",
        definition: "A ⊂ B: every element of A is in B, and A ≠ B.",
        examples: ["{1,2} ⊂ {1,2,3}", "ℕ ⊂ ℤ"]
      },
      {
        glyph: "⊆", name: "Subset or Equal", shortName: "⊆",
        insert: " ⊆ ",
        explanation: "Set A is contained in or equal to set B.",
        definition: "A ⊆ B: every element of A is in B (A may equal B).",
        examples: ["{1,2} ⊆ {1,2,3}", "A ⊆ A"]
      },
      {
        glyph: "∪", name: "Union", shortName: "Union",
        insert: " ∪ ",
        explanation: "All elements that belong to either set A or set B (or both).",
        definition: "A ∪ B = {x : x ∈ A or x ∈ B}",
        examples: ["{1,2} ∪ {2,3} = {1,2,3}"]
      },
      {
        glyph: "∩", name: "Intersection", shortName: "∩",
        insert: " ∩ ",
        explanation: "All elements that belong to both set A AND set B.",
        definition: "A ∩ B = {x : x ∈ A and x ∈ B}",
        examples: ["{1,2,3} ∩ {2,3,4} = {2,3}"]
      },
      {
        glyph: "∅", name: "Empty Set", shortName: "∅",
        insert: "∅",
        explanation: "A set containing no elements at all.",
        definition: "∅ = {} — the set with zero members.",
        examples: ["{x : x ≠ x} = ∅", "A ∩ B = ∅ means disjoint"]
      },
      {
        glyph: "ℕ", name: "Natural Numbers", shortName: "ℕ",
        insert: "ℕ",
        explanation: "The set of positive counting numbers: 1, 2, 3, …",
        definition: "ℕ = {1, 2, 3, 4, …} (some include 0)",
        examples: ["3 ∈ ℕ", "ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ"]
      },
      {
        glyph: "ℝ", name: "Real Numbers", shortName: "ℝ",
        insert: "ℝ",
        explanation: "All numbers on the number line, including irrationals.",
        definition: "ℝ includes all rational and irrational numbers.",
        examples: ["π ∈ ℝ", "√2 ∈ ℝ", "ℚ ⊂ ℝ"]
      }
    ]
  },

  /* ─── Logic ─── */
  logic: {
    label: "Logic",
    symbols: [
      {
        glyph: "∀", name: "For All", shortName: "∀",
        insert: "∀",
        explanation: "A statement that is true for every element in a set.",
        definition: "∀x P(x) means P(x) is true for every x.",
        examples: ["∀x ∈ ℝ, x² ≥ 0", "∀n ∈ ℕ, n + 1 > n"]
      },
      {
        glyph: "∃", name: "There Exists", shortName: "∃",
        insert: "∃",
        explanation: "Asserts that at least one element satisfies a condition.",
        definition: "∃x P(x) means there is at least one x where P(x) is true.",
        examples: ["∃x such that x² = 4", "∃n ∈ ℕ, n > 100"]
      },
      {
        glyph: "¬", name: "Logical NOT", shortName: "NOT",
        insert: "!",
        explanation: "Negates a statement — turns true to false and vice versa.",
        definition: "¬P is true when P is false.",
        examples: ["¬(x > 0) means x ≤ 0", "¬true = false"]
      },
      {
        glyph: "∧", name: "Logical AND", shortName: "AND",
        insert: " and ",
        explanation: "True only when BOTH conditions are true.",
        definition: "P ∧ Q is true iff P is true AND Q is true.",
        examples: ["(x > 0) ∧ (x < 10)", "true ∧ false = false"]
      },
      {
        glyph: "∨", name: "Logical OR", shortName: "OR",
        insert: " or ",
        explanation: "True when AT LEAST ONE condition is true.",
        definition: "P ∨ Q is true iff P is true OR Q is true (or both).",
        examples: ["(x < 0) ∨ (x > 5)", "false ∨ true = true"]
      },
      {
        glyph: "⇒", name: "Implies", shortName: "⇒",
        insert: " ⇒ ",
        explanation: "If the left condition is true, then the right must also be true.",
        definition: "P ⇒ Q is false only when P is true and Q is false.",
        examples: ["x = 2 ⇒ x² = 4", "(P ∧ Q) ⇒ P"]
      },
      {
        glyph: "⟺", name: "If and Only If", shortName: "⟺",
        insert: " ⟺ ",
        explanation: "Both sides are either both true or both false.",
        definition: "P ⟺ Q means P ⇒ Q and Q ⇒ P.",
        examples: ["x > 0 ⟺ |x| = x"]
      }
    ]
  },

  /* ─── Constants ─── */
  constants: {
    label: "Constants",
    symbols: [
      {
        glyph: "π", name: "Pi", shortName: "π",
        insert: "pi",
        explanation: "The ratio of a circle's circumference to its diameter.",
        definition: "π ≈ 3.14159265358979…",
        examples: ["Area = pi * r^2", "Circumference = 2 * pi * r", "cos(pi) = -1"]
      },
      {
        glyph: "e", name: "Euler's Number", shortName: "e",
        insert: "e",
        explanation: "The base of the natural logarithm; the unique number whose derivative is itself.",
        definition: "e ≈ 2.71828182845904…",
        examples: ["e^1 = e", "e^0 = 1", "log(e) = 1"]
      },
      {
        glyph: "φ", name: "Golden Ratio", shortName: "φ",
        insert: "(1 + sqrt(5)) / 2",
        explanation: "Special ratio where a/b = (a+b)/a; appears throughout nature.",
        definition: "φ = (1 + √5) / 2 ≈ 1.61803…",
        examples: ["φ ≈ 1.618", "φ² = φ + 1"]
      },
      {
        glyph: "i", name: "Imaginary Unit", shortName: "i",
        insert: "i",
        explanation: "The square root of −1; basis of complex numbers.",
        definition: "i = √−1, so i² = −1",
        examples: ["i^2 = -1", "i^4 = 1", "(2+3i)(1-i)"]
      }
    ]
  },

  /* ─── Greek Letters ─── */
  greek: {
    label: "Greek Letters",
    symbols: [
      {
        glyph: "α", name: "Alpha", shortName: "Alpha",
        insert: "alpha",
        explanation: "Often used for angles, coefficients, or constants.",
        definition: "First letter of the Greek alphabet.",
        examples: ["f(x) = alpha * x^2", "angle alpha = 30°"]
      },
      {
        glyph: "β", name: "Beta", shortName: "Beta",
        insert: "beta",
        explanation: "Often used for second parameter, angle, or regression coefficient.",
        definition: "Second letter of the Greek alphabet.",
        examples: ["y = alpha * x + beta", "Beta distribution"]
      },
      {
        glyph: "γ", name: "Gamma", shortName: "Gamma",
        insert: "gamma(",
        explanation: "Gamma function generalizes factorial; also used for angles.",
        definition: "Γ(n) = (n−1)! for positive integers",
        examples: ["gamma(6) = 120", "Γ(1/2) = √π"]
      },
      {
        glyph: "δ", name: "Delta (small)", shortName: "δ",
        insert: "delta",
        explanation: "Represents a very small change or perturbation.",
        definition: "δ is often used in limits and error bounds.",
        examples: ["|x − a| < δ ⇒ |f(x) − L| < ε"]
      },
      {
        glyph: "ε", name: "Epsilon", shortName: "ε",
        insert: "epsilon",
        explanation: "Represents a very small positive number; used in limits.",
        definition: "ε > 0 is arbitrarily small in analysis.",
        examples: ["lim definition: ∀ε>0, ∃δ>0…"]
      },
      {
        glyph: "λ", name: "Lambda", shortName: "λ",
        insert: "lambda",
        explanation: "Used for eigenvalues, rate parameters, or wavelength.",
        definition: "Av = λv defines eigenvalue λ.",
        examples: ["λ = c/f (wavelength)", "Poisson(λ)"]
      },
      {
        glyph: "θ", name: "Theta", shortName: "θ",
        insert: "theta",
        explanation: "Commonly used to represent angles in trigonometry.",
        definition: "θ is the standard symbol for an unknown angle.",
        examples: ["sin(theta)", "cos(theta)^2 + sin(theta)^2 = 1"]
      },
      {
        glyph: "σ", name: "Sigma (small)", shortName: "σ",
        insert: "sigma",
        explanation: "Represents standard deviation in statistics.",
        definition: "σ = √(Σ(xᵢ − μ)² / n)",
        examples: ["Normal(μ, sigma^2)", "σ² = variance"]
      },
      {
        glyph: "μ", name: "Mu", shortName: "μ",
        insert: "mu",
        explanation: "Represents the mean (average) in statistics.",
        definition: "μ = (Σ xᵢ) / n",
        examples: ["Normal(mu, sigma)", "μ = expected value"]
      },
      {
        glyph: "ω", name: "Omega", shortName: "ω",
        insert: "omega",
        explanation: "Used for angular frequency or complex roots of unity.",
        definition: "ω = 2πf in physics (angular frequency).",
        examples: ["ω = 2*pi*f", "nth roots of unity"]
      },
      {
        glyph: "ρ", name: "Rho", shortName: "ρ",
        insert: "rho",
        explanation: "Used for density, radius in polar coords, or correlation.",
        definition: "ρ = m/V (density); or correlation coefficient.",
        examples: ["Pearson ρ ∈ [−1, 1]"]
      },
      {
        glyph: "τ", name: "Tau", shortName: "τ",
        insert: "tau",
        explanation: "Equal to 2π; also used for time constant or torque.",
        definition: "τ = 2π ≈ 6.28318…",
        examples: ["Full circle = tau radians", "RC tau = time constant"]
      }
    ]
  },
  /* ─────────────────────────────────────
     LINEAR ALGEBRA
  ───────────────────────────────────── */
  linearAlgebra: {
    label: "Linear Algebra",
    symbols: [
      {
        glyph: "‖x‖", name: "L2 Norm", shortName: "‖·‖",
        insert: "norm(",
        explanation: "The Euclidean length of a vector — square root of the sum of squared components.",
        definition: "‖x‖₂ = sqrt(x₁² + x₂² + … + xₙ²)",
        examples: ["norm([3,4]) = 5", "norm(x)", "‖W‖ in regularization"]
      },
      {
        glyph: "Aᵀ", name: "Transpose", shortName: "Aᵀ",
        insert: "transpose(",
        explanation: "Flips a matrix over its main diagonal — rows become columns, columns become rows.",
        definition: "(Aᵀ)ᵢⱼ = Aⱼᵢ",
        examples: ["transpose(A)", "XᵀX (Gram matrix)", "AᵀA = square matrix"]
      },
      {
        glyph: "det(A)", name: "Determinant", shortName: "det",
        insert: "det(",
        explanation: "A scalar encoding how a matrix scales area or volume. Zero determinant means the matrix is singular (non-invertible).",
        definition: "det(A) = product of eigenvalues of A",
        examples: ["det([[1,2],[3,4]]) = -2", "det(A) = 0 means singular"]
      },
      {
        glyph: "A⁻¹", name: "Matrix Inverse", shortName: "A⁻¹",
        insert: "inv(",
        explanation: "The matrix that undoes A: multiplying A by its inverse gives the identity matrix. Only exists if det(A) ≠ 0.",
        definition: "A · A⁻¹ = A⁻¹ · A = I",
        examples: ["inv(A) * b solves the linear system Ax = b", "inv(XᵀX) appears in normal equations"]
      },
      {
        glyph: "a · b", name: "Dot Product", shortName: "dot",
        insert: "dot(",
        explanation: "Sum of element-wise products of two vectors. Measures how aligned they are — zero if orthogonal.",
        definition: "a · b = Σ aᵢbᵢ = ‖a‖ ‖b‖ cos(θ)",
        examples: ["dot([1,2],[3,4]) = 11", "dot(Q, K) in self-attention"]
      },
      {
        glyph: "a × b", name: "Cross Product", shortName: "cross",
        insert: "cross(",
        explanation: "Produces a vector perpendicular to both inputs. Magnitude equals the area of the parallelogram they span. Only defined in 3D.",
        definition: "a × b = ‖a‖ ‖b‖ sin(θ) n̂",
        examples: ["cross([1,0,0],[0,1,0]) = [0,0,1]"]
      },
      {
        glyph: "tr(A)", name: "Trace", shortName: "tr",
        insert: "trace(",
        explanation: "Sum of the diagonal elements of a square matrix. Equals the sum of eigenvalues.",
        definition: "tr(A) = Σ Aᵢᵢ = Σ λᵢ",
        examples: ["trace([[1,2],[3,4]]) = 5", "tr(AB) = tr(BA)"]
      },
      {
        glyph: "rank(A)", name: "Rank", shortName: "rank",
        insert: "rank(",
        explanation: "Number of linearly independent rows (or columns) in a matrix. Determines the dimensionality of the output space.",
        definition: "rank(A) = dim(col space of A)",
        examples: ["rank of identity matrix = n", "rank deficient → singular matrix"]
      },
      {
        glyph: "AB", name: "Matrix Multiply", shortName: "matmul",
        insert: "matmul(",
        explanation: "Standard matrix multiplication: each entry (AB)ᵢⱼ is the dot product of row i of A with column j of B.",
        definition: "(AB)ᵢⱼ = Σₖ AᵢₖBₖⱼ",
        examples: ["matmul(W, x) + b", "XW in linear layers"]
      },
      {
        glyph: "UΣVᵀ", name: "SVD", shortName: "SVD",
        insert: "svd(",
        explanation: "Singular Value Decomposition: factorizes any matrix as A = UΣVᵀ. The singular values reveal the structure and effective rank of A.",
        definition: "A = UΣVᵀ  (U, V orthogonal; Σ diagonal with σᵢ ≥ 0)",
        examples: ["svd(A)", "Used in PCA and low-rank approximation"]
      },
      {
        glyph: "diag(v)", name: "Diagonal Matrix", shortName: "diag",
        insert: "diag(",
        explanation: "Constructs a square diagonal matrix from a vector, placing each element on the main diagonal with zeros elsewhere.",
        definition: "diag([a,b,c]) = [[a,0,0],[0,b,0],[0,0,c]]",
        examples: ["diag(singular values)", "diag(W) for weight matrix analysis"]
      },
      {
        glyph: "vwᵀ", name: "Outer Product", shortName: "outer",
        insert: "outer(",
        explanation: "Produces an n×m matrix from two vectors. The (i,j) entry is vᵢ × wⱼ. Creates a rank-1 matrix.",
        definition: "(vwᵀ)ᵢⱼ = vᵢ wⱼ",
        examples: ["outer(v, w)", "Rank-1 update in gradient methods"]
      },
      {
        glyph: "‖x‖₁", name: "L1 Norm", shortName: "‖·‖₁",
        insert: "sum(abs(",
        explanation: "Sum of absolute values of all vector components. Used in Lasso regularization to promote sparse solutions.",
        definition: "‖x‖₁ = Σ |xᵢ|",
        examples: ["Lasso penalty: λ‖w‖₁", "Promotes sparsity in weights"]
      }
    ]
  },

  /* ─────────────────────────────────────
     OPTIMIZATION & GRADIENT METHODS
  ───────────────────────────────────── */
  optimization: {
    label: "Optimization",
    symbols: [
      {
        glyph: "∇J(θ)", name: "Gradient", shortName: "∇J",
        insert: "grad(J, theta)",
        explanation: "Vector of all partial derivatives of loss J with respect to parameters θ. Points in the direction of steepest increase.",
        definition: "∇J(θ) = [∂J/∂θ₁, ∂J/∂θ₂, …, ∂J/∂θₙ]",
        examples: ["grad(J, theta)", "∇J(θ) reversed for gradient descent"]
      },
      {
        glyph: "θ←θ−α∇J", name: "Gradient Descent Step", shortName: "GD update",
        insert: "theta - alpha * grad(J, theta)",
        explanation: "Core parameter update: move opposite the gradient, scaled by learning rate α. Repeating this minimizes J.",
        definition: "θₜ₊₁ = θₜ − α · ∇J(θₜ)",
        examples: ["theta - 0.01 * grad(loss, theta)"]
      },
      {
        glyph: "H(f)", name: "Hessian", shortName: "Hessian",
        insert: "hessian(",
        explanation: "Matrix of all second-order partial derivatives. Describes the curvature of the loss surface. Used by Newton's method.",
        definition: "Hᵢⱼ = ∂²f / ∂xᵢ∂xⱼ",
        examples: ["hessian(loss)", "Newton step: θ ← θ − H⁻¹∇f"]
      },
      {
        glyph: "J(f)", name: "Jacobian", shortName: "Jacobian",
        insert: "jacobian(",
        explanation: "Matrix of all first-order partial derivatives for vector-valued functions. Generalizes the gradient to multiple outputs.",
        definition: "Jᵢⱼ = ∂fᵢ / ∂xⱼ",
        examples: ["jacobian(f)", "Used in backpropagation through layers"]
      },
      {
        glyph: "argmin", name: "Arg Min", shortName: "argmin",
        insert: "argmin(",
        explanation: "Returns the input value that produces the minimum output of a function — what we solve for in optimization.",
        definition: "argmin f(x) = x* such that f(x*) ≤ f(x) ∀x",
        examples: ["argmin(loss, theta)", "argmin_θ L(θ, data)"]
      },
      {
        glyph: "argmax", name: "Arg Max", shortName: "argmax",
        insert: "argmax(",
        explanation: "Returns the input value that produces the maximum output — used in classification to pick the highest-scoring class.",
        definition: "argmax f(x) = x* such that f(x*) ≥ f(x) ∀x",
        examples: ["argmax(scores, k)", "argmax_k P(y=k|x)"]
      },
      {
        glyph: "α", name: "Learning Rate", shortName: "α",
        insert: "alpha",
        explanation: "Step size controlling how far parameters move per gradient update. Too large diverges; too small converges slowly.",
        definition: "θₜ₊₁ = θₜ − α · ∇L(θₜ)",
        examples: ["alpha = 0.001 (Adam default)", "alpha = 0.1 (SGD typical)"]
      },
      {
        glyph: "clip(g)", name: "Gradient Clipping", shortName: "clip",
        insert: "clip(",
        explanation: "Limits gradient magnitude to prevent exploding gradients. Essential for training RNNs and deep networks.",
        definition: "clip(g, lo, hi) = max(lo, min(g, hi))",
        examples: ["clip(grad, -1, 1)", "Norm clipping: g * threshold / ‖g‖"]
      },
      {
        glyph: "𝓛(θ)", name: "Loss Function", shortName: "𝓛",
        insert: "L(",
        explanation: "Scalar measure of prediction error averaged over training data. The optimization objective we minimize.",
        definition: "𝓛(θ) = (1/n) Σᵢ loss(ŷᵢ, yᵢ)",
        examples: ["L(theta)", "Minimize L(theta) by updating parameters"]
      },
      {
        glyph: "β₁, β₂", name: "Adam Decay Rates", shortName: "β (Adam)",
        insert: "beta1 * m + (1 - beta1)",
        explanation: "Exponential decay rates for the first moment (β₁) and second moment (β₂) estimates in the Adam optimizer.",
        definition: "mₜ = β₁mₜ₋₁ + (1−β₁)gₜ  ;  vₜ = β₂vₜ₋₁ + (1−β₂)gₜ²",
        examples: ["beta1 = 0.9, beta2 = 0.999 (defaults)"]
      }
    ]
  },

  /* ─────────────────────────────────────
     NEURAL NETWORK MATHEMATICS
  ───────────────────────────────────── */
  neuralNetMath: {
    label: "Neural Net Math",
    symbols: [
      {
        glyph: "σ(x)", name: "Sigmoid", shortName: "σ(x)",
        insert: "sigmoid(",
        explanation: "Squashes any value into (0, 1). Used for binary output layers and gates in LSTMs. Vanishing gradient problem in deep layers.",
        definition: "σ(x) = 1 / (1 + e^{−x})",
        examples: ["sigmoid(x)", "sigmoid(W*x + b)", "Binary classification output"]
      },
      {
        glyph: "ReLU(x)", name: "ReLU", shortName: "ReLU",
        insert: "relu(",
        explanation: "Rectified Linear Unit — zero for negatives, identity for positives. Fast, sparse, and the default activation for hidden layers.",
        definition: "ReLU(x) = max(0, x)",
        examples: ["relu(x)", "relu(W*x + b)", "Most widely used activation"]
      },
      {
        glyph: "tanh(x)", name: "Tanh", shortName: "tanh",
        insert: "tanh(",
        explanation: "Squashes values into (−1, 1). Zero-centered unlike sigmoid, making it better for hidden layers in RNNs.",
        definition: "tanh(x) = (eˣ − e⁻ˣ) / (eˣ + e⁻ˣ)",
        examples: ["tanh(x)", "LSTM cell gates use tanh", "Output in (−1, 1)"]
      },
      {
        glyph: "GELU(x)", name: "GELU", shortName: "GELU",
        insert: "gelu(",
        explanation: "Gaussian Error Linear Unit — smooth approximation to ReLU that weights inputs by their probability under a Gaussian. Used in GPT and BERT.",
        definition: "GELU(x) ≈ 0.5x(1 + tanh(√(2/π)(x + 0.044715x³)))",
        examples: ["gelu(x)", "Default activation in transformer models"]
      },
      {
        glyph: "Swish(x)", name: "Swish", shortName: "Swish",
        insert: "swish(",
        explanation: "Self-gated activation: x times sigmoid(x). Smooth and non-monotonic. Outperforms ReLU on many deep architectures.",
        definition: "Swish(x) = x · σ(x)",
        examples: ["swish(x)", "Used in EfficientNet and MobileNetV3"]
      },
      {
        glyph: "softmax", name: "Softmax", shortName: "softmax",
        insert: "softmax(",
        explanation: "Converts a vector of raw scores (logits) into a probability distribution summing to 1. Standard final layer for multi-class classification.",
        definition: "softmax(zᵢ) = eᶻⁱ / Σⱼ eᶻʲ",
        examples: ["softmax(logits)", "softmax(QKᵀ/√dₖ) in attention"]
      },
      {
        glyph: "H(p,q)", name: "Cross-Entropy Loss", shortName: "CrossEnt",
        insert: "crossentropy(",
        explanation: "Measures the difference between true label distribution p and predicted distribution q. The standard loss for classification tasks.",
        definition: "H(p,q) = −Σ p(x) log q(x)",
        examples: ["crossentropy(y_pred, y_true)", "Minimized during classifier training"]
      },
      {
        glyph: "MSE", name: "Mean Squared Error", shortName: "MSE",
        insert: "mse(",
        explanation: "Average squared difference between predictions and targets. Standard regression loss. Penalizes large errors heavily.",
        definition: "MSE = (1/n) Σᵢ (ŷᵢ − yᵢ)²",
        examples: ["mse(y_pred, y_true)", "L2 loss in regression"]
      },
      {
        glyph: "MAE", name: "Mean Absolute Error", shortName: "MAE",
        insert: "mae(",
        explanation: "Average absolute difference between predictions and targets. More robust than MSE to outliers since it does not square the errors.",
        definition: "MAE = (1/n) Σᵢ |ŷᵢ − yᵢ|",
        examples: ["mae(y_pred, y_true)", "L1 loss — robust to outliers"]
      },
      {
        glyph: "D_KL(P‖Q)", name: "KL Divergence", shortName: "KL div",
        insert: "kldiv(",
        explanation: "Kullback–Leibler divergence — measures how much probability distribution P differs from reference distribution Q. Not symmetric.",
        definition: "D_KL(P‖Q) = Σ P(x) log(P(x)/Q(x))",
        examples: ["kldiv(P, Q)", "VAE regularization term"]
      },
      {
        glyph: "𝒩(μ,σ²)", name: "Gaussian Distribution", shortName: "𝒩(μ,σ²)",
        insert: "gaussian(",
        explanation: "The Normal distribution parameterized by mean μ and variance σ². Appears throughout probability theory and Bayesian ML.",
        definition: "𝒩(x; μ,σ²) = (1/√(2πσ²)) exp(−(x−μ)²/(2σ²))",
        examples: ["gaussian(0, 1) — standard normal", "Weight initialization: 𝒩(0, 0.01)"]
      },
      {
        glyph: "E[X]", name: "Expectation", shortName: "E[X]",
        insert: "expect(",
        explanation: "The probability-weighted average value of a random variable. Central to defining variance, covariance, and risk.",
        definition: "E[X] = Σ x · P(X=x)  or  ∫ x f(x) dx",
        examples: ["expect(X)", "E[loss] averaged over training distribution"]
      }
    ]
  }
};

/**
 * Random example equations for the "Random Example" button
 */
const RANDOM_EXAMPLES = [
  { eq: "sqrt(a^2 + b^2)",       label: "Pythagorean Theorem" },
  { eq: "(-b + sqrt(b^2 - 4*a*c)) / (2*a)", label: "Quadratic Formula" },
  { eq: "e^(i*pi) + 1",          label: "Euler's Identity (approx)" },
  { eq: "sqrt(9) + 2^3",         label: "Roots and Powers" },
  { eq: "abs(-7) + floor(3.9)",   label: "Abs + Floor" },
  { eq: "sin(pi/6)^2 + cos(pi/6)^2", label: "Pythagorean Identity" },
  { eq: "log(e^5)",               label: "Log and Exp cancel" },
  { eq: "(1 + sqrt(5)) / 2",      label: "Golden Ratio φ" },
  { eq: "factorial(6) / (factorial(3) * factorial(3))", label: "Binomial Coefficient 6C3" },
  { eq: "ceil(2.3) * floor(4.8)", label: "Ceiling × Floor" },
  { eq: "2^10",                   label: "Binary kilobyte" },
  { eq: "sum(k^2, k, 1, 5)",      label: "Sum of squares 1–5" },
  { eq: "derivative(x^3 + 2*x, x)", label: "Derivative example" },
  { eq: "cbrt(125)",              label: "Cube Root" },
  { eq: "nthRoot(256, 4)",        label: "4th Root of 256" },
  { eq: "norm([3, 4])",              label: "L2 Norm of vector" },
  { eq: "dot([1,2,3],[4,5,6])",      label: "Dot product" },
  { eq: "sigmoid(2.5)",              label: "Sigmoid activation" },
  { eq: "relu(-3) + relu(5)",        label: "ReLU activation" },
  { eq: "tanh(1)",                   label: "Tanh activation" },
  { eq: "softmax([1,2,3])",          label: "Softmax probabilities" },
  { eq: "mse(0.8, 1.0)",             label: "Mean Squared Error" },
  { eq: "det([[2,1],[1,3]])",        label: "2×2 Determinant" },
  { eq: "grad(x^2 + 2*x, x)",       label: "Gradient of loss" },
  { eq: "argmin(x^2 - 4*x, x)",     label: "Minimize a function" },
  { eq: "entropy([0.25,0.25,0.25,0.25])", label: "Uniform entropy" },
  { eq: "gelu(1.5)",                 label: "GELU activation" },
  { eq: "crossentropy([0.9,0.1],[1,0])", label: "Cross-entropy loss" },
  { eq: "kldiv([0.4,0.6],[0.5,0.5])",   label: "KL Divergence" },
  { eq: "expect(x^2)",              label: "Expected value E[X²]" }
];
