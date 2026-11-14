# RiegAR · Publicación académica en staging

## Configuración preparada

Netlify sirve el frontend estático, Railway ejecuta Express y un MySQL 8.4 administrado exclusivo de staging conserva datos sintéticos. Se eligió Aiven como opción para el servicio nuevo por su soporte de CA y recuperación. Cada componente tiene origen, credenciales y datos de staging propios. [Vite en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/) · [Railpack](https://docs.railway.com/builds/railpack) · [Certificados MySQL en Aiven](https://aiven.io/docs/platform/concepts/tls-ssl-certificates)

| Servicio | Configuración a aplicar cuando se autorice la publicación |
|---|---|
| Netlify | Sitio de staging separado y Node 24. Usar la configuración `netlify.toml`, que construye en modo `staging` y publica `dist`. Definir `VITE_API_URL` como el origen HTTPS exacto de la API Railway. El build rechaza rutas, credenciales, HTTP, IP, host local, origen de mock y flags de desarrollo. |
| React Router | `public/_redirects` entra en el build. La regla `/* /index.html 200` conserva la ruta directa y permite a React Router decidir qué pantalla y protección corresponde. `netlify.toml` añade encabezados para scripts del propio origen, bloqueo de framing y restricción de referrer. |
| Railway | Entorno llamado `staging`, Node 24, instalación `npm ci` y comando `node src/staging-server.js` sobre el candidato backend revisado. El proceso escucha `0.0.0.0` y el `PORT` que inyecta Railway. Configurar `/api/ready`, timeout de 60 s y `RAILWAY_DEPLOYMENT_DRAINING_SECONDS=20`. Usar el dashboard del servicio o Infrastructure as Code de Railway. |
| API | Dominio HTTPS Railway, `CORS_ORIGIN` con el origen HTTPS exacto de Netlify, JWT exclusivo de staging y de al menos 32 bytes. El candidato rechaza orígenes distintos antes de las rutas. CORS controla al navegador y la autorización por finca se aplica por JWT en cada ruta. |
| MySQL | Esquema `riegar_academic_staging`, usuario `riegar_staging_runtime` y hostname DNS fijado en `DB_HOST` y `RIEGAR_STAGING_DB_HOST`. Requiere `DB_SSL=true`, `DB_SSL_VERIFY_IDENTITY=true` y una sola fuente de CA. Usar `DB_SSL_CA_PEM` multilinea o montar el archivo en `DB_SSL_CA_PATH`. El candidato activa la comprobación del CA y del hostname de mysql2. |
| Correo | `/contacto` informa la disponibilidad en staging. El candidato devuelve 503 en POST de contacto, omite el router SMTP y rechaza credenciales de correo en ese perfil. El registro y el login usan sus rutas habituales. |

Fuentes de operación. [Node en Netlify](https://docs.netlify.com/build/configure-builds/available-software-at-build-time/) · [Reescrituras SPA](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/) · [HTTPS Railway](https://docs.railway.com/networking/public-networking) · [Healthchecks](https://docs.railway.com/deployments/healthchecks) · [Variables y draining](https://docs.railway.com/variables/reference) · [SMTP por plan](https://docs.railway.com/networking/outbound-networking)

El backend candidato está en un diff externo fijado al HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`. El archivo [backend.env.example](staging/backend.env.example) enumera variables sin valores privados. Railway está retirando los archivos legacy `railway.json` y `railway.toml` de Config as Code para servicios nuevos. Se eligió el dashboard para una primera publicación de un solo servicio. [Config as Code](https://docs.railway.com/config-as-code/reference) · [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code/reference)

## Privilegios y operación

- **Runtime.** Privilegios de tabla para las operaciones existentes del MVP en `riegar_academic_staging`. `users` requiere SELECT e INSERT. `fincas` y `calculos` requieren SELECT, INSERT, UPDATE y DELETE. `irrigation_simulations` requiere SELECT en el primer staging. Las comprobaciones de readiness usan funciones de sesión y la base seleccionada. La cuenta runtime queda separada del esquema de producción, de las migrations y de su tracking.
- **Migrations.** Una cuenta temporal y distinta prepara el esquema oficial de cinco migrations en la base nueva. Verificar nombre de base, hostname, TLS y usuario antes de ejecutar. Usar un job manual o cliente autorizado en la misma red de staging. Las credenciales del job se guardan separadas de las del servicio. En el perfil de runtime, Railpack solo instala y arranca.
- **Secretos.** Mantener `DB_PASSWORD` y `JWT_SECRET` en el servicio, preferentemente como variables selladas, y el PEM en el entorno privado. `VITE_API_URL` es pública y se incorpora al bundle. Verificar que ninguna variable de staging apunta a producción. [Variables Railway](https://docs.railway.com/variables)
- **Salud y logs.** `/api/health` acredita HTTP. `/api/ready` verifica base, cuenta runtime efectiva y cipher TLS en el mismo socket y devuelve 503 ante error. Railway consulta readiness durante el deploy. Usar monitoreo separado para disponibilidad continua. Los logs registran estado y latencia de solicitudes, arranque y cierre, y mensajes genéricos de error. Mantener payloads, JWT, correos, SQL y DSN fuera de los logs.
- **Cierre.** El candidato gestiona SIGTERM y SIGINT, deja de aceptar conexiones, espera las solicitudes activas hasta el límite de cierre HTTP y destruye el pool. Railway dispone de una ventana de 20 s. Verificar el ciclo de reemplazo en staging real.
- **Recuperación.** Acreditar retención y punto de recuperación del plan MySQL. Antes de un cambio, guardar backup identificado por hora, schema y manifest de snapshots sintéticos. Probar restauración a otro destino **de staging**, validar tracking, FK, conteos y hashes, rotar las credenciales copiadas cuando el proveedor incluya usuarios en el fork. Ante fallo, pausar escrituras y conservar evidencias. Revertir el despliegue a una versión lectora compatible. Redirigir a un destino restaurado solo después de validar y aprobar su identidad. [Backups MySQL](https://aiven.io/docs/products/mysql/concepts/mysql-backups) · [Restauración mediante fork](https://aiven.io/docs/products/mysql/howto/fork-service)

## Publicación y verificación en una fase posterior

1. Revisar el commit local MVP-01, el diff frontend de MVP-02 y el diff backend candidato. Fijar ambos artefactos y aprobar la publicación.
2. Preparar un MySQL de staging nuevo y separado. Fijar nombre, hostname, CA y cuentas. Acreditar identidad y permisos, aplicar las cinco migrations con la cuenta administrativa separada y verificar esquema, historial de migrations y lock. Preparar datos sintéticos y la prueba de recuperación.
3. Configurar el servicio Railway `staging` con la plantilla y publicar el candidato. Confirmar HTTPS y readiness. Leer un recurso autenticado para acreditar las tablas de aplicación. Verificar estado 403 de origen no autorizado y 503 de correo deshabilitado.
4. Configurar Netlify con el origen HTTPS exacto de Railway. Publicar el build de staging y revisar desde el navegador que ese origen aparece en las peticiones, que las rutas directas cargan y que la creación V2 permanece bloqueada. Verificar que los orígenes CORS coinciden exactamente en ambos lados.
5. En datos sintéticos, ejecutar registro, login, alta y edición de finca, una lectura HISTORY/DETAIL V1/V2 con snapshots autorizados, logout y un caso de ownership entre dos cuentas. Confirmar acceso académico previsto, revisar logs y aplicar protección de acceso o límites de ingreso del entorno antes de compartir el enlace.

Comandos de preparación para esa intervención. Usar un checkout backend separado y limpio del HEAD fijado, con finales de línea del repositorio, y la ruta al diff candidato.

```sh
git -c core.autocrlf=false -c core.whitespace=cr-at-eol apply --check --whitespace=error /ruta/MVP-ACADEMICO-02-BACKEND-STAGING.diff
git -c core.autocrlf=false -c core.whitespace=cr-at-eol apply --whitespace=error /ruta/MVP-ACADEMICO-02-BACKEND-STAGING.diff
npm ci
```

En el job de migrations, con la cuenta temporal y la identidad de staging ya comprobadas, usar `npm run check:db-tls`, `npx knex migrate:list --env production` y `npx knex migrate:latest --env production`. En el servicio de runtime ejecutar `node src/staging-server.js`. En el sitio Netlify usar `npm run build -- --mode staging` y directorio de publicación `dist`. Una comprobación posterior debe alcanzar `https://<api-staging>/api/ready` y un recurso autenticado, desde el origen exacto de Netlify.

## Propuesta V2 para staging autorizado

El primer candidato informa `GET /api/capabilities/irrigation` con autenticación y `Cache-Control: no-store`. Devuelve `contractVersion`, `modelVersion`, `sourceHash` y `creationEnabled: false`. Mantiene `ACTIVE_V1` y bloquea todas las altas de simulación en staging. HISTORY y DETAIL usan el contrato guardado.

Para ensayar escritura real V2 en staging, se requiere un cambio coordinado posterior. Su composición de servidor debe instanciar una sola vez el router con `{ descriptor: ACTIVE_V2 }` en el proceso de staging autorizado. La capacidad debe derivarse del mismo descriptor, anunciar V2 y una identidad de release esperada, y afirmar habilitación únicamente si esquema ampliado, destino, rol y bandera del operador se acreditaron. La cabecera de release, si se utiliza como precondición contra despliegues mezclados, comprueba identidad del proceso. El cuerpo conserva el DTO original.

El futuro perfil de frontend debe consultar esa capacidad por el mismo origen HTTPS que usará para el POST, con sesión vigente, sin redirects y sin cache. Habilita el botón solo si origen, release, contrato, modelo, hash y booleano coinciden. Revalidar al iniciar el envío y cerrar ante error, cambio de origen, sesión o finca. El build público mantiene su bloqueo. El servidor elige la versión por composición.

1. Construir el payload con los 15 numéricos V2 y las opciones `name` y textura. Usar el cliente existente y un único POST `/api/fincas/:fincaId/irrigation-simulations`.
2. Validar autenticación, propiedad de finca y DTO antes del motor. En la transacción, acreditar finca, calcular, insertar y leer la fila persistida. Confirmar únicamente un 201 con ID, finca, contrato, modelo, hash y entradas concordantes. El servidor decide ownership.
3. Leer HISTORY y DETAIL reales. Mantener cursor opaco y dispatch por contrato persistido. Ante red, 5xx o 201 no verificable, marcar intento incierto y conciliar mediante GET. Evitar retry automático y duplicación. La ausencia inmediata en HISTORY puede ser inconclusa.
4. Autorizar por separado el INSERT sobre las columnas V2 del mapper, el presupuesto de un ensayo sintético, las verificaciones de rollback y la preservación de los snapshots V1/V2. La validación actual cubre el contrato y la UI con mocks y las pruebas unitarias del backend. La escritura V2 de extremo a extremo en staging queda pendiente.
