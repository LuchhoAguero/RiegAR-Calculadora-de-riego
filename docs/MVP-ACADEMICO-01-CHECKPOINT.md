# RiegAR · MVP Académico 01

**11 de noviembre de 2026 · consolidación completada y verificada localmente.** La experiencia académica incluye gestión de fincas, historial versionado, la calculadora Manning y una demostración V2 identificada como simulada. La integración de escritura V2 con staging real queda pendiente.

## Estado Git

| Repositorio | Rama | HEAD inicial y final | Estado inicial → final |
|---|---|---|---|
| Frontend | `feature/riego-surcos-v1` | `e936993efaf30f4082297ede2e3e6e478292e7a6` | Limpio → 16 archivos modificados y 4 nuevos, sin staging |
| Backend | `feature/riego-surcos-v1` | `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3` | Limpio → limpio |

`ACTIVE_DESCRIPTOR = ACTIVE_V1`. Los HEAD se verificaron antes de tocar archivos. Se cotejaron los checkpoints R5-C a R5-G y R5-H1/H2, el cierre B/C y los artefactos D. Los ajustes UX ya confirmados en Git se conservaron. Se comprobó el SHA-256 del ZIP D y la igualdad del código de las 11 preimágenes antes de incorporar sus cambios selectivos, respetando los finales de línea de cada archivo de trabajo.

## Funciones consolidadas

- **Inicio y sesión.** Portada agronómica, registro, login, cierre, vencimiento y protección de rutas.
- **Fincas.** Listado, creación, edición, detalle, estados de carga y error, protección por sesión y respuesta ante el 409 de una finca con simulaciones.
- **Historial.** Página anterior y siguiente, cursor opaco, protección ante solicitudes duplicadas o cursores repetidos, recuperación manual de errores y estado vacío. Una recarga comienza en la primera página. Se verificaron 45 registros de prueba en páginas de 20, 20 y 5, y se comprobaron respuestas tardías al cambiar de finca o cerrar sesión.
- **V2.** El asistente de cinco pasos, revisión y guardado simulado quedan disponibles en desarrollo con las condiciones del sandbox. La página de resultados distingue V1 y V2 por contrato guardado, con 14 y 19 magnitudes respectivamente. El bloqueo de creación se verificó antes de leer la sesión o llamar a la API en un build con flags de desarrollo forzadas. La vista de preparación y el demostrador también quedaron sujetos al servidor Vite de desarrollo.
- **Manning.** Se corrigió el tooltip que producía desborde a 320 px, con acceso por teclado. Se conservaron cálculo, CSV, rutas históricas y el vínculo desde la finca. Se probó el flujo de guardado, edición y borrado con API simulada. La calculadora conserva la identidad visual agronómica existente.

## Archivos

| Área | Archivos |
|---|---|
| Historial | `src/components/SimulationHistory/SimulationHistory.jsx`, `src/components/SimulationHistory/SimulationHistory.module.scss` |
| Manning | `src/components/Calculator/Calculator.module.scss`, `src/components/Tooltip/Tooltip.jsx`, `src/components/Tooltip/Tooltip.module.scss` |
| Preparación V2 | `src/components/FarmDetail/FarmDetail.jsx`, `src/pages/NewSimulationPage.jsx`, `src/pages/SimulationDetailPage.jsx`, `src/routes/AppRoutes.jsx`, `src/utils/irrigationAvailability.js`, `vite.config.js` |
| Pruebas | `scripts/verify-r5-a1-browser.mjs`, `scripts/verify-r5-f-browser.mjs`, `test/r5-c.test.js`, `test/r5-h.test.js` |
| Documentación y publicación | `README.md`, `docs/MVP-ACADEMICO-GUIA.md`, `docs/MVP-ACADEMICO-STAGING.md`, `docs/MVP-ACADEMICO-01-CHECKPOINT.md`, `public/_redirects` |

## Pruebas del MVP

