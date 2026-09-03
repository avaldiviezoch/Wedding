# Distribución — matriz de acomodos de sillas

## Objetivo

Cada combinación de forma y capacidad debe tener una distribución de sillas explícita, verificable y físicamente coherente. No se usa una división genérica de N sillas entre lados como fuente de verdad.

Capacidades soportadas: 4, 6, 8, 10, 12, 14 y 16.

## Redonda

Todas las capacidades usan reparto radial uniforme. Cada una ofrece dos orientaciones:

- `default`: primera silla arriba.
- `offset`: patrón desplazado medio paso angular.

Esto cubre 4, 6, 8, 10, 12, 14 y 16 sillas sin perder simetría.

## Cuadrada

El orden es superior · derecha · inferior · izquierda.

| Sillas | Acomodos |
|---:|---|
| 4 | 1·1·1·1 |
| 6 | 2·1·2·1 / 1·2·1·2 |
| 8 | 2·2·2·2 |
| 10 | 2·3·2·3 / 3·2·3·2 |
| 12 | 3·3·3·3 |
| 14 | 4·3·4·3 / 3·4·3·4 |
| 16 | 4·4·4·4 |

El patrón histórico de 10 sillas 2·3·2·3 se conserva como predeterminado.

## Rectangular

El orden es lado largo superior · extremo derecho · lado largo inferior · extremo izquierdo.

| Sillas | Acomodos |
|---:|---|
| 4 | 2·0·2·0 / 1·1·1·1 |
| 6 | 2·1·2·1 / 3·0·3·0 |
| 8 | 3·1·3·1 / 4·0·4·0 |
| 10 | 4·1·4·1 / 5·0·5·0 |
| 12 | 5·1·5·1 / 4·2·4·2 / 6·0·6·0 |
| 14 | 6·1·6·1 / 5·2·5·2 / 7·0·7·0 |
| 16 | 7·1·7·1 / 6·2·6·2 / 8·0·8·0 |

El patrón histórico rectangular de 10 sillas 4·1·4·1 se conserva como predeterminado.

## Contratos

- La cantidad renderizada siempre coincide exactamente con `capacity`.
- Ningún acomodo contiene posiciones duplicadas.
- Cambiar acomodo no cambia `tableId`, posición, rotación, invitados ni capacidad.
- Cambiar forma/capacidad normaliza automáticamente el acomodo a uno válido para el nuevo caso.
- Las etiquetas permanecen horizontales aunque la mesa rote.
- El laboratorio continúa memory-only y no introduce persistencia real.