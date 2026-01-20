# **Extracciones Tupay (PE) — Documento + Método (Yape/Plin)**

## **Planteamiento del problema**

Hoy, en Perú, al crear una cuenta bancaria para extracciones, el formulario solo permite ingresar “DNI” y el backend **siempre envía a Tupay `document_type = DNI`**, aunque el beneficiario tenga otro documento (CE, RUC, PASS).

Esto genera rechazos y fricción operativa (CS) por **limitación del producto**, no por error del usuario.

Además, el input actual es poco guiado: no fuerza reglas por tipo de documento ni previene formatos inválidos en el momento de carga.

### **Riesgo UX adicional (detectado en prototipo)**

En un flujo en 2 pasos existe riesgo de que el usuario:
- Paso 1: complete datos personales (nombre/documento) de una persona
- Paso 2: complete datos de cuenta (celular/banco) de otra persona

Resultado: **la transacción falla** porque nombre y documento no coinciden con el titular real de la cuenta Yape/Plin.

## **Objetivos**

- Permitir que el usuario seleccione el **tipo de documento** (DNI / CE / RUC / PASS) al cargar cuenta de payout en Perú.
- Aplicar **validaciones en front** según tipo elegido (formato y longitud).
- Persistir el tipo elegido y el valor en el modelo de datos (sin romper compatibilidad).
- En extracción, enviar a Tupay el `document_type` correcto y el `document_id` correspondiente.
- Reducir tickets de CS por rechazos de documento y mejorar tasa de payouts exitosos.
- Reducir errores por **inconsistencia de titular** entre paso 1 y paso 2 (warning + confirmación visual).
- No ser exclusivo a Yape: soportar **Yape y Plin** en el paso 2.

## **Fuera de los objetivos**

- Cambiar reglas de negocio de extracción (ej: extracción parcial vs total, límites de Yape/Plin).
- Rehacer el flujo completo de “Mis cuentas” o rediseño visual amplio más allá del form actual.
- Resolver todos los casos de datos bancarios inválidos (track separado; acá nos enfocamos en documento + consistencia titular).

---

# **Solución propuesta** *(mantener backend/data tal cual)*

Incorporar en el formulario de “Agregar una cuenta” (PE) un selector de tipo de documento + validaciones front, y modificar el backend para **usar el tipo guardado** al construir el payload hacia Tupay.

**Reglas Tupay (por longitud)** *(mantener; confirmar con Tupay)*

- DNI: numérico 8 dígitos
- CE: numérico 9 dígitos
- RUC: numérico 11 dígitos
- PASS: numérico 12 dígitos

> Nota: hoy el prototipo permite PASS alfanumérico y lo normaliza a mayúsculas. Si Tupay requiere PASS estrictamente numérico, ajustar la validación de front y sanitización de back.

**Decisión de almacenamiento** *(mantener)*

- Guardar en un nuevo campo `document_type` el tipo seleccionado.
- Guardar en el campo existente `DNI` el valor ingresado (reutilizado como “document_id” para todos los tipos).

## **¿Cuáles son los cambios estructurales de alto nivel?** *(mantener)*

1. UI: agregar selector “Tipo de documento” antes del input del documento.
2. UI: validaciones y mensajes inline para prevenir formatos inválidos.
3. Backend: normalización del valor y envío de `document_type` dinámico según lo guardado.
4. Compatibilidad: para cuentas existentes sin `document_type`, usar fallback controlado (ver Migración).

---

# **Modelo de datos** *(mantener)*

## **¿Cuáles son los cambios en el modelo de datos de alto nivel?**

### **Nuevo campo (en Cuenta Payout)**

- `document_type` (texto / option set)
  - Valores permitidos: DNI, CE, RUC, PASS
  - Solo aplica para cuentas payout de país PE (podemos guardarlo igual para otros países a futuro, pero sin exponer en UI).

### **Campo existente (se mantiene)**

