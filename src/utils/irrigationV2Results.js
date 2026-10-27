// Frontera de presentación: contrato persistido V2, sin fórmulas ni transporte.
import { FIELDS } from "./irrigationV2Form.js";
import metadataShape from "./irrigationV2MetadataShape.json" with { type: "json" };

export const V2_CONTRACT = "irrigation-contract-v2";
export const V2_MODEL = "irrigation-estimation-v2";
export const V2_SOURCE = "30b031d7bd3aa4365c65b6750a91a4004db4ef3452c99bf3924698b89f9dec3b";
export const RULE_VERSION = "irrigation-diagnostics-v1";
export const RULE_IDS = ["P01", "P02", "P03", "P04", "P05"];
export const METRICS = [
  { path: "waterNeed.targetDepthMm", label: "Lámina objetivo", unit: "mm", min: 0 },
  { path: "waterNeed.dailyCropWaterUseMmPerDay", label: "Consumo diario del cultivo", unit: "mm/día", min: 0 },
  { path: "soilWater.availableWaterMm", label: "Agua útil disponible", unit: "mm", min: 0, positive: true },
  { path: "soilWater.availableCapacityL", label: "Capacidad disponible por surco", unit: "L", min: 0, positive: true },
  { path: "soilWater.maxRecommendedDepthMm", label: "Lámina máxima según umbral", unit: "mm", min: 0, positive: true },
  { path: "soilWater.maxRecommendedVolumeL", label: "Volumen máximo según umbral por surco", unit: "L", min: 0, positive: true },
  { path: "soilWater.daysUntilAvailableWaterExhaustion", label: "Duración teórica de la reserva útil", unit: "días", min: 0, positive: true, nullable: true },
  { path: "soilWater.daysUntilDepletionThreshold", label: "Plazo teórico hasta el umbral", unit: "días", min: 0, positive: true, nullable: true },
  { path: "application.appliedVolumeL", label: "Volumen aplicado por surco", unit: "L", min: 0, positive: true },
  { path: "application.infiltratedDepthStartMm", label: "Infiltración estimada al inicio", unit: "mm", min: 0 },
  { path: "application.infiltratedDepthMiddleMm", label: "Infiltración estimada en la mitad", unit: "mm", min: 0 },
  { path: "application.infiltratedDepthEndMm", label: "Infiltración estimada al final", unit: "mm", min: 0 },
  { path: "application.estimatedUsefulVolumeL", label: "Volumen útil estimado por surco", unit: "L", min: 0 },
  { path: "application.residualLossVolumeL", label: "Pérdidas estimadas por surco", unit: "L", min: 0 },
  { path: "totals.totalAppliedVolumeL", label: "Volumen total aplicado", unit: "L", min: 0, positive: true },
  { path: "totals.totalAppliedVolumeM3", label: "Volumen total aplicado", unit: "m³", canonicalUnit: "m3", min: 0, positive: true },
  { path: "efficiency.applicationEfficiencyPct", label: "Eficiencia estimada de aplicación", unit: "%", min: 0, max: 100 },
  { path: "diagnostics.advanceRatioPct", label: "Relación de avance", unit: "%", min: 0, max: 100 },
  { path: "diagnostics.maxNonErosiveFlowLps", label: "Caudal máximo no erosivo estimado", unit: "L/s", min: 0, positive: true },
];
export const valueAt = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);
export const record = value => value !== null && typeof value === "object" && [Object.prototype, null].includes(Object.getPrototypeOf(value));
export function jsonData(value, ancestors = new Set()) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return true;
  if (typeof value === "number") return Number.isFinite(value);
  if ((!record(value) && !Array.isArray(value)) || ancestors.has(value)) return false;
  if (Array.isArray(value) && (Object.keys(value).length !== value.length || Object.keys(value).some((key, index) => key !== String(index)))) return false;
  ancestors.add(value);
  const keys = Reflect.ownKeys(value).filter(key => !(Array.isArray(value) && key === "length"));
  const valid = keys.every(key => typeof key === "string" && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), "value") && jsonData(value[key], ancestors));
  ancestors.delete(value); return valid;
}
const finite = value => typeof value === "number" && Number.isFinite(value);
export function matchesShape(value, shape) {
  if (typeof shape === "string") return shape === "null" ? value === null : typeof value === shape;
  if (Array.isArray(shape)) return Array.isArray(value) && value.length === shape.length && shape.every((item, index) => matchesShape(value[index], item));
  return record(value) && Object.entries(shape).every(([key, child]) => Object.hasOwn(value, key) && matchesShape(value[key], child));
}
const invalid = (code = "INVALID_SNAPSHOT", fatalItems) => ({ status: "invalid", code, ...(fatalItems ? { fatalItems } : {}) });
export function isSimulationIdentity(simulation) {
  return record(simulation) && [simulation.id, simulation.fincaId].every(id => Number.isInteger(id) && id > 0 && id <= 4294967295) &&
    (simulation.name === null || (typeof simulation.name === "string" && simulation.name.trim() && [...simulation.name].length <= 255)) &&
    typeof simulation.createdAt === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(simulation.createdAt) &&
    Number.isFinite(Date.parse(simulation.createdAt)) && Number(simulation.createdAt.slice(0, 4)) >= 1000 && new Date(simulation.createdAt).toISOString() === simulation.createdAt;
}

