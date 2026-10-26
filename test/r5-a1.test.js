import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import * as api from "../src/services/apiService.js";
import { isTokenCurrent, tokenExpiresAt, invalidateSession, SESSION_INVALIDATED } from "../src/context/session.js";
import { geometries, manningQ } from "../src/utils/manning.js";

const originalFetch = globalThis.fetch;
let storage, events;
beforeEach(() => {
  storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  globalThis.window = new EventTarget();
  events = 0;
  window.addEventListener(SESSION_INVALIDATED, () => events++);
});
after(() => { globalThis.fetch = originalFetch; delete globalThis.localStorage; delete globalThis.window; });
const jwt = payload => `e30.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

for (const status of [400, 401, 403, 404, 409, 422, 500, 503]) {
  test(`HTTP ${status}: conserva status, código, campo y errores públicos`, async () => {
    const details = [{ code: "INVALID_TYPE", field: "furrow.widthM", category: "INPUT", message: "Debe ser un número.", stack: "privado" }];
    globalThis.fetch = async () => Response.json({ error: "Solicitud rechazada.", code: "TEST_CODE", field: "furrow.widthM", errors: details, sql: "privado", stack: "privado" }, { status });
    await assert.rejects(api.getFincas(), error => {
      assert.ok(error instanceof api.ApiError);
      assert.equal(error.status, status);
      assert.equal(error.code, "TEST_CODE");
      assert.equal(error.field, "furrow.widthM");
      assert.deepEqual(error.errors, [{ code: "INVALID_TYPE", category: "INPUT", field: "furrow.widthM", message: "Debe ser un número." }]);
      assert.equal(error.sql, undefined);
      assert.equal(error.message.includes("privado"), false);
      return true;
    });
  });
}

test("éxito JSON conserva shape histórico", async () => {
  const body = [{ id: 7, nombre_finca: "Ensayo" }];
  globalThis.fetch = async () => Response.json(body);
  assert.deepEqual(await api.getFincas(), body);
});
test("204 vacío es éxito sin SyntaxError", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api.deleteFinca(7), null);
});
test("error vacío conserva status", async () => {
  globalThis.fetch = async () => new Response(null, { status: 404 });
  await assert.rejects(api.getFincas(), { status: 404, message: "Ocurrió un error en el servidor." });
});
for (const status of [200, 403, 500]) {
  test(`no JSON ${status}: no muestra HTML ni pierde status`, async () => {
    globalThis.fetch = async () => new Response("<html>SQL privado</html>", { status });
    await assert.rejects(api.getFincas(), error => error.status === status && error.code === "INVALID_RESPONSE" && !error.message.includes("SQL"));
  });
}
test("lectura de respuesta interrumpida conserva HTTP y no repite POST", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { status: 201, ok: true, text: async () => { throw new Error("privado"); } }; };
  await assert.rejects(api.createFinca({ nombre_finca: "Ensayo" }), { status: 201, code: "INVALID_RESPONSE" });
  assert.equal(calls, 1);
});
test("red incierta: error estable, sin detalles internos ni retry", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("credencial privada"); };
  await assert.rejects(api.saveCalculo(7, {}), error => error.status === null && error.code === "NETWORK_ERROR" && !error.message.includes("privada"));
  assert.equal(calls, 1);
});
test("rechazo 409 de finca conserva el contrato", async () => {
  globalThis.fetch = async () => Response.json({ error: "La finca posee simulaciones de riego guardadas y no puede eliminarse.", code: "FARM_HAS_IRRIGATION_SIMULATIONS" }, { status: 409 });
  await assert.rejects(api.deleteFinca(7), { status: 409, code: "FARM_HAS_IRRIGATION_SIMULATIONS", message: "La finca posee simulaciones de riego guardadas y no puede eliminarse." });
});
test("mensajes internos se sustituyen sin copiar SQL ni stack", async () => {
  globalThis.fetch = async () => Response.json({ error: "SQL select secreto from users", stack: "privado" }, { status: 400 });
  await assert.rejects(api.getFincas(), { message: "Ocurrió un error en el servidor." });
});
test("preserva el mensaje público contractual 503", async () => {
  const error = "La simulación no pudo completarse con estos datos.";
  globalThis.fetch = async () => Response.json({ error, code: "IRRIGATION_MODEL_UNAVAILABLE" }, { status: 503 });
  await assert.rejects(api.getFincas(), { status: 503, error, message: error, code: "IRRIGATION_MODEL_UNAVAILABLE" });
});
test("el nombre del campo password no se confunde con una credencial", async () => {
  globalThis.fetch = async () => Response.json({ error: "Campo inválido.", field: "password", errors: [{ field: "password", code: "REQUIRED" }] }, { status: 400 });
  await assert.rejects(api.registerUser({}), error => error.field === "password" && error.errors[0].field === "password");
});

for (const [name, args, method, path, data] of [
  ["registerUser", [{ nombre: "Ensayo" }], "POST", "/api/register", { nombre: "Ensayo" }],
  ["loginUser", [{ email: "test@example.invalid" }], "POST", "/api/login", { email: "test@example.invalid" }],
  ["getFincas", [], "GET", "/api/fincas"],
  ["createFinca", [{ nombre_finca: "Ensayo" }], "POST", "/api/fincas", { nombre_finca: "Ensayo" }],
  ["updateFinca", [7, { ubicacion: "Prueba" }], "PUT", "/api/fincas/7", { ubicacion: "Prueba" }],
  ["deleteFinca", [7], "DELETE", "/api/fincas/7"],
  ["getCalculosByFinca", [7], "GET", "/api/fincas/7/calculos"],
  ["saveCalculo", [7, { b: 1, h: 0.5 }], "POST", "/api/fincas/7/calculos", { b: 1, h: 0.5 }],
  ["updateCalculo", [8, { nombre: "Histórico" }], "PUT", "/api/calculos/8", { nombre: "Histórico" }],
  ["deleteCalculo", [8], "DELETE", "/api/calculos/8"],
  ["sendContactMessage", [{ message: "Prueba" }], "POST", "/api/contact", { message: "Prueba" }],
]) {
  test(`${name}: preserva URL, método, payload y autorización`, async () => {
    storage.set("token", "test-token");
    globalThis.fetch = async (url, options) => {
      assert.equal(url, `http://localhost:4000${path}`);
      assert.equal(options.method, method);
      assert.equal(options.body, data === undefined ? undefined : JSON.stringify(data));
      assert.equal(options.headers.Authorization, ["registerUser", "loginUser", "sendContactMessage"].includes(name) ? undefined : "Bearer test-token");
      return Response.json({ ok: true });
    };
    assert.deepEqual(await api[name](...args), { ok: true });
  });
}
for (const status of [401, 403]) {
  test(`rechazo autenticado ${status} invalida sesión actual`, async () => {
    storage.set("token", "actual");
    globalThis.fetch = async () => Response.json({ error: "Token inválido o expirado." }, { status });
    await assert.rejects(api.getFincas());
    assert.equal(storage.has("token"), false);
    assert.equal(events, 1);
  });
}
test("403 de permisos no cierra sesión", async () => {
  storage.set("token", "actual");
  globalThis.fetch = async () => Response.json({ error: "No tienes permiso." }, { status: 403 });
  await assert.rejects(api.getFincas());
  assert.equal(storage.get("token"), "actual");
});
test("401 de login público no elimina otra sesión", async () => {
  storage.set("token", "actual");
  globalThis.fetch = async () => Response.json({ error: "Credenciales inválidas." }, { status: 401 });
  await assert.rejects(api.loginUser({}));
  assert.equal(storage.get("token"), "actual");
});
test("respuesta vieja no cierra login nuevo", async () => {
  storage.set("token", "viejo");
  globalThis.fetch = async () => { storage.set("token", "nuevo"); return Response.json({ error: "Token inválido o expirado." }, { status: 403 }); };
  await assert.rejects(api.getFincas());
  assert.equal(storage.get("token"), "nuevo");
  assert.equal(events, 0);
});
test("invalidación sin token no afecta almacenamiento", () => {
  storage.set("token", "actual"); invalidateSession(null); assert.equal(storage.get("token"), "actual");
});
test("JWT vigente y vencimiento exacto", () => {
  assert.equal(tokenExpiresAt(jwt({ exp: 100 })), 100000);
  assert.equal(isTokenCurrent(jwt({ exp: 100 }), 99999), true);
  assert.equal(isTokenCurrent(jwt({ exp: 100 }), 100000), false);
});
for (const [name, value] of [["ausente", null], ["malformado", "abc"], ["JSON inválido", "e30.@@.sig"], ["sin exp", jwt({})], ["exp texto", jwt({ exp: "100" })]]) {
  test(`JWT ${name}: sesión inactiva`, () => assert.equal(isTokenCurrent(value, 0), false));
}
for (const [shape, expected] of [["rectangular", 0.5228961337882106], ["triangular", 0.20751146821137745], ["trapezoidal", 0.9065749945753862]]) {
  test(`regresión numérica Manning ${shape}`, () => {
    const geometry = geometries[shape]({ b: 1, h: 0.5, z: 1 });
    assert.ok(Math.abs(manningQ({ ...geometry, n: 0.012, S: 0.001 }) - expected) < 1e-12);
  });
}
