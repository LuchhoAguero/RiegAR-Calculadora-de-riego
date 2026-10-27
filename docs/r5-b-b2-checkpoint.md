# R5-B / B-2 - Base visual R3 AgroTech

Fecha: 26/10/2026. **Cierre técnico local de B-2 aprobado por Lucho**, después de su revisión independiente de capturas, diff y pruebas. Se mantienen las limitaciones indicadas: no constituye aprobación de accesibilidad global, integración real ni despliegue. Los bloques posteriores requieren su autorización específica.

## Autorización, fuentes y Git inicial

- Autorización expresa de Lucho para B-2 en esta conversación; dirección R3 de B-1 aprobada.
- Repositorio original: `C:\Riegar\RiegAR-Calculadora-de-riego`.
- Rama inicial y final: `feature/riego-surcos-v1`.
- HEAD inicial y final: `607e2d6c7b45bed6e128fafd36be6c1b7a117ce6`.
- Estado inicial: limpio, sin cambios tracked ni untracked preexistentes.
- Referencias: `C:\Riegar\Plan\nuevoPlan.txt`, checkpoint A1 y propuesta R3 existente fuera del repositorio. Las autorizaciones y verificaciones posteriores sustituyen los estados históricos pendientes del maestro.
- Backend, solo comprobación de preservación: HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`, limpio antes y al cierre. Sin operaciones API reales ni DB.

## Dirección del producto confirmada por Lucho

Aclaración posterior al checkpoint B-2, registrada el 26/10/2026:

- El nuevo RiegAR se centra en las simulaciones de riego por surcos derivadas del modelo del Excel e implementadas en el backend V1/V2. La identidad y los recorridos futuros deben representar ese producto.
- Recorrido principal futuro: **Iniciar sesión → Mis fincas → Seleccionar finca → Nueva simulación → Cultivo → Suelo → Surcos → Riego → Revisión → Calcular y guardar → Resultados e historial**.
- Manning es la herramienta histórica. Se preservan sus módulos, cálculos, rutas y compatibilidad. Su acceso se trasladará progresivamente a la sección secundaria «Herramientas anteriores», nombre confirmado por Lucho al autorizar B-3.
- En el diseño futuro, Manning deja de protagonizar portada, navegación principal e identidad visual. La presencia actual conservada en B-2 corresponde al estado de transición; no define la dirección final del producto.
- **Antes de B-3 debe revisarse la propuesta de portada y navegación:** jerarquía de Mis fincas, acceso secundario a Manning, nombre de esa sección y transición de enlaces. La reorganización requiere revisión y autorización antes de implementarse; no implica ocultar prematuramente funcionalidades actuales ni eliminar cálculos históricos.
- B-2 conserva su alcance de base visual: esta aclaración solo actualiza la documentación. No cambia contenido de portada, navegación, rutas funcionales ni módulos Manning, y no implementa simulaciones, formulario, resultados o historial V2.
- Se conserva `ACTIVE_DESCRIPTOR = ACTIVE_V1` hasta la activación expresamente autorizada. El descriptor activo no sustituye la versión contractual almacenada de los snapshots históricos.

La incorporación técnica de simulaciones continúa en las fases correspondientes del maestro y el retiro controlado del flujo Manning permanece sujeto a R5-G y a sus aprobaciones.

## Cambios y archivos

| Área | Archivos | Resultado |
| --- | --- | --- |
| Tokens y patrones optativos | `src/styles/_variables.scss`, `_mixins.scss` | Paleta R3 completa, fondo cálido, texto secundario más legible, colores de feedback y patrones compartidos para campos, botones, tarjetas y foco. Se conservan los mixins históricos `card`, `grid`, `container` y `heading-lg`. |
| Base común | `src/styles/_globals.scss` | Fondo general R3 y foco visible. El selector del header se acota al hijo directo del shell. No se añade un reset global de botones, campos, grillas o diagramas. |
| Navegación | `src/components/Navbar/Navbar.jsx`, `Navbar.module.scss` | Solo clases de presentación; cabecera cálida con banda verde, texto con contraste y controles de 44 px. Menú móvil mantiene cierre, Escape, estado accesible y foco. Panel móvil limitado al alto disponible y animación reducida cuando se solicita. Mismos enlaces, orden y destinos. |
| Inicio | `src/components/Hero/Hero.module.scss` | Navy sobre fondo cálido, patrón original más visible en el panel gráfico, acciones legibles, banda suave de cultivo y reflujo móvil. Contenido, fórmula ilustrada y enlaces Manning sin cambios. |
| Pie | `src/components/Footer/Footer.module.scss` | Texto, espaciado, reflujo y áreas de interacción de 44 px; mismos contenidos y destinos. |
| Login y registro | Los dos componentes JSX y SCSS Modules; `src/pages/LoginPage.jsx`, `RegisterPage.jsx` | Clases de presentación para tarjeta de acceso, campos de 48 px, botones navy sobre verde y mensajes accesibles. Se conserva toda la lógica, roles, nombres y navegación. Se reutiliza el módulo existente de contenedor, sin nueva estructura de carpetas. |
| Contacto | `src/components/Contact/Contact.module.scss` | Paneles suaves, borde agua en formulario, campos y feedback compartidos. Su JSX, protección contra doble envío y conservación ante error permanecen intactos. |
| Fincas | `src/components/Dashboard/Dashboard.jsx`, `Dashboard.module.scss` | Solo clase del contenedor y estilos. Se recupera el padding lateral a 320 px, tarjetas y acciones legibles, edición/borrado con contraste y reflujo. Mismo formulario y CRUD existentes; no se implementa el nuevo dashboard de B-1. |
| Modal compartido | `src/components/Modal/Modal.module.scss` | Tamaño adaptable, acciones que envuelven, cierre de 44 px y estados con contraste; sin cambiar portal, inert, bloqueo de scroll, ciclo Tab, Escape ni retorno de foco. Se comprueba también su uso por Manning. |

**17 archivos de producto modificados: 11 SCSS y 6 JSX.** Los 6 JSX tienen cambios exclusivamente en atributos `className`/`style`, verificado mediante comparación de AST después de excluir esos atributos. No se modifican handlers, estados, validaciones, texto, fórmulas, rutas ni llamadas HTTP.

Los patrones de formulario repetidos se concentran en mixins para aplicar R3 de manera coherente a los flujos autorizados. No hay nuevo framework, dependencia, cliente HTTP ni estructura por dominios. El SCSS compilado crece de 21,07 a 32,62 kB (gzip 4,68 a 5,77 kB), por la aplicación optativa de patrones compartidos.

## Preservación e impacto transversal

- 22 archivos verificados contra sus blobs de HEAD: Calculator, NuevoCalculo, FincaDetail, Guide, diagramas, rutas, auth, servicios, utilidades, assets originales, public y manifiestos. Sin cambios de contenido en ninguno.
- Manning comparte cabecera, pie, fondo, texto secundario y modal: su presentación común recibe esos ajustes. Sus módulos propios y los mixins históricos mantienen sus reglas. No se afirma identidad de píxeles de la página completa.
- Logo y patrón agrícola originales conservan contenido y nombres; los hashes de los assets emitidos por Vite no cambiaron.
- Rutas conservadas: `/dashboard`, `/finca/:id`, `/finca/:id/nuevo-calculo` y todas las públicas. No se introducen `/fincas` ni rutas de simulaciones en B-2.
- La implementación adapta la identidad R3 al producto actual. La arquitectura visual futura, asistente, resultados e historial V1/V2 de las referencias siguen siendo propuestas; no se renderizan ni se integran al producto.
- No hay modificaciones de backend, DB, migrations, contratos, cálculo ni activación V2. No se agregan defaults, diagnósticos, borradores ni política decimal al formulario Manning.

## Verificación ejecutada

Entorno: Windows, Node 24.16.0, npm 11.13.0, Vite 6.4.5, Sass 1.93.2; Edge headless mediante Playwright 1.64.1 externo al repositorio.

| Verificación | Resultado real |
| --- | --- |
| Instalación desde lockfile | `npm ci`: 82 paquetes, sin cambios de manifiestos ni lockfile. Primer intento bloqueado por un esbuild de un servidor Vite de este mismo frontend; se identificaron y detuvieron solo esos procesos y el segundo intento terminó correctamente. |
| Auditorías | `npm audit` y `npm audit --omit=dev`: 0 vulnerabilidades en ambas. `npm ls --depth=0` coherente. |
| Build final | 92 módulos, 6,15 s; sin errores ni avisos Sass. Los usos anteriores de `darken()` desaparecen al sustituir los estilos locales de botones Dashboard dentro del alcance. |
| Pruebas disponibles | `npm test`: 46/46, sin fallos ni omitidos; HTTP, servicios, auth y tres regresiones numéricas Manning. |
| Navegador funcional | Suite existente `scripts/verify-r5-a1-browser.mjs`: 18/18, 0 fallos, sobre build y API totalmente interceptada. Incluye login/logout/atrás, registro, guards, expiración, otra pestaña, fincas CRUD/409, modal por teclado, contacto con carga/error/sin retry y guardado Manning. |
| Responsive diferencial | 10 vistas por 3 anchos (1280, 390, 320): 30 comprobaciones antes y después. Inicio, login, registro, contacto, fincas, detalle Manning, calculadora pública, nuevo cálculo, guía y configuración. Sin desbordes nuevos. |
| Estados | 6 estados por 2 anchos (1280 y 320): 12 verificaciones y capturas de error de login, registro exitoso, contacto incierto, contacto pendiente, fincas vacías y fincas cargando. Sin desborde horizontal. |
| Teclado y foco | Tab entre campos, foco de 3 px visible en login; menú cerrado fuera del árbol accesible, Escape y devolución de foco; modal con ciclo Tab, fondo inert y retorno. La suite existente cubre 375 px y la verificación adicional cubre modal y menú a 320 px. |
| Contrastes computados | Navy/verde 5,16:1; agua/fondo 6,58:1; cultivo/fondo 5,60:1; mensajes de error 6,67:1; borde de campos nuevos 3,35:1. El borde R3 inicial #889CAF daba 2,83:1; se ajustó a #7C8F9D antes del cierre. |
| Contenido histórico | Texto principal de Inicio, Manning, nuevo cálculo, detalle histórico, guía y configuración idéntico al baseline para cada ancho. No se alteran valores ni fórmulas. |
| Alcance | Comparación de AST de 6 JSX, hashes de 22 archivos preservados y lista cerrada del diff. `git diff --check` sin errores. |
| Capturas reales | 44 PNG: 30 vistas, 12 estados, foco y modal a 320 px. Capturas de la build real; API simulada y datos sintéticos. Comparaciones antes/después y referencia R3/implementación B-2 en el paquete externo. |

No se realizaron pruebas contra auth, fincas, DB o correo reales. La interceptación impide peticiones al backend y a orígenes externos; el resultado no certifica integración remota ni deploy. No existe script lint. Sin certificación con lector de pantalla ni matriz de otros navegadores.

## Limitaciones y pendientes

1. **Reflujo Manning a 320 px: pendiente preexistente.** Antes de editar, `/calculadora` y `/finca/7/nuevo-calculo` medían 350 px de contenido para un viewport de 320 px. Al cierre siguen midiendo 350 px; a 390 y 1280 no se detectó desborde. No se corrige por la restricción expresa de no intervenir módulos/layout Manning. Por ello no se declara conformidad global de reflujo a 320 px.
2. El editor histórico de nombre en FincaDetail conserva su etiqueta sin asociación, ya documentada en A1. El alcance no corrige toda la accesibilidad de Manning, ni contrasta todos sus estilos históricos (por ejemplo, sus propios botones con texto blanco sobre verde).
3. Las capturas verifican layout y estilos en Edge, con datos sintéticos. No prueban todos los nombres largos, zoom, tecnologías asistivas o equipos móviles reales.
4. Esta es la base visual. La reorganización de navegación/pantallas y cualquier B-3 requieren su autorización específica. No se confunde aprobación de R3 con permiso de implementar simulaciones o R5-C.

## Evidencia y reproducción

Directorio externo al repositorio:

`C:\Users\aguer\.codex\visualizations\2026\10\26\01a17926-abf5-7540-9d15-7decec9a1cab\b2-implementacion`

- `baseline/qa.json`: mediciones y contenido anteriores a B-2.
- `final/qa.json`: mediciones finales, estados, contrastes y errores de ejecución (0).
- `verificacion-alcance.json`: fuentes preservadas y AST.
- `RiegAR_B2_Capturas_reales_y_comparaciones.zip`: capturas y referencias para revisión.

Verificación visual diferencial: script externo `verify-b2.mjs` en el directorio padre. Se invoca con `final` sobre preview local 4173. Su opción `baseline` corresponde a la build inicial y **no debe repetirse después de aplicar B-2**, porque sobrescribiría la referencia. `verify-b2-scope.mjs` verifica el alcance contra el HEAD inicial.

Las pruebas funcionales versionadas se repiten con el procedimiento de `docs/r5-a1-checkpoint.md`. No requieren agregar Playwright al manifiesto.

## Git final y cierre

- 17 archivos de producto modificados, 1 documentación nueva (`docs/r5-b-b2-checkpoint.md`), 0 eliminados, 0 staged.
- Rama y HEAD sin cambios. Backend limpio y HEAD sin cambios.
- Preview de pruebas en 4173 detenido. Servidor de desarrollo del frontend restablecido en `http://localhost:5173/` después de liberar el bloqueo de instalación.
- Sin commit, push, fetch, deploy, operaciones DB ni activación V2.
- B-2 termina en este checkpoint con cierre técnico local aprobado. La ejecución B-3 fue autorizada por separado y se registra en `docs/r5-b-b3-checkpoint.md`. **R5-C no iniciada.**
