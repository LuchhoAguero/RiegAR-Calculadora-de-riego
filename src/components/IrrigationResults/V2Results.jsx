import React from "react";
import { FaTint, FaSeedling, FaLayerGroup, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import { FIELDS } from "../../utils/irrigationV2Form.js";
import { METRICS, formatResult, inspectV2Snapshot, valueAt } from "../../utils/irrigationV2Results.js";
import s from "./V2Results.module.scss";

const SEVERITIES = { info: { label: "Información", Icon: FaInfoCircle }, warning: { label: "Advertencia", Icon: FaExclamationTriangle }, error: { label: "Error", Icon: FaTimesCircle } };
const POINTS = { start: "Inicio del surco", middle: "Mitad del surco", end: "Final del surco" };

export function DiagnosticList({ items }) {
  if (!items.length) return <p className={s.neutral}>No se recibieron diagnósticos en estos resultados. Esto no certifica que el riego sea seguro u óptimo.</p>;
  return <ul className={s.diagnostics}>{items.map((item, index) => {
    const { label, Icon } = SEVERITIES[item.severity];
    return <li className={s[item.severity]} key={`${item.id}:${item.evidence.point || "general"}:${index}`} data-diagnostic={item.id} data-severity={item.severity}>
      <h3><Icon aria-hidden="true" /> {item.id} · {label}</h3>
      {POINTS[item.evidence.point] && <p className={s.point}>{POINTS[item.evidence.point]}</p>}
      <p>{item.message || "Sin mensaje contractual recibido."}</p>
      <details><summary>Información técnica de {item.id}{POINTS[item.evidence.point] ? ` · ${POINTS[item.evidence.point]}` : ""}</summary>
        <p>Regla: {item.ruleVersion}</p><p>Campos: {item.fields.join(", ") || "Sin campos informados"}</p>
        <pre>{JSON.stringify(item.evidence, null, 2)}</pre>
      </details>
    </li>;
  })}</ul>;
}

export function Amount({ value, unit, label, large = false }) {
  const formatted = formatResult(value);
  return <div className={large ? s.largeAmount : s.amount}>
    <p className={s.number}>{formatted.approximate && <span aria-label="aproximadamente">≈ </span>}{formatted.text}{value !== null && <span className={s.unit}> {unit}</span>}</p>
    {value === null && <p className={s.hint}>No aplica: el consumo diario del escenario es cero.</p>}
    {formatted.approximate && <details className={s.precision}><summary aria-label={`Ver valor completo de ${label}`}>Ver valor completo</summary><p>{formatted.full} {unit}</p></details>}
  </div>;
}
export function Metric({ snapshot, path }) {
  const metric = METRICS.find(item => item.path === path);
  return <div className={s.metric} data-metric={path}><dt>{metric.label} <span className={s.hint}>({metric.unit})</span></dt><dd><Amount value={valueAt(snapshot.output, path)} unit={metric.unit} label={metric.label} /></dd></div>;
}
export function Group({ snapshot, title, description, category, paths, Icon }) {
  return <section className={`${s.group} ${s[category]}`} aria-label={title}>
    <h2><Icon aria-hidden="true" /> {title}</h2><p>{description}</p>
    <dl className={s.metrics}>{paths.map(path => <Metric key={path} snapshot={snapshot} path={path} />)}</dl>
  </section>;
}

export function ResultReference({ snapshot, fields = FIELDS.filter(field => field.path !== "name"), explanation = "Resultados estimados, no mediciones. El modelo no determina la humedad actual del suelo." }) {
  const { input, model, metadata } = snapshot;
  return <section className={s.reference} aria-label="Entradas y referencia del modelo"><h2>Datos del escenario y referencia</h2><p>{explanation}</p>
    <details><summary>Ver datos de entrada almacenados</summary><dl className={s.inputList}>{fields.map(field => {
      const value = valueAt(input, field.path);
      return <div key={field.path}><dt>{field.label}{field.unit && ` (${field.unit})`}</dt><dd>{field.type === "text" ? value || "Sin indicar" : `${formatResult(value).full} ${field.unit}`}</dd></div>;
    })}</dl></details>
    <details><summary>Ver versión y datos técnicos del modelo</summary><dl className={s.inputList}><div><dt>Contrato almacenado</dt><dd>{model.contractVersion}</dd></div><div><dt>Modelo almacenado</dt><dd>{model.modelVersion}</dd></div><div><dt>Metadata</dt><dd>{metadata.metadataSchemaVersion}</dd></div><div><dt>Reglas de diagnóstico</dt><dd>{metadata.diagnosticRules.ruleVersion}</dd></div><div><dt>Referencia de código</dt><dd>{model.sourceHash}</dd></div></dl><pre>{JSON.stringify({ assumptions: metadata.assumptions, evidenceState: metadata.evidenceState, parameterProvenance: metadata.parameterProvenance }, null, 2)}</pre></details>
  </section>;
}

export default function V2Results({ snapshot }) {
  const inspected = inspectV2Snapshot(snapshot);
  if (inspected.status !== "supported") return <section className={s.invalid} aria-label="Estado de resultados">
    <h1>{inspected.status === "unsupported" ? "Versión contractual no soportada" : "No se pueden presentar estos resultados"}</h1>
    <p role="alert">{inspected.status === "unsupported" ? "Esta vista requiere datos con contrato irrigation-contract-v2. No se reinterpretarán datos de otra versión." : "Los datos recibidos están incompletos, son inválidos o contienen un diagnóstico fatal. No se muestran valores como resultados válidos."}</p>
    {inspected.fatalItems && <><h2>Diagnósticos recibidos</h2><DiagnosticList items={inspected.fatalItems} /></>}
  </section>;
  const { simulation, model, input, output, metadata } = snapshot;
  const date = new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(simulation.createdAt));
  return <article className={s.results} aria-label="Resultados de riego por surcos V2">
    <header className={s.header}><p className={s.eyebrow}>Riego por surcos · Estimación del modelo</p><h1>Resultados del escenario</h1><p className={s.name}>{simulation.name || "Simulación sin nombre"}</p><p className={s.hint}>Finca #{simulation.fincaId} · {date} UTC · Contrato V2</p></header>
    <section className={s.total} aria-label="Volumen total del escenario">
      <div><p className={s.eyebrow}>Total del escenario</p><h2>Volumen total aplicado</h2><div data-metric="totals.totalAppliedVolumeM3"><Amount value={output.totals.totalAppliedVolumeM3} unit="m³" label="Volumen total en m³" large /></div></div>
      <div className={s.totalContext}><div data-metric="totals.totalAppliedVolumeL"><Amount value={output.totals.totalAppliedVolumeL} unit="L" label="Volumen total en litros" /></div><p><strong>{formatResult(input.furrow.furrowCount).full} surcos</strong><br />Cantidad registrada en el escenario.</p><p>Volumen total estimado para todos los surcos del escenario.</p></div>
    </section>
    <dl className={s.summary}>{["waterNeed.targetDepthMm", "application.appliedVolumeL", "efficiency.applicationEfficiencyPct"].map(path => <Metric key={path} snapshot={snapshot} path={path} />)}</dl>
    <p className={s.precisionNote}>≈ indica redondeo solo de lectura. Podés consultar el valor completo recibido, sin cambiar los datos originales.</p>
    <section className={s.diagnosticSection} aria-label="Diagnósticos del modelo"><h2>Diagnósticos del modelo</h2><p>Se conservan códigos, severidades y mensajes recibidos. No sustituyen mediciones de campo.</p><DiagnosticList items={output.diagnostics.items} /></section>
    <div className={s.groups}>
      <Group snapshot={snapshot} category="crop" Icon={FaSeedling} title="Necesidad hídrica" description="Necesidad acumulada simplificada y consumo diario del escenario." paths={["waterNeed.targetDepthMm", "waterNeed.dailyCropWaterUseMmPerDay"]} />
      <Group snapshot={snapshot} category="crop" Icon={FaSeedling} title="Eficiencia e indicadores" description="Estimaciones del modelo; no reemplazan mediciones de campo ni certifican un riego seguro." paths={["efficiency.applicationEfficiencyPct", "diagnostics.advanceRatioPct", "diagnostics.maxNonErosiveFlowLps"]} />
      <Group snapshot={snapshot} category="soil" Icon={FaLayerGroup} title="Agua disponible en el suelo" description="Los plazos son referencias teóricas desde capacidad de campo. No indican días reales restantes desde hoy." paths={METRICS.filter(metric => metric.path.startsWith("soilWater.")).map(metric => metric.path)} />
      <Group snapshot={snapshot} category="water" Icon={FaTint} title="Aplicación del riego por surco" description="Las láminas en inicio, mitad y final son estimaciones en tres puntos. Las pérdidas estimadas no identifican su causa ni son una medición independiente de percolación profunda." paths={METRICS.filter(metric => metric.path.startsWith("application.")).map(metric => metric.path)} />
    </div>
    <ResultReference snapshot={snapshot} />
  </article>;
}
