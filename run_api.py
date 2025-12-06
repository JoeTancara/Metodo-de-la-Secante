import subprocess
import sys
import os

def check_dependencies():
    dependencies = ['Flask', 'Flask-CORS', 'numpy','matplotlib','sympy','scipy']
    
    for dep in dependencies:
        try:
            __import__(dep.lower().replace('-', '_'))
            print(f"{dep} instalado")
        except ImportError:
            print(f"{dep} no encontrado, instalando gooo")
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
    
    print("ok")

def main():
    check_dependencies()
    
    from api import app
    
    print("\nIniciando API   goo")
    print("URL: http://localhost:5000")
    print("\nEndpoints disponibles:")
    print("  http://localhost:5000/api/salud")
    print("  http://localhost:5000/api/estudiantes")
    print("  http://localhost:5000/api/ejemplos")
    
    app.run(host='localhost', port=5000, debug=True, use_reloader=False)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nServidor detenido")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)