import React, { lazy, Suspense, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { isValidResourceId } from "../services/apiService.js";
import { IrrigationDraftContext } from "../context/IrrigationDraftContext.jsx";
import { realSimulationPreparation, simulationPreparationAvailable } from "../utils/irrigationAvailability.js";
import s from "../components/FarmDetail/FarmDetail.module.scss";

const LocalWizard = simulationPreparationAvailable ? lazy(() => import("../components/SimulationWizard/SimulationWizard.jsx")) : null;

export default function NewSimulationPage() {
  const { fincaId } = useParams();
  const { token } = useContext(AuthContext);
  const context = useContext(IrrigationDraftContext);
  if (!isValidResourceId(fincaId)) return <div className={`${s.detail} container`}><h1>Finca no disponible</h1><p role="alert" className={s.error}>El identificador de finca no es válido.</p><Link className={s.backLink} to="/fincas">Volver a Mis fincas</Link></div>;
  if (!LocalWizard) return <div className={`${s.detail} container`}><h1>Simulación en preparación</h1><p className={s.loading}>La creación de simulaciones de riego por surcos todavía no está disponible. No se puede calcular ni guardar desde esta pantalla.</p><p><Link className={s.secondary} to={`/fincas/${fincaId}`}>Volver al detalle de finca</Link></p><p><Link className={s.backLink} to="/fincas">Ir a Mis fincas</Link></p></div>;
  if (realSimulationPreparation && context?.availability.status !== "enabled") return <div className={`${s.detail} container`}><h1>Disponibilidad del simulador</h1><p role={context?.availability.status === "loading" ? "status" : "alert"}>{context?.availability.message}</p>{context?.availability.status !== "loading" && <button className={s.secondary} type="button" onClick={context?.refreshCapability}>Consultar disponibilidad</button>}<p><Link className={s.backLink} to={`/fincas/${fincaId}`}>Volver al detalle de finca</Link></p></div>;
  return <Suspense fallback={<p className="container" role="status">Cargando el asistente...</p>}><LocalWizard key={JSON.stringify([token, fincaId])} fincaId={fincaId} sessionToken={token} /></Suspense>;
}
