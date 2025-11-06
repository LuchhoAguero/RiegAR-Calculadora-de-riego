import s from "./Contact.module.scss";
import React, { useState } from "react";
export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  // 3. Crea una función para actualizar el estado cuando el usuario escribe
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 4. Crea la función que se ejecutará al enviar el formulario
const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos listos para el backend:", formData);
    alert("¡Formulario listo! La conexión con el servidor se hará en el futuro.");
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
