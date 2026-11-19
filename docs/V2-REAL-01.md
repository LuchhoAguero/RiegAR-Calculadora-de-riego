# V2-REAL-01 · Flujo funcional preparado, pendiente de activación

Ramas de trabajo: `demo-academica`. Baselines frontend `c6684a6`, backend `621fe73`. No publicar ni habilitar permisos antes de la autorización operativa de Lucho.

## Recorrido y guardas

`/fincas` → `/fincas/:fincaId` → Nueva simulación → Cultivo → Suelo → Surcos → Riego → Revisión → Calcular y guardar → `/fincas/:fincaId/simulaciones/:simulationId` → historial.

El asistente funcional comienza vacío. Reutiliza validadores, unidades, decimales y borrador de sesión. Envía los datos propios al endpoint existente. No ejecuta el motor ni completa valores agronómicos en React. El resultado se obtiene del POST 201 verificado y de DETAIL; la página de resultados consulta el snapshot guardado. HISTORY/DETAIL conservan lectores V1/V2. Las dos rutas `/demo/*` siguen siendo ejemplos fijos rotulados y separados.

| Capa | Condición para crear |
|---|---|
| Frontend | Build `staging`, PROD=true, DEV=false, `VITE_RIEGAR_REAL_V2=true`, mock desactivado, origen exacto `https://riegar-academico.netlify.app` y API exacta `https://riegar-api-demo.onrender.com`. Ausencia o discrepancia bloquea. |
| Capacidad | GET autenticado `/api/capabilities/irrigation`, contrato `irrigation-contract-v2`, modelo `irrigation-estimation-v2`, hash `30b031d7bd3aa4365c65b6750a91a4004db4ef3452c99bf3924698b89f9dec3b`, `creationEnabled=true` y `frontendOrigin` exacto. Se consulta al abrir la sesión y nuevamente antes de cada envío. |
| Cliente HTTP | Permiso en memoria emitido tras esa verificación, ligado al token/origen, válido 60 segundos y de un solo uso. Un objeto de capacidad inventado no habilita el servicio. Redirecciones rechazadas. |
| Backend académico | `RIEGAR_DEMO_ENABLE_V2=true` selecciona explícitamente el descriptor V2 existente. JWT, Origin exacto y ownership obligatorios. No hay selector de versión por request. |
| SQL | Runtime académico: SELECT de finca y SELECT/INSERT de simulaciones; transacción, bloqueo compartido de finca, cálculo backend, inserción y readback antes del 201. |

La referencia original `ACTIVE_DESCRIPTOR = ACTIVE_V1` permanece intacta. Las banderas públicas permanecen desactivadas durante esta preparación. No se cambian TLS, JWT, CORS, credenciales ni migrations.

Un fallo de la comprobación de capacidad acredita que el cliente no envió el POST. Un fallo de red/5xx/201 no verificable después de iniciarlo se trata como guardado incierto: no se reintenta; se revisan HISTORY/DETAIL. El borrador y el seguimiento temporal se limpian al salir de la sesión. Logout no promete cancelar un guardado que ya pudo persistirse.

## Operaciones propuestas para aprobación

1. Revalidar por conexión TLS efectiva el servicio y `riegar_academic_staging`, su cuenta, UUID, schema, tracking, lock y permisos. Conservar conteos e identidad antes/después. No utilizar `defaultdb` ni asumir los conteos históricos como actuales.
2. Preparar un respaldo privado consistente del esquema académico con la cuenta técnica autorizada. Conservar respaldos anteriores, verificar tamaño y SHA-256. Ningún dump ni secreto se incluye en evidencias públicas.
3. Incorporar y publicar los diffs verificados. Primero backend con escritor **false** y frontend con bandera **false**; comprobar health/ready, auth y lectores. No se autoriza esa publicación por el mero cierre de esta preparación.
4. Si el host efectivo de la cuenta coincide con el aprobado (`%`) y no hay privilegios inesperados, ejecutar únicamente:

```sql
GRANT SELECT, INSERT
ON `riegar_academic_staging`.`irrigation_simulations`
TO 'riegar_staging_runtime'@'%';
```

Esto agrega INSERT al SELECT existente. Conserva los permisos actuales de users/fincas/calculos; no crea cuentas ni agrega UPDATE/DELETE a snapshots. La lectura con bloqueo compartido existente en fincas requiere SELECT; no exige ampliar sus permisos. [Manual MySQL 8.4](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html).

5. Activar `RIEGAR_DEMO_ENABLE_V2=true` únicamente en Render académico y comprobar la capacidad autenticada. Activar `VITE_RIEGAR_REAL_V2=true` en el build staging de Netlify. Conservar las URLs y CORS exactos. Si cambian los dominios, este cliente falla cerrado y requiere revisión.
6. Ejecutar el presupuesto siguiente, sin nuevos usuarios o fincas y sin reenvíos.

## Presupuesto del primer ensayo real

- **Un POST de login** con la cuenta académica existente: HTTP 200, JWT privado; ninguna fila de negocio nueva.
- Seleccionar una finca propia existente mediante GET. Si no existe o no se acredita ownership, STOP; no crear otra.
- **Un único POST de simulación**, máximo **un INSERT** en irrigation_simulations. Cero UPDATE, DELETE, DDL, migrations, registro o alta de finca.
- Hasta 30 GET y 10 OPTIONS para disponibilidad, listado, historial, detalle, recarga, salud y ownership. Las consultas SQL independientes de identidad, permisos y comparación son exclusivamente de lectura.
- Datos propuestos: nombre sintético único V2-REAL-01; cultivo ETo 4.8, Kc 0.85, 12 días; suelo Franco, CC 22%, PMP 11%, densidad 1.25 g/cm³, raíz 0.65 m, umbral 55%; surcos 1.2 m, longitud 70 m, pendiente 0.2%, cantidad 16; caudal 0.8 L/s, duración 100 min, avance 18 min. Se introducen en los cinco pasos sin precarga automática.
- Exigir 201, snapshot V2 válido, input coincidente, metadata y las 19 magnitudes del servidor. Comparar fila persistida mediante lectura independiente; comprobar HISTORY y DETAIL, recargar y recuperar el mismo ID y hash. Probar GET de un recurso ajeno conocido con la misma sesión, esperado 404, sin escribir.
- El registro de red cuenta un solo POST de simulación. Ante una respuesta incierta, STOP y reconciliación de lectura; no otro click, retry, cleanup o intento alternativo. La ausencia de un elemento en la primera página no demuestra que no se guardó.

## Reversión segura

Deshabilitar el escritor académico y la bandera frontend, preservar el seguimiento de solicitudes en curso y reconciliar cualquier resultado incierto. No matar transacciones para simular cancelación. Tras verificar que no quedan escritores, retirar únicamente INSERT de la tabla si se autoriza la reversión de permisos; mantener SELECT y todas las filas.

```sql
REVOKE INSERT
ON `riegar_academic_staging`.`irrigation_simulations`
FROM 'riegar_staging_runtime'@'%';
```

El frontend anterior `c6684a6` y backend `621fe73` conservan lectores V1/V2 y son referencias de reversión de código. No ejecutar down de migrations, borrar V2 ni restaurar un backup sobre datos más recientes. La presencia de snapshots V2 exige conservar los lectores versionados.

La preparación y sus pruebas offline no certifican todavía privilegios, locks, commit ni persistencia reales en Aiven. Esos controles se completan solo después de la autorización del ensayo.
