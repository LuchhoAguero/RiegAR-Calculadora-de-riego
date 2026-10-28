import test from "node:test";
import assert from "node:assert/strict";
import { build } from "vite";
import { fileURLToPath } from "node:url";
import fixtures from "../src/fixtures/irrigation-v2-results.json" with { type: "json" };
import { FIELDS } from "../src/utils/irrigationV2Form.js";
import { SIMULATION_MOCK_ORIGIN, isSimulationSandbox } from "../src/utils/irrigationAvailability.js";
import { createSubmissionController, compareSubmissionInputs, submissionError, UNCERTAIN_MESSAGE } from "../src/utils/irrigationSubmission.js";
import { createIrrigationSimulation as unconfiguredCreation } from "../src/services/apiService.js";
const clone = value => structuredClone(value), snapshot = () => clone(fixtures[0].snapshot);
const valueAt = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);
const values = () => Object.fromEntries(FIELDS.map(field => [field.path, String(field.path === "name" ? snapshot().simulation.name : valueAt(snapshot().input, field.path))]));
const env = { DEV: true, PROD: false, VITE_RIEGAR_V2_MOCK: "true", VITE_API_URL: SIMULATION_MOCK_ORIGIN };
function fixture({ enabled = true, send = async () => snapshot() } = {}) {
  let current = true; const changes = [], calls = [];
  const controller = createSubmissionController({ enabled, send: async (...args) => { calls.push(args); return send(...args); }, isCurrent: () => current, onChange: state => changes.push(state), now: () => 42 });
  return { controller, calls, changes, endSession: () => { current = false; } };
}
for (const [name, configured, expected] of [
  ["sin configuración", undefined, false], ["DEV normal", { DEV: true }, false], ["sandbox exacto", env, true],
  ["PROD con flag simulado", { ...env, DEV: false, PROD: true }, false], ["PROD prevalece", { ...env, PROD: true }, false],
  ["API real local", { ...env, VITE_API_URL: "http://localhost:4000" }, false], ["otro destino", { ...env, VITE_API_URL: "https://api.example.invalid" }, false],
  ["flag falso", { ...env, VITE_RIEGAR_V2_MOCK: "false" }, false],
]) test(`H disponibilidad: ${name}`, () => assert.equal(isSimulationSandbox(configured), expected));

