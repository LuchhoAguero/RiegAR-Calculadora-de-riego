import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { emptyValues } from "../utils/irrigationV2Form.js";
import { createSubmissionController } from "../utils/irrigationSubmission.js";
import { isSimulationSandbox, realSimulationPreparation } from "../utils/irrigationAvailability.js";
import { createIrrigationSimulation, getIrrigationCreationCapability } from "../services/apiService.js";
import { isTokenCurrent } from "./session.js";

export const IrrigationDraftContext = createContext(null);

function SessionDraft({ children, sessionToken }) {
  const [draft, updateDraft] = useState(null), draftRef = useRef(null);
  draftRef.current = draft;
  const [submission, setSubmission] = useState({ status: "idle", attempt: null, snapshot: null, message: "", fields: {} });
  const [availability, setAvailability] = useState({ status: realSimulationPreparation ? "loading" : "disabled", message: "La creación real permanece deshabilitada." });
  const [capabilityAttempt, setCapabilityAttempt] = useState(0);
  useEffect(() => {
    if (!realSimulationPreparation || !isTokenCurrent(sessionToken)) return;
    let current = true;
    setAvailability({ status: "loading", message: "Consultando la disponibilidad autenticada del simulador..." });
    getIrrigationCreationCapability(sessionToken).then(() => {
      if (current && localStorage.getItem("token") === sessionToken) setAvailability({ status: "enabled", message: "El servicio confirmó contrato, modelo y origen V2. El cálculo y el guardado serán reales." });
    }).catch(error => {
      if (current && localStorage.getItem("token") === sessionToken) setAvailability({ status: "disabled", message: error.code === "SIMULATION_CAPABILITY_MISMATCH" ? error.message : "No pudimos consultar la disponibilidad del simulador. No se envió ninguna simulación. Podés volver a consultar el servicio." });
    });
    return () => { current = false; };
  }, [sessionToken, capabilityAttempt]);
  const refreshCapability = useCallback(() => setCapabilityAttempt(value => value + 1), []);
  const controller = useRef(null);
  if (!controller.current) controller.current = createSubmissionController({
    enabled: isSimulationSandbox() || realSimulationPreparation, real: realSimulationPreparation,
    send: async (fincaId, payload) => {
      const capability = realSimulationPreparation ? await getIrrigationCreationCapability(sessionToken) : undefined;
      return createIrrigationSimulation(fincaId, payload, capability);
    },
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
  const value = useMemo(() => ({ draft, setDraft, start, discard, submission, submit, authorizeRepeat, clearField, availability, refreshCapability, real: realSimulationPreparation }), [draft, setDraft, start, discard, submission, submit, authorizeRepeat, clearField, availability, refreshCapability]);
  return <IrrigationDraftContext.Provider value={value}>{children}</IrrigationDraftContext.Provider>;
}

export default function IrrigationDraftProvider({ children }) {
  const { token, isLoggedIn } = useContext(AuthContext);
  // Un único estado en memoria, nuevo para cada sesión; nunca se persiste el borrador.
  return <SessionDraft key={isLoggedIn ? token : "signed-out"} sessionToken={token}>{children}</SessionDraft>;
}
