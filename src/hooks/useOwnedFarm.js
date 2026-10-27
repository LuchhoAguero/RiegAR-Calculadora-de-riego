import { useEffect, useState } from "react";
import { getFincas, isValidResourceId } from "../services/apiService.js";

export default function useOwnedFarm(fincaId, sessionToken) {
  const key = JSON.stringify([sessionToken, fincaId]);
  const [view, setView] = useState({ key, loading: true, farm: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const validId = isValidResourceId(fincaId);
  useEffect(() => {
    if (!validId) return;
    let current = true;
    setView({ key, loading: true, farm: null, error: null });
    getFincas().then(farms => {
      if (!current || localStorage.getItem("token") !== sessionToken) return;
      if (!Array.isArray(farms)) throw new Error("No se pudo interpretar el listado de fincas.");
      setView({ key, loading: false, farm: farms.find(item => String(item.id) === fincaId) || null, error: null });
    }).catch(error => {
      if (current && localStorage.getItem("token") === sessionToken) setView({ key, loading: false, farm: null, error });
    });
    return () => { current = false; };
  }, [key, fincaId, sessionToken, validId, attempt]);
  return { ...(view.key === key ? view : { loading: true, farm: null, error: null }), validId, retry: () => setAttempt(value => value + 1) };
}
