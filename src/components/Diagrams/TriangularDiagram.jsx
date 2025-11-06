import React from "react";

export default function TriangularDiagram() {
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
      <path
        d="M 0 100 L 100 0 L 200 100 Z"
        fill="#69b3e7"
        stroke="#0b2e4e"
        strokeWidth="2"
      />

      {/* Cota de Profundidad 'h' */}
      <line
        x1="100"
        y1="0"
        x2="100"
        y2="100"
        stroke="black"
        strokeWidth="1"
        strokeDasharray="4"
      />
      <text x="105" y="55" fill="black" fontSize="12" fontWeight="bold">
        h
      </text>

      {/* Cota de Pendiente 'z' */}
      <line
        x1="100"
        y1="0"
        x2="200"
        y2="0"
        stroke="black"
        strokeWidth="1"
        strokeDasharray="2"
      />
      <line
        x1="200"
        y1="0"
        x2="200"
        y2="100"
        stroke="black"
        strokeWidth="1"
        strokeDasharray="2"
      />
      <text x="145" y="15" fill="black" fontSize="12" fontWeight="bold">
        z
      </text>
      <text x="185" y="55" fill="black" fontSize="12" fontWeight="bold">
        1
      </text>
    </svg>
  );
}
