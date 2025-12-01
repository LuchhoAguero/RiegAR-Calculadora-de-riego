import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom"; // 1. Importa useNavigate
import { AuthContext } from "../../context/AuthContext";
import s from "./LoginForm.module.scss";
import { loginUser } from "../../services/apiService";

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate(); // 2. Inicializa el hook

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    try {
      const data = await loginUser(formData);

      // Guarda el token en el contexto
      login(data.token);

      // 3. ¡Redirige al usuario al Dashboard!
      navigate("/dashboard");

      // (Quitamos la alerta, ya que la redirección es una mejor UX)
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
          autoComplete="current-password"
        />
      </div>
      {apiError && <p className={s.errorText}>{apiError}</p>}
      <button type="submit" className={s.submitBtn} disabled={isLoading}>
        {isLoading ? "Ingresando..." : "Ingresar"}
      </button>
      <div
        style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem" }}
      >
        <span style={{ color: "#6b7a90" }}>¿No tienes una cuenta? </span>
        <a
          href="/registro"
          style={{
            color: "#0b2e4e",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Regístrate aquí
        </a>
      </div>
    </form>
  );
}
