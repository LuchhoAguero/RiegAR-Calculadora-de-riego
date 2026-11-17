import React from "react";
import { Link } from "react-router-dom";
import s from "./Footer.module.scss";
export default function Footer() {
  return (
    <footer className={s.footer} id="contact">
      <div className="container">
        <div className={s.grid}>
          <div>
            <div className={s.brand}>
              Rieg<span>AR</span>
            </div>
            <p>
              Gestión de fincas y herramientas de riego, en un mismo lugar.
            </p>
          </div>
          <div>
            <div className={s.groupTitle}>Tu espacio de trabajo</div>
            <ul>
              <li>
                <Link to="/fincas">Mis fincas</Link>
              </li>
              <li>
                <Link to="/contacto">Contacto</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className={s.groupTitle}>Herramientas anteriores</div>
            <ul>
              <li><Link to="/calculadora">Calculadora Manning</Link></li>
              <li><Link to="/guia">Guía Manning</Link></li>
            </ul>
          </div>
          <div>
            <div className={s.groupTitle}>
              <Link to="/contacto">Contactanos</Link>
            </div>
            <ul>
              <li>info@riegar.com.ar</li>
              <li>+54 2634621194</li>
              <li>Mendoza, Argentina</li>
            </ul>
          </div>
        </div>
        <div className={s.copy}>
          © {new Date().getFullYear()} RiegAR. Todos los derechos reservados. | Diseñado y
          desarrollado por <strong>Luciano Agüero</strong>.
        </div>
      </div>
    </footer>
  );
}
