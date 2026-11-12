import React, { useId } from "react";
import { FaQuestionCircle } from "react-icons/fa"; // Usaremos un ícono que ya tenemos
import s from "./Tooltip.module.scss";

export default function Tooltip({ text }) {
  const description = useId();
  return (
    <span className={s.tooltipContainer} tabIndex={0} role="img" aria-label="Ayuda de Manning" aria-describedby={description}>
      <FaQuestionCircle aria-hidden="true" />
      <span id={description} role="tooltip" className={s.tooltipText}>{text}</span>
    </span>
  );
}
