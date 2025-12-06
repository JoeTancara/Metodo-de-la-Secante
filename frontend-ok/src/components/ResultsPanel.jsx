import React from 'react';
import { FaBullseye, FaSync, FaBolt, FaClock, FaChartLine } from 'react-icons/fa';
import './ResultsPanel.css';

const ResultsPanel = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="results-panel loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Calculando resultados...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-panel empty">
        <div className="empty-state">
          <div className="empty-icon">
            <FaChartLine size={64} />
          </div>
          <h4>Esperando ejecución</h4>
          <p>Ejecuta el método de la secante para ver los resultados</p>
        </div>
      </div>
    );
  }

  const { raiz, convergio, iteraciones, error_final, tiempo_ejecucion, tipo_convergencia, ratio_convergencia } = result;

  return (
    <div className="results-panel">
      <div className="panel-header">
        <h3>Resultados de la Ejecución</h3>
        <div className={`convergence-badge ${convergio ? 'success' : 'error'}`}>
          {convergio ? '✓ Convergió' : '✗ No convergió'}
        </div>
      </div>

      <div className="results-grid">
        <div className="result-card primary">
          <div className="result-icon">
            <FaBullseye />
          </div>
          <div className="result-content">
            <h5>Raíz Encontrada</h5>
            <div className="complex-root">
              <span className="root-real">{raiz.real.toFixed(10)}</span>
              <span className="root-sign">{raiz.imag >= 0 ? '+' : ''}</span>
              <span className="root-imag">{raiz.imag.toFixed(10)}i</span>
            </div>
            <div className="magnitude">
              |z| = {Math.sqrt(raiz.real**2 + raiz.imag**2).toFixed(8)}
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-icon">
            <FaSync />
          </div>
          <div className="result-content">
            <h5>Iteraciones</h5>
            <div className="result-value">{iteraciones}</div>
            <div className="result-label">iteraciones realizadas</div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-icon">
            <FaBolt />
          </div>
          <div className="result-content">
            <h5>Error Final</h5>
            <div className="result-value">{error_final.toExponential(4)}</div>
            <div className="result-label">|f(z)|</div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-icon">
            <FaClock />
          </div>
          <div className="result-content">
            <h5>Tiempo</h5>
            <div className="result-value">{(tiempo_ejecucion * 1000).toFixed(2)} ms</div>
            <div className="result-label">tiempo de ejecución</div>
          </div>
        </div>
      </div>

      <div className="convergence-analysis">
        <h4>
          <FaChartLine />
          Análisis de Convergencia
        </h4>
        <div className="convergence-details">
          <div className="convergence-item">
            <span className="label">Tipo:</span>
            <span className={`value type-${tipo_convergencia}`}>
              {tipo_convergencia.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="convergence-item">
            <span className="label">Ratio promedio:</span>
            <span className="value">{ratio_convergencia.toFixed(4)}</span>
          </div>
          <div className="convergence-item">
            <span className="label">Eficiencia:</span>
            <span className="value">
              {(iteraciones > 0 ? (1 - error_final) / iteraciones : 0).toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {result.trayectoria && (
        <div className="trajectory-info">
          <h4>
            <FaChartLine />
            Información de la Trayectoria
          </h4>
          <div className="trajectory-stats">
            <div className="stat">
              <span className="stat-label">Longitud de trayectoria:</span>
              <span className="stat-value">{result.trayectoria.length} puntos</span>
            </div>
            <div className="stat">
              <span className="stat-label">Distancia total recorrida:</span>
              <span className="stat-value">
                {calculateTotalDistance(result.trayectoria).toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {result.visualizacion_base64 && (
        <div className="visualization-preview">
          <h4>Visualización de la Trayectoria</h4>
          <img 
            src={`data:image/png;base64,${result.visualizacion_base64}`}
            alt="Visualización de la trayectoria"
            className="preview-image"
          />
        </div>
      )}
    </div>
  );
};

const calculateTotalDistance = (trayectoria) => {
  let total = 0;
  for (let i = 1; i < trayectoria.length; i++) {
    const dx = trayectoria[i].real - trayectoria[i-1].real;
    const dy = trayectoria[i].imag - trayectoria[i-1].imag;
    total += Math.sqrt(dx*dx + dy*dy);
  }
  return total;
};

export default ResultsPanel;