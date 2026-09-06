# Backend MySQL en Alwaysdata (gratis)

La app **no se conecta directo a MySQL desde el navegador** (los navegadores lo bloquean).
Por eso usa este archivo `api.php` como puente HTTP.

## Pasos (5 minutos)

1. Entra a https://www.alwaysdata.com y crea tu cuenta gratis.
2. Crea una base de datos MySQL y anota: host, nombre, usuario y contrasena.
3. En phpMyAdmin ejecuta el archivo `schema.sql` (crea la tabla `registros`).
4. Sube `api.php` a tu hosting (ej: `https://TU_USUARIO.alwaysdata.net/api.php`).
5. Edita en `api.php`: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
6. Prueba en el navegador: `.../api.php?action=ping` debe devolver `{"ok":true,...}`.
7. En la app Flutter pega esa URL en el campo "URL de la API" y pulsa Probar Conexion.

## Seguridad

Puedes poner un `API_TOKEN` en `api.php` y agregarlo en la app como
`?token=TU_TOKEN` al final de la URL para que solo tu app inserte datos.
