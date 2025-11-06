import React from "react";

export default function RectangularDiagram() {
  return (
    <svg
      viewBox="0 0 200 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "100%",
        maxWidth: "300px",
        margin: "1rem auto",
        display: "block",
      }}
    >
      {/* Canal y Agua */}
      <rect
        x="50"
        y="20"
        width="100"
        height="80"
        fill="#69b3e7"
        stroke="#0b2e4e"
        strokeWidth="2"
      />

      {/* Cota de Profundidad 'h' */}
      <line x1="40" y1="20" x2="40" y2="100" stroke="black" strokeWidth="1" />
      <text x="25" y="65" fill="black" fontSize="12" fontWeight="bold">
        h
      </text>

      {/* Cota de Ancho de fondo 'b' */}
      <line x1="50" y1="110" x2="150" y2="110" stroke="black" strokeWidth="1" />
      <text x="95" y="120" fill="black" fontSize="12" fontWeight="bold">
        b
      </text>
    </svg>
  );
}
