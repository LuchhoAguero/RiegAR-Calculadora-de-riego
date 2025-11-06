// src/pages/RegisterPage.jsx

import React from "react";
import RegisterForm from "../components/RegisterForm/RegisterForm.jsx";
import s from "../components/Contact/Contact.module.scss"; // Podemos seguir usando este para el contenedor principal y el título

export default function RegisterPage() {
  return (
    <div className={s.contactContainer + " container"}>
      <h1>Crear Cuenta</h1>
      <RegisterForm />
    </div>
  );
}
