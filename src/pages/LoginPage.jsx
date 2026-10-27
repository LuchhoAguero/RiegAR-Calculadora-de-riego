// src/pages/LoginPage.jsx
import React from "react";
import LoginForm from "../components/LoginForm/LoginForm.jsx";
import s from "../components/Contact/Contact.module.scss";

export default function LoginPage() {
  return (
    <div className={s.authContainer + " container"}>
      <h1>Iniciar Sesión</h1>
      <LoginForm />
    </div>
  );
}
