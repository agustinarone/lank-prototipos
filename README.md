# Lank Prototipos

Repositorio para prototipos funcionales y demos para el equipo interno de Lank.

## Descripción

Este repositorio contiene prototipos funcionales que se utilizan para hacer demostraciones con el equipo interno de Lank. Todos los prototipos se muestran dentro de un frame móvil Android (300px x 800px) para simular la experiencia real de la app.

## Estructura

- `index.html` - Frame de presentación principal con el logo de Lank y el frame móvil
- `styles.css` - Estilos del frame de presentación
- `logo-lank.svg` - Logo de Lank (reemplazar con el logo real)
- `prototype-example.html` - Ejemplo de cómo crear un prototipo

## Cómo agregar un prototipo

1. Crea el contenido HTML/CSS/JS de tu prototipo
2. Reemplaza el contenido del div `#prototype-container` en `index.html` con tu prototipo
3. O crea un sistema de routing para navegar entre múltiples prototipos

### Ejemplo rápido:

```html
<!-- En index.html, dentro del div #prototype-container -->
<div class="tu-prototipo">
    <h1>Mi Prototipo</h1>
    <!-- Tu contenido aquí -->
</div>
```

## Deploy

Los prototipos se despliegan automáticamente en Vercel desde la branch `main`. Cada push a `main` genera un nuevo deploy.

## Frame de Presentación

El frame incluye:
- Fondo azul Lank: `rgb(66, 66, 178)`
- Logo de Lank en la esquina superior izquierda
- Frame móvil Android centrado (300px x 800px)
- Diseño responsive para diferentes tamaños de pantalla
