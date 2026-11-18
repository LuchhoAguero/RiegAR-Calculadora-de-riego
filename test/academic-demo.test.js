import test from "node:test";
import assert from "node:assert/strict";
import { academicReference, createAcademicDemoDraft } from "../src/utils/academicDemo.js";
import { FIELDS, buildV2Payload } from "../src/utils/irrigationV2Form.js";
import { isSimulationSandbox, SIMULATION_MOCK_ORIGIN } from "../src/utils/irrigationAvailability.js";
import { build } from "vite";
import { fileURLToPath } from "node:url";

test("Demo académica precarga exactamente el INPUT_CONTRACT del fixture oficial", () => {
  const draft = createAcademicDemoDraft();
  assert.equal(draft.fincaId, "demo");
  assert.equal(draft.step, 0);
  assert.equal(draft.reached, 0);
  assert.equal(Object.keys(draft.values).length, 17);
  assert.deepEqual(Object.keys(draft.values).sort(), FIELDS.map(field => field.path).sort());
  const result = buildV2Payload(draft.values, draft.resolutions);
  assert.equal(result.ok, true);
  assert.deepEqual(result.payload, { ...academicReference.snapshot.input, name: academicReference.snapshot.simulation.name });
});

test("Demo: editar y restablecer borradores no modifica el fixture ni otros borradores", () => {
  const serialized = JSON.stringify(academicReference);
  const first = createAcademicDemoDraft(), second = createAcademicDemoDraft();
  first.values["crop.etoMmPerDay"] = "9";
  first.step = 3;
  assert.equal(first.initialValues["crop.etoMmPerDay"], "5");
  assert.equal(second.values["crop.etoMmPerDay"], "5");
  assert.deepEqual(createAcademicDemoDraft(), second);
  assert.equal(JSON.stringify(academicReference), serialized);
});

test("Demo: el modo staging y flags forzadas no habilitan el escritor en una build pública", () => {
  const env = { MODE: "staging", DEV: true, PROD: true, VITE_RIEGAR_V2_MOCK: "true", VITE_API_URL: SIMULATION_MOCK_ORIGIN };
  assert.equal(isSimulationSandbox(env, true), false);
  assert.equal(isSimulationSandbox({ ...env, PROD: false }, false), false);
});

test("Demo: servicio compilado staging rechaza antes de fetch incluso con flags DEV inesperadas", async () => {
  const result = await build({
    configFile: false, mode: "staging", logLevel: "silent",
    define: { __RIEGAR_DEV_SERVER__: "false", "import.meta.env": JSON.stringify({ MODE: "staging", DEV: true, PROD: false, VITE_RIEGAR_V2_MOCK: "true", VITE_API_URL: SIMULATION_MOCK_ORIGIN }) },
    build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL("../src/services/apiService.js", import.meta.url)), formats: ["es"] } },
  });
  const code = (Array.isArray(result) ? result[0] : result).output.find(file => file.type === "chunk").code;
  const compiled = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  const previous = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("No debe ejecutar fetch"); };
  try {
    await assert.rejects(compiled.createIrrigationSimulation("7", academicReference.snapshot.input), { code: "SIMULATION_CREATION_DISABLED" });
    assert.equal(calls, 0);
  } finally { globalThis.fetch = previous; }
});
