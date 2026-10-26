# R5-A1 — Checkpoint

Fecha: 26/10/2026. Estado: **PASS técnico local, con API simulada**. Pendiente de auditoría y aprobación de Lucho. No habilita R5-B ni acredita integración contra Aiven o un despliegue.

## Git inicial y fuentes

- Frontend original: `C:\Riegar\RiegAR-Calculadora-de-riego`.
- Rama: `feature/riego-surcos-v1`.
- HEAD: `6fd8638c689b4d51b71d7aa3d3b913b9684141bb`.
- `git status --short`: vacío; sin cambios tracked/untracked preexistentes.
- Backend de referencia, solo lectura: `C:\Riegar\riegar-backend`, misma rama, HEAD `9a38be5eb71ff5dc42525fcd254f8bd4efcbf0c3`, limpio.
- Se utilizaron el superprompt original, el prompt actualizado de transferencia y las instrucciones/autorización de esta conversación. El documento maestro separado no fue aportado; no se atribuye su revisión.
- En el preflight, los 55 archivos comparados del ZIP local coincidieron con el checkout. El ZIP omite los tres assets señalados; los originales existen y están versionados. No se acredita que sea el último ZIP transferido ni la actualidad del remoto: no hubo fetch.

## A1-01 a A1-07

| Correctivo | Hallazgo y resolución | Archivos |
| --- | --- | --- |
| A1-01 Assets | No faltaban en el original. Navbar, Hero y fondo agrícola cargan en la build. Sin cambios ni reemplazos gráficos. | `src/assets/images/riegar-logo.png`, `src/assets/images/agricultural-field-pattern.jpg`, `public/riegar-logo.png` (preservados) |
| A1-02 Dependencias | Vite 6.4.3 → 6.4.5 exacto; source-map-js 1.2.1 → 1.2.2 transitivo dentro de rangos existentes. Sin majors, overrides ni dependencia directa nueva. React, Router, Sass y plugin React conservan sus versiones instaladas. | `package.json`, `package-lock.json` |
| A1-03 HTTP | Una sola función de petición sobre fetch; ApiError conserva status/error/code/field/errors públicos y Error.message histórico. Maneja JSON, vacío, no JSON, lectura interrumpida y red. No copia cuerpos completos/SQL/stack; mensajes 5xx desconocidos se sustituyen. Sin retry ni servicios V2. URLs, métodos y payloads históricos conservados. | `src/services/apiService.js` |
| A1-04 Auth | Descarta tokens malformados/sin exp/vencidos, programa expiración y sincroniza storage/foco/visibilidad. 401 protegido y 403 contractual de token inválido invalidan solo el token de esa petición. Otro 403 y el 401 público de login no borran la sesión. Una respuesta vieja no cierra un login posterior. Logout y navegación coordinados en la misma transición. | `src/context/AuthContext.jsx`, `src/context/session.js`, `src/components/Navbar/Navbar.jsx` |
| A1-05 Fincas | Enlace y acciones hermanos; sin botones anidados en enlaces. Nombres accesibles, etiquetas de edición asociadas, distribución adaptable. | `src/components/Dashboard/Dashboard.jsx`, `src/components/Dashboard/Dashboard.module.scss` |
| A1-06 Contacto | Carga/éxito/error visibles y accesibles. Bloqueo inmediato por ref y botón deshabilitado mientras está pendiente. Conserva datos ante error; sin reenvío automático. | `src/components/Contact/Contact.jsx` |
| A1-07 Accesibilidad | Menú con aria-expanded/controls y Escape; menú móvil cerrado fuera de foco/árbol accesible. Modal mediante portal: foco inicial, ciclo Tab, Escape, fondo inert, scroll bloqueado y retorno de foco. Feedback accesible en login/registro, autocomplete de nueva contraseña corregido. | `src/components/Navbar/Navbar.jsx`, `src/components/Navbar/Navbar.module.scss`, `src/components/Modal/Modal.jsx`, `src/components/Modal/Modal.module.scss`, `src/components/LoginForm/LoginForm.jsx`, `src/components/RegisterForm/RegisterForm.jsx` |

El parche de Vite fue verificado contra registro npm y advisories vigentes, incluyendo [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm). La corrección transitiva está documentada en [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). El diff del lockfile solo cambia los registros raíz/Vite/source-map-js.

## Validaciones ejecutadas

Entorno: Windows, Node 24.16.0, npm 11.13.0. No se atribuye paridad con un entorno CI diferente.

