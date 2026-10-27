# R5-C - Integración de fincas y bases de simulaciones

Fecha: 27/10/2026. **Implementación y verificación local completadas; pendiente de auditoría y aprobación de Lucho. R5-D no iniciada.**

## Autorización, fuentes y referencia inicial

Lucho autorizó exclusivamente R5-C después del preflight: rutas canónicas de fincas, detalle independiente de Manning y tres servicios de simulaciones, sin habilitar su creación en pantalla.

- Maestro: `C:\Riegar\Plan\nuevoPlan.txt`, continuidad del 26/10/2026. Sus estados antiguos se complementan con las aprobaciones posteriores de A1/B-2/B-3.
- Frontend inicial limpio: rama `feature/riego-surcos-v1`, HEAD `28e48cd6d4417929c4e60c345714fb2876c6b2fe`, cierre versionado de B-2/B-3. Se verificaron su contenido y la preservación de los cambios anteriores antes de editar.
- Referencia externa previa: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-c-implementacion\baseline`. Copia de los 67 archivos versionados y manifiesto SHA-256, rama, HEAD y estado limpio. No incluye secretos ni archivos de entorno privados.
- Backend inspeccionado exclusivamente en lectura: `C:\Riegar\riegar-backend`, misma rama, HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`, limpio. `src/services/irrigation-simulations.versions.js` conserva `ACTIVE_DESCRIPTOR = ACTIVE_V1`.
- No se usaron reset, stash, restauraciones de archivos, nuevas ramas, staging, commit, push ni deploy.

## Resultado e impacto

### Navegación y fincas

| Ruta | Estado en R5-C |
| --- | --- |
| `/fincas` | Mis fincas, protegida; reutiliza Dashboard y CRUD actuales. |
| `/dashboard` | Redirección protegida a `/fincas` con reemplazo de historial. |
| `/fincas/:fincaId` | Nuevo detalle protegido de gestión de finca. |
| `/finca/:id` | Detalle histórico Manning conservado. |
| `/finca/:id/nuevo-calculo` | Cálculo Manning asociado a finca conservado. |
| `/calculadora`, `/guia`, `/configuracion` | Rutas públicas históricas conservadas. |
| `/fincas/:fincaId/simulaciones/nueva` | No incorporada; requiere fase posterior y revisión contractual. |
| `/fincas/:fincaId/simulaciones/:simulationId` | No incorporada; detalle/resultados e historial se desarrollan en R5-E/F. |

Navbar, Inicio y Footer apuntan a `/fincas`. Login conserva su navegación existente a `/dashboard`, resuelta por el alias compatible. Seleccionar una tarjeta abre el nuevo detalle. Desde allí se accede explícitamente a «Ver cálculos Manning» y se vuelve a Mis fincas para administrar el CRUD.

El detalle usa una única consulta de `getFincas()` a la colección autenticada, sin peticiones individuales por fila ni endpoint inventado. Selecciona el ID canónico dentro de las fincas devueltas por el servidor. No encontrarlo genera un estado local genérico «Finca no disponible»; no se fabrica un HTTP 404 ni se distingue entre finca ajena e inexistente.

Se agregan estados de carga, identificador inválido, no disponible y error con consulta manual. Se conserva la paleta y los mixins AgroTech. El área de simulaciones informa que está en preparación: no hay formulario, botón de creación, resultado ficticio ni llamadas de simulación desde la interfaz.

### Aislamiento de datos por sesión y finca

