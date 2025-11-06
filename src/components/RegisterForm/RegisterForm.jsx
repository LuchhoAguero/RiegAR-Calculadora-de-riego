// src/components/RegisterForm/RegisterForm.jsx

import React, { useState } from "react";
import s from "./RegisterForm.module.scss"; // Importa sus propios estilos
import { registerUser } from "../../services/apiService";
export default function RegisterForm() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    // 3. Convierte la función en async
    e.preventDefault();
    setIsLoading(true); // Activa el estado de carga
    setApiError(null); // Limpia errores anteriores
    setSuccessMessage(null);

    try {
      // 4. Llama a la API
      const data = await registerUser(formData);
      setSuccessMessage(data.message); // Muestra el mensaje de éxito del backend
      setFormData({ nombre: "", email: "", password: "" }); // Limpia el formulario
    } catch (error) {
      // 5. Atrapa el error si la API falla
      setApiError(error.message); // Muestra el error (ej. "El email ya está registrado.")
    } finally {
      setIsLoading(false); // Desactiva el estado de carga
    }
  };
  return (
    <form onSubmit={handleSubmit} className={s.formContainer}>
      <div className={s.field}>
        <label htmlFor="nombre">Nombre</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className={s.field}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className={s.field}>
        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </div>
      {apiError && <p className={s.errorText}>{apiError}</p>}
      {successMessage && <p className={s.successText}>{successMessage}</p>}
      <button type="submit" className={s.submitBtn} disabled={isLoading}>
        {isLoading ? "Registrando..." : "Registrarse"}
      </button>
    </form>
  );
}