export function inspectV2Snapshot(snapshot) {
  try {
    if (!record(snapshot) || !jsonData(snapshot) || !record(snapshot.model) || typeof snapshot.model.contractVersion !== "string") return invalid();
    if (snapshot.model.contractVersion !== V2_CONTRACT) return { status: "unsupported", code: "UNSUPPORTED_CONTRACT" };
    const { model, simulation, input, output, metadata } = snapshot;
    if (model.modelVersion !== V2_MODEL || model.sourceHash !== V2_SOURCE || !record(simulation) || !record(input) || !record(output) || !record(metadata)) return invalid();
    if (!isSimulationIdentity(simulation)) return invalid();
    const fields = FIELDS.filter(field => field.path !== "name");
    for (const field of fields) {
      const value = valueAt(input, field.path);
      if (field.type === "text") {
        if (value !== null && value !== undefined && (typeof value !== "string" || value.trim() !== value || !value || [...value].length > field.maxLength)) return invalid();
      } else if (!finite(value) || (field.exclusiveMin ? value <= field.min : value < field.min) ||
        (field.max !== undefined && value > field.max) || (field.integer && !Number.isSafeInteger(value))) return invalid();
    }
    for (const group of ["crop", "soil", "furrow", "irrigation"]) {
      if (!record(input[group]) || Object.keys(input[group]).some(key => !fields.some(field => field.path === `${group}.${key}`))) return invalid();
    }
    if (Object.keys(input).some(group => !["crop", "soil", "furrow", "irrigation"].includes(group)) ||
      input.soil.fieldCapacityPct <= input.soil.wiltingPointPct || input.irrigation.advanceTimeMin > input.irrigation.durationMin) return invalid();
    for (const metric of METRICS) {
      const value = valueAt(output, metric.path);
      if (value === null && metric.nullable) continue;
      if (!finite(value) || (metric.positive ? value <= metric.min : value < metric.min) || (metric.max !== undefined && value > metric.max)) return invalid();
    }
    const groups = [...new Set(METRICS.map(metric => metric.path.split(".")[0]))];
    if (Object.keys(output).some(group => !groups.includes(group))) return invalid();
    for (const group of groups) if (!record(output[group]) || Object.keys(output[group]).some(key => !METRICS.some(metric => metric.path === `${group}.${key}`) && !(group === "diagnostics" && key === "items"))) return invalid();
    const daily = output.waterNeed.dailyCropWaterUseMmPerDay;
    for (const metric of METRICS.filter(metric => metric.nullable)) if ((daily === 0) !== (valueAt(output, metric.path) === null)) return invalid();
    if ((input.crop.etoMmPerDay === 0 || input.crop.cropCoefficient === 0) ? daily !== 0 : daily === 0) return invalid();
    if (output.application.estimatedUsefulVolumeL > output.application.appliedVolumeL) return invalid();
    const sections = ["effectiveParameters", "units", "assumptions", "evidenceState", "referenceVersions", "implementationReference", "diagnosticRules", "parameterProvenance"];
    if (!matchesShape(metadata, metadataShape) || metadata.metadataSchemaVersion !== "irrigation-metadata-v2" || sections.some(key => !record(metadata[key])) ||
      metadata.implementationReference.modelVersion !== V2_MODEL || metadata.diagnosticRules.ruleVersion !== RULE_VERSION ||
      !Array.isArray(metadata.diagnosticRules.evaluated) || metadata.diagnosticRules.evaluated.join(",") !== RULE_IDS.join(",") ||
      metadata.assumptions.daysReferenceState !== "field_capacity_reference") return invalid("INVALID_METADATA");
    for (const metric of METRICS) if (valueAt(metadata.units.output, metric.path) !== (metric.canonicalUnit || metric.unit)) return invalid("INVALID_UNITS");
    for (const field of fields.filter(field => field.type === "number")) if (valueAt(metadata.units.input, field.path) !== field.unit.replace("³", "3")) return invalid("INVALID_UNITS");
    const items = output.diagnostics.items;
    if (!Array.isArray(items)) return invalid("INVALID_DIAGNOSTICS");
    for (const item of items) if (!record(item) || !RULE_IDS.includes(item.id) || item.ruleVersion !== RULE_VERSION ||
      !["info", "warning", "error"].includes(item.severity) || !Array.isArray(item.fields) || item.fields.some(field => typeof field !== "string" || !field.trim()) ||
      !record(item.evidence) || (item.message !== undefined && typeof item.message !== "string") || Object.keys(item).some(key => !["id", "ruleVersion", "severity", "fields", "evidence", "message"].includes(key))) return invalid("INVALID_DIAGNOSTICS");
    const fatal = items.filter(item => item.severity === "error");
    if (fatal.length) return invalid("FATAL_DIAGNOSTIC", fatal);
    return { status: "supported" };
  } catch { return invalid(); }
}

export function formatResult(value) {
  if (value === null) return { text: "No aplica", full: "No aplica", approximate: false };
  if (!finite(value)) throw new TypeError("Se requiere una magnitud finita del snapshot.");
  const number = Object.is(value, -0) ? 0 : value;
  const scientific = number !== 0 && (Math.abs(number) < 1e-6 || Math.abs(number) >= 1e21);
  const options = { useGrouping: true, ...(scientific ? { notation: "scientific" } : {}) };
  const full = new Intl.NumberFormat("es-AR", { ...options, maximumSignificantDigits: 21 }).format(number);
  let text = new Intl.NumberFormat("es-AR", { ...options, ...(scientific ? { maximumSignificantDigits: 6 } : { maximumFractionDigits: 2 }) }).format(number);
  if (number !== 0 && (text === "0" || text === "-0")) text = new Intl.NumberFormat("es-AR", { maximumSignificantDigits: 6 }).format(number);
  return { text, full, approximate: text !== full };
}
