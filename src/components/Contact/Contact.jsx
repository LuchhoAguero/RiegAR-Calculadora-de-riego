import React, { useState } from "react";
import s from "./Contact.module.scss";
import { sendContactMessage } from "../../services/apiService";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Estados para feedback visual
  const [status, setStatus] = useState("idle");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // 2. Llamar al servicio
      await sendContactMessage(formData);

      setStatus("success");
      setFormData({ name: "", email: "", message: "" }); // Limpiar form

      // Volver a estado normal después de 3 segundos
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

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
          <form onSubmit={handleSubmit}>
            <div className={s.field}>
              <label htmlFor="name">Nombre</label>
              {/* 6. Conecta el input al estado */}
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="email">Email</label>
              {/* Conecta el input al estado */}
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="message">Mensaje</label>
              {/* Conecta el textarea al estado */}
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleInputChange}
              ></textarea>
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
