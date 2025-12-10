import React from 'react';
import { FaCalculator, FaExclamationTriangle, FaHistory, FaChartLine } from 'react-icons/fa';
import './MethodDetails.css';

const MethodDetails = ({ result }) => {
  if (!result) {
    return (
      <div className="method-details empty">
        <div className="empty-state">
          <h4>Información del Método</h4>
          <p>Ejecuta el método para ver detalles de convergencia</p>
        </div>
      </div>
    );
  }

  const seguroFloat = (valor, def = 0) => {
    const num = parseFloat(valor);
    return isNaN(num) ? def : num;
  };

  const errorFinal = seguroFloat(result.error_final, 1e-15);
  const errorRelFinal = seguroFloat(result.error_relativo_final, 1e-15);
  const ciclosDetectados = seguroFloat(result.ciclos_detectados, 0);
  const tasaReduccion = seguroFloat(result.tasa_reduccion_error, 1.0);
  const velocidadConv = seguroFloat(result.velocidad_convergencia, 0.0);

  return (
    <div className="method-details">
      <div className="details-header">
        <h4>
          Detalles del Método de la Secante
        </h4>
        <div className="method-formula">
          <strong>Fórmula:</strong> zₙ₊₁ = zₙ - f(zₙ) × (zₙ - zₙ₋₁) / (f(zₙ) - f(zₙ₋₁))
        </div>
      </div>

      <div className="details-grid">
        <div className="detail-card">
          <div className="detail-content">
            <h5>Iteraciones y Ciclos</h5>
            <div className="detail-item">
              <span>Iteraciones totales:</span>
              <strong>{result.iteraciones || 0}</strong>
            </div>
            <div className="detail-item">
              <span>Ciclos detectados:</span>
              <strong className={ciclosDetectados > 0 ? 'warning' : ''}>
                {ciclosDetectados}
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
          <div className="detail-content">
            <h5>Análisis de Errores</h5>
            <div className="detail-item">
              <span>Error absoluto final:</span>
              <strong className="error-absolute">
                {errorFinal > 0 ? errorFinal.toExponential(4) : '1.0000e-15'}
              </strong>
            </div>
            <div className="detail-item">
              <span>Error relativo final:</span>
              <strong className="error-relative">
                {errorRelFinal > 0 ? errorRelFinal.toExponential(4) : '1.0000e-15'}
              </strong>
            </div>
            <div className="detail-item">
              <span>Reducción de error:</span>
              <strong className="success">
                {tasaReduccion > 1.0 ? tasaReduccion.toFixed(2) + 'x' : 'N/A'}
              </strong>
            </div>
            <div className="detail-item">
              <span>Ratio convergencia:</span>
              <strong>{seguroFloat(result.ratio_convergencia, 1.0).toFixed(4)}</strong>
            </div>
          </div>
        </div>

        <div className="detail-card formula-card">
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
              <p><strong>Orden de convergencia:</strong> ~{seguroFloat(result.orden_aproximado, 1.0).toFixed(3)}</p>
            </div>
          </div>
        </div>
      </div>

      {(result.errores_relativos?.length > 0 || result.errores_iteracion?.length > 0) && (
        <div className="error-evolution">
          <div className="section-header">
            <h5>Evolución del Error</h5>
          </div>
          
          <div className="error-table-container">
            <table className="error-table">
              <thead>
                <tr>
                  <th>Iteración</th>
                  <th>Error Absoluto</th>
                  <th>Error Relativo</th>
                  <th>Mejora %</th>
                </tr>
              </thead>
              <tbody>
                {result.trayectoria?.slice(0, 8).map((punto, idx) => {
                  const errorAbs = seguroFloat(result.errores_iteracion?.[idx], 1.0);
                  const errorRel = seguroFloat(result.errores_relativos?.[idx], 1e-15);
                  let mejora = 'N/A';
                  
                  if (idx > 0) {
                    const errorAnterior = seguroFloat(result.errores_iteracion?.[idx - 1], 1.0);
                    if (errorAnterior > 0) {
                      const mejoraVal = ((errorAnterior - errorAbs) / errorAnterior * 100);
                      mejora = `${mejoraVal.toFixed(1)}%`;
                    }
                  }
                  
                  return (
                    <tr key={idx} className={idx === result.trayectoria.length - 1 ? 'final-iteration' : ''}>
                      <td className="iteration-number">{idx + 1}</td>
                      <td className="error-abs">{errorAbs.toExponential(4)}</td>
                      <td className="error-rel">{errorRel > 0 ? errorRel.toExponential(4) : 'N/A'}</td>
                      <td className="improvement">
                        {mejora}
                      </td>
                    </tr>
                  );
                })}
                
                {result.trayectoria?.length > 8 && (
                  <tr className="more-iterations">
                    <td colSpan="4">
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
                {seguroFloat(result.errores_iteracion?.[0], 1.0).toExponential(4)}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Error final:</span>
              <span className="value">
                {errorFinal.toExponential(4)}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Reducción total:</span>
              <span className="value success">
                {tasaReduccion > 1.0 ? tasaReduccion.toFixed(2) + 'x' : 'N/A'}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Velocidad conv.:</span>
              <span className="value">
                {velocidadConv > 0 ? velocidadConv.toFixed(2) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="recommendations-section">
        <h5>Recomendaciones</h5>
        <div className="recommendations-list">
          {ciclosDetectados > 0 && (
            <div className="recommendation warning">
              <strong>Ciclos detectados!</strong> Se encontraron {ciclosDetectados} ciclos. 
              Considera cambiar la estrategia anti-ciclos.
            </div>
          )}
          
          {errorFinal > 1e-6 && (
            <div className="recommendation">
              <strong>Error alto:</strong> El error final es mayor que 1e-6. 
              Considera aumentar la tolerancia.
            </div>
          )}
          
          {result.iteraciones >= result.configuracion?.max_iter && !result.convergio && (
            <div className="recommendation warning">
              <strong>Límite de iteraciones:</strong> Se alcanzó el máximo de iteraciones sin converger.
            </div>
          )}
          
          {result.convergio && errorFinal < 1e-12 && (
            <div className="recommendation success">
              <strong>Excelente convergencia!</strong> Error final muy bajo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MethodDetails;