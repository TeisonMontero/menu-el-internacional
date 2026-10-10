# Menú · El Internacional

Menú web por pestañas para **El Internacional — Burger & Latin Food** (Taylorsville, UT). Proyecto de prueba.

- Una pestaña por categoría, con buscador, cambio entre español e inglés, y aviso de abierto o cerrado según la hora de Utah.
- Diseñado primero para celular; sin frameworks ni proceso de compilación.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `index.html` | Página |
| `css/styles.css` | Estilos |
| `js/menu-data.js` | Categorías, platos, precios, descripciones y fotos |
| `js/app.js` | Pestañas, búsqueda, idioma y horario |
| `img/categorias/` | Portadas de cada categoría |
| `img/platos/` | Miniaturas de platos |

## Editar el menú

Los precios y platos están en `js/menu-data.js`. Cada categoría tiene `img` (portada, o `null` para usar el fondo de color) y cada plato puede tener `desc` (español e inglés) e `img`.

El horario está al inicio de `js/app.js`, en `HOURS`.

## Ver en local

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python -m http.server 5173
```
