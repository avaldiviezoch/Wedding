# Arquitectura de App Integral

`app_integral` es el producto principal de planificación de bodas.

## Estructura

- `applu.html`: shell principal actual.
- `appludesktop.html` / `applumovil.html`: vistas heredadas mientras se consolida una interfaz responsive única.
- `css/legacy/`: CSS extraído del HTML sin alterar su orden.
- `css/core/`: estilos globales nuevos.
- `css/modules/`: estilos nuevos por módulo.
- `js/legacy/`: JavaScript existente extraído del HTML sin reescribir su lógica.
- `js/core/`: núcleo de la aplicación.
- `js/services/`: Firebase y futuros servicios de datos.
- `js/modules/`: lógica de negocio por módulo.

## Regla desde ahora

No agregar lógica grande ni CSS nuevo directamente en los HTML. Cada nueva funcionalidad debe vivir en su módulo correspondiente y consumir servicios compartidos.
