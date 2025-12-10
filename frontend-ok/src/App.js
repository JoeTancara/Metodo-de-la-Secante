import React, { useState, useEffect } from 'react';
import { FaChartLine, FaSearch, FaCog, FaPlay, FaChartBar, FaBook, FaCalculator, FaUsers, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import Header from './components/Header';
import FunctionInput from './components/FunctionInput';
import ExecutionPanel from './components/ExecutionPanel';
import ResultsPanel from './components/ResultsPanel';
import Visualization from './components/Visualization';
import RootsSearch from './components/RootsSearch';
import SensitivityAnalysis from './components/SensitivityAnalysis';
import ExamplesPanel from './components/ExamplesPanel';
import MethodDetails from './components/MethodDetails';
import apiService from './services/api';
import './styles/App.css';

function App() {
  const [currentConfig, setCurrentConfig] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [examples, setExamples] = useState([]);
  const [activeTab, setActiveTab] = useState('configure');
  const [searchResults, setSearchResults] = useState(null);
  const [sensitivityResults, setSensitivityResults] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiHealth();
    fetchStudents();
    fetchExamples();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await apiService.getHealth();
      setApiStatus('connected');
      console.log('  API conectada correctamente:', response.data);
    } catch (error) {
      console.error('. Error conectando a la API:', error);
      setApiStatus('disconnected');
      alert('No se pudo conectar a la API. Asegúrate de que el servidor esté ejecutándose en http://localhost:5000');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiService.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchExamples = async () => {
    try {
      const response = await apiService.getExamples();
      setExamples(response.data.ejemplos);
    } catch (error) {
      console.error('Error fetching examples:', error);
    }
  };

const handleConfigure = async (config) => {
  setLoading(true);
  try {
    const response = await apiService.configureSolver(config);
    
    // Guardar la configuración COMPLETA, no solo configuracion
    setCurrentConfig({
      expresion_funcion: config.expresion_funcion,
      tol: config.tol,
      max_iter: config.max_iter,
      estrategia_ciclos: config.estrategia_ciclos,
      usar_derivada_numerica: config.usar_derivada_numerica
    });
    
    alert('Solver configurado exitosamente');
  } catch (error) {
    console.error('Error configuring solver:', error);
    alert(`Error: ${error.response?.data?.message || error.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleExecute = async (initialPoints) => {
    if (!currentConfig) {
      alert('Por favor, configura el solver primero');
      return;
    }

    if (apiStatus !== 'connected') {
      alert('No hay conexión con el servidor. Verifica que el backend esté corriendo.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.executeSecante(initialPoints);
      
      if (response.data.status === 'success') {
        setCurrentResult(response.data.resultado);
        setActiveTab('results');
      } else {
        throw new Error(response.data.message || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error executing secante:', error);
      
      let errorMessage = '. Error en la ejecución: ';
      if (error.response) {
        errorMessage += error.response.data?.message || error.response.statusText;
      } else if (error.request) {
        errorMessage += 'No se recibió respuesta del servidor. Verifica que el backend esté corriendo.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      
      setCurrentResult({
        raiz: { real: 0, imag: 0 },
        convergio: false,
        iteraciones: 0,
        error_final: 1,
        ciclos_detectados: 0,
        tipo_convergencia: 'error',
        mensaje_error: errorMessage,
        errores_iteracion: [1],
        errores_relativos: [1],
        trayectoria: [{real: 0, imag: 0}],
        configuracion: currentConfig
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRoots = async (searchParams) => {
    if (!currentConfig) {
      alert('Por favor, configura el solver primero');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.searchRoots(searchParams);
      setSearchResults(response.data.resultado);
      setActiveTab('searchResults');
    } catch (error) {
      console.error('Error searching roots:', error);
      alert(`. Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeSensitivity = async (analysisParams) => {
    if (!currentResult?.raiz) {
      alert('Primero encuentra una raíz ejecutando el método');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.analyzeSensitivity({
        raiz_real: currentResult.raiz.real,
        raiz_imag: currentResult.raiz.imag,
        ...analysisParams
      });
      setSensitivityResults(response.data.resultado);
      setActiveTab('sensitivity');
    } catch (error) {
      console.error('Error analyzing sensitivity:', error);
      alert(`. Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExample = (example) => {
    setCurrentConfig({
      expresion_funcion: example.expresion,
      tol: 1e-12,
      max_iter: 100,
      estrategia_ciclos: 'perturbacion_hibrida',
      usar_derivada_numerica: false
    });
    alert(`Solver Cargado OK`);
  };

  const handleViewMethodInfo = async () => {
    try {
      const response = await apiService.get('/api/metodo-info');
      alert(`ℹ️ ${JSON.stringify(response.data.info_metodo, null, 2)}`);
    } catch (error) {
      console.error('Error fetching method info:', error);
    }
  };

  return (
    <div className="app">
      <Header />
      
      <div className="api-status-indicator">
        <div className={`status-dot ${apiStatus === 'connected' ? 'connected' : 'disconnected'}`}></div>
        <span className="status-text">
        </span>
      </div>

      <div className="main-container">
        <div className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              <FaCalculator className="sidebar-icon" />
              Navegación
            </h3>
            <div className="nav-menu">
              <button
                className={`nav-btn ${activeTab === 'configure' ? 'active' : ''}`}
                onClick={() => setActiveTab('configure')}
              >
                <FaCog />
                <span>Configuración</span>
              </button>
              <button
                className={`nav-btn ${activeTab === 'execution' ? 'active' : ''}`}
                onClick={() => setActiveTab('execution')}
              >
                <FaPlay />
                <span>Ejecución</span>
              </button>
              <button
                className={`nav-btn ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                <FaChartBar />
                <span>Resultados</span>
              </button>
              <button
                className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                <FaSearch />
                <span>Búsqueda de Raíces</span>
              </button>
              <button
                className={`nav-btn ${activeTab === 'sensitivity' ? 'active' : ''}`}
                onClick={() => setActiveTab('sensitivity')}
              >
                <FaChartLine />
                <span>Sensibilidad</span>
              </button>
              <button
                className={`nav-btn ${activeTab === 'examples' ? 'active' : ''}`}
                onClick={() => setActiveTab('examples')}
              >
                <FaBook />
                <span>Ejemplos</span>
              </button>
              <button
                className="nav-btn info-btn"
                onClick={handleViewMethodInfo}
              >
                <FaInfoCircle />
                <span>Info del Método</span>
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">
              <FaCog className="sidebar-icon" />
              Estado del Solver
            </h3>
            <div className="solver-status">
              <div className="status-item">
                <span className="status-label">Configurado:</span>
                <span className={`status-value ${currentConfig ? 'active' : 'inactive'}`}>
                  {currentConfig ? <FaCheckCircle /> : <FaTimesCircle />}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Última ejecución:</span>
                <span className="status-value">
                  {currentResult ? <FaCheckCircle /> : 'No ejecutado'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Conexión API:</span>
                <span className={`status-value ${apiStatus === 'connected' ? 'active' : 'inactive'}`}>
                  {apiStatus === 'connected' ? <FaCheckCircle /> : <FaTimesCircle />}
                </span>
              </div>
              {currentConfig && (
                <div className="current-function-display">
                  <span className="function-label">Función actual:</span>
                  <code className="function-code">{currentConfig.expresion_funcion}</code>
                </div>
              )}
            </div>
          </div>

          {currentResult && (
            <div className="sidebar-section">
              <h3 className="sidebar-title">
                <FaChartLine className="sidebar-icon" />
                Último Resultado
              </h3>
              <div className="quick-stats">
                <div className="quick-stat">
                  <span className="stat-label">Raíz:</span>
                  <span className="stat-value">
                    {currentResult.raiz.real.toFixed(4)} {currentResult.raiz.imag >= 0 ? '+' : ''} {currentResult.raiz.imag.toFixed(4)}i
                  </span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Iteraciones:</span>
                  <span className="stat-value">{currentResult.iteraciones}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Error:</span>
                  <span className="stat-value">{currentResult.error_final?.toExponential(2)}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Ciclos:</span>
                  <span className="stat-value">{currentResult.ciclos_detectados || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="content-area">
          {activeTab === 'configure' && (
            <FunctionInput
              onConfigure={handleConfigure}
              loading={loading}
              currentConfig={currentConfig}
            />
          )}

          {activeTab === 'execution' && (
            <ExecutionPanel
              onExecute={handleExecute}
              loading={loading}
              currentFunction={currentConfig?.expresion_funcion}
            />
          )}

          {activeTab === 'results' && currentResult && (
            <>
              <ResultsPanel
                result={currentResult}
                loading={loading}
              />
              <MethodDetails result={currentResult} />
              <Visualization
                trajectory={currentResult.trayectoria}
                errors={currentResult.errores_iteracion}
                root={currentResult.raiz}
              />
            </>
          )}

          {activeTab === 'search' && (
            <RootsSearch
              onSearch={handleSearchRoots}
              loading={loading}
            />
          )}

          {activeTab === 'searchResults' && searchResults && (
            <div className="search-results-container">
              <div className="results-header">
                <h3>Resultados de la Búsqueda</h3>
                <div className="results-summary">
                  <span className="summary-item">
                    <strong>{searchResults.total_raices}</strong> raíces encontradas
                  </span>
                  <span className="summary-item">
                    <strong>{searchResults.puntos_procesados}</strong> puntos procesados
                  </span>
                  <span className="summary-item">
                    <strong>{(searchResults.tiempo_busqueda).toFixed(2)}s</strong> tiempo
                  </span>
                </div>
              </div>

              <div className="roots-grid">
                {searchResults.raices.map((raiz, idx) => (
                  <div key={idx} className="root-card">
                    <div className="root-number">Raíz #{idx + 1}</div>
                    <div className="root-complex">
                      <span className="root-real">{raiz.real.toFixed(6)}</span>
                      <span className="root-sign">{raiz.imag >= 0 ? '+' : ''}</span>
                      <span className="root-imag">{raiz.imag.toFixed(6)}i</span>
                    </div>
                    <div className="root-info">
                      <div className="info-item">
                        <span className="label">Error:</span>
                        <span className="value">{raiz.error.toExponential(4)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Iteraciones:</span>
                        <span className="value">{raiz.iteraciones}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Ciclos:</span>
                        <span className="value">{raiz.ciclos_detectados || 0}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Encontrada:</span>
                        <span className="value">{raiz.veces_encontrada} veces</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sensitivity' && (
            <SensitivityAnalysis
              onAnalyze={handleAnalyzeSensitivity}
              loading={loading}
              currentRoot={currentResult?.raiz}
              results={sensitivityResults}
            />
          )}

          {activeTab === 'examples' && (
            <ExamplesPanel
              examples={examples}
              onLoadExample={handleLoadExample}
            />
          )}

          {activeTab === 'results' && !currentResult && (
            <div className="empty-state">
              <div className="empty-icon">
                <FaChartBar size={64} />
              </div>
              <h3>No hay resultados para mostrar</h3>
              <p>Ejecuta el método de la secante para ver los resultados</p>
              <button 
                className="btn-primary"
                onClick={() => setActiveTab('execution')}
              >
                Ir a Ejecución
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2025 Método de la Secante para Funciones Complejas - Análisis Numérico Avanzado</p>
          <p className="footer-info">
            Universidad Mayor de San Andres - Facultad de Ciencias Puras y Naturales - Métodos Numéricos INF-373
          </p>
          <p className="footer-version">
            Versión 4.1 | Backend {apiStatus === 'connected' ? '  Conectado' : '. Desconectado'}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
