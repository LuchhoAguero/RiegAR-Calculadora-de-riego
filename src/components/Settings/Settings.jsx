import React from "react";
import s from "./Settings.module.scss";

export default function Settings() {
  return (
    <div className={s.settingsContainer + " container"}>
      <h1>Configuración</h1>
      <div className={s.placeholder}>
        <h2>Próximamente</h2>
        <p>
          Esta sección está en desarrollo. En el futuro, aquí podrás configurar
          preferencias como:
        </p>
        <ul>
          <li>Cambio de tema (claro/oscuro)</li>
          <li>Unidades de medida (métrico/imperial)</li>
          <li>Idioma de la interfaz</li>
        </ul>
      </div>
    </div>
  );
}
