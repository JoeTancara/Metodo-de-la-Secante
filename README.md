# Método de la Secante para Funciones Complejas


## 🎯 Características Principales

- Manejo de funciones con multiples raIces
- Analisis de comportamiento en funciones oscilatorias
- Estrategias para evitar ciclos infinitos
- Estudio de convergencia en funciones patologicas
- Visualizacion de trayectoria de aproximaciones
- An´alisis de sensibilidad a ruido num´erico

## 🚀 Tecnologías Utilizadas

### Backend (API RESTful)
- **Python 3.8+**
- **Flask**
- **NumPy**
- **SymPy**
- **Matplotlib**

### Frontend
- **React 18**
- **React Icons**
- **Chart.js**
- **Bootstrap**
- **Axios**

## 🛠️ Instalación y Configuración

### 1. Backend (API Flask)

Instalar dependencias:
```bash
pip install -r requirements.txt
```

Ejecutar servidor:
```bash
python api.py
```

### 2. Frontend

```bash
cd frontend-ok
npm install
npm start
```

### 🎮 Uso de la Aplicación

1. Configuración inicial
   - Ingresar función compleja (ej: `z**3 - 1`)
   - Definir tolerancia (ej: `1e-12`)
   - Seleccionar estrategia anti-ciclos
   - Configurar máximo de iteraciones

2. Ejecución del método
   - Definir puntos iniciales en el plano complejo
   - Usar presets rápidos o valores personalizados
   - Ejecutar método y visualizar resultados

3. Análisis de resultados
   - Ver trayectoria de convergencia
   - Analizar error por iteración
   - Examinar tipo de convergencia
   - Exportar resultados

4. Funciones avanzadas
   - Búsqueda de raíces en una región
   - Análisis de sensibilidad
   - Ejemplos predefinidos
   - Funciones patológicas

## 📊 Ejemplos Predefinidos

Todos los ejemplos están en la pestaña de ejemplos.

### 🧪 Estrategias Anti-Ciclos
- Perturbación Aleatoria: Pequeñas perturbaciones aleatorias
- Reset Completo: Reinicio periódico de puntos
- Híbrido: Combinación de perturbación y reset
- Perturbación Híbrida: Adaptativa con historial
- Adaptativa: Basada en detección automática

## 📈 Métricas y Análisis

Métricas de convergencia:
- Tipo: Lineal, superlineal, cuadrática aproximada
- Ratio promedio: Velocidad de convergencia
- Eficiencia: Relación error/iteraciones
- Estabilidad: Sensibilidad al ruido numérico

Visualizaciones generadas:
- Trayectoria en el plano complejo
- Error vs iteración (escala log)
- Tabla de puntos visitados
- Imagen Base64 de resultados

## 🚨 Notas Importantes

Requisitos del sistema:
- Python 3.8 o superior
- Node.js 18+ y npm 6+
- Navegador moderno (Chrome 80+, Firefox 75+, Edge 80+)

Limitaciones conocidas:
- Funciones muy complejas pueden requerir más iteraciones
- Puntos iniciales muy alejados pueden no converger
- Tolerancias extremadamente bajas pueden afectar rendimiento

## 🔗 Enlaces Útiles

- Documentación de Flask
- Documentación de React
- Documentación de NumPy
- Referencia de funciones complejas