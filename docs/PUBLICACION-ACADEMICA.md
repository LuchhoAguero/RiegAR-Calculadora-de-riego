# Publicación académica y continuidad de datos

Demo aislada: Netlify sirve React, Render ejecuta Express y Knex accede a MySQL mediante TLS verificado. Cada despliegue se vincula a la rama demo-academica de su repositorio. La aplicación original conserva el descriptor V1. La demo académica local, el modelo, las instrucciones de usuario y el guion de ocho minutos están en la [guía académica](MVP-ACADEMICO-GUIA.md).

## Publicación existente

El frontend público es https://riegar-academico.netlify.app y la API es https://riegar-api-demo.onrender.com. DEMO-02 verificó HTTP 200 en ambos y en /api/ready. CORS_ORIGIN usa el origen Netlify sin acento. VITE_API_URL usa el origen Render. La CA completa conserva sus delimitadores PEM. El backend publicado usa node src/staging-server.js.

El esquema académico y sus dos cuentas ya están preparados. La cuenta migradora quedó bloqueada y el runtime tiene SELECT sobre simulaciones. El ensayo mínimo de tres POST fue aprobado y completado con una cuenta y una finca sintéticas, respuestas 201/200/201 y capacidad autenticada de creación V2 deshabilitada. La restauración o creación de otro destino conserva su autorización independiente.

## Referencia de configuración inicial

1. En Netlify, elegí el equipo Free, vinculá únicamente el repositorio frontend y usá demo-academica como rama de publicación. Reservá el origen HTTPS del sitio para CORS antes de lanzar el build. El build usa netlify.toml y requiere VITE_API_URL con el origen HTTPS exacto de Render, sin barra final. public/_redirects aporta el fallback de React Router al recargar rutas.
2. Confirmá el destino de escritura: esquema nuevo riegar_academic_staging, cuenta de runtime riegar_staging_runtime, cinco migrations y lock libre. Usá una cuenta de migrations distinta y revocá su acceso operativo cuando terminen las tareas aprobadas. Sembrá solo datos sintéticos para la facultad. El esquema Aiven defaultdb preexistente tiene datos ajenos a ese ensayo y la cuenta comprobada tiene permisos globales y GRANT OPTION.
3. En Render, creá un servicio Free con el repo backend, rama demo-academica y el Blueprint render.yaml. Configurá un JWT exclusivo, CORS_ORIGIN con el origen exacto de Netlify y el destino SQL con CA oficial en DB_SSL_CA_PEM y verificación de hostname. DB_HOST y RIEGAR_STAGING_DB_HOST deben ser idénticos. Gestioná el password de runtime y JWT en el panel privado. Dejá RIEGAR_DEMO_ENABLE_V2 en false para la primera publicación.
4. Confirmá en Render que el servicio usa el commit aprobado y que GET /api/health y GET /api/ready responden 200. El entrypoint valida la identidad SQL y el cifrado antes de abrir el puerto. Probá OPTIONS desde el origen autorizado y desde uno distinto, y GET /api/fincas sin token. Confirmá que la API informa 401 sin token, y que contacto indica indisponibilidad de correo.
5. Publicá el frontend cuando ambas URLs existan. Comprobá acceso directo y recarga de /login, /registro, /fincas y una ruta de detalle. Registrá dos cuentas sintéticas y probá login, una finca propia, aislamiento de ownership y accesos Manning. Probá historial y detalle con históricos sintéticos V1/V2 previamente acreditados. No compartas los identificadores de sesión.
6. El frontend público bloquea POST V2. La build `staging` muestra `/demo/simulacion-v2` y `/demo/resultados-v2` como recorrido educativo sin API, reutilizando el fixture oficial GV2-01. Los cambios de entradas no recalculan el fixture. Para activar un ensayo real futuro, se requiere autorización separada, cliente que compruebe capacidad autenticada/contrato/modelo/hash, composición V2 explícita de servidor y revisión de permisos SQL. Enviá una única solicitud contractual, exigí HTTP 201 con snapshot verificable y cotejá HISTORY, DETAIL e identidad persistida. Ante timeout, 5xx o respuesta ilegible, buscá en HISTORY/DETAIL antes de decidir otro envío. No activar el escritor únicamente para mostrar estas pantallas.

