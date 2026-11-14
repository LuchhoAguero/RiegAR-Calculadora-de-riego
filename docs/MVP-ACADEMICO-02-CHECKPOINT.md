# RiegAR · MVP Académico 02

**12 de noviembre de 2026 · cierre local PASS.** El frontend del MVP-01 quedó confirmado en Git y el candidato backend de staging quedó listo para revisión. La publicación y verificación con servicios remotos corresponden a la siguiente intervención.

## Git y diffs

| Repositorio | Rama | Estado |
|---|---|---|
| Frontend inicial | `feature/riego-surcos-v1` | HEAD `e936993efaf30f4082297ede2e3e6e478292e7a6`, 16 modificaciones y 4 archivos nuevos aprobados. |
| Frontend al cierre de MVP-01 | `feature/riego-surcos-v1` | Commit local `90a4b7c2a5afe8b8416ae0f7d3b014351964e1ae`, `feat(mvp): consolidate academic irrigation frontend`. 20 archivos. Árbol limpio al confirmar. |
| Frontend al cierre de MVP-02 | `feature/riego-surcos-v1` | HEAD `90a4b7c2a5afe8b8416ae0f7d3b014351964e1ae`. 9 modificaciones y 3 archivos nuevos de staging, demo y documentación, sin staging. |
| Backend original | `feature/riego-surcos-v1` | HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`, limpio. `ACTIVE_DESCRIPTOR = ACTIVE_V1`. |

La fase A cotejó el diff completo con MVP-01 byte a byte. SHA-256 `32914db4100ac4ba901dbd553cbc7fac953af90ab4e80e3b63bbdcd2d7fb6ea4`. Se revisó el índice y pasó `git diff --cached --check` antes del único commit autorizado.

- [Diff frontend MVP-02](../../Labs/riegar-mvp-academico-02-20261112/MVP-ACADEMICO-02-FRONTEND.diff) sobre el commit local.
- [Diff candidato backend staging](../../Labs/riegar-mvp-academico-02-20261112/MVP-ACADEMICO-02-BACKEND-STAGING.diff) sobre el HEAD original, verificado en copia independiente con 7/7 archivos byte a byte. SHA-256 `ed1307d1123c224c56975a5a01ebd22fe044be9ab1bd8f5102d017eefbdc9f0e`.

## Cambios preparados

- **Frontend.** `netlify.toml` define el build de staging, Node 24, directorio `dist` y encabezados. `vite.config.js` exige el origen HTTPS explícito y rechaza la configuración simulada en staging. El fallback existente entra en el build. `ContactPage.jsx` comunica la política de correo en staging. `App.jsx`, `main.jsx` y estilos identifican el sandbox académico y reservan el borrador para el servidor de desarrollo. La suite H incluye el recorrido completo en tres anchos.
- **Backend candidato.** Un entrypoint específico escucha el `PORT` de Railway en `0.0.0.0`, valida identidad de entorno y TLS, y usa el mismo pool Knex que las rutas existentes. `/api/ready` comprueba base, cuenta efectiva y cipher TLS. El perfil restringe CORS, deshabilita correo, envía respuestas sin cache, reduce logs a datos operativos y gestiona cierre por señal. Las pruebas ejercitan el candidato en copia externa y sin un MySQL real.
- **Integración V2.** El candidato monta el descriptor por defecto V1. La capacidad autenticada anuncia `creationEnabled: false` y el POST de simulaciones devuelve 403 para una sesión válida. Los lectores V1/V2 conservan el contrato persistido. El plan documenta composición V2 posterior, capacidad verificada, envío único, 201, HISTORY/DETAIL y conciliación de incertidumbre.
- **Entrega académica.** README, arquitectura y modelo entidad-relación, explicación y 19 magnitudes V2, manual de usuario, guía de despliegue y guion de ocho minutos. El recorrido muestra el aviso de datos de prueba desde Inicio. [Guía académica](MVP-ACADEMICO-GUIA.md) · [Guía de staging y pasos de publicación](MVP-ACADEMICO-STAGING.md) · [Plantilla backend](staging/backend.env.example)

## Pruebas

| Grupo | Resultado |
|---|---|
| A · MVP-01 antes de confirmar | 396 frontend, 249 backend pertinentes y 160 escenarios de navegador PASS. Builds normal y adverso, fallback local y bloqueo V2 antes de leer sesión o llamar a fetch PASS. |
| E · Frontend final | 396 unitarias y **163 escenarios** en cinco suites PASS. Incluye tres recorridos completos de demostración, uno por ancho. Los datos de registro, login, finca y simulación se resolvieron en memoria. |
| E · Builds y modo de staging | Normal, adverso y staging PASS. Siete configuraciones de staging inválidas rechazadas. La vista de contacto y el acceso directo protegido pasaron a 320, 390 y 1280 px. El bloqueo de V2 con flags forzadas pasó en navegador y servicio compilado. |
| E · Backend original y candidato | 249 pruebas pertinentes en el original. **253 PASS** en el candidato, incluidas 4 nuevas de configuración, TLS/CA, readiness, HTTP y cierre. Un primer intento del test TLS referenció una función interna. Se corrigió el test para usar `createKnexConfig()`. La prueba genérica de arranque de la app anterior quedó fuera de ambos bloques por su bind implícito. |
| Real remoto | **NOT RUN.** Configuración del proveedor, handshake con CA y hostname del servicio administrado, migrations, restauración y persistencia V2 real. |

Se observaron 18 capturas nuevas del recorrido académico, seis por ancho. [Inicio a 1280 px](../../Labs/riegar-mvp-academico-02-20261112/final/capturas/h/mvp02-inicio-1280.png) · [Revisión a 390 px](../../Labs/riegar-mvp-academico-02-20261112/final/capturas/h/mvp02-revision-390.png) · [Resultado a 320 px](../../Labs/riegar-mvp-academico-02-20261112/final/capturas/h/mvp02-resultados-320.png) · [Historial a 320 px](../../Labs/riegar-mvp-academico-02-20261112/final/capturas/h/mvp02-historial-320.png) · [Resultados de verificación](../../Labs/riegar-mvp-academico-02-20261112/final/verificacion.json)

## Próxima publicación

Revisar los dos diffs, fijar los artefactos, autorizar la fase remota, preparar MySQL aislado con las cuentas separadas, publicar primero la API Railway, validar TLS/readiness y publicar el sitio Netlify con su origen CORS exacto. Ejecutar luego el recorrido de staging con cuentas sintéticas y lectura V1/V2. La demostración académica de creación V2 sigue disponible en el sandbox. La aprobación de escritura V2 y su prueba sintética son decisiones posteriores.

COMPAT-RESTORE4 y E1-TCP quedan con sus evidencias históricas. El peer SQL pendiente de E1-TCP se mantiene como deuda de laboratorio.
