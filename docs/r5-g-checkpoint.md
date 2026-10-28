# R5-G parcial - Reducción de exposición de Manning

Fecha: 27/10/2026. Implementación y verificación local completadas; pendiente de auditoría de Lucho.

**R5-G parcial: reducción de exposición completada. Retiro funcional y de rutas Manning pendiente de autorización posterior**.

## Autorización y estado inicial

Lucho aprobó la auditoría de R5-F y autorizó exclusivamente reducir la exposición de Manning. No autorizó retirar su funcionamiento, rutas, módulos o datos, activar V2 ni iniciar R5-H1/H2.

Antes de modificar archivos se comprobó:

- Frontend limpio, sin staging, rama `feature/riego-surcos-v1`.
- HEAD frontend `915d4d5f8a44cc7091f42c4c5df0ba32d8d6bf69`, cierre de R5-F; se conserva sin nuevos commits.
- Backend limpio, rama `feature/riego-surcos-v1`, HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`.
- `src/services/irrigation-simulations.versions.js`: `const ACTIVE_DESCRIPTOR = ACTIVE_V1;`, intacto.
- Copia previa de los **102 archivos versionados**, con hashes SHA-256 y manifiesto Git, fuera del repositorio: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-g-parcial\baseline`.

Fuentes: autorización expresa de R5-G parcial, maestro `C:\Riegar\Plan\nuevoPlan.txt`, preflight aprobado, checkpoint R5-F y código real. La autorización parcial acota el retiro previsto por el maestro: las rutas no se dan de baja en este incremento.

## Cambios y resultado

### Inicio

Se retira la sección promocional de Herramientas anteriores del contenido principal. Se conserva el título, los CTA de cuenta/Mis fincas, logo original, fondo agrícola, identidad AgroTech y aviso de nueva simulación en preparación.

El texto ahora distingue la consulta de simulaciones de riego guardadas de los cálculos históricos Manning. No anuncia creación V2, no incorpora botones de cálculo ni realiza consultas a API desde la portada.

### Navbar

Se retira el submenú Herramientas anteriores y solo su estado, referencias, manejadores y CSS exclusivos. Mis fincas, Contacto, login, registro, confirmación de logout y menú móvil permanecen.

Escape cierra el menú móvil y devuelve el foco a su botón. Navegar o cambiar el estado de sesión sigue cerrando el menú. No se modifican autenticación, permisos, rutas o servicios.

### Detalle de finca

Orden visual y documental:

1. Datos de la finca.
2. Historial de simulaciones de riego.
3. Simulaciones de la finca, con creación deshabilitada y acceso local DEV existente.
4. **Cálculos anteriores — Manning**, compacto y plegado por defecto.

El acceso usa `details/summary` nativo, sin dependencias ni un nuevo sistema de menús. Enter, Espacio y toque abren/cierran. El navegador expone el estado expandido de forma nativa; no se duplica con un atributo ARIA manual. Cuando está cerrado, el enlace interior no participa de la navegación con Tab.

Escape dentro del desplegable abierto lo cierra y devuelve el foco al resumen. La acción no bloquea Escape cuando está cerrado ni cambia los controles de logout. Se conserva el foco visible global, objetivo táctil mínimo de 44 px y reflujo móvil.

Abrir/cerrar no consulta API ni modifica datos. El enlace sigue apuntando a `/finca/:id`. Un texto diferencia los cálculos Manning de las simulaciones por surcos; no se mezclan registros.

### Footer y compatibilidad

Footer no fue modificado: conserva calculadora y guía como accesos secundarios. Se comprobó navegación mediante teclado y toque.

Las rutas `/calculadora`, `/guia`, `/finca/:id` y `/finca/:id/nuevo-calculo` permanecen sin modificaciones, con acceso directo y recarga. También se preservan rutas canónicas de fincas/simulaciones, alias `/dashboard`, protecciones y permisos existentes.

Manning conserva cálculo, exportación y guardado histórico en su implementación; cálculo y guardado se verificaron con API simulada. No se deshabilitan edición o eliminación históricas ni se cambia su contrato. La compatibilidad local no certifica operaciones contra el backend real.

## Impacto transversal y preservación

La reducción de Navbar cambia expectativas de las pruebas B-3: se sustituyen sus escenarios del submenú retirado por ausencia en navegación principal y acceso funcional desde Footer. Se conserva la cobertura de Escape/foco del menú móvil. Se agregan cuatro escenarios: desplegable/jerarquía/teclado a tres anchos y acceso directo/recarga de las cuatro rutas Manning.

