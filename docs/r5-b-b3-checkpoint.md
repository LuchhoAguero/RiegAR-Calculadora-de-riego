# R5-B / B-3 - Portada, navegación, Mis fincas y footer

Fecha de cierre: 27/10/2026. **Implementación completada y verificada localmente; pendiente de revisión y aprobación de Lucho. R5-C no iniciada.**

## Autorización y referencia B-2

Lucho aprobó el cierre técnico local B-2 y autorizó expresamente el plan B-3: evolucionar estas cuatro áreas, conservar AgroTech R3, CRUD y rutas, y mantener Manning como herramienta histórica secundaria. La aprobación B-2 no acredita accesibilidad global, integración real ni deploy.

Antes de modificar archivos se guardó una referencia externa:

`C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\b3-implementacion\baseline-b2`

- Copia de 66 archivos del árbol de trabajo, incluido el checkpoint B-2 sin versionar.
- `manifest.json`: SHA-256 y tamaño de cada archivo, rama, HEAD y estado Git.
- `git-diff-b2.patch` y `git-status.txt`: cambios existentes antes de B-3.
- Integridad de las 66 copias comprobada antes y después de la implementación. No se sobrescribió el baseline.
- No se usaron reset, stash, checkout restaurador, commit ni nuevas ramas.

Git inicial y final: rama `feature/riego-surcos-v1`, HEAD `607e2d6c7b45bed6e128fafd36be6c1b7a117ce6`. Al inicio había 17 archivos de presentación modificados de B-2 y su checkpoint sin versionar, sin staging. Se conservaron como punto de partida.

