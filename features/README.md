# Features - Guía de Uso

Cada feature es un prototipo independiente que se puede desarrollar y probar sin afectar otras features.

## Crear una Nueva Feature

### Paso 1: Crear la estructura

1. Copia la carpeta `TEMPLATE` y renómbrala con el nombre de tu feature (ej: `feature-a`)
2. Edita el archivo `index.html` dentro de tu nueva carpeta

### Paso 2: Registrar la feature

Edita `features-config.js` en la raíz del proyecto y agrega tu feature:

```javascript
const FEATURES = {
    'welcome': {
        name: 'Bienvenida',
        path: 'features/welcome/index.html',
        description: 'Pantalla de bienvenida inicial'
    },
    'feature-a': {  // ← Tu nueva feature
        name: 'Feature A',
        path: 'features/feature-a/index.html',
        description: 'Descripción de Feature A'
    },
};
```

### Paso 3: Desarrollar tu prototipo

Cada feature tiene su propio `index.html` que puede incluir:
- HTML
- CSS (dentro de `<style>` tags)
- JavaScript (dentro de `<script>` tags)
- Referencias a recursos externos (imágenes, fuentes, etc.)

## Navegar entre Features

### Método 1: Selector de Features
- Presiona `Ctrl/Cmd + K` para abrir el selector
- Haz clic en la feature que quieras ver
- Presiona `ESC` para cerrar

### Método 2: URL Hash
- Usa `#feature-key` en la URL (ej: `#feature-a`)
- Útil para compartir links directos a una feature específica

### Método 3: Consola del Navegador
```javascript
router.loadFeature('feature-a');
```

## Estructura de una Feature

```
features/
  feature-a/
    index.html      # Contenido principal (HTML + CSS + JS)
    assets/         # (opcional) Imágenes, fuentes, etc.
      image.png
    styles.css      # (opcional) CSS externo
    script.js       # (opcional) JavaScript externo
```

## Buenas Prácticas

1. **Nombres únicos**: Usa nombres descriptivos y únicos para cada feature
2. **Independencia**: Cada feature debe ser independiente, no dependa de otras
3. **Recursos locales**: Si necesitas imágenes o assets, créalos dentro de la carpeta de la feature
4. **Responsive**: Recuerda que el frame móvil es 360x800px
5. **Testing**: Prueba tu feature antes de hacer demo

## Ejemplo Completo

Ver `features/welcome/` como ejemplo de una feature completa.
