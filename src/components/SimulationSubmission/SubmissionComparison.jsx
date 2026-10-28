import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { IrrigationDraftContext } from "../../context/IrrigationDraftContext.jsx";
import { compareSubmissionInputs } from "../../utils/irrigationSubmission.js";
import s from "./SimulationSubmission.module.scss";

const show = value => value === null ? "Sin indicar" : String(value).replace(".", ",");
export default function SubmissionComparison({ snapshot, fincaId }) {
  const context = useContext(IrrigationDraftContext), submission = context?.submission;
  if (submission?.status !== "uncertain" || submission.attempt?.fincaId !== String(fincaId)) return null;
  const rows = compareSubmissionInputs(submission.attempt, snapshot);
  return <section className={s.comparison} aria-labelledby="submission-comparison-title">
    <h2 id="submission-comparison-title">Comparación con el intento incierto</h2>
    {!rows ? <p role="status">Este detalle no permite comparar un snapshot V2 válido de la misma finca. El guardado sigue incierto.</p> : <>
      <p role="status">{rows.every(row => row.matches) ? "Los datos completos coinciden. Esto no identifica de forma única el intento: pueden existir simulaciones legítimas idénticas." : "Los datos completos no coinciden. Este candidato no confirma el guardado del intento."}</p>
      <p>La comparación no confirma ni repite el POST. El intento continúa incierto.</p>
      <details className={s.comparisonData}><summary>Ver comparación de los 17 campos</summary><ul className={s.comparisonList}>{rows.map(({ field, sent, stored, matches }) => <li key={field.path}>
        <h3>{field.label}{field.unit && ` (${field.unit})`}</h3><dl><div><dt>Enviado</dt><dd>{show(sent)}</dd></div><div><dt>Guardado</dt><dd>{show(stored)}</dd></div></dl><p>{matches ? "Coincide" : "Difiere"}</p>
      </li>)}</ul></details>
    </>}
    <Link className={s.secondary} to={`/fincas/${fincaId}/simulaciones/nueva`}>Volver al intento incierto</Link>
  </section>;
}
