import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Salud del servidor
  getHealth: () => api.get('/salud'),
  
  // Estudiantes
  getStudents: () => api.get('/estudiantes'),
  
  // Configurar solver
  configureSolver: (config) => api.post('/configurar', config),
  
  // Ejecutar método
  executeSecante: (data) => api.post('/ejecutar', data),
  
  // Buscar raíces
  searchRoots: (data) => api.post('/buscar-raices', data),
  
  // Análisis de sensibilidad
  analyzeSensitivity: (data) => api.post('/sensibilidad', data),
  
  // Funciones patológicas
  generatePathologicalFunction: (data) => api.post('/funcion-patologica', data),
  
  // Estadísticas
  getStatistics: () => api.get('/estadisticas'),
  
  // Informe
  getReport: (resultId) => api.get(`/informe/${resultId}`),
  
  // Ejemplos
  getExamples: () => api.get('/ejemplos'),
};

export default apiService;