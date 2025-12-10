import React, { useState, useEffect } from 'react';
import { FaChartLine, FaSearch, FaCog, FaPlay, FaChartBar, FaBook } from 'react-icons/fa';
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
  const [currentConfig, setCurrentConfig] = useState({
    expresion_funcion: 'z**2 - 4',
    tol: 1e-12,
    max_iter: 100,
    estrategia_ciclos: 'perturbacion_hibrida',
    usar_derivada_numerica: false
  });
  
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
    fetchExamples();
  }, []);

  const checkApiHealth = async () => {
    try {
      await apiService.getHealth();
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('disconnected');
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
      // GUARDAR CONFIGURACIÓN COMPLETA
      setCurrentConfig({
        expresion_funcion: config.expresion_funcion,
        tol: config.tol,
        max_iter: config.max_iter,
        estrategia_ciclos: config.estrategia_ciclos,
        usar_derivada_numerica: config.usar_derivada_numerica
      });
      alert('Solver configurado exitosamente');
    } catch (error) {
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
      alert(`Error: ${error.response?.data?.message || error.message}`);
      
      setCurrentResult({
        raiz: { real: 0, imag: 0 },
        convergio: false,
        iteraciones: 0,
        error_final: 1e-15,
        ciclos_detectados: 0,
        tipo_convergencia: 'error',
        errores_iteracion: [1e-15],
        errores_relativos: [1e-15],
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
      alert(`Error: ${error.response?.data?.message || error.message}`);
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
      alert(`Error: ${error.response?.data?.message || error.message}`);
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
    alert(`Ejemplo "${example.nombre}" cargado.`);
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
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">
              Estado del Solver
            </h3>
            <div className="solver-status">
              <div className="status-item">
                <span className="status-label">Configurado:</span>
                <span className="status-value active">
                  ✓
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Conexión API:</span>
                <span className={`status-value ${apiStatus === 'connected' ? 'active' : 'inactive'}`}>
                  {apiStatus === 'connected' ? '✓' : '✗'}
                </span>
              </div>
            </div>
            
            <div className="current-function-display">
              <span className="function-label">Función actual:</span>
              <code className="function-code">{currentConfig.expresion_funcion}</code>
            </div>
          </div>

          {currentResult && (
            <div className="sidebar-section">
              <h3 className="sidebar-title">
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
              currentFunction={currentConfig.expresion_funcion}
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
        </div>
      </footer>
    </div>
  );
}

export default App;