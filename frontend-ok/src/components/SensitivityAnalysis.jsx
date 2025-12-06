import React, { useState } from 'react';
import { FaChartLine, FaPlus, FaTimes, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import './SensitivityAnalysis.css';

const SensitivityAnalysis = ({ onAnalyze, loading, currentRoot, results }) => {
  const [analysisParams, setAnalysisParams] = useState({
    niveles_ruido: [1e-15, 1e-12, 1e-9, 1e-6, 1e-3],
    muestras_por_nivel: 5
  });

  const handleNoiseLevelChange = (index, value) => {
    const newLevels = [...analysisParams.niveles_ruido];
    newLevels[index] = parseFloat(value);
    setAnalysisParams({
      ...analysisParams,
      niveles_ruido: newLevels
    });
  };

  const handleAddNoiseLevel = () => {
    setAnalysisParams({
      ...analysisParams,
      niveles_ruido: [...analysisParams.niveles_ruido, 1e-3]
    });
  };

  const handleRemoveNoiseLevel = (index) => {
    if (analysisParams.niveles_ruido.length > 1) {
      const newLevels = analysisParams.niveles_ruido.filter((_, i) => i !== index);
      setAnalysisParams({
        ...analysisParams,
        niveles_ruido: newLevels
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze(analysisParams);
  };

  const getStabilityColor = (stability) => {
    switch (stability) {
      case 'muy_estable': return '#10b981';
      case 'estable': return '#3b82f6';
      case 'moderadamente_sensible': return '#f59e0b';
      case 'muy_sensible': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className="sensitivity-analysis">
      <div className="panel-header">
        <h3>Análisis de Sensibilidad</h3>
        <p className="panel-subtitle">
          Analiza la estabilidad de las raíces ante perturbaciones numéricas
        </p>
      </div>

      {currentRoot && (
        <div className="current-root-info">
          <h4>Raíz a analizar:</h4>
          <div className="root-display">
            <span className="root-value">
              {currentRoot.real.toFixed(8)} {currentRoot.imag >= 0 ? '+' : ''} {currentRoot.imag.toFixed(8)}i
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="parameters-section">
          <h4>
            <FaChartLine />
            Parámetros del Análisis
          </h4>
          
          <div className="parameter-group">
            <label className="parameter-label">
              Niveles de ruido:
              <small className="parameter-help">
                Magnitud de las perturbaciones a aplicar
              </small>
            </label>
            
            <div className="noise-levels-list">
              {analysisParams.niveles_ruido.map((level, index) => (
                <div key={index} className="noise-level-item">
                  <div className="level-input-group">
                    <input
                      type="number"
                      value={level}
                      onChange={(e) => handleNoiseLevelChange(index, e.target.value)}
                      step="1e-15"
                      min="1e-15"
                      className="level-input"
                    />
                    <span className="level-exponent">
                      10<sup>{Math.log10(level).toFixed(0)}</sup>
                    </span>
                    <button
                      type="button"
                      className="remove-level-btn"
                      onClick={() => handleRemoveNoiseLevel(index)}
                      disabled={analysisParams.niveles_ruido.length === 1}
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="add-level-btn"
                onClick={handleAddNoiseLevel}
              >
                <FaPlus />
                <span>Agregar nivel de ruido</span>
              </button>
            </div>
          </div>

          <div className="parameter-group">
            <label className="parameter-label">
              Muestras por nivel:
              <div className="parameter-input">
                <input
                  type="range"
                  value={analysisParams.muestras_por_nivel}
                  onChange={(e) => setAnalysisParams({
                    ...analysisParams,
                    muestras_por_nivel: parseInt(e.target.value)
                  })}
                  min="1"
                  max="20"
                  className="slider"
                />
                <span className="slider-value">{analysisParams.muestras_por_nivel}</span>
              </div>
              <small className="parameter-help">
                Número de perturbaciones diferentes por nivel
              </small>
            </label>
          </div>

          <div className="analysis-info">
            <div className="info-item">
              <span className="info-label">Total de simulaciones:</span>
              <span className="info-value">
                {analysisParams.niveles_ruido.length * analysisParams.muestras_por_nivel}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Ruido máximo:</span>
              <span className="info-value">
                {Math.max(...analysisParams.niveles_ruido).toExponential(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="analysis-controls">
          <button
            type="submit"
            className="analyze-btn"
            disabled={loading || !currentRoot}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <FaChartLine />
                <span>Ejecutar Análisis de Sensibilidad</span>
              </>
            )}
          </button>
          
          {!currentRoot && (
            <div className="warning-message">
              <FaExclamationTriangle />
              <span>Primero encuentra una raíz ejecutando el método de la secante</span>
            </div>
          )}
        </div>
      </form>

      {results && (
        <div className="results-section">
          <div className="results-header">
            <h4>Resultados del Análisis</h4>
            <div 
              className="stability-badge"
              style={{ backgroundColor: getStabilityColor(results.clasificacion_estabilidad) }}
            >
              {results.clasificacion_estabilidad.replace(/_/g, ' ')}
            </div>
          </div>

          <div className="sensitivity-stats">
            <div className="stat-card">
              <div className="stat-value">{results.sensibilidad_global.toExponential(2)}</div>
              <div className="stat-label">Sensibilidad global</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{results.resultados.length}</div>
              <div className="stat-label">Simulaciones realizadas</div>
            </div>
          </div>

          <div className="sensitivity-table">
            <h5>Sensibilidad por nivel de ruido:</h5>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nivel de ruido</th>
                    <th>Sensibilidad promedio</th>
                    <th>Desviación estándar</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results.estadisticas_por_nivel).map(([nivel, stats]) => (
                    <tr key={nivel}>
                      <td>{parseFloat(nivel).toExponential(2)}</td>
                      <td>{stats.sensibilidad_promedio.toExponential(2)}</td>
                      <td>{stats.sensibilidad_std.toExponential(2)}</td>
                      <td>{stats.min.toExponential(2)}</td>
                      <td>{stats.max.toExponential(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="recommendations">
            <h5>Recomendaciones:</h5>
            {results.clasificacion_estabilidad === 'muy_sensible' && (
              <p className="warning">
                <FaExclamationTriangle />
                <span>La raíz es muy sensible al ruido. Considera aumentar la precisión numérica o usar otro método.</span>
              </p>
            )}
            {results.clasificacion_estabilidad === 'moderadamente_sensible' && (
              <p className="warning">
                <FaExclamationTriangle />
                <span>La raíz es moderadamente sensible. Usa doble precisión para cálculos críticos.</span>
              </p>
            )}
            {results.clasificacion_estabilidad === 'estable' && (
              <p className="success">
                <FaCheckCircle />
                <span>La raíz es estable. Puedes usar precisión estándar.</span>
              </p>
            )}
            {results.clasificacion_estabilidad === 'muy_estable' && (
              <p className="success">
                <FaCheckCircle />
                <span>Excelente estabilidad. La raíz es robusta ante perturbaciones.</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SensitivityAnalysis;