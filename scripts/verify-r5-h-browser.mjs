// Preparación H1/H2: Edge + API V2 simulada. Bloquea cualquier destino ajeno.
// DEV sandbox 4175: VITE_RIEGAR_V2_MOCK=true VITE_API_URL=https://riegar-v2.invalid
// DEV normal 4174 y preview de producción 4173. Sin backend/API/DB reales.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import fixtures from "../src/fixtures/irrigation-v2-results.json" with { type: "json" };
import { STEPS } from "../src/utils/irrigationV2Form.js";
import { UNCERTAIN_MESSAGE } from "../src/utils/irrigationSubmission.js";
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const sandbox = "http://127.0.0.1:4175", mock = "https://riegar-v2.invalid", output = process.env.R5H_SCREENSHOTS;
if (output) await mkdir(output, { recursive: true });
const clone = value => structuredClone(value), golden = fixtures[0].snapshot;
const token = (seconds = 3600, userId = 1) => `e30.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + seconds, userId })).toString("base64url")}.signature`;
let passed = 0, failed = 0; const results = [], measurements = [], contrasts = [];
const input = (page, path) => page.locator(`input[name="${path}"]`);
const posts = state => state.calls.filter(call => call.method === "POST");
const details = state => state.calls.filter(call => /irrigation-simulations\/\d+$/.test(call.path));
const visible = locator => locator.waitFor({ state: "visible" });
const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
function summary(s) { return { simulation: clone(s.simulation), model: clone(s.model), summary: { targetDepthMm: s.output.waterNeed.targetDepthMm, appliedVolumeL: s.output.application.appliedVolumeL, applicationEfficiencyPct: s.output.efficiency.applicationEfficiencyPct, diagnostics: { count: s.output.diagnostics.items.length, severities: [...new Set(s.output.diagnostics.items.map(item => item.severity))] }, furrowCount: s.input.furrow.furrowCount, totalAppliedVolumeL: s.output.totals.totalAppliedVolumeL } }; }
async function fixture({ width = 1280, origin = sandbox, mode = "success", readFailure = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 768 });
  await context.addInitScript(value => localStorage.setItem("token", value), token());
  if (readFailure) await context.addInitScript(() => { const original = window.fetch; window.fetch = async (...args) => { const response = await original(...args); if (String(args[0]).includes("riegar-v2.invalid") && args[1]?.method === "POST") return { ok: response.ok, status: response.status, text: async () => { throw new Error("Interrupción sintética de lectura"); } }; return response; }; });
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  const state = { calls: [], errors: [], outside: [], stored: [], nextId: 301, mode, gate: null, persist: true, fincas: [{ id: 7, nombre_finca: "Finca de ensayo", ubicacion: "Mendoza" }, { id: 8, nombre_finca: "Otra finca", ubicacion: "San Juan" }] };
  page.on("pageerror", error => state.errors.push(error.message)); page.on("dialog", dialog => dialog.accept());
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin) return route.continue();
    if (url.origin !== mock) { state.outside.push({ origin: url.origin, method: request.method() }); return route.abort(); }
    const method = request.method(), data = request.postData() ? JSON.parse(request.postData()) : null;
    state.calls.push({ method, path: url.pathname, query: url.search, data });
    const reply = (value, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(value) });
    if (method === "GET" && url.pathname === "/api/fincas") return reply(clone(state.fincas));
    const match = url.pathname.match(/^\/api\/fincas\/(\d+)\/irrigation-simulations(?:\/(\d+))?$/);
    assert.ok(match, "Solo endpoints contractuales"); const farm = Number(match[1]), id = match[2];
    if (method === "GET") {
      if (id) return state.stored.find(s => s.simulation.id === Number(id) && s.simulation.fincaId === farm) ? reply(clone(state.stored.find(s => s.simulation.id === Number(id)))) : reply({ error: "Recurso no encontrado o no tienes permiso.", code: "RESOURCE_NOT_FOUND" }, 404);
      return reply({ items: state.stored.filter(s => s.simulation.fincaId === farm).map(summary), pagination: { limit: 20, hasMore: false, nextCursor: null } });
    }
    assert.equal(method, "POST", "Nunca DELETE, PUT o PATCH"); const mode = state.mode, gate = state.gate;
    if (gate) await gate;
    if (["400", "422"].includes(mode)) return reply({ error: "La simulación no pudo completarse con estos datos.", code: mode === "400" ? "INVALID_IRRIGATION_INPUT" : "IRRIGATION_MODEL_INCONSISTENCY", errors: [{ code: mode === "400" ? "OUT_OF_RANGE" : "MODEL_INCONSISTENCY", field: mode === "400" ? "input.furrow.furrowCount" : "output.application", message: mode === "400" ? "Revisá la cantidad de surcos." : "El modelo no pudo producir un resultado consistente." }] }, Number(mode));
    if (["401", "token403", "403", "404"].includes(mode)) return reply({ error: mode === "401" ? "Acceso denegado: No se proporcionó token." : mode === "token403" ? "Token inválido o expirado." : mode === "403" ? "No tenés permiso para crear esta simulación." : "Recurso no encontrado o no tienes permiso.", ...(mode === "404" ? { code: "RESOURCE_NOT_FOUND" } : {}) }, mode === "token403" ? 403 : Number(mode));
    const s = clone(golden); s.simulation = { id: state.nextId++, fincaId: farm, name: data.name ?? null, createdAt: "2026-10-27T18:00:00.000Z" }; s.input = { crop: data.crop, soil: { texture: null, ...data.soil }, furrow: data.furrow, irrigation: data.irrigation };
    if (state.persist) state.stored.unshift(clone(s));
    if (mode === "network") return route.abort("failed");
    if (mode === "500") return reply({ error: "Ocurrió un error en el servidor.", code: "INTERNAL_ERROR" }, 500);
    if (mode === "unknown400") return reply({ error: "Respuesta sintética no contractual.", code: "UNEXPECTED_PROXY" }, 400);
    if (mode === "html") return route.fulfill({ status: 201, contentType: "text/html", body: "<html>Respuesta sintética ilegible</html>" });
    if (mode === "incomplete") delete s.metadata;
    if (mode === "v1") s.model.contractVersion = "irrigation-contract-v1";
    if (mode === "wrong-farm") s.simulation.fincaId = 8;
    if (mode === "mismatch") s.input.furrow.furrowCount++;
    return reply(s, mode === "200" ? 200 : 201);
  });
  return { context, page, state, origin };
}
async function scenario(name, options, check) {
  if (process.env.R5H_FILTER && !name.includes(process.env.R5H_FILTER)) return;
  const f = await fixture(options);
  try { await check(f); assert.deepEqual(f.state.errors, []); assert.deepEqual(f.state.outside, []); passed++; results.push({ name, result: "PASS", simulatedPosts: posts(f.state).length }); console.log("PASS " + name); }
  catch (error) { failed++; results.push({ name, result: "FAIL", error: error.message }); console.error(`FAIL ${name} [${f.page.url()}]: ${error.message}`); }
  finally { await f.context.close(); }
}
async function shot(page, name) {
  if (!output) return; await page.evaluate(() => { scrollTo(0, 0); return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: !name.includes("dialogo"), animations: "disabled" });
  measurements.push({ name, ...await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth })) });
}
async function checkContrast(locator, label) {
  const colors = await locator.evaluate(el => { const style = getComputedStyle(el); return [style.color, style.backgroundColor].map(value => value.match(/[\d.]+/g).map(Number)); });
  assert.equal(colors[1][3] ?? 1, 1);
  const luminance = rgb => { const c = rgb.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return c[0] * .2126 + c[1] * .7152 + c[2] * .0722; };
  const [lo, hi] = colors.map(luminance).sort((a, b) => a - b), ratio = (hi + .05) / (lo + .05); assert.ok(ratio >= 4.5); contrasts.push({ label, ratio: +ratio.toFixed(2) });
}
async function open(page, farm = 7) { await page.goto(sandbox + `/fincas/${farm}/simulaciones/nueva`); await visible(page.getByRole("heading", { name: "Cultivo", exact: true })); await visible(page.getByText("Ensayo con API simulada. No se guardan datos reales.", { exact: true })); }
async function review(page) {
  for (const step of STEPS.slice(0, 4)) {
    for (const field of step.fields) { const value = field.path.split(".").reduce((value, key) => value[key], golden.input); await input(page, field.path).fill(String(value)); }
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
  }
  await visible(page.getByRole("heading", { name: "Revisión", exact: true })); await input(page, "name").fill(golden.simulation.name);
}
const save = page => page.getByRole("button", { name: "Calcular y guardar", exact: true }).click();
const uncertain = page => visible(page.getByRole("alert").filter({ hasText: UNCERTAIN_MESSAGE }));
async function waitPosts(state, count = 1) { for (let i = 0; i < 200 && posts(state).length < count; i++) await new Promise(resolve => setTimeout(resolve, 10)); assert.equal(posts(state).length, count); }
async function history(page) { await page.getByRole("link", { name: "Revisar el historial de esta finca", exact: true }).click(); await visible(page.getByRole("dialog", { name: "¿Salir de la preparación local?", exact: true })); await page.getByRole("button", { name: "Salir y conservar", exact: true }).click(); await page.waitForURL(sandbox + "/fincas/7#historial-simulaciones"); }
async function candidate(page) { await page.locator('[data-simulation="301"] a').click(); await page.waitForURL(sandbox + "/fincas/7/simulaciones/301"); await visible(page.getByRole("heading", { name: "Comparación con el intento incierto", exact: true })); }
async function newSession(page) { await page.evaluate(value => { localStorage.setItem("token", value); dispatchEvent(new StorageEvent("storage", { key: "token" })); }, token(7200, 2)); }

