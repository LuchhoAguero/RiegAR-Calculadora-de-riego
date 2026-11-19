import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { build } from "vite";
import { fileURLToPath } from "node:url";
import { ACADEMIC_API_ORIGIN, ACADEMIC_APP_ORIGIN, isRealSimulationEnvironment } from "../src/utils/irrigationAvailability.js";
import { V2_CONTRACT, V2_MODEL, V2_SOURCE } from "../src/utils/irrigationV2Results.js";
import { createSubmissionController } from "../src/utils/irrigationSubmission.js";
import fixtures from "../src/fixtures/irrigation-v2-results.json" with { type: "json" };
import { createAcademicDemoDraft } from "../src/utils/academicDemo.js";

const env = { MODE: "staging", PROD: true, DEV: false, VITE_RIEGAR_REAL_V2: "true", VITE_RIEGAR_V2_MOCK: "false", VITE_API_URL: ACADEMIC_API_ORIGIN };
const previous = { fetch: globalThis.fetch, location: globalThis.location, window: globalThis.window, localStorage: globalThis.localStorage };
globalThis.location = { origin: ACADEMIC_APP_ORIGIN };
const built = await build({ configFile: false, mode: "staging", logLevel: "silent", define: { ...Object.fromEntries(Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])), __RIEGAR_DEV_SERVER__: "false" },
  build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL("../src/services/apiService.js", import.meta.url)), formats: ["es"] } } });
const code = (Array.isArray(built) ? built[0] : built).output.find(file => file.type === "chunk").code;
const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const token = userId => `e30.${Buffer.from(JSON.stringify({ userId, exp: Date.now() / 1000 + 3600 })).toString("base64url")}.offline_signature`;
const capability = () => ({ contractVersion: V2_CONTRACT, modelVersion: V2_MODEL, sourceHash: V2_SOURCE, creationEnabled: true, frontendOrigin: ACADEMIC_APP_ORIGIN });
const snapshot = () => structuredClone(fixtures.find(item => item.id === "golden").snapshot);
let storage, calls, currentToken;
beforeEach(() => {
  currentToken = token(1); storage = new Map([["token", currentToken]]); calls = [];
  globalThis.location = { origin: ACADEMIC_APP_ORIGIN };
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, removeItem: key => storage.delete(key) };
  globalThis.window = new EventTarget();
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json(options.method === "GET" ? capability() : snapshot(), { status: options.method === "GET" ? 200 : 201 });
  };
});
after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } });

test("REAL opt-in exige modo, build, bandera y ambos orígenes exactos", () => {
  assert.equal(isRealSimulationEnvironment(env, ACADEMIC_APP_ORIGIN), true);
  for (const changes of [{ MODE: "production" }, { PROD: false }, { DEV: true }, { VITE_RIEGAR_REAL_V2: undefined }, { VITE_RIEGAR_REAL_V2: "True" }, { VITE_RIEGAR_V2_MOCK: "true" }, { VITE_API_URL: ACADEMIC_API_ORIGIN + "/" }, { VITE_API_URL: "https://foreign.invalid" }]) {
    assert.equal(isRealSimulationEnvironment({ ...env, ...changes }, ACADEMIC_APP_ORIGIN), false);
  }
  for (const origin of [undefined, "http://localhost:5173", ACADEMIC_APP_ORIGIN + "/", "https://foreign.invalid"]) assert.equal(isRealSimulationEnvironment(env, origin ?? ""), false);
});

test("REAL ningún POST sin capacidad autenticada emitida por este cliente", async () => {
  for (const permit of [undefined, capability(), {}, "true"]) await assert.rejects(api.createIrrigationSimulation(7, snapshot().input, permit), { code: "SIMULATION_CREATION_DISABLED" });
  assert.equal(calls.length, 0);
});

test("REAL capacidad válida: GET autenticado y un único POST contractual sin selector de versión", async () => {
  const permit = await api.getIrrigationCreationCapability(currentToken);
  const payload = { ...snapshot().input, name: "Escenario propio" }, before = structuredClone(payload);
  await api.createIrrigationSimulation(7, payload, permit);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(call => call.options.method), ["GET", "POST"]);
  assert.equal(calls[0].url, ACADEMIC_API_ORIGIN + "/api/capabilities/irrigation");
  assert.equal(calls[1].url, ACADEMIC_API_ORIGIN + "/api/fincas/7/irrigation-simulations");
  assert.equal(calls[1].options.headers.Authorization, "Bearer " + currentToken);
  assert.equal(calls[0].options.redirect, "error"); assert.equal(calls[1].options.redirect, "error");
  assert.deepEqual(JSON.parse(calls[1].options.body), before); assert.deepEqual(payload, before);
  await assert.rejects(api.createIrrigationSimulation(7, payload, permit), { code: "SIMULATION_CREATION_DISABLED" });
  assert.equal(calls.length, 2, "La capacidad es de un solo uso");
});

