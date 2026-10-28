import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { emptyValues } from "../utils/irrigationV2Form.js";
import { createSubmissionController } from "../utils/irrigationSubmission.js";
import { isSimulationSandbox } from "../utils/irrigationAvailability.js";
import { createIrrigationSimulation } from "../services/apiService.js";
import { isTokenCurrent } from "./session.js";

export const IrrigationDraftContext = createContext(null);

function SessionDraft({ children, sessionToken }) {
  const [draft, updateDraft] = useState(null), draftRef = useRef(null);
  draftRef.current = draft;
  const [submission, setSubmission] = useState({ status: "idle", attempt: null, snapshot: null, message: "", fields: {} });
  const controller = useRef(null);
  if (!controller.current) controller.current = createSubmissionController({
    enabled: isSimulationSandbox(), send: createIrrigationSimulation,
    isCurrent: () => isTokenCurrent(sessionToken) && localStorage.getItem("token") === sessionToken,
    onChange: value => { setSubmission(value); if (value.status === "confirmed") updateDraft(null); },
  });
  useEffect(() => () => controller.current.dispose(), []);
  const setDraft = useCallback(update => { if (!controller.current.locked()) updateDraft(update); }, []);
  const start = useCallback(farm => { if (controller.current.reset()) updateDraft({ fincaId: String(farm.id), farmName: farm.nombre_finca, values: emptyValues(), resolutions: {}, step: 0, reached: 0 }); }, []);
  const discard = useCallback(() => { if (controller.current.reset()) updateDraft(null); }, []);
  const submit = useCallback(() => {
    const current = draftRef.current;
    return current ? controller.current.submit(current.fincaId, current.values, current.resolutions) : Promise.resolve(false);
  }, []);
  const authorizeRepeat = useCallback(() => controller.current.authorizeRepeat(), []);
  const clearField = useCallback(path => controller.current.clearField(path), []);
  const value = useMemo(() => ({ draft, setDraft, start, discard, submission, submit, authorizeRepeat, clearField }), [draft, setDraft, start, discard, submission, submit, authorizeRepeat, clearField]);
  return <IrrigationDraftContext.Provider value={value}>{children}</IrrigationDraftContext.Provider>;
}

export default function IrrigationDraftProvider({ children }) {
  const { token, isLoggedIn } = useContext(AuthContext);
  // Un único estado en memoria, nuevo para cada sesión; nunca se persiste el borrador.
  return <SessionDraft key={isLoggedIn ? token : "signed-out"} sessionToken={token}>{children}</SessionDraft>;
}
