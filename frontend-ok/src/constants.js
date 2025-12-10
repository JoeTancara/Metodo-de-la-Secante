export const API_BASE_URL = 'http://localhost:5000/api';

export const STRATEGIES = [
  { value: 'perturbacion', label: 'Perturbación aleatoria' },
  { value: 'reset', label: 'Reset periódico' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'perturbacion_hibrida', label: 'Perturbación híbrida (recomendado)' },
  { value: 'adaptativa', label: 'Adaptativa' }
];

export const FUNCTION_TYPES = [
  { value: 'polynomial', label: 'Polinomio' },
  { value: 'trigonometric', label: 'Trigonométrica' },
  { value: 'exponential', label: 'Exponencial' },
  { value: 'logarithmic', label: 'Logarítmica' },
  { value: 'mixed', label: 'Mixta' }
];

export const CONVERGENCE_TYPES = {
  lineal: { color: '#3b82f6', description: 'Convergencia lineal (ratio ~1)' },
  superlineal: { color: '#10b981', description: 'Convergencia superlineal (ratio 1-1.6)' },
  cuadratica_aproximada: { color: '#8b5cf6', description: 'Aproximación cuadrática (ratio ~1.618)' },
  lenta_o_divergente: { color: '#ef4444', description: 'Convergencia lenta o divergente' }
};

export const DEFAULT_PARAMS = {
  tol: 1e-12,
  max_iter: 100,
  estrategia_ciclos: 'perturbacion_hibrida',
  usar_derivada_numerica: false,
  n_puntos_busqueda: 20,
  distancia_minima: 0.05
};

export const EXAMPLE_FUNCTIONS = [
  {
    name: 'Raíces cúbicas de la unidad',
    expression: 'z**3 - 1',
    description: 'Polinomio cúbico con raíces en 1, -0.5±0.866i',
    roots: [
      { real: 1, imag: 0 },
      { real: -0.5, imag: 0.8660254037844386 },
      { real: -0.5, imag: -0.8660254037844386 }
    ]
  },
  {
    name: 'Función seno compleja',
    expression: 'cmath.sin(z) - z/2',
    description: 'Seno complejo con término lineal',
    roots: 'Múltiples raíces periódicas'
  },
  {
    name: 'Exponencial compleja',
    expression: 'cmath.exp(z) - 1',
    description: 'Exponencial compleja con raíz en 0',
    roots: [{ real: 0, imag: 0 }]
  },
  {
    name: 'Polinomio de grado 4',
    expression: 'z**4 - 5*z**2 + 4',
    description: 'Polinomio cuártico con 4 raíces reales',
    roots: [
      { real: 1, imag: 0 },
      { real: -1, imag: 0 },
      { real: 2, imag: 0 },
      { real: -2, imag: 0 }
    ]
  },
  {
    name: 'EJEMPLO BÁSICO - z² - 4',
    expression: 'z**2 - 4',
    description: 'Ejemplo educativo básico: raíces en ±2',
    roots: [
      { real: 2, imag: 0 },
      { real: -2, imag: 0 }
    ],
    educational: true,
    steps: [
      'Puntos iniciales: z₀ = 1, z₁ = 3',
      'f(z₀) = 1² - 4 = -3',
      'f(z₁) = 3² - 4 = 5',
      'z₂ = 3 - 5*(3-1)/(5-(-3)) = 2',
      'f(z₂) = 2² - 4 = 0 → CONVERGE'
    ]
  }
];

export const METHOD_INFO = {
  name: 'Método de la Secante',
  formula: 'zₙ₊₁ = zₙ - f(zₙ) * (zₙ - zₙ₋₁) / (f(zₙ) - f(zₙ₋₁))',
  condition: 'f(zₙ) ≠ f(zₙ₋₁)',
  convergence_order: 1.618,
  advantages: [
    'No requiere derivada de la función',
    'Convergencia superlineal (~1.618)',
    'Apropiado para funciones complejas',
    'Simple de implementar'
  ],
  disadvantages: [
    'Requiere dos puntos iniciales',
    'Puede diverger si f(zₙ) ≈ f(zₙ₋₁)',
    'Sensible a la elección de puntos iniciales',
    'Puede caer en ciclos infinitos'
  ]
};