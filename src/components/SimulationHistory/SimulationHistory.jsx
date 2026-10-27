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

export default function SimulationHistory({ fincaId, sessionToken }) {
  const [view, setView] = useState({ items: [], pagination: null, busy: true, error: null });
  const active = useRef(false), inFlight = useRef(false), sequence = useRef(0), cursors = useRef(new Set());
  const lastAttempt = useRef({ replace: true, cursor: undefined });
  const root = useRef(null), pendingFocus = useRef(null), errorText = useRef(null), endText = useRef(null);
  const heading = useRef(null), location = useLocation();
  const load = async (replace = false, cursor) => {
    if (inFlight.current || !active.current || localStorage.getItem("token") !== sessionToken) return;
    inFlight.current = true;
    lastAttempt.current = { replace, cursor };
    const trigger = root.current?.contains(document.activeElement) && document.activeElement.tagName === "BUTTON" ? document.activeElement : null;
    const previousIds = new Set(view.items.map(item => item.simulation.id));
    const request = ++sequence.current;
    const current = () => active.current && sequence.current === request && localStorage.getItem("token") === sessionToken;
    setView(previous => ({ ...previous, busy: true, error: null }));
    try {
      const page = await getIrrigationSimulationHistory(fincaId, { limit: HISTORY_LIMIT, ...(cursor === undefined ? {} : { cursor }) });
      if (!current()) return;
      validateHistoryPage(page, fincaId);
      if (!replace && page.pagination.hasMore && cursors.current.has(page.pagination.nextCursor)) throw new ApiError("El historial no avanzó. Volvé a actualizarlo antes de continuar.", { code: "REPEATED_HISTORY_CURSOR" });
      if (replace) cursors.current = new Set();
      if (page.pagination.hasMore) cursors.current.add(page.pagination.nextCursor);
      if (trigger) pendingFocus.current = { trigger, replace, nextId: page.items.find(item => !previousIds.has(item.simulation.id))?.simulation.id };
      setView(previous => ({ items: appendHistory(replace ? [] : previous.items, page.items), pagination: page.pagination, busy: false, error: null }));
    } catch (error) {
      if (current()) {
        const accessLost = error.status === 403 || error.status === 404;
        if (accessLost) lastAttempt.current = { replace: true, cursor: undefined };
        if (trigger) pendingFocus.current = { trigger, error: true };
        setView(previous => ({ ...previous, ...(accessLost ? { items: [], pagination: null } : {}), busy: false, error }));
      }
    }
    finally { if (sequence.current === request) inFlight.current = false; }
  };
  useEffect(() => {
    active.current = true; load(true);
    return () => { active.current = false; sequence.current++; inFlight.current = false; };
  }, [fincaId, sessionToken]);
  useEffect(() => {
    if (location.hash === "#historial-simulaciones") { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start" }); }
  }, [location.hash]);
  useEffect(() => {
    if (view.busy || !pendingFocus.current) return;
    const intent = pendingFocus.current; pendingFocus.current = null;
    if (document.activeElement !== document.body && document.activeElement !== intent.trigger) return;
    const target = intent.error ? errorText.current : intent.replace && intent.trigger.isConnected ? intent.trigger
      : root.current?.querySelector(`[data-simulation="${intent.nextId}"] a`) || endText.current || heading.current;
    target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: "center" });
  }, [view.busy, view.items, view.error]);

  return <section className={s.history} aria-labelledby="historial-simulaciones" aria-busy={view.busy} ref={root}>
    <div className={s.head}><div><h2 id="historial-simulaciones" tabIndex={-1} ref={heading}>Historial de simulaciones de riego</h2><p>Consultá resultados guardados, conservando su versión original.</p></div><button className={s.secondary} type="button" disabled={view.busy} onClick={() => load(true)}>Actualizar historial</button></div>
    {view.error && <p role="alert" tabIndex={-1} ref={errorText} className={s.error}>{readErrorMessage(view.error)}{view.items.length > 0 && " Se conserva el listado mostrado."}</p>}
    {view.busy && <p role="status" className={s.loading}>Cargando simulaciones guardadas...</p>}
    {!view.busy && !view.error && view.pagination && !view.items.length && <p role="status" className={s.neutral}>Todavía no hay simulaciones de riego guardadas para esta finca.</p>}
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
    {view.error && <button className={s.secondary} type="button" disabled={view.busy} onClick={() => load(lastAttempt.current.replace, lastAttempt.current.cursor)}>Volver a consultar historial</button>}
    {!view.error && view.pagination?.hasMore && <button className={s.primary} type="button" disabled={view.busy} onClick={() => load(false, view.pagination.nextCursor)}>Cargar más simulaciones</button>}
    {!view.busy && !view.error && view.items.length > 0 && !view.pagination?.hasMore && <p role="status" tabIndex={-1} ref={endText} className={s.end}>No hay más simulaciones para mostrar.</p>}
    <p className={s.note}>Los valores son resúmenes del modelo, no mediciones de campo. La ausencia de diagnósticos no certifica seguridad u optimalidad.</p>
  </section>;
}
