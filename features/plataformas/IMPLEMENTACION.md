# Implementación: Mejora Search Bar en /plataformas

**Fecha:** 20 de enero, 2026  
**Feature:** `plataformas`  
**Ruta:** `features/plataformas/index.html`

---

## Resumen

Se implementó una nueva feature `/plataformas` que mejora la UX del buscador de plataformas con:
- Búsqueda case & accent insensitive
- Dropdown predictivo con empty state
- Modal de solicitud de nuevas plataformas
- Lupa decorativa (no clickeable)

---

## Cambios Implementados

### 1. Nueva Feature: `features/plataformas/index.html`

#### Estructura HTML
- **Header**: Saludo personalizado + botón "Ver coronas" + logo Lank
- **Search Bar**: Input con placeholder "¿Qué suscripción buscás?" + ícono de lupa a la izquierda
- **Dropdown Predictivo**: Se muestra debajo del input cuando hay 2+ caracteres
- **Grid de Plataformas**: Grilla de 3 columnas con cards clickeables
- **Bottom CTA**: Sección "¿Buscas una suscripción que no tenemos?" con botón
- **Modal de Solicitud**: Popup para recomendar nuevas plataformas

#### Funcionalidades JavaScript

**Normalización de texto:**
```javascript
function normalize(text) {
    return text
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Elimina diacríticos (á→a, ñ→n, etc.)
        .replace(/\s+/g, " "); // Colapsa espacios múltiples
}
```

**Características:**
- ✅ Case insensitive: "NETFLIX" = "netflix" = "Netflix"
- ✅ Accent insensitive: "estandar" = "Estándar"
- ✅ Mantiene caracteres especiales: "Disney+" mantiene el "+"
- ✅ Precomputa `searchKey` para cada plataforma al inicio

**Filtrado:**
- Mínimo 2 caracteres para mostrar dropdown
- Máximo 10 resultados en el dropdown
- Búsqueda por `contains` (no exact match)

**Empty State:**
- Si no hay resultados y hay 2+ caracteres → muestra empty state dentro del dropdown
- Título: `No encontramos "{query}"`
- Subtítulo: `Podés solicitarla y la sumamos`
- CTA: `Solicitar plataforma` → abre modal y **prellena** el input con la query

**Navegación con teclado:**
- `ArrowDown` / `ArrowUp`: Navegar entre resultados
- `Enter`: Selecciona el primer resultado (o el seleccionado)
- `Escape`: Cierra dropdown y modal

**Modal de Solicitud:**
- Se abre desde:
  - Empty state del dropdown (con query prellenada)
  - Botón inferior "¡Solicítala aquí y la creamos!"
- Se cierra con:
  - Botón "×"
  - Click fuera del modal
  - Tecla `Escape`

### 2. Registro en `features-config.js`

Se agregó la entrada:
```javascript
'plataformas': {
    name: 'Buscador Plataformas',
    path: 'features/plataformas/index.html',
    description: 'Buscador predictivo con empty state y solicitud de nuevas plataformas'
}
```

---

## Criterios de Aceptación Verificados

| Criterio | Estado | Notas |
|----------|--------|-------|
| Case insensitive | ✅ | "NETFLIX", "netflix", "Netflix" → todos matchean |
| Accent insensitive | ✅ | "estandar" → "Estándar" |
| Empty state en dropdown | ✅ | Muestra mensaje + CTA cuando no hay resultados |
| Prefill modal desde empty state | ✅ | El input del modal se prellena con la query |
| Lupa no clickeable | ✅ | `pointer-events: none`, solo decorativa |
| Input vacío sin dropdown | ✅ | No muestra dropdown si hay < 2 caracteres |
| Enter selecciona primer resultado | ✅ | Si hay resultados, Enter navega al primero |

---

## Datos de Plataformas

El dataset incluye ~60 plataformas predefinidas en `RAW_PLATFORMS`:
- Streaming: Netflix, Disney+, HBO Max, Prime Video, etc.
- Música: Spotify, Apple Music, Tidal, etc.
- Software: ChatGPT, Canva Pro, Adobe, etc.
- Gaming: Steam, Xbox Game Pass, PlayStation Plus, etc.

