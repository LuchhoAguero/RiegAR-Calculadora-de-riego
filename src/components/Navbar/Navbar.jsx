// src/components/Navbar/Navbar.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom"; // 1. Importar Link en lugar de <a>
import s from "./Navbar.module.scss";
import logo from "../../assets/images/riegar-logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // 2. Cambiamos los href por 'to' y los adaptamos a nuestras futuras rutas
  const nav = [
    { label: "Calculadora", to: "/calculadora" }, // Aún usan anclas, pero dentro de Link
    { label: "Guía", to: "/guia" },
    { label: "Configuración", to: "/configuracion" },
    { label: "Contacto", to: "/contacto" },
  ];

  return (
    <header className={s.navbar}>
      <div className="container">
        <div className={s.row}>
          {/* 3. El logo ahora es un Link a la página principal */}
          <Link className={s.brand} to="/">
            <img src={logo} alt="RiegAR" />
            <span>
              Rieg<span className={s.em}>AR</span>
            </span>
          </Link>

          <button
            className={s.burger}
            aria-label="Abrir menú"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`${s.menu} ${open ? s.isOpen : ""}`}>
            {/* 4. Mapeamos y usamos Link en lugar de <a> */}
            {nav.map((it) => (
              <Link key={it.to} to={it.to} onClick={() => setOpen(false)}>
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
