import React from 'react';
import { FaInfoCircle, FaPlay, FaGraduationCap } from 'react-icons/fa';
import './ExamplesPanel.css';

const ExamplesPanel = ({ examples, onLoadExample }) => {
  const defaultExamples = [
    {
      nombre: 'EJEMPLO BÁSICO: Método de la Secante',
      expresion: 'z**2 - 4',
      descripcion: 'Ejemplo didáctico: Buscando raíz de f(z)=z²-4. Raíz real en z=2',
      dificultad: 'baja',
      explicacion: `FÓRMULA: zₙ₊₁ = zₙ - f(zₙ) * (zₙ - zₙ₋₁) / (f(zₙ) - f(zₙ₋₁))

Pasos:
1. z₀ = 1, z₁ = 3
2. f(z₀) = 1² - 4 = -3
3. f(z₁) = 3² - 4 = 5
4. z₂ = 3 - 5*(3-1)/(5-(-3)) = 3 - 5*2/8 = 2
5. Error = |f(2)| = 0`,
      puntos_iniciales: [
        { x0: [1.0, 0.0], x1: [3.0, 0.0] }
      ]
    },
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
        <h3>
          <FaGraduationCap />
          Ejemplos Predefinidos
        </h3>
        <p className="panel-subtitle">
          Selecciona un ejemplo para cargarlo en el solver. Recomendado: <strong>Ejemplo Básico</strong> para aprender el método.
        </p>
      </div>

      <div className="examples-grid">
        {examplesToShow.map((example, index) => (
          <div key={index} className={`example-card ${index === 0 ? 'featured-example' : ''}`}>
            <div className="example-header">
              <div className="example-title-section">
                <h4 className="example-title">{example.nombre}</h4>
                <span className={`difficulty-badge difficulty-${example.dificultad}`}>
                  {example.dificultad}
                </span>
              </div>
              {index === 0 && (
                <div className="featured-badge">
                  <FaInfoCircle />
                  <span>Recomendado para aprender</span>
                </div>
              )}
            </div>
            
            <div className="example-body">
              <div className="example-expression">
                <span className="expression-label">f(z) =</span>
                <code className="expression-code">{example.expresion}</code>
              </div>
              
              <p className="example-description">{example.descripcion}</p>
              
              {example.explicacion && (
                <div className="example-explanation">
                  <h5>
                    <FaInfoCircle />
                    Explicación Paso a Paso
                  </h5>
                  <pre className="explanation-text">{example.explicacion}</pre>
                </div>
              )}
              
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
                <FaPlay />
                <span>Cargar este ejemplo</span>
              </button>
              <div className="example-tip">
                {index === 0 ? 
                  "Ideal para entender cómo funciona el método de la secante" :
                  "Perfecto para probar diferentes comportamientos del método"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="examples-tips">
        <h4>
          <FaInfoCircle />
          Consejos para usar los ejemplos
        </h4>
        <div className="tips-grid">
          <div className="tip-card">
            <h5>Para principiantes</h5>
            <p>Comienza con el <strong>Ejemplo Básico</strong> para entender el método paso a paso.</p>
          </div>
          <div className="tip-card">
            <h5>Para explorar raíces complejas</h5>
            <p>Usa <strong>Raíces Cúbicas de la Unidad</strong> para ver convergencia a raíces complejas.</p>
          </div>
          <div className="tip-card">
            <h5>Para funciones no lineales</h5>
            <p>Prueba <strong>Función Seno Compleja</strong> para ver comportamiento oscilatorio.</p>
          </div>
          <div className="tip-card">
            <h5>Para múltiples raíces</h5>
            <p>Usa <strong>Polinomio de Grado 4</strong> para encontrar diferentes raíces desde distintos puntos iniciales.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplesPanel;