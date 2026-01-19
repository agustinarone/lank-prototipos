# **Planteamiento del problema**

  

Hoy, en Perú, al crear una cuenta bancaria para extracciones, el formulario solo permite ingresar “DNI” y el backend **siempre envía a Tupay document_type = DNI**, aunque el beneficiario tenga otro documento (CE, RUC, PASS).

Esto genera rechazos y fricción operativa (CS) por **limitación del producto**, no por error del usuario.

  

Además, el input actual es poco guiado: no fuerza reglas por tipo de documento ni previene formatos inválidos en el momento de carga.

  

## **Objetivos**

- Permitir que el usuario seleccione el **tipo de documento** (DNI / CE / RUC / PASS) al cargar cuenta de payout en Perú.
    
- Aplicar **validaciones en front** según tipo elegido (numérico y longitud exacta).
    
- Persistir el tipo elegido y el valor en el modelo de datos (sin romper compatibilidad).
    
- En extracción, enviar a Tupay el document_type correcto y el document_id correspondiente.
    
- Reducir tickets de CS por rechazos de documento y mejorar tasa de payouts exitosos.
    

  

## **Fuera de los objetivos**

- Cambiar reglas de negocio de extracción (ej: extracción parcial vs total, límites de Yape/Plin).
    
- Rehacer el flujo completo de “Mis cuentas” o rediseño visual amplio más allá del form actual.
    
- Resolver todos los casos de datos bancarios inválidos (esto es un track separado; acá nos enfocamos en documento).
    

  

# **Solución propuesta**

  

Incorporar en el formulario de “Agregar una cuenta” (PE) un selector de tipo de documento + validaciones front, y modificar el backend para **usar el tipo guardado** al construir el payload hacia Tupay.

  

**Reglas Tupay (por longitud)**

- DNI: numérico 8 dígitos
    
- CE: numérico 9 dígitos
    
- RUC: numérico 11 dígitos
    
- PASS: numérico 12 dígitos
    

  

**Decisión de almacenamiento (según tu definición)**

- Guardar en un nuevo campo document_type el tipo seleccionado.
    
- Guardar en el campo existente DNI el valor ingresado (reutilizado como “document_id” para todos los tipos).
    

  

## **¿Cuáles son los cambios estructurales de alto nivel?**

1. UI: agregar selector “Tipo de documento” antes del input del documento.
    
2. UI: validaciones y mensajes inline para prevenir formatos inválidos.
    
3. Backend: normalización (sanitización) del valor y envío de document_type dinámico según lo guardado.
    
4. Compatibilidad: para cuentas existentes sin document_type, usar fallback controlado (ver Migración).
    

  

## **¿Cuáles son los cambios en el modelo de datos de alto nivel?**

  

### **Nuevo campo (en Cuenta Payout)**

- document_type (texto / option set)
    
    - Valores permitidos: DNI, CE, RUC, PASS
        
    - Solo aplica para cuentas payout de país PE (podemos guardarlo igual para otros países a futuro, pero sin exponer en UI).
        
    

  

### **Campo existente (se mantiene)**

- DNI (texto)
    
    - Se seguirá usando para almacenar el identificador del documento (sea DNI/CE/RUC/PASS).
        
    - Aclaración: debe tratarse como string (no number) para no perder ceros a la izquierda.
        
    

  

### **Reglas de consistencia de datos**

- document_type define la validación de longitud de DNI:
    
    - DNI → len=8
        
    - CE → len=9
        
    - RUC → len=11
        
    - PASS → len=12
        
    
- DNI debe ser solo numérico (para estos tipos) y almacenarse sin separadores.
    

  

## **¿Cuáles son los principales cambios en la interfaz de usuario?**

  

### **Comportamiento del form (PE)**

  

Pantalla actual:

- Nombre y apellido del titular
    
- “Ingresa tu DNI completo” + placeholder “Ej: 12345678”
    

  

Nueva propuesta (misma pantalla, mejor UX):

1. Campo: “Tipo de documento”
    
    - Control: dropdown/selector
        
    - Opciones: DNI, Carnet de extranjería (CE), RUC, Pasaporte (PASS)
        
    - Default: DNI (para no frenar al caso más común)
        
    
2. Campo: “Número de documento”
    
    - Placeholder dinámico según tipo:
        
        - DNI: “Ej: 12345678”
            
        - CE: “Ej: 123456789”
            
        - RUC: “Ej: 12345678901”
            
        - PASS: “Ej: 123456789012”
            
        
    - Teclado numérico (mobile) / permitir solo dígitos
        
    - Contador o hint de longitud: “8 dígitos”, “9 dígitos”, etc.
        
    - Validación inline:
        
        - Si contiene letras/espacios/guiones → error “Ingresá solo números”
            
        - Si longitud incorrecta → error “El DNI debe tener 8 dígitos” (o el tipo correspondiente)
            
        
    - CTA “Siguiente” solo habilitado cuando:
        
        - nombre no vacío (si aplica)
            
        - documento válido según reglas
            
        
    
3. Microcopy de ayuda (debajo del campo documento)
    
    - Texto sugerido:
        
        - “Elegí el tipo de documento del titular de la cuenta. Debe coincidir con el documento registrado en el banco.”
            
        
    

  

### **Nota de UX importante**

- Evitar “DNI completo” como label fijo, porque confunde cuando el tipo es CE/RUC/PASS. Cambiar a “Número de documento”.
    

  

## **Riesgos**

  

**Riesgo 1: Datos históricos sin document_type**

- Impacto: extracción puede seguir enviando DNI por default y fallar.
    
- Mitigación:
    
    - Fallback en backend: si document_type está vacío, derivar por longitud cuando sea inequívoco:
        
        - len=8 → DNI
            
        - len=11 → RUC
            
        - len=12 → PASS
            
        - len=9 → CE (pero es el caso más riesgoso; ver nota abajo)
            
        
    - Logging explícito de “type derivado por longitud”.
        
    

  

**Riesgo 2: Ambigüedad en documentos de 9 dígitos**

- Impacto: algunos 9 dígitos podrían ser “DNI + dígito verificador” vs CE.
    
- Mitigación:
    
    - Si document_type es vacío y len=9:
        
        - derivar CE pero loguear evento “derived_type=CE len=9 legacy”
            
        - opcional: marcar cuenta payout como “requiere confirmación” (si existe mecanismo); si no existe, al menos visibilidad en logs + dashboard CS.
            
        
    - Importante: una vez que el usuario edita la cuenta, se fuerza selección explícita.
        
    

  

**Riesgo 3: Cambio no backwards compatible en integración**

- Impacto: enviar document_type distinto puede cambiar comportamiento en Tupay.
    
- Mitigación:
    
    - Feature flag por país (PE) para habilitar selector y envío dinámico.
        
    - Rollback rápido: volver a forzar DNI (config) sin tocar data.
        
    

  

**¿Hay cambios que no son compatibles con versiones anteriores?**

- No a nivel de datos si:
    
    - el campo nuevo es opcional
        
    - existe fallback para legacy
        
    

  

**¿El proyecto tiene implicaciones especiales para la seguridad y la privacidad de los datos?**

- Sí: documentos de identidad son datos sensibles.
    
- Mitigación:
    
    - En logs: enmascarar document_id (ej: solo últimos 3–4 dígitos) y registrar longitud/tipo.
        
    - Evitar exponer documento completo en herramientas de CS si no es estrictamente necesario.
        
    

  

**¿Este cambio podría aumentar significativamente la carga en cualquiera de nuestros sistemas de backend?**

- No. Son validaciones simples y un campo adicional.
    

  

**¿El proyecto tiene alguna dependencia?**

- Confirmar mapeo exacto de valores aceptados por Tupay (DNI, CE, RUC, PASS) y si son case-sensitive.
    
- Confirmar que document_id debe ser estrictamente numérico para PASS (según tabla, sí; si Tupay permite alfanumérico en PASS, ajustar reglas).
    

  

# **Soluciones alternativas**

1. Mantener solo DNI y “normalizar” truncando/paddeando
    

  

- Pros: rápido.
    
- Contras: incorrecto a nivel de negocio (no respeta documentos reales), y seguiría bloqueando CE/RUC/PASS.
    

  

2. Inferir tipo automáticamente por longitud sin selector
    

  

- Pros: no cambia UI.
    
- Contras: ambigüedad en 9 dígitos, más tickets, menos control y peor experiencia.
    

  

3. Permitir selector solo cuando el documento no es 8 dígitos
    

  

- Pros: reduce fricción para mayoría DNI.
    
- Contras: UX inconsistente, aumenta errores (“por qué a mí me aparece otra cosa”).
    

  

Elegimos solución propuesta por: claridad, prevención de errores en origen y alineación con spec de Tupay.

  

# **Plan de implantación y puesta en marcha**

  

**¿El proyecto requiere migración?**

- No requiere migración dura obligatoria.
    
- Recomendado:
    
    - Backfill opcional de document_type solo para casos inequívocos (len=8/11/12).
        
    - Mantener len=9 como legacy (sin backfill automático) o backfill a CE con logging (según tolerancia de riesgo).
        
    

  

**Plan de implementación (incremental y con rollback)**

1. Backend:
    
    - Agregar campo document_type a Cuenta Payout (opcional).
        
    - Sanitizar document_id antes de enviar:
        
        - trim
            
        - remover espacios/guiones
            
        - validar numérico
            
        
    - Construcción del payload a Tupay:
        
        - document_type = CuentaPayout.document_type (si existe)
            
        - else fallback por longitud (con eventos de observabilidad)
            
        
    
2. Front (PE):
    
    - Agregar selector de tipo + cambio de label/placeholder
        
    - Validación estricta por longitud y numérico
        
    - Bloquear CTA hasta cumplir reglas
        
    
3. Feature flag:
    
    - Activar inicialmente para un % (o solo usuarios internos) si se puede; si no, activar por país con monitoreo fuerte.
        
    
4. Rollback:
    
    - Toggle para volver a forzar document_type=DNI sin revertir UI (o deshabilitar selector) según urgencia.
        
    

  

**¿Este proyecto forma parte de un experimento o es una función destacada?**

- No es experimento: es hardening de un flujo crítico (payouts PE).
    
- Se recomienda release controlado con monitoreo y plan de rollback.
    

  

## **Criterios de éxito**

  

**¿Cómo se verificará que la solución funciona de forma correcta?**

- Casos de prueba manual (mínimo):
    
    - Crear cuenta PE con DNI (8) → extracción exitosa (o request aceptado por Tupay).
        
    - Crear cuenta PE con CE (9) → request enviado con document_type=CE.
        
    - Crear cuenta PE con RUC (11) → request enviado con document_type=RUC.
        
    - Crear cuenta PE con PASS (12) → request enviado con document_type=PASS.
        
    - Intentar letras/guiones → UI bloquea y muestra error.
        
    - Intentar longitudes incorrectas → UI bloquea.
        
    
- Casos legacy:
    
    - Cuenta existente sin document_type:
        
        - len=8 → backend deriva DNI
            
        - len=11 → backend deriva RUC
            
        - len=12 → backend deriva PASS
            
        - len=9 → backend deriva CE y emite evento “legacy_len_9”
            
        
    

  

**¿Qué tipo de supervisión y alertas se llevarán a cabo para garantizar que el rendimiento y la fiabilidad de este proyecto no disminuya?**

- Logging estructurado por intento de payout (PE):
    
    - payout_id
        
    - cuenta_payout_id
        
    - document_type (stored o derived)
        
    - document_length
        
    - documento_enmascarado (últimos 3–4)
        
    - response_code / error_code Tupay
        
    
- Métricas:
    
    - tasa de rechazo por documento (antes vs después)
        
    - distribución de document_type en PE
        
    - porcentaje de payouts con type derivado (debería tender a 0 con el tiempo)
        
    
- Alertas:
    
    - spike de rechazos por error_code relacionado a documento
        
    - spike de “legacy_len_9” (indica data vieja sin corrección)
        
    

---

Próximas acciones

- Confirmar con Tupay el set exacto de valores para document_type y si PASS es estrictamente numérico.
    
- Definir si hacemos backfill automático para longitudes inequívocas (8/11/12) y qué hacemos con len=9.
    
- Implementar backend + logs primero, luego UI PE, y activar con feature flag y monitoreo.

---

# Prototipo funcional

Se creó un **prototipo interactivo** del formulario mejorado para validar la UX antes de implementar en producción.

## Qué incluye el prototipo

### Pantalla 1: Datos del titular y documento
- **Nombre y apellido del titular**: campo requerido, mínimo 3 caracteres.
- **Selector de tipo de documento**: dropdown con opciones DNI, CE, RUC, PASS. Default: DNI.
- **Número de documento**: input con validaciones según tipo:
  - DNI: solo numérico, exactamente 8 dígitos.
  - CE: solo numérico, exactamente 9 dígitos.
  - RUC: solo numérico, exactamente 11 dígitos.
  - PASS: alfanumérico, exactamente 12 caracteres (se normaliza a mayúsculas).
- **Placeholder dinámico** según el tipo seleccionado.
- **Contador de dígitos/caracteres** en tiempo real.
- **Mensajes de error inline** ("Ingresá solo números", "Debe tener X dígitos").
- **CTA "Siguiente" deshabilitado** hasta que todos los campos sean válidos.
- **Microcopy de ayuda** explicando que el documento debe coincidir con el registrado en el banco.

### Pantalla 2: Datos de Yape y banco
- Campo de celular vinculado a Yape (9 dígitos).
- Selector de banco.
- Navegación atrás a la pantalla 1.
- Validaciones mínimas (requerido).

### Pantalla de éxito
- Confirmación visual con los datos enmascarados.

## Qué NO incluye el prototipo

- **Integración con backend**: no se persisten datos ni se envía nada a Tupay.
- **Flujo completo de "Mis cuentas"**: solo el alta de cuenta nueva.
- **Edición de cuentas existentes**.

## Cómo acceder al prototipo

1. Abrir el demo frame en el navegador (`index.html` en la raíz del proyecto).
2. Presionar `Ctrl/Cmd + K` para abrir el selector de features.
3. Seleccionar **"Agregar Cuenta PE (Tupay)"**.

O directamente navegar a:
```
#extracciones-tupay
```

Por ejemplo: `http://localhost:8000/#extracciones-tupay`

## Casos de prueba sugeridos

| Caso | Tipo doc | Input | Resultado esperado |
|------|----------|-------|-------------------|
| DNI válido | DNI | 12345678 | ✅ Pasa, CTA habilitado |
| DNI corto | DNI | 1234567 | ❌ "Debe tener 8 dígitos" |
| DNI con letras | DNI | 1234567A | ❌ "Ingresá solo números" |
| CE válido | CE | 123456789 | ✅ Pasa |
| RUC válido | RUC | 12345678901 | ✅ Pasa |
| PASS válido | PASS | AB1234567890 | ✅ Pasa (se normaliza a mayúsculas) |
| PASS con espacios | PASS | AB 123456 7890 | ❌ Se limpian automáticamente |
| Nombre vacío | - | (vacío) | ❌ "El nombre es requerido" |