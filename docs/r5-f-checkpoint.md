# R5-F - Historial y detalle de simulaciones V1/V2

Fecha: 27/10/2026. **Implementación y verificación local completadas; pendiente de auditoría y aprobación de Lucho. No se inicia R5-G ni R5-H.**

## Autorización y preflight

Se utilizó el adjunto completo de R5-F, que autoriza proceder tras verificar contratos, R5-E consolidada y frontend limpio. La lectura del primer adjunto se interrumpió; no hubo modificaciones antes de recibir y leer la versión completa.

- Frontend inicial limpio, rama `feature/riego-surcos-v1`, HEAD `5c69539ad80c9894c10e82dd2afdd2c1ba170abe`. El commit de Lucho contiene los 10 archivos de cierre R5-E, sobre `16cd34e43914aade54ee4d83c2e5e70e420f1105`.
- Backend inicial/final: misma rama, HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`, limpio. `ACTIVE_DESCRIPTOR = ACTIVE_V1` permanece intacto.
- Fuentes: maestro `C:\Riegar\Plan\nuevoPlan.txt`, HISTORY/DETAIL y fases; checkpoints C/D/E; router, adaptador HTTP, servicio, persistencia y mappers V1/V2 reales; contratos y pruebas backend.
- Baseline previo de **90 archivos versionados**, con hashes SHA-256, HEAD, rama y estado Git: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-f-implementacion\baseline`.
- No se modificaron documentos históricos, backend, DB, migrations o motores. Sin reset, stash, staging, commit, push ni deploy.

## Contratos verificados

### HISTORY

`GET /api/fincas/:fincaId/irrigation-simulations`, mediante `getIrrigationSimulationHistory` existente. Respuesta:

`{items, pagination:{limit,hasMore,nextCursor}}`.

Cada item contiene `simulation:{id,name,fincaId,createdAt}`, `model:{modelVersion,contractVersion,sourceHash}` y `summary`:

- Ambos contratos: `targetDepthMm`, `appliedVolumeL`, `applicationEfficiencyPct`, `diagnostics:{count,severities}`.
- Solo V2: `furrowCount`, `totalAppliedVolumeL`. HISTORY no contiene total en m³ ni detalles completos de diagnósticos.

Límite backend 1-100, default 20. La UI solicita 20. El backend ordena por `created_at DESC, id DESC`; el cliente conserva exactamente el orden recibido. El token de cursor es opaco para el frontend y se transporta con el servicio existente, sin decodificar, recortar ni reconstruir.

Fuentes: `src/services/irrigation-simulations.service.js`, `irrigation-simulations.mapper.js`, `irrigation-simulations.v2-mapper.js`, `src/routes/irrigation-simulations.http.js` y router.

### DETAIL

`GET /api/fincas/:fincaId/irrigation-simulations/:simulationId`, mediante `getIrrigationSimulationDetail` existente. Envelope `{simulation,model,input,output,metadata}`. Selección explícita por `model.contractVersion`, nunca por fields presentes o descriptor activo.

IDs canónicos INT UNSIGNED positivos. Auth obligatoria y ownership en backend. Finca o simulación ajena/inexistente devuelve 404 genérico `RESOURCE_NOT_FOUND`. El backend filtra por usuario/finca/simulación; una versión histórica corrupta puede producir 500 controlado. No se inventan endpoints de finca individual ni se omiten filas corruptas de un historial real como si no existieran.

## Resultado funcional y navegación

- `/fincas/:fincaId`: incorpora **Historial de simulaciones de riego**, priorizado después de los datos de finca y antes de las herramientas anteriores.
- `/fincas/:fincaId/simulaciones/:simulationId`: nuevo detalle protegido, con acceso directo, recarga, atrás/adelante, carga, error y consulta manual.
- `/fincas/:fincaId/simulaciones/nueva`: mantiene su prioridad como ruta estática; no se confunde con un ID. R5-D sigue DEV y la creación productiva continúa bloqueada.
- La vuelta al historial usa `/fincas/:fincaId#historial-simulaciones`, enfoca el título de sección y lo sitúa fuera de la cabecera fija.
- `/dashboard`, Mis fincas, CRUD y todas las rutas Manning mantienen compatibilidad.
- Manning conserva su tarjeta y enlace explícito, además del acceso ya existente en navegación/footer. No se eliminaron ni modificaron cálculos o componentes históricos.

## Historial y paginación