- `DNI` (texto)
  - Se seguirá usando para almacenar el identificador del documento (sea DNI/CE/RUC/PASS).
  - Aclaración: debe tratarse como string (no number) para no perder ceros a la izquierda.

### **Reglas de consistencia de datos**

- `document_type` define la validación de longitud de `DNI`:
  - DNI → len=8
  - CE → len=9
  - RUC → len=11
  - PASS → len=12
- `DNI` debe almacenarse sin separadores (sin espacios/guiones).

---

# **Cambios en UI (PE) — especificación para desarrollo (basada en prototipo)**

## **Pantalla 1 (Paso 1): Datos del titular**

**Campos**
- **Nombre y apellido del titular** (requerido, min 3 chars)
- **Tipo de documento** (dropdown): DNI / CE / RUC / PASS (default: DNI)
- **Número de documento** (input):
  - Placeholder dinámico según tipo
  - Normalización: remover espacios/guiones
  - Validación por tipo (longitud exacta + numérico; PASS pendiente según confirmación Tupay)
  - Contador en tiempo real (ej: 4/8)
- **Disclaimer/ayuda**: componente tipo “disclaimer” **colapsable (toggle)**, por defecto abierto.

**CTA**
- “Siguiente” deshabilitado hasta que:
  - nombre sea válido
  - documento sea válido según reglas del tipo

## **Pantalla 2 (Paso 2): Datos de cuenta (Yape/Plin)**

**Orden (importante)**
1. **Alert / Warning** (toggle, por defecto abierto):
   - “Estos datos deben coincidir con el titular de la cuenta que vas a vincular. Si no coinciden, la transacción fallará.”
2. **Datos del titular (solo lectura)**:
   - Mostrar como **inputs no editables** que vienen del paso 1 (para reforzar consistencia):
     - Titular de la cuenta (nombre completo)
     - Documento (tipo + número)
3. **Método de pago** (dropdown): Yape / Plin (requerido)
4. **Celular vinculado** al método seleccionado (input, 9 dígitos, numérico)
5. **Banco** (dropdown, requerido)

**Validación**
- método: requerido
- celular: requerido, 9 dígitos, solo numérico
- banco: requerido

**Navegación**
- Back vuelve a Paso 1 (sin perder lo ya completado).

## **Pantalla de éxito**

- Confirmación visual.
- Mostrar método (Yape/Plin) y documento enmascarado (últimos 4).

---

# **Riesgos** *(mantener)*

## **Riesgo 1: Datos históricos sin `document_type`**

- Impacto: extracción puede seguir enviando DNI por default y fallar.
- Mitigación [no estoy seguro que este sea el mejor proceso para mitigar el riesgo]:
  - Fallback en backend: si `document_type` está vacío, derivar por longitud cuando sea inequívoco:
    - len=8 → DNI
    - len=11 → RUC
    - len=12 → PASS
    - len=9 → CE (pero es el caso más riesgoso; ver nota abajo)
  - Logging explícito de “type derivado por longitud”.

## **Riesgo 2: Ambigüedad en documentos de 9 dígitos**

- Impacto: algunos 9 dígitos podrían ser “DNI + dígito verificador” vs CE.
- Mitigación:
  - Si `document_type` es vacío y len=9:
    - derivar CE pero loguear evento `derived_type=CE len=9 legacy`
    - opcional: marcar cuenta payout como “requiere confirmación” (si existe mecanismo); si no existe, al menos visibilidad en logs + dashboard CS.
  - Importante: una vez que el usuario edita la cuenta, se fuerza selección explícita.

## **Riesgo 3: Cambio no backwards compatible en integración**

- Impacto: enviar `document_type` distinto puede cambiar comportamiento en Tupay.
- Mitigación:
  - Feature flag por país (PE) para habilitar selector y envío dinámico.
  - Rollback rápido: volver a forzar DNI (config) sin tocar data.

## **¿Hay cambios que no son compatibles con versiones anteriores?** *(mantener)*

- No a nivel de datos si:
  - el campo nuevo es opcional
  - existe fallback para legacy



## **¿El proyecto tiene alguna dependencia?** *(mantener)*

- Confirmar mapeo exacto de valores aceptados por Tupay (`DNI`, `CE`, `RUC`, `PASS`) y si son case-sensitive.
- Confirmar que `document_id` debe ser estrictamente numérico para PASS (si Tupay permite alfanumérico en PASS, ajustar reglas).


---

# **Plan de implantación y puesta en marcha** *(mantener)*

## **¿El proyecto requiere migración?**

- No requiere migración dura obligatoria.
- Recomendado:
  - Backfill opcional de `document_type` solo para casos inequívocos (len=8/11/12).
  - Mantener len=9 como legacy (sin backfill automático) o backfill a CE con logging (según tolerancia de riesgo).

## **Plan de implementación (incremental y con rollback)**

1. Backend:
  - Agregar campo `document_type` a Cuenta Payout (opcional).
  - Sanitizar `document_id` antes de enviar:
    - trim
    - remover espacios/guiones
    - validar numérico
  - Construcción del payload a Tupay:
    - `document_type = CuentaPayout.document_type` (si existe)
    - else fallback por longitud (con eventos de observabilidad)

2. Front (PE):
  - Agregar selector de tipo + cambio de label/placeholder
  - Validación estricta por longitud y numérico
  - Bloquear CTA hasta cumplir reglas
  - Paso 2: método (Yape/Plin) + warning + datos del titular read-only

3. Feature flag:
  - Activar inicialmente para un % (o solo usuarios internos) si se puede; si no, activar por país con monitoreo fuerte.

4. Rollback:
  - Toggle para volver a forzar `document_type=DNI` sin tocar data.

---

## **Criterios de éxito** *(mantener + ampliar con método)*

### **¿Cómo se verificará que la solución funciona de forma correcta?**

**Casos de prueba manual (mínimo):**
- Crear cuenta PE con DNI (8) → extracción exitosa (o request aceptado por Tupay).
- Crear cuenta PE con CE (9) → request enviado con `document_type=CE`.
- Crear cuenta PE con RUC (11) → request enviado con `document_type=RUC`.
- Crear cuenta PE con PASS (12) → request enviado con `document_type=PASS`.
- Intentar letras/guiones → UI bloquea y muestra error.
- Intentar longitudes incorrectas → UI bloquea.
- Paso 2: elegir Yape y completar celular/banco → habilita CTA y permite continuar.
- Paso 2: elegir Plin y completar celular/banco → habilita CTA y permite continuar.
- Paso 2: verificar que los datos del titular aparecen como **solo lectura** (no editables).

**Casos legacy:**
- Cuenta existente sin `document_type`:
  - len=8 → backend deriva DNI
  - len=11 → backend deriva RUC
  - len=12 → backend deriva PASS
  - len=9 → backend deriva CE y emite evento `legacy_len_9`

---


# **Prototipo funcional (referencia)**

Se creó un **prototipo interactivo** del formulario mejorado para validar la UX antes de implementar en producción.

## **Cómo acceder**

1. Abrir el demo frame en el navegador (`index.html` en la raíz del proyecto).
2. Presionar `Ctrl/Cmd + K` para abrir el selector de features.
3. Seleccionar **“Agregar Cuenta PE (Tupay)”**.

O navegar a:

```
#extracciones-tupay
```

## **Qué incluye**

### Pantalla 1
- Nombre + selector tipo doc + número doc con validación.
- Disclaimer (toggle).

### Pantalla 2
- Warning (toggle) arriba.
- Datos del titular read-only (inputs deshabilitados).
- Método Yape/Plin + celular + banco.

### Éxito
- Confirmación con documento enmascarado.

## **Qué NO incluye**

- Integración con backend (no persiste, no llama a Tupay).
- Flujo completo de “Mis cuentas”.
- Edición de cuentas existentes.

