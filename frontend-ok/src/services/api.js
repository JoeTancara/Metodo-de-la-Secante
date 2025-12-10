import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 50000, // 30 segundos timeout
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      console.error('No response received:', error.request);
    } else {
      // Error al configurar la petición
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  // Salud del servidor
  getHealth: () => api.get('/salud'),
  
  // Estudiantes
  getStudents: () => api.get('/estudiantes'),
  
  // Configurar solver
  configureSolver: (config) => {
    // Validar configuración antes de enviar
    const validatedConfig = {
      expresion_funcion: String(config.expresion_funcion || 'z**2 - 4'),
      tol: parseFloat(config.tol) || 1e-12,
      max_iter: parseInt(config.max_iter) || 100,
      estrategia_ciclos: String(config.estrategia_ciclos || 'perturbacion_hibrida'),
      usar_derivada_numerica: Boolean(config.usar_derivada_numerica || false)
    };
    
    return api.post('/configurar', validatedConfig);
  },
  
  // Ejecutar método
  executeSecante: (data) => {
    const validatedData = {
      x0_real: parseFloat(data.x0_real) || 0.5,
      x0_imag: parseFloat(data.x0_imag) || 0.5,
      x1_real: parseFloat(data.x1_real) || 1.0,
      x1_imag: parseFloat(data.x1_imag) || 0.0,
      id_ejecucion: data.id_ejecucion || undefined
    };
    
    return api.post('/ejecutar', validatedData);
  },
  
  // Buscar raíces
  searchRoots: (data) => {
    const validatedData = {
      region: {
        x_min: parseFloat(data.region.x_min) || -2,
        x_max: parseFloat(data.region.x_max) || 2,
        y_min: parseFloat(data.region.y_min) || -2,
        y_max: parseFloat(data.region.y_max) || 2
      },
      n_puntos: parseInt(data.n_puntos) || 20,
      distancia_minima: parseFloat(data.distancia_minima) || 0.05,
      paralelo: Boolean(data.paralelo || true)
    };
    
    return api.post('/buscar-raices', validatedData);
  },
  
  // Análisis de sensibilidad
  analyzeSensitivity: (data) => {
    const validatedData = {
      raiz_real: parseFloat(data.raiz_real) || 0,
      raiz_imag: parseFloat(data.raiz_imag) || 0,
      niveles_ruido: Array.isArray(data.niveles_ruido) 
        ? data.niveles_ruido.map(n => parseFloat(n))
        : [1e-15, 1e-12, 1e-9, 1e-6, 1e-3],
      muestras_por_nivel: parseInt(data.muestras_por_nivel) || 5
    };
    
    return api.post('/sensibilidad', validatedData);
  },
  
  // Funciones patológicas
  generatePathologicalFunction: (data) => api.post('/funcion-patologica', data),
  
  // Estadísticas
  getStatistics: () => api.get('/estadisticas'),
  
  // Informe
  getReport: (resultId) => api.get(`/informe/${resultId}`),
  
  // Ejemplos
  getExamples: () => api.get('/ejemplos'),
  
  // Info método
  getMethodInfo: () => api.get('/api/metodo-info')
};

export default apiService;