Tarjetas legibles en escritorio y apiladas en móvil. Nombre, fecha es-AR con UTC explícito, versión, magnitudes del summary y resumen de diagnósticos. Modelo/contrato completos son consultables mediante un detalle nativo. Los valores usan el formateador y componente de precisión aprobados en E.

- No se ejecuta DETAIL por fila, tarjeta, hover ni al cargar otra página. DETAIL se consulta solo al abrir un resultado.
- Cantidad de surcos y total aplicado aparecen solo en resúmenes V2. V1 no recibe extensiones, ceros ficticios ni m³ calculados.
- «Cargar más simulaciones» usa `hasMore/nextCursor`. «Actualizar historial» vuelve a la primera página. No se presentan totales de páginas ni se infieren por la cantidad de filas.
- Un bloqueo síncrono de petición evita doble activación y mantiene una sola carga de HISTORY en curso por vista. La UI muestra carga y deshabilita acciones durante la petición.
- El append crea un array nuevo, conserva el primer elemento por ID y el orden recibido; evita duplicados dentro de una página y entre páginas, sin cambiar objetos históricos.
- Se comparan cursores opacos para detectar falta de progreso. Un cursor repetido detiene la carga con error y requiere una acción explícita; no crea un bucle automático.
- Error de red/500 al cargar más conserva filas anteriores y reintenta el mismo cursor solo por acción del usuario. Si falla una actualización, se reintenta la primera página, no un cursor distinto.
- 403 de permisos o 404 elimina los resúmenes previamente mostrados y reinicia la próxima consulta; no conserva datos cuyo acceso dejó de confirmarse. 401/403 de token inválido usa la invalidación aprobada de A1.
- Estado vacío solo después de una respuesta válida, estado final del historial y errores legibles. No se inventa una invitación a crear V2 públicamente.
- Al cargar más con teclado, el foco va al primer resultado nuevo; si no hay uno, al estado final. Los errores pueden recibir foco y se evita quitárselo a otro control si el usuario ya se movió durante la espera.

## Aislamiento y manejo de errores

El componente del detalle de finca ya se remonta por sesión/finca desde R5-C. HISTORY vive dentro de ese límite; limpia resultados al cambiar contexto. Secuencia de petición, marca de montaje y comparación del token vigente descartan respuestas y errores atrasados.

DETAIL se remonta por sesión/finca/simulación. Antes de pintar verifica también que IDs del envelope coincidan con los solicitados. Un envelope de otro recurso no revela nombres ni magnitudes. No mantiene datos anteriores mientras consulta otro contexto.

Las respuestas 401 de una petición vieja no invalidan una sesión nueva, conservando el control del cliente HTTP. 403 de permisos no equivale a token inválido. 404 muestra indisponibilidad genérica sin revelar ownership. No se muestran internals del servidor ni se altera ApiError/cliente A1.

No se agregó cache global, localStorage, sessionStorage o persistencia de snapshots. Volver a la finca reconsulta la primera página y enfoca su historial; no conserva automáticamente todas las páginas cargadas antes de abrir un detalle. Es una limitación UX explícita, sin pérdida de registros backend.

## Renderizado histórico

### V1

Se agrega `V1Results`, con comprobación de `irrigation-contract-v1`, `irrigation-estimation-v1`, source hash y metadata V1. Presenta **14 magnitudes** y las unidades originales:

- Objetivo: `waterNeed.targetDepthMm`.
- Suelo: `availableWaterMm`, `availableCapacityL`, `maxRecommendedDepthMm`, `maxRecommendedVolumeL`.
- Aplicación: `appliedVolumeL`, las tres `infiltratedDepth*Mm`, `estimatedUsefulVolumeL`, `residualLossVolumeL`.
- Eficiencia: `applicationEfficiencyPct`.
- Indicadores: `advanceRatioPct`, `maxNonErosiveFlowLps`.

Las entradas muestran **`furrow.widthM`**, como ancho del contrato V1, sin reinterpretarlo como distancia entre surcos. No se agregan `furrowCount`, totales, consumo diario o días de reserva. Diagnósticos y metadata se leen del snapshot.

Se comparten definiciones de campos con dominios equivalentes y se contrastan con INPUT_CONTRACT V1. Esto no transforma un snapshot V1 en V2 ni renombra sus datos. Los schemas y versiones de cada reader son explícitos.

### V2 y componentes compartidos

