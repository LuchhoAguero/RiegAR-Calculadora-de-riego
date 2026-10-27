import { FIELDS } from "./irrigationV2Form.js";
import { METRICS, RULE_IDS, RULE_VERSION, record, jsonData, matchesShape, isSimulationIdentity, valueAt } from "./irrigationV2Results.js";
import metadataShape from "./irrigationV1MetadataShape.json" with { type: "json" };

export const V1_CONTRACT = "irrigation-contract-v1";
export const V1_MODEL = "irrigation-estimation-v1";
export const V1_SOURCE = "42592487e6e07deb1b25a073d74086a09c1bb19cb38411aafc31d28ea64d2127";
// Definiciones compartidas, nunca conversión de inputs o snapshots entre versiones.
export const V1_INPUT_FIELDS = FIELDS.filter(field => !["name", "furrow.furrowCount"].includes(field.path)).map(field => field.path === "furrow.furrowSpacingM" ? { ...field, path: "furrow.widthM", label: "Ancho del surco (contrato V1)" } : field);
export const V1_METRICS = METRICS.filter(metric => !metric.nullable && !metric.path.startsWith("totals.") && metric.path !== "waterNeed.dailyCropWaterUseMmPerDay");

export function inspectV1Snapshot(snapshot) {
  const invalid = { status: "invalid", code: "INVALID_SNAPSHOT" };
  try {
    if (!record(snapshot) || !jsonData(snapshot) || !record(snapshot.model) || typeof snapshot.model.contractVersion !== "string") return invalid;
    if (snapshot.model.contractVersion !== V1_CONTRACT) return { status: "unsupported", code: "UNSUPPORTED_CONTRACT" };
    const { model, simulation, input, output, metadata } = snapshot;
    if (model.modelVersion !== V1_MODEL || model.sourceHash !== V1_SOURCE || !isSimulationIdentity(simulation) || !record(input) || !record(output)) return invalid;
    for (const field of V1_INPUT_FIELDS) {
      const value = valueAt(input, field.path);
      if (field.type === "text") {
        if (value !== null && value !== undefined && (typeof value !== "string" || !value || value.trim() !== value || [...value].length > field.maxLength)) return invalid;
      } else if (typeof value !== "number" || !Number.isFinite(value) || (field.exclusiveMin ? value <= field.min : value < field.min) || (field.max !== undefined && value > field.max)) return invalid;
    }
    for (const group of ["crop", "soil", "furrow", "irrigation"]) if (!record(input[group]) || Object.keys(input[group]).some(key => !V1_INPUT_FIELDS.some(field => field.path === `${group}.${key}`))) return invalid;
    if (Object.keys(input).some(group => !["crop", "soil", "furrow", "irrigation"].includes(group)) || input.soil.fieldCapacityPct <= input.soil.wiltingPointPct || input.irrigation.advanceTimeMin > input.irrigation.durationMin) return invalid;
    for (const metric of V1_METRICS) {
      const value = valueAt(output, metric.path);
      if (typeof value !== "number" || !Number.isFinite(value) || (metric.positive ? value <= metric.min : value < metric.min) || (metric.max !== undefined && value > metric.max)) return invalid;
    }
    const groups = [...new Set(V1_METRICS.map(metric => metric.path.split(".")[0]))];
    if (Object.keys(output).some(group => !groups.includes(group))) return invalid;
    for (const group of groups) if (!record(output[group]) || Object.keys(output[group]).some(key => !V1_METRICS.some(metric => metric.path === `${group}.${key}`) && !(group === "diagnostics" && key === "items"))) return invalid;
    if (output.application.estimatedUsefulVolumeL > output.application.appliedVolumeL || !matchesShape(metadata, metadataShape) || metadata.metadataSchemaVersion !== "irrigation-metadata-v1" || metadata.implementationReference.modelVersion !== V1_MODEL || metadata.diagnosticRules.ruleVersion !== RULE_VERSION || metadata.diagnosticRules.evaluated.join(",") !== RULE_IDS.join(",")) return invalid;
    for (const metric of V1_METRICS) if (valueAt(metadata.units.output, metric.path) !== (metric.canonicalUnit || metric.unit)) return invalid;
    for (const field of V1_INPUT_FIELDS.filter(field => field.type === "number")) if (valueAt(metadata.units.input, field.path) !== field.unit.replace("³", "3")) return invalid;
    const items = output.diagnostics.items;
    if (!Array.isArray(items)) return invalid;
    for (const item of items) if (!record(item) || !RULE_IDS.includes(item.id) || item.ruleVersion !== RULE_VERSION || !["info", "warning"].includes(item.severity) || !Array.isArray(item.fields) || item.fields.some(field => typeof field !== "string" || !field.trim()) || !record(item.evidence) || (item.message !== undefined && typeof item.message !== "string") || Object.keys(item).some(key => !["id", "ruleVersion", "severity", "fields", "evidence", "message"].includes(key))) return invalid;
    return { status: "supported" };
  } catch { return invalid; }
}
