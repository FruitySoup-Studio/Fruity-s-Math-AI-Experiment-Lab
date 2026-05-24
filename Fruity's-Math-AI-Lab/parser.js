/**
 * parser.js — Smart Equation Explanation Engine
 * Converts math.js-style expressions into plain English descriptions.  Conjured up By Jevante Boley All Rights Reserved Powered By FruitySoup Studio
 * Uses token-based parsing for live explanation generation. This was kinda hard to code so please be kind to it
 */

const MathParser = (() => {

  /* ── Token patterns ── */
  const PATTERNS = [
    { re: /^derivative\s*\(/i,         tag: 'derivative'  },
    { re: /^integrate\s*\(/i,          tag: 'integral'    },
    { re: /^sum\s*\(/i,                tag: 'sum'         },
    { re: /^prod\s*\(/i,               tag: 'product'     },
    { re: /^nthRoot\s*\(/i,            tag: 'nthRoot'     },
    { re: /^sqrt\s*\(/i,               tag: 'sqrt'        },
    { re: /^cbrt\s*\(/i,               tag: 'cbrt'        },
    { re: /^abs\s*\(/i,                tag: 'abs'         },
    { re: /^floor\s*\(/i,              tag: 'floor'       },
    { re: /^ceil\s*\(/i,               tag: 'ceil'        },
    { re: /^round\s*\(/i,              tag: 'round'       },
    { re: /^log\s*\(/i,                tag: 'log'         },
    { re: /^sin\s*\(/i,                tag: 'sin'         },
    { re: /^cos\s*\(/i,                tag: 'cos'         },
    { re: /^tanh\s*\(/i,               tag: 'tanh'        },
    { re: /^tan\s*\(/i,                tag: 'tan'         },
    { re: /^asin\s*\(/i,               tag: 'asin'        },
    { re: /^acos\s*\(/i,               tag: 'acos'        },
    { re: /^atan\s*\(/i,               tag: 'atan'        },
    { re: /^factorial\s*\(/i,          tag: 'factorial'   },
    { re: /^gamma\s*\(/i,              tag: 'gamma'       },
    { re: /^gcd\s*\(/i,                tag: 'gcd'         },
    { re: /^lcm\s*\(/i,                tag: 'lcm'         },
    { re: /^max\s*\(/i,                tag: 'max'         },
    { re: /^min\s*\(/i,                tag: 'min'         },
    { re: /^pow\s*\(/i,                tag: 'pow'         },
    { re: /^exp\s*\(/i,                tag: 'exp'         },
    /* ── Linear Algebra (new) ── */
    { re: /^norm\s*\(/i,               tag: 'norm'        },
    { re: /^transpose\s*\(/i,          tag: 'transpose'   },
    { re: /^det\s*\(/i,                tag: 'det'         },
    { re: /^inv\s*\(/i,                tag: 'inv'         },
    { re: /^dot\s*\(/i,                tag: 'dot'         },
    { re: /^cross\s*\(/i,              tag: 'cross'       },
    { re: /^trace\s*\(/i,              tag: 'trace'       },
    { re: /^rank\s*\(/i,               tag: 'rank'        },
    { re: /^svd\s*\(/i,                tag: 'svd'         },
    { re: /^matmul\s*\(/i,             tag: 'matmul'      },
    { re: /^eigen\s*\(/i,              tag: 'eigen'       },
    { re: /^diag\s*\(/i,               tag: 'diag'        },
    { re: /^outer\s*\(/i,              tag: 'outer'       },
    /* ── Optimization (new) ── */
    { re: /^grad\s*\(/i,               tag: 'grad'        },
    { re: /^hessian\s*\(/i,            tag: 'hessian'     },
    { re: /^jacobian\s*\(/i,           tag: 'jacobian'    },
    { re: /^argmin\s*\(/i,             tag: 'argmin'      },
    { re: /^argmax\s*\(/i,             tag: 'argmax'      },
    { re: /^clip\s*\(/i,               tag: 'clip'        },
    /* ── Probability & Statistics (new) ── */
    { re: /^prob\s*\(/i,               tag: 'prob'        },
    { re: /^expect\s*\(/i,             tag: 'expect'      },
    { re: /^variance\s*\(/i,           tag: 'variance'    },
    { re: /^cov\s*\(/i,                tag: 'cov'         },
    { re: /^entropy\s*\(/i,            tag: 'entropy'     },
    { re: /^kldiv\s*\(/i,              tag: 'kldiv'       },
    { re: /^gaussian\s*\(/i,           tag: 'gaussian'    },
    { re: /^softmax\s*\(/i,            tag: 'softmax'     },
    { re: /^mean\s*\(/i,               tag: 'mean_fn'     },
    { re: /^std\s*\(/i,                tag: 'std_fn'      },
    /* ── Neural Net Activations (new) ── */
    { re: /^sigmoid\s*\(/i,            tag: 'sigmoid'     },
    { re: /^relu\s*\(/i,               tag: 'relu'        },
    { re: /^leakyrelu\s*\(/i,          tag: 'leakyrelu'   },
    { re: /^gelu\s*\(/i,               tag: 'gelu'        },
    { re: /^swish\s*\(/i,              tag: 'swish'       },
    /* ── Loss Functions (new) ── */
    { re: /^crossentropy\s*\(/i,       tag: 'crossentropy'},
    { re: /^mse\s*\(/i,                tag: 'mse'         },
    { re: /^mae\s*\(/i,                tag: 'mae'         },
    { re: /^Infinity\b/i,              tag: 'infinity'    },
    { re: /^pi\b/i,                    tag: 'pi'          },
    { re: /^tau\b/i,                   tag: 'tau'         },
    { re: /^\be\b/,                    tag: 'euler'       },
    { re: /^-?\d+(\.\d+)?/,            tag: 'number'      },
    { re: /^[a-zA-Z_][a-zA-Z_0-9]*/,  tag: 'variable'    },
    { re: /^\^/,                       tag: 'power'       },
    { re: /^\+/,                       tag: 'plus'        },
    { re: /^-/,                        tag: 'minus'       },
    { re: /^\*/,                       tag: 'times'       },
    { re: /^\//,                       tag: 'divide'      },
    { re: /^!/,                        tag: 'factorial_op'},
    { re: /^%/,                        tag: 'mod'         },
    { re: /^\(/,                       tag: 'lparen'      },
    { re: /^\)/,                       tag: 'rparen'      },
    { re: /^,/,                        tag: 'comma'       },
    { re: /^\s+/,                      tag: 'space'       },
    { re: /^[=<>!]+/,                  tag: 'relation'    },
  ];

  /* ── Tokenize a raw expression string ── */
  function tokenize(expr) {
    const tokens = [];
    let remaining = expr.trim();
    while (remaining.length > 0) {
      let matched = false;
      for (const { re, tag } of PATTERNS) {
        const m = remaining.match(re);
        if (m) {
          if (tag !== 'space') {
            tokens.push({ tag, value: m[0] });
          }
          remaining = remaining.slice(m[0].length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push({ tag: 'unknown', value: remaining[0] });
        remaining = remaining.slice(1);
      }
    }
    return tokens;
  }

  /* ── Describe a single token ── */
  function describeToken(token) {
    const v = token.value;
    switch (token.tag) {
      case 'number':    return `<span class="math-word">${v}</span>`;
      case 'variable':  return `<span class="math-word">${v}</span>`;
      case 'plus':      return 'plus';
      case 'minus':     return 'minus';
      case 'times':     return 'times';
      case 'divide':    return 'divided by';
      case 'power':     return 'raised to the power of';
      case 'factorial_op': return 'factorial';
      case 'mod':       return 'modulo';
      case 'lparen':    return '';
      case 'rparen':    return '';
      case 'comma':     return 'and';
      case 'pi':        return '<span class="math-word">π (pi ≈ 3.14159)</span>';
      case 'euler':     return "<span class=\"math-word\">e (Euler's number ≈ 2.71828)</span>";
      case 'tau':       return '<span class="math-word">τ (tau = 2π)</span>';
      case 'infinity':  return '<span class="math-word">infinity</span>';
      case 'relation':  return v === '=' ? 'equals' : v === '<' ? 'less than' : v === '>' ? 'greater than' : v === '<=' ? 'less than or equal to' : v === '>=' ? 'greater than or equal to' : 'related to';
      default:          return v;
    }
  }

  /* ── High-level function descriptions ── */
  const FUNC_TEMPLATES = {
    sqrt:       args => `the square root of ${args[0]}`,
    cbrt:       args => `the cube root of ${args[0]}`,
    abs:        args => `the absolute value of ${args[0]}`,
    floor:      args => `the largest integer not exceeding ${args[0]} (floor)`,
    ceil:       args => `the smallest integer not less than ${args[0]} (ceiling)`,
    round:      args => `${args[0]} rounded to the nearest integer`,
    log:        args => `the natural logarithm of ${args[0]}`,
    sin:        args => `the sine of ${args[0]}`,
    cos:        args => `the cosine of ${args[0]}`,
    tan:        args => `the tangent of ${args[0]}`,
    asin:       args => `the angle (in radians) whose sine is ${args[0]}`,
    acos:       args => `the angle (in radians) whose cosine is ${args[0]}`,
    atan:       args => `the angle (in radians) whose tangent is ${args[0]}`,
    factorial:  args => `the factorial of ${args[0]} (${args[0]}!)`,
    gamma:      args => `the Gamma function of ${args[0]}`,
    exp:        args => `e raised to the power of ${args[0]}`,
    pow:        args => `${args[0]} raised to the power of ${args[1]}`,
    gcd:        args => `the greatest common divisor of ${args[0]} and ${args[1]}`,
    lcm:        args => `the least common multiple of ${args[0]} and ${args[1]}`,
    max:        args => `the maximum of ${args.join(', ')}`,
    min:        args => `the minimum of ${args.join(', ')}`,
    nthRoot:    args => `the ${args[1] || 'n'}th root of ${args[0]}`,
    sum:        args => `the summation of ${args[0]} as ${args[1]} goes from ${args[2]} to ${args[3]}`,
    product:    args => `the product of ${args[0]} as ${args[1]} goes from ${args[2]} to ${args[3]}`,
    derivative: args => `the derivative of ${args[0]} with respect to ${args[1] || 'x'}`,
    integral:   args => `the integral of ${args[0]} with respect to ${args[1] || 'x'}`,

    /* ── Linear Algebra (new) ── */
    norm:        args => `the L2 norm (Euclidean length) of ${args[0]}`,
    transpose:   args => `the transpose of matrix ${args[0]}`,
    det:         args => `the determinant of matrix ${args[0]}`,
    inv:         args => `the inverse of matrix ${args[0]}`,
    dot:         args => `the dot product of ${args[0]} and ${args[1]}`,
    cross:       args => `the cross product of ${args[0]} and ${args[1]}`,
    trace:       args => `the trace (sum of diagonal entries) of ${args[0]}`,
    rank:        args => `the rank of matrix ${args[0]}`,
    svd:         args => `the singular value decomposition of ${args[0]}`,
    matmul:      args => `the matrix product of ${args[0]} and ${args[1]}`,
    eigen:       args => `the eigenvalues and eigenvectors of ${args[0]}`,
    diag:        args => `the diagonal matrix formed from vector ${args[0]}`,
    outer:       args => `the outer product of ${args[0]} and ${args[1]}`,

    /* ── Optimization (new) ── */
    grad:        args => `the gradient of ${args[0]}${args[1] ? ` with respect to ${args[1]}` : ''}`,
    hessian:     args => `the Hessian matrix of second-order partial derivatives of ${args[0]}`,
    jacobian:    args => `the Jacobian matrix of all partial derivatives of ${args[0]}`,
    argmin:      args => `the value of ${args[1] || 'x'} that minimizes ${args[0]}`,
    argmax:      args => `the value of ${args[1] || 'x'} that maximizes ${args[0]}`,
    clip:        args => `${args[0]} clipped to the range [${args[1] || '0'}, ${args[2] || '1'}]`,

    /* ── Probability & Statistics (new) ── */
    prob:        args => `the probability of event ${args[0]}`,
    expect:      args => `the expected value (mean) of ${args[0]}`,
    variance:    args => `the variance of ${args[0]}`,
    cov:         args => `the covariance between ${args[0]} and ${args[1]}`,
    entropy:     args => `the Shannon entropy of distribution ${args[0]}`,
    kldiv:       args => `the KL divergence from ${args[1]} to ${args[0]}`,
    gaussian:    args => `a Gaussian distribution with mean ${args[0]} and variance ${args[1]}`,
    softmax:     args => `the softmax (normalized exponential) of vector ${args[0]}`,
    mean_fn:     args => `the arithmetic mean of ${args[0]}`,
    std_fn:      args => `the standard deviation of ${args[0]}`,

    /* ── Neural Net Activations (new) ── */
    tanh:        args => `the hyperbolic tangent of ${args[0]}`,
    sigmoid:     args => `the sigmoid activation: 1 divided by (1 plus e to the negative ${args[0]})`,
    relu:        args => `the ReLU activation: max(0, ${args[0]})`,
    leakyrelu:   args => `the leaky ReLU of ${args[0]} with small negative slope for negative inputs`,
    gelu:        args => `the GELU activation of ${args[0]} (Gaussian Error Linear Unit)`,
    swish:       args => `the Swish activation of ${args[0]} (${args[0]} times sigmoid of ${args[0]})`,

    /* ── Loss Functions (new) ── */
    crossentropy: args => `the cross-entropy loss between predictions ${args[0]} and targets ${args[1] || 'y'}`,
    mse:          args => `the mean squared error between ${args[0]} and ${args[1] || 'y'}`,
    mae:          args => `the mean absolute error between ${args[0]} and ${args[1] || 'y'}`,
  };

  /* ── Extract arguments from inside function parens ── */
  function extractArgs(tokens, startIdx) {
    // startIdx should point to the token after the opening lparen
    let depth = 1;
    let current = [];
    const argGroups = [];

    for (let i = startIdx; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.tag === 'lparen') {
        depth++;
        current.push(t);
      } else if (t.tag === 'rparen') {
        depth--;
        if (depth === 0) {
          argGroups.push(current);
          return { args: argGroups, endIdx: i };
        } else {
          current.push(t);
        }
      } else if (t.tag === 'comma' && depth === 1) {
        argGroups.push(current);
        current = [];
      } else {
        current.push(t);
      }
    }
    argGroups.push(current);
    return { args: argGroups, endIdx: tokens.length - 1 };
  }

  /* ── Recursively generate explanation from token list ── */
  function generateExplanation(tokens) {
    if (!tokens || tokens.length === 0) return '';

    const parts = [];
    let i = 0;

    while (i < tokens.length) {
      const t = tokens[i];

      // Check if a function token is followed by lparen
      if (isFuncTag(t.tag) && i + 1 < tokens.length && tokens[i + 1].tag === 'lparen') {
        const { args, endIdx } = extractArgs(tokens, i + 2);
        const argExps = args.map(a => generateExplanation(a));
        const tmpl = FUNC_TEMPLATES[t.tag];
        if (tmpl) {
          parts.push(tmpl(argExps));
        } else {
          parts.push(`${t.value}(${argExps.join(', ')})`);
        }
        i = endIdx + 1;
        continue;
      }

      // Power operator — look ahead
      if (t.tag === 'power') {
        // Replace last part with "raised to the power of"
        const base = parts.length ? parts.pop() : '?';
        const nextToken = tokens[i + 1];
        let exponent = '';
        if (nextToken && nextToken.tag === 'lparen') {
          const { args, endIdx } = extractArgs(tokens, i + 2);
          exponent = generateExplanation(args[0] || []);
          i = endIdx + 1;
        } else if (nextToken) {
          exponent = describeToken(nextToken);
          i += 2;
        } else {
          i++;
        }
        parts.push(`${base} raised to the power of ${exponent}`);
        continue;
      }

      // Factorial postfix
      if (t.tag === 'factorial_op') {
        const base = parts.length ? parts.pop() : '?';
        parts.push(`${base} factorial`);
        i++;
        continue;
      }

      // Generic token
      const desc = describeToken(t);
      if (desc) parts.push(desc);
      i++;
    }

    // Clean up: collapse multiple spaces, fix "the the"
    return parts
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/\bthe the\b/g, 'the')
      .trim();
  }

  function isFuncTag(tag) {
    return tag in FUNC_TEMPLATES;
  }

  /* ── Public: explain an expression ── */
  function explain(expr) {
    if (!expr || !expr.trim()) return '';
    try {
      const tokens = tokenize(expr.trim());
      const raw = generateExplanation(tokens);
      if (!raw) return '';
      // Capitalize first letter
      return raw.charAt(0).toUpperCase() + raw.slice(1) + '.';
    } catch (e) {
      return '';
    }
  }

  /* ── Public: detect free variables in expression ── */
  function detectVariables(expr) {
    if (!expr) return [];
    const RESERVED = new Set([
      // Original keywords
      'sqrt','cbrt','abs','floor','ceil','round','log','ln','sin','cos','tan',
      'asin','acos','atan','factorial','gamma','gcd','lcm','max','min','pow',
      'exp','sum','prod','derivative','integrate','nthRoot',
      'pi','e','tau','phi','Infinity','true','false','mod','and','or','not',
      'if','else','i','j', 'alpha','beta','gamma','delta','epsilon','lambda',
      'theta','sigma','mu','omega','rho','tau',
      // Linear Algebra (new)
      'norm','transpose','det','inv','dot','cross','trace','rank','svd',
      'matmul','eigen','diag','outer',
      // Optimization (new)
      'grad','hessian','jacobian','argmin','argmax','clip',
      // Probability & Statistics (new)
      'prob','expect','variance','cov','entropy','kldiv','gaussian',
      'softmax','mean','std',
      // Neural Net Activations (new)
      'tanh','sigmoid','relu','leakyrelu','gelu','swish',
      // Loss Functions (new)
      'crossentropy','mse','mae',
    ]);
    const tokens = tokenize(expr);
    const vars = new Set();
    tokens.forEach(t => {
      if (t.tag === 'variable' && !RESERVED.has(t.value) && isNaN(t.value)) {
        vars.add(t.value);
      }
    });
    return [...vars];
  }

  /* ── Public: render expression to LaTeX via simple rules ── */
  function toLatex(expr) {
    if (!expr) return '';
    // We delegate actual parsing to KaTeX via math.js implicit LaTeX
    // This is a best-effort pre-processor
    let s = expr
      .replace(/\bsqrt\s*\(/g, '\\sqrt{')
      .replace(/\bcbrt\s*\(/g, '\\sqrt[3]{')
      .replace(/\bnthRoot\s*\(\s*([^,]+),\s*([^)]+)\)/g, '\\sqrt[$2]{$1}')
      .replace(/\babs\s*\(/g, '\\left|')
      .replace(/\bfloor\s*\(/g, '\\lfloor ')
      .replace(/\bceil\s*\(/g, '\\lceil ')
      .replace(/\bsin\s*\(/g, '\\sin(')
      .replace(/\bcos\s*\(/g, '\\cos(')
      .replace(/\btan\s*\(/g, '\\tan(')
      .replace(/\basin\s*\(/g, '\\arcsin(')
      .replace(/\bacos\s*\(/g, '\\arccos(')
      .replace(/\batan\s*\(/g, '\\arctan(')
      .replace(/\blog\s*\(/g, '\\ln(')
      .replace(/\bfactorial\s*\(/g, '')
      .replace(/\bpi\b/g, '\\pi')
      .replace(/\btau\b/g, '\\tau')
      .replace(/\bInfinity\b/g, '\\infty')
      .replace(/\*/g, ' \\cdot ')
      .replace(/\bderivative\s*\(([^,]+),\s*([^)]+)\)/g, '\\frac{d}{d$2}\\left($1\\right)')
      .replace(/\bintegrate\s*\(([^,]+),\s*([^)]+)\)/g, '\\int $1 \\, d$2')
      /* ── Linear Algebra (new) ── */
      .replace(/\bnorm\s*\(/g, '\\|')
      .replace(/\btranspose\s*\(([^)]+)\)/g, '$1^{T}')
      .replace(/\bdet\s*\(/g, '\\det(')
      .replace(/\binv\s*\(([^)]+)\)/g, '$1^{-1}')
      .replace(/\bdot\s*\(([^,]+),\s*([^)]+)\)/g, '$1 \\cdot $2')
      .replace(/\bcross\s*\(([^,]+),\s*([^)]+)\)/g, '$1 \\times $2')
      .replace(/\btrace\s*\(/g, '\\text{tr}(')
      .replace(/\brank\s*\(/g, '\\text{rank}(')
      .replace(/\bmatmul\s*\(([^,]+),\s*([^)]+)\)/g, '$1 $2')
      .replace(/\beigen\s*\(/g, '\\text{eig}(')
      .replace(/\bsvd\s*\(/g, '\\text{SVD}(')
      .replace(/\bouter\s*\(([^,]+),\s*([^)]+)\)/g, '$1 $2^{T}')
      /* ── Optimization (new) ── */
      .replace(/\bgrad\s*\(([^,)]+)(?:,\s*([^)]+))?\)/g, (_, f, v) => v ? `\\nabla_{${v}} ${f}` : `\\nabla ${f}`)
      .replace(/\bhessian\s*\(/g, '\\mathbf{H}(')
      .replace(/\bjacobian\s*\(/g, '\\mathbf{J}(')
      .replace(/\bargmin\s*\(([^,)]+)(?:,\s*([^)]+))?\)/g, (_, f, v) => `\\arg\\min_{${v||'x'}} ${f}`)
      .replace(/\bargmax\s*\(([^,)]+)(?:,\s*([^)]+))?\)/g, (_, f, v) => `\\arg\\max_{${v||'x'}} ${f}`)
      .replace(/\bclip\s*\(/g, '\\text{clip}(')
      /* ── Probability & Statistics (new) ── */
      .replace(/\bprob\s*\(/g, 'P(')
      .replace(/\bexpect\s*\(/g, '\\mathbb{E}[')
      .replace(/\bvariance\s*\(/g, '\\text{Var}(')
      .replace(/\bcov\s*\(([^,]+),\s*([^)]+)\)/g, '\\text{Cov}($1, $2)')
      .replace(/\bentropy\s*\(/g, 'H(')
      .replace(/\bkldiv\s*\(([^,]+),\s*([^)]+)\)/g, 'D_{\\text{KL}}($1 \\| $2)')
      .replace(/\bgaussian\s*\(([^,]+),\s*([^)]+)\)/g, '\\mathcal{N}($1, $2)')
      .replace(/\bsoftmax\s*\(/g, '\\text{softmax}(')
      .replace(/\bmean\s*\(/g, '\\mu(')
      .replace(/\bstd\s*\(/g, '\\sigma(')
      /* ── Neural Net Activations (new) ── */
      .replace(/\btanh\s*\(/g, '\\tanh(')
      .replace(/\bsigmoid\s*\(/g, '\\sigma(')
      .replace(/\brelu\s*\(/g, '\\text{ReLU}(')
      .replace(/\bleakyrelu\s*\(/g, '\\text{LReLU}(')
      .replace(/\bgelu\s*\(/g, '\\text{GELU}(')
      .replace(/\bswish\s*\(/g, '\\text{Swish}(')
      /* ── Loss Functions (new) ── */
      .replace(/\bcrossentropy\s*\(([^,]+),\s*([^)]+)\)/g, 'H($2, $1)')
      .replace(/\bmse\s*\(([^,]+),\s*([^)]+)\)/g, '\\frac{1}{n}\\|$2 - $1\\|^2')
      .replace(/\bmae\s*\(([^,]+),\s*([^)]+)\)/g, '\\frac{1}{n}\\|$2 - $1\\|_1');
    return s;
  }

  return { explain, detectVariables, toLatex, tokenize };
})();
