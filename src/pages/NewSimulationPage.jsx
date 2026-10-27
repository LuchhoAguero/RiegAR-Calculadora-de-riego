import React, { lazy, Suspense, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { isValidResourceId } from "../services/apiService.js";
import s from "../components/FarmDetail/FarmDetail.module.scss";

// La build de producción elimina esta importación y no monta el formulario local.
const LocalWizard = import.meta.env.DEV ? lazy(() => import("../components/SimulationWizard/SimulationWizard.jsx")) : null;

export default function NewSimulationPage() {
  const { fincaId } = useParams();
  const { token } = useContext(AuthContext);
  if (!isValidResourceId(fincaId)) return <div className={`${s.detail} container`}><h1>Finca no disponible</h1><p role="alert" className={s.error}>El identificador de finca no es válido.</p><Link className={s.backLink} to="/fincas">Volver a Mis fincas</Link></div>;
  if (!import.meta.env.DEV) return <div className={`${s.detail} container`}><h1>Simulación en preparación</h1><p className={s.loading}>La creación de simulaciones de riego por surcos todavía no está disponible. No se puede calcular ni guardar desde esta pantalla.</p><p><Link className={s.secondary} to={`/fincas/${fincaId}`}>Volver al detalle de finca</Link></p><p><Link className={s.backLink} to="/fincas">Ir a Mis fincas</Link></p></div>;
  return <Suspense fallback={<p className="container" role="status">Cargando la preparación local...</p>}><LocalWizard key={JSON.stringify([token, fincaId])} fincaId={fincaId} sessionToken={token} /></Suspense>;
}
