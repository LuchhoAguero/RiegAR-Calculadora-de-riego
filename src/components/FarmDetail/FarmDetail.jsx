import React, { useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import useOwnedFarm from "../../hooks/useOwnedFarm.js";
import SimulationHistory from "../SimulationHistory/SimulationHistory.jsx";
import s from "./FarmDetail.module.scss";

function OwnedFarm({ fincaId, sessionToken }) {
  const view = useOwnedFarm(fincaId, sessionToken);
  const { validId } = view;

  return <div className={`${s.detail} container`}>
    <Link className={s.backLink} to="/fincas">Volver a Mis fincas</Link>
    {!validId ? <><h1>Finca no disponible</h1><p role="alert" className={s.error}>El identificador de finca no es válido.</p></>
      : view.loading ? <><h1>Detalle de finca</h1><p role="status" className={s.loading}>Cargando los datos de la finca...</p></>
      : view.error ? <><h1>No pudimos cargar la finca</h1><p role="alert" className={s.error}>{view.error.message}</p><button className={s.secondary} type="button" onClick={view.retry}>Volver a consultar</button></>
      : !view.farm ? <><h1>Finca no disponible</h1><p role="status" className={s.loading}>No encontramos esta finca entre las disponibles para tu sesión.</p></>
      : <>
        <header className={s.pageHead}><h1>{view.farm.nombre_finca}</h1><p>{view.farm.ubicacion || "Sin ubicación"}</p></header>
        <section className={s.data} aria-labelledby="farm-data-title">
          <h2 id="farm-data-title">Datos de la finca</h2>
          <dl><div><dt>Nombre</dt><dd>{view.farm.nombre_finca}</dd></div><div><dt>Ubicación</dt><dd>{view.farm.ubicacion || "Sin ubicación"}</dd></div></dl>
          <Link className={s.secondary} to="/fincas">Administrar mis fincas</Link>
        </section>
        <SimulationHistory fincaId={fincaId} sessionToken={sessionToken} />
        <section className={s.simulations} aria-labelledby="farm-simulations-title"><p className={s.eyebrow}>Riego por surcos</p><h2 id="farm-simulations-title">Simulaciones de la finca</h2><p>La nueva simulación de riego por surcos está en preparación.</p><p>La creación sigue deshabilitada. Podés consultar los resultados guardados en el historial de esta finca.</p>{import.meta.env.DEV && <Link className={s.secondary} to={`/fincas/${fincaId}/simulaciones/nueva`}>Preparar simulación (solo local)</Link>}</section>
        <details className={s.previous} onKeyDown={event => {
          if (event.key === "Escape" && event.currentTarget.open) {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary").focus();
          }
        }}>
          <summary>Cálculos anteriores — Manning</summary>
          <div className={s.previousContent}><p>Consultá los cálculos Manning vinculados a esta finca. Son registros distintos de las simulaciones de riego por surcos.</p><Link className={s.secondary} to={`/finca/${fincaId}`}>Ver cálculos Manning</Link></div>
        </details>
      </>}
  </div>;
}

export default function FarmDetail() {
  const { fincaId } = useParams();
  const { token } = useContext(AuthContext);
  // Key interno de React, nunca atributo/URL: aislar datos antes de pintar otra finca o sesión.
  return <OwnedFarm key={JSON.stringify([token, fincaId])} fincaId={fincaId} sessionToken={token} />;
}
