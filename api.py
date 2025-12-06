from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import matplotlib.pyplot as plt
import cmath
import io
import base64
import warnings
import time
from typing import Dict, List, Tuple, Optional, Callable, Any
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr
from sympy import symbols
import logging
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, asdict
import uuid
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

warnings.filterwarnings('ignore')

# DE FLOAT A NUMERO
def convertir_a_numero(valor):
    if isinstance(valor, (int, float)):
        return valor
    elif isinstance(valor, str):
        try:
            if '.' in valor or 'e' in valor.lower() or 'E' in valor.lower():
                return float(valor)
            else:
                return int(valor)
        except ValueError:
            return valor
    else:
        return valor

def convertir_datos_numericos(data):
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            result[key] = convertir_datos_numericos(value)
        return result
    elif isinstance(data, list):
        return [convertir_datos_numericos(item) for item in data]
    else:
        return convertir_a_numero(data)
#CONVERTIMOS NUMERO COMPLETO A JSON
def serializar_complex(z):

    if isinstance(z, complex):
        return {'real': float(z.real), 'imag': float(z.imag)}
    elif hasattr(z, '__dict__'):
        return {k: serializar_complex(v) for k, v in z.__dict__.items()}
    elif isinstance(z, dict):
        return {k: serializar_complex(v) for k, v in z.items()}
    elif isinstance(z, list):
        return [serializar_complex(item) for item in z]
    elif isinstance(z, (int, float, str, bool, type(None))):
        return z
    else:
        return str(z)

def resultado_a_json(resultado):
    if isinstance(resultado, dict):
        return {k: resultado_a_json(v) for k, v in resultado.items()}
    elif isinstance(resultado, list):
        return [resultado_a_json(item) for item in resultado]
    elif isinstance(resultado, (int, float, str, bool, type(None))):
        return resultado
    elif hasattr(resultado, '__dict__'):
        return resultado_a_json(asdict(resultado))
    else:
        try:
            return float(resultado)
        except (ValueError, TypeError):
            return str(resultado)


# MODELOS DE DATOS PARA LA API
@dataclass
class PuntoComplejo:
    real: float
    imag: float
    
    def to_complex(self) -> complex:
        return complex(self.real, self.imag)
    
    @staticmethod
    def from_complex(z: complex) -> 'PuntoComplejo':
        return PuntoComplejo(z.real, z.imag)
    
    def to_dict(self):
        return {'real': float(self.real), 'imag': float(self.imag)}

@dataclass
class ResultadoSecante:
    id_ejecucion: str
    raiz: PuntoComplejo
    iteraciones: int
    convergio: bool
    trayectoria: List[PuntoComplejo]
    error_final: float
    tiempo_ejecucion: float
    configuracion: Dict[str, Any]
    errores_iteracion: List[float]
    tipo_convergencia: str
    ratio_convergencia: float
    
    def to_dict(self):
        return {
            'id_ejecucion': self.id_ejecucion,
            'raiz': self.raiz.to_dict(),
            'iteraciones': int(self.iteraciones),
            'convergio': bool(self.convergio),
            'trayectoria': [p.to_dict() for p in self.trayectoria],
            'error_final': float(self.error_final),
            'tiempo_ejecucion': float(self.tiempo_ejecucion),
            'configuracion': self.configuracion,
            'errores_iteracion': [float(e) for e in self.errores_iteracion],
            'tipo_convergencia': str(self.tipo_convergencia),
            'ratio_convergencia': float(self.ratio_convergencia)
        }

@dataclass
class ResultadoSensibilidad:
    nivel_ruido: float
    sensibilidad: float
    valor_original: float
    valor_perturbado: float
    raiz_perturbada: PuntoComplejo
    
    def to_dict(self):
        return {
            'nivel_ruido': float(self.nivel_ruido),
            'sensibilidad': float(self.sensibilidad),
            'valor_original': float(self.valor_original),
            'valor_perturbado': float(self.valor_perturbado),
            'raiz_perturbada': self.raiz_perturbada.to_dict()
        }

@dataclass
class Estudiante:
    id: int
    nombre: str
    codigo: str
    carrera: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None


