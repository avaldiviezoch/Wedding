# App Integral de Bodas

Esta carpeta contiene únicamente el planificador integral de bodas.

## Estructura

- `applu.html`: entrada principal actual.
- `css/legacy/`: CSS existente extraído del HTML.
- `css/core/`: variables, layout y componentes globales.
- `css/modules/`: estilos separados por módulo.
- `js/legacy/`: JavaScript heredado todavía no migrado.
- `js/core/`: núcleo de la aplicación.
- `js/services/`: Firebase, autenticación, Firestore y almacenamiento.
- `js/modules/`: lógica por módulo de negocio.
- `ARCHITECTURE.md`: reglas de arquitectura.

## Regla de desarrollo

No volver a agregar bloques grandes de CSS o JavaScript dentro de los HTML. Todo desarrollo nuevo debe ubicarse en `core`, `services` o en el módulo correspondiente. El código de `legacy` se migrará progresivamente para evitar romper funcionalidades existentes.
