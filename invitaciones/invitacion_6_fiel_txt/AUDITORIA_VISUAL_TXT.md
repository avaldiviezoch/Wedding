# Auditoría visual — Invitación 6 (TXT maduro)

Fuente auditada: `Pasted text(20260826-222912).txt` (3,397 líneas).

## 1. Sistema tipográfico objetivo

- **The Seasons Regular**: títulos editoriales / serif display (Programa, horas del timeline, RSVP principal, Dress Code principal, Regalo principal, Música principal, FAQ principal, Gracias).
- **Eyesome Script**: subtítulos manuscritos (del día, tu asistencia, Formal, regalo, Musicales, Frecuentes, frase final, nombres).
- **Georgia / Times New Roman**: textos corridos, hints, copy de tripulación, botón RSVP, regalo, música, FAQ y créditos.
- **Cormorant Garamond**: bloque de ubicación y copy asociado.
- **Great Vibes**: títulos caligráficos del bloque de ubicación.
- **Open Sans / Arial**: etiquetas de eventos del timeline.

### Hallazgo crítico en GitHub
`inv6_correcta_ultimos_gifs.js` redefine actualmente **The Seasons Regular** y **Eyesome Script** apuntando ambas al archivo `Amsterdam Four_ttf 400.ttf`. Esto altera ancho, altura, saltos de línea y proporción de todos los títulos.

## 2. Ancho de composición

- Contenedor visual máximo recurrente: **680 px**.
- En móvil se trabaja a `width:100%`, con reglas específicas a **540 px** y **390 px**.
- No se debe aplicar un único tamaño global a todos los títulos.

## 3. Ubicación verde

- Contenedor: 100%, máximo 680 px.
- Imagen: 100%, `height:auto`.
- Overlay: `padding:105px 32px 120px`, desplazamiento vertical +20 px.
- Kicker “UBICACIÓN”: Cormorant Garamond, 13 px, tracking 5 px.
- “Ceremonia & Recepción”: Great Vibes, `clamp(52px,11vw,72px)`, line-height .90.
- Copy principal: Cormorant, `clamp(18px,4.5vw,25px)`.
- “Residencia Privada”: Great Vibes, `clamp(46px,10vw,64px)`.
- Dirección: Cormorant, `clamp(18px,4.6vw,24px)`.
- Nota final: Cormorant, `clamp(17px,4.2vw,22px)`.

## 4. Collage de fotos

- Alto escritorio/tablet: `clamp(500px,104vw,710px)`.
- Foto 1: 46%, izquierda 5%, arriba 5%.
- Foto 2: 46%, derecha 4%, arriba 16%.
- <=540 px: alto 106vw; fotos 48%; foto 1 top 4%, foto 2 top 16.5%.

## 5. Tripulación

- Sección siguiente se superpone al collage: margen superior -58 px; <=540: -42 px; <=390: -36 px.
- Título final efectivo: Georgia/Times, negrita 800, cursiva.
- Escritorio: `clamp(17px,2.9vw,24px)`, ancho 56%, top 20.2%.
- Copy: Georgia, cursiva, `clamp(14px,2.5vw,19px)`, ancho 56%, top 33.6%.
- <=540: título 15–19 px, copy 12–15 px.
- <=390: título 16 px, copy 12 px.
- GIF de tripulación sube visualmente hasta `translateY(-70px)`.

## 6. Dress Code

- “Dress Code”: The Seasons Regular, `clamp(48px,10vw,82px)`.
- “Formal”: Eyesome Script; el propio TXT termina fijándolo a **34 px** con inline important.
- Subtítulo: 13 px, line-height 1.32.
- Texto de paleta/blanco: 13 px, line-height 1.38.
- GIF Dress Code: escritorio `clamp(150px,42vw,240px)`; <=540 `clamp(140px,46vw,210px)`.

## 7. Cabecera Programa

- Papel roto: 100%, max 680 px.
- Logo: 30% (<=540:31%; <=390:32%).
- “PROGRAMA”: The Seasons, `clamp(34px,8.5vw,62px)`; <=540 32–46 px; <=390 31 px.
- “del día”: Eyesome Script, `clamp(42px,10.5vw,78px)`; <=540 40–58 px; <=390 40 px.

## 8. Timeline

