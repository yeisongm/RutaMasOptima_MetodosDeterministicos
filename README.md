# Calculadora de Rutas Óptimas

Una aplicación web que permite calcular las rutas más óptimas entre diferentes estaciones, considerando niveles de seguridad y utilizando métodos determinísticos.

## 🚀 Características

- Crear y conectar estaciones con niveles de seguridad personalizados
- Calcular múltiples rutas óptimas entre un punto inicial y final
- Visualización interactiva del grafo de estaciones
- Modos de cálculo para rutas más seguras o más inseguras
- Exportar e importar datos en formato JSON
- Historial de cambios con registro de operaciones
- Interfaz responsive y amigable

## 🛠️ Tecnologías Utilizadas

- HTML5
- Tailwind CSS
- JavaScript (Vanilla)
- vis.js (Para visualización de grafos)

## 📋 Prerrequisitos

- Navegador web moderno
- Node.js y npm instalados
- Servidor web local (opcional)

## 🔧 Instalación

1. Clona el repositorio
```bash
git clone https://github.com/yeisongm/RutaMasOptima_MetodosDeterministicos.git
```

2. Navega al directorio del proyecto
```bash
cd Rutas-Optimas_MetodosDeterministicos
```

3. Instala Tailwind CSS
```bash
npm install tailwindcss @tailwindcss/cli
```

4. Crea un archivo `tailwind.css` y añade:
```css
@import "tailwindcss";
```

5. Compila los estilos CSS
```bash
npx @tailwindcss/cli -i tailwind.css -o output.css --watch
```

6. Asegúrate que tu `index.html` tenga el link al CSS compilado:
```html
<link href="./output.css" rel="stylesheet">
```

7. Abre `index.html` en tu navegador o configura un servidor web local

## 💡 Uso

1. **Crear Estaciones**: 
   - Ingresa un nombre para la estación
   - Asigna un puntaje de seguridad
   - Haz clic en "Agregar estación"

2. **Conectar Estaciones**:
   - Selecciona las estaciones de origen y destino
   - Haz clic en "Unir estaciones"

3. **Configurar Ruta**:
   - Selecciona el punto de inicio
   - Define el punto final
   - Elige el modo de cálculo (más seguro/más inseguro)
   - Especifica la cantidad de rutas a calcular

4. **Calcular Rutas**:
   - Presiona "Calcular rutas" para ver los resultados
   - Visualiza las rutas óptimas en el grafo

## ✨ Funcionalidades Adicionales

- **Exportar/Importar**: Guarda y carga configuraciones de grafos
- **Historial**: Seguimiento de cambios y operaciones realizadas
- **Limpieza**: Opción para reiniciar el grafo y cálculos

## 👥 Autores

- yeisongm

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos para la asignatura de Métodos o Modelos Determinísticos de la Universidad de la Amazonia.

## 🎓 Agradecimientos

- Oscar Pérez, docente de la asignatura Metodos Determinísticos
- Universidad de la Amazonia