Se reutiliza `V2Results` de R5-E con sus 19 magnitudes, nullable, precisión, totales y mensajes intactos. La extracción de `ResultReference` y la exportación de componentes de magnitud/grupo/diagnósticos permiten componer V1 sin copiar el renderer V2. Las funciones comunes de JSON e identidad se exportan sin cambiar sus reglas.

`SimulationResults` selecciona V1/V2 por contrato almacenado. Versiones no soportadas generan estado controlado, sin interpretar métricas. Un summary de versión desconocida puede identificarse, pero no presenta magnitudes inferidas. En el backend actual una versión no registrada normalmente provoca un 500 controlado; el tratamiento visual adicional se prueba con API simulada.

No se recalculan fórmulas, diagnósticos, conversiones de total o resultados a partir de inputs. El formato compacto es solo lectura con «≈» y valor completo consultable. No hay editar, eliminar ni recalcular snapshots.

## Fixture y validación contractual

Se agregó una fixture sintética G01 V1 en `test/fixtures/irrigation-v1-snapshot.json`. Se extrajeron el input y las 14 expectativas literales del test oficial `test/irrigation.calculator.test.js`, sin ejecutar esa suite. Un único cálculo offline con el motor backend V1 generó el envelope completo, contrastado con las expectativas, diagnósticos y mappers reales. No hubo HTTP/DB ni datos de usuarios.

Los tests usan además el golden V2 ya aprobado en E. La verificación externa compara 14 campos de output, 14 inputs numéricos, unidades/dominios y schema de metadata V1. Se comprobó ida/vuelta DETAIL V1/V2 con mappers puros y validación de summaries mixtos producidos por el mapper backend.

La fixture de paginación respeta fecha/ID descendentes. Incluye deliberadamente solapamientos/duplicados para probar la defensa visual, sin afirmar que el keyset real de backend los produzca en condiciones normales.

## Archivos del incremento

6 existentes modificados:

- `src/routes/AppRoutes.jsx`: ruta protegida de DETAIL con carga diferida.
- `src/components/FarmDetail/FarmDetail.jsx`: HISTORY, prioridad y textos de disponibilidad actualizados.
- `src/components/IrrigationResults/V2Results.jsx`: componentes de presentación compartidos y extracción de referencia, conservando su vista V2.
- `src/utils/irrigationV2Results.js`: exportación de helpers y comprobación común de identidad, con las mismas condiciones anteriores.
- `scripts/verify-r5-a1-browser.mjs`: fixture de HISTORY vacío para las rutas nuevas; conserva la prohibición de POST/DETAIL por tarjeta y distingue las lecturas de finca en los conteos anteriores.
- `scripts/verify-r5-d-browser.mjs`: fixture de HISTORY para visitas al detalle de finca y espera explícita del cierre/retorno de foco al cancelar un modal.

12 nuevos:

- `src/components/SimulationHistory/SimulationHistory.jsx`.
- `src/components/SimulationHistory/SimulationHistory.module.scss`.
- `src/components/IrrigationResults/V1Results.jsx`.
- `src/components/IrrigationResults/SimulationResults.jsx`.
- `src/pages/SimulationDetailPage.jsx`.
- `src/utils/irrigationHistory.js`.
- `src/utils/irrigationV1Results.js`.
- `src/utils/irrigationV1MetadataShape.json`.
- `test/fixtures/irrigation-v1-snapshot.json`.
- `test/r5-f.test.js`.
- `scripts/verify-r5-f-browser.mjs`.
- `docs/r5-f-checkpoint.md`.

Los otros **84 archivos del baseline permanecen idénticos**, incluidos todos los módulos/fórmulas Manning, servicios HTTP, autenticación, CRUD, R5-D funcional, assets, tokens y estilos compartidos, package y lockfile. No se instalaron dependencias ni se reestructuró el proyecto.

## Pruebas y resultados reales

Windows, Node 24.16.0, npm 11.13.0, Vite 6.4.5, Edge/Playwright existente. DEV y build preview locales; todas las operaciones HTTP de pruebas fueron interceptadas por API simulada.

