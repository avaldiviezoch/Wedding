# Auditoría de rendimiento — autenticación y cambio de usuario

Fecha: 18/08/2026

## Alcance

Flujo de inicio de sesión con Google, restauración de sesión, hidratación de datos desde Firestore, cierre/cambio de usuario e interacción del menú principal durante esos estados.

## Cuellos de botella encontrados

1. **Firebase podía ejecutarse más de una vez.** `applu.html` cargaba `firebase.js` con un query string y los módulos de bodas lo importaban con otro. Para el navegador son URLs de módulo distintas, por lo que podían existir múltiples observadores `onAuthStateChanged`, intervalos de autosave y listeners de DOM para la misma sesión.
2. **La autenticación bloqueaba directamente el menú.** Durante `onAuthStateChanged`, la hidratación agregaba `auth-hydrating` y establecía `menuButton.disabled = true` hasta terminar consultas/restauración.
3. **`menu-fast.js` estaba compensando ese bloqueo con polling y MutationObserver.** Una capa deshabilitaba el botón y otra intentaba reactivarlo cada 60 ms. Era una carrera entre módulos, no una arquitectura estable.
4. **El cierre de sesión tenía una ruta crítica larga.** Antes de `signOut()` se esperaba un backup completo en Firestore y una limpieza local; después, el observer de sesión volvía a limpiar datos. Había trabajo duplicado y latencia de red sin límite en la interacción de cambio de usuario.
5. **Varias lecturas independientes de Firestore eran secuenciales.** La validación del espacio/boda activa consultaba índice y membresía una después de otra.
6. **Carga inicial pesada.** `js/legacy/applu-script-01.js` pesa aproximadamente 10.45 MB y se carga antes del módulo Firebase. Sigue siendo deuda técnica importante porque puede ocupar el hilo principal, especialmente en móvil.

## Solución aplicada

- `firebase.js` queda como entrypoint mínimo y todas las variantes históricas convergen en una única URL canónica de `firebase-core.js`.
- La sesión autenticada y la hidratación de datos pasan a ser dos estados distintos: el shell y el menú quedan interactivos inmediatamente; Firestore continúa hidratando sin deshabilitar navegación.
- Se elimina del menú el polling de 60 ms y el MutationObserver usados para combatir el bloqueo. La coordinación pasa a eventos (`migrandia:auth-controller-ready` y `migrandia:auth`).
- Se hace `modulepreload` del core de autenticación desde `menu-fast.js`, por lo que su descarga puede empezar antes de llegar al enorme script legado, sin ejecutarlo prematuramente.
- El guardado final al cerrar sesión tiene un presupuesto máximo de 650 ms; el autosave habitual sigue protegiendo los cambios. La limpieza local queda en una sola ruta posterior al cambio de estado.
- Las lecturas independientes de índice/membresía y validaciones de bodas se paralelizan con `Promise.all`.
- Se agrega protección por `authEpoch` para que una hidratación anterior no publique resultados si la cuenta ya cambió.
- Se añade telemetría ligera disponible en `window.MiGranDiaPerf`.

## Métricas disponibles

En DevTools > Console ejecutar:

```js
window.MiGranDiaPerf.report()
```

Se registran, entre otras:

- `google_popup`: desde clic en Google hasta que Firebase devuelve el usuario.
- `auth_shell_ready`: tiempo del observer hasta que el shell queda interactivo.
- `auth_hydration`: tiempo total de restauración de contexto y datos.
- `logout_final_save_budget`: tiempo consumido por el último intento de guardado antes del logout, acotado a 650 ms.
- `logout_auth_release`: clic de logout hasta liberación de Firebase Auth.
- `user_switch_shell_ready`: desde iniciar logout hasta que el siguiente usuario tiene shell interactivo.

## Comparación estructural antes/después

| Indicador | Antes | Después |
|---|---|---|
| Menú durante hidratación | Deshabilitado explícitamente | Siempre interactivo |
| Instancias potenciales del servicio Firebase | Más de una por query strings diferentes | Un único core canónico |
| Coordinación del menú | MutationObserver + polling 60 ms | Eventos, sin polling |
| Limpieza local en logout | Puede ejecutarse antes y después de `signOut` | Una sola ruta |
| Guardado final de logout | Espera sin límite | Presupuesto máximo 650 ms |
| Índice + membresía Firestore | Secuencial | Paralelo |
| Escritura inicial después de hidratar | Podía extender la ruta crítica | Se agenda fuera de la ruta crítica |

## Criterios de aceptación sugeridos

- Al iniciar sesión con Google, el modal desaparece al resolver Auth y el botón de menú responde mientras los datos siguen sincronizando.
- Durante cambio de usuario, ninguna pulsación sobre el menú requiere recargar la página.
- `auth_shell_ready` debe mantenerse normalmente por debajo de un frame perceptible del observer; la red se refleja en `auth_hydration`, pero ya no debe bloquear navegación.
- `logout_auth_release` no debe quedar secuestrado por un backup de duración indefinida.
- No deben aparecer listeners/acciones duplicadas al iniciar/cerrar sesión repetidamente.

## Deuda técnica siguiente

El archivo legado de ~10.45 MB debe dividirse por módulos funcionales y cargarse bajo demanda. No se eliminó ni se partió en este cambio porque hacerlo junto con autenticación aumentaría innecesariamente el riesgo funcional. Es el siguiente trabajo de rendimiento con mayor impacto potencial sobre el tiempo de interacción inicial, especialmente en iPhone/móvil.
