# QA mínimo antes de publicar

## Mi Gran Día / Applu

- Abrir `applu.html` desde cero, sin caché previa.
- Probar login Google y correo/contraseña.
- Confirmar que solo un módulo quede activo a la vez.
- Verificar menú, navegación rápida, scroll y cierre de modales.
- Revisar 360, 390–430, 768, 1024 y 1440 px.
- Confirmar que invitados, mesas y distribución sigan vinculados.
- Verificar lectura/escritura en Firebase/Firestore cuando corresponda.
- Revisar consola: sin errores, recursos 404 ni listeners duplicados evidentes.

## Invitaciones 1–5

- Abrir cada `invitaciones/invitacion_N/` desde Safari iPhone y Chrome móvil.
- Confirmar que la primera pantalla se ve antes del primer toque.
- No debe aparecer icono Play, controles nativos ni pantalla beige/vacía.
- El toque inicial debe iniciar la experiencia y audio cuando corresponda.
- Revisar scroll completo hasta el final.
- Probar enlaces, mapas, RSVP, música y formularios.
- Confirmar que cada invitación carga assets desde su propia carpeta.

## Limpieza y rutas

- No deben existir copias de assets de invitaciones en la raíz si ya viven en `invitaciones/invitacion_N/`.
- Antes de borrar una ruta antigua, verificar workflows y referencias.
- Comprobar que no existan 404 de imágenes, audio, video, CSS o JS.
- Confirmar que GitHub Pages resuelve correctamente las rutas relativas.

## Visual

- Sin flash de interfaces antiguas.
- Sin cambios globales de tipografía/tamaño al cambiar de módulo.
- Sin overlays invisibles bloqueando clic o scroll.
- Sin `overflow:hidden` global innecesario.
- Estados hover/focus/active coherentes.

## Cierre

Registrar:
- commit final;
- archivos modificados;
- pruebas realizadas;
- riesgos o deuda pendiente en `agent/DEBT.md` si aplica.
