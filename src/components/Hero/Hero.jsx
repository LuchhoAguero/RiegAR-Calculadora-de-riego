import React, { useContext } from "react";
import s from "./Hero.module.scss";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FiUser, FiMapPin, FiFolder } from "react-icons/fi";
import { academicDemoAvailable, ACADEMIC_DEMO_FORM_PATH, realSimulationPreparation } from "../../utils/irrigationAvailability.js";

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
                Organizá tus fincas y consultá sus simulaciones de riego guardadas en un mismo lugar.
              </p>
              <div className={s.cta}>
                {isLoggedIn ? <Link className={s.btnPrimary} to="/fincas">Ir a Mis fincas</Link> : <>
                  <Link className={s.btnPrimary} to="/registro">Crear cuenta</Link>
                  <Link className={s.btnGhost} to="/login">Iniciar sesión</Link>
                </>}
                {academicDemoAvailable && <Link className={s.btnGhost} to={ACADEMIC_DEMO_FORM_PATH}>Ver demo V2</Link>}
              </div>
              <p className={s.availability}>{realSimulationPreparation ? "Prepará escenarios desde una finca. El cálculo y el guardado dependen de la disponibilidad autenticada del servicio. La demo visual sigue disponible con su ejemplo oficial." : academicDemoAvailable ? "Explorá el asistente y los resultados del ejemplo oficial. La demo no calcula ni guarda; la creación real sigue en preparación." : "La nueva simulación de riego por surcos está en preparación."}</p>
            </div>
          </div>
          <div className={s.visual}>
            <div className={s.journey}>
              <h2>Un lugar para cada finca</h2>
              <ol>
                <li><FiUser aria-hidden="true" /><div><strong>Creá tu cuenta</strong><p>Accedé a tu espacio de trabajo.</p></div></li>
                <li><FiMapPin aria-hidden="true" /><div><strong>Organizá tus fincas</strong><p>Conservá su nombre y ubicación.</p></div></li>
                <li><FiFolder aria-hidden="true" /><div><strong>Consultá tus simulaciones</strong><p>Encontrá los resultados guardados de cada finca.</p></div></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
