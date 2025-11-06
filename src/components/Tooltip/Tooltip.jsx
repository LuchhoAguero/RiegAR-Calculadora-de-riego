import React from "react";
import { FaQuestionCircle } from "react-icons/fa"; // Usaremos un ícono que ya tenemos
import s from "./Tooltip.module.scss";

export default function Tooltip({ text }) {
  return (
    <div className={s.tooltipContainer}>
      <FaQuestionCircle />
      <span className={s.tooltipText}>{text}</span>
    </div>
  );
}