**Nota:** En producción, este array debería venir de una API/backend.

---

## Estilos CSS

### Variables principales:
- `--primary: #4242B2` (azul oscuro)
- `--orange: #F5A623` (naranja)
- `--bg-color: #4242B2` (fondo de la feature)

### Grid de Cards:
- 3 columnas (`grid-template-columns: repeat(3, 1fr)`)
- Gap: `8px`
- Altura fija: `48px` por card
- Font size: `11px`
- Border radius: `6px`

### Search Input:
- Altura fija: `48px`
- Padding izquierdo: `38px` (para el ícono de lupa)
- Font size: `15px`
- Ícono de lupa: `20px`, color gris, posición izquierda

---

## Cómo Probar

### Acceso local:
1. Iniciar servidor: `python3 -m http.server 8000`
2. Navegar a: `http://localhost:8000/#plataformas`
3. O usar el selector de features: `Cmd+K` → "Buscador Plataformas"

### Casos de prueba:

**1. Búsqueda case insensitive:**
- Escribir "NETFLIX" → debe mostrar "Netflix"
- Escribir "netflix" → debe mostrar "Netflix"

**2. Búsqueda accent insensitive:**
- Escribir "estandar" → debe mostrar "Estándar" (si existe)
- Escribir "disney" → debe mostrar "Disney+"

**3. Empty state:**
- Escribir "xyz123" (término que no existe)
- Debe aparecer dropdown con: "No encontramos 'xyz123'"
- Click en "Solicitar plataforma" → abre modal con "xyz123" prellenado

**4. Lupa:**
- El ícono de lupa NO debe ser clickeable
- No debe tener hover effect ni cursor pointer

**5. Enter key:**
- Escribir "netflix" → presionar Enter → debe navegar a Netflix (alert en prototipo)

**6. Input vacío:**
- Borrar todo el texto → dropdown debe desaparecer
- La grilla debe seguir visible normalmente

---

## Notas Técnicas

### Normalización de caracteres especiales:
- `ñ` → `n` (normalización NFD)
- `ü` → `u`
- `+` se mantiene (no se elimina)
- Espacios múltiples se colapsan a uno solo

### Performance:
- `searchKey` se precomputa una vez al cargar la página
- Filtrado es O(n) pero con dataset pequeño (~60 items) es instantáneo
- Dropdown limitado a 10 resultados para evitar scroll largo

### Accesibilidad:
- Input tiene `autocomplete="off"` para evitar interferencias del navegador
- Dropdown se cierra al hacer click fuera
- Modal se cierra con Escape
- Navegación por teclado (Arrow keys + Enter)

### Prototipo vs Producción:
- **Navegación**: Actualmente muestra `alert()` al seleccionar una plataforma. En producción, debería navegar a una ruta real (ej: `/plataformas/netflix`).
- **Solicitud**: El modal muestra `alert()` al enviar. En producción, debería hacer POST a un endpoint.
- **Datos**: El array `RAW_PLATFORMS` es hardcodeado. En producción, debería venir de una API.

---

## Próximos Pasos (Fuera de Scope)

1. **Backend Integration:**
   - Endpoint para obtener lista de plataformas
   - Endpoint POST para solicitar nuevas plataformas
   - Campo `search_key` precomputado en base de datos

2. **Navegación Real:**
   - Reemplazar `alert()` por navegación real a detalle de plataforma
   - Implementar routing interno

3. **Mejoras de UX:**
   - Loading state mientras se busca
   - Debounce en el input (actualmente busca en cada keystroke)
   - Historial de búsquedas recientes

4. **Analytics:**
   - Trackear búsquedas sin resultados
   - Trackear clicks en "Solicitar plataforma"
   - Trackear conversión desde empty state

---

## Archivos Modificados

1. **Nuevo:** `features/plataformas/index.html` (feature completa)
2. **Modificado:** `features-config.js` (registro de nueva feature)

---

## Contacto

Para dudas sobre la implementación, revisar:
- Spec original del producto
- Este documento
- Código en `features/plataformas/index.html`
