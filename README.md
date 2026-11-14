# RiegAR · MVP Académico

Aplicación web para organizar fincas y consultar escenarios de riego por surcos. El historial conserva resultados V1 y V2. La calculadora histórica de Manning sigue disponible en **Herramientas anteriores**.

## Desarrollo

Con Node.js y npm, ejecutá `npm ci`, `npm test` y `npm run dev`. El cliente usa `VITE_API_URL` y en desarrollo puede apuntar a `http://localhost:4000`. La [guía académica](docs/MVP-ACADEMICO-GUIA.md) incluye instalación del backend y uso de la aplicación.

| Función | Disponibilidad |
|---|---|
| Registro, sesión, fincas e historial | Conectan a la API configurada |
| Creación V2 | Demostración con API simulada en desarrollo. El build de staging conserva el bloqueo. |
| Manning | Cálculo local y guardado histórico mediante la API |

## Demostración y publicación

El guion de ocho minutos y el recorrido reproducible incluyen alta, sesión, finca, asistente, resultado e historial. Usan datos de prueba cuando se ejecutan con el servidor Vite del sandbox. El perfil de staging propuesto conecta a su propia API y a su propia base. El correo y la creación de simulaciones quedan cerrados en ese perfil.

- [Guía académica y guion de demostración](docs/MVP-ACADEMICO-GUIA.md)
- [Publicación en Netlify y Render, y migración a TiDB](docs/PUBLICACION-ACADEMICA.md)
- [Checkpoint MVP Académico 02](docs/MVP-ACADEMICO-02-CHECKPOINT.md)
- [Checkpoint MVP Académico 01](docs/MVP-ACADEMICO-01-CHECKPOINT.md)