Backend, solo lectura de preservación: HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`, limpio. `ACTIVE_DESCRIPTOR = ACTIVE_V1` confirmado.

## Resultado e impacto

### Inicio

- Título: «Tu trabajo de riego, organizado por finca»; descripción centrada en organizar fincas y consultar cálculos guardados.
- Sin sesión: Crear cuenta e Iniciar sesión. Con sesión: Ir a Mis fincas, hacia `/dashboard`.
- Aviso explícito: «La nueva simulación de riego por surcos está en preparación». Sin acceso de creación V2, resultados ficticios ni promesa de disponibilidad.
- Composición agrícola con el logo y patrón originales. Recorrido explicativo de cuenta, fincas y cálculos actuales; no incorpora fórmulas ni defaults nuevos.
- La fórmula y los reclamos Manning dejaron de ser contenido principal de la portada. La calculadora, su guía y sus fórmulas funcionales se conservan; hay acceso secundario visible en Inicio.

### Navegación y footer

- Mis fincas es el primer enlace de navegación cuando existe sesión. Se conservan acceso, registro y confirmación de logout de A1/B-2.
- Herramientas anteriores contiene Calculadora Manning y Guía Manning, hacia `/calculadora` y `/guia`.
- Desplegable de navegación convencional: botón nativo, `aria-expanded`, `aria-controls`, lista de enlaces oculta mediante `hidden` cuando está cerrada. No se usan roles de menú de aplicación.
- Activación con Enter, Espacio y toque; recorrido Tab; Escape cierra el submenú y devuelve foco a su botón. En móvil, otro Escape cierra la navegación y devuelve foco al botón principal.
- Cierre por toque exterior, salida de foco, enlace, cambio de ruta o sesión. El cierre móvil retira inmediatamente los enlaces del árbol accesible.
- Footer con descripción general de RiegAR, espacio de trabajo y grupo Herramientas anteriores. Los enlaces históricos también quedan visibles allí, sin depender del desplegable.

### Mis fincas

- `/dashboard` se presenta como Mis fincas. Listado antes del formulario, en orden visual y de documento; conserva el enlace histórico de cada finca como «Ver cálculos Manning».
- Nueva finca abre un panel plegable y mueve el foco al nombre. Cerrar formulario, el botón principal o Escape lo pliegan y devuelven foco al botón de apertura.
- El formulario permanece montado al plegarse, con estado React en el mismo Dashboard: nombre, ubicación y error no se borran al cerrar. No hay persistencia en disco, URL ni backend de borradores.
- Aviso visible de pérdida al recargar o salir de la pantalla. Esa pérdida se comprobó; no se promete recuperar datos entre rutas o recargas.
- Carga, error y validación conservan su significado y se exponen mediante status/alert. Se conserva la validación de nombre obligatorio, los campos, las confirmaciones y el rechazo 409.
- Después de crear correctamente, el listado se recarga mediante el flujo existente y los campos se limpian como antes. Si el panel sigue abierto, recupera foco en el primer campo.

## Archivos del incremento B-3

| Tipo | Archivos respecto del baseline B-2 |
| --- | --- |
| Producto: 8 modificados | `src/components/Hero/Hero.jsx`, `Hero.module.scss`; `Navbar/Navbar.jsx`, `Navbar.module.scss`; `Dashboard/Dashboard.jsx`, `Dashboard.module.scss`; `Footer/Footer.jsx`, `Footer.module.scss` |
| Pruebas: 1 modificado | `scripts/verify-r5-a1-browser.mjs`: adapta apertura del formulario y navegación, preserva los 18 escenarios anteriores y agrega 10 escenarios B-3. |
| Documentación: 1 modificada | `docs/r5-b-b2-checkpoint.md`: registra el cierre técnico aprobado por Lucho y el nombre Herramientas anteriores confirmado. |
| Documentación: 1 nueva | `docs/r5-b-b3-checkpoint.md`. |

**Incremento total: 10 archivos modificados y 1 nuevo, de los cuales 8 son producto.** El diff contra HEAD incluye también B-2 y no debe confundirse con el incremento B-3.

La comparación contra el snapshot confirma 56 archivos anteriores idénticos. Se compararon por AST los seis handlers Dashboard de lectura/creación/edición/eliminación y confirmLogout: los siete son idénticos a B-2. Se preservaron los restantes cambios aprobados de B-2.

Sin cambios en Calculator, NuevoCalculo, FincaDetail, Guide, diagramas, utils Manning, rutas, ProtectedRoute, AuthContext, servicios HTTP, tokens/mixins globales B-2, assets o manifiestos. Los ajustes del shell y footer se ven también alrededor de las pantallas históricas; no se afirma identidad de píxeles de la página completa.

## Rutas y contratos

Todas las rutas siguen siendo las anteriores: `/`, `/login`, `/registro`, `/contacto`, `/calculadora`, `/guia`, `/configuracion`, `/dashboard`, `/finca/:id` y `/finca/:id/nuevo-calculo`.

No se agregaron `/fincas` ni rutas de simulaciones. La incorporación contractual de rutas y servicios continúa reservada a las fases aprobadas posteriores. No hay simulaciones públicas, formulario V2, resultados V2, historial versionado ni cambios de descriptor.

CRUD conserva URLs, métodos, payloads, validaciones y tratamiento de respuestas existentes. No se agregan reintentos automáticos. Los cálculos y registros históricos siguen accesibles.

## Verificación ejecutada

Entorno: Windows, Node 24.16.0, npm 11.13.0, React 18.3.1, Vite 6.4.5, Sass 1.93.2; Edge headless y Playwright 1.64.1 externo al repositorio. Sin nuevas dependencias ni modificaciones de lockfile; instalación B-2 reutilizada.

| Verificación | Resultado real |
| --- | --- |
| `npm test` | 46/46, sin fallos ni omitidos: HTTP, servicios, auth y tres regresiones numéricas Manning. |
| `npm run build` final | 93 módulos, 6,79 s, sin errores ni avisos Sass. El módulo adicional corresponde a iconos `react-icons/fi`, dependencia ya instalada. CSS 35,61 kB / gzip 6,11 kB; JS 239,25 kB / gzip 77,63 kB. |
| Auditorías | `npm audit` y `npm audit --omit=dev`: 0 vulnerabilidades en ambas. |
| Navegador funcional | **28/28, 0 fallos**: 18 escenarios conservados y 10 B-3. API totalmente interceptada; tokens y datos sintéticos. |
| Navegación y auth | Rutas públicas/protegidas, login/registro/logout/atrás, expiración y otra pestaña; prioridad de Mis fincas, CTA según sesión y accesos desde Inicio/footer. |
| Herramientas anteriores | Teclado, Enter/Espacio, Tab/Shift+Tab, Escape y foco, cierre exterior, navegación/atrás, toque a 390 y 320, apertura/cierre, acceso a calculadora y guía y cierre de menú tras navegar. |
| Formulario y CRUD | Panel cerrado fuera del recorrido Tab; lista anterior al formulario; foco al abrir/cerrar; conservación por Escape, botón interno y botón principal; payload correcto; validación sin POST; error con datos conservados y un solo POST; pérdida declarada al recargar/salir; cancelación de edición/borrado y rechazo 409. |
| Responsive | 10 vistas por tres anchos (1280, 390, 320): 30 mediciones, más estados de carga, error y vacío, menú, panel y portada autenticada. Sin desbordes nuevos. |
| Contrastes/foco | Se mantienen pares B-2 comprobados desde estilos computados: navy/verde 5,16:1, agua/fondo 6,58:1, cultivo/fondo 5,60:1, errores 6,67:1, borde de campo 3,35:1. Foco visible de 3 px y retorno de foco comprobados. No es auditoría WCAG global. |
| Manning | Tres resultados numéricos, guardado y modal histórico en suite; contenido principal de calculadora, nuevo cálculo, detalle, guía y configuración comparado con B-2 en los tres anchos. Fuentes preservadas por hash. |
| Alcance e integridad | Integridad SHA-256 del snapshot, lista cerrada de archivos modificados, siete handlers por AST y `git diff --check` sin errores. El patch incremental pasó `git apply --check --ignore-space-change` sobre la copia B-2, sin aplicarlo ni modificar el baseline. Backend limpio, rama/HEAD sin cambios. |
| Evidencia visual | 53 PNG reales de la build local, comparaciones B-2/B-3 y PDF de 15 páginas; API simulada. |

La primera tanda de navegador dio 26 PASS / 2 FAIL: el cierre móvil mantenía momentáneamente la navegación en el árbol accesible por la transición de visibility. Se retiró esa transición, los dos casos focales pasaron y la tanda completa final pasó 28/28. Las repeticiones no se suman como escenarios adicionales.

## Riesgos y pendientes

- Se mantiene el desborde histórico de Manning: 350 px de contenido con viewport 320 px, en calculadora pública y nuevo cálculo. No se modificaron esos módulos. A 390 y 1280 no se detectó ese desborde.
- Persisten las limitaciones históricas de accesibilidad Manning documentadas en B-2, incluida la etiqueta de edición de nombre sin asociación. No se acredita accesibilidad global.
- Conservar datos al plegar no equivale a persistencia: recarga, salida de ruta o fin de sesión pueden perderlos. La interfaz informa el límite y no crea una infraestructura de borradores.
- No se certifican API, DB, correo, ownership real, integración remota, lector de pantalla, otros navegadores ni dispositivos físicos. No existe script lint. No hubo llamadas al backend real ni escritura de datos.
- Las simulaciones por surcos continúan en preparación. La disponibilidad backend V1/V2 no constituye autorización de activar V2 ni de implementar el siguiente bloque.

## Evidencia y reproducción

Directorio externo:

`C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\b3-implementacion`

- `baseline-b2/`: referencia inmutable anterior a las modificaciones.
- `diff-incremental-b3.patch`, `diff-incremental-resumen.json`: incremento B-3 frente a ese baseline.
- `verificacion-alcance.json`: hashes, archivos preservados y handlers.
- `final/qa.json`, `final/*.png`: mediciones, contrastes, estados y capturas.
- `RiegAR_B3_Capturas_reales.pdf`: 15 páginas para revisión digital.
- `RiegAR_B3_Capturas_y_diff_incremental.zip`: capturas, comparaciones, checkpoint y evidencia incremental.

Las pruebas funcionales se repiten con build, preview en `127.0.0.1:4173` y el comando del checkpoint A1 para `scripts/verify-r5-a1-browser.mjs`. Playwright continúa externo al manifiesto. La evidencia responsive se reproduce con `capture-b3.mjs final` en el directorio padre; la verificación de alcance con `verify-b3-scope.mjs`.

## Estado Git y cierre

- Frente a HEAD: 20 archivos tracked modificados y dos documentos sin versionar (B-2 y B-3). Ningún archivo staged o eliminado.
- Frente a B-2: ocho archivos de producto, un script de pruebas y un documento modificados, más este checkpoint nuevo.
- Rama y HEAD iniciales conservados. Backend limpio y descriptor ACTIVE_V1 preservado.
- Sin commit, push, deploy, cambios DB/migrations ni inicio R5-C.
- **B-3 se detiene en este checkpoint para revisión y aprobación de Lucho.**
