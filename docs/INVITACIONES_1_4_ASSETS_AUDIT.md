# Auditoría de assets y fluidez — Invitaciones 1 a 4

Fecha: 2026-08-18

## Criterio

Cada invitación debe resolver sus imágenes, GIF, audio y video desde su propia carpeta. Se permiten dependencias externas que sean servicios reales (Google Fonts, Google Maps, Apps Script, CDN de librerías), pero no se usan GitHub Raw/GitHub Pages como origen normal de medios que ya existen en la carpeta de la invitación.

## Invitación 1

Hallazgos:
- El HTML pedía varios GIF, audio y video por GitHub Raw aunque esos archivos ya viven en `invitaciones/invitacion_1/`.
- `SOBRE_PROBAR.MP4` se referenciaba desde dos rutas, pero el archivo no existe en el árbol actual.
- El dress code dependía de Google Drive aunque existe `assets/invitacion_1/dres_code_movible_1.gif`.
- `flores_de_sakura.json` vivía en el raíz del repositorio.

Corrección:
- Se conserva el HTML previo como `invitacion_1_base.html`.
- El punto de entrada normaliza todos los medios propios a rutas locales.
- Se copia `flores_de_sakura.json` a la carpeta de la invitación.
- Se elimina la petición rota a `SOBRE_PROBAR.MP4` y se conserva el fallback visual existente.
- El GIF del dress code usa su copia local.
- Los medios pesados dejan de usar `preload=auto` y pasan a `metadata` cuando aplica.

## Invitación 2

Hallazgos:
- La entrada mantenía candidatos hacia GitHub Raw y GitHub Pages aunque `video_entrada.mp4` existe localmente.
- Había una ruta heredada `assets/invitacion_1/` dentro de Invitación 2.
- `entrada_2.png` y `sobre_enviar_confir_2.png` se seguían mencionando aunque no existen con esos nombres en el árbol actual.

Corrección:
- Se conserva el HTML previo como `invitacion_2_base.html`.
- `video_entrada.mp4` queda como fuente oficial y única de la entrada.
- Las tres fotos de historia se copian a `assets/` y las rutas se normalizan.
- El fallback de confirmación usa `invitacion_confirmacion_2.png`, que sí existe localmente.
- Se eliminan los candidatos externos de medios.

## Invitación 3

Hallazgos:
- El wrapper hacía `fetch(..., {cache:'no-store'})`, obligando a descargar de nuevo la base.
- El HTML base apuntaba a GitHub Pages para `video_de_saludo_3.mp4`, `video_de_entrada_3.gif`, la imagen final y la música, aunque todos esos archivos existen en la propia carpeta.
- El GIF de entrada se reiniciaba con `Date.now()`, invalidando el caché en cada reinicio.
- `video_de_entrada_3.gif` pesa ~10.7 MB; `juntos_paris_3.gif` pesa ~22.4 MB y `local_3.gif` ~10 MB. Los dos últimos ya se encuentran fuera del primer render/lazy cuando corresponde.

Corrección:
- La base pasa a `force-cache`.
- Todos los medios propios se convierten a rutas locales antes de renderizar.
- Se elimina el cache-busting dinámico del GIF de entrada y se usa una versión estable.
- Los videos pesados usan `preload=metadata`.
- Se preservan los efectos/ilustraciones adicionales de FAQ.

## Invitación 4

Hallazgos:
- El wrapper usaba `cache:'no-store'`.
- Imágenes y video se pedían a GitHub Raw aunque físicamente todos están en `invitaciones/invitacion_4/`.
- `video_de_saludo_4.mp4` pesa ~11.2 MB y se precargaba completo.

Corrección:
- La base usa `force-cache`.
- Todas las rutas de medios de GitHub Raw/GitHub Pages se transforman a archivos locales antes de construir el DOM.
- El video usa `preload=metadata`.
- Se mantiene el halo visual del wrapper existente.

## Recursos pesados que conviene optimizar después

No se recomprimieron medios para evitar alterar calidad o contenido sin aprobación visual. Los principales candidatos son:
- Invitación 1: `brook.gif` ~9.8 MB y `sake_binks.mp3` ~8 MB.
- Invitación 3: `juntos_paris_3.gif` ~22.4 MB, `video_de_entrada_3.gif` ~10.7 MB y `local_3.gif` ~10 MB.
- Invitación 4: `video_de_saludo_4.mp4` ~11.2 MB.

Una siguiente fase puede convertir GIF pesados a WebM/MP4 manteniendo el aspecto, lo que reduciría significativamente el peso de transferencia.
