import React from "react";
import s from "./Contact.module.scss";

export default function Contact() {
  return (
    <div className={s.contactContainer + " container"}>
      <h1>Contacto</h1>
      <p className={s.lead}>
        ¿Tienes preguntas o sugerencias? Nos encantaría saber de ti.
      </p>
      <div className={s.grid}>
        <div className={s.info}>
          <h3>Información de Contacto</h3>
          <p>Puedes encontrarnos a través de los siguientes canales:</p>
          <ul>
            <li>
              <strong>Email:</strong> info@riegar.com.ar
            </li>
            <li>
              <strong>Teléfono:</strong> +54 263 4621194
            </li>
            <li>
              <strong>Ubicación:</strong> Mendoza, Argentina
            </li>
          </ul>
        </div>
        <div className={s.form}>
          <h3>Envíanos un mensaje</h3>
          <form>
            <div className={s.field}>
              <label htmlFor="name">Nombre</label>
              <input type="text" id="name" name="name" />
            </div>
            <div className={s.field}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" />
            </div>
            <div className={s.field}>
              <label htmlFor="message">Mensaje</label>
              <textarea id="message" name="message" rows="5"></textarea>
            </div>
            <button type="submit" className={s.submitBtn}>
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
