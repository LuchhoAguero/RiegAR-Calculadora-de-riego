import React from "react";
import s from "./Footer.module.scss";
import { FaFacebook, FaInstagram, FaXTwitter } from "react-icons/fa6";
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
              Herramientas profesionales para el cálculo de caudales de riego
              utilizando la fórmula de Manning.
            </p>
            <div className={s.socials}>
              <a href="#" aria-label="Facebook">
                <FaFacebook aria-hidden />
              </a>
              <a href="#" aria-label="Instagram">
                <FaInstagram aria-hidden />
              </a>
              <a href="#" aria-label="X (Twitter)">
                <FaXTwitter aria-hidden />
              </a>
            </div>
          </div>
          <div>
            <div className={s.groupTitle}>Enlaces Rápidos</div>
            <ul>
              <li>
                <a href="/calculadora">Calculadora de caudal </a>
              </li>
              <li>
                <a href="/guia">Guía de Uso</a>
              </li>
              <li>
                <a href="/contacto">contacto</a>
              </li>
              <li>
                <a href="#faq">Preguntas Frecuentes</a>
              </li>
            </ul>
          </div>
          <div>
            <div className={s.groupTitle}>
              <a href="/contacto">Contactanos</a>
            </div>
            <ul>
              <li>info@riegar.com.ar</li>
              <li>+54 2634621194</li>
              <li>Mendoza, Argentina</li>
            </ul>
          </div>
        </div>
        <div className={s.copy}>
          © 2025 RiegAR. Todos los derechos reservados. | Diseñado y
          desarrollado por <strong>Luciano Agüero</strong>.
        </div>
      </div>
    </footer>
  );
}