- El detalle remonta su estado al cambiar la combinación sesión/finca, antes de pintar datos del nuevo contexto. La clave es interna de React; no se agrega el token a atributos HTML, URLs, logs ni almacenamiento adicional.
- Cada efecto ignora respuestas y errores después del desmontaje y exige que el token vigente siga correspondiendo a la consulta iniciada. Cambiar de finca, cerrar sesión o iniciar otra sesión no puede restaurar sus datos anteriores.
- Dashboard también remonta su estado por sesión, limpiando listado, borrador y modales al cambiar de usuario. Una secuencia de consulta y la comprobación de sesión/desmontaje descartan lecturas anteriores. Los resultados de crear/editar/eliminar no actualizan otra sesión ni muestran sus errores en ella.
- No se cambian AuthContext, sesión, ProtectedRoute ni el protocolo de autenticación. La protección del backend sigue siendo la autoridad de permisos. El control frontend evita datos obsoletos; no reemplaza ownership del servidor.
- Se mantienen los payloads CRUD, validaciones, confirmaciones y rechazo `409 FARM_HAS_IRRIGATION_SIMULATIONS`. La conservación del formulario al plegarlo dentro de la misma sesión sigue funcionando.

### Servicios HTTP de simulaciones

Se agregan al mismo `apiService.js`, reutilizando íntegramente el cliente A1 y sus errores estructurados:

| Servicio | Contrato verificado en backend |
| --- | --- |
| `createIrrigationSimulation(fincaId, payload)` | `POST /api/fincas/:fincaId/irrigation-simulations`, 201. Cuerpo plano `{name?, crop, soil, furrow, irrigation}`. |
| `getIrrigationSimulationHistory(fincaId, {limit?, cursor?})` | `GET` de la colección; `{items, pagination:{limit,hasMore,nextCursor}}`. |
| `getIrrigationSimulationDetail(fincaId, simulationId)` | `GET` del recurso; `{simulation,model,input,output,metadata}`. |

Fuentes verificadas: router y adaptador HTTP de simulaciones, servicio de persistencia, mappers versionados, registro de versiones, contratos V1/V2 y rutas de fincas del backend. No se modificaron estos archivos.

- POST entrega el payload recibido sin construir valores agronómicos, inyectar versiones ni recalcular. La forma final del formulario/payload corresponde a R5-D. El POST público activo sigue siendo V1 (`furrow.widthM`); no se presupone aceptación pública de V2 (`furrowSpacingM`, `furrowCount`).
- Los IDs nuevos se validan como enteros positivos canónicos INT UNSIGNED. Se rechazan coerciones parciales, ceros iniciales y segmentos inválidos antes de consultar. Este control no se aplica retroactivamente a rutas históricas.
- `limit` opcional: entero 1-100; al omitirlo rige el default backend de 20. El cursor es texto opaco: se codifica para URL sin recortar, interpretar, reconstruir ni decodificar. El servicio no concatena páginas ni solicita DETAIL por elemento.
- Los snapshots y resúmenes se devuelven sin modificaciones, manteniendo la versión contractual persistida y los `null`. No se implementa todavía renderer V1/V2 ni inferencia a partir de campos o del descriptor activo.
- Se conserva `ApiError` con status, code, field y errors públicos. 401 y 403 de token inválido terminan la sesión correspondiente; 403 de permiso no la elimina. 404 no revela ownership. 409 mantiene su código. También se prueban 400, 415, 422, 500 y 503.
- No hay retry automático. Un fallo de red, respuesta 201 ilegible o error 500 no se convierte en «no se guardó». El backend puede fallar después de persistir; la futura UI deberá reconciliar en HISTORY/DETAIL antes de permitir repetir una operación incierta. R5-C no presenta aún ese flujo.
- Una respuesta 401 de una petición anterior no invalida una sesión distinta, conservando la protección A1.

## Archivos y alcance del diff

7 archivos existentes modificados:

1. `src/routes/AppRoutes.jsx`: dos rutas canónicas protegidas y alias compatible.
2. `src/components/Dashboard/Dashboard.jsx`: selección hacia detalle nuevo, aislamiento por sesión y respuesta vigente, consulta manual tras error; contratos CRUD conservados.
3. `src/components/Navbar/Navbar.jsx`: destino canónico y estado activo para sus subrutas.
4. `src/components/Hero/Hero.jsx`: CTA autenticada canónica.
5. `src/components/Footer/Footer.jsx`: enlace canónico.
6. `src/services/apiService.js`: tres servicios y validación de IDs añadidos; cliente y servicios existentes sin cambios.
7. `scripts/verify-r5-a1-browser.mjs`: adapta las expectativas de alias y amplía la suite con 18 escenarios R5-C. El módulo virtual de servicios solo existe dentro del interceptor de pruebas.

5 archivos agregados:

1. `src/pages/FarmDetailPage.jsx`: contenedor de página existente en la arquitectura.
2. `src/components/FarmDetail/FarmDetail.jsx`: detalle independiente.
3. `src/components/FarmDetail/FarmDetail.module.scss`: estilos locales con tokens/mixins aprobados.
4. `test/r5-c.test.js`: 48 pruebas focalizadas de transporte/contratos/errores.
5. `docs/r5-c-checkpoint.md`: este checkpoint.

No cambian dependencias ni lockfile, assets, estilos compartidos, auth, fórmulas, diagramas, componentes históricos Manning o documentos anteriores. No fue necesario modificar Dashboard.module.scss. La verificación externa compara los 67 archivos iniciales: 7 modificados y 60 idénticos; además identifica los 5 nuevos autorizados. El prefijo completo del cliente A1 y los servicios previos se compara byte por byte.

## Verificación ejecutada

Entorno: Windows, Node 24.16.0, npm 11.13.0, Vite 6.4.5 y Microsoft Edge automatizado con Playwright ya disponible externamente. Sin dependencias nuevas ni reinstalación; se reutilizó la instalación funcional existente.

| Comprobación | Resultado real |
| --- | --- |
| `npm test` | **PASS 94/94**, 0 FAIL, 0 omitidos: 46 existentes + 48 R5-C. |
| `npm run build` | **PASS**, 96 módulos, 6,44 s en la ejecución final registrada. |
| `npm audit --json` | **PASS**, 0 vulnerabilidades informadas en esta ejecución. |
| Suite de navegador sobre build local, API interceptada | **PASS 46/46**, 0 FAIL: 28 regresiones + 18 R5-C. |
| Captura y QA adicionales | **PASS**, 33 vistas a 1280/390/320 px, 12 estados adicionales, contraste focalizado, teclado y modal. Sin errores de página ni peticiones al backend real. |
| Rutas canónicas, alias, acceso directo y recarga | **PASS** con API simulada y preview local; alias reemplaza la entrada de historial y se mantiene protegido. |
| Auth, CRUD, 409, menú móvil, contacto, formulario plegable | **PASS** en las regresiones con API simulada. |
| Cambio de finca/sesión, logout y respuestas tardías | **PASS** en navegador; datos anteriores retirados y respuestas ignoradas. |
| POST/HISTORY/DETAIL | **PASS** con fetch simulado y módulo de servicios real en navegador. Cursor exacto, auth y un solo intento ante red/201 ilegible/500. |
| Compatibilidad Manning | **PASS** del recorrido simulado y comparación de contenido de cinco pantallas históricas con B-3 a tres anchos; sus archivos se conservan idénticos. |
| Reflujo de nuevas vistas a 1280/390/320 px | **PASS**, sin desbordes horizontales. |
| Integridad baseline, alcance del diff, `git diff --check` | **PASS**. Sin cambios staged; parche completo incluye los nuevos archivos y se comprueba contra la copia inicial. |
| Integración con backend real / Aiven | **NOT RUN**, no autorizada; no hubo POST ni otras operaciones reales. |
| Accesibilidad global, lector de pantalla y dispositivos físicos | **NOT RUN**. La validación focalizada no equivale a certificación global. |
| Servidor remoto, despliegue y recarga en hosting | **NOT RUN**; fallback de rutas verificado únicamente en preview local. |