Las pruebas C/F que acceden a Manning desde una finca abren primero el nuevo desplegable; no se eliminan sus comprobaciones de acceso histórico.

Los otros **94 archivos del baseline permanecen idénticos**, incluidos:

- Router y protección de rutas.
- Cliente HTTP, servicios, AuthContext y sesión.
- CRUD de fincas, validaciones y rechazo `409 FARM_HAS_IRRIGATION_SIMULATIONS`.
- Calculadora Manning, fórmulas, diagramas, guía, historial y guardado.
- Formulario y borrador R5-D.
- HISTORY/DETAIL, renderers V1/V2, metadata, diagnósticos y snapshots R5-E/F.
- Footer, logos, recursos, tokens y estilos globales.
- Package y lockfile; sin dependencias nuevas ni reinstalación.

Backend, DB, migrations, Aiven y descriptor activo no se modificaron. La creación V2 sigue deshabilitada en producción y el asistente sigue siendo preparación local DEV, sin conectar su POST.

## Archivos del incremento

8 existentes modificados:

| Archivo | Cambio |
| --- | --- |
| `src/components/Hero/Hero.jsx` | Retira promoción Manning y precisa consulta de simulaciones |
| `src/components/Hero/Hero.module.scss` | Retira exclusivamente los estilos de la sección eliminada |
| `src/components/Navbar/Navbar.jsx` | Retira submenú Manning, conserva navegación y sesión |
| `src/components/Navbar/Navbar.module.scss` | Retira estilos exclusivos del submenú |
| `src/components/FarmDetail/FarmDetail.jsx` | Prioridad vertical y desplegable secundario accesible |
| `src/components/FarmDetail/FarmDetail.module.scss` | Presentación compacta y responsive del desplegable |
| `scripts/verify-r5-a1-browser.mjs` | Regresiones afectadas y cuatro escenarios nuevos |
| `scripts/verify-r5-f-browser.mjs` | Abre el desplegable para comprobar acceso histórico |

1 nuevo: `docs/r5-g-checkpoint.md`.

No se crean carpetas de producto, componentes, rutas o abstracciones adicionales.

## Pruebas ejecutadas

Entorno: Windows, Node 24.16.0, npm 11.13.0, Vite 6.4.5, Edge/Playwright existente. Build preview en `127.0.0.1:4173` y DEV en `127.0.0.1:4174`, iniciados para esta verificación. La API de navegador se interceptó y simuló; no se contactó el backend real.

| Verificación | Resultado real |
| --- | --- |
| Todas las pruebas Node disponibles | **PASS 352/352**, 0 FAIL/omitidas; sin cambios en sus archivos |
| Navegador A1/C/G | **PASS 50/50**, incluido auth, registro, logout, CRUD, 409, contacto, Manning y cuatro casos nuevos |
| Navegador D | **PASS 25/25**, borradores, sesiones, respuestas atrasadas, navegación y bloqueo de producción |
| Navegador E | **PASS 14/14**, renderer V2, precisión, null y diagnósticos |
| Navegador F | **PASS 36/36**, historial mixto, cursor, DETAIL V1/V2, errores e aislamiento; cero escrituras |
| Total navegador | **PASS 125 escenarios**, 0 FAIL |
| Build de producción | **PASS**, 113 módulos, 6,75 s |
| Tamaños de build | CSS 45,69 kB / 7,59 kB gzip; JS principal 340,07 kB / 109,16 kB gzip; DETAIL 5,68 kB / 2,34 kB gzip |
| Auditoría completa de dependencias | **PASS**, 0 vulnerabilidades en `npm audit --json` |
| Inicio/Navbar/Footer | **PASS**, sin promoción Manning en main/Navbar; accesos secundarios operativos con teclado y toque |
| Desplegable | **PASS**, Enter/Espacio/toque, Escape desde enlace interior, foco inicial/retorno, Tab omite contenido plegado, sin consultas adicionales |
| Jerarquía de finca | **PASS**, datos, historial, simulaciones y acceso anterior en ese orden |
| Rutas Manning | **PASS**, acceso directo y recarga de las cuatro rutas, cálculo y guardado simulados |
| Responsive | **PASS focalizado**, superficies modificadas a 1280, 390 y 320 px; sin declarar conformidad global |
| Contraste focalizado | **PASS**, resumen del desplegable 12,21:1 y enlace histórico 13,86:1; foco visible verificado |
| QA visual adicional | **PASS**, 33 vistas a tres anchos y 12 estados, sin errores de página; contenido de las pantallas históricas igual a R5-F |
| Alcance, hashes y `git diff --check` | **PASS**, baseline íntegro y 94 archivos idénticos |
| Diff incremental completo | **PASS**, 9 archivos incluyendo este documento; comprobado sin aplicarlo contra la copia inicial |
| PDF y ZIP | **PASS**, PDF de 15 páginas renderizado/revisado; 13 capturas coinciden con sus PNG; ZIP íntegro |
| Integración real HTTP/DB/Aiven | **NOT RUN**, no autorizada; cero operaciones reales |
| Lector de pantalla, dispositivos físicos, accesibilidad global | **NOT RUN**, sin certificación WCAG global |
| Lint | **NOT RUN**, no existe script/configuración de lint en el proyecto |
| Instalación limpia | **NOT RUN**, dependencias ya disponibles y package/lockfile intactos; no se necesitó reinstalar |
| Commit, push, deploy, activación V2, R5-H1/H2 | **NOT RUN**, no autorizados |

