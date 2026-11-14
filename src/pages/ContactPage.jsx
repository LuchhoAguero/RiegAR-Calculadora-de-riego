import React from "react";
import Contact from "../components/Contact/Contact.jsx";

export default function ContactPage() {
  if (import.meta.env.MODE === "staging") {
    return <section className="container">
      <h1>Contacto</h1>
      <p>El envío de mensajes está deshabilitado en este entorno de demostración.</p>
    </section>;
  }
  return <Contact />;
}
