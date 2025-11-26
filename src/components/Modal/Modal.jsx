// src/components/Modal/Modal.jsx
import React from "react";
import s from "./Modal.module.scss";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaEdit,
} from "react-icons/fa"; // Importa FaEdit

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  type = "info",
  confirmText, // Nuevo: Texto personalizado para el botón de acción
  cancelText,
}) {
  if (!isOpen) return null;

  const isDanger = type === "danger";
  const isSuccess = type === "success";
  const isEdit = type === "edit"; // Nuevo tipo para edición
  const defaultConfirmText = isDanger ? "Eliminar" : "Aceptar";
  return (
    <div className={s.overlay}>
      <div className={s.modalCard}>
        <button className={s.closeBtn} onClick={onClose}>
          <FaTimes />
        </button>

        <div
          className={`${s.iconContainer} ${isDanger ? s.danger : ""} ${
            isSuccess ? s.success : ""
          } ${isEdit ? s.edit : ""}`}
        >
          {isDanger && <FaExclamationTriangle />}
          {isSuccess && <FaCheckCircle />}
          {isEdit && <FaEdit />} {/* Nuevo icono */}
        </div>

        <h3 className={s.title}>{title}</h3>

        {/* Si hay mensaje, lo muestra. Si hay children (formulario), lo muestra. */}
        {message && <p className={s.message}>{message}</p>}
        {children}

        {/* Solo mostramos botones por defecto si NO pasamos children, 
            porque el formulario tendrá sus propios botones */}
        {!children && (
          <div className={s.actions}>
            {onConfirm && (
              <button className={s.cancelBtn} onClick={onClose}>
                {/* 2. Usamos el texto personalizado o el defecto 'Cancelar' */}
                {cancelText || "Cancelar"}
              </button>
            )}
            <button
              className={`${s.confirmBtn} ${
                isDanger ? s.btnDanger : s.btnSuccess
              }`}
              onClick={() => {
                if (onConfirm) onConfirm();
                else onClose();
              }}
            >
              {/* 3. Usamos el texto personalizado o el defecto calculado */}
              {onConfirm ? confirmText || defaultConfirmText : "Entendido"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