test("H captura el payload V2 contractual, un intento y snapshot inmutable", async () => {
  const f = fixture(), raw = values(); await f.controller.submit("7", raw, {});
  assert.equal(f.calls.length, 1); assert.deepEqual(f.calls[0], ["7", { ...snapshot().input, name: snapshot().simulation.name }]);
  assert.equal(f.controller.getState().status, "confirmed"); assert.equal(f.controller.getState().attempt.startedAt, 42);
  assert.ok(Object.isFrozen(f.controller.getState().snapshot.input.furrow)); assert.deepEqual(f.controller.getState().snapshot, snapshot());
  assert.deepEqual(Object.keys(f.calls[0][1]).sort(), ["crop", "furrow", "irrigation", "name", "soil"]);
});
test("H deshabilitado y sesión terminada no realizan solicitudes", async () => {
  const disabled = fixture({ enabled: false }); await disabled.controller.submit("7", values(), {}); assert.equal(disabled.calls.length, 0);
  const old = fixture(); old.endSession(); await old.controller.submit("7", values(), {}); assert.equal(old.calls.length, 0);
});
test("H valida todos los campos y ambigüedad antes de enviar", async () => {
  const f = fixture(), raw = values(); raw["furrow.furrowSpacingM"] = "1.300";
  await f.controller.submit("7", raw, {}); assert.equal(f.calls.length, 0); assert.ok(f.controller.getState().fields["furrow.furrowSpacingM"]);
  await f.controller.submit("7", raw, { "furrow.furrowSpacingM": { raw: "1.300", kind: "decimal" } }); assert.equal(f.calls.length, 1); assert.equal(f.controller.getState().status, "confirmed");
});
test("H doble clic, cambio de finca y reset no crean envíos concurrentes", async () => {
  let release; const f = fixture({ send: () => new Promise(resolve => { release = resolve; }) }), raw = values();
  const first = f.controller.submit("7", raw, {}); assert.equal(f.controller.getState().status, "pending"); assert.equal(f.controller.locked(), true);
  raw["furrow.furrowCount"] = "999"; await f.controller.submit("8", raw, {}); assert.equal(f.controller.reset(), false); assert.equal(f.calls.length, 1); assert.equal(f.calls[0][1].furrow.furrowCount, 18);
  release(snapshot()); await first; await f.controller.submit("7", values(), {}); assert.equal(f.calls.length, 1);
});
for (const [name, mutate] of [
  ["contrato V1", s => { s.model.contractVersion = "irrigation-contract-v1"; }],
  ["finca distinta", s => { s.simulation.fincaId = 8; }], ["ID inválido", s => { s.simulation.id = "1"; }],
  ["metadata incompleta", s => { delete s.metadata; }], ["hash distinto", s => { s.model.sourceHash = "a".repeat(64); }],
  ["input distinto", s => { s.input.furrow.furrowCount = 19; }], ["nombre distinto", s => { s.simulation.name = "Otro"; }],
  ["sobre vacío", () => ({})],
]) test(`H 201 no verificable: ${name}, sin confirmar ni repetir`, async () => {
  const f = fixture({ send: async () => { const s = snapshot(); return mutate(s) || s; } });
  await f.controller.submit("7", values(), {}); assert.equal(f.controller.getState().status, "uncertain"); assert.equal(f.controller.getState().snapshot, null);
  await f.controller.submit("7", values(), {}); assert.equal(f.calls.length, 1); assert.equal(f.controller.getState().message, UNCERTAIN_MESSAGE);
});
for (const error of [
  { code: "NETWORK_ERROR" }, { code: "INVALID_RESPONSE", status: 201 }, { code: "INVALID_RESPONSE", status: 400 },
  { status: 500, code: "INTERNAL_ERROR" }, { status: 503 }, { status: 400, code: "UNEXPECTED_PROXY" }, { status: 422 }, {},
]) test(`H resultado incierto ${error.code || error.status || "desconocido"} no reintenta`, async () => {
  const f = fixture({ send: async () => { throw error; } }); await f.controller.submit("7", values(), {});
  assert.equal(f.controller.getState().status, "uncertain"); assert.equal(f.controller.getState().message, UNCERTAIN_MESSAGE); assert.equal(f.calls.length, 1);
});
for (const status of [400, 422]) test(`H ${status} mantiene errores corregibles y su campo`, async () => {
  const error = { status, code: status === 400 ? "INVALID_IRRIGATION_INPUT" : "IRRIGATION_MODEL_INCONSISTENCY", message: "Datos rechazados.", errors: [{ field: "furrow.furrowCount", message: "Revisá la cantidad." }, { field: "output.foo", message: "No es un campo UX." }] };
  const f = fixture({ send: async () => { throw error; } }); const raw = values(); await f.controller.submit("7", raw, {});
  assert.equal(f.controller.getState().status, "rejected"); assert.deepEqual(f.controller.getState().fields, { "furrow.furrowCount": "Revisá la cantidad." });
  assert.deepEqual(raw, values()); f.controller.clearField("furrow.furrowCount"); assert.deepEqual(f.controller.getState().fields, {});
});
for (const status of [401, 403, 404]) test(`H ${status} no equivale a error de red ni revela ownership`, async () => {
  const f = fixture({ send: async () => { throw { status, message: "Acceso rechazado." }; } }); await f.controller.submit("7", values(), {});
  assert.equal(f.controller.getState().status, "denied"); assert.equal(f.calls.length, 1); if (status === 404) assert.match(f.controller.getState().message, /no está disponible/);
});
test("H autorización de repetición es explícita, no envía por sí sola", async () => {
  const f = fixture({ send: async () => { throw { status: 500 }; } }); await f.controller.submit("7", values(), {});
  assert.equal(f.controller.authorizeRepeat(), true); assert.equal(f.calls.length, 1); assert.equal(f.controller.getState().status, "ready"); assert.match(f.controller.getState().message, /duplicar/);
  await f.controller.submit("7", values(), {}); assert.equal(f.calls.length, 2);
});
for (const exit of ["sesión", "dispose"]) test(`H respuesta atrasada tras ${exit} no actualiza estado`, async () => {
  let release; const f = fixture({ send: () => new Promise(resolve => { release = resolve; }) }); const pending = f.controller.submit("7", values(), {});
  const count = f.changes.length; if (exit === "sesión") f.endSession(); else f.controller.dispose(); release(snapshot()); await pending; assert.equal(f.changes.length, count);
});
test("H reconciliación compara los 17 campos, no nombre o summary", async () => {
  const f = fixture(); await f.controller.submit("7", values(), {}); const attempt = f.controller.getState().attempt;
  const rows = compareSubmissionInputs(attempt, snapshot()); assert.equal(rows.length, 17); assert.ok(rows.every(row => row.matches));
  const changed = snapshot(); changed.input.irrigation.advanceTimeMin = 19; assert.ok(compareSubmissionInputs(attempt, changed).some(row => !row.matches));
  assert.equal(compareSubmissionInputs(attempt, { simulation: snapshot().simulation, model: snapshot().model, summary: {} }), null);
});
test("H nombre y textura opcionales se comparan con null canónico", async () => {
  const raw = values(); raw.name = ""; raw["soil.texture"] = " ";
  const f = fixture({ send: async () => { const s = snapshot(); s.simulation.name = null; s.input.soil.texture = null; return s; } });
  await f.controller.submit("7", raw, {}); assert.equal(f.controller.getState().status, "confirmed"); assert.equal(Object.hasOwn(f.calls[0][1], "name"), false); assert.equal(Object.hasOwn(f.calls[0][1].soil, "texture"), false);
});
test("H 400 field directo conserva ruta, nunca usa campos inventados", () => {
  assert.deepEqual(submissionError({ status: 400, code: "INVALID_REQUEST", field: "body.crop.etoMmPerDay", message: "Revisá ETo." }).fields, { "crop.etoMmPerDay": "Revisá ETo." });
  assert.deepEqual(submissionError({ status: 400, code: "INVALID_IRRIGATION_INPUT", errors: [{ field: "input.furrow.furrowCount", message: "Revisá la cantidad." }] }).fields, { "furrow.furrowCount": "Revisá la cantidad." });
  assert.deepEqual(submissionError({ status: 422, code: "IRRIGATION_MODEL_INCONSISTENCY", field: "diagnostics", message: "Error del modelo." }).fields, {});
});
test("H error estructurado incompleto no interrumpe el manejo de rechazo", () => {
  assert.deepEqual(submissionError({ status: 400, code: "INVALID_REQUEST", message: "Solicitud rechazada.", errors: {} }).fields, {});
  assert.deepEqual(submissionError({ status: 422, code: "IRRIGATION_MODEL_INCONSISTENCY", message: "Error del modelo.", errors: [{ field: "output.application", message: "Resultado inconsistente." }] }).issues, [{ field: "output.application", message: "Resultado inconsistente." }]);
});
test("H servicio compilado para producción bloquea POST incluso con flag mock y URL de prueba", async () => {
  const productionEnv = { ...env, DEV: false, PROD: true };
  const result = await build({ configFile: false, root: fileURLToPath(new URL("../", import.meta.url)), logLevel: "silent", define: Object.fromEntries(Object.entries(productionEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])), build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL("../src/services/apiService.js", import.meta.url)), formats: ["es"] } } });
  const code = (Array.isArray(result) ? result[0] : result).output.find(file => file.type === "chunk").code;
  assert.ok(code.includes(SIMULATION_MOCK_ORIGIN)); assert.match(code, /VITE_RIEGAR_V2_MOCK[^\n]+true/);
  const compiled = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  const original = globalThis.fetch; let writes = 0; globalThis.fetch = async () => { writes++; throw new Error("No debe ejecutar fetch"); };
  try { await assert.rejects(compiled.createIrrigationSimulation("7", { ...snapshot().input }), { code: "SIMULATION_CREATION_DISABLED" }); assert.equal(writes, 0); } finally { globalThis.fetch = original; }
});
test("H importación sin entorno Vite también bloquea antes de leer sesión o llamar fetch", async () => {
  await assert.rejects(unconfiguredCreation("7", { ...snapshot().input }), { code: "SIMULATION_CREATION_DISABLED" });
});
