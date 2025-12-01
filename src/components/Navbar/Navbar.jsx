import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import s from "./Navbar.module.scss";
import logo from "../../assets/images/riegar-logo.png";
import { AuthContext } from "../../context/AuthContext";
import Modal from "../Modal/Modal.jsx"; // 1. Importamos el Modal

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // 2. Estado para controlar el modal de logout
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);

  const nav = [
    { label: "Calculadora", to: "/calculadora" },
    { label: "Guía", to: "/guia" },
    { label: "Contacto", to: "/contacto" },
  ];

  // 3. Función que se ejecuta al hacer clic en el botón (SOLO abre el modal)
  const handleLogoutClick = () => {
    setOpen(false); // Cerramos el menú móvil si está abierto
    setIsLogoutModalOpen(true); // Abrimos el modal
  };

  // 4. Función que ejecuta el logout real cuando se confirma en el modal
  const confirmLogout = () => {
    logout(); // Borra el token
    setIsLogoutModalOpen(false); // Cierra el modal
    navigate("/"); // Redirige al inicio
  };

  return (
    <header className={s.navbar}>
      <div className="container">
        <div className={s.row}>
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
            {/* Enlaces Públicos */}
            {nav.map((it) => (
              <Link key={it.to} to={it.to} onClick={() => setOpen(false)}>
                {it.label}
              </Link>
            ))}

            {/* Enlace "Mis Fincas" (Solo si está logueado) */}
            {isLoggedIn && (
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                style={{ fontWeight: "600", color: "#37b36b" }}
              >
                Mis Fincas
              </Link>
            )}

            {/* Botones de Sesión */}
            {isLoggedIn ? (
              <button
                className={`${s.loginBtn} ${s.logoutBtn}`}
                onClick={handleLogoutClick}
              >
                Cerrar Sesión
              </button>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                {/* Botón Iniciar Sesión */}
                <Link
                  to="/login"
                  className={s.loginBtn}
                  onClick={() => setOpen(false)}
                >
                  Iniciar Sesión
                </Link>

                {/* NUEVO: Botón Registrarse */}
                <Link
                  to="/registro"
                  className={s.loginBtn}
                  style={{ backgroundColor: "#37b36b" }} // Color verde para destacar
                  onClick={() => setOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* 5. Componente Modal de Logout */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="¿Cerrar Sesión?"
        message="¿Estás seguro de que quieres salir de tu cuenta?"
        type="danger"
        confirmText="Cerrar Sesión" // <-- ¡Aquí personalizamos el botón principal!
        cancelText="Cancelar"
      />
    </header>
  );
}
