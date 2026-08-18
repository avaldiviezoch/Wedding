# Archivos de compatibilidad en la raíz

La raíz no debe volver a utilizarse como carpeta general de trabajo. Sin embargo, algunos archivos permanecen temporalmente por compatibilidad o porque su alcance todavía debe verificarse antes de moverlos.

## Entradas públicas

- `applu.html` — entrada pública oficial de Mi Gran Día. La implementación canónica vive en `app_integral/`.
- `appludesktop.html` — redirección de compatibilidad hacia `app_integral/appludesktop.html`.
- `applumovil.html` — redirección de compatibilidad hacia `app_integral/applumovil.html`.
- `index.html` — entrada histórica de GitHub Pages; no debe contener lógica duplicada.

Las antiguas versiones completas de `appludesktop.html` y `applumovil.html` quedaron resguardadas en `app_integral/legacy_snapshots/`.

## Alcance raíz o compatibilidad pendiente

- `wedding-sw.js` — service worker; no mover hasta validar su scope y registros activos.
- `anillo_loop_planifcador.mp4` — se conserva temporalmente porque existen referencias públicas históricas a la ruta raíz; la copia canónica también existe dentro de `app_integral/`.

## Archivos históricos todavía no clasificados como eliminables

Los siguientes archivos no se borran ni mueven a ciegas hasta comprobar todas sus referencias públicas/históricas:

- `invitacion.html`
- `panel_invitaciones.html`
- `rsvp.html`
- `base.png`
- `sello.png`
- `solapa.png`
- `brook_binks.webm`
- `video_de_saludo.mp4`
- `flores rodeadas.json`
- `flores_de_sakura.json`

Estos archivos **no son fuente de verdad** para las invitaciones 1–5 ni para Mi Gran Día. Se consideran compatibilidad/legado pendiente de retiro seguro.

## Regla para retirarlos

Para cada archivo:
1. buscar referencias en HTML, CSS, JS y workflows;
2. verificar URLs públicas históricas que deban conservarse;
3. mover el contenido canónico a la carpeta correspondiente o crear una redirección compatible;
4. probar GitHub Pages;
5. eliminar la copia raíz solo cuando no exista riesgo de 404 o regresión.

No agregar nuevos archivos a esta lista. Todo archivo nuevo debe nacer directamente en su carpeta canónica.
