import React, { useState, useContext, useEffect, useRef, startTransition } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import s from "./Navbar.module.scss";
import logo from "../../assets/images/riegar-logo.png";
import { AuthContext } from "../../context/AuthContext";
import Modal from "../Modal/Modal.jsx"; // 1. Importamos el Modal

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsContainer = useRef(null);
  const toolsButton = useRef(null);
  const { pathname } = useLocation();

  // 2. Estado para controlar el modal de logout
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);

  const closeNavigation = () => {
    setOpen(false);
    setToolsOpen(false);
  };

  useEffect(() => {
    setOpen(false);
    setToolsOpen(false);
  }, [pathname, isLoggedIn]);

  useEffect(() => {
    if (!toolsOpen) return;
    const closeOutside = event => {
      if (!toolsContainer.current?.contains(event.target)) setToolsOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [toolsOpen]);

  // 3. Función que se ejecuta al hacer clic en el botón (SOLO abre el modal)
  const handleLogoutClick = () => {
    closeNavigation();
    setIsLogoutModalOpen(true); // Abrimos el modal
  };

  // 4. Función que ejecuta el logout real cuando se confirma en el modal
  const confirmLogout = () => {
    // Router navega en una transición: cerrar la sesión en la misma evita
    // que ProtectedRoute redirija a login antes de llegar al inicio.
    startTransition(() => {
      logout();
      setIsLogoutModalOpen(false);
      navigate("/", { replace: true });
    });
  };

  return (
    <header className={s.navbar}>
      <div className="container">
        <div className={s.row}>
          <Link className={s.brand} to="/" onClick={closeNavigation}>
            <img src={logo} alt="RiegAR" />
            <span>
              Rieg<span className={s.em}>AR</span>
            </span>
          </Link>

          <button
            className={s.burger}
            ref={menuButton}
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="primary-navigation"
            onClick={() => { setOpen(!open); setToolsOpen(false); }}
          >
            <span />
            <span />
            <span />
          </button>

          <nav id="primary-navigation" aria-label="Navegación principal"
            onKeyDown={event => {
              if (event.key === "Escape" && toolsOpen) {
                event.preventDefault();
                event.stopPropagation();
                setToolsOpen(false);
                toolsButton.current.focus();
              } else if (event.key === "Escape" && open) {
                event.preventDefault();
                setOpen(false);
                menuButton.current.focus();
              }
            }} className={`${s.menu} ${open ? s.isOpen : ""}`}>
            {isLoggedIn && (
              <Link
                to="/dashboard"
                onClick={closeNavigation}
                className={s.workspaceLink}
                aria-current={pathname === "/dashboard" ? "page" : undefined}
              >
                Mis fincas
              </Link>
            )}

            <Link to="/contacto" onClick={closeNavigation}>Contacto</Link>
            <div className={s.tools} ref={toolsContainer}
              onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) setToolsOpen(false);
              }}>
              <button type="button" className={s.toolsButton} ref={toolsButton}
                aria-expanded={toolsOpen} aria-controls="previous-tools-navigation"
                onClick={() => setToolsOpen(!toolsOpen)}>
                Herramientas anteriores <FiChevronDown aria-hidden="true" />
              </button>
              <ul id="previous-tools-navigation" className={s.toolsList} hidden={!toolsOpen}>
                <li><Link to="/calculadora" onClick={closeNavigation}>Calculadora Manning</Link></li>
                <li><Link to="/guia" onClick={closeNavigation}>Guía Manning</Link></li>
              </ul>
            </div>

            {/* Botones de Sesión */}
            {isLoggedIn ? (
              <button
                className={`${s.loginBtn} ${s.logoutBtn}`}
                onClick={handleLogoutClick}
              >
                Cerrar Sesión
              </button>
            ) : (
              <div className={s.sessionActions}>
                {/* Botón Iniciar Sesión */}
                <Link
                  to="/login"
                  className={s.loginBtn}
                  onClick={closeNavigation}
                >
                  Iniciar Sesión
                </Link>

                {/* NUEVO: Botón Registrarse */}
                <Link
                  to="/registro"
                  className={s.registerBtn}
                  onClick={closeNavigation}
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
