export const API_BASE_URL = 'http://localhost:5000/api';

export const STRATEGIES = [
  { value: 'perturbacion', label: 'Perturbación Aleatoria' },
  { value: 'reset', label: 'Reset Completo' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'perturbacion_hibrida', label: 'Perturbación Híbrida' },
  { value: 'adaptativa', label: 'Adaptativa' }
];

export const PATHOLOGICAL_FUNCTIONS = [
  { value: 'weierstrass', label: 'Weierstrass (No diferenciable)' },
  { value: 'oscilatoria', label: 'Oscilatoria Alta Frecuencia' },
  { value: 'no_suave', label: 'No Suave (Discontinua)' },
  { value: 'multimodal', label: 'Multimodal (Múltiples raíces)' },
  { value: 'condicion_malo', label: 'Mal Condicionada' }
];

export const NOISE_LEVELS = [
  { value: 1e-15, label: '1e-15 (Muy bajo)' },
  { value: 1e-12, label: '1e-12' },
  { value: 1e-9, label: '1e-9' },
  { value: 1e-6, label: '1e-6' },
  { value: 1e-3, label: '1e-3 (Alto)' }
];