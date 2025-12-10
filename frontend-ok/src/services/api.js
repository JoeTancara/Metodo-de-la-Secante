import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const seguroFloat = (valor, def = 0) => {
  const num = parseFloat(valor);
  return isNaN(num) ? def : num;
};

const seguroInt = (valor, def = 0) => {
  const num = parseInt(valor);
  return isNaN(num) ? def : num;
};

export const apiService = {
  getHealth: () => api.get('/salud'),
  
  getStudents: () => api.get('/estudiantes'),
  
  configureSolver: (config) => {
    return api.post('/configurar', {
      expresion_funcion: String(config.expresion_funcion || 'z**2 - 4'),
      tol: seguroFloat(config.tol, 1e-12),
      max_iter: seguroInt(config.max_iter, 100),
      estrategia_ciclos: String(config.estrategia_ciclos || 'perturbacion_hibrida'),
      usar_derivada_numerica: Boolean(config.usar_derivada_numerica || false)
    });
  },
  
  executeSecante: (data) => {
    return api.post('/ejecutar', {
      x0_real: seguroFloat(data.x0_real, 0.5),
      x0_imag: seguroFloat(data.x0_imag, 0.5),
      x1_real: seguroFloat(data.x1_real, 1.0),
      x1_imag: seguroFloat(data.x1_imag, 0.0),
      id_ejecucion: data.id_ejecucion || undefined
    });
  },
  
  searchRoots: (data) => {
    return api.post('/buscar-raices', {
      region: {
        x_min: seguroFloat(data.region.x_min, -2),
        x_max: seguroFloat(data.region.x_max, 2),
        y_min: seguroFloat(data.region.y_min, -2),
        y_max: seguroFloat(data.region.y_max, 2)
      },
      n_puntos: seguroInt(data.n_puntos, 20),
      distancia_minima: seguroFloat(data.distancia_minima, 0.05),
      paralelo: Boolean(data.paralelo || true)
    });
  },
  
  analyzeSensitivity: (data) => {
    return api.post('/sensibilidad', {
      raiz_real: seguroFloat(data.raiz_real, 0),
      raiz_imag: seguroFloat(data.raiz_imag, 0),
      niveles_ruido: Array.isArray(data.niveles_ruido) 
        ? data.niveles_ruido.map(n => seguroFloat(n, 1e-9))
        : [1e-15, 1e-12, 1e-9, 1e-6, 1e-3],
      muestras_por_nivel: seguroInt(data.muestras_por_nivel, 5)
    });
  },
  
  getStatistics: () => api.get('/estadisticas'),
  
  getReport: (resultId) => api.get(`/informe/${resultId}`),
  
  getExamples: () => api.get('/ejemplos')
};

export default apiService;