Las fixtures V1/V2 de servicios son datos sintéticos de transporte, algunas deliberadamente parciales. Verifican rutas, preservación de estructura y errores; no certifican un cálculo agronómico ni una escritura real. No se duplicó el motor backend para probarlas.

El foco de teclado de los enlaces nuevos es visible. La medición de contraste usa colores computados de botones y textos nuevos sobre fondo agua, además de pares compartidos ya aprobados. No se atribuye a R5-C una auditoría WCAG completa.

### Defectos históricos y correcciones de pruebas

- **FAIL histórico de reflujo Manning a 320 px:** `/calculadora` y `/finca/7/nuevo-calculo` conservan ancho documental de 350 px, exactamente el observado en B-3. No se agrava ni se corrige por quedar fuera de R5-C. A 390 y 1280 px no presentan ese desborde.
- El editor de nombre del detalle Manning conserva su asociación de etiqueta pendiente, fuera de esta fase.
- En ejecuciones preliminares hubo expectativas de `/dashboard` sin actualizar, una etiqueta Manning con mayúsculas distintas, una comprobación de foco programático en lugar de teclado y una espera de listado bloqueada por la propia fixture. Se corrigieron las pruebas para verificar el comportamiento autorizado. La ejecución completa final registra 46 PASS / 0 FAIL; no se alteró Manning para satisfacerlas.

## Evidencias y estado Git final

Directorio externo de entrega: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-c-implementacion`.

- `node-tests.txt`, `browser-tests.txt`, `build.txt`, `final/qa.json`: resultados y mediciones locales.
- `capturas/` y `final/`: PNG reales de la build, con datos sintéticos; PDF de revisión y ZIP de entrega.
- `diff-r5-c.patch`: incremento completo respecto de `28e48cd...`, incluidos los nuevos archivos, sin cambios B-2/B-3 ajenos a esta fase.
- `verificacion-alcance.json`, `diff-resumen.json` y `git-final.txt`: hashes, alcance y estado final.

Frontend final: rama y HEAD iniciales sin cambios; **7 archivos modificados y 5 nuevos sin staging**, detallados arriba. Backend final: HEAD inicial y árbol limpio; descriptor activo V1. No se realizó commit, push, deploy, activación V2 ni acceso operativo a Aiven.

## Riesgos, pendientes y recomendación para R5-D

1. La consulta del detalle descarga la colección autenticada completa porque no existe endpoint individual. Es la decisión aprobada; revisar escalabilidad cuando cambie el contrato, sin inventar un endpoint o cache global ahora.
2. Las peticiones descartadas no se cancelan en red: sus resultados y errores se ignoran en UI. La autoridad de ownership sigue estando en el backend. No hay cache compartida entre sesiones.
3. La reconciliación de POST incierto necesita HISTORY/DETAIL, además de una UX explícita antes de habilitar la creación. Los servicios están preparados; la pantalla todavía no lo está.
4. Carga y errores de fincas usan los servicios actuales. Una ausencia en la colección no prueba eliminación ni revela pertenencia a otro usuario.
5. La integración real y el comportamiento en hosting siguen pendientes de autorización y ambiente específico. La suite simulada no valida CORS, DB ni permisos reales.
6. Antes de R5-D, hacer un preflight del contrato público activo. **No enviar un payload V2 mientras ACTIVE_DESCRIPTOR sea ACTIVE_V1**, ni seleccionar versión desde el cliente. Si V2 sigue inactiva, especificar/preparar el formulario bajo esa limitación y detener cualquier conexión incompatible hasta la fase autorizada de activación.
7. R5-D debe respetar las decisiones aprobadas sobre decimales ambiguos, pasos y borrador solo en memoria con advertencia. R5-C no las implementa ni agrega defaults. R5-E/F definirán renderer según contrato persistido, diagnósticos y paginación, sin editar snapshots.

**Se detiene el trabajo en R5-C para auditoría y aprobación de Lucho. No se inicia R5-D automáticamente.**
