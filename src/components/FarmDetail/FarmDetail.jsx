import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getFincas, isValidResourceId } from "../../services/apiService.js";
import s from "./FarmDetail.module.scss";

function OwnedFarm({ fincaId, sessionToken }) {
  const [view, setView] = useState({ loading: true, farm: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const validId = isValidResourceId(fincaId);

  useEffect(() => {
    if (!validId) return;
    let current = true;
    setView({ loading: true, farm: null, error: null });
    // No existe GET de finca individual: reutilizar la colección autenticada.
    getFincas().then(farms => {
      if (!current || localStorage.getItem("token") !== sessionToken) return;
      if (!Array.isArray(farms)) throw new Error("No se pudo interpretar el listado de fincas.");
      const farm = farms.find(item => String(item.id) === fincaId) || null;
      setView({ loading: false, farm, error: null });
    }).catch(error => {
      if (current && localStorage.getItem("token") === sessionToken) setView({ loading: false, farm: null, error });
    });
    return () => { current = false; };
  }, [fincaId, sessionToken, validId, attempt]);

  return <div className={`${s.detail} container`}>
    <Link className={s.backLink} to="/fincas">Volver a Mis fincas</Link>
    {!validId ? <><h1>Finca no disponible</h1><p role="alert" className={s.error}>El identificador de finca no es válido.</p></>
      : view.loading ? <><h1>Detalle de finca</h1><p role="status" className={s.loading}>Cargando los datos de la finca...</p></>
      : view.error ? <><h1>No pudimos cargar la finca</h1><p role="alert" className={s.error}>{view.error.message}</p><button className={s.secondary} type="button" onClick={() => setAttempt(value => value + 1)}>Volver a consultar</button></>
      : !view.farm ? <><h1>Finca no disponible</h1><p role="status" className={s.loading}>No encontramos esta finca entre las disponibles para tu sesión.</p></>
      : <>
        <header className={s.pageHead}><h1>{view.farm.nombre_finca}</h1><p>{view.farm.ubicacion || "Sin ubicación"}</p></header>
        <section className={s.data} aria-labelledby="farm-data-title">
          <h2 id="farm-data-title">Datos de la finca</h2>
          <dl><div><dt>Nombre</dt><dd>{view.farm.nombre_finca}</dd></div><div><dt>Ubicación</dt><dd>{view.farm.ubicacion || "Sin ubicación"}</dd></div></dl>
          <Link className={s.secondary} to="/fincas">Administrar mis fincas</Link>
        </section>
        <div className={s.grid}>
          <section className={s.simulations} aria-labelledby="farm-simulations-title"><p className={s.eyebrow}>Riego por surcos</p><h2 id="farm-simulations-title">Simulaciones de la finca</h2><p>La nueva simulación de riego por surcos está en preparación.</p><p>La creación, los resultados y el historial de simulaciones todavía no están disponibles en esta pantalla.</p></section>
          <section className={s.previous} aria-labelledby="farm-previous-title"><p className={s.eyebrow}>Herramientas anteriores</p><h2 id="farm-previous-title">Cálculos Manning</h2><p>Consultá los cálculos históricos vinculados a esta finca.</p><Link className={s.secondary} to={`/finca/${fincaId}`}>Ver cálculos Manning</Link></section>
        </div>
      </>}
  </div>;
}

export default function FarmDetail() {
  const { fincaId } = useParams();
  const { token } = useContext(AuthContext);
  // Key interno de React, nunca atributo/URL: aislar datos antes de pintar otra finca o sesión.
  return <OwnedFarm key={JSON.stringify([token, fincaId])} fincaId={fincaId} sessionToken={token} />;
}