for (const [field, value] of [["creationEnabled", false], ["creationEnabled", "true"], ["contractVersion", "irrigation-contract-v1"], ["modelVersion", "other"], ["sourceHash", "wrong"], ["frontendOrigin", "https://foreign.invalid"], ["frontendOrigin", undefined]]) {
  test(`REAL discrepancia ${field}=${value} impide POST`, async () => {
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ ...capability(), [field]: value }); };
    await assert.rejects(api.getIrrigationCreationCapability(currentToken), { code: "SIMULATION_CAPABILITY_MISMATCH", phase: "capability" });
    assert.equal(calls.length, 1); assert.equal(calls[0].options.method, "GET");
  });
}

test("REAL respuesta de capacidad atrasada tras cambio de sesión se descarta", async () => {
  let resolve; globalThis.fetch = async () => new Promise(done => { resolve = done; });
  const waiting = api.getIrrigationCreationCapability(currentToken);
  const next = token(2); storage.set("token", next); resolve(Response.json(capability()));
  await assert.rejects(waiting, { code: "SIMULATION_CREATION_DISABLED", phase: "capability" });
  assert.equal(storage.get("token"), next);
});

test("REAL logout, cambio de origen o vencimiento de capacidad impiden POST antes de fetch", async () => {
  const permit = await api.getIrrigationCreationCapability(currentToken);
  storage.delete("token");
  await assert.rejects(api.createIrrigationSimulation(7, snapshot().input, permit), { code: "SIMULATION_CREATION_DISABLED" });
  storage.set("token", currentToken); globalThis.location.origin = "https://foreign.invalid";
  await assert.rejects(api.createIrrigationSimulation(7, snapshot().input, permit), { code: "SIMULATION_CREATION_DISABLED" });
  globalThis.location.origin = ACADEMIC_APP_ORIGIN;
  const now = Date.now; Date.now = () => now() + 60001;
  try { await assert.rejects(api.createIrrigationSimulation(7, snapshot().input, permit), { code: "SIMULATION_CREATION_DISABLED" }); } finally { Date.now = now; }
  assert.equal(calls.length, 1);
});

test("REAL 401 en capacidad invalida únicamente la sesión actual, sin POST", async () => {
  globalThis.fetch = async () => Response.json({ error: "Acceso denegado.", code: "AUTH_REQUIRED" }, { status: 401 });
  await assert.rejects(api.getIrrigationCreationCapability(currentToken), { status: 401, code: "AUTH_REQUIRED", phase: "capability" });
  assert.equal(storage.get("token"), undefined);
});

for (const failure of ["200", "500", "network", "invalid-json"]) test(`REAL POST ${failure}: un intento, capacidad consumida y ningún retry`, async () => {
  const permit = await api.getIrrigationCreationCapability(currentToken);
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (failure === "network") throw Error("offline network");
    if (failure === "invalid-json") return new Response("incompleto", { status: 201 });
    return Response.json({ error: "Ocurrió un error en el servidor." }, { status: Number(failure) });
  };
  await assert.rejects(api.createIrrigationSimulation(7, snapshot().input, permit));
  await assert.rejects(api.createIrrigationSimulation(7, snapshot().input, permit), { code: "SIMULATION_CREATION_DISABLED" });
  assert.equal(calls.filter(call => call.options.method === "POST").length, 1);
});

test("REAL un fallo de capacidad acredita ausencia de POST, no un guardado incierto", async () => {
  const controller = createSubmissionController({ enabled: true, real: true, isCurrent: () => true, onChange: () => {}, send: async () => { throw { code: "NETWORK_ERROR", phase: "capability" }; } });
  const draft = createAcademicDemoDraft(); await controller.submit(7, draft.values, draft.resolutions);
  assert.equal(controller.getState().status, "denied"); assert.match(controller.getState().message, /No se envió/);
});

test("REAL confirmación usa snapshot verificado y textos de servicio real", async () => {
  const controller = createSubmissionController({ enabled: true, real: true, isCurrent: () => true, onChange: () => {}, send: async () => snapshot() });
  const draft = createAcademicDemoDraft(); await controller.submit(7, draft.values, draft.resolutions);
  assert.equal(controller.getState().status, "confirmed");
  assert.match(controller.getState().message, /HTTP 201/); assert.doesNotMatch(controller.getState().message, /simulada/);
});
