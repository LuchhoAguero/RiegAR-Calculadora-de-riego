# R5-E - Resultados y diagnósticos V2

Fecha: 27/10/2026. **Implementación y verificación local completadas; pendiente de auditoría y aprobación de Lucho. R5-F no iniciada.**

## Autorización y preflight

El adjunto autoriza implementar R5-E después de comprobar R5-D consolidada, frontend limpio y contratos reales, sin otra aprobación intermedia si no hay riesgos críticos. No autoriza creación pública V2, POST real, backend/DB, commit, push ni deploy.

- Frontend inicial limpio, rama `feature/riego-surcos-v1`, HEAD `16cd34e43914aade54ee4d83c2e5e70e420f1105`. El commit incluye los 13 archivos de cierre R5-D, sobre `584aad3a5d2e8be758f18acc6dc8fbab0bdecef4`.
- Backend limpio, misma rama, HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`. `src/services/irrigation-simulations.versions.js` conserva `ACTIVE_DESCRIPTOR = ACTIVE_V1`.
- Fuentes: `C:\Riegar\Plan\nuevoPlan.txt`, secciones 26-30 y referencias agronómicas; checkpoints C/D; contrato de modelos V2, validador, mapper versionado, boundary de snapshots, golden y pruebas oficiales backend.
- Antes de editar: copia íntegra de **81 archivos versionados**, con hashes SHA-256, rama, HEAD y estado limpio. Referencia externa `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-e-implementacion\baseline`.
- No se modificaron checkpoints previos. Sus estados precommit son referencias históricas; el commit posterior consolida D.

## Arquitectura y disponibilidad

`V2Results` recibe un snapshot `{simulation,model,input,output,metadata}`. No recibe datos del borrador, no consulta API y no importa motores o servicios. Primero verifica la frontera de presentación y luego muestra los campos recibidos. Puede reutilizarse en R5-F, que aún deberá resolver versión y obtener el snapshot real.

`inspectV2Snapshot` comprueba explícitamente `model.contractVersion === irrigation-contract-v2` antes de interpretar campos. También verifica modelo, source hash, schema de metadata y reglas correspondientes. V1/desconocidas generan estado no soportado; no hay fallback por campos presentes ni por descriptor activo.

Se validan envelope, datos JSON finitos y sin accesores/ciclos, identidad y fecha, entradas canónicas, dominios de las 19 magnitudes, par nullable de días, unidades y estructura de metadata. El schema estructural se extrajo de METADATA_TEMPLATE V2: valida tipos y presencia, sin reemplazar valores históricos. Las referencias explícitas de versión/reglas/unidades y el estado de referencia de los días se contrastan con constantes del contrato.

Las comparaciones estructurales de consistencia reproducen restricciones de lectura, no fórmulas: CC > PMP, avance <= duración, volumen útil <= aplicado y correspondencia entre consumo cero y días null. No se recalculan consumo, días, infiltración, volúmenes, eficiencia, límites de caudal ni diagnósticos. Tampoco se verifica un total multiplicando sus inputs; se respeta el total recibido.

### Demostración aislada

- Ruta **solo DEV**: `/desarrollo/resultados-v2`, protegida por ProtectedRoute existente.
- Acceso local: ejecutar el servidor de desarrollo habitual e ingresar esa ruta con sesión vigente. No se incorpora al menú del producto ni al recorrido de confirmar el formulario.
- La cabecera identifica «Vista de demostración — datos de prueba» y explica que los resultados son independientes del asistente y no son simulaciones guardadas de la finca del usuario.
- La página y sus fixtures se importan de forma diferida dentro de la condición DEV. La build productiva excluye ruta, página, renderer visual y datos de demostración. No se agrega un flag de activación pública.
- El selector alterna fixtures y casos negativos locales. No es un selector de versión de motor ni afecta el POST público.
- La página no consulta fincas, HISTORY ni DETAIL. Su identidad/fecha son sintéticas y están advertidas como tales.
- No se modifica el asistente R5-D ni su acción «Calcular y guardar», que permanece deshabilitada. No se conecta el formulario con resultados de ejemplo.

## Organización visual

Identidad AgroTech: navy/verde originales, fondo cálido, total sobre banda navy/agua, superficies suaves cultivo/suelo/agua y diagnósticos con texto e icono de severidad. No se modifican tokens globales ni assets. El logo y patrón original siguen intactos.

1. Encabezado de escenario con nombre, finca sintética, fecha UTC y contrato.
2. **Volumen total del escenario** destacado en m³ y litros, ambos leídos del output; cantidad de surcos desde input.
3. Resumen de lámina objetivo, aplicado por surco y eficiencia estimada.
4. Diagnósticos completos antes del detalle de magnitudes.
5. Necesidad hídrica y eficiencia/indicadores en bloques cultivo.
6. Agua disponible en suelo y plazos teóricos, bloque tierra.
7. Aplicación por surco, bloque agua, diferenciando láminas de volúmenes.
8. Entradas y referencia de modelo desplegables, incluida evidencia técnica complementaria.

No se incorporaron gráficos: para esta fase los valores por punto se explican directamente sin sugerir mediciones, interpolaciones o tendencias inexistentes. No hay puntajes, semáforos agronómicos o clasificación de seguridad. En móvil se apilan las métricas; las unidades permanecen visibles y el texto puede refluir sin reducir su tamaño para encajar tablas.

## Correspondencia de las 19 magnitudes

| Grupo | Campos | Unidades |
| --- | --- | --- |
| waterNeed | targetDepthMm; dailyCropWaterUseMmPerDay | mm; mm/día |
| soilWater | availableWaterMm; availableCapacityL; maxRecommendedDepthMm; maxRecommendedVolumeL | mm; L; mm; L |
| soilWater | daysUntilAvailableWaterExhaustion; daysUntilDepletionThreshold | días; días, nullable |
| application | appliedVolumeL; infiltratedDepthStartMm; infiltratedDepthMiddleMm; infiltratedDepthEndMm | L; mm; mm; mm |
| application | estimatedUsefulVolumeL; residualLossVolumeL | L; L |
| totals | totalAppliedVolumeL; totalAppliedVolumeM3 | L; m3 canónico, m³ en presentación |
| efficiency | applicationEfficiencyPct | % |
| diagnostics | advanceRatioPct; maxNonErosiveFlowLps | %; L/s |

`input.furrow.furrowCount` se muestra como cantidad almacenada, no como vigésimo output. No se multiplica por volumen por surco ni se convierte litros a m³ en React. Cada total procede de su campo contractual.

Los dos días se presentan como referencias **desde capacidad de campo**, nunca como días reales restantes desde hoy. Con consumo diario cero, ambos null se muestran «No aplica» con explicación; no se sustituyen por cero. Pérdidas estimadas no se identifican como percolación medida ni se les asigna una causa física no determinada.

### Formato y precisión

Formato argentino con coma decimal y agrupación de miles. Lectura habitual de hasta dos decimales; cuando el texto difiere del valor completo, aparece «≈» y un desplegable accesible con todos los dígitos representables recibidos y su unidad. Los positivos pequeños nunca se formatean como cero: se usa precisión significativa o notación científica de presentación cuando corresponde.

La notación científica de resultados no modifica la política de captura R2/R3 del asistente. Intl formatea números solo a strings de lectura; esos textos nunca vuelven a un payload. El snapshot original no se redondea ni se modifica. Las pruebas congelan fixtures y comprueban igualdad antes/después de recorrer todos los casos.

## Diagnósticos

Se leen exclusivamente `output.diagnostics.items`, en el orden recibido. Se conservan `id`, `ruleVersion`, `severity`, `message`, `fields` y `evidence`.

- P01/P02/P04/P05 oficiales: warning. P03 oficial: info.
- P03 y P05 pueden repetirse para start/middle/end. No se deduplican por código; la clave visual incluye punto e índice y se muestran Inicio/Mitad/Final del surco.
- Cada entrada identifica código y severidad con texto e icono; el color no es el único medio. Los mensajes son literales recibidos, no generados a partir de comparaciones frontend.
- Evidencia, campos y versión de regla se consultan en detalles desplegables. Si falta el mensaje opcional permitido por el validador, se indica su ausencia sin inventar otro mensaje de diagnóstico.
- Array vacío: estado neutro que explica que la ausencia no certifica seguridad u optimalidad.

El backend no permite diagnósticos fatales dentro de snapshots exitosos persistibles. El componente contempla visualmente info/warning/error, pero un snapshot con severity error es **inválido**: muestra el estado de error y el diagnóstico recibido, sin magnitudes como resultado válido. El caso negativo de demo altera solo una copia de prueba; no se presenta como cálculo contractual ni se modifica ningún snapshot histórico.

## Fixtures y autoridad del cálculo

`src/fixtures/irrigation-v2-results.json` contiene cinco snapshots completos de prueba:

1. **GV2-01 literal oficial**: input, output y metadata idénticos a `test/fixtures/irrigation-v2-golden.js`; P02 y P04.
2. Consumo diario cero: variante de las pruebas oficiales; ambos días null y P03 en tres puntos.
3. Igualdad estricta, sin diagnósticos: caso de `irrigation.v2.boundaries.test.js`.
4. Variante oficial con P01, P03 en tres puntos y P05 en tres puntos.
5. Variante adicional de consumo pequeño para probar presentación de decimales.

Las cuatro variantes se generaron **offline con el motor puro del backend existente**, sin servidor, HTTP, DB, Aiven ni modificaciones backend. El frontend importa únicamente JSON literal. Las identidades, nombres y fecha de los envelopes son sintéticos. No son resultados del formulario ni registros reales.

La verificación adicional compara los 19 campos/unidades/dominios y el schema de metadata con las definiciones reales. Los cinco snapshots pasan por los mappers puros de escritura/lectura versionados y se recuperan idénticos, sin ejecutar nuevamente el motor. Procedencia y hashes de fuentes se guardan externamente.

Casos negativos de demo: campo faltante, contrato incorrecto y severidad fatal, creados sobre copias separadas. Son pruebas de rechazo, no fixtures de éxito adicionales.

## Archivos e impacto transversal

1 archivo existente modificado: `src/routes/AppRoutes.jsx`, únicamente importación diferida y ruta DEV protegida. No cambia ninguna ruta histórica ni incorpora todavía `/fincas/:fincaId/simulaciones/:simulationId`.

9 archivos nuevos:

- `src/components/IrrigationResults/V2Results.jsx`.
- `src/components/IrrigationResults/V2Results.module.scss`.
- `src/pages/ResultsDemoPage.jsx`.
- `src/utils/irrigationV2Results.js`.
- `src/utils/irrigationV2MetadataShape.json`.
- `src/fixtures/irrigation-v2-results.json`.
- `test/r5-e.test.js`.
- `scripts/verify-r5-e-browser.mjs`.
- `docs/r5-e-checkpoint.md`.

Los otros **80 archivos del baseline son idénticos**, incluidos R5-D completo, servicios HTTP, AuthContext/session/ProtectedRoute, CRUD, menú/footer, estilos compartidos, package/lock, assets y todos los módulos/cálculos Manning. No hay dependencias nuevas ni reinstalación. Backend limpio y sin cambios; descriptor V1 intacto.

## Verificaciones reales

Entorno: Windows, Node 24.16.0, npm 11.13.0, Vite 6.4.5 y Edge/Playwright existente externamente. Se distinguen regresiones con API simulada, demostración sin API y validación pura de contratos.

| Verificación | Resultado |
| --- | --- |
| npm test | **PASS 287/287**, 0 FAIL/omitidos: 179 existentes + 108 R5-E |
| Navegador A1/C y recorridos históricos | **PASS 46/46**, API simulada |
| Navegador R5-D | **PASS 25/25**, API simulada; creación sigue bloqueada |
| Navegador R5-E | **PASS 14/14**, sin ninguna llamada a API ni POST |
| Correspondencia contractual | **PASS** 19 magnitudes, unidades/dominios, schema completo y cinco roundtrips de mappers puros |
| Build final | **PASS**, 100 módulos, 7,55 s; JS 304,03 kB / 98,16 kB gzip |
| CSS productivo | **PASS**, hash y tamaño previos conservados: 38,10 kB / 6,38 kB gzip |
| npm audit --json | **PASS**, 0 vulnerabilidades informadas |
| Reflujo nuevo renderer | **PASS** a 1280, 390 y 320 px, incluidos diagnósticos múltiples y casos inválidos |
| Contraste focalizado | **PASS**: warning 6,69:1, info 12,38:1, error 6,67:1 y blanco/agua 7,37:1; el otro extremo navy del gradiente es más oscuro |
| Teclado y foco | **PASS** de selector, detalles de precisión/evidencia y foco visible; mensajes y unidades accesibles |
| Inmutabilidad | **PASS** de fixtures congeladas en Node y navegador; sin reemplazar resultados por cálculos |
| QA existente adicional | **PASS**: 33 vistas a tres anchos y 12 estados, contenido histórico comparado con R5-D |
| Baseline, alcance, git diff --check y parche completo | **PASS**; parche comprobado sobre copia inicial sin aplicarlo |
| Integración real HTTP/DB/Aiven | **NOT RUN**, no autorizada; cero operaciones reales |
| Lector de pantalla, dispositivos físicos, accesibilidad global | **NOT RUN**; no se declara certificación WCAG global |
| Deploy, activación V2, historial definitivo | **NOT RUN**, fuera de alcance |

Una ejecución inicial de la prueba de teclado esperaba salir del select mientras su popup nativo seguía abierto. Se corrigió la prueba cerrando ese popup con Escape; la ejecución final completa pasó. No requirió alterar la navegación del producto.

**FAIL histórico preservado:** `/calculadora` y `/finca/7/nuevo-calculo` conservan ancho documental 350 px en viewport de 320 px, repetido en este QA. No se agrava ni se atribuye a R5-E. Se mantiene el pendiente histórico de etiqueta del editor Manning. A 390 y 1280 px no se observó ese desborde.

Las suites heredadas contienen POST simulados de contacto/CRUD/servicios; no son escrituras reales ni llamadas desde la demostración. La suite E aborta cualquier petición ajena al servidor frontend y comprueba cero llamadas a API.

## Entrega y Git final

Directorio externo: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-e-implementacion`.

- `node-tests.txt`, `browser-a1-c.txt`, `browser-d.txt`, `browser-e.txt`, `build-final.txt`, `audit.json`.
- `contrato-verificado.json`, `fixtures-procedencia.json`: evidencias contractuales y origen de datos.
- `capturas/` y su `qa.json`: PNG nuevos reales, mediciones y contraste; `final/`: regresiones existentes.
- PDF visual de 15 páginas; ZIP con PNG, evidencias, checkpoint y diff incremental completo.
- `diff-r5-e.patch`, `diff-resumen.json`, `verificacion-alcance.json`, `git-final.txt`.

Frontend final: rama y HEAD iniciales, **1 archivo modificado y 9 nuevos sin staging**. Backend final: HEAD inicial, limpio, ACTIVE_V1. Sin commit, push, deploy, cambios de migrations ni escrituras Aiven.

## Riesgos, límites y siguiente fase

1. La demostración acredita presentación y fidelidad de fixtures; no acredita integración real, creación, persistencia remota ni calibración agronómica.
2. El renderer soporta exactamente el contrato V2 congelado. Datos de otra versión o fuente incoherente se rechazan; no hay renderer V1 anticipado ni elección por versión activa.
3. El formato compacto es de lectura y se marca cuando aproxima. Los valores completos siguen accesibles; no deben reutilizarse textos formateados para cálculos o payloads.
4. Las fixtures y casos negativos se mantienen aislados de producción y del borrador. No hay forma de guardar esos datos como si fueran una simulación del usuario.
5. La lista de diagnósticos no añade juicios agronómicos, no acredita ausencia de riesgo y no atribuye causas a pérdidas estimadas.
6. R5-F deberá incorporar HISTORY paginado por cursor y DETAIL real, resolver por contrato persistido y añadir su renderer V1. Este componente V2 podrá reutilizarse; no se consultará DETAIL por cada fila ni se editarán snapshots.
7. La activación pública y reconciliación de POST incierto siguen en H1/H2, con autorización separada. El descriptor público permanece V1.

**R5-E se detiene para auditoría y aprobación de Lucho. No se inicia R5-F.**
