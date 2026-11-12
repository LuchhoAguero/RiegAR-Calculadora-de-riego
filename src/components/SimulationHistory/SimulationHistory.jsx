import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ApiError, getIrrigationSimulationHistory } from "../../services/apiService.js";
import { HISTORY_LIMIT, appendHistory, contractLabel, readErrorMessage, validateHistoryPage } from "../../utils/irrigationHistory.js";
import { V1_CONTRACT } from "../../utils/irrigationV1Results.js";
import { V2_CONTRACT, formatResult } from "../../utils/irrigationV2Results.js";
import { Amount } from "../IrrigationResults/V2Results.jsx";
import s from "./SimulationHistory.module.scss";

const dateText = value => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));
const SEVERITIES = { info: "Información", warning: "Advertencia" };
const restartRequired = error => ["INVALID_PAGINATION", "REPEATED_HISTORY_CURSOR"].includes(error?.code);

export default function SimulationHistory({ fincaId, sessionToken }) {
  const [view, setView] = useState({ items: [], pagination: null, index: 0, busy: true, error: null });
  const active = useRef(false), inFlight = useRef(false), sequence = useRef(0), trail = useRef([]);
  const lastAttempt = useRef({ index: 0, cursor: undefined });
  const root = useRef(null), pendingFocus = useRef(null), errorText = useRef(null);
  const heading = useRef(null), location = useLocation();
  const load = async (index = 0, cursor) => {
    if (inFlight.current || !active.current || localStorage.getItem("token") !== sessionToken) return;
    inFlight.current = true;
    lastAttempt.current = { index, cursor };
    const trigger = root.current?.contains(document.activeElement) && document.activeElement.tagName === "BUTTON" ? document.activeElement : null;
    const request = ++sequence.current;
    const current = () => active.current && sequence.current === request && localStorage.getItem("token") === sessionToken;
    setView(previous => ({ ...previous, busy: true, error: null }));
    try {
      const page = await getIrrigationSimulationHistory(fincaId, { limit: HISTORY_LIMIT, ...(cursor === undefined ? {} : { cursor }) });
      if (!current()) return;
      validateHistoryPage(page, fincaId);
      const prefix = trail.current.slice(0, index);
      const next = page.pagination.nextCursor;
      if (page.pagination.hasMore && (next === cursor || prefix.some(entry => entry.cursor === next))) {
        throw new ApiError("El historial no avanzó. Volvé a la primera página para continuar.", { code: "REPEATED_HISTORY_CURSOR" });
      }
      const seen = new Set(prefix.flatMap(entry => entry.ids));
      const items = appendHistory([], page.items).filter(item => !seen.has(item.simulation.id));
      trail.current = [...prefix, { cursor, ids: items.map(item => item.simulation.id) }];
      if (trigger) pendingFocus.current = { trigger };
      setView({ items, pagination: page.pagination, index, busy: false, error: null });
    } catch (error) {
      if (current()) {
        const accessLost = error.status === 403 || error.status === 404;
        if (accessLost) {
          trail.current = [];
          lastAttempt.current = { index: 0, cursor: undefined };
        }
        if (trigger) pendingFocus.current = { trigger, error: true };
        setView(previous => ({ ...previous, ...(accessLost ? { items: [], pagination: null, index: 0 } : {}), busy: false, error }));
      }
    }
    finally { if (sequence.current === request) inFlight.current = false; }
  };
  useEffect(() => {
    active.current = true; trail.current = []; load();
    return () => { active.current = false; sequence.current++; inFlight.current = false; };
  }, [fincaId, sessionToken]);
  useEffect(() => {
    if (location.hash === "#historial-simulaciones") { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start" }); }
  }, [location.hash]);
  useEffect(() => {
    if (view.busy || !pendingFocus.current) return;
    const intent = pendingFocus.current; pendingFocus.current = null;
    if (document.activeElement !== document.body && document.activeElement !== intent.trigger) return;
    const target = intent.error ? errorText.current : heading.current;
    target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: "center" });
  }, [view.busy, view.items, view.error]);

  return <section className={s.history} aria-labelledby="historial-simulaciones" aria-busy={view.busy} ref={root}>
    <div className={s.head}><div><h2 id="historial-simulaciones" tabIndex={-1} ref={heading} aria-describedby={view.pagination ? "historial-pagina" : undefined}>Historial de simulaciones de riego</h2><p>Consultá resultados guardados, conservando su versión original.</p></div><button className={s.secondary} type="button" disabled={view.busy} onClick={() => load()}>Actualizar historial</button></div>
    {view.error && <p role="alert" tabIndex={-1} ref={errorText} className={s.error}>{readErrorMessage(view.error)}{view.items.length > 0 && " Se conserva el listado mostrado."}</p>}
    {view.busy && <p role="status" className={s.loading}>Cargando simulaciones guardadas...</p>}
    {view.pagination && <p id="historial-pagina" role="status">Página {view.index + 1}</p>}
    {!view.busy && !view.error && view.pagination && !view.items.length && <p role="status" className={s.neutral}>{view.index === 0 ? "Todavía no hay simulaciones de riego guardadas para esta finca." : "No hay simulaciones nuevas para mostrar en esta página."}</p>}
    <ul className={s.list}>{view.items.map(item => {
      const { simulation, model, summary } = item;
      const known = [V1_CONTRACT, V2_CONTRACT].includes(model.contractVersion);
      return <li className={s.card} key={simulation.id} data-simulation={simulation.id}>
        <div className={s.cardHead}><h3>{simulation.name || "Simulación sin nombre"}</h3><span className={s.version}>{contractLabel(model.contractVersion)}</span></div>
        <p className={s.date}>{dateText(simulation.createdAt)} UTC</p>
        {known ? <><dl className={s.values}>
          {[["targetDepthMm", "Lámina objetivo", "mm"], ["appliedVolumeL", "Aplicado por surco", "L"], ["applicationEfficiencyPct", "Eficiencia estimada", "%"]].map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd><Amount value={summary[key]} unit={unit} label={label} /></dd></div>)}
          {model.contractVersion === V2_CONTRACT && <><div data-summary="furrowCount"><dt>Cantidad de surcos</dt><dd>{formatResult(summary.furrowCount).full}</dd></div><div data-summary="totalAppliedVolumeL"><dt>Total aplicado</dt><dd><Amount value={summary.totalAppliedVolumeL} unit="L" label="Total aplicado del resumen" /></dd></div></>}
        </dl><p className={s.diagnosticSummary}>{summary.diagnostics.count === 0 ? "Sin diagnósticos informados" : `${summary.diagnostics.count} diagnósticos · ${summary.diagnostics.severities.map(value => SEVERITIES[value]).join(" / ")}`}</p></> : <p className={s.neutral}>No se interpretan magnitudes de un contrato no soportado.</p>}
        <details><summary>Ver versión almacenada</summary><p>Contrato: {model.contractVersion}</p><p>Modelo: {model.modelVersion}</p></details>
        <Link className={s.secondary} to={`/fincas/${fincaId}/simulaciones/${simulation.id}`}>Ver resultado de {simulation.name || `simulación ${simulation.id}`}</Link>
      </li>;
    })}</ul>
    {view.error && (restartRequired(view.error)
      ? <button className={s.secondary} type="button" onClick={() => load()}>Volver a la primera página</button>
      : <button className={s.secondary} type="button" onClick={() => load(lastAttempt.current.index, lastAttempt.current.cursor)}>Volver a consultar historial</button>)}
    {!view.error && view.pagination && (view.index > 0 || view.pagination.hasMore) &&
      <nav className={s.pagination} aria-label="Paginación del historial">
        <button className={s.secondary} type="button" disabled={view.busy || view.index === 0} onClick={() => load(view.index - 1, trail.current[view.index - 1].cursor)}>Página anterior</button>
        <button className={s.primary} type="button" disabled={view.busy || !view.pagination.hasMore} onClick={() => load(view.index + 1, view.pagination.nextCursor)}>Página siguiente</button>
      </nav>}
    {!view.busy && !view.error && (view.items.length > 0 || view.index > 0) && !view.pagination?.hasMore && <p role="status" className={s.end}>No hay más simulaciones para mostrar.</p>}
    <p className={s.note}>Los valores son resúmenes del modelo, no mediciones de campo. La ausencia de diagnósticos no certifica seguridad u optimalidad.</p>
  </section>;
}
