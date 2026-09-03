# Distribución — Fase E · Dimensiones físicas v1

Estado: laboratorio, memory-only.

## Matriz de tablero físico

| Capacidad | Redonda | Cuadrada | Rectangular |
|---:|---:|---:|---:|
| 4 | Ø 0.90 m | 0.90 m | 1.20 × 0.75 m |
| 6 | Ø 1.20 m | 1.20 m | 1.80 × 0.75 m |
| 8 | Ø 1.50 m | 1.50 m | 1.80 × 0.75 m |
| 10 | Ø 1.50 m | 1.80 m | 2.40 × 0.75 m |
| 12 | Ø 1.80 m | 2.00 m | 2.40 × 1.00 m |
| 14 | Ø 2.10 m | 2.20 m | 3.00 × 1.00 m |
| 16 | Ø 2.40 m | 2.40 m | 3.60 × 1.00 m |

## Clearance
El área funcional se mantiene separada del tablero. Se aplica 0.80 m por cada lado (1.60 m total por eje), conservando la semántica TABLETOP ≠ CHAIRS ≠ CLEARANCE.

## Runtime
La geometría funcional `widthM/heightM` se actualiza al cambiar capacidad, cambiar forma y restaurar/importar JSON. Por ello SAT, proximidad y límites de canvas consumen las dimensiones nuevas sin duplicar reglas de colisión.

El contrato histórico `round-current-v1` no se reescribe: permanece como baseline auditable. La capa física v1 es la evolución del motor nuevo.

## Seguridad
Sin Firebase, Firestore, Storage, localStorage, sessionStorage, IndexedDB ni cambios en `app_integral/`.