class SecanteComplejoAvanzado:
    def __init__(self, 
                 expresion_funcion: str,
                 tol: float = 1e-12,
                 max_iter: int = 200,
                 estrategia_ciclos: str = 'perturbacion_hibrida',
                 usar_derivada_numerica: bool = False):
        self.expresion_funcion = expresion_funcion
        self.tol = float(tol)
        self.max_iter = int(max_iter)
        self.estrategia_ciclos = estrategia_ciclos
        self.usar_derivada_numerica = bool(usar_derivada_numerica)
        
        # Parsear y compilar la función
        self.funcion = self._parsear_funcion(expresion_funcion)
        
        # Historial y estadísticas
        self.historial_ejecuciones = []
        self.raices_encontradas = []
        self.estadisticas = {
            'ejecuciones_totales': 0,
            'convergencias_exitosas': 0,
            'tiempo_promedio': 0.0
        }
        self._configurar_estrategias()    
        logger.info(f"Solver inicializado para función: {expresion_funcion}")
    
    def _parsear_funcion(self, expresion: str) -> Callable[[complex], complex]:
        try:
            # Definir variable compleja
            z = symbols('z')
            # Parsear expresión con sympy
            expr_sympy = parse_expr(expresion.replace('^', '**'))
            # Convertir a función lambda
            expr_lamdified = sp.lambdify(z, expr_sympy, modules=['numpy', 'cmath'])
            
            # Wrapper para manejo de errores
            def funcion_segura(z_val: complex) -> complex:
                try:
                    if isinstance(z_val, (int, float)):
                        z_val = complex(z_val)
                    
                    resultado = expr_lamdified(z_val)
                    
                    if isinstance(resultado, (int, float)):
                        return complex(resultado, 0.0)
                    return resultado
                    
                except (ZeroDivisionError, OverflowError, ValueError) as e:
                    logger.warning(f"Error evaluando función en z={z_val}: {e}")
                    if isinstance(z_val, complex):
                        z_perturbado = complex(z_val.real, z_val.imag + 1e-15)
                    else:
                        z_perturbado = complex(z_val, 1e-15)
                    
                    try:
                        return expr_lamdified(z_perturbado)
                    except:
                        return complex(np.nan, np.nan)
            
            return funcion_segura
            
        except Exception as e:
            logger.error(f"Error parseando función {expresion}: {e}")
            raise ValueError(f"No se pudo parsear la función: {expresion}")
    
    def _configurar_estrategias(self):
        self.estrategias = {
            'perturbacion': self._estrategia_perturbacion,
            'reset': self._estrategia_reset,
            'hibrido': self._estrategia_hibrido,
            'perturbacion_hibrida': self._estrategia_perturbacion_hibrida,
            'adaptativa': self._estrategia_adaptativa
        }
        # datos para estrategias adaptativas 
        self.contador_ciclos = 0
        self.umbral_perturbacion = 1e-8
        self.factor_adaptacion = 1.1
    
    def _estrategia_perturbacion(self, x0: complex, x1: complex, fx0: complex, fx1: complex, 
                                iteracion: int) -> Tuple[complex, complex, complex, complex]:
        if iteracion % 10 == 0:
            perturbacion = complex(
                np.random.uniform(-self.umbral_perturbacion, self.umbral_perturbacion),
                np.random.uniform(-self.umbral_perturbacion, self.umbral_perturbacion)
            )
            x1 += perturbacion
            fx1 = self.funcion(x1)
        
        return x0, x1, fx0, fx1
    
    def _estrategia_reset(self, x0: complex, x1: complex, fx0: complex, fx1: complex,
                         iteracion: int) -> Tuple[complex, complex, complex, complex]:
        if iteracion > 20 and iteracion % 15 == 0:
            x0 = complex(np.random.uniform(-2, 2), np.random.uniform(-2, 2))
            x1 = complex(np.random.uniform(-2, 2), np.random.uniform(-2, 2))
            fx0 = self.funcion(x0)
            fx1 = self.funcion(x1)
            logger.info(f"Reset en iteración {iteracion}")
        
        return x0, x1, fx0, fx1
    
    def _estrategia_hibrido(self, x0: complex, x1: complex, fx0: complex, fx1: complex,
                           iteracion: int) -> Tuple[complex, complex, complex, complex]:
        if iteracion % 12 == 0:
            perturbacion = complex(
                np.random.uniform(-self.umbral_perturbacion/10, self.umbral_perturbacion/10),
                np.random.uniform(-self.umbral_perturbacion/10, self.umbral_perturbacion/10)
            )
            x1 += perturbacion
            fx1 = self.funcion(x1)
        
        if iteracion > 30 and iteracion % 25 == 0:
            x0 = (x0 + x1) / 2
            fx0 = self.funcion(x0)
        
        return x0, x1, fx0, fx1
    
    def _estrategia_perturbacion_hibrida(self, x0: complex, x1: complex, fx0: complex, fx1: complex,
                                        iteracion: int) -> Tuple[complex, complex, complex, complex]:
        if self.contador_ciclos > 5:
            self.umbral_perturbacion *= self.factor_adaptacion
            self.contador_ciclos = 0
        
        if iteracion % 8 == 0:
            angulo = np.random.uniform(0, 2*np.pi)
            magnitud = self.umbral_perturbacion * (1 + iteracion/100)
            
            perturbacion = cmath.rect(magnitud, angulo)
            x1 += perturbacion
            fx1 = self.funcion(x1)
        
        return x0, x1, fx0, fx1
    
    def _estrategia_adaptativa(self, x0: complex, x1: complex, fx0: complex, fx1: complex,
                              iteracion: int) -> Tuple[complex, complex, complex, complex]:
        return self._estrategia_perturbacion_hibrida(x0, x1, fx0, fx1, iteracion)
    
    def _detectar_ciclo(self, errores: List[float], ventana: int = 10) -> bool:
        if len(errores) < ventana:
            return False
        
        ultimos = errores[-ventana:]
        
        # 1. Verificar si no hay mejora significativa
        mejora_relativa = abs(ultimos[-1] - ultimos[0]) / (ultimos[0] + 1e-15)
        if mejora_relativa < 0.01:
            self.contador_ciclos += 1
            return True
        
        # 2. Verificar patrones repetitivos
        diferencias = np.diff(ultimos)
        if np.std(diferencias) < 1e-10:
            self.contador_ciclos += 1
            return True
        
        # 3. Verificar oscilaciones
        signos = np.sign(diferencias)
        cambios_signo = np.sum(np.abs(np.diff(signos)))
        if cambios_signo > ventana * 0.8:
            self.contador_ciclos += 1
            return True
        
        self.contador_ciclos = max(0, self.contador_ciclos - 1)
        return False
    
    def _calcular_derivada_numerica(self, f: Callable, z: complex, h: float = 1e-8) -> complex:
        h_real = complex(h, 0)
        h_imag = complex(0, h)
        
        df_dx = (f(z + h_real) - f(z - h_real)) / (2 * h)
        df_dy = (f(z + h_imag) - f(z - h_imag)) / (2 * h)
        
        return (df_dx - 1j * df_dy) / 2
    
    def ejecutar_secante(self, 
                        x0_real,
                        x0_imag,
                        x1_real, 
                        x1_imag,
                        id_ejecucion: Optional[str] = None) -> Dict[str, Any]:
        # VALIDACIÓN Y CONVERSIÓN ROBUSTA DE PARÁMETROS
        try:
            x0_real = float(x0_real)
            x0_imag = float(x0_imag)
            x1_real = float(x1_real)
            x1_imag = float(x1_imag)
        except (ValueError, TypeError) as e:
            logger.error(f"Error convirtiendo parámetros a float: {e}")
            raise ValueError(f"Parámetros inválidos: {x0_real}, {x0_imag}, {x1_real}, {x1_imag}")
        
        if any(math.isnan(val) or math.isinf(val) for val in [x0_real, x0_imag, x1_real, x1_imag]):
            raise ValueError("Los puntos iniciales contienen valores no válidos")
        
        inicio = time.time()
        
        if id_ejecucion is None:
            id_ejecucion = str(uuid.uuid4())[:8]
        
        # Convertir a complejos
        x0 = complex(x0_real, x0_imag)
        x1 = complex(x1_real, x1_imag)
        
        # Evaluar puntos iniciales
        fx0 = self.funcion(x0)
        fx1 = self.funcion(x1)
        
        # Inicializar estructuras de seguimiento
        trayectoria = [PuntoComplejo.from_complex(x0), PuntoComplejo.from_complex(x1)]
        errores = [float(abs(fx0)), float(abs(fx1))]
        convergio = False
        raiz_final = x1
        iteracion_final = 0
        # Estrategia seleccionada
        estrategia_func = self.estrategias.get(self.estrategia_ciclos, 
                                              self._estrategia_perturbacion_hibrida)
        
        # Iteración principal del método de la secante
        for k in range(1, self.max_iter + 1):
            # Aplicar estrategia anti-ciclos
            x0, x1, fx0, fx1 = estrategia_func(x0, x1, fx0, fx1, k)
            
            # Verificar división por cero
            denominador = fx1 - fx0
            if abs(denominador) < 1e-15:
                if self.usar_derivada_numerica:
                    derivada = self._calcular_derivada_numerica(self.funcion, x1)
                    if abs(derivada) > 1e-15:
                        x_next = x1 - fx1 / derivada
                    else:
                        x_next = (x0 + x1) / 2 + complex(
                            np.random.uniform(-0.1, 0.1),
                            np.random.uniform(-0.1, 0.1)
                        )
                else:
                    x_next = (x0 + x1) / 2 + complex(
                        np.random.uniform(-0.01, 0.01),
                        np.random.uniform(-0.01, 0.01)
                    )
            else:
                # Método de la secante estándar
                x_next = x1 - fx1 * (x1 - x0) / denominador
            
            # Evaluar función en nuevo punto
            fx_next = self.funcion(x_next)
            # Guardar información
            trayectoria.append(PuntoComplejo.from_complex(x_next))
            error_actual = float(abs(fx_next))
            errores.append(error_actual)
            # Verificar convergencia
            if error_actual < self.tol:
                convergio = True
                raiz_final = x_next
                iteracion_final = k
                break
            # Detectar ciclos o estancamiento
            if k > 10 and self._detectar_ciclo(errores):
                logger.info(f"Ciclo detectado en iteración {k}, aplicando estrategia")
                x0, x1, fx0, fx1 = self._estrategia_reset(x0, x1, fx0, fx1, k)
                continue
            # Preparar siguiente iteración
            x0, x1 = x1, x_next
            fx0, fx1 = fx1, fx_next
        # Calcular tiempo y preparar resultados
        tiempo_total = time.time() - inicio
        # Análisis de convergencia
        analisis_convergencia = self._analizar_convergencia(errores, trayectoria)
        # Crear resultado
        resultado = ResultadoSecante(
            id_ejecucion=id_ejecucion,
            raiz=PuntoComplejo.from_complex(raiz_final),
            iteraciones=iteracion_final if convergio else self.max_iter,
            convergio=convergio,
            trayectoria=trayectoria,
            error_final=float(errores[-1]),
            tiempo_ejecucion=float(tiempo_total),
            configuracion={
                'expresion_funcion': self.expresion_funcion,
                'tol': float(self.tol),
                'max_iter': int(self.max_iter),
                'estrategia_ciclos': self.estrategia_ciclos,
                'usar_derivada_numerica': self.usar_derivada_numerica
            },
            errores_iteracion=[float(e) for e in errores],
            tipo_convergencia=analisis_convergencia['tipo'],
            ratio_convergencia=float(analisis_convergencia['ratio_promedio'])
        )
        
        self.historial_ejecuciones.append(resultado)
        self.estadisticas['ejecuciones_totales'] += 1
        if convergio:
            self.estadisticas['convergencias_exitosas'] += 1
            self._registrar_raiz_unica(resultado.raiz)
        # Calcular tiempo promedio
        tiempos = [r.tiempo_ejecucion for r in self.historial_ejecuciones]
        self.estadisticas['tiempo_promedio'] = float(np.mean(tiempos) if tiempos else 0.0)
        
        return resultado.to_dict()
    
    def _analizar_convergencia(self, errores: List[float], 
                              trayectoria: List[PuntoComplejo]) -> Dict[str, Any]:
        """Analiza el tipo y velocidad de convergencia."""
        if len(errores) < 4:
            return {'tipo': 'insuficientes_datos', 'ratio_promedio': 0.0}
        
        ratios = []
        for i in range(2, len(errores) - 1):
            if errores[i-1] > 0 and errores[i] > 0:
                try:
                    ratio = abs(np.log(errores[i]) / np.log(errores[i-1]))
                    ratios.append(float(ratio))
                except:
                    continue
        
        if not ratios:
            return {'tipo': 'no_determinado', 'ratio_promedio': 0.0}
        
        ratio_promedio = float(np.mean(ratios))
        
        if ratio_promedio < 1.1:
            tipo = 'lineal'
        elif 1.1 <= ratio_promedio < 1.62:
            tipo = 'superlineal'
        elif 1.62 <= ratio_promedio < 1.8:
            tipo = 'cuadrática_aproximada'
        else:
            tipo = 'lenta_o_divergente'
        
        if len(trayectoria) > 10:
            cambios_direccion = self._analizar_oscilaciones(trayectoria)
            if cambios_direccion > len(trayectoria) * 0.3:
                tipo = f"{tipo}_con_oscilaciones"
        
        return {
            'tipo': tipo,
            'ratio_promedio': ratio_promedio,
            'ratios_individuales': ratios,
            'error_inicial': float(errores[0]),
            'error_final': float(errores[-1])
        }
    
    def _analizar_oscilaciones(self, trayectoria: List[PuntoComplejo]) -> int:
        """Analiza oscilaciones en la trayectoria."""
        if len(trayectoria) < 3:
            return 0
        
        cambios = 0
        for i in range(1, len(trayectoria) - 1):
            vec_ant = complex(
                trayectoria[i].real - trayectoria[i-1].real,
                trayectoria[i].imag - trayectoria[i-1].imag
            )
            vec_sig = complex(
                trayectoria[i+1].real - trayectoria[i].real,
                trayectoria[i+1].imag - trayectoria[i].imag
            )
            
            if abs(vec_ant) > 1e-10 and abs(vec_sig) > 1e-10:
                cos_angulo = (vec_ant.real * vec_sig.real + vec_ant.imag * vec_sig.imag) / \
                            (abs(vec_ant) * abs(vec_sig))
                
                if cos_angulo < -0.5:
                    cambios += 1
        
        return cambios
    
    def _registrar_raiz_unica(self, raiz: PuntoComplejo, 
                            distancia_minima: float = 0.01) -> bool:
        """Registra una raíz única, evitando duplicados."""
        for raiz_existente in self.raices_encontradas:
            distancia = abs(complex(raiz.real, raiz.imag) - 
                          complex(raiz_existente['raiz'].real, raiz_existente['raiz'].imag))
            
            if distancia < distancia_minima:
                raiz_existente['contador'] += 1
                return False
        
        self.raices_encontradas.append({
            'raiz': raiz,
            'contador': 1,
            'fecha_descubrimiento': time.time()
        })
        return True
    
    def buscar_raices_multiples(self, 
                               region: Dict[str, float],
                               n_puntos: int = 30,
                               distancia_minima: float = 0.05,
                               paralelo: bool = True) -> Dict[str, Any]:
        inicio = time.time()
        
        x_min = float(region['x_min'])
        x_max = float(region['x_max'])
        y_min = float(region['y_min'])
        y_max = float(region['y_max'])
        n_puntos = int(n_puntos)
        distancia_minima = float(distancia_minima)
        paralelo = bool(paralelo)
        
        xs = np.linspace(x_min, x_max, n_puntos)
        ys = np.linspace(y_min, y_max, n_puntos)
        
        raices_encontradas = []
        puntos_procesados = 0
        
        def procesar_punto(i, j):
            x0 = complex(float(xs[i]), float(ys[j]))
            x1 = complex(float(xs[i]) + 0.02, float(ys[j]) + 0.02)
            
            resultado = self.ejecutar_secante(
                x0.real, x0.imag, 
                x1.real, x1.imag,
                id_ejecucion=f"grid_{i}_{j}"
            )
            
            if resultado['convergio']:
                raiz_real = float(resultado['raiz']['real'])
                raiz_imag = float(resultado['raiz']['imag'])
                raiz_compleja = complex(raiz_real, raiz_imag)
                
                es_unica = True
                for raiz_exist in raices_encontradas:
                    dist = abs(raiz_compleja - raiz_exist['complejo'])
                    if dist < distancia_minima:
                        es_unica = False
                        raiz_exist['veces_encontrada'] += 1
                        break
                
                if es_unica:
                    raices_encontradas.append({
                        'complejo': raiz_compleja,
                        'real': raiz_real,
                        'imag': raiz_imag,
                        'error': float(resultado['error_final']),
                        'iteraciones': int(resultado['iteraciones']),
                        'veces_encontrada': 1
                    })
            
            return 1
        
        if paralelo:
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = []
                for i in range(len(xs)):
                    for j in range(len(ys)):
                        futures.append(executor.submit(procesar_punto, i, j))
                
                for future in futures:
                    puntos_procesados += future.result()
        else:
            for i in range(len(xs)):
                for j in range(len(ys)):
                    puntos_procesados += procesar_punto(i, j)
        
        tiempo_total = time.time() - inicio
        
        raices_serializadas = []
        for raiz in raices_encontradas:
            raices_serializadas.append({
                'real': float(raiz['real']),
                'imag': float(raiz['imag']),
                'error': float(raiz['error']),
                'iteraciones': int(raiz['iteraciones']),
                'veces_encontrada': int(raiz['veces_encontrada']),
                'magnitud': float(abs(complex(raiz['real'], raiz['imag'])))
            })
        
        return {
            'raices': raices_serializadas,
            'total_raices': len(raices_serializadas),
            'puntos_procesados': puntos_procesados,
            'tiempo_busqueda': float(tiempo_total),
            'region': {
                'x_min': float(x_min),
                'x_max': float(x_max),
                'y_min': float(y_min),
                'y_max': float(y_max)
            },
            'configuracion': {
                'n_puntos': int(n_puntos),
                'distancia_minima': float(distancia_minima),
                'paralelo': bool(paralelo)
            }
        }
    
    def analizar_sensibilidad_ruido(self, 
                                   raiz_real,
                                   raiz_imag,
                                   niveles_ruido: List[float] = None,
                                   muestras_por_nivel: int = 5) -> Dict[str, Any]:
        """Analiza sensibilidad de una raíz al ruido numérico."""
        raiz_real = float(raiz_real)
        raiz_imag = float(raiz_imag)
        
        if niveles_ruido is None:
            niveles_ruido = [1e-15, 1e-12, 1e-9, 1e-6, 1e-3]
        else:
            niveles_ruido = [float(n) for n in niveles_ruido]
        
        muestras_por_nivel = int(muestras_por_nivel)
        
        raiz_original = complex(raiz_real, raiz_imag)
        valor_original = float(abs(self.funcion(raiz_original)))
        
        resultados = []
        estadisticas_nivel = {}
        
        for nivel in niveles_ruido:
            nivel = float(nivel)
            sensibilidades = []
            valores_perturbados = []
            
            for _ in range(muestras_por_nivel):
                raiz_perturbada = raiz_original + complex(
                    float(np.random.uniform(-nivel, nivel)),
                    float(np.random.uniform(-nivel, nivel))
                )
                
                valor_perturbado = float(abs(self.funcion(raiz_perturbada)))
                
                if valor_original > 0:
                    sensibilidad = abs(valor_perturbado - valor_original) / valor_original
                else:
                    sensibilidad = abs(valor_perturbado)
                
                sensibilidades.append(float(sensibilidad))
                valores_perturbados.append(float(valor_perturbado))
            
            sensibilidad_promedio = float(np.mean(sensibilidades))
            sensibilidad_std = float(np.std(sensibilidades))
            
            resultados_nivel = []
            for i in range(muestras_por_nivel):
                resultados_nivel.append(ResultadoSensibilidad(
                    nivel_ruido=float(nivel),
                    sensibilidad=float(sensibilidades[i]),
                    valor_original=float(valor_original),
                    valor_perturbado=float(valores_perturbados[i]),
                    raiz_perturbada=PuntoComplejo.from_complex(
                        raiz_original + complex(
                            float(np.random.uniform(-nivel, nivel)),
                            float(np.random.uniform(-nivel, nivel))
                        )
                    )
                ))
            
            estadisticas_nivel[float(nivel)] = {
                'sensibilidad_promedio': sensibilidad_promedio,
                'sensibilidad_std': sensibilidad_std,
                'min': float(np.min(sensibilidades)),
                'max': float(np.max(sensibilidades))
            }
            
            resultados.extend([r.to_dict() for r in resultados_nivel])
        sensibilidad_global = float(np.mean([s['sensibilidad_promedio'] 
                                      for s in estadisticas_nivel.values()]))
        
        if sensibilidad_global < 0.1:
            estabilidad = 'muy_estable'
        elif sensibilidad_global < 1.0:
            estabilidad = 'estable'
        elif sensibilidad_global < 10.0:
            estabilidad = 'moderadamente_sensible'
        else:
            estabilidad = 'muy_sensible'
        
        return {
            'raiz_original': {
                'real': float(raiz_real),
                'imag': float(raiz_imag),
                'valor_funcion': float(valor_original)
            },
            'resultados': resultados,
            'estadisticas_por_nivel': estadisticas_nivel,
            'clasificacion_estabilidad': estabilidad,
            'sensibilidad_global': sensibilidad_global,
            'configuracion': {
                'niveles_ruido': [float(n) for n in niveles_ruido],
                'muestras_por_nivel': int(muestras_por_nivel)
            }
        }
    
    def generar_visualizacion_trayectoria(self, 
                                        trayectoria: List[PuntoComplejo],
                                        raiz: PuntoComplejo,
                                        region: Optional[Dict[str, float]] = None,
                                        titulo: str = "Trayectoria del Método de la Secante") -> str:
        try:
            fig, axes = plt.subplots(1, 2, figsize=(14, 6))
            
            # Gráfico 1 ==>> trayectoria de complejos
            reales = [float(p.real) for p in trayectoria]
            imaginarios = [float(p.imag) for p in trayectoria]
            
            ax1 = axes[0]
            
            # Plot trayectoria
            ax1.plot(reales, imaginarios, 'b-', linewidth=1.5, alpha=0.7)
            ax1.scatter(reales, imaginarios, c=range(len(trayectoria)), 
                       cmap='viridis', s=30, alpha=0.8, edgecolors='k', linewidth=0.5)
            
            # Puntos especiales
            ax1.scatter(reales[0], imaginarios[0], color='green', s=200, 
                       marker='*', label='Inicio', zorder=5)
            ax1.scatter(reales[-1], imaginarios[-1], color='red', s=200, 
                       marker='X', label='Final', zorder=5)
            ax1.scatter(float(raiz.real), float(raiz.imag), color='orange', s=100, 
                       marker='o', label='Raíz', zorder=5, alpha=0.5)
            
            # Flechas de dirección
            for i in range(0, len(trayectoria)-1, max(1, len(trayectoria)//10)):
                dx = reales[i+1] - reales[i]
                dy = imaginarios[i+1] - imaginarios[i]
                ax1.arrow(reales[i], imaginarios[i], dx*0.8, dy*0.8,
                         head_width=0.05, head_length=0.1, fc='blue', 
                         ec='blue', alpha=0.5)
            # Configurar 
            if region:
                x_min, x_max = float(region['x_min']), float(region['x_max'])
                y_min, y_max = float(region['y_min']), float(region['y_max'])
            else:
                x_min, x_max = min(reales)-0.5, max(reales)+0.5
                y_min, y_max = min(imaginarios)-0.5, max(imaginarios)+0.5
            
            ax1.set_xlim(x_min, x_max)
            ax1.set_ylim(y_min, y_max)
            ax1.set_xlabel('Parte Real', fontsize=12)
            ax1.set_ylabel('Parte Imaginaria', fontsize=12)
            ax1.set_title(titulo, fontsize=14, fontweight='bold')
            ax1.grid(True, alpha=0.3)
            ax1.legend()
            ax1.axis('equal')
            # Gráfico 2 ==>> convergencia del error
            ax2 = axes[1]
            # errores
            errores = []
            for punto in trayectoria:
                z = complex(punto.real, punto.imag)
                error = abs(self.funcion(z))
                errores.append(float(error))
            
            iteraciones = list(range(len(errores)))
            # Plot semilogarítmico
            ax2.semilogy(iteraciones, errores, 'r-o', linewidth=2, markersize=4)
            ax2.axhline(y=self.tol, color='g', linestyle='--', 
                       label=f'Tolerancia: {self.tol:.1e}')
            
            ax2.set_xlabel('Iteración', fontsize=12)
            ax2.set_ylabel('Error (escala log)', fontsize=12)
            ax2.set_title('Convergencia del Error', fontsize=14, fontweight='bold')
            ax2.grid(True, alpha=0.3)
            ax2.legend()
            # Anotar información de convergencia
            if len(errores) > 1:
                ax2.text(0.05, 0.95, 
                        f'Error inicial: {errores[0]:.2e}\nError final: {errores[-1]:.2e}\n'
                        f'Reducción: {errores[0]/errores[-1]:.2e}x',
                        transform=ax2.transAxes, verticalalignment='top',
                        bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
            
            plt.tight_layout()
            # Convertir a base64
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            plt.close(fig)
            buf.seek(0)
            
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            return img_base64
            
        except Exception as e:
            logger.error(f"Error generando visualización: {e}")
            return ""
    
    def generar_informe_ejecucion(self, resultado_id: str) -> Dict[str, Any]:
        resultado = None
        for r in self.historial_ejecuciones:
            if r.id_ejecucion == resultado_id:
                resultado = r
                break
        
        if not resultado:
            raise ValueError(f"Resultado con ID {resultado_id} no encontrado")
        img_base64 = self.generar_visualizacion_trayectoria(
            resultado.trayectoria,
            resultado.raiz,
            titulo=f"Trayectoria - {self.expresion_funcion}"
        )
        
        informe = {
            'id_ejecucion': resultado.id_ejecucion,
            'fecha_ejecucion': time.strftime('%Y-%m-%d %H:%M:%S'),
            'configuracion': resultado.configuracion,
            'resultados': {
                'raiz': resultado.raiz.to_dict(),
                'iteraciones': resultado.iteraciones,
                'convergio': resultado.convergio,
                'error_final': resultado.error_final,
                'tiempo_ejecucion': resultado.tiempo_ejecucion,
                'tipo_convergencia': resultado.tipo_convergencia,
                'ratio_convergencia': resultado.ratio_convergencia
            },
            'analisis_convergencia': {
                'errores_por_iteracion': resultado.errores_iteracion,
                'trayectoria': [p.to_dict() for p in resultado.trayectoria],
                'longitud_trayectoria': len(resultado.trayectoria)
            },
            'visualizacion_base64': img_base64,
            'recomendaciones': self._generar_recomendaciones(resultado)
        }
        
        return informe
    
    def _generar_recomendaciones(self, resultado: ResultadoSecante) -> List[str]:
        recomendaciones = []
        
        if not resultado.convergio:
            recomendaciones.append("Aumentar el número máximo de iteraciones")
            recomendaciones.append("Probar con una estrategia anti-ciclos diferente")
            recomendaciones.append("Cambiar los puntos iniciales")
        
        if resultado.ratio_convergencia > 1.5:
            recomendaciones.append("La convergencia es lenta, considerar otro método")
        
        if resultado.error_final > 1e-6:
            recomendaciones.append("Aumentar la tolerancia o verificar puntos iniciales")
        
        if len(resultado.trayectoria) > 50:
            recomendaciones.append("Trayectoria muy larga, considerar puntos iniciales más cercanos a la raíz")
        
        if 'oscilaciones' in resultado.tipo_convergencia:
            recomendaciones.append("Se detectaron oscilaciones, usar estrategia 'reset' o 'hibrido'")
        
        return recomendaciones
    
    def generar_funcion_patologica(self, tipo: str, **params) -> Dict[str, Any]:
        funciones = {
            'weierstrass': self._generar_weierstrass,
            'oscilatoria': self._generar_oscilatoria,
            'no_suave': self._generar_no_suave,
            'multimodal': self._generar_multimodal,
            'condicion_malo': self._generar_mal_condicionada
        }
        
        if tipo not in funciones:
            raise ValueError(f"Tipo de función patológica desconocido: {tipo}")
        
        expresion, descripcion, caracteristicas = funciones[tipo](**params)
        
        return {
            'tipo': tipo,
            'expresion': expresion,
            'descripcion': descripcion,
            'caracteristicas': caracteristicas,
            'parametros': {k: float(v) if isinstance(v, (int, float)) else v 
                          for k, v in params.items()}
        }
    
    def _generar_weierstrass(self, a: float = 0.5, b: int = 7, n_terminos: int = 10) -> Tuple[str, str, Dict]:
        terminos = []
        for n in range(n_terminos):
            coef = a**n
            terminos.append(f"{coef}*cmath.cos({b}**{n}*cmath.pi*z)")
        
        expresion = " + ".join(terminos)
        descripcion = f"Función de Weierstrass (a={a}, b={b}, {n_terminos} términos)"
        
        return expresion, descripcion, {
            'continua': True,
            'diferenciable': False,
            'oscilatoria': True,
            'dificultad': 'alta'
        }
    
    def _generar_oscilatoria(self, frecuencia: float = 20.0, amplitud: float = 1.0) -> Tuple[str, str, Dict]:
        expresion = f"{amplitud}*cmath.sin({frecuencia}*z)/(z + 1e-10)"
        descripcion = f"Función oscilatoria (frecuencia={frecuencia}, amplitud={amplitud})"
        
        return expresion, descripcion, {
            'continua': True,
            'diferenciable': True,
            'oscilatoria': True,
            'frecuencia': float(frecuencia),
            'dificultad': 'media_alta'
        }
    
    def _generar_no_suave(self, umbral: float = 0.1) -> Tuple[str, str, Dict]:
        expresion = f"z**3 - 1 if abs(z) > {umbral} else 0"
        descripcion = f"Función no suave con discontinuidad en |z|={umbral}"
        
        return expresion, descripcion, {
            'continua': False,
            'diferenciable': False,
            'oscilatoria': False,
            'discontinuidad_en': float(umbral),
            'dificultad': 'alta'
        }
    
    def _generar_multimodal(self, n_modos: int = 5) -> Tuple[str, str, Dict]:
        raices = []
        for k in range(n_modos):
            angulo = 2 * np.pi * k / n_modos
            raiz_real = np.cos(angulo)
            raiz_imag = np.sin(angulo)
            raices.append(f"(z - ({raiz_real}+{raiz_imag}j))")
        
        expresion = "*".join(raices)
        descripcion = f"Función multimodal con {n_modos} raíces (raíces de la unidad)"
        
        return expresion, descripcion, {
            'continua': True,
            'diferenciable': True,
            'multimodal': True,
            'n_raices': int(n_modos),
            'dificultad': 'media'
        }
    
    def _generar_mal_condicionada(self, condicion: float = 1e12) -> Tuple[str, str, Dict]:
        delta = 1.0 / condicion
        expresion = f"(z - 1.0)*(z - (1.0 + {delta}))"
        descripcion = f"Función mal condicionada (condición ~{condicion:.0e})"
        
        return expresion, descripcion, {
            'continua': True,
            'diferenciable': True,
            'mal_condicionada': True,
            'numero_condicion': float(condicion),
            'dificultad': 'muy_alta'
        }

app = Flask(__name__)
CORS(app)

solver_global = None

ESTUDIANTES = [
    Estudiante(
        id=1,
        nombre="Callejas Escobar Mauricio Jhostin",
        codigo="123456",
        carrera="Ingeniería de Sistemas",
        email="",
        avatar_url=""
    ),
    Estudiante(
        id=2,
        nombre="Echeverria Poma Fabricio Oliver",
        codigo="123456",
        carrera="Ingeniería de Sistemas",
        email="",
        avatar_url=""
    ),
    Estudiante(
        id=3,
        nombre="Tancara Suñagua Joel Hernan",
        codigo="123456",
        carrera="Desarrollo de Software",
        email="tancarajoe@gmail.com",
        avatar_url="https://avatars.githubusercontent.com/u/140029048?s=400&u=830ec0222edadebc3ac1d40f6d28f15a07eac13e&v=4"
    )
]
# ENDPOINTS PARA LA API

@app.route('/api/estudiantes', methods=['GET'])
def obtener_estudiantes():
    return jsonify([asdict(e) for e in ESTUDIANTES])

@app.route('/api/configurar', methods=['POST'])
def configurar_solver():
    global solver_global
    data = request.json
    try:
        data = convertir_datos_numericos(data)
        
        solver_global = SecanteComplejoAvanzado(
            expresion_funcion=str(data['expresion_funcion']),
            tol=float(data.get('tol', 1e-12)),
            max_iter=int(data.get('max_iter', 200)),
            estrategia_ciclos=str(data.get('estrategia_ciclos', 'perturbacion_hibrida')),
            usar_derivada_numerica=bool(data.get('usar_derivada_numerica', False))
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Solver configurado exitosamente',
            'configuracion': {
                'expresion_funcion': data['expresion_funcion'],
                'tol': float(data.get('tol', 1e-12)),
                'max_iter': int(data.get('max_iter', 200)),
                'estrategia_ciclos': data.get('estrategia_ciclos', 'perturbacion_hibrida')
            }
        })
    
    except Exception as e:
        logger.error(f"Error configurando solver: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/ejecutar', methods=['POST'])
def ejecutar_secante():
    if solver_global is None:
        return jsonify({
            'status': 'error',
            'message': 'Solver no configurado Use /api/configurar primero'
        }), 400
    
    data = request.json
    
    try:
        data = convertir_datos_numericos(data)
        
        required_fields = ['x0_real', 'x0_imag', 'x1_real', 'x1_imag']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Campo requerido faltante: {field}'
                }), 400
        
        resultado = solver_global.ejecutar_secante(
            x0_real=float(data['x0_real']),
            x0_imag=float(data['x0_imag']),
            x1_real=float(data['x1_real']),
            x1_imag=float(data['x1_imag']),
            id_ejecucion=data.get('id_ejecucion')
        )
        
        trayectoria = [PuntoComplejo(**p) for p in resultado['trayectoria']]
        raiz = PuntoComplejo(**resultado['raiz'])
        
        img_base64 = solver_global.generar_visualizacion_trayectoria(
            trayectoria, raiz,
            titulo=f"Trayectoria: {solver_global.expresion_funcion}"
        )
        
        resultado['visualizacion_base64'] = img_base64
        
        return jsonify({
            'status': 'success',
            'resultado': resultado
        })
    
    except Exception as e:
        logger.error(f"Error ejecutando secante: {e}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/buscar-raices', methods=['POST'])
def buscar_raices_multiples():
    if solver_global is None:
        return jsonify({
            'status': 'error',
            'message': 'Solver no configurado'
        }), 400
    
    data = request.json
    
    try:
        data = convertir_datos_numericos(data)
        
        resultado = solver_global.buscar_raices_multiples(
            region={
                'x_min': float(data['region']['x_min']),
                'x_max': float(data['region']['x_max']),
                'y_min': float(data['region']['y_min']),
                'y_max': float(data['region']['y_max'])
            },
            n_puntos=int(data.get('n_puntos', 30)),
            distancia_minima=float(data.get('distancia_minima', 0.05)),
            paralelo=bool(data.get('paralelo', True))
        )
        
        return jsonify({
            'status': 'success',
            'resultado': resultado
        })
    
    except Exception as e:
        logger.error(f"Error buscando raíces: {e}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/sensibilidad', methods=['POST'])
def analizar_sensibilidad():
    """Analiza sensibilidad al ruido numérico."""
    if solver_global is None:
        return jsonify({
            'status': 'error',
            'message': 'Solver no configurado'
        }), 400
    
    data = request.json
    
    try:
        data = convertir_datos_numericos(data)
        
        resultado = solver_global.analizar_sensibilidad_ruido(
            raiz_real=float(data['raiz_real']),
            raiz_imag=float(data['raiz_imag']),
            niveles_ruido=data.get('niveles_ruido', [1e-15, 1e-12, 1e-9, 1e-6, 1e-3]),
            muestras_por_nivel=int(data.get('muestras_por_nivel', 5))
        )
        
        return jsonify({
            'status': 'success',
            'resultado': resultado
        })
    
    except Exception as e:
        logger.error(f"Error analizando sensibilidad: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/funcion-patologica', methods=['POST'])
def generar_funcion_patologica():
    if solver_global is None:
        return jsonify({
            'status': 'error',
            'message': 'Solver no configurado'
        }), 400
    
    data = request.json
    
    try:
        data = convertir_datos_numericos(data)
        
        resultado = solver_global.generar_funcion_patologica(
            tipo=str(data['tipo']),
            **data.get('parametros', {})
        )
        
        return jsonify({
            'status': 'success',
            'funcion_patologica': resultado
        })
    
    except Exception as e:
        logger.error(f"Error generando función patológica: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/estadisticas', methods=['GET'])
def obtener_estadisticas():
    if solver_global is None:
        return jsonify({
            'status': 'error',
            'message': 'Solver no configurado'
        }), 400
    
    estadisticas_serializadas = {
        'ejecuciones_totales': int(solver_global.estadisticas['ejecuciones_totales']),
        'convergencias_exitosas': int(solver_global.estadisticas['convergencias_exitosas']),
        'tiempo_promedio': float(solver_global.estadisticas['tiempo_promedio'])
    }
    
    raices_serializadas = []
    for r in solver_global.raices_encontradas:
        raices_serializadas.append({
            'raiz': r['raiz'].to_dict(),
            'veces_encontrada': int(r['contador']),
            'fecha_descubrimiento': float(r['fecha_descubrimiento'])
        })
    
    return jsonify({
        'status': 'success',
        'estadisticas': estadisticas_serializadas,
        'raices_encontradas': raices_serializadas,
        'historial_count': len(solver_global.historial_ejecuciones)
    })

@app.route('/api/informe/<resultado_id>', methods=['GET'])
def obtener_informe(resultado_id):
    """Obtiene un informe detallado de una ejecución."""
    if solver_global is None:
        return jsonify({
            'status': 'error',
            'message': 'Solver no configurado'
        }), 400
    
    try:
        informe = solver_global.generar_informe_ejecucion(str(resultado_id))
        return jsonify({
            'status': 'success',
            'informe': informe
        })
    
    except Exception as e:
        logger.error(f"Error generando informe: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 404
#EJEMPLOS PREDEFINIDOS
@app.route('/api/ejemplos', methods=['GET'])
def obtener_ejemplos():
    ejemplos = [
        {
            'nombre': 'Raíces Cúbicas de la Unidad',
            'expresion': 'z**3 - 1',
            'descripcion': 'Polinomio cúbico con raíces en 1, -0.5±0.866i',
            'dificultad': 'baja',
            'puntos_iniciales': [
                {'x0': [0.5, 0.5], 'x1': [1.0, 0.0]},
                {'x0': [-0.5, 0.5], 'x1': [-1.0, 0.0]}
            ]
        },
        {
            'nombre': 'Función Seno Compleja',
            'expresion': 'cmath.sin(z) - z/2',
            'descripcion': 'Seno complejo con término lineal',
            'dificultad': 'media',
            'puntos_iniciales': [
                {'x0': [1.0, 1.0], 'x1': [2.0, 0.5]},
                {'x0': [-1.0, -1.0], 'x1': [-2.0, -0.5]}
            ]
        },
        {
            'nombre': 'Exponencial Compleja',
            'expresion': 'cmath.exp(z) - 1',
            'descripcion': 'Exponencial compleja con raíz en 0',
            'dificultad': 'baja',
            'puntos_iniciales': [
                {'x0': [0.5, 0.5], 'x1': [1.0, 0.0]},
                {'x0': [-0.5, -0.5], 'x1': [-1.0, 0.0]}
            ]
        },
        {
            'nombre': 'Polinomio de Grado 4',
            'expresion': 'z**4 - 5*z**2 + 4',
            'descripcion': 'Polinomio cuártico con 4 raíces reales',
            'dificultad': 'media',
            'puntos_iniciales': [
                {'x0': [0.5, 0.5], 'x1': [1.5, 0.0]},
                {'x0': [-0.5, 0.5], 'x1': [-1.5, 0.0]}
            ]
        }
    ]
    
    return jsonify({
        'status': 'success',
        'ejemplos': ejemplos
    })

@app.route('/api/salud', methods=['GET'])
def salud():
    return jsonify({
        'status': 'ok',
        'version': '4.0',
        'servicio': 'Método de la Secante para Funciones Complejas',
        'endpoints': [
            '/api/estudiantes',
            '/api/configurar',
            '/api/ejecutar',
            '/api/buscar-raices',
            '/api/sensibilidad',
            '/api/funcion-patologica',
            '/api/estadisticas',
            '/api/informe/<id>',
            '/api/ejemplos'
        ]
    })


if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Cargar solver
    try:
        solver_global = SecanteComplejoAvanzado(
            expresion_funcion='z**3 - 1',
            tol=1e-12,
            max_iter=100,
            estrategia_ciclos='perturbacion_hibrida'
        )
        print("Solver OK")
    except Exception as e:
        print(f"Error en el solver: {e}")
    
    # servidor
    app.run(host='localhost', port=5000, debug=True)