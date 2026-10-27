import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ApiError, getIrrigationSimulationDetail, isValidResourceId } from "../services/apiService.js";
import { readErrorMessage } from "../utils/irrigationHistory.js";
import SimulationResults from "../components/IrrigationResults/SimulationResults.jsx";
import s from "../components/FarmDetail/FarmDetail.module.scss";

function OwnedSimulation({ fincaId, simulationId, sessionToken }) {
  const [view, setView] = useState({ loading: true, snapshot: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const root = useRef(null);
  const validIds = isValidResourceId(fincaId) && isValidResourceId(simulationId);
  useEffect(() => {
    if (!validIds) return;
    let current = true;
    setView({ loading: true, snapshot: null, error: null });
    getIrrigationSimulationDetail(fincaId, simulationId).then(snapshot => {
      if (!current || localStorage.getItem("token") !== sessionToken) return;
      if (String(snapshot?.simulation?.fincaId) !== fincaId || String(snapshot?.simulation?.id) !== simulationId) throw new ApiError("El detalle recibido no corresponde al recurso solicitado.", { code: "INVALID_DETAIL_RESPONSE" });
      setView({ loading: false, snapshot, error: null });
    }).catch(error => { if (current && localStorage.getItem("token") === sessionToken) setView({ loading: false, snapshot: null, error }); });
    return () => { current = false; };
  }, [fincaId, simulationId, sessionToken, validIds, attempt]);
  useEffect(() => {
    if (!view.loading || !validIds) { const title = root.current?.querySelector("h1"); if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); window.scrollTo(0, 0); } }
  }, [view.loading, validIds]);
  return <div className={`${s.detail} container`} ref={root}>
    <Link className={s.backLink} to={isValidResourceId(fincaId) ? `/fincas/${fincaId}#historial-simulaciones` : "/fincas"}>Volver al historial de la finca</Link>
    {!validIds ? <><h1>Simulación no disponible</h1><p className={s.error} role="alert">Los identificadores de finca y simulación deben ser válidos.</p></>
      : view.loading ? <><h1>Detalle de simulación</h1><p className={s.loading} role="status">Consultando la simulación guardada...</p></>
      : view.error ? <><h1>No pudimos consultar la simulación</h1><p className={s.error} role="alert">{readErrorMessage(view.error)}</p><button className={s.secondary} type="button" onClick={() => setAttempt(value => value + 1)}>Volver a consultar</button></>
      : <SimulationResults snapshot={view.snapshot} />}
  </div>;
}
export default function SimulationDetailPage() {
  const { fincaId, simulationId } = useParams();
  const { token } = useContext(AuthContext);
  return <OwnedSimulation key={JSON.stringify([token, fincaId, simulationId])} fincaId={fincaId} simulationId={simulationId} sessionToken={token} />;
}
