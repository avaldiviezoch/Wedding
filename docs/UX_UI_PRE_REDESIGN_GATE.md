# Tarea 7A - Gate previo a rediseño

Estado: PRE-REDESIGN GATE / NO IMPLEMENTATION

Fecha: 2026-08-21

Rama: `design/task-7a-visual-baseline`

Base: `main` en `b83a565e66047a9a7e6e551e1888902917fda7a9`

## Decision

Tarea 7A deja preparado el rediseño, pero no autoriza iniciar Tarea 8 automaticamente.

Decision del gate: avanzar solo cuando exista una sesion/dataset controlado para validar las superficies autenticadas criticas.

## Estado por superficie

| Superficie | Gate | Motivo |
| --- | --- | --- |
| Shell publico / entrada | Puede pasar a rediseño controlado | Se observo carga, auth y responsive basico en contexto limpio |
| Auth | Puede pasar con checklist a11y obligatorio | Visualmente fuerte; requiere labels, foco, nombres accesibles y contrato dialog |
| Invitacion publica | Conservar como referencia | Carga limpia; identidad romantica estable; no mezclar con prototipo 3D aun |
| RSVP publico sin token | Conservar estado seguro | Error claro y estable; falta RSVP valido de prueba |
| Panel de invitaciones | No usar como verdad visual final | Tiene muchos recursos fallidos; sirve como herramienta interna, no baseline final |
| Dashboard/Home autenticado | Bloqueado para rediseño definitivo | Falta baseline con sesion real/controlada |
| Invitados/RSVP admin | Bloqueado para rediseño definitivo | Falta dataset de prueba y validacion de flujos criticos |
| Distribucion/Mesas | Bloqueado para rediseño definitivo | Mayor riesgo responsive/interactivo; falta prueba real |
| Configuracion/Equipo | Bloqueado para rediseño definitivo | Flujo sensible de roles/invitaciones pendiente |

## Condiciones para abrir Tarea 8

Tarea 8 puede comenzar si cumple estas condiciones:

1. Alcance escrito y limitado a shell, home/dashboard y componentes base.
2. Prohibicion explicita de tocar Firestore Rules, contratos RSVP, storage keys, deploy y rutas publicas salvo instruccion especifica.
3. Dataset o sesion controlada para revisar Dashboard, Invitados/RSVP admin, Mesas y Configuracion.
4. Checklist responsive para 360, 390, 430, 768, 1024 y 1440.
5. Checklist accesible para foco visible, labels, dialog, Escape, restauracion de foco y reduced motion.
6. Criterio de preservacion visual: mantener tono premium, calido, personal y no generico.
7. Criterio de no regresion: validacion de repositorio y Firestore tests verdes.

## Riesgos si se inicia Tarea 8 sin este gate

- Redisenar solo por estetica y dejar intacta la ambiguedad de navegacion.
- Maquillar Mesas sin resolver interaccion responsive.
- Romper flujos RSVP o reglas implicitas por tocar UI publica sin contrato.
- Duplicar mas CSS correctivo en vez de reducir capas.
- Perder la sensibilidad romantica de la invitacion publica por una interfaz generica.
- Usar el panel de invitaciones como referencia final aunque tenga recursos fallidos.
- Cambiar auth/shell sin probar foco, teclado y dialog.

## Orden recomendado de rediseño futuro

1. Shell/Auth: primer render, menu, dialog, estados globales y accesibilidad base.
2. Dashboard/Home: centro operativo real para la pareja.
3. Componentes base: botones, icon buttons, tabs, fields, cards, lists, modals, toasts y empty states.
4. Invitados/RSVP admin: bandeja, filtros, sincronizacion y feedback de guardado.
5. Invitaciones admin: panel mas confiable, previews con estados y links reales.
6. Mesas/Distribucion: flujo propio por viewport, especialmente mobile.
7. Configuracion/Equipo: roles, permisos, invitaciones pendientes y errores humanos.
8. RSVP publico valido: solo si el alcance lo autoriza y preservando contratos.

## Elementos que deben sobrevivir al rediseño

- Identidad calida, elegante y personal.
- Tono humano de textos importantes.
- Rutas publicas existentes.
- Separacion entre app autenticada y experiencias publicas.
- Contratos `ownerUid` y auth anonima RSVP.
- Estado de error seguro para RSVP invalido.
- Capacidad de abrir invitaciones reales fuera del panel.
- Atmosfera visual premium del shell.
- Jerarquia romantica de la invitacion publica.

## Checklist minimo antes de mergear cualquier rediseño posterior

- `npm run validate` verde.
- Firestore tests verdes.
- Sin cambios no autorizados en `firestore.rules`, `firebase.json`, contratos RSVP o storage keys.
- Sin overflow horizontal en 360/390/430/768/1024/1440.
- Foco visible en controles principales.
- Dialogs con foco inicial, trap, Escape, inert y restore focus.
- `prefers-reduced-motion` respetado.
- Estados loading, empty, error, saving y saved visibles.
- No introducir estetica generica de SaaS/IA.
- No versionar evidencia sensible.

## Cierre del gate

Tarea 7A cumple su funcion si entrega evidencia y decision, no si implementa soluciones. El siguiente paso debe ser una Tarea 8 separada, con alcance aprobado y validacion visual real de las superficies autenticadas.
