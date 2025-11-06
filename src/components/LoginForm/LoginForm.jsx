// src/components/LoginForm/LoginForm.jsx
import React, { useState, UseContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import s from "./LoginForm.module.scss";
import { loginUser } from "../../services/apiService";
export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const { login } = useContext(AuthContext);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    // 3. Convierte la función en async
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    try {
      // 4. Llama a la API
      const data = await loginUser(formData);

      // ¡ÉXITO! Por ahora, solo mostramos el token en la consola.
      login(data.token);

      // (Opcional) Mostramos una alerta de éxito
      alert("¡Bienvenido! Has iniciado sesión correctamente.");
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={s.formContainer}>
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
      <button type="submit" className={s.submitBtn} disabled={isLoading}>
        {isLoading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
