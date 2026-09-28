# Multi-boda y colaboración

## Modelo
Cada cuenta Firebase es independiente. Los datos pertenecen a una boda (`weddings/{weddingId}`), no al usuario. Un usuario puede crear varias bodas y participar en varias bodas de terceros.

## Roles
- **Propietario (`owner`)**: control total, administra equipo, puede asignar administradores y es el único que puede modificar/eliminar la boda.
- **Administrador (`admin`)**: edita el planificador y gestiona editores, proveedores y lectores. No puede modificar al propietario ni crear/quitar otros administradores.
- **Editor (`editor`)**: puede modificar la información operativa de la boda, sin administrar accesos.
- **Proveedor (`provider`)**: rol externo. Actualmente queda sin escritura global; los permisos por módulo se habilitarán al separar cada dominio de datos.
- **Solo lectura (`viewer`)**: consulta sin escritura.

## Wedding planner
Un wedding planner debe usar normalmente el rol **Administrador**. Su cuenta puede tener múltiples bodas de clientes y cambiar entre ellas desde “Mis bodas y accesos”.

## Seguridad
Las reglas Firestore autorizan escritura global del planificador solo a `owner`, `admin` y `editor`. `provider` y `viewer` no pueden escribir la copia global.
