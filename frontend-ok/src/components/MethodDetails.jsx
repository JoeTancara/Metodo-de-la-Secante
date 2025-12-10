import React from 'react';
import { FaCalculator, FaExclamationTriangle, FaHistory, FaChartLine, FaInfoCircle } from 'react-icons/fa';
import './MethodDetails.css';

const MethodDetails = ({ result }) => {
  if (!result) {
    return (
      <div className="method-details empty">
        <div className="empty-state">
          <FaCalculator size={48} />
          <h4>Información del Método</h4>
          <p>Ejecuta el método para ver detalles de convergencia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="method-details">
      <div className="details-header">
        <h4>
          <FaCalculator />
          Detalles del Método de la Secante
        </h4>
        <div className="method-formula">
          <strong>Fórmula:</strong> zₙ₊₁ = zₙ - f(zₙ) × (zₙ - zₙ₋₁) / (f(zₙ) - f(zₙ₋₁))
        </div>
      </div>

      <div className="details-grid">
        <div className="detail-card">
          <div className="detail-icon">
            <FaHistory />
          </div>
          <div className="detail-content">
            <h5>Iteraciones y Ciclos</h5>
            <div className="detail-item">
              <span>Iteraciones totales:</span>
              <strong className="highlight">{result.iteraciones}</strong>
            </div>
            <div className="detail-item">
              <span>Ciclos detectados:</span>
              <strong className={`highlight ${result.ciclos_detectados > 0 ? 'warning' : ''}`}>
                {result.ciclos_detectados || 0}
              </strong>
            </div>
            <div className="detail-item">
              <span>Puntos evaluados:</span>
              <strong>{result.trayectoria?.length || 0}</strong>
            </div>
            <div className="detail-item">
              <span>Convergencia:</span>
              <span className={`convergence-type ${result.tipo_convergencia?.replace(/_/g, '-')}`}>
                {result.tipo_convergencia?.replace(/_/g, ' ') || 'No determinada'}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-icon">
            <FaExclamationTriangle />
          </div>
          <div className="detail-content">
            <h5>Análisis de Errores</h5>
            <div className="detail-item">
              <span>Error absoluto final:</span>
              <strong className="error-absolute">
                {result.error_final?.toExponential(4) || 'N/A'}
              </strong>
            </div>
            <div className="detail-item">
              <span>Error relativo final:</span>
              <strong className="error-relative">
                {(result.error_relativo_final || result.error_final)?.toExponential(4) || 'N/A'}
              </strong>
            </div>
            <div className="detail-item">
              <span>Reducción de error:</span>
              <strong className="success">
                {result.tasa_reduccion_error > 0 ? 
                  result.tasa_reduccion_error.toFixed(2) + 'x' : 
                  'N/A'}
              </strong>
            </div>
            <div className="detail-item">
              <span>Ratio convergencia:</span>
              <strong>{result.ratio_convergencia?.toFixed(4) || 'N/A'}</strong>
            </div>
          </div>
        </div>

        <div className="detail-card formula-card">
          <div className="detail-icon">
            <FaInfoCircle />
          </div>
          <div className="detail-content">
            <h5>Información del Método</h5>
            <div className="formula-display">
              <div className="formula-main">
                z<sub>n+1</sub> = z<sub>n</sub> - f(z<sub>n</sub>) ×
                <div className="fraction">
                  <span className="numerator">(z<sub>n</sub> - z<sub>n-1</sub>)</span>
                  <span className="denominator">(f(z<sub>n</sub>) - f(z<sub>n-1</sub>))</span>
                </div>
              </div>
            </div>
            <div className="formula-conditions">
              <p><strong>Condición:</strong> f(z<sub>n</sub>) ≠ f(z<sub>n-1</sub>)</p>
              <p><strong>Orden de convergencia:</strong> ~1.618 (áureo)</p>
            </div>
          </div>
        </div>
      </div>

      {(result.errores_relativos?.length > 0 || result.errores_iteracion?.length > 0) && (
        <div className="error-evolution">
          <div className="section-header">
            <h5>
              <FaChartLine />
              Evolución del Error
            </h5>
          </div>
          
          <div className="error-table-container">
            <table className="error-table">
              <thead>
                <tr>
                  <th>Iteración</th>
                  <th>z Real</th>
                  <th>z Imaginaria</th>
                  <th>Error Absoluto</th>
                  <th>Error Relativo</th>
                  <th>Mejora</th>
                </tr>
              </thead>
              <tbody>
                {result.trayectoria?.slice(0, 8).map((punto, idx) => {
                  const errorAbs = result.errores_iteracion?.[idx] || 0;
                  const errorRel = result.errores_relativos?.[idx] || 0;
                  const mejora = idx > 0 && result.errores_iteracion?.[idx - 1] > 0 ?
                    ((result.errores_iteracion[idx - 1] - errorAbs) / result.errores_iteracion[idx - 1] * 100).toFixed(1) :
                    'N/A';
                  
                  return (
                    <tr key={idx} className={idx === result.trayectoria.length - 1 ? 'final-iteration' : ''}>
                      <td className="iteration-number">{idx + 1}</td>
                      <td className="real-value">{punto.real.toFixed(6)}</td>
                      <td className="imag-value">{punto.imag.toFixed(6)}</td>
                      <td className="error-abs">{errorAbs.toExponential(4)}</td>
                      <td className="error-rel">{errorRel > 0 ? errorRel.toExponential(4) : 'N/A'}</td>
                      <td className={`improvement ${mejora !== 'N/A' && parseFloat(mejora) > 0 ? 'positive' : 'negative'}`}>
                        {mejora !== 'N/A' ? `${mejora}%` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
                
                {result.trayectoria?.length > 8 && (
                  <tr className="more-iterations">
                    <td colSpan="6">
                      ... y {result.trayectoria.length - 8} iteraciones más
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="error-summary">
            <div className="summary-item">
              <span className="label">Error inicial:</span>
              <span className="value">
                {result.errores_iteracion?.[0]?.toExponential(4) || 'N/A'}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Error final:</span>
              <span className="value">
                {result.error_final?.toExponential(4) || 'N/A'}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Reducción total:</span>
              <span className="value success">
                {result.tasa_reduccion_error > 0 ? 
                  result.tasa_reduccion_error.toFixed(2) + 'x' : 
                  'N/A'}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Velocidad conv.:</span>
              <span className="value">
                {result.velocidad_convergencia?.toFixed(2) || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="recommendations-section">
        <h5>
          <FaExclamationTriangle />
          Recomendaciones
        </h5>
        <div className="recommendations-list">
          {result.ciclos_detectados > 0 && (
            <div className="recommendation warning">
              <strong>¡Ciclos detectados!</strong> Se encontraron {result.ciclos_detectados} ciclos. 
              Considera cambiar la estrategia anti-ciclos o usar puntos iniciales diferentes.
            </div>
          )}
          
          {result.error_final > 1e-6 && (
            <div className="recommendation">
              <strong>Error alto:</strong> El error final es mayor que 1e-6. 
              Considera aumentar la tolerancia o usar puntos iniciales más cercanos a la raíz.
            </div>
          )}
          
          {result.iteraciones >= result.configuracion?.max_iter && !result.convergio && (
            <div className="recommendation warning">
              <strong>Límite de iteraciones:</strong> Se alcanzó el máximo de iteraciones sin converger.
              Aumenta max_iter o revisa los puntos iniciales.
            </div>
          )}
          
          {result.trayectoria?.length > 50 && (
            <div className="recommendation">
              <strong>Trayectoria larga:</strong> Se necesitaron {result.trayectoria.length} puntos.
              Los puntos iniciales pueden estar lejos de la raíz.
            </div>
          )}
          
          {result.convergio && result.error_final < 1e-12 && (
            <div className="recommendation success">
              <strong>Excelente convergencia!</strong> Error final muy bajo. 
              El método funcionó eficientemente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MethodDetails;MethodDetails.css