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

# FUNCIONES DE CONVERSIÓN SEGURA
def seguro_float(valor, default=0.0, min_val=1e-15):
    """Convierte a float de manera segura."""
    try:
        result = float(valor)
        if math.isnan(result) or math.isinf(result):
            return float(default)
        if abs(result) < min_val:
            return float(min_val)
        return result
    except (ValueError, TypeError):
        return float(default)

def seguro_complex(real, imag):
    """Crea un número complejo de manera segura."""
    return complex(
        seguro_float(real, 0.5, 1e-15),
        seguro_float(imag, 0.5, 1e-15)
    )

def convertir_a_numero(valor):
    try:
        if isinstance(valor, (int, float)):
            return seguro_float(valor)
        elif isinstance(valor, str):
            if '.' in valor or 'e' in valor.lower() or 'E' in valor.lower():
                return seguro_float(valor)
            else:
                return int(valor)
        elif isinstance(valor, complex):
            return complex(
                seguro_float(valor.real),
                seguro_float(valor.imag)
            )
        else:
            return 0.0
    except:
        return 0.0

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

def serializar_complex(z):
    if isinstance(z, complex):
        return {'real': seguro_float(z.real), 'imag': seguro_float(z.imag)}
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

# MODELOS DE DATOS
@dataclass
class PuntoComplejo:
    real: float
    imag: float
    
    def to_complex(self) -> complex:
        return complex(self.real, self.imag)
    
    @staticmethod
    def from_complex(z: complex) -> 'PuntoComplejo':
        return PuntoComplejo(seguro_float(z.real), seguro_float(z.imag))
    
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
    errores_relativos: List[float]
    ciclos_detectados: int
    tipo_convergencia: str
    ratio_convergencia: float
    error_relativo_final: float
    tasa_reduccion_error: float
    velocidad_convergencia: float
    orden_aproximado: float
    
    def to_dict(self):
        return {
            'id_ejecucion': self.id_ejecucion,
            'raiz': self.raiz.to_dict(),
            'iteraciones': int(self.iteraciones),
            'convergio': bool(self.convergio),
            'trayectoria': [p.to_dict() for p in self.trayectoria],
            'error_final': seguro_float(self.error_final, 1e-15),
            'tiempo_ejecucion': seguro_float(self.tiempo_ejecucion, 0.1),
            'configuracion': self.configuracion,
            'errores_iteracion': [seguro_float(e, 1e-15) for e in self.errores_iteracion],
            'errores_relativos': [seguro_float(e, 1e-15) for e in self.errores_relativos],
            'ciclos_detectados': int(self.ciclos_detectados),
            'tipo_convergencia': str(self.tipo_convergencia),
            'ratio_convergencia': seguro_float(self.ratio_convergencia, 1.0),
            'error_relativo_final': seguro_float(self.error_relativo_final, 1e-15),
            'tasa_reduccion_error': seguro_float(self.tasa_reduccion_error, 1.0),
            'velocidad_convergencia': seguro_float(self.velocidad_convergencia, 0.0),
            'orden_aproximado': seguro_float(self.orden_aproximado, 1.0)
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
            'nivel_ruido': seguro_float(self.nivel_ruido),
            'sensibilidad': seguro_float(self.sensibilidad),
            'valor_original': seguro_float(self.valor_original),
            'valor_perturbado': seguro_float(self.valor_perturbado),
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
        self.tol = seguro_float(tol, 1e-12)
        self.max_iter = int(max_iter)
        self.estrategia_ciclos = estrategia_ciclos
        self.usar_derivada_numerica = bool(usar_derivada_numerica)
        
        self.funcion = self._parsear_funcion(expresion_funcion)
        
        self.historial_ejecuciones = []
        self.raices_encontradas = []
        self.estadisticas = {
            'ejecuciones_totales': 0,
            'convergencias_exitosas': 0,
            'tiempo_promedio': 0.0
        }
        self._configurar_estrategias()
    
    def _parsear_funcion(self, expresion: str) -> Callable[[complex], complex]:
        try:
            expresion = expresion.strip()
            
            caracteres_peligrosos = ['import', 'exec', 'eval', '__', 'open', 'file']
            for peligroso in caracteres_peligrosos:
                if peligroso in expresion.lower():
                    raise ValueError(f"Expresión contiene término no permitido")
            
            expr_limpia = expresion.replace('^', '**')
            
            if 'z' not in expr_limpia:
                expr_limpia = expr_limpia.replace('x', 'z').replace('X', 'z')
            
            z = symbols('z')
            expr_sympy = parse_expr(expr_limpia)
            
            expr_lamdified = sp.lambdify(z, expr_sympy, modules=['numpy', 'cmath'])
            
            def funcion_segura(z_val: complex) -> complex:
                try:
                    if isinstance(z_val, (int, float)):
                        z_val = complex(z_val)
                    
                    resultado = expr_lamdified(z_val)
                    
                    if resultado is None:
                        return complex(1e-15, 1e-15)
                    
                    if isinstance(resultado, (int, float)):
                        val = complex(resultado, 0.0)
                        if abs(val) < 1e-15:
                            val += complex(1e-15, 1e-15)
                        return val
                    elif isinstance(resultado, complex):
                        if abs(resultado) < 1e-15:
                            return resultado + complex(1e-15, 1e-15)
                        return resultado
                    else:
                        try:
                            val = complex(float(resultado), 0.0)
                            return val if abs(val) > 1e-15 else val + complex(1e-15, 1e-15)
                        except:
                            return complex(1e-15, 1e-15)
                            
                except (ZeroDivisionError, OverflowError, ValueError, TypeError):
                    return complex(1e-15, 1e-15)
            
            return funcion_segura
            
        except Exception as e:
            logger.error(f"Error parseando función: {e}")
            def funcion_por_defecto(z: complex) -> complex:
                val = complex(z.real**2 + z.imag**2 - 1, 0)
                return val if abs(val) > 1e-15 else val + complex(1e-15, 1e-15)
            return funcion_por_defecto
    
    def _configurar_estrategias(self):
        self.estrategias = {
            'perturbacion': self._estrategia_perturbacion,
            'reset': self._estrategia_reset,
            'hibrido': self._estrategia_hibrido,
            'perturbacion_hibrida': self._estrategia_perturbacion_hibrida,
            'adaptativa': self._estrategia_adaptativa
        }
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
        mejora_relativa = abs(ultimos[-1] - ultimos[0]) / (ultimos[0] + 1e-15)
        if mejora_relativa < 0.01:
            self.contador_ciclos += 1
            return True
        
        diferencias = np.diff(ultimos)
        if np.std(diferencias) < 1e-10:
            self.contador_ciclos += 1
            return True
        
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
        
        inicio = time.time()
        
        x0 = seguro_complex(x0_real, x0_imag)
        x1 = seguro_complex(x1_real, x1_imag)
        
        if id_ejecucion is None:
            id_ejecucion = str(uuid.uuid4())[:8]
        
        try:
            fx0 = self.funcion(x0)
            fx1 = self.funcion(x1)
        except Exception:
            fx0 = complex(-1.0, 0.0)
            fx1 = complex(1.0, 0.0)
        
        trayectoria = [
            PuntoComplejo.from_complex(x0), 
            PuntoComplejo.from_complex(x1)
        ]
        
        errores = [
            max(seguro_float(abs(fx0), 1.0, 1e-15), 1e-15),
            max(seguro_float(abs(fx1), 1.0, 1e-15), 1e-15)
        ]
        
        errores_relativos = []
        ciclos_detectados = 0
        convergio = False
        raiz_final = x1
        iteracion_final = 0
        
        estrategia_func = self.estrategias.get(
            self.estrategia_ciclos, 
            self._estrategia_perturbacion_hibrida
        )
        
        for k in range(1, self.max_iter + 1):
            try:
                x0, x1, fx0, fx1 = estrategia_func(x0, x1, fx0, fx1, k)
                
                denominador = fx1 - fx0
                denominador_abs = abs(denominador)
                
                if denominador_abs < 1e-15:
                    if self.usar_derivada_numerica:
                        try:
                            derivada = self._calcular_derivada_numerica(self.funcion, x1)
                            if abs(derivada) > 1e-15:
                                x_next = x1 - fx1 / derivada
                            else:
                                x_next = (x0 + x1) / 2
                        except:
                            x_next = (x0 + x1) / 2
                    else:
                        angulo = np.random.uniform(0, 2*np.pi)
                        perturbacion = cmath.rect(1e-8, angulo)
                        x_next = (x0 + x1) / 2 + perturbacion
                else:
                    try:
                        x_next = x1 - fx1 * (x1 - x0) / denominador
                    except ZeroDivisionError:
                        x_next = (x0 + x1) / 2
                
                try:
                    fx_next = self.funcion(x_next)
                    if not isinstance(fx_next, (int, float, complex)):
                        fx_next = complex(1e-15, 1e-15)
                except Exception:
                    fx_next = complex(1e-15, 1e-15)
                
                try:
                    error_actual = float(abs(complex(fx_next)))
                    
                    if math.isnan(error_actual) or math.isinf(error_actual):
                        error_actual = 1.0
                    elif error_actual == 0:
                        error_actual = 1e-15
                    elif error_actual < 1e-15:
                        error_actual = max(error_actual, 1e-15)
                        
                except:
                    error_actual = 1.0
                
                trayectoria.append(PuntoComplejo.from_complex(x_next))
                errores.append(error_actual)
                
                if k > 0 and len(trayectoria) > 1:
                    try:
                        z_actual = trayectoria[-1].to_complex()
                        z_anterior = trayectoria[-2].to_complex()
                        
                        if abs(z_anterior) > 1e-15:
                            error_rel = abs((z_actual - z_anterior) / z_anterior)
                        else:
                            error_rel = abs(z_actual - z_anterior)
                        
                        error_rel = max(seguro_float(error_rel, 1e-15, 1e-15), 1e-15)
                        errores_relativos.append(error_rel)
                        
                    except:
                        errores_relativos.append(1e-15)
                
                if error_actual < self.tol:
                    convergio = True
                    raiz_final = x_next
                    iteracion_final = k
                    
                    if error_actual == 0:
                        error_actual = 1e-15
                        errores[-1] = error_actual
                    break
                
                if k > 10 and self._detectar_ciclo(errores):
                    ciclos_detectados += 1
                    try:
                        x0, x1, fx0, fx1 = self._estrategia_reset(x0, x1, fx0, fx1, k)
                    except:
                        x0 = complex(np.random.uniform(-2, 2), np.random.uniform(-2, 2))
                        x1 = complex(np.random.uniform(-2, 2), np.random.uniform(-2, 2))
                        fx0 = self.funcion(x0)
                        fx1 = self.funcion(x1)
                    continue
                
                x0, x1 = x1, x_next
                fx0, fx1 = fx1, fx_next
                
            except Exception:
                x0 = complex(0.5, 0.5)
                x1 = complex(1.0, 0.0)
                fx0 = complex(-1.0, 0.0)
                fx1 = complex(1.0, 0.0)
        
        tiempo_total = max(time.time() - inicio, 0.001)
        
        tasa_reduccion_error = 1.0
        velocidad_convergencia = 0.0
        
        if len(errores) > 1:
            try:
                error_inicial = max(errores[0], 1e-15)
                error_final = max(errores[-1], 1e-15)
                
                if error_final > 0:
                    tasa_reduccion_error = error_inicial / error_final
                    tasa_reduccion_error = max(tasa_reduccion_error, 1.0)
                    
                    if iteracion_final > 0 and error_inicial > error_final:
                        velocidad_convergencia = iteracion_final / np.log(error_inicial/error_final)
            except:
                pass
        
        analisis_convergencia = self._analizar_convergencia(errores, trayectoria)
        
        error_final_val = seguro_float(errores[-1] if errores else 1.0, 1e-15, 1e-15)
        error_relativo_final_val = seguro_float(
            errores_relativos[-1] if errores_relativos else 1e-15, 
            1e-15, 
            1e-15
        )
        
        if math.isnan(raiz_final.real) or math.isnan(raiz_final.imag):
            raiz_final = complex(0.0, 0.0)
        
        resultado = ResultadoSecante(
            id_ejecucion=id_ejecucion,
            raiz=PuntoComplejo.from_complex(raiz_final),
            iteraciones=iteracion_final if convergio else self.max_iter,
            convergio=convergio,
            trayectoria=trayectoria,
            error_final=error_final_val,
            tiempo_ejecucion=seguro_float(tiempo_total, 0.1, 0.001),
            configuracion={
                'expresion_funcion': self.expresion_funcion,
                'tol': seguro_float(self.tol, 1e-12, 1e-15),
                'max_iter': int(self.max_iter),
                'estrategia_ciclos': self.estrategia_ciclos,
                'usar_derivada_numerica': self.usar_derivada_numerica
            },
            errores_iteracion=[seguro_float(e, 1e-15, 1e-15) for e in errores],
            errores_relativos=[seguro_float(e, 1e-15, 1e-15) for e in errores_relativos],
            ciclos_detectados=ciclos_detectados,
            tipo_convergencia=analisis_convergencia.get('tipo', 'no_determinado'),
            ratio_convergencia=seguro_float(analisis_convergencia.get('ratio_promedio', 1.0), 1.0, 1e-15),
            error_relativo_final=error_relativo_final_val,
            tasa_reduccion_error=seguro_float(tasa_reduccion_error, 1.0, 1e-15),
            velocidad_convergencia=seguro_float(velocidad_convergencia, 0.0, 1e-15),
            orden_aproximado=seguro_float(analisis_convergencia.get('orden_estimado', 1.0), 1.0, 1e-15)
        )
        
        self.historial_ejecuciones.append(resultado)
        self.estadisticas['ejecuciones_totales'] += 1
        
        if convergio:
            self.estadisticas['convergencias_exitosas'] += 1
            self._registrar_raiz_unica(resultado.raiz)
        
        if self.historial_ejecuciones:
            tiempos = [r.tiempo_ejecucion for r in self.historial_ejecuciones]
            self.estadisticas['tiempo_promedio'] = seguro_float(
                np.mean(tiempos) if tiempos else 0.0,
                0.1,
                0.001
            )
        
        return resultado.to_dict()
    
    def _analizar_convergencia(self, errores: List[float], 
                              trayectoria: List[PuntoComplejo]) -> Dict[str, Any]:
        if len(errores) < 4:
            return {'tipo': 'insuficientes_datos', 'ratio_promedio': 1.0, 'orden_estimado': 1.0}
        
        ratios = []
        ordenes = []
        
        for i in range(2, len(errores) - 1):
            if errores[i-1] > 0 and errores[i] > 0 and errores[i-2] > 0:
                try:
                    ratio = abs(np.log(errores[i]) / np.log(errores[i-1]))
                    ratios.append(seguro_float(ratio, 1.0))
                    
                    if errores[i-1] > 0 and errores[i-2] > 0:
                        orden = np.log(abs(errores[i] / errores[i-1])) / np.log(abs(errores[i-1] / errores[i-2]))
                        if not math.isnan(orden) and not math.isinf(orden):
                            ordenes.append(seguro_float(orden, 1.0))
                except:
                    continue
        
        if not ratios:
            return {'tipo': 'no_determinado', 'ratio_promedio': 1.0, 'orden_estimado': 1.0}
        
        ratio_promedio = seguro_float(np.mean(ratios) if ratios else 1.0, 1.0)
        orden_estimado = seguro_float(np.mean(ordenes) if ordenes else 1.0, 1.0)
        
        if orden_estimado >= 1.5 and orden_estimado < 1.7:
            tipo = 'cuadrática_aproximada'
        elif orden_estimado >= 1.1:
            tipo = 'superlineal'
        elif orden_estimado > 0.8:
            tipo = 'lineal'
        else:
            tipo = 'lenta_o_divergente'
        
        if len(trayectoria) > 10:
            cambios_direccion = self._analizar_oscilaciones(trayectoria)
            if cambios_direccion > len(trayectoria) * 0.3:
                tipo = f"{tipo}_con_oscilaciones"
        
        return {
            'tipo': tipo,
            'ratio_promedio': ratio_promedio,
            'orden_estimado': orden_estimado,
            'ratios_individuales': ratios,
            'ordenes_individuales': ordenes,
            'error_inicial': seguro_float(errores[0], 1.0),
            'error_final': seguro_float(errores[-1], 1e-15)
        }
    
    def _analizar_oscilaciones(self, trayectoria: List[PuntoComplejo]) -> int:
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
        
        x_min = seguro_float(region.get('x_min', -2), -2)
        x_max = seguro_float(region.get('x_max', 2), 2)
        y_min = seguro_float(region.get('y_min', -2), -2)
        y_max = seguro_float(region.get('y_max', 2), 2)
        n_puntos = int(n_puntos)
        distancia_minima = seguro_float(distancia_minima, 0.05)
        paralelo = bool(paralelo)
        
        xs = np.linspace(x_min, x_max, max(n_puntos, 5))
        ys = np.linspace(y_min, y_max, max(n_puntos, 5))
        
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
                raiz_real = seguro_float(resultado['raiz']['real'])
                raiz_imag = seguro_float(resultado['raiz']['imag'])
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
                        'error': seguro_float(resultado['error_final']),
                        'iteraciones': int(resultado['iteraciones']),
                        'ciclos_detectados': int(resultado.get('ciclos_detectados', 0)),
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
        
        tiempo_total = seguro_float(time.time() - inicio, 0.1)
        
        raices_serializadas = []
        for raiz in raices_encontradas:
            raices_serializadas.append({
                'real': seguro_float(raiz['real']),
                'imag': seguro_float(raiz['imag']),
                'error': seguro_float(raiz['error'], 1e-15),
                'iteraciones': int(raiz['iteraciones']),
                'ciclos_detectados': int(raiz.get('ciclos_detectados', 0)),
                'veces_encontrada': int(raiz['veces_encontrada']),
                'magnitud': seguro_float(abs(complex(raiz['real'], raiz['imag'])))
            })
        
        return {
            'raices': raices_serializadas,
            'total_raices': len(raices_serializadas),
            'puntos_procesados': puntos_procesados,
            'tiempo_busqueda': tiempo_total,
            'region': {
                'x_min': x_min,
                'x_max': x_max,
                'y_min': y_min,
                'y_max': y_max
            },
            'configuracion': {
                'n_puntos': n_puntos,
                'distancia_minima': distancia_minima,
                'paralelo': paralelo
            }
        }
    
    def analizar_sensibilidad_ruido(self, 
                                   raiz_real,
                                   raiz_imag,
                                   niveles_ruido: List[float] = None,
                                   muestras_por_nivel: int = 5) -> Dict[str, Any]:
        raiz_real = seguro_float(raiz_real)
        raiz_imag = seguro_float(raiz_imag)
        
        if niveles_ruido is None:
            niveles_ruido = [1e-15, 1e-12, 1e-9, 1e-6, 1e-3]
        else:
            niveles_ruido = [seguro_float(n) for n in niveles_ruido]
        
        muestras_por_nivel = int(muestras_por_nivel)
        
        raiz_original = complex(raiz_real, raiz_imag)
        valor_original = seguro_float(abs(self.funcion(raiz_original)), 1e-15)
        
        resultados = []
        estadisticas_nivel = {}
        
        for nivel in niveles_ruido:
            nivel = seguro_float(nivel)
            sensibilidades = []
            valores_perturbados = []
            
            for _ in range(muestras_por_nivel):
                raiz_perturbada = raiz_original + complex(
                    float(np.random.uniform(-nivel, nivel)),
                    float(np.random.uniform(-nivel, nivel))
                )
                
                valor_perturbado = seguro_float(abs(self.funcion(raiz_perturbada)), 1e-15)
                
                if valor_original > 0:
                    sensibilidad = abs(valor_perturbado - valor_original) / valor_original
                else:
                    sensibilidad = abs(valor_perturbado)
                
                sensibilidades.append(seguro_float(sensibilidad))
                valores_perturbados.append(seguro_float(valor_perturbado))
            
            sensibilidad_promedio = seguro_float(np.mean(sensibilidades))
            sensibilidad_std = seguro_float(np.std(sensibilidades))
            
            resultados_nivel = []
            for i in range(muestras_por_nivel):
                resultados_nivel.append(ResultadoSensibilidad(
                    nivel_ruido=nivel,
                    sensibilidad=sensibilidades[i],
                    valor_original=valor_original,
                    valor_perturbado=valores_perturbados[i],
                    raiz_perturbada=PuntoComplejo.from_complex(
                        raiz_original + complex(
                            float(np.random.uniform(-nivel, nivel)),
                            float(np.random.uniform(-nivel, nivel))
                        )
                    )
                ))
            
            estadisticas_nivel[nivel] = {
                'sensibilidad_promedio': sensibilidad_promedio,
                'sensibilidad_std': sensibilidad_std,
                'min': seguro_float(np.min(sensibilidades)),
                'max': seguro_float(np.max(sensibilidades))
            }
            
            resultados.extend([r.to_dict() for r in resultados_nivel])
        
        sensibilidad_global = seguro_float(np.mean([s['sensibilidad_promedio'] 
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
                'real': raiz_real,
                'imag': raiz_imag,
                'valor_funcion': valor_original
            },
            'resultados': resultados,
            'estadisticas_por_nivel': estadisticas_nivel,
            'clasificacion_estabilidad': estabilidad,
            'sensibilidad_global': sensibilidad_global,
            'configuracion': {
                'niveles_ruido': niveles_ruido,
                'muestras_por_nivel': muestras_por_nivel
            }
        }
    
    def generar_visualizacion_trayectoria(self, 
                                        trayectoria: List[PuntoComplejo],
                                        raiz: PuntoComplejo,
                                        region: Optional[Dict[str, float]] = None,
                                        titulo: str = "Trayectoria del Método de la Secante") -> str:
        try:
            fig, axes = plt.subplots(1, 2, figsize=(14, 6))
            
            reales = [float(p.real) for p in trayectoria]
            imaginarios = [float(p.imag) for p in trayectoria]
            
            ax1 = axes[0]
            
            ax1.plot(reales, imaginarios, 'b-', linewidth=1.5, alpha=0.7)
            ax1.scatter(reales, imaginarios, c=range(len(trayectoria)), 
                       cmap='viridis', s=30, alpha=0.8, edgecolors='k', linewidth=0.5)
            
            ax1.scatter(reales[0], imaginarios[0], color='green', s=200, 
                       marker='*', label='Inicio')
            ax1.scatter(reales[-1], imaginarios[-1], color='red', s=200, 
                       marker='X', label='Final')
            ax1.scatter(float(raiz.real), float(raiz.imag), color='orange', s=100, 
                       marker='o', label='Raíz', alpha=0.5)
            
            for i in range(0, len(trayectoria)-1, max(1, len(trayectoria)//10)):
                dx = reales[i+1] - reales[i]
                dy = imaginarios[i+1] - imaginarios[i]
                ax1.arrow(reales[i], imaginarios[i], dx*0.8, dy*0.8,
                         head_width=0.05, head_length=0.1, fc='blue', 
                         ec='blue', alpha=0.5)
            
            if region:
                x_min, x_max = float(region['x_min']), float(region['x_max'])
                y_min, y_max = float(region['y_min']), float(region['y_max'])
            else:
                x_min, x_max = min(reales)-0.5, max(reales)+0.5
                y_min, y_max = min(imaginarios)-0.5, max(imaginarios)+0.5
            
            ax1.set_xlim(x_min, x_max)
            ax1.set_ylim(y_min, y_max)
            ax1.set_xlabel('Parte Real')
            ax1.set_ylabel('Parte Imaginaria')
            ax1.set_title(titulo)
            ax1.grid(True, alpha=0.3)
            ax1.legend()
            ax1.axis('equal')
            
            ax2 = axes[1]
            errores = []
            for punto in trayectoria:
                z = complex(punto.real, punto.imag)
                error = abs(self.funcion(z))
                errores.append(seguro_float(error, 1e-15))
            
            iteraciones = list(range(len(errores)))
            ax2.semilogy(iteraciones, errores, 'r-o', linewidth=2, markersize=4)
            ax2.axhline(y=self.tol, color='g', linestyle='--', 
                       label=f'Tolerancia: {self.tol:.1e}')
            
            ax2.set_xlabel('Iteración')
            ax2.set_ylabel('Error (escala log)')
            ax2.set_title('Convergencia del Error')
            ax2.grid(True, alpha=0.3)
            ax2.legend()
            
            if len(errores) > 1:
                ax2.text(0.05, 0.95, 
                        f'Error inicial: {errores[0]:.2e}\nError final: {errores[-1]:.2e}',
                        transform=ax2.transAxes, verticalalignment='top',
                        bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
            
            plt.tight_layout()
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
                'ratio_convergencia': resultado.ratio_convergencia,
                'ciclos_detectados': resultado.ciclos_detectados,
                'error_relativo_final': resultado.error_relativo_final,
                'tasa_reduccion_error': resultado.tasa_reduccion_error
            },
            'analisis_convergencia': {
                'errores_por_iteracion': resultado.errores_iteracion,
                'errores_relativos': resultado.errores_relativos,
                'trayectoria': [p.to_dict() for p in resultado.trayectoria],
                'longitud_trayectoria': len(resultado.trayectoria)
            },
            'visualizacion_base64': img_base64,
            'recomendaciones': self._generar_recomendaciones(resultado),
            'formula_secante': "zₙ₊₁ = zₙ - f(zₙ) * (zₙ - zₙ₋₁) / (f(zₙ) - f(zₙ₋₁))",
            'condicion_metodo': "f(zₙ) ≠ f(zₙ₋₁)"
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
        
        if resultado.ciclos_detectados > 0:
            recomendaciones.append(f"Se detectaron {resultado.ciclos_detectados} ciclos, considerar cambiar estrategia")
        
        if resultado.error_relativo_final > 0.01:
            recomendaciones.append("Error relativo alto, considerar mayor precisión")
        
        return recomendaciones

app = Flask(__name__)
CORS(app)

solver_global = None

ESTUDIANTES = [
    Estudiante(
        id=1,
        nombre="Callejas Escobar Mauricio Jhostin",
        codigo="123456",
        carrera="Ingeniería de Sistemas"
    ),
    Estudiante(
        id=2,
        nombre="Echeverria Poma Fabricio Oliver",
        codigo="123456",
        carrera="Ingeniería de Sistemas"
    ),
    Estudiante(
        id=3,
        nombre="Tancara Suñagua Joel Hernan",
        codigo="123456",
        carrera="Desarrollo de Software",
        email="tancarajoe@gmail.com"
    )
]

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
            tol=seguro_float(data.get('tol', 1e-12)),
            max_iter=int(data.get('max_iter', 200)),
            estrategia_ciclos=str(data.get('estrategia_ciclos', 'perturbacion_hibrida')),
            usar_derivada_numerica=bool(data.get('usar_derivada_numerica', False))
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Solver configurado exitosamente',
            'configuracion': {
                'expresion_funcion': data['expresion_funcion'],
                'tol': seguro_float(data.get('tol', 1e-12)),
                'max_iter': int(data.get('max_iter', 200)),
                'estrategia_ciclos': data.get('estrategia_ciclos', 'perturbacion_hibrida')
            }
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/ejecutar', methods=['POST'])
def ejecutar_secante():
    if solver_global is None:
        return jsonify({
            'status': 'error',
            'message': 'Solver no configurado'
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
            x0_real=seguro_float(data['x0_real'], 0.5),
            x0_imag=seguro_float(data['x0_imag'], 0.5),
            x1_real=seguro_float(data['x1_real'], 1.0),
            x1_imag=seguro_float(data['x1_imag'], 0.0),
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
                'x_min': seguro_float(data['region']['x_min'], -2),
                'x_max': seguro_float(data['region']['x_max'], 2),
                'y_min': seguro_float(data['region']['y_min'], -2),
                'y_max': seguro_float(data['region']['y_max'], 2)
            },
            n_puntos=int(data.get('n_puntos', 20)),
            distancia_minima=seguro_float(data.get('distancia_minima', 0.05)),
            paralelo=bool(data.get('paralelo', True))
        )
        
        return jsonify({
            'status': 'success',
            'resultado': resultado
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/sensibilidad', methods=['POST'])
def analizar_sensibilidad():
    if solver_global is None:
        return jsonify({
            'status': 'error',
            'message': 'Solver no configurado'
        }), 400
    
    data = request.json
    
    try:
        data = convertir_datos_numericos(data)
        
        resultado = solver_global.analizar_sensibilidad_ruido(
            raiz_real=seguro_float(data['raiz_real']),
            raiz_imag=seguro_float(data['raiz_imag']),
            niveles_ruido=data.get('niveles_ruido', [1e-15, 1e-12, 1e-9, 1e-6, 1e-3]),
            muestras_por_nivel=int(data.get('muestras_por_nivel', 5))
        )
        
        return jsonify({
            'status': 'success',
            'resultado': resultado
        })
    
    except Exception as e:
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
        'tiempo_promedio': seguro_float(solver_global.estadisticas['tiempo_promedio'])
    }
    
    raices_serializadas = []
    for r in solver_global.raices_encontradas:
        raices_serializadas.append({
            'raiz': r['raiz'].to_dict(),
            'veces_encontrada': int(r['contador']),
            'fecha_descubrimiento': seguro_float(r['fecha_descubrimiento'])
        })
    
    return jsonify({
        'status': 'success',
        'estadisticas': estadisticas_serializadas,
        'raices_encontradas': raices_serializadas,
        'historial_count': len(solver_global.historial_ejecuciones)
    })

@app.route('/api/informe/<resultado_id>', methods=['GET'])
def obtener_informe(resultado_id):
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
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 404

@app.route('/api/ejemplos', methods=['GET'])
def obtener_ejemplos():
    ejemplos = [
        {
            'nombre': 'EJEMPLO BÁSICO: Método de la Secante',
            'expresion': 'z**2 - 4',
            'descripcion': 'Ejemplo didáctico: Buscando raíz de f(z)=z²-4. Raíz real en z=2',
            'dificultad': 'baja',
            'explicacion': "FÓRMULA: zₙ₊₁ = zₙ - f(zₙ) * (zₙ - zₙ₋₁) / (f(zₙ) - f(zₙ₋₁))",
            'puntos_iniciales': [
                {'x0': [1.0, 0.0], 'x1': [3.0, 0.0]}
            ]
        },
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
        'version': '4.1',
        'servicio': 'Método de la Secante para Funciones Complejas'
    })

if __name__ == '__main__':
    try:
        solver_global = SecanteComplejoAvanzado(
            expresion_funcion='z**2 - 4',
            tol=1e-12,
            max_iter=100,
            estrategia_ciclos='perturbacion_hibrida'
        )
    except Exception as e:
        print(f"Error inicializando solver: {e}")
    
    app.run(host='localhost', port=5000, debug=True)