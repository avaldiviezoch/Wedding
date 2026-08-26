# Auditoría técnica — Invitación 6 Marcha Blanca

## Objetivo
Reconstruir la Invitación 6 como una página autónoma, sin iframes ni parches que modifiquen documentos anidados. Esta carpeta es paralela y no reemplaza la invitación oficial.

## Hallazgos del material de referencia
1. La versión anterior dependía de una cadena de documentos anidados (`inv6Work → inviteFrame → inv5`) y acceso a `contentDocument`.
2. Se aplicaban cambios repetidos mediante timers y `MutationObserver`, aumentando el riesgo de dobles listeners, reflow, flicker y estados imposibles de reproducir.
3. Existía lógica que buscaba textos para decidir dónde insertar o eliminar bloques; un cambio de copy podía romper el layout.
4. Había una URL corrupta en una imagen y dependencias a recursos descargados desde otra invitación.
5. La música podía quedar deshabilitada por una bandera global.
6. La entrada dependía de reproducción programática a través de iframes, un patrón frágil en Safari/iOS.
7. GIF pesados elevan consumo de datos, memoria y CPU en móviles.

## Decisiones de la reconstrucción
- Cero `<iframe>`.
- HTML semántico con todas las secciones declaradas una sola vez.
- CSS y JavaScript externos; sin bloques grandes inyectados al DOM.
- Un único listener por interacción propia.
- Entrada activada por gesto real del usuario; si el video falla, la invitación se abre de forma segura.
- Música iniciada desde gesto real, con control visible de pausa/reproducción.
- RSVP y música reutilizan el widget nativo existente y el mismo token, sin cambiar contratos de Firestore, Auth ni Rules.
- Assets reutilizados desde `../invitacion_6/`; no se duplican binarios pesados.
- Imágenes/GIF no críticos usan `loading="lazy"` y `decoding="async"`.
- Enlaces externos usan `rel="noopener noreferrer"`.
- Fecha límite RSVP unificada al 15 de octubre.
- FAQ nativo con `<details>/<summary>`.
- Copiado de datos con Clipboard API y fallback.
- Responsive previsto para 360, 390–430, 768, 1024 y 1440 px.
- Respeta `prefers-reduced-motion`.

## Riesgos que aún deben probarse en marcha blanca
- Prueba real de RSVP en producción y edición posterior de la respuesta.
- Pedido musical asociado al mismo invitado.
- Safari iPhone: reproducción del video de entrada + transición a música.
- Chrome Android: GIF pesados y presión de memoria.
- Carga en 4G: especialmente `dress_code_6_2.gif`, `brook.gif` y otros GIF grandes.
- Confirmar visualmente que todos los assets históricos usados siguen siendo los aprobados.

## Criterios antes de planchar sobre la oficial
1. Entrada funciona en iPhone/Safari y Android/Chrome.
2. RSVP Sí/No/Por confirmar funciona y aparece en Mi Gran Día.
3. Modificar respuesta funciona.
4. Pedido musical se guarda en el mismo response.
5. Música se inicia/pausa sin bloquear navegación.
6. No hay errores de consola relevantes.
7. No hay 404 de assets.
8. Scroll, FAQ, regalo y mapa funcionan en móvil.
9. No hay cambios a Firestore Rules, esquema, tokens, autenticación ni datos.
10. Revisión visual final aprobada.
