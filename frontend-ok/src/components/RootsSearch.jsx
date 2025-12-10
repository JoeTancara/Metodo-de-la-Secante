import React, { useState } from 'react';
import './RootsSearch.css';

const RootsSearch = ({ onSearch, loading }) => {
  const [searchParams, setSearchParams] = useState({
    region: {
      x_min: -2,
      x_max: 2,
      y_min: -2,
      y_max: 2
    },
    n_puntos: 20,
    distancia_minima: 0.05,
    paralelo: true
  });

  const seguroFloat = (valor, def = 0) => {
    const num = parseFloat(valor);
    return isNaN(num) ? def : num;
  };

  const seguroInt = (valor, def = 0) => {
    const num = parseInt(valor);
    return isNaN(num) ? def : num;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSearchParams(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: seguroFloat(value)
        }
      }));
    } else {
      const processedValue = type === 'checkbox' 
        ? checked 
        : type === 'number' 
          ? seguroFloat(value) 
          : seguroInt(value);
      
      setSearchParams(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validatedParams = {
      region: {
        x_min: seguroFloat(searchParams.region.x_min),
        x_max: seguroFloat(searchParams.region.x_max),
        y_min: seguroFloat(searchParams.region.y_min),
        y_max: seguroFloat(searchParams.region.y_max)
      },
      n_puntos: seguroInt(searchParams.n_puntos),
      distancia_minima: seguroFloat(searchParams.distancia_minima),
      paralelo: Boolean(searchParams.paralelo)
    };
    
    onSearch(validatedParams);
  };

  const handlePresetRegion = (preset) => {
    setSearchParams(prev => ({
      ...prev,
      region: {
        x_min: seguroFloat(preset.x_min),
        x_max: seguroFloat(preset.x_max),
        y_min: seguroFloat(preset.y_min),
        y_max: seguroFloat(preset.y_max)
      }
    }));
  };

  const regionPresets = [
    { label: 'Cuadrado [-2, 2]', value: { x_min: -2, x_max: 2, y_min: -2, y_max: 2 } },
    { label: 'Círculo unidad', value: { x_min: -1.5, x_max: 1.5, y_min: -1.5, y_max: 1.5 } },
    { label: 'Mitad derecha', value: { x_min: 0, x_max: 3, y_min: -1.5, y_max: 1.5 } },
  ];

  const distanciaMinima = seguroFloat(searchParams.distancia_minima);
  const nPuntos = seguroInt(searchParams.n_puntos);
  const totalPuntos = Math.pow(nPuntos, 2);

  return (
    <div className="roots-search">
      <div className="panel-header">
        <h3>Búsqueda de Múltiples Raíces</h3>
        <p className="panel-subtitle">
          Busca todas las raíces en una región del plano complejo
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="search-grid">
          <div className="region-section">
            <h4>Región de Búsqueda</h4>
            <div className="region-presets">
              <span>Presets rápidos:</span>
              {regionPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="region-preset-btn"
                  onClick={() => handlePresetRegion(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            <div className="region-inputs">
              <div className="input-group">
                <label>X mínimo:</label>
                <input
                  type="number"
                  name="region.x_min"
                  value={searchParams.region.x_min}
                  onChange={handleChange}
                  step="0.1"
                  className="form-control"
                />
              </div>
              <div className="input-group">
                <label>X máximo:</label>
                <input
                  type="number"
                  name="region.x_max"
                  value={searchParams.region.x_max}
                  onChange={handleChange}
                  step="0.1"
                  className="form-control"
                />
              </div>
              <div className="input-group">
                <label>Y mínimo:</label>
                <input
                  type="number"
                  name="region.y_min"
                  value={searchParams.region.y_min}
                  onChange={handleChange}
                  step="0.1"
                  className="form-control"
                />
              </div>
              <div className="input-group">
                <label>Y máximo:</label>
                <input
                  type="number"
                  name="region.y_max"
                  value={searchParams.region.y_max}
                  onChange={handleChange}
                  step="0.1"
                  className="form-control"
                />
              </div>
            </div>
          </div>

          <div className="parameters-section">
            <h4>Parámetros de Búsqueda</h4>
            
            <div className="parameter">
              <label className="parameter-label">
                Puntos por dimensión:
                <div className="parameter-input">
                  <input
                    type="range"
                    name="n_puntos"
                    min="5"
                    max="50"
                    step="5"
                    value={nPuntos}
                    onChange={handleChange}
                    className="slider"
                  />
                  <span className="slider-value">{nPuntos}</span>
                </div>
                <small className="parameter-help">
                  Total: {totalPuntos} puntos iniciales
                </small>
              </label>
            </div>

            <div className="parameter">
              <label className="parameter-label">
                Distancia mínima entre raíces:
                <div className="parameter-input">
                  <input
                    type="range"
                    name="distancia_minima"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                    value={distanciaMinima}
                    onChange={handleChange}
                    className="slider"
                  />
                  <span className="slider-value">{distanciaMinima.toFixed(2)}</span>
                </div>
                <small className="parameter-help">
                  Raíces más cercanas se consideran iguales
                </small>
              </label>
            </div>

            <div className="parameter-checkbox">
              <label>
                <input
                  type="checkbox"
                  name="paralelo"
                  checked={searchParams.paralelo}
                  onChange={handleChange}
                />
                Procesamiento paralelo
              </label>
              <small className="parameter-help">
                Usar múltiples hilos para búsqueda más rápida
              </small>
            </div>

            <div className="search-info">
              <div className="info-item">
                <span className="info-label">Tiempo estimado:</span>
                <span className="info-value">
                  ~{(totalPuntos * 0.05).toFixed(1)} segundos
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Puntos a procesar:</span>
                <span className="info-value">
                  {totalPuntos} puntos
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="search-controls">
          <button
            type="submit"
            className="search-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Buscando raíces...
              </>
            ) : (
              'Iniciar Búsqueda de Raíces'
            )}
          </button>
          
          <div className="search-tip">
            <strong>Consejo:</strong> Usa regiones más pequeñas para búsquedas más precisas
          </div>
        </div>
      </form>
    </div>
  );
};

export default RootsSearch;