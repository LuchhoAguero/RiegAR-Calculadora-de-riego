// Formulario DEV y bloqueo de producción. Toda la API se intercepta; POST prohibido.
// node scripts/verify-r5-d-browser.mjs <playwright/index.mjs>
// Requiere DEV 127.0.0.1:4174 y preview de producción 127.0.0.1:4173.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const dev = "http://127.0.0.1:4174", production = "http://127.0.0.1:4173";
const output = process.env.R5D_SCREENSHOTS;
if (output) await mkdir(output, { recursive: true });
const token = (seconds = 3600) => `e30.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + seconds, userId: 1 })).toString("base64url")}.signature`;
const routePath = id => `/fincas/${id}/simulaciones/nueva`;
let passed = 0, failed = 0;
const measurements = [], contrasts = [], results = [];
async function fixture({ width = 1280, auth = true, origin = dev, seconds = 3600 } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 768 });
  if (auth) await context.addInitScript(value => localStorage.setItem("token", value), token(seconds));
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  const state = { rows: [{ id: 7, nombre_finca: "Finca ensayo", ubicacion: "Mendoza" }, { id: 8, nombre_finca: "Otra finca", ubicacion: "San Juan" }], calls: [], errors: [], gate: null, status: 200, network: false, forbiddenPosts: [] };
  page.on("pageerror", error => state.errors.push(error.message));
  page.on("dialog", dialog => dialog.accept());
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin) return route.continue();
    if (url.origin !== "http://localhost:4000") return route.abort();
    state.calls.push({ method: request.method(), path: url.pathname });
    if (request.method() === "POST" && url.pathname.includes("irrigation-simulations")) { state.forbiddenPosts.push(url.pathname); return route.abort(); }
    assert.equal(request.method(), "GET", "El asistente solo consulta fincas");
    if (/^\/api\/fincas\/\d+\/irrigation-simulations$/.test(url.pathname)) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], pagination: { limit: 20, hasMore: false, nextCursor: null } }) });
    assert.equal(url.pathname, "/api/fincas", "Sin endpoint individual inventado");
    const rows = structuredClone(state.rows), gate = state.gate, status = state.status;
    if (gate) await gate;
    if (state.network) return route.abort("failed");
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(status === 200 ? rows : { error: status === 401 ? "Acceso denegado." : "No tenés permiso para consultar.", code: "RESOURCE_NOT_FOUND" }) });
  });
  return { page, context, state, origin };
}
async function scenario(name, options, check) {
  if (process.env.R5D_FILTER && !name.includes(process.env.R5D_FILTER)) return;
  const f = await fixture(options);
  try { await check(f); assert.deepEqual(f.state.errors, []); assert.deepEqual(f.state.forbiddenPosts, []); passed++; results.push({ name, result: "PASS", apiReads: f.state.calls.length, simulationPosts: 0 }); console.log("PASS " + name); }
  catch (error) { failed++; results.push({ name, result: "FAIL", message: error.message }); console.error(`FAIL ${name} [${f.page.url()}]: ${error.message}`); }
  finally { await f.context.close(); }
}
const visible = locator => locator.waitFor({ state: "visible" });
const input = (page, path) => page.locator(`[name="${path}"]`);
const pathIs = (page, origin, path) => page.waitForURL(origin + path);
const stepIs = (page, name) => visible(page.getByRole("heading", { level: 2, name, exact: true }));
const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
async function shot(page, name) {
  if (!output) return;
  await page.evaluate(() => { scrollTo(0, 0); return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: !name.includes("dialogo"), animations: "disabled" });
  measurements.push({ name, ...await page.evaluate(() => ({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth })) });
}
async function contrast(locator, label, border = false) {
  const pair = await locator.evaluate((el, border) => {
    const css = getComputedStyle(el), parse = color => color.match(/[\d.]+/g).map(Number);
    return { foreground: parse(border ? css.borderTopColor : css.color), background: parse(css.backgroundColor) };
  }, border);
  const luminance = rgb => { const c = rgb.slice(0,3).map(value => value/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4); return c[0]*.2126+c[1]*.7152+c[2]*.0722; };
  assert.equal(pair.background[3] ?? 1, 1);
  const values = [luminance(pair.foreground), luminance(pair.background)].sort((a,b) => a-b), ratio = (values[1]+.05)/(values[0]+.05);
  assert.ok(ratio >= (border ? 3 : 4.5), label); contrasts.push({ label, ratio: +ratio.toFixed(2) });
}
async function open(page, origin = dev, id = 7) { await page.goto(origin + routePath(id)); await stepIs(page, "Cultivo"); }
const fixtureValues = [
  { "crop.etoMmPerDay": "5", "crop.cropCoefficient": "0,7", "crop.daysWithoutIrrigation": "20" },
  { "soil.texture": "Franco", "soil.fieldCapacityPct": "20", "soil.wiltingPointPct": "10", "soil.bulkDensityGcm3": "1,3", "soil.rootDepthM": "0,7", "soil.depletionThresholdPct": "60" },
  { "furrow.furrowSpacingM": "1,3", "furrow.lengthM": "60", "furrow.slopePct": "0", "furrow.furrowCount": "18" },
  { "irrigation.flowLps": "0,9", "irrigation.durationMin": "120", "irrigation.advanceTimeMin": "20" },
];
async function fillStep(page, index) { for (const [path, value] of Object.entries(fixtureValues[index])) await input(page, path).fill(value); }
async function reachReview(page) {
  for (let index = 0; index < 4; index++) { await fillStep(page, index); await page.getByRole("button", { name: "Continuar", exact: true }).click(); }
  await stepIs(page, "Revisión");
}
async function changeSession(page) { await page.evaluate(value => { localStorage.setItem("token", value); dispatchEvent(new StorageEvent("storage", { key: "token" })); }, token(7200)); }
async function waitCalls(page, state, count) { for (let i = 0; i < 300 && state.calls.length < count; i++) await page.waitForTimeout(10); assert.ok(state.calls.length >= count); }

