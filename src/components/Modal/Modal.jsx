// src/components/Modal/Modal.jsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement;
    const root = document.getElementById("root");
    const wasInert = root?.inert;
    const previousOverflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = "hidden";
    const controls = () => [...dialogRef.current.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]'
    )].filter(element => element.getClientRects().length > 0);
    const focusFirst = () => (controls()[0] || dialogRef.current).focus();
    focusFirst();
    const keydown = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key === "Tab") {
        const items = controls();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || (event.shiftKey && document.activeElement === first) ||
            (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    };
    const containFocus = event => {
      if (!dialogRef.current.contains(event.target)) focusFirst();
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("focusin", containFocus);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("focusin", containFocus);
      if (root) root.inert = wasInert;
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected && opener.getClientRects().length) opener.focus();
      else document.querySelector('header button[aria-controls="primary-navigation"]')?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = type === "danger";
  const isSuccess = type === "success";
  const isEdit = type === "edit"; // Nuevo tipo para edición
  const defaultConfirmText = isDanger ? "Eliminar" : "Aceptar";
  return createPortal(
    <div className={s.overlay}>
      <div ref={dialogRef} tabIndex={-1} className={s.modalCard} role="dialog" aria-modal="true" aria-label={title}>
        <button className={s.closeBtn} onClick={onClose} aria-label="Cerrar diálogo">
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
    </div>, document.body
  );
}
