# Invitaciones oficiales

Esta carpeta es la **fuente de verdad** de las invitaciones digitales.

Cada invitación mantiene en su propia carpeta el HTML y los recursos gráficos, de audio y video asociados:

- `invitacion_1/`
- `invitacion_2/`
- `invitacion_3/`
- `invitacion_4/`
- `invitacion_5/`

## Reglas

1. Cada invitación debe poder cargar sus recursos desde su propia carpeta.
2. No duplicar en la raíz imágenes, GIF, MP4, MP3 ni HTML que ya existan aquí.
3. `index.html` es la entrada pública de cada invitación.
4. Los HTML base o internos pueden mantenerse si son parte del funcionamiento, pero no deben convertirse en copias globales.
5. La entrada audiovisual debe ocultar controles nativos del navegador y mostrar correctamente el primer fotograma antes de la interacción.
6. Cualquier limpieza debe confirmar duplicidad por SHA o contenido antes de borrar.

## Compatibilidad móvil

Las invitaciones deben probarse al menos en Safari iPhone y Chrome móvil/Android. La experiencia inicial no debe mostrar pantalla vacía, fondo accidental ni icono Play.

## Estado

En agosto de 2026 se consolidaron las invitaciones 1–5 en esta estructura y se retiraron de la raíz las copias exactas confirmadas como duplicadas.
