# Lank Prototipos

Repositorio para prototipos funcionales y demos para el equipo interno de Lank.

## Descripción

Este repositorio contiene prototipos funcionales que se utilizan para hacer demostraciones con el equipo interno de Lank. Todos los prototipos se muestran dentro de un frame móvil Android (360px x 800px) para simular la experiencia real de la app.

**Cada feature es independiente** - puedes trabajar en una feature sin afectar otras.

## Estructura del Proyecto

```
/
├── index.html              # Frame de presentación principal
├── styles.css              # Estilos del frame de presentación
├── app.js                  # Sistema de routing para features
├── features-config.js      # Configuración de features disponibles
├── features/               # Carpeta con todas las features
│   ├── welcome/           # Feature de bienvenida (ejemplo)
│   ├── TEMPLATE/          # Template para crear nuevas features
│   └── README.md          # Guía detallada de uso
└── imgs/
    └── lank-logo.svg      # Logo de Lank
```

## Sistema de Features

Cada feature es un prototipo independiente que vive en su propia carpeta dentro de `features/`. Esto permite:

- ✅ Trabajar en múltiples features sin conflictos
- ✅ Cambiar entre features fácilmente
- ✅ Compartir links directos a features específicas
- ✅ Mantener el código organizado y modular

## Crear una Nueva Feature

### Paso 1: Crear la estructura
```bash
# Copia el template
cp -r features/TEMPLATE features/mi-feature
```

### Paso 2: Registrar en features-config.js
```javascript
const FEATURES = {
    'mi-feature': {
        name: 'Mi Feature',
        path: 'features/mi-feature/index.html',
        description: 'Descripción de mi feature'
    },
};
```

### Paso 3: Desarrollar
Edita `features/mi-feature/index.html` con tu prototipo (HTML + CSS + JS).

📖 **Ver guía completa**: `features/README.md`

## Navegar entre Features

### Método 1: Selector de Features (Recomendado)
- Presiona **`Ctrl/Cmd + K`** para abrir el selector
- Selecciona la feature que quieras ver
- Presiona **`ESC`** para cerrar

### Método 2: URL Hash
Usa `#feature-key` en la URL:
```
http://localhost:8000/#mi-feature
```

### Método 3: Consola del Navegador
```javascript
router.loadFeature('mi-feature');
```

## Desarrollo Local

```bash
# Iniciar servidor local
python3 -m http.server 8000

# Abrir en navegador
open http://localhost:8000
```

## Deploy

Los prototipos se despliegan automáticamente en Vercel desde la branch `main`. Cada push a `main` genera un nuevo deploy.

## Frame de Presentación

El frame incluye:
- Fondo azul Lank: `rgb(66, 66, 178)`
- Logo de Lank en la esquina superior izquierda
- Frame móvil Android centrado (360px x 800px - dimensiones fijas)
- Sistema de routing para cambiar entre features

## Ejemplos

- `features/welcome/` - Feature de bienvenida
- `features/TEMPLATE/` - Template para nuevas features
