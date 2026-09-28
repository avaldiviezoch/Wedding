# Arquitectura de App Integral

`app_integral` es el producto principal de planificación de bodas.

## Estructura

- `applu.html`: shell principal actual.
- `appludesktop.html` / `applumovil.html`: vistas heredadas mientras se consolida una interfaz responsive única.
- `css/legacy/`: CSS existente extraído del HTML, sin reescribir su comportamiento.
- `css/core/`: variables, layout y componentes globales nuevos.
- `css/modules/`: estilos separados por módulo funcional.
- `js/legacy/`: JavaScript heredado extraído del HTML; se mantiene temporalmente para evitar regresiones.
- `js/core/`: arranque, eventos, router, estado y utilidades DOM.
- `js/services/`: Firebase, autenticación, Firestore y almacenamiento local.
- `js/modules/`: lógica de negocio separada por dominio.

## Módulos de negocio

- dashboard
- checklist
- presupuesto
- proveedores
- invitados
- distribucion
- cronograma
- invitaciones (solo gestión; las plantillas viven fuera de `app_integral`)
- musica
- documentos
- configuracion

## Regla desde ahora

No agregar bloques grandes de JavaScript o CSS directamente dentro de los HTML. Todo desarrollo nuevo debe entrar en `js/core`, `js/services`, `js/modules`, `css/core` o `css/modules`. El contenido de `legacy` se irá migrando progresivamente módulo por módulo.
