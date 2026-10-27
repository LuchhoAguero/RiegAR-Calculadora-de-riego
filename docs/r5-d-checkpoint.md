# R5-D - Formulario agronómico V2, preparación local

Fecha: 27/10/2026. **Implementación local completada; pendiente de auditoría y aprobación de Lucho. R5-E no iniciada.**

## Autorización y baseline

Lucho aprobó el preflight y autorizó el asistente de cinco pasos, política decimal R2/R3, un único borrador en memoria, cambio acotado del router y disponibilidad exclusiva en desarrollo. No autorizó POST real, activación V2, backend, Aiven, commit, push ni deploy.

- Frontend inicial y final: rama `feature/riego-surcos-v1`, HEAD `584aad3a5d2e8be758f18acc6dc8fbab0bdecef4`. Inicialmente limpio; el commit incluye los 12 archivos de R5-C sobre el cierre B-2/B-3.
- Backend inicial y final, exclusivamente en lectura: misma rama, HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`, limpio; `ACTIVE_DESCRIPTOR = ACTIVE_V1`.
- Maestro: `C:\Riegar\Plan\nuevoPlan.txt`, continuidad 26/10/2026, complementado con aprobaciones y checkpoints posteriores. Política decimal corregida R2, conservada en R3.
- Antes de editar: copia externa íntegra de los **72 archivos versionados**, con SHA-256, rama, HEAD y estado Git, en `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-d-implementacion\baseline`. Sin archivos privados de entorno ni secretos.
- No se realizaron reset, stash, restauraciones, nuevas ramas, staging ni commits.

## Orden ejecutado e impacto del router

Primero se sustituyó únicamente el arranque BrowserRouter por `createBrowserRouter`/`RouterProvider`, con una ruta raíz comodín que conserva App y AppRoutes. AuthProvider mantiene su implementación y protocolo; envuelve al router.

**Antes de incorporar el formulario**, la build pasó y se ejecutaron las 46 regresiones existentes: rutas públicas/protegidas, login, registro, logout, expiración, sincronización entre pestañas, CRUD/409, contacto, navegación y accesos/cálculos Manning. Resultado 46 PASS / 0 FAIL. Se agregó y ejecutó por separado la comprobación Atrás/Adelante del alias: 1 PASS / 0 FAIL.

Luego se incorporó el proveedor de borrador únicamente en DEV. El bloqueo usa `useBlocker`, sin interceptores manuales de enlaces ni reconstrucción de history. La regla consulta también la sesión vigente antes de bloquear: logout e invalidación no quedan retenidos por un borrador. Se verificó expiración incluso con un diálogo de salida abierto.

No se reorganizó AppRoutes masivamente ni se modificó autenticación, CRUD o rutas históricas. El router de datos aumenta el JS de producción: de 243,78 kB / 78,80 kB gzip en R5-C a **304,03 kB / 98,15 kB gzip** en esta build. Es el coste observado del cambio aprobado; no hubo dependencias nuevas. CSS productivo conserva el hash y tamaño anteriores: 38,10 kB / 6,38 kB gzip.

## Disponibilidad y ausencia de escritura

- Ruta nueva protegida: `/fincas/:fincaId/simulaciones/nueva`.
- En desarrollo (`import.meta.env.DEV`), el detalle de finca ofrece «Preparar simulación (solo local)». Se verifica ID y pertenencia mediante la colección autenticada `getFincas()`, sin inventar GET individual.
- El asistente se carga con importación diferida solo en DEV. En producción no se monta ni se incluye el módulo visual del asistente; el enlace local tampoco se presenta. El acceso directo muestra «Simulación en preparación» con navegación de vuelta y sin formulario.
- Aviso visible: preparación local, sin cálculo ni guardado; posible pérdida del borrador al recargar/cerrar.
- «Calcular y guardar» es un botón deshabilitado y explicado. La acción local «Validar preparación» construye el payload en memoria e informa que no se envió ni guardó una simulación. No presenta resultados ficticios.
- El asistente no importa ni invoca `createIrrigationSimulation`, fetch ni otro transporte de creación. Enter se procesa como navegación/validación local; no hay action de envío a un servidor.
- No hay selector de versión, feature flag de activación pública, retry, reconciliación operativa ni modificaciones de snapshots.

## Contrato V2 aplicado

Fuentes backend inspeccionadas: `src/services/irrigation/v2/irrigation-models.js`, su validador, adaptador HTTP, mapper de aplicación y registro de versiones. Los validadores puros se contrastaron externamente sin engine, HTTP ni DB.

| Grupo | Campo | Unidad | Dominio |
| --- | --- | --- | --- |
| crop | etoMmPerDay | mm/día | >= 0 |
| crop | cropCoefficient | adimensional | >= 0 |
| crop | daysWithoutIrrigation | días | >= 0 |
| soil | texture | texto | Opcional; hasta 64 puntos de código Unicode tras trim |
| soil | fieldCapacityPct | % | > 0 y <= 100 |
| soil | wiltingPointPct | % | >= 0 |
| soil | bulkDensityGcm3 | g/cm³, canónico g/cm3 | > 0 |
| soil | rootDepthM | m | > 0 |
| soil | depletionThresholdPct | % | > 0 y <= 100 |
| furrow | furrowSpacingM | m | > 0 |
| furrow | lengthM | m | > 0 |
| furrow | slopePct | % | >= 0 |
| furrow | furrowCount | surcos | Entero seguro 1..9007199254740991 |
| irrigation | flowLps | L/s por surco | > 0 |
| irrigation | durationMin | min | > 0 |
| irrigation | advanceTimeMin | min | >= 0 |
| raíz | name | texto | Opcional; hasta 255 puntos de código Unicode tras trim |

Los 15 números obligatorios comienzan vacíos, incluidos los que permiten cero. Solo cantidad de surcos exige un entero. No se agregan máximos agronómicos, presets de textura ni valores por defecto.

Relaciones: CC > PMP y avance <= duración. CC/PMP se identifican como porcentajes gravimétricos en base seca. La textura es descriptiva; no completa otros campos.

El constructor devuelve exclusivamente `{crop,soil,furrow,irrigation,name?}`, con `furrowSpacingM` y `furrowCount`. Nombre y textura opcionales sin contenido se omiten; los textos informados se normalizan como prevé el backend. No salen `widthM`, propietario, versión, resultados, diagnósticos, metadata ni hashes. No se calcula ninguna magnitud agronómica.

## Decimales y precisión

- Coma o punto: `1,30` y `1.30` representan 1,3; el texto permanece intacto mientras se edita.
- Parte entera positiva no nula, un separador y tres cifras decimales: `1.300`, `1,300`, `12.345`, `1000,001` exigen elegir explícitamente decimal o entero. Ninguna opción aparece seleccionada. Enter no elige una interpretación.
- La elección queda ligada al texto exacto y se invalida al editar. Se muestra «Se usará ...» con valor inequívoco y unidad. No se admiten agrupadores como formato ordinario de captura.
- `0,001`, `0.001` y decimales pequeños representables se aceptan. No se limita artificialmente a dos o tres cifras.
- Se rechazan agrupadores repetidos/mezclados, espacios, notación científica de entrada, caracteres ajenos y valores no finitos. Una fracción menor que uno requiere cero inicial.
- Vacío nunca se convierte en cero. No se usa toFixed, clamp ni redondeo para construir el JSON. Se compara la representación decimal canónica con el Number resultante y se rechaza pérdida detectable de dígitos, overflow o underflow a cero.
- Se usa el mismo formato numérico Number/JSON del contrato. No se exige exactitud binaria imposible para decimales ordinarios como 0,1. La serialización JSON puede representar números pequeños con exponente: la prohibición de notación científica corresponde a la entrada del usuario.
- Cantidad de surcos acepta solo dígitos y se valida como entero positivo seguro, sin interpretación fraccionaria.

## Pasos, borrador y accesibilidad

Cultivo -> Suelo -> Surcos -> Riego -> Revisión. Continuar valida el paso, conserva los datos y enfoca el primer error. Atrás no exige completar el paso abandonado. Se pueden reabrir pasos alcanzados; no se habilitan futuros por omisión. Revisión valida el conjunto y enlaza las correcciones a sus grupos/campos. No muestra resultados calculados.

Un único borrador en memoria vive por encima de las rutas: finca, nombre contextual, cadenas, aclaraciones decimales y progreso. No hay localStorage/sessionStorage/URL/backend de borradores. Se conserva la persistencia de token que ya existía en autenticación; no se añade otra.

- Salida interna: conservar, descartar o cancelar. El descarte no reinicia ni resucita un borrador antes de salir.
- Otra finca con borrador conservado: volver al borrador anterior, descartarlo y comenzar aquí o cancelar. No hay transferencia ni varios borradores implícitos.
- Logout, token expirado o cambio de sesión: proveedor nuevo con estado vacío. El bloqueo no impide navegar a login/inicio.
- Lecturas atrasadas se ignoran tras desmontaje o cambio de contexto. El estado de finca también se aísla antes de pintar otra sesión. El hook compartido conserva la protección R5-C.
- Recargar o cerrar puede perder los datos. Se agrega beforeunload como advertencia nativa cuando el navegador la permite; no se promete diálogo personalizado ni recuperación.

Se reutilizan Modal y sus reglas de foco/Escape/retorno, tokens/mixins AgroTech, botones de 44 px, etiquetas/unidades, aria-required, aria-invalid, ayudas y errores asociados. El progreso usa aria-current="step". En móvil, números de paso con nombres accesibles y título visible del paso actual; campos en una columna y revisión apilada. Los colores de categoría no representan severidad agronómica.

Una comprobación adicional detectó un título enfocado bajo la cabecera fija en escritorio. Se corrigió el desplazamiento de títulos y errores al centro visible; la prueba de posición pasó en los tres anchos y la suite completa volvió a pasar.

## Archivos del incremento

4 modificados:

- `src/main.jsx`: router y proveedor DEV.
- `src/routes/AppRoutes.jsx`: ruta nueva protegida.
- `src/components/FarmDetail/FarmDetail.jsx`: extracción de lectura compartida y enlace solo local; presentación productiva conservada.
- `scripts/verify-r5-a1-browser.mjs`: una comprobación adicional Adelante para la compatibilidad del router.

9 agregados:

- `src/pages/NewSimulationPage.jsx`.
- `src/components/SimulationWizard/SimulationWizard.jsx`.
- `src/components/SimulationWizard/SimulationWizard.module.scss`.
- `src/context/IrrigationDraftContext.jsx`.
- `src/hooks/useOwnedFarm.js`.
- `src/utils/irrigationV2Form.js`.
- `test/r5-d.test.js`.
- `scripts/verify-r5-d-browser.mjs`.
- `docs/r5-d-checkpoint.md`.

La suite R5-D se separó en un archivo específico para probar DEV y producción con un interceptor que prohíbe todo POST de simulación, manteniendo la suite histórica sin una ampliación masiva. Es el único archivo adicional respecto del inventario orientativo del preflight.

Los otros **68 archivos del baseline siguen idénticos**, incluidos AuthContext/session/ProtectedRoute, Dashboard/CRUD, apiService completo, fórmulas y componentes Manning, assets, package/lock y estilos compartidos. No cambian documentos anteriores. No hay dependencias nuevas ni reinstalación.

## Pruebas y evidencias reales

Entorno: Windows, Node 24.16.0, npm 11.13.0, Vite 6.4.5, Edge automatizado con Playwright disponible externamente. DEV y preview locales; API interceptada por completo.

| Comprobación | Resultado |
| --- | --- |
| Router antes de implementar formulario | PASS 46/46 regresiones + 1 prueba focalizada Atrás/Adelante |
| npm test | PASS 179/179, 0 FAIL/omitidos: 94 existentes + 85 R5-D |
| Campos/unidades/dominios contra contrato y validador puro V2 | PASS, 76 comparaciones; sin engine/HTTP/DB |
| Suite R5-D DEV/producción | PASS 25/25, 0 FAIL; cero POST de simulación en todos los escenarios |
| Regresión existente sobre producción | PASS 46/46, 0 FAIL, incluido CRUD/409, auth, contacto, Manning y R5-C |
| Build final | PASS, 100 módulos, 7,20 s; JS 304,03 kB / 98,15 kB gzip |
| npm audit --json | PASS, 0 vulnerabilidades informadas en esta ejecución |
| Reflujo nuevo asistente | PASS a 1280, 390 y 320 px; cinco pasos completos |
| QA de pantallas existentes | PASS 33 vistas y 12 estados; contenido histórico comparado con R5-C |
| Contraste focalizado | PASS: botón 5,16:1, borde de campo 3,35:1, aviso 12,38:1, paso activo 13,86:1, error 6,67:1 |
| Teclado/foco/modal | PASS en alcance focalizado, incluido título sin quedar bajo cabecera y ciclo Tab/Escape a 320 |
| Baseline, alcance, git diff --check y parche sobre copia inicial | PASS; sin aplicar parche ni modificar baseline |
| Integración HTTP real, Aiven y simulaciones reales | NOT RUN, no autorizadas; cero operaciones reales |
| Lector de pantalla, dispositivos físicos y accesibilidad global | NOT RUN; no se declara certificación WCAG global |
| Deploy, hosting y activación V2 | NOT RUN |

La suite histórica conserva pruebas directas del servicio POST con fetch/API simulados, heredadas de R5-C. No son envíos del asistente ni operaciones reales. La suite R5-D rechaza cualquier intento de POST de simulación y verifica que no haya ninguno.

**FAIL histórico preservado:** Manning conserva ancho documental 350 px en viewport 320 px en `/calculadora` y `/finca/7/nuevo-calculo`. La medición se repitió; no se agrava ni se atribuye a R5-D. A 390/1280 no aparece ese desborde. Se mantiene también el pendiente histórico de asociación de etiqueta del editor Manning.

Evidencias externas: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-d-implementacion`.

