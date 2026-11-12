# RiegAR

Aplicación web para organizar fincas y consultar escenarios de riego por surcos. El historial conserva resultados V1 y V2. La calculadora histórica de Manning sigue disponible en **Herramientas anteriores**.

## Desarrollo

Con Node.js y npm, ejecutá `npm ci`, `npm test` y `npm run dev`. El cliente usa `VITE_API_URL` y en desarrollo puede apuntar a `http://localhost:4000`. La [guía académica](docs/MVP-ACADEMICO-GUIA.md) incluye instalación del backend y uso de la aplicación.

| Función | Disponibilidad |
|---|---|
| Registro, sesión, fincas e historial | Conectan a la API configurada |
| Creación V2 | Demostración con API simulada en desarrollo |
| Manning | Cálculo local y guardado histórico mediante la API |

- [Guía académica y guion de demostración](docs/MVP-ACADEMICO-GUIA.md)
- [Preparación de staging y despliegue](docs/MVP-ACADEMICO-STAGING.md)
- [Checkpoint MVP Académico 01](docs/MVP-ACADEMICO-01-CHECKPOINT.md)
