import React from 'react';
import './ExamplesPanel.css';

const ExamplesPanel = ({ examples, onLoadExample }) => {
  const defaultExamples = [
    {
      nombre: 'Raíces Cúbicas de la Unidad',
      expresion: 'z**3 - 1',
      descripcion: 'Polinomio cúbico con raíces en 1, -0.5±0.866i',
      dificultad: 'baja',
      puntos_iniciales: [
        { x0: [0.5, 0.5], x1: [1.0, 0.0] },
        { x0: [-0.5, 0.5], x1: [-1.0, 0.0] }
      ]
    },
    {
      nombre: 'Función Seno Compleja',
      expresion: 'cmath.sin(z) - z/2',
      descripcion: 'Seno complejo con término lineal',
      dificultad: 'media',
      puntos_iniciales: [
        { x0: [1.0, 1.0], x1: [2.0, 0.5] },
        { x0: [-1.0, -1.0], x1: [-2.0, -0.5] }
      ]
    },
    {
      nombre: 'Exponencial Compleja',
      expresion: 'cmath.exp(z) - 1',
      descripcion: 'Exponencial compleja con raíz en 0',
      dificultad: 'baja',
      puntos_iniciales: [
        { x0: [0.5, 0.5], x1: [1.0, 0.0] },
        { x0: [-0.5, -0.5], x1: [-1.0, 0.0] }
      ]
    },
    {
      nombre: 'Polinomio de Grado 4',
      expresion: 'z**4 - 5*z**2 + 4',
      descripcion: 'Polinomio cuártico con 4 raíces reales',
      dificultad: 'media',
      puntos_iniciales: [
        { x0: [0.5, 0.5], x1: [1.5, 0.0] },
        { x0: [-0.5, 0.5], x1: [-1.5, 0.0] }
      ]
    }
  ];

  const examplesToShow = examples && examples.length > 0 ? examples : defaultExamples;

  return (
    <div className="examples-panel">
      <div className="panel-header">
        <h3>Ejemplos Predefinidos</h3>
        <p className="panel-subtitle">
          Selecciona un ejemplo para cargarlo en el solver
        </p>
      </div>

      <div className="examples-grid">
        {examplesToShow.map((example, index) => (
          <div key={index} className="example-card">
            <div className="example-header">
              <h4 className="example-title">{example.nombre}</h4>
              <span className={`difficulty-badge difficulty-${example.dificultad}`}>
                {example.dificultad}
              </span>
            </div>
            
            <div className="example-body">
              <div className="example-expression">
                <span className="expression-label">f(z) =</span>
                <code className="expression-code">{example.expresion}</code>
              </div>
              
              <p className="example-description">{example.descripcion}</p>
              
              <div className="example-puntos">
                <h5>Puntos iniciales sugeridos:</h5>
                <div className="puntos-grid">
                  {example.puntos_iniciales && example.puntos_iniciales.map((punto, idx) => (
                    <div key={idx} className="punto-card">
                      <div className="punto">
                        <span className="punto-label">x₀:</span>
                        <span className="punto-value">
                          {punto.x0[0]} {punto.x0[1] >= 0 ? '+' : ''} {punto.x0[1]}i
                        </span>
                      </div>
                      <div className="punto">
                        <span className="punto-label">x₁:</span>
                        <span className="punto-value">
                          {punto.x1[0]} {punto.x1[1] >= 0 ? '+' : ''} {punto.x1[1]}i
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="example-footer">
              <button
                className="load-example-btn"
                onClick={() => onLoadExample(example)}
              >
                Cargar este ejemplo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamplesPanel;