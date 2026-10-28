# R5-H1/H2 - Preparación frontend con API V2 simulada

Fecha: 27/10/2026. Implementación y verificación local completadas; pendiente de auditoría de Lucho.

**Flujo frontend V2 preparado y verificado con API simulada. Activación pública, integración real y cutover pendientes de autorización**.

## Autorización y preflight

Se leyó la autorización adjunta completa de preparación frontend H1/H2. Se revisaron el maestro `C:\Riegar\Plan\nuevoPlan.txt`, el preflight aprobado, los checkpoints D/E/F/G y el contrato backend real. No se encontró una discrepancia contractual que impidiera preparar el flujo simulado.

Antes de modificar archivos:

- Frontend limpio, sin staging, rama `feature/riego-surcos-v1`, HEAD `2ecb4d85c3ab866a45dce79c1e7efc23a2c12bb1`, cierre de R5-G parcial.
- Backend limpio, misma rama, HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`.
- `const ACTIVE_DESCRIPTOR = ACTIVE_V1;` intacto.
- Baseline externo previo de **103 archivos versionados**, con SHA-256, HEAD y estado Git: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-h1-h2-preparacion\baseline`.

La autorización excluye backend, API real, Aiven, migrations, activación pública, commit, push y deploy. Esta entrega no ejecuta H1/H2 operativas ni H3.

## Evidencia contractual

El payload usa `name` opcional más `crop`, `soil`, `furrow` e `irrigation`, con **15 campos numéricos obligatorios y textura opcional**. Distancia entre surcos es `furrowSpacingM`; cantidad es `furrowCount`, entero positivo seguro. No se agrega versión, descriptor, output, metadata o autoridad del cliente.

Se contrastaron los campos, tipos, unidades, mínimos/máximos, exclusividad, entero y textos con `INPUT_CONTRACT` V2. El payload de referencia pasa el validador puro real del backend y conserva el input golden. Nombre/textura omitidos se comparan con el `null` canónico del backend. Los errores `input.*` y `body.*` se vinculan a los campos UX correspondientes, sin alterar el contrato HTTP.

Confirmación contractual: **201** con `{simulation,model,input,output,metadata}`. El inspector aprobado comprueba identidad, contrato V2, modelo/source hash, inputs, output, metadata, unidades y diagnósticos. El nuevo flujo verifica además finca e igualdad de todos los inputs y nombre normalizado con el intento vigente. Otro 2xx no sustituye 201.

El backend público sigue V1 y rechazaría ese payload V2; no se lo contactó. Sus 34 archivos del manifiesto de freeze permanecen idénticos. La comprobación ejecutó únicamente definiciones y validadores puros, sin motor, HTTP o DB. Esto no verifica el schema vivo ni un ambiente remoto.

Fuentes backend: `src/routes/irrigation-simulations.router.js`, `irrigation-simulations.http.js`, `src/services/irrigation/v2/irrigation-models.js`, `irrigation-validation.js`, `irrigation-simulations.mapper.js`, `irrigation-simulations.versions.js` y contratos/freeze.

## Disponibilidad y bloqueo de producción

Se agrega una condición explícita de ensayo, exclusivamente frontend:

- `import.meta.env.DEV === true` y `PROD !== true`.
- `VITE_RIEGAR_V2_MOCK === "true"`.
- `VITE_API_URL === "https://riegar-v2.invalid"`, destino exclusivo de prueba.

Solo con esas tres condiciones se habilita el envío. El flag no selecciona motor, no cambia contratos backend y no habilita producción. La aplicación de desarrollo normal conserva la preparación sin envíos de D.

`createIrrigationSimulation` mantiene el cliente HTTP existente y añade el bloqueo antes de leer autorización o ejecutar `fetch`. Sin configuración también se rechaza; importar el servicio nativamente sin Vite no evita la protección. La build productiva no monta el asistente y elimina la entrada de creación sin consumidores productivos. La prueba del servicio compilado por separado para producción confirma el rechazo, incluso con flag mock y URL de prueba.

