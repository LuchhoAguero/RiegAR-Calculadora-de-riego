import React, { useContext } from "react";
import s from "./Hero.module.scss";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FiUser, FiMapPin, FiFolder } from "react-icons/fi";

export default function Hero() {
  const { isLoggedIn } = useContext(AuthContext);
  return (
    <section className={s.hero}>
      <div className={s.bg} aria-hidden="true" />
      <div className="container">
        <div className={s.grid}>
          <div className={s.content}>
            <div className={s.logoRow}>
              <img src={"/riegar-logo.png"} alt="RiegAR" className={s.logo} />
              <p className={s.eyebrow}>Gestión de riego por surcos</p>
              <h1 className={s.title}>Tu trabajo de riego, organizado por finca.</h1>
              <p className={s.subtitle}>
                Organizá tus fincas y consultá sus cálculos guardados en un mismo lugar.
              </p>
              <div className={s.cta}>
                {isLoggedIn ? <Link className={s.btnPrimary} to="/dashboard">Ir a Mis fincas</Link> : <>
                  <Link className={s.btnPrimary} to="/registro">Crear cuenta</Link>
                  <Link className={s.btnGhost} to="/login">Iniciar sesión</Link>
                </>}
              </div>
              <p className={s.availability}>La nueva simulación de riego por surcos está en preparación.</p>
            </div>
          </div>
          <div className={s.visual}>
            <div className={s.journey}>
              <h2>Un lugar para cada finca</h2>
              <ol>
                <li><FiUser aria-hidden="true" /><div><strong>Creá tu cuenta</strong><p>Accedé a tu espacio de trabajo.</p></div></li>
                <li><FiMapPin aria-hidden="true" /><div><strong>Organizá tus fincas</strong><p>Conservá su nombre y ubicación.</p></div></li>
                <li><FiFolder aria-hidden="true" /><div><strong>Consultá tus cálculos</strong><p>Encontrá los registros de cada finca.</p></div></li>
              </ol>
            </div>
          </div>
        </div>
        <section className={s.previousTools} aria-labelledby="home-previous-tools-title">
          <div><h2 id="home-previous-tools-title">Herramientas anteriores</h2><p>Calculadora Manning y guía de uso, disponibles durante la transición.</p></div>
          <div className={s.previousLinks}><Link to="/calculadora">Calculadora Manning</Link><Link to="/guia">Guía Manning</Link></div>
        </section>
      </div>
    </section>
  );
}