try {
  for (const origin of ["http://127.0.0.1:4173", "http://127.0.0.1:4174"]) await scenario(`Bloqueo de creación fuera de sandbox ${origin.slice(-4)}`, { origin }, async ({ page, state }) => {
    await page.goto(origin + "/fincas/7/simulaciones/nueva");
    if (origin.endsWith("4173")) { await visible(page.getByRole("heading", { name: "Simulación en preparación", exact: true })); await shot(page, "produccion-bloqueada-1280"); }
    else {
      await page.goto(origin); const result = await page.evaluate(async payload => { const api = await import("/src/services/apiService.js"); try { await api.createIrrigationSimulation("7", payload); } catch (error) { return error.code; } }, golden.input);
      assert.equal(result, "SIMULATION_CREATION_DISABLED");
    }
    assert.equal(posts(state).length, 0);
  });
  await scenario("201 válido: payload exacto, sin modal de salida, borrador limpio y DETAIL", {}, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await page.waitForURL(sandbox + "/fincas/7/simulaciones/301");
    await visible(page.getByRole("article", { name: "Resultados de riego por surcos V2", exact: true })); await visible(page.getByRole("note").filter({ hasText: "API simulada: los registros de esta vista son de prueba." })); assert.equal(await page.getByRole("dialog").count(), 0);
    assert.deepEqual(posts(state)[0].data, { ...golden.input, name: golden.simulation.name }); assert.equal(posts(state).length, 1); assert.equal(details(state).length, 1);
    await page.getByRole("link", { name: "Volver al historial de la finca", exact: true }).click(); await visible(page.locator('[data-simulation="301"]')); assert.equal(details(state).length, 1);
    await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click(); await visible(input(page, "crop.etoMmPerDay")); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), ""); assert.equal(posts(state).length, 1);
  });
  await scenario("Doble activación y datos congelados mientras procesa", {}, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; }); await open(page); await review(page);
    await page.getByRole("button", { name: "Calcular y guardar", exact: true }).evaluate(el => { el.click(); el.click(); }); await waitPosts(state);
    await visible(page.getByRole("region", { name: "Envío en proceso", exact: true })); assert.equal(await input(page, "name").isDisabled(), true); assert.equal(await page.getByRole("button", { name: "Paso 1 de 5: Cultivo", exact: true }).isDisabled(), true);
    release(); await page.waitForURL(sandbox + "/fincas/7/simulaciones/301"); assert.equal(posts(state).length, 1);
  });
  for (const mode of ["v1", "incomplete", "wrong-farm", "mismatch", "500", "network", "html", "200", "unknown400"]) await scenario(`Respuesta ${mode}: guardado incierto, nunca reenvío`, { mode }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await uncertain(page); assert.equal(posts(state).length, 1); assert.equal(await page.getByRole("button", { name: "Calcular y guardar", exact: true }).isDisabled(), true); assert.equal(await input(page, "name").isDisabled(), true);
    assert.equal(await page.getByRole("heading", { name: "Resultados del escenario", exact: true }).count(), 0); await noOverflow(page);
  });
  await scenario("Interrupción de lectura tras 201 con posible persistencia", { readFailure: true }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await uncertain(page); assert.equal(state.stored.length, 1); assert.equal(posts(state).length, 1);
  });
  await scenario("Reconciliar HISTORY y DETAIL completos sin deducir identidad", { mode: "html" }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await uncertain(page); await history(page); await visible(page.locator('[data-simulation="301"]')); assert.equal(details(state).length, 0);
    await candidate(page); const comparison = page.locator('[aria-labelledby="submission-comparison-title"]'); await comparison.locator("summary").focus(); await page.keyboard.press("Enter"); await visible(comparison.getByText("Enviado", { exact: true }).first()); assert.equal(await comparison.locator("li").count(), 17); await visible(comparison.getByText(/pueden existir simulaciones legítimas idénticas/)); assert.equal(posts(state).length, 1); assert.equal(details(state).length, 1); await shot(page, "comparacion-completa-1280");
    await comparison.getByRole("link", { name: "Volver al intento incierto", exact: true }).click(); await uncertain(page); assert.equal(posts(state).length, 1);
  });
  await scenario("Historial vacío no demuestra fracaso del intento", { mode: "network", width: 320 }, async ({ page, state }) => {
    state.persist = false; await open(page); await review(page); await save(page); await uncertain(page); await history(page); await visible(page.getByText("Todavía no hay simulaciones de riego guardadas para esta finca.", { exact: true })); await uncertain(page); await noOverflow(page); assert.equal(posts(state).length, 1); await shot(page, "historial-sin-coincidencia-320");
  });
  await scenario("Dos registros idénticos no confirman ni disparan DETAIL por fila", { mode: "500" }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await uncertain(page); const second = clone(state.stored[0]); second.simulation.id = 302; state.stored.unshift(second);
    await history(page); await visible(page.locator('[data-simulation="302"]')); assert.equal(details(state).length, 0); await candidate(page); await visible(page.getByText(/pueden existir simulaciones legítimas idénticas/)); assert.equal(posts(state).length, 1);
  });
  await scenario("Candidato con inputs diferentes no confirma el guardado", { mode: "500" }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await uncertain(page); state.stored[0].input.irrigation.advanceTimeMin = 19; await history(page); await candidate(page); await visible(page.getByText("Los datos completos no coinciden. Este candidato no confirma el guardado del intento.", { exact: true })); assert.equal(posts(state).length, 1);
  });
  await scenario("400 permite corregir campo sin conversión ni reenvío implícito", { mode: "400", width: 320 }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await visible(page.getByRole("region", { name: "Revisá los datos del envío", exact: true }));
    await page.getByRole("button", { name: "Cantidad de surcos: Revisá la cantidad de surcos.", exact: true }).click(); await visible(input(page, "furrow.furrowCount")); assert.equal(await input(page, "furrow.furrowCount").inputValue(), "18"); assert.equal(await input(page, "furrow.furrowCount").getAttribute("aria-invalid"), "true"); await shot(page, "error-contractual-320");
    await input(page, "furrow.furrowCount").fill("19"); assert.equal(await input(page, "furrow.furrowCount").getAttribute("aria-invalid"), "false"); assert.equal(posts(state).length, 1); await noOverflow(page);
  });
  await scenario("422 conserva explicación del modelo y datos, sin diagnóstico inventado", { mode: "422" }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await visible(page.getByText("output.application: El modelo no pudo producir un resultado consistente.", { exact: true })); assert.equal(await input(page, "name").inputValue(), golden.simulation.name); assert.equal(posts(state).length, 1);
  });
  for (const mode of ["401", "token403"]) await scenario(`POST ${mode} invalida sin bloquear logout ni restaurar borrador`, { mode }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await page.waitForURL(sandbox + "/login"); assert.equal(posts(state).length, 1); assert.equal(await page.getByRole("dialog").count(), 0);
  });
  for (const mode of ["403", "404"]) await scenario(`POST ${mode} mantiene mensaje de permisos y no revela ownership`, { mode }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await visible(page.getByRole("region", { name: "No pudimos completar el envío", exact: true })); assert.ok(await page.evaluate(() => Boolean(localStorage.getItem("token")))); assert.equal(posts(state).length, 1);
  });
  for (const mode of ["success", "401"]) await scenario(`Cambio de sesión descarta respuesta atrasada ${mode}`, { mode }, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; }); await open(page); await review(page); await save(page); await waitPosts(state); await newSession(page); await visible(input(page, "crop.etoMmPerDay")); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "");
    const response = page.waitForResponse(r => r.url().includes(mock) && r.request().method() === "POST"); release(); await response; await page.waitForLoadState("networkidle"); assert.ok(page.url().endsWith("/simulaciones/nueva")); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), ""); assert.equal(posts(state).length, 1);
  });
  await scenario("Logout durante POST pendiente no se bloquea ni restaura datos", {}, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; }); await open(page); await review(page); await save(page); await waitPosts(state);
    await page.getByRole("button", { name: "Cerrar Sesión", exact: true }).click(); await page.getByRole("dialog", { name: "¿Cerrar Sesión?", exact: true }).getByRole("button", { name: "Cerrar Sesión", exact: true }).click(); await page.waitForURL(sandbox + "/");
    const response = page.waitForResponse(r => r.url().includes(mock) && r.request().method() === "POST"); release(); await response; await page.waitForLoadState("networkidle"); assert.equal(await page.evaluate(() => localStorage.getItem("token")), null); assert.equal(posts(state).length, 1); assert.equal(await page.getByRole("dialog").count(), 0);
  });
  await scenario("Expiración de sesión durante POST no bloquea ni restaura el intento", {}, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; }); await open(page); await review(page); await save(page); await waitPosts(state);
    await page.evaluate(value => { localStorage.setItem("token", value); dispatchEvent(new StorageEvent("storage", { key: "token" })); }, token(-1)); await page.waitForURL(sandbox + "/login");
    const response = page.waitForResponse(r => r.url().includes(mock) && r.request().method() === "POST"); release(); await response; await page.waitForLoadState("networkidle"); assert.equal(await page.getByRole("dialog").count(), 0); assert.equal(posts(state).length, 1);
  });
  await scenario("Salir durante POST conserva intento, no permite descartarlo como cancelación", {}, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; }); await open(page); await review(page); await save(page); await waitPosts(state);
    await page.getByRole("link", { name: "Detalle de finca", exact: true }).click(); await visible(page.getByRole("dialog", { name: "¿Salir de la preparación local?", exact: true })); assert.equal(await page.getByRole("button", { name: "Descartar y salir", exact: true }).isDisabled(), true); await visible(page.getByText("Salir o descartar datos locales no revierte el POST. El guardado puede completarse aunque abandones esta pantalla.", { exact: true }));
    await page.keyboard.press("Escape"); await page.getByRole("dialog", { name: "¿Salir de la preparación local?", exact: true }).waitFor({ state: "detached" }); await history(page); await visible(page.getByRole("region", { name: "Envío en proceso", exact: true }));
    await page.getByRole("link", { name: "Volver a Mis fincas", exact: true }).click(); await page.getByRole("link", { name: /Otra finca/ }).click(); await page.waitForURL(sandbox + "/fincas/8"); release(); await page.waitForLoadState("networkidle"); assert.equal(await page.getByRole("region", { name: "Guardado confirmado", exact: true }).count(), 0); assert.equal(posts(state).length, 1);
  });
  await scenario("Reemplazo de finca durante POST espera, respuesta no invade otra finca", {}, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; }); await open(page); await review(page); await save(page); await waitPosts(state);
    await page.getByRole("navigation", { name: "Ubicación del asistente", exact: true }).getByRole("link", { name: "Mis fincas", exact: true }).click();
    await visible(page.getByRole("dialog", { name: "¿Salir de la preparación local?", exact: true })); await page.getByRole("button", { name: "Salir y conservar", exact: true }).click();
    await page.getByRole("link", { name: /Otra finca/ }).click(); await page.waitForURL(sandbox + "/fincas/8"); await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click();
    await visible(page.getByRole("dialog", { name: "Ya tenés un borrador de otra finca", exact: true })); assert.equal(await page.getByRole("button", { name: "Descartar y comenzar aquí", exact: true }).isDisabled(), true);
    release(); await visible(input(page, "crop.etoMmPerDay")); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), ""); assert.equal(posts(state).length, 1); assert.ok(page.url().includes("/fincas/8/"));
  });
  await scenario("Descartar intento incierto borra solo memoria, nunca el snapshot", { mode: "500" }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await uncertain(page); await page.getByRole("link", { name: "Detalle de finca", exact: true }).click(); await visible(page.getByRole("dialog", { name: "¿Salir de la preparación local?", exact: true })); await page.getByRole("button", { name: "Descartar y salir", exact: true }).click();
    await visible(page.locator('[data-simulation="301"]')); assert.equal(await page.getByRole("region", { name: "Guardado incierto", exact: true }).count(), 0); assert.equal(state.stored.length, 1); assert.equal(posts(state).length, 1);
  });
  await scenario("Recarga pierde seguimiento temporal sin repetir el POST", { mode: "500" }, async ({ page, state }) => {
    await open(page); await review(page); await save(page); await uncertain(page); await page.reload(); await visible(input(page, "crop.etoMmPerDay")); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), ""); assert.equal(posts(state).length, 1); assert.equal(state.stored.length, 1);
  });
  for (const width of [1280, 390, 320]) await scenario(`Recorrido, advertencia de duplicación, teclado y reflujo ${width}`, { width, mode: "500" }, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; }); await open(page); await review(page); await noOverflow(page); await shot(page, `revision-${width}`); await save(page); await waitPosts(state); await visible(page.getByRole("region", { name: "Envío en proceso", exact: true })); await noOverflow(page); await shot(page, `procesando-${width}`);
    release(); await uncertain(page); const status = page.getByRole("region", { name: "Guardado incierto", exact: true }); assert.equal(await status.evaluate(el => el === document.activeElement), true); await checkContrast(status, `Estado de envío ${width}`); await noOverflow(page); await shot(page, `incierto-${width}`);
    await history(page); await candidate(page); const comparisonData = page.locator('[aria-labelledby="submission-comparison-title"] details'); await comparisonData.locator("summary").focus(); await page.keyboard.press("Enter"); await visible(comparisonData.getByText("Enviado", { exact: true }).first()); assert.equal(await comparisonData.locator("li").count(), 17); await noOverflow(page); await page.keyboard.press("Space"); assert.equal(await comparisonData.evaluate(el => el.open), false); await noOverflow(page); await shot(page, `comparacion-${width}`); await page.getByRole("link", { name: "Volver al intento incierto", exact: true }).click(); await uncertain(page);
    const repeat = page.getByRole("button", { name: "Permitir otro envío del intento", exact: true }); await repeat.focus(); await page.keyboard.press("Enter"); const dialog = page.getByRole("dialog", { name: "¿Permitir otro envío?", exact: true }); await visible(dialog); await page.keyboard.press("Escape"); await dialog.waitFor({ state: "detached" }); assert.equal(await repeat.evaluate(el => el === document.activeElement), true); assert.equal(posts(state).length, 1);
    await repeat.click(); await visible(dialog); if (width === 320) await shot(page, "dialogo-duplicacion-320"); await dialog.getByRole("button", { name: "Entiendo el riesgo de duplicación", exact: true }).click(); await dialog.waitFor({ state: "detached" }); assert.equal(posts(state).length, 1); await visible(page.getByRole("region", { name: "Otro envío autorizado", exact: true }));
    state.gate = null; state.mode = "success"; await save(page); await page.waitForURL(sandbox + "/fincas/7/simulaciones/302"); await visible(page.getByRole("heading", { name: "Resultados del escenario", exact: true })); assert.equal(posts(state).length, 2); await noOverflow(page); await shot(page, `resultado-guardado-${width}`);
  });
} finally { await browser.close(); }
if (output) await writeFile(`${output}/qa.json`, JSON.stringify({ passed, failed, results, measurements, contrasts, apiOrigin: mock, realBackendCalls: 0, externalWrites: 0 }, null, 2));
console.log(`R5-H1/H2 navegador: ${passed} PASS / ${failed} FAIL; API completamente simulada, conexiones reales bloqueadas.`);
if (failed) process.exitCode = 1;
