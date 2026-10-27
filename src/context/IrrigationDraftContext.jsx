import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { emptyValues } from "../utils/irrigationV2Form.js";

export const IrrigationDraftContext = createContext(null);

function SessionDraft({ children }) {
  const [draft, setDraft] = useState(null);
  const start = useCallback(farm => setDraft({ fincaId: String(farm.id), farmName: farm.nombre_finca, values: emptyValues(), resolutions: {}, step: 0, reached: 0 }), []);
  const discard = useCallback(() => setDraft(null), []);
  const value = useMemo(() => ({ draft, setDraft, start, discard }), [draft, start, discard]);
  return <IrrigationDraftContext.Provider value={value}>{children}</IrrigationDraftContext.Provider>;
}

export default function IrrigationDraftProvider({ children }) {
  const { token, isLoggedIn } = useContext(AuthContext);
  // Un único estado en memoria, nuevo para cada sesión; nunca se persiste el borrador.
  return <SessionDraft key={isLoggedIn ? token : "signed-out"}>{children}</SessionDraft>;
}