Node.js v24.16.0 y npm 11.13.0. Las pruebas de navegador usaron Edge y Playwright con destinos de API interceptados. Las pruebas backend ejercitaron persistencia en memoria, motores, contratos, middleware, SQL compilado, lectura versionada y regresiones Manning.

| Verificación | Resultado |
|---|---|
| Frontend unitario | **396 PASS / 0 FAIL** |
| Backend pertinente | **249 PASS / 0 FAIL**. 247 de regresión y 2 de esquema/UTC. La prueba genérica de arranque quedó fuera del bloque del backend original por su bind implícito. Su variante explícita de loopback ya pasó en E0. |
| Builds | **PASS** normal y adverso, 122 módulos en cada uno. La compilación con flags de desarrollo forzadas emitió aviso de tamaño de chunk. |
| R5-A1, D, E, F y H en navegador | **160 PASS / 0 FAIL**. 50, 25, 14, 36 y 35 respectivamente. Cubren formularios, teclado, foco, Escape, aislamiento y rutas. |
| Regresión D sobre los builds del MVP | **PASS**. Historial multipágina, Manning, Inicio, login y registro a 1280, 390 y 320 px, detalles V1/V2 y 36 capturas. El primer intento se detuvo en la preparación del runner externo por una ruta de dependencia incorrecta. El runner corregido pasó. |
| Bloqueo V2 adverso | **PASS** en navegador a 320 px y en una prueba del servicio compilado con flags DEV forzadas. Cero tráfico API en la comprobación adversa de navegador. |
| Fallback SPA | **PASS local**. Cinco rutas directas devolvieron `index.html` y se verificó la regla `_redirects` dentro de `dist`. |
| Staging remoto y escritura V2 real | **NOT RUN**. |

### Capturas de revisión

Todas provienen del navegador en el MVP. Las pantallas con datos usan fixtures.

- [Inicio a 1280 px](../../Labs/riegar-mvp-academico-01-20261111/capturas/regresion-d/inicio-1280.png)
- [Mis fincas a 390 px](../../Labs/riegar-mvp-academico-01-20261111/capturas/a1/mis-fincas-390.png)
- [Revisión V2 a 390 px](../../Labs/riegar-mvp-academico-01-20261111/capturas/d/paso-5-390.png)
- [Resultados V2 a 390 px](../../Labs/riegar-mvp-academico-01-20261111/capturas/f/detalle-v2-390.png)
- [Paginación a 320 px](../../Labs/riegar-mvp-academico-01-20261111/capturas/regresion-d/historial-controles-320.png)
- [Calculadora Manning a 320 px](../../Labs/riegar-mvp-academico-01-20261111/capturas/regresion-d/manning-calculadora-320.png)

## Documentación, riesgos y siguiente paso

La [guía académica](MVP-ACADEMICO-GUIA.md) contiene alcance, arquitectura, modelo de datos, seguridad, las 19 magnitudes, instalación, manual y guion. El [plan de staging](MVP-ACADEMICO-STAGING.md) fija variables, fallback, comprobaciones, orden de activación y recuperación. La publicación propuesta separa frontend estático, API Express y MySQL administrado, con HTTPS y credenciales propias.

La escritura V2 real requiere un descriptor coordinado en el backend de staging, una verificación de capacidad ligada a su origen y una prueba sintética acotada de persistencia y lectura. La demo de facultad puede usar API simulada y capturas identificadas como tales. La exactitud agronómica en campo queda fuera de las pruebas de software realizadas.

Los cuatro MySQL históricos, volúmenes y evidencias quedaron fuera de la intervención. El diagnóstico E1-TCP permanece **INCONCLUSO / STOP**, con peer SQL sin acreditar. Las operaciones de publicación, migrations remotas y cutover quedan pendientes.

[Diff completo para revisión](../../Labs/riegar-mvp-academico-01-20261111/MVP-ACADEMICO-01.diff) · [Resultados estructurados](../../Labs/riegar-mvp-academico-01-20261111/verificacion.json)