Las suites A1/C contienen POST simulados de contacto, CRUD, guardado Manning y pruebas directas del servicio de simulaciones heredadas de C. Estos últimos no habilitan el POST desde la interfaz. Las suites D/F y la demo E mantienen sus prohibiciones de escrituras de simulación. No hubo escrituras reales.

**FAIL histórico preservado:** `/calculadora` y `/finca/7/nuevo-calculo` conservan ancho documental de 350 px a viewport de 320 px, igual que R5-F. No se agravó. Sigue pendiente la asociación de etiqueta del editor Manning. La reducción de exposición no resuelve esos defectos ni constituye conformidad global a 320 px.

No hubo fallos en las ejecuciones finales de las suites de esta fase. Los cambios de pruebas corresponden a la nueva navegación aprobada; no se quitaron comprobaciones de cálculo, guardado, auth, CRUD o historial.

## Evidencias y entrega

Directorio externo: `C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\r5-g-parcial`.

- `git-inicial.txt`, `git-final.txt`, `baseline/manifest.json`: referencias verificables.
- `node-tests.txt`, `browser-a1-c-g.txt`, `browser-d.txt`, `browser-e.txt`, `browser-f.txt`: ejecuciones completas.
- `build-final.txt`, `audit.json`, `qa-visual.txt`: build, dependencias y QA.
- `capturas/`: escenarios nuevos y regresiones A1/C con API simulada.
- `regresion-f/`: resultados V1/V2, historial y errores de F.
- `final/`: PNG de la implementación y `qa.json` con medidas, contraste y comparación histórica.
- `RiegAR_R5-G_parcial_Capturas_reales.pdf`: 15 páginas de revisión visual, con datos sintéticos.
- `verificacion-alcance.json`, `verificacion-pdf.json`, `diff-resumen.json`: preservación y controles de entrega.
- `diff-r5-g-parcial.patch`: incremento completo desde el commit inicial, incluyendo el documento nuevo.
- `RiegAR_R5-G_parcial_Checkpoint_capturas_y_diff.zip`: PDF, PNG, logs, checkpoint, estados Git y diff; sin baseline ni secretos.

## Riesgos y pendientes

1. No existe certificación de integración real por estas pruebas simuladas. Auth/ownership/CORS y operaciones remotas requieren un ambiente y autorización específicos.
2. Manning sigue operativo por diseño: quitar promoción y submenú no retira cálculo, guardado, edición/eliminación histórica ni sus rutas.
3. No se migra ni transforma Manning en snapshots V1/V2. La eliminación de finca conserva su contrato existente: con simulaciones responde 409; sin ellas puede eliminar finca y cálculos históricos en transacción.
4. La consulta V1/V2 conserva las limitaciones R5-F: al volver a una finca se reconsulta la primera página y no hay virtualización de listas extensas. No son cambios de R5-G.
5. La baja funcional y de rutas requiere autorización posterior. No debe dejarse el producto sin creación operativa mientras V2 sigue bloqueada.
6. No se actualiza documentación académica histórica ni se inicia el cutover. R5-H1/H2 y despliegue permanecen fuera de alcance.

## Estado Git final y detención

Frontend: misma rama y HEAD `915d4d5f8a44cc7091f42c4c5df0ba32d8d6bf69`, **8 archivos modificados y 1 nuevo**, sin staging. Ningún commit, push o deploy.

Backend: HEAD inicial `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`, limpio; `ACTIVE_DESCRIPTOR = ACTIVE_V1` intacto. Sin operaciones sobre Aiven, DB o migrations.

**R5-G parcial: reducción de exposición completada. Retiro funcional y de rutas Manning pendiente de autorización posterior**.

Se detiene el trabajo para la auditoría de Lucho, sin iniciar R5-H1/H2.