## Migrar a TiDB Starter

Usar un destino nuevo y vacío, separado de la demo inicial. Comprobar desde la conexión TLS efectiva la cuenta, schema, versión, permisos, collation y configuración de CHECK, FK y bloqueo. No puentear controles con FOREIGN_KEY_CHECKS=0 o con migraciones editadas.

| Verificación | Criterio de aceptación |
|---|---|
| DDL y tracking | Aplicar las cinco migrations oficiales en orden. Confirmar seis tablas, tracking con cinco filas y lock libre, 44 columnas, tipos y seis extensiones V2 nullable. Cada error requiere diagnóstico antes de reintentar. |
| CHECK y FK | Comprobar 14 CHECK en metadata y provocar su rechazo individual mediante candidatos sintéticos, incluida la comparación binaria de versiones. Comprobar FK, índice compuesto de historia, RESTRICT y el rechazo HTTP 409. |
| Transacciones | En dos conexiones, acreditar create frente a delete y dos lectores concurrentes. La consulta Knex emite LOCK IN SHARE MODE, cuyo efecto hay que comprobar en el destino. La promoción de TiDB a FOR UPDATE cambiaría la semántica y requiere una decisión explícita. |
| Precisión e histórico | Probar DECIMAL con lectura de strings para no perder dígitos, JSON con comparación canónica sin tapar drift y fechas UTC. Usar un fixture oficial V1 y otro V2, comparar metadata, diagnósticos y hashes según versión almacenada. |
| Acceso e historial | Verificar login, dos usuarios, separación de fincas, cursores opacos con timestamps empatados, exclusión de duplicados, alternancia V1/V2 y errores contractuales. |

Los CHECK están deshabilitados por defecto en la documentación de TiDB y el comportamiento de los locks compartidos difiere de MySQL. Si la modalidad Starter del destino no permite garantizar ambos, la migración se detiene sin rebajar controles. [CHECK en TiDB](https://docs.pingcap.com/tidbcloud/constraints/) · [Variables SQL](https://docs.pingcap.com/tidbcloud/system-variables/?plan=starter)

Después de certificar lo anterior con datos sintéticos, pausar escritores del origen autorizado, reconciliar envíos inciertos y hacer un export privado final. Usar importación de filas con IDs explícitos ordenadas por dependencias contra el DDL ya certificado. Comparar conteos, PK, referencias, versiones y SHA-256 canónicos por fila, con decimales y fechas preservados. Guardar hashes sensibles solo en evidencia privada. Validar auto-increment y lectura en un nuevo proceso. Preparar los secretos Render para el nuevo destino y revisar primero la compatibilidad del usuario efectivo de TiDB con la guarda de readiness. Reabrir cuando den PASS health/readiness y el recorrido funcional. Para volver a Aiven antes de la primera escritura, restaurar únicamente los secretos y artefacto previos mientras el origen exista. Después de escrituras, congelar ambos orígenes y reconciliar IDs/snapshots nuevos antes de volver. Conservar archivos de respaldo fuera de Render y conservar Aiven.

## Gratuidad

- Netlify Free por créditos: USD 0, 300 créditos mensuales de tope, 15 por despliegue de producción y 20 por GB web. Comprobar la modalidad de facturación de la cuenta. [Netlify](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)
- Render Free: 750 horas mensuales por espacio de trabajo. Tras 15 minutos sin tráfico se suspende y reactivar puede tomar cerca de un minuto. Controlar consumo y evitar cobros adicionales, en especial con tráfico iniciado hacia la base remota. [Render](https://render.com/docs/free)
- TiDB Starter MySQL: cuota documentada por instancia elegible de 5 GiB row store, 5 GiB column store y 50 millones de RU mensuales con límite de gasto 0. La cuota agotada restringe nuevas conexiones. [TiDB Cloud](https://docs.pingcap.com/tidbcloud/serverless-limitations/)
- Aiven anunció el retiro de MySQL Free y la eliminación de los datos y respaldos remanentes del tier el 21/12/2026. El respaldo independiente evita depender de una recuperación posterior del proveedor. [Aiven](https://aiven.io/docs/products/mysql/howto/mysql-free-tier-migration-options)
