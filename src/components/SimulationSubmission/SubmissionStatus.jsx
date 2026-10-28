import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IrrigationDraftContext } from "../../context/IrrigationDraftContext.jsx";
import { FIELDS } from "../../utils/irrigationV2Form.js";
import Modal from "../Modal/Modal.jsx";
import s from "./SimulationSubmission.module.scss";

const TITLES = { pending: "Envío en proceso", uncertain: "Guardado incierto", rejected: "Revisá los datos del envío", denied: "No pudimos completar el envío", confirmed: "Guardado confirmado", ready: "Otro envío autorizado" };
export default function SubmissionStatus({ fincaId, onField, autoFocus = false }) {
  const context = useContext(IrrigationDraftContext), root = useRef(null);
  const [confirmRepeat, setConfirmRepeat] = useState(false);
  const submission = context?.submission;
  const visible = submission?.attempt?.fincaId === String(fincaId) && submission.status !== "idle";
  useEffect(() => {
    if (autoFocus && visible) { root.current?.focus({ preventScroll: true }); root.current?.scrollIntoView({ block: "center" }); }
  }, [autoFocus, visible, submission?.status]);
  if (!visible) return null;
  const { status, message, fields, snapshot } = submission;
  return <section className={s.status} ref={root} tabIndex={-1} aria-label={TITLES[status]} aria-busy={status === "pending"}>
    <h2>{TITLES[status]}</h2>
    <p role={["uncertain", "rejected", "denied"].includes(status) ? "alert" : "status"}>{message}</p>
    {status === "pending" && <p>Salir de la pantalla no garantiza cancelar el guardado. No vuelvas a enviar mientras está en proceso.</p>}
    {status === "uncertain" && <p>El nombre, la fecha y los resúmenes no identifican por sí solos este intento. Podés abrir un candidato del historial para comparar todos sus datos. No encontrarlo todavía no demuestra que haya fallado.</p>}
    {Object.keys(fields).length > 0 && <ul>{Object.entries(fields).map(([path, error]) => <li key={path}>{onField ? <button type="button" className={s.fieldLink} onClick={() => onField(path)}>{FIELDS.find(field => field.path === path)?.label}: {error}</button> : `${FIELDS.find(field => field.path === path)?.label}: ${error}`}</li>)}</ul>}
    {submission.issues?.length > 0 && <ul>{submission.issues.map((issue, index) => <li key={index}>{issue.field && `${issue.field}: `}{issue.message}</li>)}</ul>}
    <div className={s.actions}>
      <Link className={s.secondary} to={`/fincas/${fincaId}#historial-simulaciones`}>Revisar el historial de esta finca</Link>
      {status === "confirmed" ? <Link className={s.secondary} to={`/fincas/${fincaId}/simulaciones/${snapshot.simulation.id}`}>Ver resultado guardado</Link>
        : !onField && <Link className={s.secondary} to={`/fincas/${fincaId}/simulaciones/nueva`}>Volver al intento</Link>}
      {status === "uncertain" && <button type="button" className={s.secondary} onClick={() => setConfirmRepeat(true)}>Permitir otro envío del intento</button>}
    </div>
    <p className={s.note}>API simulada. El seguimiento está solo en memoria: recargar, cerrar o terminar la sesión puede perderlo.</p>
    <Modal isOpen={confirmRepeat} onClose={() => setConfirmRepeat(false)} title="¿Permitir otro envío?">
      <p>La simulación anterior puede haberse guardado. Un nuevo envío puede duplicarla, incluso si no la encontraste en el historial. No hay garantía de ejecución exactamente una vez.</p>
      <p>Esta autorización no envía nada. Después tendrás que volver a pulsar Calcular y guardar.</p>
      <div className={s.actions}><button type="button" className={s.secondary} onClick={() => setConfirmRepeat(false)}>Seguir revisando</button><button type="button" className={s.secondary} onClick={() => { context.authorizeRepeat(); setConfirmRepeat(false); }}>Entiendo el riesgo de duplicación</button></div>
    </Modal>
  </section>;
}