- Padding: 22/24/54 px; <=540: 18/18/42 px.
- Grid: 1fr / 32 px / 1fr; <=540 centro 24 px.
- Cada fila: min-height 132 px; <=540 126 px; <=390 122 px.
- Hora: The Seasons, `clamp(34px,6vw,52px)`; <=540 28–38 px; <=390 29 px.
- Etiqueta: Open Sans/Arial, `clamp(14px,2.55vw,19px)`; <=540 12–15 px; <=390 12 px.
- GIFs ceremonia/brindis/comida/fiesta/fin: escritorio `clamp(92px,24vw,150px)`; <=540 `clamp(82px,26vw,125px)`.

## 9. RSVP

- “CONFIRMA”: The Seasons, `clamp(48px,10vw,82px)`; <=540 46 px; <=390 43 px.
- “tu asistencia”: Eyesome, `clamp(34px,7vw,58px)`; <=540 36 px; <=390 34 px.
- Gaviota/ave: 105 px; top -70 px; desplazada a la derecha del centro.
- Hint: Georgia, 14 px, cursiva.
- Botón: Georgia, 11 px, padding 15x28, fondo #66703F, radio 999 px.

## 10. Regalo

- Papel roto: ancho 100%, max 680 px, desplazado Y -15%.
- “NUESTRO MEJOR”: The Seasons, `clamp(38px,8vw,62px)`.
- “regalo”: Eyesome, `clamp(42px,9vw,70px)`.
- Copy: Georgia 13 px.
- Botón tipos de regalo: 10 px.
- Panel: 84%, max 350 px; <=390 max 320 px.
- QR: 98 px; <=390 92 px.

## 11. Pedidos musicales

- “PEDIDOS”: The Seasons; el HTML inline del TXT fija `clamp(50px,14vw,78px)`.
- “Musicales”: Eyesome; inline `clamp(30px,9vw,48px)`.
- Copy escritorio: Georgia 18 px; <=540 13 px; <=390 12 px.
- Imagen: holder escritorio hasta 390 px; <=540 270 px; <=390 245 px.
- Formulario: hasta 500 px.

## 12. FAQ

- “PREGUNTAS”: The Seasons; `hardenFaqTitle()` termina fijando `clamp(48px,10vw,82px)`.
- “Frecuentes”: Eyesome, `clamp(34px,7vw,58px)`.
- Pregunta: Georgia, `clamp(16px,3.9vw,24px)`.
- Respuesta: Georgia, `clamp(14px,3.2vw,18px)`.
- <=540: título principal 44–62 px; script 27–40 px; pregunta 13–18 px; respuesta 13 px.

## 13. Cierre

- Foto superior/inferior: full bleed.
- Brook: 86 px; <=540 76 px.
- “¡GRACIAS!”: The Seasons, escritorio `clamp(48px,10vw,82px)`; regla móvil explícita del TXT: 28–42 px.
- Frase manuscrita: Eyesome, escritorio 34–58 px; móvil 19–30 px.
- Logo: 78 px; móvil 68 px.
- Nombres: Eyesome, `clamp(34px,10vw,62px)`; móvil 30–48 px.
- Créditos: 9–10 px.

## 14. GIF sombrero del contador

- Escritorio: `clamp(92px,22vw,138px)`.
- <=540: `clamp(84px,24vw,118px)`.

## 15. Conflictos encontrados entre TXT y GitHub actual

1. Fuentes The Seasons/Eyesome sustituidas por Amsterdam Four.
2. `invitacion_6_base_final.html` contiene `normalizeSectionTitleSizes()` y fuerza tamaños de títulos distintos a una misma referencia.
3. Varias reglas del TXT tienen una versión desktop y otra móvil; una normalización global elimina esa jerarquía.
4. El TXT contiene algunas declaraciones contradictorias entre reglas globales, media queries e inline styles. Para marcha blanca se toma como prioridad la regla específica de cada sección y, en móvil, la regla explícita del breakpoint de esa sección.
5. No se debe tocar RSVP/Firebase ni el flujo musical para corregir proporciones visuales.

## Criterio de corrección

La carpeta `invitacion_6_fiel_txt` debe aplicar esta escala sin modificar la Invitación 6 oficial. Una vez validada visualmente en móvil/tablet/escritorio, recién se plancha sobre la oficial.
