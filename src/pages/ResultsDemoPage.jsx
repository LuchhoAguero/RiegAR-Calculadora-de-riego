import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import fixtures from "../fixtures/irrigation-v2-results.json";
import V2Results from "../components/IrrigationResults/V2Results.jsx";
import s from "../components/IrrigationResults/V2Results.module.scss";

// Casos negativos exclusivamente de frontera visual; no son snapshots persistibles.
const incomplete = structuredClone(fixtures[0].snapshot); delete incomplete.output.totals.totalAppliedVolumeM3;
const unsupported = structuredClone(fixtures[0].snapshot); unsupported.model.contractVersion = "irrigation-contract-v1";
const fatal = structuredClone(fixtures[0].snapshot); fatal.output.diagnostics.items[0].severity = "error";
const cases = [...fixtures,
  { id: "incomplete", label: "Caso negativo · snapshot incompleto", description: "Se quitó un campo para verificar el estado de datos inválidos. No representa un cálculo.", snapshot: incomplete },
  { id: "unsupported", label: "Caso negativo · contrato incorrecto", description: "Se cambió la versión para comprobar que no hay interpretación por campos presentes.", snapshot: unsupported },
  { id: "fatal", label: "Caso negativo · diagnóstico fatal", description: "Se alteró una severidad para probar el rechazo. El backend no persiste snapshots exitosos con diagnósticos fatales.", snapshot: fatal },
];

export default function ResultsDemoPage() {
  const [selected, setSelected] = useState("golden");
  const title = useRef(null);
  const current = cases.find(item => item.id === selected);
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, []);
  return <div className={`${s.demo} container`}>
    <Link className={s.backLink} to="/fincas">Volver a Mis fincas</Link>
    <aside className={s.demoNotice} aria-labelledby="results-demo-label"><p id="results-demo-label" ref={title} tabIndex={-1}><strong>Vista de demostración — datos de prueba</strong></p><p>Estos resultados provienen de fixtures independientes. No fueron calculados con los datos del asistente ni corresponden a una simulación guardada de tu finca.</p><p>Preparación de interfaz disponible solo en desarrollo. No se envían datos ni se guarda una simulación.</p></aside>
    <div className={s.selector}><label htmlFor="results-demo-case">Caso de demostración</label><select id="results-demo-case" aria-describedby="results-demo-description" value={selected} onChange={event => setSelected(event.target.value)}>{cases.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><p id="results-demo-description" role="status">{current.description}</p></div>
    <V2Results snapshot={current.snapshot} />
  </div>;
}
