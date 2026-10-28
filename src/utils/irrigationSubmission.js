import { FIELDS, buildV2Payload } from "./irrigationV2Form.js";
import { inspectV2Snapshot } from "./irrigationV2Results.js";

export const UNCERTAIN_MESSAGE = "No pudimos confirmar si la simulación se guardó. Revisá el historial de esta finca antes de volver a enviarla";
const copy = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const valueAt = (input, path) => path.split(".").reduce((value, key) => value?.[key], input);
const text = value => value === undefined || value === null ? null : value.trim() || null;
const inputField = path => typeof path === "string" ? path.replace(/^(?:body|input)\./, "") : undefined;
export function compareSubmissionInputs(attempt, snapshot) {
  if (!attempt || String(snapshot?.simulation?.fincaId) !== attempt.fincaId || inspectV2Snapshot(snapshot).status !== "supported") return null;
  return FIELDS.map(field => {
    const sent = field.path === "name" ? attempt.payload.name : valueAt(attempt.payload, field.path);
    const stored = field.path === "name" ? snapshot.simulation.name : valueAt(snapshot.input, field.path);
    const expected = field.type === "text" ? text(sent) : sent;
    const received = field.type === "text" ? text(stored) : stored;
    return { field, sent: expected, stored: received, matches: expected === received };
  });
}
export function verifiedCreation(snapshot, attempt) {
  const comparison = compareSubmissionInputs(attempt, snapshot);
  return Boolean(comparison && comparison.every(row => row.matches));
}
export function submissionError(error) {
  if (error?.code === "SIMULATION_CREATION_DISABLED") return { status: "denied", message: error.message, fields: {} };
  if (["NETWORK_ERROR", "INVALID_RESPONSE"].includes(error?.code)) return { status: "uncertain", message: UNCERTAIN_MESSAGE, fields: {} };
  const rejected = (error?.status === 400 && ["INVALID_REQUEST", "INVALID_ROUTE_PARAMETER", "INVALID_APPLICATION_INPUT", "INVALID_IRRIGATION_INPUT", "invalid_input"].includes(error.code)) ||
    (error?.status === 422 && error.code === "IRRIGATION_MODEL_INCONSISTENCY");
  if (rejected) {
    const fields = {};
    const errors = Array.isArray(error.errors) ? error.errors : [];
    for (const item of [...errors, ...(error.field ? [{ field: error.field, message: error.message }] : [])]) {
      const path = inputField(item.field);
      if (FIELDS.some(field => field.path === path) && typeof item.message === "string") fields[path] = item.message;
    }
    const issues = errors.filter(item => typeof item.message === "string" && !Object.hasOwn(fields, inputField(item.field))).map(item => ({ field: item.field, message: item.message }));
    return { status: "rejected", message: error.message, fields, issues };
  }
  if ([401, 403, 404].includes(error?.status)) return { status: "denied", message: error.status === 404 ? "La finca no está disponible para esta sesión o no tenés permiso para usarla." : error.message, fields: {} };
  return { status: "uncertain", message: UNCERTAIN_MESSAGE, fields: {} };
}

// Un único intento por proveedor de sesión. Ningún timer, retry o persistencia.
export function createSubmissionController({ enabled, send, isCurrent, onChange, now = () => Date.now() }) {
  let state = { status: "idle", attempt: null, snapshot: null, message: "", fields: {} }, sequence = 0, disposed = false;
  const current = () => !disposed && isCurrent();
  const publish = next => { state = next; if (current()) onChange(state); };
  return {
    getState: () => state,
    locked: () => ["pending", "uncertain"].includes(state.status),
    reset() {
      if (state.status === "pending") return false;
      sequence++; publish({ status: "idle", attempt: null, snapshot: null, message: "", fields: {} }); return true;
    },
    authorizeRepeat() {
      if (!current() || state.status !== "uncertain") return false;
      publish({ ...state, status: "ready", message: "Autorizaste preparar otro envío. Puede duplicar una simulación ya guardada. No se envió nada todavía." }); return true;
    },
    clearField(path) {
      if (state.status !== "rejected" || !Object.hasOwn(state.fields, path)) return;
      const fields = { ...state.fields }; delete fields[path]; publish({ ...state, fields });
    },
    dispose() { disposed = true; sequence++; state = { status: "idle", attempt: null, snapshot: null, message: "", fields: {} }; },
    async submit(fincaId, values, resolutions) {
      if (!current() || !enabled || ["pending", "uncertain", "confirmed"].includes(state.status)) return false;
      const built = buildV2Payload(values, resolutions);
      if (!built.ok) { publish({ ...state, status: "rejected", message: "Revisá los datos indicados antes de enviar.", fields: built.errors }); return false; }
      const request = ++sequence, attempt = freeze({ fincaId: String(fincaId), payload: copy(built.payload), startedAt: now() });
      publish({ status: "pending", attempt, snapshot: null, message: "Procesando el envío a la API simulada...", fields: {}, issues: [] });
      try {
        const response = await send(fincaId, attempt.payload);
        if (!current() || request !== sequence) return false;
        if (!verifiedCreation(response, attempt)) { publish({ ...state, status: "uncertain", message: UNCERTAIN_MESSAGE }); return false; }
        publish({ ...state, status: "confirmed", snapshot: freeze(copy(response)), message: "Guardado confirmado por la API simulada." });
        return true;
      } catch (error) {
        if (current() && request === sequence) publish({ ...state, ...submissionError(error) });
        return false;
      }
    },
  };
}
