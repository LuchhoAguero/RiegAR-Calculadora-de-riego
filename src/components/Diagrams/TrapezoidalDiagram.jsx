import React from "react";

export default function TrapezoidalDiagram() {
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
      {/* 1. Forma del canal corregida (más angosto abajo) */}
      <path
        d="M 50 100 L 150 100 L 180 20 L 20 20 Z"
        fill="#69b3e7"
        stroke="#0b2e4e"
        strokeWidth="2"
      />

      {/* Cota de Profundidad 'h' */}
      <line
        x1="100"
        y1="20"
        x2="100"
        y2="100"
        stroke="black"
        strokeWidth="1"
        strokeDasharray="4"
      />
      <text x="105" y="65" fill="black" fontSize="12" fontWeight="bold">
        h
      </text>

      {/* 2. Cota de Ancho de fondo 'b' corregida */}
      <line x1="50" y1="110" x2="150" y2="110" stroke="black" strokeWidth="1" />
      <text x="95" y="120" fill="black" fontSize="12" fontWeight="bold">
        b
      </text>

      {/* Cota de Pendiente 'z' */}
      <line
        x1="20"
        y1="100"
        x2="50"
        y2="100"
        stroke="black"
        strokeWidth="1"
        strokeDasharray="2"
      />
      <line
        x1="20"
        y1="100"
        x2="20"
        y2="20"
        stroke="black"
        strokeWidth="1"
        strokeDasharray="2"
      />
      <text x="30" y="95" fill="black" fontSize="12" fontWeight="bold">
        z
      </text>
      <text x="25" y="65" fill="black" fontSize="12" fontWeight="bold">
        1
      </text>
    </svg>
  );
}
