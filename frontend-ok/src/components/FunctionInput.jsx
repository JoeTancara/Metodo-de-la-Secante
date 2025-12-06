import React, { useState } from 'react';
import { STRATEGIES } from '../constants';
import './FunctionInput.css';

const FunctionInput = ({ onConfigure, loading, currentConfig }) => {
  const [formData, setFormData] = useState({
    expresion_funcion: currentConfig?.expresion_funcion || 'z**3 - 1',
    tol: currentConfig?.tol || 1e-12,
    max_iter: currentConfig?.max_iter || 100,
    estrategia_ciclos: currentConfig?.estrategia_ciclos || 'perturbacion_hibrida',
    usar_derivada_numerica: currentConfig?.usar_derivada_numerica || false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfigure(formData);
  };

  const handleExample = (example) => {
    setFormData(prev => ({
      ...prev,
      expresion_funcion: example
    }));
  };

  const examples = [
    { label: 'Raíces cúbicas', expr: 'z**3 - 1' },
    { label: 'Seno complejo', expr: 'cmath.sin(z) - z/2' },
    { label: 'Exponencial', expr: 'cmath.exp(z) - 1' },
    { label: 'Polinomio grado 4', expr: 'z**4 - 5*z**2 + 4' },
    { label: 'Coseno complejo', expr: 'cmath.cos(z) - z' }
  ];

  return (
    <div className="function-input-card">
      <div className="card-header">
        <h3>Configurar Función y Parámetros</h3>
        <p className="card-subtitle">Define la función compleja y ajusta los parámetros del método</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <label className="form-label">
            Función f(z) (usa 'z' como variable compleja):
            <div className="input-with-examples">
              <input
                type="text"
                name="expresion_funcion"
                value={formData.expresion_funcion}
                onChange={handleChange}
                className="form-control function-input"
                placeholder="Ej: z**3 - 1"
                required
              />
              <div className="examples-tooltip">
                <span className="tooltip-icon">ℹ️</span>
                <div className="tooltip-content">
                  <strong>Operadores disponibles:</strong><br/>
                  + - * / ** ^<br/>
                  <strong>Funciones:</strong><br/>
                  cmath.sin, cmath.cos, cmath.exp, cmath.log, cmath.sqrt
                </div>
              </div>
            </div>
          </label>
          
          <div className="examples-grid">
            {examples.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                className="example-btn"
                onClick={() => handleExample(ex.expr)}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Tolerancia (ε):
              <input
                type="number"
                name="tol"
                value={formData.tol}
                onChange={handleChange}
                step="1e-12"
                min="1e-15"
                className="form-control"
                required
              />
              <small className="form-help">1e-{Math.log10(formData.tol).toFixed(0)}</small>
            </label>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Máximo de iteraciones:
              <input
                type="number"
                name="max_iter"
                value={formData.max_iter}
                onChange={handleChange}
                min="10"
                max="1000"
                className="form-control"
                required
              />
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Estrategia anti-ciclos:
            <select
              name="estrategia_ciclos"
              value={formData.estrategia_ciclos}
              onChange={handleChange}
              className="form-control"
            >
              {STRATEGIES.map(strategy => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-check">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="usar_derivada_numerica"
              checked={formData.usar_derivada_numerica}
              onChange={handleChange}
              className="form-check-input"
            />
            <span className="checkbox-custom"></span>
            Usar derivada numérica como respaldo
          </label>
          <small className="form-help">
            Activar para casos con denominador cercano a cero
          </small>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Configurando...
            </>
          ) : (
            'Configurar Solver'
          )}
        </button>
      </form>
    </div>
  );
};

export default FunctionInput;