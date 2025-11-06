import React from "react";
import s from "./Guide.module.scss";
// 1. Importa los nuevos componentes de diagrama
import TrapezoidalDiagram from "../Diagrams/TrapezoidalDiagram.jsx";
import RectangularDiagram from "../Diagrams/RectangularDiagram.jsx";
import TriangularDiagram from "../Diagrams/TriangularDiagram.jsx";

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
        abiertos.
      </p>
      <div className={s.formula}>Q = (1/n) × A × R^(2/3) × S^(1/2)</div>

      <h2>2. Parámetros Geométricos</h2>
      <p>
        Es crucial entender qué significa cada parámetro geométrico según el
        tipo de canal que estés midiendo.
      </p>

      <div className={s.card}>
        <h3>Canal Trapezoidal</h3>
        <p>
          Este es el tipo de canal más común en agricultura. Necesitas medir el
          ancho de fondo (b), la profundidad del agua (h) y la pendiente lateral
          (z).
        </p>
        <TrapezoidalDiagram /> {/* <-- 2. Reemplaza el placeholder */}
      </div>

      <div className={s.card}>
        <h3>Canal Rectangular</h3>
        <p>
          Común en estructuras de hormigón. Solo necesitas medir el ancho del
          canal (b) y la profundidad del agua (h).
        </p>
        <RectangularDiagram /> {/* <-- 2. Reemplaza el placeholder */}
      </div>

      <div className={s.card}>
        <h3>Canal Triangular</h3>
        <p>
          Usado a menudo para cunetas o canales pequeños. Necesitas medir la
          profundidad del agua (h) y la pendiente de los bordes (z).
        </p>
        <TriangularDiagram /> {/* <-- 2. Reemplaza el placeholder */}
      </div>
    </div>
  );
}
