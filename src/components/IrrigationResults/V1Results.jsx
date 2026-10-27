import React from "react";
import { FaTint, FaLayerGroup, FaSeedling } from "react-icons/fa";
import { inspectV1Snapshot, V1_INPUT_FIELDS, V1_METRICS } from "../../utils/irrigationV1Results.js";
import { DiagnosticList, Metric, Group, ResultReference } from "./V2Results.jsx";
import s from "./V2Results.module.scss";

export default function V1Results({ snapshot }) {
  if (inspectV1Snapshot(snapshot).status !== "supported") return <section className={s.invalid}><h1>No se pueden presentar estos resultados V1</h1><p role="alert">Los datos históricos están incompletos o no corresponden al contrato V1. No se agregarán valores V2 ni se recalculará el resultado.</p></section>;
  const { simulation, output } = snapshot;
  const date = new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(simulation.createdAt));
  return <article className={s.results} aria-label="Resultados históricos de riego V1">
    <header className={s.header}><p className={s.eyebrow}>Riego por surcos · Contrato histórico V1</p><h1>Resultados históricos V1</h1><p className={s.name}>{simulation.name || "Simulación sin nombre"}</p><p className={s.hint}>Finca #{simulation.fincaId} · {date} UTC</p></header>
    <p className={s.neutral}>Este resultado conserva el ancho del surco del contrato V1. No se interpreta como distancia entre surcos ni se agregan cantidades o totales V2.</p>
    <dl className={s.summary}>{["waterNeed.targetDepthMm", "application.appliedVolumeL", "efficiency.applicationEfficiencyPct"].map(path => <Metric key={path} snapshot={snapshot} path={path} />)}</dl>
    <p className={s.precisionNote}>≈ indica redondeo solo de lectura. Podés consultar el valor completo recibido, sin cambiar los datos originales.</p>
    <section className={s.diagnosticSection} aria-label="Diagnósticos del modelo"><h2>Diagnósticos del modelo</h2><p>Mensajes y evidencia almacenados, sin volver a evaluar las reglas.</p><DiagnosticList items={output.diagnostics.items} /></section>
    <div className={s.groups}>
      <Group snapshot={snapshot} category="crop" Icon={FaSeedling} title="Necesidad hídrica V1" description="Lámina objetivo histórica del escenario. El contrato V1 no incluye consumo diario ni plazos de reserva." paths={["waterNeed.targetDepthMm"]} />
      <Group snapshot={snapshot} category="crop" Icon={FaSeedling} title="Eficiencia e indicadores" description="Estimaciones del modelo histórico; no sustituyen mediciones de campo." paths={["efficiency.applicationEfficiencyPct", "diagnostics.advanceRatioPct", "diagnostics.maxNonErosiveFlowLps"]} />
      <Group snapshot={snapshot} category="soil" Icon={FaLayerGroup} title="Agua disponible en el suelo" description="Magnitudes conservadas con el alcance original V1." paths={V1_METRICS.filter(metric => metric.path.startsWith("soilWater.")).map(metric => metric.path)} />
      <Group snapshot={snapshot} category="water" Icon={FaTint} title="Aplicación del riego por surco" description="Láminas y volúmenes estimados recibidos. Las pérdidas no identifican una causa física ni una medición de percolación profunda." paths={V1_METRICS.filter(metric => metric.path.startsWith("application.")).map(metric => metric.path)} />
    </div>
    <ResultReference snapshot={snapshot} fields={V1_INPUT_FIELDS} explanation="Entradas originales del contrato V1. El ancho almacenado no se convierte en distancia entre surcos. Resultados estimados, no mediciones." />
  </article>;
}
