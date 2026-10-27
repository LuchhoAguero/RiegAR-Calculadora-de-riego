import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { createIrrigationSimulation, getIrrigationSimulationHistory, getIrrigationSimulationDetail, isValidResourceId, ApiError } from "../src/services/apiService.js";
import { SESSION_INVALIDATED } from "../src/context/session.js";

const originalFetch = globalThis.fetch;
let storage, calls, invalidations;
beforeEach(() => {
  storage = new Map([["token", "synthetic-current"]]); calls = []; invalidations = 0;
  globalThis.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) };
  globalThis.window = new EventTarget(); window.addEventListener(SESSION_INVALIDATED, () => invalidations++);
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ ok: true }); };
});
after(() => { globalThis.fetch = originalFetch; delete globalThis.localStorage; delete globalThis.window; });
const collection = "http://localhost:4000/api/fincas/7/irrigation-simulations";
const payload = {
  name: "Referencia V1",
  crop: { etoMmPerDay: 5, cropCoefficient: .7, daysWithoutIrrigation: 20 },
  soil: { texture: "Franco", fieldCapacityPct: 20, wiltingPointPct: 10, bulkDensityGcm3: 1.3, rootDepthM: .7, depletionThresholdPct: 60 },
  furrow: { widthM: 1.3, lengthM: 60, slopePct: 0 },
  irrigation: { flowLps: .9, durationMin: 120, advanceTimeMin: 20 },
};
test("POST V1: ruta, payload plano sin mutaciones ni versión del cliente", async () => {
  const before = structuredClone(payload);
  assert.deepEqual(await createIrrigationSimulation(7, payload), { ok: true });
  assert.equal(calls.length, 1); const {url, options} = calls[0];
  assert.equal(url, collection); assert.equal(options.method, "POST");
  assert.equal(options.headers.Authorization, "Bearer synthetic-current"); assert.equal(options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(options.body), before); assert.deepEqual(payload, before);
  assert.equal(options.signal, undefined);
});
test("HISTORY sin opciones deja el default de limit al servidor", async () => {
  await getIrrigationSimulationHistory("7"); assert.equal(calls[0].url, collection); assert.equal(calls[0].options.method, "GET"); assert.equal(calls[0].options.body, undefined);
  assert.equal(calls[0].options.headers.Authorization, "Bearer synthetic-current");
});
test("HISTORY transporta cursor opaco exactamente y sin peticiones DETAIL", async () => {
  const cursor = " opaco+/=&?%_ñ ";
  await getIrrigationSimulationHistory(7, { limit: 2, cursor });
  const url = new URL(calls[0].url); assert.equal(url.searchParams.get("cursor"), cursor); assert.equal(url.searchParams.get("limit"), "2"); assert.equal(calls.length, 1);
});
for (const cursor of [undefined, null]) test(`HISTORY cursor ${cursor}: primera página sin token`, async () => {
  await getIrrigationSimulationHistory(7, { cursor }); assert.equal(calls[0].url, collection);
});
test("DETAIL conserva ruta con dos identificadores", async () => {
  await getIrrigationSimulationDetail(7, "8"); assert.equal(calls[0].url, collection + "/8"); assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.headers.Authorization, "Bearer synthetic-current");
});
for (const value of [1, "1", 4294967295, "4294967295"]) test(`ID canónico válido ${value}`, () => assert.equal(isValidResourceId(value), true));
for (const value of [0, -1, 4294967296, "01", "1.0", "1e2", "7\n", "7/8", " 7", null, {}, NaN]) test(`ID inválido ${String(value)} no hace HTTP`, async () => {
  assert.equal(isValidResourceId(value), false);
  await assert.rejects(getIrrigationSimulationHistory(value), { code: "INVALID_ROUTE_PARAMETER", field: "fincaId", status: null }); assert.equal(calls.length, 0);
});
test("simulationId inválido no hace HTTP", async () => {
  await assert.rejects(getIrrigationSimulationDetail(7, "x"), { code: "INVALID_ROUTE_PARAMETER", field: "simulationId" }); assert.equal(calls.length, 0);
});
for (const limit of [0, 101, 1.5, "2", null]) test(`Limit inválido ${limit} no hace HTTP`, async () => {
  await assert.rejects(getIrrigationSimulationHistory(7, { limit }), { code: "INVALID_PAGINATION", field: "limit" }); assert.equal(calls.length, 0);
});
test("Cursor objeto se rechaza, no se reconstruye", async () => {
  await assert.rejects(getIrrigationSimulationHistory(7, { cursor: { id: 1 } }), { code: "INVALID_PAGINATION", field: "cursor" }); assert.equal(calls.length, 0);
});
for (const status of [400, 401, 403, 404, 409, 415, 422, 500, 503]) test(`Simulaciones HTTP ${status}: conserva ApiError estructurado, un intento`, async () => {
  const body = { error: status >= 500 ? "Ocurrió un error en el servidor." : "Solicitud rechazada.", code: "TEST_CODE", field: "furrow.widthM", errors: [{ code: "INVALID_TYPE", field: "furrow.widthM", category: "INPUT", message: "Debe ser un número.", stack: "privado" }] };
  globalThis.fetch = async () => { calls.push(1); return Response.json(body, { status }); };
  await assert.rejects(createIrrigationSimulation(7, payload), e => e instanceof ApiError && e.status === status && e.code === body.code && e.errors[0].field === body.field && !JSON.stringify(e).includes("privado")); assert.equal(calls.length, 1);
});
for (const [status, message, clear] of [[401, "Acceso denegado: No se proporcionó token.", true], [403, "Token inválido o expirado.", true], [403, "No tienes permiso.", false], [404, "Recurso no encontrado o no tienes permiso.", false]]) test(`Auth ${status} ${message}`, async () => {
  globalThis.fetch = async () => Response.json({ error: message }, { status });
  await assert.rejects(getIrrigationSimulationDetail(7, 8)); assert.equal(storage.has("token"), !clear); assert.equal(invalidations, clear ? 1 : 0);
});
test("Respuesta vieja 401 no invalida otra sesión", async () => {
  globalThis.fetch = async () => { storage.set("token", "synthetic-new"); return Response.json({ error: "Acceso denegado." }, { status: 401 }); };
  await assert.rejects(getIrrigationSimulationHistory(7)); assert.equal(storage.get("token"), "synthetic-new"); assert.equal(invalidations, 0);
});
test("POST con fallo de red conserva incertidumbre y no reintenta", async () => {
  globalThis.fetch = async () => { calls.push(1); throw new Error("privado"); };
  await assert.rejects(createIrrigationSimulation(7, payload), { code: "NETWORK_ERROR", status: null }); assert.equal(calls.length, 1);
});
test("POST 201 con respuesta ilegible no confirma fallo de guardado ni reintenta", async () => {
  globalThis.fetch = async () => { calls.push(1); return new Response("<html>privado</html>", { status: 201 }); };
  await assert.rejects(createIrrigationSimulation(7, payload), { code: "INVALID_RESPONSE", status: 201 }); assert.equal(calls.length, 1);
});
for (const version of ["v1", "v2"]) test(`DETAIL ${version}: conserva contrato, null y números del snapshot`, async () => {
  const snapshot = { simulation: { id: 8, fincaId: 7, name: null, createdAt: "2026-10-27T12:00:00.000Z" }, model: { contractVersion: `irrigation-contract-${version}`, modelVersion: `irrigation-estimation-${version}`, sourceHash: "a".repeat(64) }, input: { furrow: version === "v1" ? { widthM: 1.3 } : { furrowSpacingM: 1.3, furrowCount: 18 } }, output: { soilWater: { daysUntilAvailableWaterExhaustion: null }, application: { infiltratedDepthStartMm: 49.29503017546495 } }, metadata: { evidenceState: { calibration: "none" } } };
  globalThis.fetch = async () => Response.json(snapshot);
  assert.deepEqual(await getIrrigationSimulationDetail(7,8), snapshot);
});
test("HISTORY mixto preserva resumen y paginación sin completar valores V2 en V1", async () => {
  const history = { items: [{ model: { contractVersion: "irrigation-contract-v1" }, summary: { appliedVolumeL: 6480 } }, { model: { contractVersion: "irrigation-contract-v2" }, summary: { appliedVolumeL: 6480, furrowCount: 18, totalAppliedVolumeL: 116640 } }], pagination: { limit: 2, hasMore: true, nextCursor: "cursor-opaco" } };
  globalThis.fetch = async () => { calls.push(1); return Response.json(history); };
  const result = await getIrrigationSimulationHistory(7, { limit: 2 }); assert.deepEqual(result, history); assert.equal(Object.hasOwn(result.items[0].summary, "furrowCount"), false); assert.equal(calls.length, 1);
});