| Verificación | Resultado y evidencia |
| --- | --- |
| `npm ci` | PASS: 82 paquetes instalados; instalación desde lockfile sin errores. |
| `npm audit` | PASS: 0 vulnerabilidades, después de ambos parches. Inicialmente había 2 dependencias con severidad alta, ambas de desarrollo. |
| `npm audit --omit=dev` | PASS: 0 vulnerabilidades. |
| `npm ls --depth=0`, `npm ls source-map-js` | PASS: dependencias coherentes; Vite 6.4.5 y source-map-js 1.2.2 deduplicado entre Sass/PostCSS. |
| `npm run build` | PASS final: 92 módulos; assets resueltos; 6.09 segundos en la última ejecución. Persisten 4 avisos Sass de deprecación por dos usos preexistentes de darken(). |
| `npm test` | PASS: 46/46, 0 fallos/skipped/cancelled. Usa node:test sin nuevas dependencias. HTTP, 11 servicios históricos, auth, respuesta atrasada, no retry y 3 casos numéricos Manning. |
| Navegador sobre build | PASS final: 18/18 escenarios en Edge headless con Playwright 1.64.1 externo al repo y API completamente interceptada. |
| Imports y rutas | PASS dentro de build y navegador: 7 rutas públicas, 3 protegidas, redirecciones, navegación directa e historial. |
| Visual/responsive | PASS acotado: Dashboard desktop 1280px y modal móvil 375px inspeccionados visualmente; sin desborde horizontal en tarjetas, modal, login, registro y contacto a 375px. |
| `git diff --check` | PASS. |
| Backend y Manning | PASS estático de preservación: sin diff en backend, utils/manning, Calculator, NuevoCalculo, FincaDetail, Guide, diagramas ni rutas. ACTIVE_DESCRIPTOR sigue ACTIVE_V1; los tres SHA256 V1 coinciden con el freeze inspeccionado en el preflight. |
| API/DB/correo reales | NOT RUN deliberadamente: ninguna escritura real ni envío de correo. No se reejecutó la certificación histórica del backend. |
| Lint / lector de pantalla / otros navegadores | NOT RUN: no existe script lint; no hubo certificación con tecnología asistiva ni matriz multinavegador. |

La primera tanda de navegador detectó una carrera logout→inicio→login (17 PASS/1 FAIL). Se corrigió la coordinación con Router, se verificó el caso focal y luego la tanda completa pasó 18/18. Tras estabilizar las capturas al final de las animaciones, la comprobación móvil focal volvió a pasar 1/1. No se cuentan repeticiones como casos adicionales.

### Reproducción del navegador

La suite está en `scripts/verify-r5-a1-browser.mjs`. Playwright no se agregó al manifiesto: se instaló en `%TEMP%\riegar-r5a1-tools`. Para repetir con la misma versión:

```powershell
$testTools = Join-Path $env:TEMP 'riegar-r5a1-tools'
npm install --prefix $testTools --no-package-lock --no-audit --no-fund playwright@1.64.1
npm run build
# Mantener preview en otra terminal:
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
# En la terminal de pruebas:
node scripts/verify-r5-a1-browser.mjs "$testTools\node_modules\playwright\index.mjs"
```

Requiere Edge en la ruta estándar de Windows, o `R5A1_BROWSER` con la ruta de otro Chromium compatible. El script solo deja pasar solicitudes al preview; intercepta localhost:4000 y bloquea los demás orígenes. Las credenciales/tokens son sintéticos. Capturas opcionales fuera del repositorio mediante `R5A1_SCREENSHOTS`.

## Impacto transversal

- Auth/routing: login, registro, logout, atrás, expiración activa, sincronización entre pestañas, 401/403 y acceso directo verificados con API simulada.
- Fincas: crear/editar/borrar, respuesta 204 y rechazo 409 con conservación de finca verificados. Las acciones no abren accidentalmente el detalle.
- Manning: fuentes preservadas; tres resultados numéricos, payload del guardado, modal reutilizado y lectura del historial verificados. Sin cambios de fórmulas, guardado, rutas ni eliminación del flujo.
- HTTP/contacto: consumidores históricos mantienen contratos; fallos no generan retry. Contacto conserva texto tras error e impide duplicados pendientes.
- Accesibilidad/responsive: teclado/foco/semántica y viewport puntual verificados. No equivale a una auditoría WCAG completa.
- Seguridad: dependencias auditadas, no se exponen cuerpos de error internos; JWT continúa en localStorage conforme al protocolo aprobado. Verificar exp en cliente no verifica firma ni reemplaza la autorización del servidor.

## Riesgos y pendientes

- No se certifica integración real de auth, CRUD, correo, disponibilidad, CORS o datos históricos del ambiente conectado. La API simulada valida comportamiento frontend, no reemplaza esa integración.
- Se conservan los avisos Sass preexistentes; no bloquean el build actual.
- El modal usa inert y unidades dvh; se probó en Edge actual. Compatibilidad con navegadores antiguos no certificada.
- La sanitización HTTP conserva campos públicos conocidos y oculta mensajes internos; el backend sigue siendo responsable de no enviar secretos. No se añade contenido HTML remoto a la UI.
- La etiqueta sin asociación del editor histórico de nombre en FincaDetail queda preservada por la prohibición expresa de modificar Manning. Su corrección requiere autorización de ese alcance; no impidió probar el modal compartido ni se atribuye accesibilidad global completa.
- Documento maestro separado pendiente de aportar/contrastar si agrega requisitos no presentes en los prompts recibidos.
- Para R5-B: revisar este checkpoint y aprobarlo expresamente antes de iniciar diseño. No se habilita funcionalidad V2.

## Estado final y Git

13 archivos modificados (los listados en A1-02…A1-07), 4 agregados:

- `src/context/session.js`
- `test/r5-a1.test.js`
- `scripts/verify-r5-a1-browser.mjs`
- `docs/r5-a1-checkpoint.md`

0 eliminados. Rama y HEAD frontend sin cambios respecto del inicio. El status final contiene exclusivamente esos 13 M y 4 archivos nuevos (Git puede agrupar directorios untracked). Backend limpio y sin cambios. Sin commit, push, deploy, operaciones DB, activación V2 ni inicio de R5-B.

La ejecución termina en este checkpoint y espera la aprobación de Lucho.
