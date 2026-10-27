import { ApiError } from "../services/apiService.js";
import { V1_CONTRACT, V1_MODEL, V1_SOURCE } from "./irrigationV1Results.js";
import { V2_CONTRACT, V2_MODEL, V2_SOURCE, record, jsonData, isSimulationIdentity } from "./irrigationV2Results.js";

export const HISTORY_LIMIT = 20;
export const contractLabel = version => version === V1_CONTRACT ? "V1" : version === V2_CONTRACT ? "V2" : "Versión no soportada";
export function validateHistoryPage(page, fincaId) {
  const fail = () => { throw new ApiError("El historial recibido está incompleto o contiene datos inválidos. Volvé a consultar.", { code: "INVALID_HISTORY_RESPONSE" }); };
  try {
    if (!record(page) || !jsonData(page) || !Array.isArray(page.items) || !record(page.pagination)) return fail();
    const { limit, hasMore, nextCursor } = page.pagination;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || page.items.length > limit || typeof hasMore !== "boolean" ||
      (hasMore ? typeof nextCursor !== "string" || !nextCursor.length || !page.items.length : nextCursor !== null)) return fail();
    for (const item of page.items) {
      if (!record(item) || !isSimulationIdentity(item.simulation) || String(item.simulation.fincaId) !== String(fincaId) || !record(item.model) || !record(item.summary) ||
        !["contractVersion", "modelVersion", "sourceHash"].every(key => typeof item.model[key] === "string" && item.model[key].trim())) return fail();
      const { contractVersion, modelVersion, sourceHash } = item.model;
      if (![V1_CONTRACT, V2_CONTRACT].includes(contractVersion)) continue; // No interpretar métricas de otro contrato.
      if (modelVersion !== (contractVersion === V1_CONTRACT ? V1_MODEL : V2_MODEL) || sourceHash !== (contractVersion === V1_CONTRACT ? V1_SOURCE : V2_SOURCE)) return fail();
      const summary = item.summary;
      for (const [key, min, positive, max] of [["targetDepthMm", 0], ["appliedVolumeL", 0, true], ["applicationEfficiencyPct", 0, false, 100]]) {
        const value = summary[key];
        if (typeof value !== "number" || !Number.isFinite(value) || (positive ? value <= min : value < min) || (max !== undefined && value > max)) return fail();
      }
      const d = summary.diagnostics;
      if (!record(d) || !Number.isSafeInteger(d.count) || d.count < 0 || !Array.isArray(d.severities) || d.severities.some(s => !["info", "warning"].includes(s)) || new Set(d.severities).size !== d.severities.length || (d.count === 0 ? d.severities.length !== 0 : !d.severities.length || d.severities.length > d.count)) return fail();
      if (contractVersion === V2_CONTRACT && (!Number.isSafeInteger(summary.furrowCount) || summary.furrowCount < 1 || typeof summary.totalAppliedVolumeL !== "number" || summary.totalAppliedVolumeL <= 0)) return fail();
      if (contractVersion === V1_CONTRACT && (Object.hasOwn(summary, "furrowCount") || Object.hasOwn(summary, "totalAppliedVolumeL"))) return fail();
    }
    return page;
  } catch (error) { if (error instanceof ApiError) throw error; return fail(); }
}
export function appendHistory(previous, incoming) {
  const seen = new Set(previous.map(item => item.simulation.id));
  const result = [...previous];
  for (const item of incoming) if (!seen.has(item.simulation.id)) { seen.add(item.simulation.id); result.push(item); }
  return result;
}
export function readErrorMessage(error) {
  if (error.status === 404) return "El recurso no está disponible para esta sesión o no tenés permiso para consultarlo.";
  if (error.code === "NETWORK_ERROR") return "No se pudo conectar con el servidor. Volvé a consultar cuando tengas conexión.";
  return error.message;
}