try {
  await scenario("Producción: ruta protegida sin sesión", { auth: false, origin: production }, async ({ page }) => {
    await page.goto(production + routePath(7)); await pathIs(page, production, "/login");
  });
  await scenario("Producción: formulario y acceso local ausentes, sin POST", { origin: production }, async ({ page, state }) => {
    await page.goto(production + routePath(7)); await visible(page.getByRole("heading", { name: "Simulación en preparación", exact: true }));
    assert.equal(await page.locator("form, input").count(), 0); assert.equal(state.calls.length, 0);
    await page.getByRole("link", { name: "Volver al detalle de finca", exact: true }).click();
    await visible(page.getByRole("heading", { name: "Finca ensayo", exact: true }));
    assert.equal(await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).count(), 0);
  });
  await scenario("DEV: auth, ID inválido y finca no disponible", { auth: false }, async ({ page, context, state }) => {
    await page.goto(dev + routePath(7)); await pathIs(page, dev, "/login"); assert.equal(state.calls.length, 0);
    await changeSession(page); await page.goto(dev + routePath("01")); await visible(page.getByRole("alert")); assert.equal(state.calls.length, 0);
    await page.goto(dev + routePath(9)); await visible(page.getByRole("heading", { name: "Finca no disponible", exact: true })); assert.equal(await page.locator("input").count(), 0);
  });
  await scenario("DEV: entrada desde finca seleccionada y recarga pierde borrador", {}, async ({ page }) => {
    await page.goto(dev + "/fincas/7"); await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click();
    await stepIs(page, "Cultivo"); await input(page, "crop.etoMmPerDay").fill("5");
    await visible(page.getByText(/Si recargás o cerrás la pestaña/));
    await page.reload(); await stepIs(page, "Cultivo"); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "");
    const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
    assert.deepEqual(storage, { local: ["token"], session: [] });
  });
  await scenario("DEV: validación vacía, campos asociados y foco en primer error", {}, async ({ page }) => {
    await open(page); assert.equal(await page.getByRole("button", { name: "Paso 2 de 5: Suelo", exact: true }).isDisabled(), true);
    await page.getByRole("button", { name: "Continuar", exact: true }).click(); await visible(page.getByRole("alert"));
    assert.equal(await input(page, "crop.etoMmPerDay").evaluate(el => el === document.activeElement), true);
    assert.equal(await input(page, "crop.etoMmPerDay").getAttribute("aria-invalid"), "true");
    const descriptions = await input(page, "crop.etoMmPerDay").evaluate(el => el.getAttribute("aria-describedby").split(" ").every(id => Boolean(document.getElementById(id)))); assert.ok(descriptions);
    await shot(page, "incompleto-1280");
  });
  await scenario("DEV: aclaración decimal sin selección automática ni Enter implícito", {}, async ({ page, state }) => {
    await open(page); await fillStep(page, 0); await input(page, "crop.etoMmPerDay").fill("1.300");
    await visible(page.getByRole("group", { name: /Aclarar Evapotranspiración/ }));
    await input(page, "crop.etoMmPerDay").press("Enter"); await stepIs(page, "Cultivo");
    assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "1.300");
    await shot(page, "decimal-ambiguo-1280");
    await page.getByRole("button", { name: "Usar como decimal: 1,3 mm/día", exact: true }).click();
    await visible(page.getByText("Se usará 1,3 mm/día.", { exact: true }));
    await input(page, "crop.etoMmPerDay").fill("1,400"); await visible(page.getByRole("group", { name: /Aclarar Evapotranspiración/ }));
    await page.getByRole("button", { name: "Usar como entero: 1400 mm/día", exact: true }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click(); await stepIs(page, "Suelo");
    assert.equal(state.calls.length, 1);
  });
  await scenario("DEV: relaciones entre variables y corrección completa", {}, async ({ page }) => {
    await open(page); await fillStep(page, 0); await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await fillStep(page, 1); await input(page, "soil.fieldCapacityPct").fill("10");
    await page.getByRole("button", { name: "Continuar", exact: true }).click(); await visible(page.getByText("La capacidad de campo debe superar el punto de marchitez.", { exact: true }));
    await input(page, "soil.fieldCapacityPct").fill("20"); await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await fillStep(page, 2); await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await fillStep(page, 3); await input(page, "irrigation.advanceTimeMin").fill("121"); await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await visible(page.getByText("El tiempo de avance no puede superar la duración del riego.", { exact: true }));
    await input(page, "irrigation.advanceTimeMin").fill("120"); await page.getByRole("button", { name: "Continuar", exact: true }).click(); await stepIs(page, "Revisión");
  });
  await scenario("DEV: cancelar Escape, conservar y descartar, sin resurrección", {}, async ({ page }) => {
    await open(page); await input(page, "crop.etoMmPerDay").fill("5");
    const back = page.getByRole("link", { name: "Detalle de finca", exact: true }); await back.click();
    await visible(page.getByRole("dialog")); await page.keyboard.press("Escape"); await pathIs(page, dev, routePath(7));
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await page.waitForFunction(() => document.activeElement?.getAttribute("href") === "/fincas/7");
    assert.equal(await back.evaluate(el => el === document.activeElement), true);
    await back.click(); await page.getByRole("button", { name: "Salir y conservar", exact: true }).click(); await pathIs(page, dev, "/fincas/7");
    await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click(); await stepIs(page, "Cultivo"); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "5");
    await back.click(); await page.getByRole("button", { name: "Descartar y salir", exact: true }).click(); await pathIs(page, dev, "/fincas/7");
    await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click(); await stepIs(page, "Cultivo"); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "");
  });
  await scenario("DEV: Atrás y Adelante conservan, cancelar salida mantiene ruta", {}, async ({ page }) => {
    await page.goto(dev + "/fincas/7"); await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click(); await stepIs(page, "Cultivo");
    await input(page, "crop.etoMmPerDay").fill("0,001"); await page.goBack(); await visible(page.getByRole("dialog"));
    await page.getByRole("button", { name: "Cancelar salida", exact: true }).click(); await pathIs(page, dev, routePath(7));
    await page.goBack(); await visible(page.getByRole("dialog")); await page.getByRole("button", { name: "Salir y conservar", exact: true }).click(); await pathIs(page, dev, "/fincas/7");
    await page.goForward(); await stepIs(page, "Cultivo"); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "0,001");
  });
  await scenario("DEV: única finca por borrador, cancelar, volver y reemplazar", {}, async ({ page }) => {
    await open(page); await input(page, "crop.etoMmPerDay").fill("5");
    await page.getByRole("link", { name: "Mis fincas", exact: true }).last().click();
    await page.getByRole("button", { name: "Salir y conservar", exact: true }).click(); await pathIs(page, dev, "/fincas");
    await page.getByRole("link", { name: /Otra finca.*Abrir finca/ }).click(); await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click();
    await visible(page.getByRole("dialog", { name: "Ya tenés un borrador de otra finca", exact: true }));
    await page.getByRole("button", { name: "Cancelar", exact: true }).click(); await pathIs(page, dev, "/fincas/8");
    await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click(); await page.getByRole("button", { name: "Volver al borrador", exact: true }).click();
    await stepIs(page, "Cultivo"); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "5");
    await page.getByRole("link", { name: "Mis fincas", exact: true }).last().click(); await page.getByRole("button", { name: "Salir y conservar", exact: true }).click();
    await page.getByRole("link", { name: /Otra finca.*Abrir finca/ }).click(); await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click();
    await page.getByRole("button", { name: "Descartar y comenzar aquí", exact: true }).click(); await stepIs(page, "Cultivo"); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "");
  });
  await scenario("DEV: logout nunca bloqueado por el borrador", {}, async ({ page }) => {
    await open(page); await input(page, "crop.etoMmPerDay").fill("5");
    await page.getByRole("button", { name: "Cerrar Sesión", exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Cerrar Sesión", exact: true }).click();
    await pathIs(page, dev, "/"); assert.equal(await page.getByRole("dialog").count(), 0);
    await changeSession(page); await page.goto(dev + routePath(7)); await stepIs(page, "Cultivo"); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "");
  });
  await scenario("DEV: expiración con datos no abre bloqueo de salida", { seconds: 4 }, async ({ page }) => {
    await open(page); await input(page, "crop.etoMmPerDay").fill("5"); await pathIs(page, dev, "/login");
    assert.equal(await page.getByRole("dialog").count(), 0); assert.equal(await page.evaluate(() => localStorage.getItem("token")), null);
  });
  await scenario("DEV: expiración mientras una salida está bloqueada", { seconds: 4 }, async ({ page }) => {
    await open(page); await input(page, "crop.etoMmPerDay").fill("5");
    await page.getByRole("link", { name: "Detalle de finca", exact: true }).click(); await visible(page.getByRole("dialog"));
    await pathIs(page, dev, "/login"); assert.equal(await page.getByRole("dialog").count(), 0);
  });
  await scenario("DEV: cambio de sesión elimina borrador antes de mostrar datos", {}, async ({ page, state }) => {
    await open(page); await input(page, "crop.etoMmPerDay").fill("5");
    let release; state.gate = new Promise(resolve => { release = resolve; });
    state.rows = [{ id: 7, nombre_finca: "Finca nueva sesión", ubicacion: "Salta" }];
    await changeSession(page); await visible(page.getByText("Consultando la finca...", { exact: true }));
    assert.equal(await page.locator("input").count(), 0); assert.equal(await page.getByText("Finca ensayo", { exact: true }).count(), 0);
    release(); await stepIs(page, "Cultivo"); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "");
  });
  await scenario("DEV: respuesta vieja no restaura otra sesión", {}, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; });
    await page.goto(dev + routePath(7)); await waitCalls(page, state, 1);
    state.gate = null; state.rows = [{ id: 7, nombre_finca: "Sesión vigente", ubicacion: "Salta" }];
    await changeSession(page); await stepIs(page, "Cultivo"); release(); await page.waitForTimeout(100);
    await visible(page.getByText("Sesión vigente", { exact: true })); assert.equal(await page.getByText("Finca ensayo", { exact: true }).count(), 0);
  });
  await scenario("DEV: cambiar finca con lectura atrasada no muestra datos anteriores", {}, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; });
    await page.goto(dev + routePath(7)); await waitCalls(page, state, 1); state.gate = null;
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Mis fincas", exact: true }).click();
    await page.getByRole("link", { name: /Otra finca.*Abrir finca/ }).click();
    await page.getByRole("link", { name: "Preparar simulación (solo local)", exact: true }).click(); await stepIs(page, "Cultivo");
    release(); await page.waitForTimeout(100); await visible(page.getByText("Otra finca", { exact: true }));
    assert.equal(await page.getByText("Finca ensayo", { exact: true }).count(), 0); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "");
  });
  await scenario("DEV: error de lectura permite consulta manual", {}, async ({ page, state }) => {
    state.network = true; await page.goto(dev + routePath(7)); await visible(page.getByRole("alert")); assert.equal(state.calls.length, 1);
    state.network = false; await page.getByRole("button", { name: "Volver a consultar", exact: true }).click(); await stepIs(page, "Cultivo"); assert.equal(state.calls.length, 2);
  });
  await scenario("DEV: 401 invalida sesión sin bloqueo", {}, async ({ page, state }) => {
    state.status = 401; await page.goto(dev + routePath(7)); await pathIs(page, dev, "/login"); assert.equal(await page.getByRole("dialog").count(), 0);
  });
  await scenario("DEV: 403 de permisos conserva sesión y no monta formulario", {}, async ({ page, state }) => {
    state.status = 403; await page.goto(dev + routePath(7)); await visible(page.getByRole("alert"));
    assert.ok(await page.evaluate(() => localStorage.getItem("token"))); assert.equal(await page.locator("input").count(), 0);
  });
  await scenario("DEV: carga y error accesibles a 320", { width: 320 }, async ({ page, state }) => {
    let release; state.gate = new Promise(resolve => { release = resolve; });
    await page.goto(dev + routePath(7)); await visible(page.getByText("Consultando la finca...", { exact: true }));
    await noOverflow(page); await shot(page, "cargando-320"); state.network = true; release();
    await visible(page.getByRole("alert")); await noOverflow(page); await shot(page, "error-lectura-320");
    assert.ok((await page.getByRole("button", { name: "Volver a consultar", exact: true }).boundingBox()).height >= 44);
    await contrast(page.getByRole("alert"), "Mensaje de error");
  });
  await scenario("Producción: aviso y navegación a 320", { origin: production, width: 320 }, async ({ page }) => {
    await page.goto(production + routePath(7)); await visible(page.getByRole("heading", { name: "Simulación en preparación", exact: true }));
    await noOverflow(page); await shot(page, "produccion-bloqueada-320");
    await page.getByRole("link", { name: "Volver al detalle de finca", exact: true }).focus(); await page.keyboard.press("Enter"); await pathIs(page, production, "/fincas/7");
  });
  await scenario("DEV: modal de salida a 320, teclado y estados capturados", { width: 320 }, async ({ page }) => {
    await open(page); await input(page, "crop.etoMmPerDay").fill("1.300"); await noOverflow(page); await shot(page, "decimal-ambiguo-320");
    await page.getByRole("link", { name: "Detalle de finca", exact: true }).click(); await visible(page.getByRole("dialog")); await noOverflow(page); await shot(page, "dialogo-salida-320");
    const dialog = page.getByRole("dialog"); await dialog.getByRole("button", { name: "Descartar y salir", exact: true }).focus();
    await page.keyboard.press("Tab"); assert.equal(await dialog.getByRole("button", { name: "Cerrar diálogo", exact: true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Escape"); await pathIs(page, dev, routePath(7));
  });
  for (const width of [1280, 390, 320]) {
    await scenario(`DEV: cinco pasos, revisión y reflujo ${width}`, { width }, async ({ page, state }) => {
      await open(page);
      await contrast(page.getByRole("button", { name: "Continuar", exact: true }), `Acción principal ${width}`);
      await contrast(input(page, "crop.etoMmPerDay"), `Borde de campo ${width}`, true);
      await contrast(page.getByRole("complementary", { name: "Disponibilidad y borrador", exact: true }), `Aviso de disponibilidad ${width}`);
      await contrast(page.getByRole("button", { name: "Paso 1 de 5: Cultivo", exact: true }), `Paso activo ${width}`);
      for (let index = 0; index < 4; index++) {
        await fillStep(page, index); await noOverflow(page); await shot(page, `paso-${index + 1}-${width}`);
        if (index === 0) { await input(page, "crop.daysWithoutIrrigation").focus(); await page.keyboard.press("Tab"); assert.equal(await page.getByRole("button", { name: "Continuar", exact: true }).evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== "none"), true); }
        await page.getByRole("button", { name: "Continuar", exact: true }).click();
        assert.equal(await page.locator("#v2-step-title").evaluate(el => el === document.activeElement), true);
        const headingBox = await page.locator("#v2-step-title").boundingBox();
        const headerBox = await page.locator(".app-shell > header").boundingBox();
        assert.ok(headingBox.y >= headerBox.y + headerBox.height, "El título enfocado no queda bajo la cabecera");
      }
      await input(page, "name").fill("Escenario local de revisión"); await noOverflow(page); await shot(page, `paso-5-${width}`);
      assert.equal(await page.getByRole("button", { name: "Calcular y guardar", exact: true }).isDisabled(), true);
      await page.getByRole("button", { name: "Validar preparación", exact: true }).click();
      await visible(page.getByText("Datos revisados y preparados. No se envió ninguna solicitud ni se guardó una simulación.", { exact: true }));
      await page.getByRole("button", { name: "Corregir Cultivo", exact: true }).click(); assert.equal(await input(page, "crop.etoMmPerDay").inputValue(), "5");
      await input(page, "crop.etoMmPerDay").fill(""); await page.getByRole("button", { name: "Paso 5 de 5: Revisión", exact: true }).click(); await visible(page.getByRole("alert"));
      assert.equal(await input(page, "name").inputValue(), "Escenario local de revisión");
      assert.equal(state.calls.length, 1); await noOverflow(page);
    });
  }
} finally { await browser.close(); }
if (output) await writeFile(`${output}/qa.json`, JSON.stringify({ passed, failed, results, measurements, contrasts, realBackendCalls: 0 }, null, 2));
console.log(`R5-D navegador: ${passed} PASS / ${failed} FAIL; API simulada, POST de simulación prohibido en todos los escenarios.`);
if (failed) process.exitCode = 1;
