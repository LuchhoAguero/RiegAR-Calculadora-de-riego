import React from "react";
import s from "./Guide.module.scss"; // Usará su propio archivo de estilos

export default function Guide() {
  return (
    <div className={s.guideContainer + " container"}>
      <h1>Guía de Uso de RiegAR</h1>
      <p className={s.lead}>
        Aprende a utilizar la calculadora de caudal para obtener mediciones
        precisas en tus sistemas de riego.
      </p>

      <h2>1. Entendiendo la Fórmula de Manning</h2>
      <p>
        La calculadora se basa en la fórmula de Manning, un estándar en
        ingeniería hidráulica para calcular el flujo de agua en canales
        abiertos. La fórmula es:
      </p>
      <div className={s.formula}>Q = (1/n) × A × R^(2/3) × S^(1/2)</div>
      <p>
        Donde 'Q' es el caudal, 'n' es el coeficiente de rugosidad, 'A' es el
        área, 'R' es el radio hidráulico y 'S' es la pendiente del canal.
      </p>

      <h2>2. Parámetros Geométricos</h2>
      <p>
        Es crucial entender qué significa cada parámetro geométrico según el
        tipo de canal:
      </p>

      <h3>Canal Trapezoidal</h3>
      <p>Este es el tipo de canal más común en agricultura. Necesitas medir:</p>
      <ul>
        <li>
          <b>Ancho de fondo (b):</b> El ancho en la base del canal.
        </li>
        <li>
          <b>Profundidad (h):</b> La altura vertical del agua.
        </li>
        <li>
          <b>Pendiente lateral (z):</b> La inclinación de los lados (relación
          horizontal:vertical).
        </li>
      </ul>
      <div className={s.placeholder}>
        [Aquí iría una ilustración de un canal trapezoidal con sus variables]
      </div>

      <h2>3. Exportar Resultados</h2>
      <p>
        Una vez que ingresas todos los datos, los resultados se calculan
        automáticamente. Puedes usar el botón "Exportar Resultados CSV" para
        descargar un archivo compatible con Excel y otras hojas de cálculo para
        tus registros.
      </p>
      <div className={s.placeholder}>
        [Aquí podría ir un GIF mostrando cómo se exporta el CSV]
      </div>
    </div>
  );
}