- `router-regresion.txt`, `router-atras-adelante.txt`: validación previa del cambio obligatorio.
- `node-tests.txt`, `browser-r5-d.txt`, `browser-regresion-final.txt`, `build-final.txt`.
- `contrato-verificado.json`: comparación de contrato y validador V2.
- `capturas/`: los cinco pasos a tres anchos y estados reales; `qa.json` con resultados, contraste y anchos.
- `final/`: regresión visual de pantallas existentes y medición Manning.
- PDF de revisión de 20 páginas y ZIP con PNG, checkpoint, diff y evidencia.
- `diff-r5-d.patch`, `diff-resumen.json`, `verificacion-alcance.json`, `git-final.txt`.

## Riesgos y recomendación para R5-E

1. La preparación del payload no certifica cálculo ni guardado. El POST activo sigue V1 y es incompatible con ese cuerpo V2. La activación requiere R5-H1 y aprobación separada.
2. Borrador deliberadamente volátil: sin recuperación después de recargar/cerrar/terminar sesión; advertido. beforeunload depende del navegador y no permite tres acciones personalizadas.
3. La validación UX estructural no puede asegurar consistencia matemática del engine para cualquier magnitud finita; un futuro 422 debe manejarse sin inventar correcciones o resultados.
4. El router añade tamaño al bundle. Se preservaron rutas y protocolos con regresiones; no se hizo optimización masiva ajena al alcance.
5. La finca se obtiene desde la colección autenticada completa, decisión heredada de R5-C. No hay cache global ni endpoint individual inventado.
6. Guardado incierto queda especificado para el futuro: pudo persistir, no retry automático, reconciliación HISTORY/DETAIL en F/H2. No se implementa una interfaz engañosa de envío incierto cuando todavía no se envía nada.
7. Antes de R5-E, auditar esta entrega. Después, preflight del renderer por contrato persistido, unidades, null y diagnósticos P01-P05 con fixtures contractuales. Mantener resultados/historial desconectados de creación pública mientras no haya cutover autorizado.

Git final: HEAD y rama iniciales, **4 modificados y 9 nuevos sin staging**; backend limpio y V1. No hubo commit, push, deploy, cambio de migrations ni acceso operativo a Aiven.

**Se detiene R5-D para auditoría y aprobación de Lucho. R5-E no iniciada.**