La suite H intercepta todas las solicitudes al destino simulado y aborta cualquier otro destino ajeno al servidor frontend local. No conecta ese host a un backend real. Sin la suite/mock, esa configuración no constituye una integración funcional con un servidor ni una autorización de escritura.

Se reutilizan `createIrrigationSimulation`, el adaptador A1 y los servicios HISTORY/DETAIL. No hay otro cliente HTTP. La exigencia de 201 se aplica solo al servicio de creación de simulaciones; el resto de operaciones mantiene su tratamiento previo de respuestas exitosas.

## Intento, envío único y sesión

Un controlador específico vive dentro del proveedor de borrador, por sesión. Captura un payload independiente e inmutable al comenzar, asociado a la finca; el token queda en el límite de sesión existente y nunca se incorpora al payload, URL o evidencia.

Estados: sin intento, pendiente, rechazo corregible, acceso rechazado, incierto, repetición autorizada y confirmado.

- Se valida el formulario completo antes de llamar al servicio.
- El bloqueo síncrono del controlador evita doble clic y envíos concurrentes, antes de que React actualice el botón.
- Mientras está pendiente se bloquean campos, pasos y correcciones. Modificar el DOM no modifica el payload capturado.
- No se puede descartar/reemplazar el borrador mientras el envío está en proceso. Salir y conservar sí está disponible, con aviso de que no cancela el guardado.
- Logout e invalidación siguen operativos. Al finalizar la sesión se desmonta y limpia el proveedor.
- Secuencia de intento, disposición del controlador y token/expiración vigentes impiden aplicar respuestas atrasadas a otra sesión.
- Un resultado recibido mientras se consulta otra finca no muestra datos ni redirige esa finca. Se conserva la separación de los lectores C/F.

## Confirmación válida

Después de recibir 201 se valida el snapshot completo y su correspondencia con el intento. Solo entonces se conserva una copia inmutable, se limpia el borrador y se navega a la ruta canónica del resultado. En el sandbox, finca/historial y detalle muestran un aviso visible de API simulada y registros de prueba.

La navegación exitosa desmonta el asistente y su bloqueo de salida; no queda atrapada por el modal del borrador. El detalle reutiliza su GET protegido y el renderer existente, sin cálculos locales. Volver a la finca permite consultar el historial; comenzar otra preparación inicia un borrador vacío.

Contrato incorrecto, finca distinta, ID inválido, metadata incompleta, input/nombre distinto o respuesta ilegible no confirman éxito. Tampoco provocan otro POST.

## Rechazos e incertidumbre

Los códigos contractuales 400/422 permiten corregir campos, conservando los valores. Las rutas `input.*`/`body.*` se adaptan únicamente para enfocar el campo UX. Los errores de salida del modelo se presentan como explicación del servidor, sin inventar un campo de entrada o un diagnóstico P01-P05.

401 y token inválido mantienen la invalidación A1. 403 de permisos conserva la sesión. 404 comunica indisponibilidad genérica sin revelar ownership.

Red, interrupción de lectura, JSON ilegible, 500, otro 2xx, códigos no reconocidos o una respuesta no verificable producen:

**«No pudimos confirmar si la simulación se guardó. Revisá el historial de esta finca antes de volver a enviarla».**

No se afirma «No se guardó». El envío queda bloqueado y no hay timers de reenvío, polling o retries automáticos. Un 400/422 no contractual tampoco se interpreta como rechazo confirmado.

## Reconciliación asistida

El panel del intento permite ir al historial de su finca. HISTORY mantiene su paginación y solo consulta summaries: no ejecuta DETAIL por tarjeta. Al abrir voluntariamente un candidato, se utiliza el DETAIL ya consultado por la pantalla para comparar los **17 campos**: 15 números, textura y nombre.

La comparación detallada es desplegable y accesible con teclado, evitando anteponer una lista extensa a los resultados en móvil. Se muestran valores enviados/guardados y coincidencia por campo, sin redondearlos ni deducir datos faltantes. No se modifica el snapshot.

Coincidencia completa no identifica infaliblemente una intención: pueden existir simulaciones legítimas idénticas. Nombre, fecha o summary no bastan. Un candidato diferente o la ausencia de registros tampoco demuestra que el intento haya fallado.

Para repetir hay dos acciones separadas:

1. Abrir y aceptar una advertencia explícita de posible duplicación.
2. Volver a pulsar Calcular y guardar.

Aceptar la advertencia no envía nada. Escape/cancelar mantiene la incertidumbre. No se promete idempotencia ni ejecución exactamente una vez.

## Borrador y navegación

Se mantiene un borrador activo y un intento en memoria, por sesión y finca. No se persiste en localStorage, sessionStorage, URL o backend; el token de autenticación existente no cambia de política.

Recargar, cerrar o terminar sesión pierde el estado temporal, con aviso visible. No se reenvía al recuperar una pantalla. Descartar un intento incierto limpia solo memoria; no deshace el POST ni elimina snapshots. Durante un envío pendiente se permite cancelar la salida o salir y conservar, pero no presentarlo como una cancelación del guardado.

## Archivos del incremento

8 existentes modificados:

| Archivo | Motivo |
| --- | --- |
| `src/services/apiService.js` | Bloqueo de creación fuera del sandbox y exigencia de 201, reutilizando request |
| `src/context/IrrigationDraftContext.jsx` | Intento en memoria, controlador por sesión y coordinación del borrador |
| `src/components/SimulationWizard/SimulationWizard.jsx` | Envío, bloqueo, errores, navegación y salida pendiente |
| `src/components/SimulationWizard/SimulationWizard.module.scss` | Fieldset sin alterar composición aprobada |
| `src/components/FarmDetail/FarmDetail.jsx` | Panel del intento solo DEV, aislado por finca |
| `src/pages/SimulationDetailPage.jsx` | Comparación del candidato solo DEV, reutilizando DETAIL |
| `test/r5-c.test.js` | Transporte en sandbox explícito, fixture 201 y rechazo de otro 2xx |
| `scripts/verify-r5-a1-browser.mjs` | Entorno simulado explícito y módulo de disponibilidad para el harness C |

8 nuevos:

- `src/utils/irrigationAvailability.js`.
- `src/utils/irrigationSubmission.js`.
- `src/components/SimulationSubmission/SubmissionStatus.jsx`.
- `src/components/SimulationSubmission/SubmissionComparison.jsx`.
- `src/components/SimulationSubmission/SimulationSubmission.module.scss`.
- `test/r5-h.test.js`.
- `scripts/verify-r5-h-browser.mjs`.
- `docs/r5-h1-h2-preparacion-checkpoint.md`.

Los otros **95 archivos del baseline permanecen idénticos**, incluidos main/router, protecciones, auth/sesión, CRUD, servicios de lectura, HISTORY, renderers V1/V2, inputs/validación decimal, metadata, fixtures, Manning, rutas históricas, Hero/Navbar/Footer, assets, tokens y estilos globales, package y lockfile. No se instalaron dependencias ni se cambió backend.

## Pruebas ejecutadas y resultados

Windows, Node 24.16.0, npm 11.13.0, Vite 6.4.5 y Edge/Playwright existente. Preview de producción 4173, DEV normal 4174 y DEV simulado 4175. Todos los endpoints de las pruebas se simularon; no se ejecutó API real, backend servidor, DB o Aiven.

| Verificación | Resultado |
| --- | --- |
| Todas las pruebas Node | **PASS 395/395**, 0 FAIL/omitidas: 352 existentes + 1 C + 42 H |
| Navegador A1/C/G | **PASS 50/50**, auth, CRUD/409, contacto, Manning, rutas y transporte simulado |
| Navegador D | **PASS 25/25**, borrador y preparación normal sin POST |
| Navegador E | **PASS 14/14**, renderer/diagnósticos/precisión/null preservados |
| Navegador F | **PASS 36/36**, HISTORY/DETAIL mixtos y aislamiento; cero escrituras |
| Navegador H | **PASS 35/35**, envío, errores, reconciliación, duplicación explícita y respuestas atrasadas |
| Total navegador | **PASS 160 escenarios**, sin sumar repeticiones focalizadas |
| Servicio productivo y sin configuración | **PASS**, rechaza antes de fetch; producción con flag mock también bloqueada |
| Contrato real | **PASS**, 15 números, opcionales, unidades/dominios, validador puro y mapeo real de errores `input.*` |
| Freeze backend | **PASS**, 34 archivos hash idénticos, backend limpio y ACTIVE_V1 |
| Build final | **PASS**, 115 módulos; JS 340,08 kB / 109,17 kB gzip; DETAIL 5,71 kB / 2,34 kB gzip |
| CSS productivo | **PASS**, mismo hash `index-1lvrHU0p.css` y 45,69 kB / 7,59 kB gzip que G; estilos de ensayo excluidos |
| Auditoría completa | **PASS**, 0 vulnerabilidades informadas |
| Responsive nuevo | **PASS focalizado** a 1280, 390 y 320 px, también comparación desplegada y advertencia de duplicación |
| Teclado/foco | **PASS**, errores de campo, estados, comparación, Escape/cancelación y retorno de foco del modal |
| Contraste focalizado | **PASS**, panel de envío 11,78:1 en los tres anchos |
| QA visual existente | **PASS**, 33 vistas y 12 estados, sin errores de página; contenido histórico comparado con G |
| Baseline, alcance, diff y Git | **PASS**, 95 archivos idénticos, diff de 16 archivos comprobado sin aplicarlo, staging vacío |
| PDF y ZIP | **PASS**, 21 páginas renderizadas/revisadas; 19 capturas iguales a los PNG; ZIP íntegro |
| API real / integración / DB / Aiven | **NOT RUN**, no autorizadas; cero escrituras externas |
| Accesibilidad global, lector de pantalla y dispositivos físicos | **NOT RUN**, sin certificación WCAG |
| Lint / instalación limpia | **NOT RUN**, sin script lint y sin necesidad de reinstalar package/lockfile intactos |
| Activación V2, cutover, commit, push, deploy y H3 | **NOT RUN**, fuera de autorización |

Las suites anteriores contienen POST simulados de contacto, fincas, Manning y transporte C. La suite H solo permite el destino de prueba y aborta otros orígenes; sus escrituras existen únicamente en el estado del simulador de pruebas. Los resultados devueltos provienen del golden V2 y un envelope de prueba; no se implementa un motor agronómico en React.

Se corrigieron durante la preparación expectativas del harness: nombre accesible del renderer V2, edición efectiva de un valor para limpiar su error y espera del cierre del modal antes de comprobarlo. La compilación del entorno simulado en los tests usa claves Vite explícitas; reemplazar solo el objeto completo no representaba ese entorno. La revisión contractual incorporó el prefijo real `input.*` en los errores de campo. Las ejecuciones finales completas están registradas.

**FAIL histórico preservado:** Manning mantiene ancho documental 350 px a viewport 320 px en `/calculadora` y `/finca/7/nuevo-calculo`, sin agravarse. Sigue pendiente la etiqueta del editor Manning. No se declara conformidad global a 320 px.

## Evidencias y entrega

Directorio externo: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-h1-h2-preparacion`.

- `git-inicial.txt`, `git-final.txt`, `baseline/manifest.json`: referencias y hashes.
- `node-tests.txt`, `browser-a1-c-g.txt`, `browser-d.txt`, `browser-e.txt`, `browser-f.txt`, `browser-h.txt`: logs completos finales.
- `build-final.txt`, `audit.json`, `contrato-verificado.json`, `qa-visual.txt`.
- `capturas/`: revisión, pendiente, incierto, comparación, resultado, error, duplicación y bloqueo productivo; `qa.json` incluye medidas y contraste.
- `regresion-f/` y `final/`: PNG de regresiones y QA de pantallas existentes.
- `RiegAR_R5-H1_H2_Capturas_reales.pdf`: 21 páginas, principalmente DEV simulado y una vista de producción bloqueada.
- `verificacion-alcance.json`, `verificacion-pdf.json`, `diff-resumen.json`.
- `diff-r5-h1-h2-preparacion.patch`: incremento completo respecto de `2ecb4d8...`, incluyendo nuevos archivos.
- `RiegAR_R5-H1_H2_Preparacion_Checkpoint_capturas_y_diff.zip`: checkpoint, logs, PNG, PDF, estados Git y diff; sin baseline ni secretos.

## Riesgos y decisiones pendientes

1. El simulador acredita UX, transporte y defensas locales, no persistencia remota, ownership real, configuración CORS o disponibilidad de infraestructura.
2. El contrato no ofrece idempotencia ni request ID. Comparar todos los datos ayuda al usuario, sin identificar infaliblemente un intento ni garantizar ausencia de duplicados.
3. El seguimiento se pierde al recargar/cerrar/terminar sesión. El aviso no equivale a recuperación persistente.
4. No se añade un timeout configurable ni un aborto presentado como cancelación del servidor. Si una petición no se resuelve, continúa pendiente; salir y logout siguen disponibles. Ese comportamiento debe revisarse durante la integración operativa.
5. El schema vivo y la recuperación/restauración no se verificaron. Las limitaciones de restore del freeze no se convierten en una certificación por esta entrega.
6. Manning sigue operativo y con sus rutas. Habilitar en el futuro el reemplazo no autoriza automáticamente su retiro.

## Plan de habilitación futura, no ejecutado

1. Auditar y aprobar este checkpoint.
2. Autorizar una integración aislada concreta y sus escrituras de prueba; identificar responsables, datos sintéticos y cleanup.
3. Verificar schema/tracking/lock, lectores V1/V2, auth/ownership, CORS y consumidores del POST V1. Preparar recuperación sin extender excepciones históricas a otro ambiente.
4. Preparar un frontend compatible para el corte mediante un cambio explícito de disponibilidad: montar el proveedor/asistente en producción, sustituir el bloqueo de sandbox del servicio y actualizar accesos/copy. **Cambiar el flag de ensayo no puede habilitar la build pública.** No seleccionar versión por request ni crear endpoint alternativo.
5. Autorizar por separado el cambio acotado del descriptor backend a V2 y la ventana operativa. Seguir el diseño congelado: servicio detenido, transacciones controladas, backend final y frontend compatible coordinados.
6. Validar creación 201, persistencia/readback, historial y detalle, errores y respuesta perdida sin replay en el ambiente autorizado. Después considerar H3, sin despliegue automático.
7. Si existen filas V2, mantener schema ampliado y un puente lector V1/V2 como piso de rollback. No volver al binario V1 original ni ejecutar down automático.

## Estado Git final y detención

Frontend: misma rama y HEAD iniciales, **8 modificados y 8 nuevos**, sin staging. Backend: HEAD inicial, limpio y ACTIVE_V1. Sin commit, push, deploy, cambios de migrations ni operaciones Aiven.

**Flujo frontend V2 preparado y verificado con API simulada. Activación pública, integración real y cutover pendientes de autorización**.

Se detiene el trabajo para auditoría de Lucho antes de solicitar autorización de integración. No se ejecuta el corte público ni se inicia H3.