| Verificación | Resultado |
| --- | --- |
| npm test | **PASS 352/352**, 0 FAIL/omitidos: 287 existentes + 65 R5-F |
| Navegador A1/C | **PASS 46/46**, incluido auth, CRUD, 409 y Manning |
| Navegador D | **PASS 25/25**, con conservación/descarte y creación bloqueada |
| Navegador E | **PASS 14/14**, presentación V2 y diagnósticos preservados |
| Navegador F | **PASS 36/36**, HISTORY/DETAIL con API simulada, cero escrituras |
| Correspondencia contractual | **PASS**, campos/unidades/dominios/schema V1, dos roundtrips DETAIL y summaries reales de mappers puros |
| Build final | **PASS**, 113 módulos, 7,77 s; JS principal 341,75 kB / 109,52 kB gzip |
| Chunk DETAIL | 5,68 kB / 2,33 kB gzip, carga diferida |
| CSS | 47,69 kB / 7,81 kB gzip; incorpora estilos locales de resultados e historial públicos de lectura |
| npm audit --json | **PASS**, 0 vulnerabilidades informadas en esta ejecución |
| IDs, acceso directo, recarga, vuelta e historial navegador | **PASS**, con API simulada |
| Cursor, doble activación, orden, duplicados y errores parciales | **PASS**, sin decodificar ni reconstruir cursores |
| Sesión/finca/simulación y respuestas tardías | **PASS**, incluido 401 antiguo y logout pendiente |
| Reflujo | **PASS** de historial y ambos renderers a 1280, 390 y 320 px |
| Teclado/foco | **PASS** de apertura, retorno al historial y primer registro nuevo al cargar más |
| QA de pantallas existentes | **PASS**, 33 vistas a tres anchos y 12 estados; contenido histórico comparado con R5-E |
| Baseline, alcance, git diff --check y parche completo | **PASS**, sin aplicar el parche ni modificar el baseline |
| HTTP real, Aiven, datos de usuarios | **NOT RUN**, no autorizado; cero operaciones reales |
| Lector de pantalla/dispositivos físicos/accesibilidad global | **NOT RUN**, sin certificación WCAG global |
| Commit, push, deploy, activación V2 | **NOT RUN**, no autorizados |

Las suites anteriores incluyen POST simulados de contacto/CRUD o pruebas directas del servicio, no escrituras reales. La suite F bloquea cualquier método distinto de GET y verifica cero escrituras. La demo E sigue sin API y el formulario D sin POST de simulación.

En una prueba inicial se estaba verificando la limpieza tras 404 contra una build previa a esa protección; tras construir la versión actual, pasó. En la regresión D apareció una carrera de prueba al comprobar foco antes de finalizar el cierre del modal; se añadió espera del cierre y foco efectivo, manteniendo el comportamiento productivo. Las ejecuciones finales completas están registradas por separado.

**FAIL histórico preservado:** `/calculadora` y `/finca/7/nuevo-calculo` mantienen ancho documental 350 px a viewport de 320 px, sin agravarse ni atribuirse a R5-F. Se conserva también el pendiente de etiqueta del editor Manning. Ningún componente ni fórmula de esos flujos fue modificado.

## Evidencias, riesgos y estado Git final

Directorio externo: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-f-implementacion`.

- Logs Node, suites de navegador A1/C-D-E-F, build y auditoría.
- `contrato-verificado.json`, `fixture-v1-procedencia.json`: fuentes y comprobación de contrato.
- `capturas/`: historial mixto, vacío, carga/error y resultados V1/V2 reales con API simulada.
- `final/qa.json`: mediciones y regresiones visuales existentes.
- PDF de revisión, ZIP con PNG/evidencias/checkpoint y `diff-r5-f.patch` incremental completo.
- `verificacion-alcance.json`, `diff-resumen.json`, `git-final.txt`: hashes y alcance.

Riesgos/pendientes: integración real aún no ejecutada; posible CORS/configuración/ownership real por verificar en ambiente autorizado. La vuelta al historial comienza nuevamente en la primera página. No hay virtualización de listas extensas. Los lectores rechazan datos estructuralmente incoherentes y no certifican validez científica. El tamaño de bundle crece al habilitar la lectura real de resultados; no hay dependencias nuevas.

Git final: misma rama y HEAD iniciales, **6 archivos modificados y 12 nuevos sin staging**. Backend limpio en su HEAD inicial, `ACTIVE_DESCRIPTOR = ACTIVE_V1`. Manning intacto; no se activó V2 pública ni hubo POST real, operación Aiven, commit, push o deploy.

**R5-F se detiene para auditoría de Lucho. Cualquier retiro Manning o cutover requiere una fase y autorización posteriores.**
