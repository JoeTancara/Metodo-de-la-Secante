import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScatterController
} from 'chart.js';
import { Line, Scatter } from 'react-chartjs-2';
import './Visualization.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale, 
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScatterController
);

const Visualization = ({ trajectory, errors, root }) => {
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  
  useEffect(() => {
    return () => {
      if (chartRef1.current) {
        chartRef1.current.destroy();
        chartRef1.current = null;
      }
      if (chartRef2.current) {
        chartRef2.current.destroy();
        chartRef2.current = null;
      }
    };
  }, []);

  if (!trajectory || trajectory.length === 0) {
    return (
      <div className="visualization-container empty">
        <div className="placeholder">
          <div className="placeholder-icon">📈</div>
          <h4>Visualización de Resultados</h4>
          <p>Ejecuta el método para ver las gráficas</p>
        </div>
      </div>
    );
  }

  const trajectoryData = {
    datasets: [
      {
        label: 'Trayectoria',
        data: trajectory.map(p => ({ x: p.real, y: p.imag })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointBackgroundColor: trajectory.map((_, i) => 
          `hsl(${(i * 360) / trajectory.length}, 70%, 60%)`
        ),
        pointRadius: 4,
        pointHoverRadius: 6,
        showLine: true,
      },
      {
        label: 'Punto inicial',
        data: [trajectory[0]],
        backgroundColor: 'rgb(34, 197, 94)',
        borderColor: 'rgb(34, 197, 94)',
        pointRadius: 8,
        pointStyle: 'star',
      },
      {
        label: 'Punto final',
        data: [trajectory[trajectory.length - 1]],
        backgroundColor: 'rgb(239, 68, 68)',
        borderColor: 'rgb(239, 68, 68)',
        pointRadius: 8,
        pointStyle: 'cross',
      },
      {
        label: 'Raíz encontrada',
        data: root ? [{ x: root.real, y: root.imag }] : [],
        backgroundColor: 'rgb(245, 158, 11)',
        borderColor: 'rgb(245, 158, 11)',
        pointRadius: 10,
        pointStyle: 'circle',
      }
    ]
  };

  const errorData = {
    labels: errors.map((_, i) => `Iter ${i + 1}`),
    datasets: [
      {
        label: 'Error |f(z)|',
        data: errors,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
      }
    ]
  };

  const trajectoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Trayectoria en el Plano Complejo',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw;
            return `z = ${point.x.toFixed(4)} + ${point.y.toFixed(4)}i`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Parte Real'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Parte Imaginaria'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    elements: {
      line: {
        tension: 0.3
      }
    }
  };

  const errorOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: 'logarithmic',
        title: {
          display: true,
          text: 'Error (escala logarítmica)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        min: Math.pow(10, Math.floor(Math.log10(Math.min(...errors.filter(e => e > 0)))) - 1),
        max: Math.pow(10, Math.ceil(Math.log10(Math.max(...errors))) + 1)
      },
      x: {
        title: {
          display: true,
          text: 'Iteración'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Convergencia del Error',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  return (
    <div className="visualization-container">
      <div className="visualization-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h4>Trayectoria de Convergencia</h4>
            <div className="chart-info">
              <span className="info-item">
                <span className="dot start"></span> Punto inicial
              </span>
              <span className="info-item">
                <span className="dot end"></span> Punto final
              </span>
              <span className="info-item">
                <span className="dot root"></span> Raíz encontrada
              </span>
            </div>
          </div>
          <div className="chart-wrapper">
            <Scatter 
              data={trajectoryData} 
              options={trajectoryOptions}
              ref={(element) => {
                if (element) {
                  chartRef1.current = element;
                }
              }}
            />
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h4>Evolución del Error</h4>
            <div className="chart-info">
              <span className="info-item">
                Error inicial: {errors[0]?.toExponential(2) || 'N/A'}
              </span>
              <span className="info-item">
                Error final: {errors[errors.length - 1]?.toExponential(2) || 'N/A'}
              </span>
            </div>
          </div>
          <div className="chart-wrapper">
            <Line 
              data={errorData} 
              options={errorOptions}
              ref={(element) => {
                if (element) {
                  chartRef2.current = element;
                }
              }}
            />
          </div>
        </div>
      </div>

      {trajectory.length > 0 && (
        <div className="trajectory-table">
          <h4>Puntos de la Trayectoria</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Iteración</th>
                  <th>Parte Real</th>
                  <th>Parte Imaginaria</th>
                  <th>Error</th>
                  <th>|z|</th>
                </tr>
              </thead>
              <tbody>
                {trajectory.slice(0, 10).map((point, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{point.real.toFixed(6)}</td>
                    <td>{point.imag.toFixed(6)}</td>
                    <td>{(errors[i] || 0).toExponential(4)}</td>
                    <td>{Math.sqrt(point.real**2 + point.imag**2).toFixed(6)}</td>
                  </tr>
                ))}
                {trajectory.length > 10 && (
                  <tr>
                    <td colSpan="5" className="more-points">
                      ... y {trajectory.length - 10} puntos más
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualization;