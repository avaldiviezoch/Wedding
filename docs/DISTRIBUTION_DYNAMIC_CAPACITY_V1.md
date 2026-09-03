# Distribución — Fase D · Capacidades dinámicas v1

Estado: laboratorio, memory-only.

## Alcance
Capacidades permitidas: 4, 6, 8, 10, 12, 14 y 16 para mesas redondas, cuadradas y rectangulares.

## Regla de seguridad
Reducir capacidad nunca elimina silenciosamente un invitado. Si existe una asignación en un asiento cuyo número queda fuera de la nueva capacidad, la operación se bloquea e informa los asientos afectados.

Ejemplo: mesa de 10 con invitado en asiento 8 → no puede bajar a 4 hasta mover o liberar ese asiento.

## Identidad
Cambiar capacidad o forma conserva `id/tableId`, posición, rotación, etiqueta, color y todas las asignaciones que continúan dentro del rango permitido.

## Geometría
Esta fase cambia únicamente el número/distribución de sillas. Las dimensiones físicas de los tableros y clearances permanecen temporalmente en los contratos v1 actuales. Las dimensiones por forma/capacidad pertenecen a la fase siguiente.

## JSON
El saneamiento final de sesión conserva capacidades aprobadas hasta 16 y referencias válidas de los asientos 1–16.

## Aislamiento
Sin Firebase, Firestore, localStorage, sessionStorage, IndexedDB ni cambios en `app_integral/`.
