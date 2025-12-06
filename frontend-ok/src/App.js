import React, { useState, useEffect } from 'react';
import { FaChartLine, FaSearch, FaCog, FaPlay, FaChartBar, FaBook, FaCalculator, FaUsers, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Header from './components/Header';
import FunctionInput from './components/FunctionInput';
import ExecutionPanel from './components/ExecutionPanel';
import ResultsPanel from './components/ResultsPanel';
import Visualization from './components/Visualization';
import RootsSearch from './components/RootsSearch';
import SensitivityAnalysis from './components/SensitivityAnalysis';
import ExamplesPanel from './components/ExamplesPanel';
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

  useEffect(() => {
    fetchStudents();
    fetchExamples();
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      await apiService.getHealth();
      console.log('API conectada correctamente');
    } catch (error) {
      console.error('Error conectando a la API:', error);
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
      setCurrentConfig(response.data.configuracion);
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

    setLoading(true);
    try {
      const response = await apiService.executeSecante(initialPoints);
      setCurrentResult(response.data.resultado);
      setActiveTab('results');
    } catch (error) {
      console.error('Error executing secante:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
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
      console.error('Error analyzing sensitivity:', error);
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
      estrategia_ciclos: 'perturbacion_hibrida'
    });
    alert(`Ejemplo "${example.nombre}" cargado. Ahora configura el solver.`);
  };

  return (
    <div className="app">
      <Header />
      
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
              {currentConfig && (
                <div className="current-function-display">
                  <span className="function-label">Función actual:</span>
                  <code className="function-code">{currentConfig.expresion_funcion}</code>
                </div>
              )}
            </div>
          </div>
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
            </div>
          )}
        </div>
      </div>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2024 Método de la Secante para Funciones Complejas - Análisis Numérico Avanzado</p>
          <p className="footer-info">
            Universidad Mayor de San Andres - Facultad de Ciencias Puras y Naturales - Métodos Numéricos
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;