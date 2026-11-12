# RiegAR · Preparación de staging

## Servicios y configuración

Propuesta para la demostración académica. Usar un sitio frontend separado en Netlify y una API Node/Express en un entorno Railway separado. Usar un MySQL administrado de staging con esquema y credenciales propios. Aiven es una opción compatible con el CA soportado por la configuración actual del backend. Separar dominios, base, secretos, permisos y datos de producción. [Reescrituras SPA de Netlify](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/) · [HTTPS en Railway](https://docs.railway.com/networking/public-networking) · [Certificados MySQL en Aiven](https://aiven.io/docs/platform/concepts/tls-ssl-certificates)

| Servicio | Configuración |
|---|---|
| Frontend | Comando `npm ci && npm run build`, publicar `dist`, configurar `VITE_API_URL=https://<api-staging>` antes del build. Vite incorpora esa URL al bundle. |
| Fallback SPA | `public/_redirects` se copia a `dist/_redirects`. La regla 200 sirve `index.html` en rutas como `/fincas/7` y permite que React Router aplique sesión y ruta. |
| Backend | Instalar con `npm ci`, arrancar con `npm start`, respetar el `PORT` asignado por el host y usar `/api/health` como prueba HTTP. [Configuración de puerto en Railway](https://docs.railway.com/networking/troubleshooting/application-failed-to-respond) |
| API y correo | `CORS_ORIGIN=https://<frontend-staging>`, `JWT_SECRET` propio y `EMAIL_USER` / `EMAIL_PASS` de una cuenta de ensayo. |
| MySQL | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL=true`, `DB_SSL_CA_PATH` al certificado CA montado en el entorno. Validar conectividad cifrada y CA antes de operar. [TLS para Aiven MySQL](https://aiven.io/docs/platform/concepts/tls-ssl-certificates) |

Las plantillas existentes `.env.example` de ambos repositorios documentan las variables. Los valores privados van en el proveedor o en un archivo local ignorado. La cuenta runtime y la cuenta de migrations tienen funciones separadas. Preparar backup, restore probado y plan de vuelta a una versión lectora compatible antes de cualquier cambio de esquema o descriptor.

## Circuito de integración y condición de activación

1. El asistente prepara `name` opcional más `crop`, `soil`, `furrow` e `irrigation`. `furrowSpacingM` y `furrowCount` pertenecen a V2. El cliente valida entradas y usa el servicio común.
2. La ruta `POST /api/fincas/:fincaId/irrigation-simulations` usa la sesión y el descriptor del servidor. Valida contrato y propiedad de finca, calcula con el motor correspondiente, inserta el snapshot en la transacción y devuelve 201 con el detalle persistido. El descriptor actual `ACTIVE_V1` espera `widthM`. `/api/health` solo responde disponibilidad HTTP.
3. Los GET de historial y detalle seleccionan el contrato persistido y muestran entradas, magnitudes y diagnósticos guardados. El historial usa cursor opaco y conserva la separación de sesiones y fincas.
4. En el MVP, la llamada de creación exige un servidor Vite de desarrollo y el origen exacto de la API simulada. La build mantiene cerrada la creación incluso con flags de desarrollo. Para habilitar staging real en una intervención posterior, falta una composición V2 de backend identificable, una señal verificable de capacidad de escritura V2 ligada al mismo origen, y un perfil de frontend de staging explícito que valide esa señal antes de permitir el envío. La versión enviada por el cliente queda fuera del contrato actual.

## Orden para una intervención posterior

1. Aprobar y fijar versiones de ambos repositorios, credenciales y destino de staging. Acreditar esquema ampliado, migrations, backup, restore y permisos. Usar datos sintéticos.
2. Publicar en staging con la creación deshabilitada. Verificar HTTPS, CORS, salud, sesión, lectura de fincas, rutas directas y recarga, aislamiento por propiedad, historial y detalle V1/V2. Probar un GET autenticado para acreditar la base.
3. Coordinar por separado el descriptor V2 explícito y el perfil de staging que valida la capacidad del servidor. Verificar que los orígenes de producción y los descriptores ausentes o inesperados cierren el envío.
4. Autorizar un ensayo sintético acotado. Validar un solo 201 y su persistencia vía HISTORY/DETAIL, respuesta por finca ajena y payload incompatible. En caso incierto, conciliar por lectura y evitar reenvío automático. Confirmar hashes de los snapshots históricos.
5. Si falla un criterio, desactivar el envío en staging y mantener lectura compatible. Para revertir la aplicación, elegir una versión que todavía lea los contratos ya persistidos. Someter cualquier restauración o cutover posterior a una decisión independiente.

La fase MVP comprobó el fallback en un servidor local y la copia de la regla al build. La validación en el proveedor, el staging real y la escritura V2 quedan pendientes.
