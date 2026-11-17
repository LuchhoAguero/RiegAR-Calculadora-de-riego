# RiegAR · MVP Académico

RiegAR organiza fincas y presenta escenarios versionados de riego por surcos. La calculadora histórica de Manning sigue disponible desde el pie de página.

- [Aplicación pública](https://riegar-academico.netlify.app)
- [Salud de la API](https://riegar-api-demo.onrender.com/api/health)
- [Conexión segura a MySQL](https://riegar-api-demo.onrender.com/api/ready)

La rama publicada de ambos repositorios es demo-academica. El frontend usa Netlify y la API Render Free, conectada por TLS a riegar_academic_staging en Aiven.

| Función | Estado de la presentación |
|---|---|
| Inicio, registro/login, guía y contacto | Pantallas verificadas contra la publicación real. El correo de contacto está deshabilitado. |
| Registro, login y fincas mediante API | Ensayo sintético pendiente de autorización. |
| Historial y resultados V1/V2 | Lectores implementados; consulta pública autenticada pendiente. |
| Creación V2 | Deshabilitada en producción. El asistente completo se demuestra solo en desarrollo con API simulada. |
| Manning | Cálculo y validación locales verificados en la publicación. Guardado real fuera del ensayo mínimo. |

## Instalación y presentación

Con Node 24, ejecutar npm ci y npm test. Para compilar como Netlify, definir VITE_API_URL=https://riegar-api-demo.onrender.com y ejecutar npm run build -- --mode staging.

La [guía académica](docs/MVP-ACADEMICO-GUIA.md) contiene configuración, arquitectura, modelo de datos, manual, guion de ocho minutos y contingencia por arranque lento de Render.

Los correctivos DEMO-02 permanecen locales hasta su aprobación. El registro y las fincas del ensayo se crearán después de autorizar su presupuesto. [Publicación y migración de base](docs/PUBLICACION-ACADEMICA.md)
