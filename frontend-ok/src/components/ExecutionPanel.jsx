import React, { useState } from 'react';
import { FaPlay, FaPlus, FaMinus } from 'react-icons/fa';
import './ExecutionPanel.css';

const ExecutionPanel = ({ onExecute, loading, currentFunction }) => {
  const [initialPoints, setInitialPoints] = useState({
    x0_real: 0.5,
    x0_imag: 0.5,
    x1_real: 1.0,
    x1_imag: 0.0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInitialPoints(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleIncrement = (field, increment = 0.1) => {
    setInitialPoints(prev => ({
      ...prev,
      [field]: parseFloat((prev[field] + increment).toFixed(6))
    }));
  };

  const handleDecrement = (field, decrement = 0.1) => {
    setInitialPoints(prev => ({
      ...prev,
      [field]: parseFloat((prev[field] - decrement).toFixed(6))
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onExecute(initialPoints);
  };

  const handlePreset = (preset) => {
    setInitialPoints(preset);
  };

  const presets = [
    { label: 'Raíz real positiva', x0_real: 0.5, x0_imag: 0, x1_real: 1.5, x1_imag: 0 },
    { label: 'Raíz compleja superior', x0_real: -0.5, x0_imag: 0.5, x1_real: -1.0, x1_imag: 1.0 },
    { label: 'Raíz compleja inferior', x0_real: -0.5, x0_imag: -0.5, x1_real: -1.0, x1_imag: -1.0 },
    { label: 'Cerca del origen', x0_real: 0.1, x0_imag: 0.1, x1_real: 0.2, x1_imag: 0.2 },
  ];

  return (
    <div className="execution-panel">
      <div className="panel-header">
        <h3>Ejecutar Método de la Secante</h3>
        <p className="panel-subtitle">
          Define los puntos iniciales para la iteración
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="current-function">
          <span className="function-label">Función actual:</span>
          <code className="function-code">{currentFunction}</code>
        </div>

        <div className="points-container">
          <div className="point-card">
            <div className="point-header">
              <h4 className="point-title">Punto inicial x₀</h4>
              <div className="point-badge">z₀</div>
            </div>
            <div className="point-inputs">
              <div className="input-group">
                <label>Parte Real:</label>
                <div className="number-input-container">
                  <button 
                    type="button" 
                    className="number-btn decrease"
                    onClick={() => handleDecrement('x0_real')}
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    name="x0_real"
                    value={initialPoints.x0_real}
                    onChange={handleChange}
                    step="0.1"
                    className="form-control number-input"
                    required
                  />
                  <button 
                    type="button" 
                    className="number-btn increase"
                    onClick={() => handleIncrement('x0_real')}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label>Parte Imaginaria:</label>
                <div className="number-input-container">
                  <button 
                    type="button" 
                    className="number-btn decrease"
                    onClick={() => handleDecrement('x0_imag')}
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    name="x0_imag"
                    value={initialPoints.x0_imag}
                    onChange={handleChange}
                    step="0.1"
                    className="form-control number-input"
                    required
                  />
                  <button 
                    type="button" 
                    className="number-btn increase"
                    onClick={() => handleIncrement('x0_imag')}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            </div>
            <div className="complex-representation">
              z₀ = {initialPoints.x0_real} {initialPoints.x0_imag >= 0 ? '+' : ''} {initialPoints.x0_imag}i
            </div>
          </div>

          <div className="point-card">
            <div className="point-header">
              <h4 className="point-title">Punto inicial x₁</h4>
              <div className="point-badge">z₁</div>
            </div>
            <div className="point-inputs">
              <div className="input-group">
                <label>Parte Real:</label>
                <div className="number-input-container">
                  <button 
                    type="button" 
                    className="number-btn decrease"
                    onClick={() => handleDecrement('x1_real')}
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    name="x1_real"
                    value={initialPoints.x1_real}
                    onChange={handleChange}
                    step="0.1"
                    className="form-control number-input"
                    required
                  />
                  <button 
                    type="button" 
                    className="number-btn increase"
                    onClick={() => handleIncrement('x1_real')}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label>Parte Imaginaria:</label>
                <div className="number-input-container">
                  <button 
                    type="button" 
                    className="number-btn decrease"
                    onClick={() => handleDecrement('x1_imag')}
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    name="x1_imag"
                    value={initialPoints.x1_imag}
                    onChange={handleChange}
                    step="0.1"
                    className="form-control number-input"
                    required
                  />
                  <button 
                    type="button" 
                    className="number-btn increase"
                    onClick={() => handleIncrement('x1_imag')}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            </div>
            <div className="complex-representation">
              z₁ = {initialPoints.x1_real} {initialPoints.x1_imag >= 0 ? '+' : ''} {initialPoints.x1_imag}i
            </div>
          </div>
        </div>

        <div className="presets-section">
          <h5>Presets rápidos:</h5>
          <div className="presets-grid">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-btn"
                onClick={() => handlePreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="execution-controls">
          <button
            type="submit"
            className="execute-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Ejecutando...
              </>
            ) : (
              <>
                <FaPlay />
                <span>Ejecutar Método de la Secante</span>
              </>
            )}
          </button>
          
          <div className="execution-info">
            <p>
              <strong>Método:</strong> xₙ₊₁ = xₙ - f(xₙ) * (xₙ - xₙ₋₁) / (f(xₙ) - f(xₙ₋₁))
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ExecutionPanel;