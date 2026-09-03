# Distribución — Runtime scope fix

## Problema reproducido
El laboratorio cargaba `app.js` con `type="module"`. Las fases P0–H se cargan después como scripts clásicos y sustituyen funciones como `renderTable`. Con `app.js` encapsulado como módulo, esas sustituciones no alcanzaban el binding real consumido por `render()`. Resultado visible: los controles nuevos podían aparecer, pero el canvas seguía usando el renderer base circular y sus etiquetas rotatorias.

## Corrección
- `app.js` vuelve a cargarse como script clásico dentro del laboratorio.
- se versiona `app.js` para evitar que el navegador reutilice la copia anterior;
- `phase2.html` versiona también el `iframe` y `phase2-host.js`, de modo que el cache bust alcance el documento interno y no solo la carcasa exterior.

## Contratos bloqueantes
1. redonda ↔ cuadrada ↔ rectangular debe cambiar el renderer real del canvas;
2. nombres de invitados permanecen horizontales aunque rote la mesa;
3. números de silla y etiqueta central permanecen legibles hacia arriba;
4. ninguna corrección introduce persistencia real.

## Seguridad
Solo laboratorio `pruebas/distribucion/`, tests y documentación. Sin Firebase, Firestore, Storage, IndexedDB/localStorage/sessionStorage real ni cambios en `app_integral/`.
