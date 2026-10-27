// Prueba de la build con API simulada; jamás conecta al backend real.
// node scripts/verify-r5-a1-browser.mjs <ruta absoluta a playwright/index.mjs>
// Requiere preview en http://127.0.0.1:4173 y Microsoft Edge instalado.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdir, readFile } from "node:fs/promises";
const { chromium } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : "playwright");
const browser = await chromium.launch({ executablePath: process.env.R5A1_BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const origin = "http://127.0.0.1:4173";
const token = (seconds = 3600) => `e30.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + seconds, userId: 1 })).toString("base64url")}.signature`;
let passed = 0, failed = 0;
if (process.env.R5A1_SCREENSHOTS) await mkdir(process.env.R5A1_SCREENSHOTS, { recursive: true });
async function screenshot(page, name) {
  if (process.env.R5A1_SCREENSHOTS) await page.screenshot({ path: `${process.env.R5A1_SCREENSHOTS}/${name}.png`, fullPage: true, animations: "disabled" });
}

async function fixture({ storedToken = null, width = 1280, touch = false, serviceHarness = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: touch });
  if (storedToken) await context.addInitScript(value => localStorage.setItem("token", value), storedToken);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  if (process.env.R5A1_DEBUG) page.on("framenavigated", frame => console.log("navigation", frame.url()));
  const state = { fincas: [{ id: 7, nombre_finca: "Finca ensayo", ubicacion: "Mendoza" }], calculos: [], calls: [], errors: [], authStatus: null, contactStatus: 200, contactGate: null, deleteConflict: false, createStatus: 201 };
  page.on("pageerror", error => state.errors.push(error.message));
  page.on("dialog", dialog => dialog.accept());
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (serviceHarness && url.origin === origin && url.pathname === "/__r5c/services/apiService.js") return route.fulfill({ contentType: "application/javascript", body: await readFile(new URL("../src/services/apiService.js", import.meta.url), "utf8") });
    if (serviceHarness && url.origin === origin && url.pathname === "/__r5c/context/session.js") return route.fulfill({ contentType: "application/javascript", body: await readFile(new URL("../src/context/session.js", import.meta.url), "utf8") });
    if (url.origin === origin) return route.continue();
    if (url.origin !== "http://localhost:4000") return route.abort();
    const path = url.pathname, method = request.method();
    const data = request.postData() ? JSON.parse(request.postData()) : null;
    state.calls.push({ path, method, data, query: url.search, authorization: request.headers().authorization });
    const reply = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (state.authStatus && path.startsWith("/api/fincas")) return reply({ error: state.authMessage || (state.authStatus === 403 ? "Token inválido o expirado." : "Acceso denegado: No se proporcionó token.") }, state.authStatus);
    if (path === "/api/login") return reply(state.loginInvalid ? { error: "Credenciales inválidas." } : { token: state.loginToken || token() }, state.loginInvalid ? 401 : 200);
    if (path === "/api/register") return reply({ message: "Usuario registrado con éxito en la base de datos.", userId: 1 }, 201);
    if (path === "/api/contact") {
      if (state.contactGate) await state.contactGate;
      if (state.contactStatus === "network") return route.abort("failed");
      return reply(state.contactStatus === 200 ? { message: "Correo enviado con éxito." } : { error: "No se pudo enviar el correo." }, state.contactStatus);
    }
    if (path === "/api/fincas") {
      if (method === "GET") {
        const rows = structuredClone(state.fincas);
        if (state.fincasGate) await state.fincasGate;
        if (state.fincasNetwork) return route.abort("failed");
        return reply(rows);
      }
      if (state.createStatus !== 201) return reply({ error: "No se pudo crear la finca." }, state.createStatus);
      state.fincas.push({ id: 8, ...data });
      return reply({ message: "Finca creada con éxito.", fincaId: 8 }, 201);
    }
    if (path === "/api/fincas/7") {
      if (method === "PUT") { state.fincas[0] = { id: 7, ...data }; return reply({ message: "Actualizada." }); }
      if (state.deleteConflict) return reply({ error: "La finca posee simulaciones de riego guardadas y no puede eliminarse.", code: "FARM_HAS_IRRIGATION_SIMULATIONS" }, 409);
      state.fincas = state.fincas.filter(farm => farm.id !== 7);
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/fincas/7/calculos") {
      if (method === "GET") return reply(state.calculos);
      state.calculos.push({ id: 1, created_at: "2026-10-26T12:00:00Z", ...data });
      return reply({ message: "Guardado.", calculoId: 1 }, 201);
    }
    if (serviceHarness && path === "/api/fincas/7/irrigation-simulations") {
      if (method === "POST") {
        state.simulationPosts = (state.simulationPosts || 0) + 1;
        if (state.simulationFailure === "network") return route.abort("failed");
        if (state.simulationFailure === "json") return route.fulfill({ status: 201, contentType: "text/html", body: "<html>No interpretable</html>" });
        if (state.simulationFailure === "500") return reply({ error: "Ocurrió un error en el servidor.", code: "INTERNAL_ERROR" }, 500);
        return reply({ simulation: { id: 21, fincaId: 7, name: data.name, createdAt: "2026-10-27T12:00:00.000Z" }, model: { contractVersion: "irrigation-contract-v1", modelVersion: "irrigation-estimation-v1" }, input: data, output: {}, metadata: {} }, 201);
      }
      return reply({ items: [{ simulation: { id: 21, fincaId: 7 }, model: { contractVersion: "irrigation-contract-v1" }, summary: { appliedVolumeL: 6480 } }, { simulation: { id: 22, fincaId: 7 }, model: { contractVersion: "irrigation-contract-v2" }, summary: { appliedVolumeL: 6480, furrowCount: 18, totalAppliedVolumeL: 116640 } }], pagination: { limit: 2, hasMore: true, nextCursor: "opaque-next-cursor" } });
    }
    if (serviceHarness && path === "/api/fincas/7/irrigation-simulations/22") return reply({ simulation: { id: 22, fincaId: 7 }, model: { contractVersion: "irrigation-contract-v2" }, input: { furrow: { furrowSpacingM: 1.3, furrowCount: 18 } }, output: { totals: { totalAppliedVolumeL: 116640 } }, metadata: {} });
    throw new Error(`API simulada sin handler: ${method} ${path}`);
  });
  return { context, page, state };
}
async function scenario(name, options, check) {
  if (process.env.R5A1_FILTER && !name.includes(process.env.R5A1_FILTER)) return;
  const f = await fixture(options);
  try { await check(f); assert.deepEqual(f.state.errors, []); passed++; console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name} [${f.page.url()}]: ${error.message}`); }
  finally { await f.context.close(); }
}
const visible = locator => locator.waitFor({ state: "visible" });
const pathIs = (page, path) => page.waitForURL(`${origin}${path}`);
const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

try {
  await scenario("assets y rutas públicas", {}, async ({ page }) => {
    for (const path of ["/", "/calculadora", "/guia", "/configuracion", "/contacto", "/login", "/registro"]) {
      const response = await page.goto(origin + path); assert.equal(response.status(), 200);
      await visible(page.locator("main"));
    }
    await page.goto(origin);
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    const bg = await page.locator('[aria-hidden="true"]').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundImage).find(value => value.includes("agricultural-field-pattern")));
    assert.ok(bg);
    const bgUrl = bg.match(/url\("?(.*?)"?\)/)[1];
    assert.equal((await page.request.get(bgUrl)).status(), 200);
  });
  await scenario("rutas protegidas sin sesión", {}, async ({ page, state }) => {
    for (const path of ["/dashboard", "/fincas", "/fincas/7", "/finca/7", "/finca/7/nuevo-calculo"]) { await page.goto(origin + path); await pathIs(page, "/login"); }
    assert.equal(state.calls.length, 0);
  });
  for (const [name, storedToken] of [["vencido", token(-10)], ["malformado", "invalid"]]) {
    await scenario(`token ${name} no habilita rutas`, { storedToken }, async ({ page }) => {
      await page.goto(origin + "/dashboard"); await pathIs(page, "/login");
      assert.equal(await page.evaluate(() => localStorage.getItem("token")), null);
    });
  }
  await scenario("login y logout con navegación atrás", {}, async ({ page }) => {
    await page.goto(origin + "/login");
    await page.getByLabel("Email", { exact: true }).fill("test@example.invalid");
    await page.getByLabel("Contraseña", { exact: true }).fill("local-test-only");
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await pathIs(page, "/fincas"); await visible(page.getByRole("link", { name: /Finca ensayo/ }));
    await page.getByRole("button", { name: "Cerrar Sesión", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cerrar Sesión", exact: true }).click();
    await pathIs(page, "/");
    await page.goBack(); await pathIs(page, "/login");
    assert.equal(await page.evaluate(() => localStorage.getItem("token")), null);
  });
  await scenario("registro y error accesible de login", {}, async ({ page, state }) => {
    await page.goto(origin + "/registro");
    await page.getByLabel("Nombre", { exact: true }).fill("Ensayo");
    await page.getByLabel("Email", { exact: true }).fill("test@example.invalid");
    await page.getByLabel("Contraseña", { exact: true }).fill("local-test-only");
    await page.getByRole("button", { name: "Registrarse", exact: true }).click();
    await visible(page.getByRole("status"));
    state.loginInvalid = true;
    await page.goto(origin + "/login");
    await page.getByLabel("Email", { exact: true }).fill("test@example.invalid");
    await page.getByLabel("Contraseña", { exact: true }).fill("local-test-only");
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await visible(page.getByRole("alert")); assert.match(await page.getByRole("alert").innerText(), /Credenciales inválidas/);
  });
  for (const authStatus of [401, 403]) {
    await scenario(`rechazo ${authStatus} en navegador termina sesión`, { storedToken: token() }, async ({ page, state }) => {
      state.authStatus = authStatus;
      await page.goto(origin + "/dashboard"); await pathIs(page, "/login");
      assert.equal(await page.evaluate(() => localStorage.getItem("token")), null);
    });
  }
  await scenario("expiración automática durante la sesión", {}, async ({ page }) => {
    await page.goto(origin + "/login");
    await page.evaluate(value => { localStorage.setItem("token", value); window.dispatchEvent(new StorageEvent("storage", { key: "token" })); }, token(2));
    await page.goto(origin + "/dashboard");
    await visible(page.getByRole("link", { name: /Finca ensayo/ }));
    await pathIs(page, "/login");
  });
  await scenario("logout en otra pestaña sincroniza la sesión", { storedToken: token() }, async ({ page, context }) => {
    await page.goto(origin + "/dashboard"); await visible(page.getByRole("link", { name: /Finca ensayo/ }));
    const second = await context.newPage(); await second.goto(origin + "/contacto");
    await second.evaluate(() => localStorage.removeItem("token")); await pathIs(page, "/login");
  });
  await scenario("fincas: crear, editar y borrar sin navegación involuntaria", { storedToken: token() }, async ({ page, state }) => {
    await page.goto(origin + "/dashboard"); await visible(page.getByRole("link", { name: /Finca ensayo/ }));
    assert.equal(await page.locator("a button, button a").count(), 0);
    await screenshot(page, "dashboard-desktop");
    await page.getByRole("button", { name: "Nueva finca", exact: true }).click();
    await page.getByLabel("Nombre de la Finca (*)", { exact: true }).fill("Segunda finca");
    await page.getByRole("button", { name: "Guardar Finca", exact: true }).click();
    await visible(page.getByRole("link", { name: /Segunda finca/ }));
    await page.getByRole("button", { name: "Editar finca Finca ensayo", exact: true }).click();
    const dialog = page.getByRole("dialog"); await visible(dialog);
    await dialog.getByLabel("Nombre de la Finca", { exact: true }).fill("Finca editada");
    await dialog.getByRole("button", { name: "Guardar Cambios" }).click();
    await visible(page.getByRole("link", { name: /Finca editada/ }));
    assert.equal(new URL(page.url()).pathname, "/fincas");
    await page.getByRole("button", { name: "Borrar finca Finca editada", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Eliminar", exact: true }).click();
    await page.getByRole("link", { name: /Finca editada/ }).waitFor({ state: "detached" });
    assert.equal(state.calls.filter(call => call.method === "DELETE").length, 1);
  });
  await scenario("409 conserva finca y comunica rechazo", { storedToken: token() }, async ({ page, state }) => {
    state.deleteConflict = true;
    await page.goto(origin + "/dashboard");
    await page.getByRole("button", { name: "Borrar finca Finca ensayo", exact: true }).click();
    const alert = page.waitForEvent("dialog");
    await page.getByRole("dialog").getByRole("button", { name: "Eliminar", exact: true }).click();
    assert.match((await alert).message(), /simulaciones de riego guardadas/);
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
    await visible(page.getByRole("link", { name: /Finca ensayo/ }));
    assert.equal(state.calls.filter(call => call.method === "DELETE").length, 1);
  });
  await scenario("modal: foco inicial, ciclo Tab, Escape y retorno", { storedToken: token() }, async ({ page }) => {
    await page.goto(origin + "/dashboard");
    const opener = page.getByRole("button", { name: "Editar finca Finca ensayo", exact: true });
    await opener.click();
    const close = page.getByRole("button", { name: "Cerrar diálogo" }); await visible(close);
    assert.equal(await close.evaluate(node => node === document.activeElement), true);
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.getByRole("button", { name: "Guardar Cambios" }).evaluate(node => node === document.activeElement), true);
    await page.keyboard.press("Tab"); assert.equal(await close.evaluate(node => node === document.activeElement), true);
    assert.equal(await page.locator("#root").evaluate(node => node.inert), true);
    await page.keyboard.press("Escape"); await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(await opener.evaluate(node => node === document.activeElement), true);
    assert.equal(await page.locator("#root").evaluate(node => node.inert), false);
  });
  await scenario("contacto: carga, éxito y doble envío bloqueado", {}, async ({ page, state }) => {
    let release; state.contactGate = new Promise(resolve => { release = resolve; });
    await page.goto(origin + "/contacto");
    await page.getByLabel("Nombre", { exact: true }).fill("Ensayo");
    await page.getByLabel("Email", { exact: true }).fill("test@example.invalid");
    await page.getByLabel("Mensaje", { exact: true }).fill("Prueba local");
    await page.getByRole("button", { name: "Enviar", exact: true }).click();
    await visible(page.getByRole("button", { name: "Enviando...", exact: true }));
    assert.equal(await page.getByRole("button", { name: "Enviando...", exact: true }).isDisabled(), true);
    await page.locator("form").evaluate(form => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    await page.waitForFunction(() => document.querySelector('form[aria-busy="true"]'));
    release();
    await page.getByRole("status").filter({ hasText: "Tu mensaje se envió correctamente." }).waitFor();
    assert.equal(state.calls.filter(call => call.path === "/api/contact").length, 1);
    assert.equal(await page.getByLabel("Mensaje", { exact: true }).inputValue(), "");
  });
  for (const contactStatus of [500, "network"]) {
    await scenario(`contacto ${contactStatus}: conserva datos, muestra error y no reintenta`, {}, async ({ page, state }) => {
      state.contactStatus = contactStatus;
      await page.goto(origin + "/contacto");
      await page.getByLabel("Mensaje", { exact: true }).fill("Conservar texto");
      await page.getByRole("button", { name: "Enviar", exact: true }).click();
      await visible(page.getByRole("alert"));
      assert.equal(await page.getByLabel("Mensaje", { exact: true }).inputValue(), "Conservar texto");
      assert.equal(state.calls.filter(call => call.path === "/api/contact").length, 1);
    });
  }
  await scenario("Manning: cálculo, guardado histórico y modal reutilizado", { storedToken: token() }, async ({ page, state }) => {
    await page.goto(origin + "/finca/7/nuevo-calculo");
    await visible(page.getByText("0.522896", { exact: true }));
    await page.locator('input[type="text"]').fill("Manning ensayo");
    await page.getByRole("button", { name: "Guardar Cálculo", exact: true }).click();
    await visible(page.getByRole("dialog", { name: "¡Guardado!" }));
    const saved = state.calls.find(call => call.method === "POST" && call.path.endsWith("/calculos"));
    assert.equal(saved.data.tipo_canal, "rectangular");
    assert.ok(Math.abs(saved.data.Q_m3s - 0.5228961337882106) < 1e-12);
    await page.getByRole("button", { name: "Entendido" }).click();
    await pathIs(page, "/finca/7"); await visible(page.getByRole("heading", { name: "Manning ensayo" }));
  });
  await scenario("móvil: menú accesible, tarjetas y modal sin desborde", { storedToken: token(), width: 375 }, async ({ page }) => {
    await page.goto(origin + "/dashboard"); await visible(page.getByRole("link", { name: /Finca ensayo/ }));
    const menu = page.getByRole("button", { name: "Abrir menú" });
    assert.equal(await menu.getAttribute("aria-expanded"), "false");
    assert.equal(await page.getByRole("navigation", { name: "Navegación principal" }).count(), 0);
    await menu.click();
    assert.equal(await page.getByRole("button", { name: "Cerrar menú" }).getAttribute("aria-expanded"), "true");
    await page.getByRole("button", { name: "Herramientas anteriores", exact: true }).focus();
    await page.keyboard.press("Escape"); assert.equal(await menu.evaluate(node => node === document.activeElement), true);
    await noOverflow(page);
    await page.getByRole("button", { name: "Editar finca Finca ensayo", exact: true }).click();
    await visible(page.getByRole("dialog")); await noOverflow(page);
    const box = await page.getByRole("dialog").boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= 375);
    await screenshot(page, "modal-mobile");
    await page.keyboard.press("Escape");
    for (const path of ["/login", "/registro", "/contacto"]) { await page.goto(origin + path); await noOverflow(page); }
  });
  await scenario("B3: portada honesta y accesos públicos", {}, async ({ page, state }) => {
    await page.goto(origin);
    const main = page.locator("main");
    await visible(main.getByRole("heading", { level: 1, name: "Tu trabajo de riego, organizado por finca." }));
    assert.match(await main.innerText(), /simulación de riego por surcos está en preparación/);
    assert.doesNotMatch(await main.innerText(), /Fórmula de Manning|Precisión Profesional/);
    assert.equal(await main.getByRole("link", { name: /simulación/i }).count(), 0);
    assert.equal(state.calls.length, 0);
    await main.getByRole("link", { name: "Crear cuenta", exact: true }).click(); await pathIs(page, "/registro");
    await page.goto(origin);
    await main.getByRole("link", { name: "Iniciar sesión", exact: true }).click(); await pathIs(page, "/login");
    await page.locator("footer").getByRole("link", { name: "Mis fincas", exact: true }).click(); await pathIs(page, "/login");
    assert.equal(state.calls.length, 0);
  });
  await scenario("B3: Mis fincas prioritaria con sesión", { storedToken: token() }, async ({ page }) => {
    await page.goto(origin);
    const nav = page.getByRole("navigation", { name: "Navegación principal" });
    assert.equal(await nav.getByRole("link").first().innerText(), "Mis fincas");
    await page.locator("main").getByRole("link", { name: "Ir a Mis fincas", exact: true }).click();
    await pathIs(page, "/fincas");
    await visible(page.getByRole("heading", { level: 1, name: "Mis fincas", exact: true }));
    assert.equal(await nav.getByRole("link", { name: "Mis fincas", exact: true }).getAttribute("aria-current"), "page");
  });
  await scenario("B3: Herramientas anteriores por teclado y retorno de foco", {}, async ({ page }) => {
    await page.goto(origin);
    const nav = page.getByRole("navigation", { name: "Navegación principal" });
    const trigger = nav.getByRole("button", { name: "Herramientas anteriores", exact: true });
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await nav.getByRole("link", { name: "Calculadora Manning", exact: true }).count(), 0);
    await trigger.focus(); await page.keyboard.press("Enter");
    assert.equal(await trigger.getAttribute("aria-expanded"), "true");
    await page.keyboard.press("Tab");
    assert.equal(await nav.getByRole("link", { name: "Calculadora Manning", exact: true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Tab");
    assert.equal(await nav.getByRole("link", { name: "Guía Manning", exact: true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Escape");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Space");
    await page.locator("main h1").click(); assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    await trigger.click(); await page.keyboard.press("Shift+Tab");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    await trigger.click(); await nav.getByRole("link", { name: "Guía Manning", exact: true }).click(); await pathIs(page, "/guia");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    await page.goBack(); await pathIs(page, "/"); assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  });
  for (const width of [390, 320]) {
    await scenario(`B3: Herramientas anteriores con toque a ${width}`, { width, touch: true }, async ({ page }) => {
      await page.goto(origin);
      await page.getByRole("button", { name: "Abrir menú" }).tap();
      const nav = page.getByRole("navigation", { name: "Navegación principal" });
      const trigger = nav.getByRole("button", { name: "Herramientas anteriores", exact: true });
      await trigger.tap(); await noOverflow(page);
      await trigger.tap(); assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      await trigger.tap();
      await nav.getByRole("link", { name: "Guía Manning", exact: true }).focus();
      await page.keyboard.press("Escape");
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("button", { name: "Abrir menú" }).evaluate(el => el === document.activeElement), true);
      await page.getByRole("button", { name: "Abrir menú" }).tap(); await trigger.tap();
      await nav.getByRole("link", { name: "Calculadora Manning", exact: true }).tap(); await pathIs(page, "/calculadora");
      await visible(page.getByText("0.522896", { exact: true }));
      assert.equal(await page.getByRole("navigation", { name: "Navegación principal" }).count(), 0);
      await page.goto(origin); await page.locator("footer").getByRole("link", { name: "Guía Manning", exact: true }).tap(); await pathIs(page, "/guia");
    });
  }
  await scenario("B3: formulario plegable conserva datos y foco", { storedToken: token() }, async ({ page, state }) => {
    await page.goto(origin + "/dashboard"); await visible(page.getByRole("link", { name: /Finca ensayo/ }));
    const trigger = page.getByRole("button", { name: "Nueva finca", exact: true });
    const name = page.getByLabel("Nombre de la Finca (*)", { exact: true });
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await name.isVisible(), false);
    assert.equal(await page.locator('[aria-label="Listado de fincas"]').evaluate(el => Boolean(el.compareDocumentPosition(document.getElementById("new-farm-panel")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
    await trigger.focus(); await page.keyboard.press("Tab");
    assert.equal(await page.getByRole("link", { name: /Finca ensayo/ }).evaluate(el => el === document.activeElement), true);
    await trigger.focus(); await page.keyboard.press("Enter");
    assert.equal(await name.evaluate(el => el === document.activeElement), true);
    await name.fill("Finca conservada"); await page.getByLabel("Ubicación (Opcional)").fill("Mendoza");
    await page.keyboard.press("Escape");
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    await trigger.click(); assert.equal(await name.inputValue(), "Finca conservada");
    assert.equal(await page.getByLabel("Ubicación (Opcional)").inputValue(), "Mendoza");
    await page.getByRole("button", { name: "Cerrar formulario", exact: true }).click();
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    await trigger.click(); await trigger.click(); await trigger.click();
    assert.equal(await name.inputValue(), "Finca conservada");
    assert.equal(state.calls.filter(c => c.method === "POST").length, 0);
    await page.getByRole("button", { name: "Guardar Finca", exact: true }).click();
    await visible(page.getByRole("link", { name: /Finca conservada/ }));
    assert.deepEqual(state.calls.find(c => c.method === "POST").data, { nombre_finca: "Finca conservada", ubicacion: "Mendoza" });
    assert.equal(await name.inputValue(), "");
    assert.equal(await name.evaluate(el => el === document.activeElement), true);
  });
  await scenario("B3: nueva finca vacía valida sin POST a 320", { storedToken: token(), width: 320, touch: true }, async ({ page, state }) => {
    state.fincas = [];
    await page.goto(origin + "/dashboard");
    await visible(page.getByText("Todavía no creaste ninguna finca. Usá Nueva finca para empezar.", { exact: true }));
    await page.getByRole("button", { name: "Nueva finca", exact: true }).tap();
    await page.getByRole("button", { name: "Guardar Finca", exact: true }).tap();
    await visible(page.getByRole("alert")); assert.equal(state.calls.filter(c => c.method === "POST").length, 0);
    await page.getByLabel("Nombre de la Finca (*)").fill("Texto temporal");
    await page.getByRole("button", { name: "Cerrar formulario", exact: true }).tap();
    await page.getByRole("button", { name: "Nueva finca", exact: true }).tap();
    assert.equal(await page.getByLabel("Nombre de la Finca (*)").inputValue(), "Texto temporal"); await noOverflow(page);
  });
  await scenario("B3: error de creación conserva datos y no reintenta", { storedToken: token() }, async ({ page, state }) => {
    state.createStatus = 500;
    await page.goto(origin + "/dashboard"); await page.getByRole("button", { name: "Nueva finca", exact: true }).click();
    await page.getByLabel("Nombre de la Finca (*)").fill("Conservar finca");
    await page.getByLabel("Ubicación (Opcional)").fill("Ubicación conservada");
    await page.getByRole("button", { name: "Guardar Finca", exact: true }).click(); await visible(page.getByRole("alert"));
    await page.keyboard.press("Escape"); await page.getByRole("button", { name: "Nueva finca", exact: true }).click();
    assert.equal(await page.getByLabel("Nombre de la Finca (*)").inputValue(), "Conservar finca");
    assert.equal(await page.getByLabel("Ubicación (Opcional)").inputValue(), "Ubicación conservada");
    assert.equal(state.calls.filter(c => c.method === "POST").length, 1);
  });
  await scenario("B3: recarga y salida no prometen recuperar el formulario", { storedToken: token() }, async ({ page }) => {
    await page.goto(origin + "/dashboard"); await page.getByRole("button", { name: "Nueva finca", exact: true }).click();
    await page.getByLabel("Nombre de la Finca (*)").fill("Temporal");
    await visible(page.getByText(/Si recargás o salís de esta pantalla, se pierde/));
    await page.reload(); await page.getByRole("button", { name: "Nueva finca", exact: true }).click();
    assert.equal(await page.getByLabel("Nombre de la Finca (*)").inputValue(), "");
    await page.getByLabel("Nombre de la Finca (*)").fill("Otro temporal");
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Contacto", exact: true }).click();
    await page.goBack(); await pathIs(page, "/fincas"); await page.getByRole("button", { name: "Nueva finca", exact: true }).click();
    assert.equal(await page.getByLabel("Nombre de la Finca (*)").inputValue(), "");
  });
  await scenario("B3: cancelar borrado y edición conserva la finca", { storedToken: token() }, async ({ page, state }) => {
    await page.goto(origin + "/dashboard");
    await page.getByRole("button", { name: "Borrar finca Finca ensayo", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("button", { name: "Editar finca Finca ensayo", exact: true }).click();
    await page.getByRole("dialog").getByLabel("Nombre de la Finca", { exact: true }).fill("No guardar");
    await page.keyboard.press("Escape"); await visible(page.getByRole("link", { name: /Finca ensayo/ }));
    assert.equal(state.calls.filter(c => ["DELETE", "PUT"].includes(c.method)).length, 0);
  });
  await scenario("R5C: alias protegido, ruta canónica, recarga y acceso histórico", { storedToken: token() }, async ({ page, state }) => {
    await page.goto(origin + "/contacto");
    await page.evaluate(() => { history.pushState({}, "", "/dashboard"); dispatchEvent(new PopStateEvent("popstate")); });
    await pathIs(page, "/fincas"); await visible(page.getByRole("link", { name: /Finca ensayo/ }));
    await page.goBack(); await pathIs(page, "/contacto");
    await page.goto(origin + "/fincas"); await page.reload();
    await page.getByRole("link", { name: /Finca ensayo/ }).click(); await pathIs(page, "/fincas/7");
    await visible(page.getByRole("heading", { name: "Finca ensayo", exact: true }));
    await visible(page.getByText("La nueva simulación de riego por surcos está en preparación.", { exact: true }));
    assert.equal(await page.getByRole("button", { name: /simulación/i }).count(), 0);
    await page.reload(); await visible(page.getByRole("heading", { name: "Finca ensayo", exact: true }));
    await page.getByRole("link", { name: "Ver cálculos Manning", exact: true }).click(); await pathIs(page, "/finca/7");
    await visible(page.getByRole("link", { name: "+ Nuevo Cálculo", exact: true }));
    await page.goBack(); await pathIs(page, "/fincas/7");
    await page.getByRole("link", { name: "Administrar mis fincas", exact: true }).click(); await pathIs(page, "/fincas");
    assert.equal(state.calls.some(c => c.path.includes("irrigation-simulations")), false);
    assert.equal(state.calls.some(c => c.method === "GET" && /^\/api\/fincas\/7$/.test(c.path)), false);
  });
  await scenario("R5C: IDs inválidos sin consulta y finca ajena/no disponible", { storedToken: token() }, async ({ page, state }) => {
    for (const id of ["01", "0", "4294967296"]) {
      await page.goto(origin + "/fincas/" + id);
      await visible(page.getByText("El identificador de finca no es válido.", { exact: true }));
    }
    assert.equal(state.calls.length, 0);
    await page.goto(origin + "/fincas/8");
    await visible(page.getByText("No encontramos esta finca entre las disponibles para tu sesión.", { exact: true }));
    assert.equal(await page.getByRole("link", { name: "Ver cálculos Manning", exact: true }).count(), 0);
    await screenshot(page, "finca-no-disponible-1280");
  });
  await scenario("R5C: fallo de lectura y consulta manual sin retry automático", { storedToken: token(), width: 320 }, async ({ page, state }) => {
    state.fincasNetwork = true;
    await page.goto(origin + "/fincas/7"); await visible(page.getByRole("alert")); await noOverflow(page);
    assert.equal(state.calls.length, 1); await screenshot(page, "finca-error-320");
    state.fincasNetwork = false;
    await page.getByRole("button", { name: "Volver a consultar", exact: true }).click();
    await visible(page.getByRole("heading", { name: "Finca ensayo", exact: true }));
    assert.equal(state.calls.length, 2);
  });
  for (const status of [401, 403]) {
    await scenario(`R5C: detalle rechaza sesión ${status}`, { storedToken: token() }, async ({ page, state }) => {
      state.authStatus = status; await page.goto(origin + "/fincas/7"); await pathIs(page, "/login");
      assert.equal(await page.evaluate(() => localStorage.getItem("token")), null);
    });
  }
  await scenario("R5C: permiso 403 conserva sesión y error legible", { storedToken: token() }, async ({ page, state }) => {
    state.authStatus = 403; state.authMessage = "No tenés permiso para esta operación.";
    await page.goto(origin + "/fincas/7"); await visible(page.getByRole("alert"));
    assert.match(await page.getByRole("alert").innerText(), /permiso/);
    assert.ok(await page.evaluate(() => localStorage.getItem("token")));
    assert.equal(new URL(page.url()).pathname, "/fincas/7");
  });
  await scenario("R5C: cambiar finca descarta datos y respuestas atrasadas", { storedToken: token() }, async ({ page, state }) => {
    let release;
    state.fincasGate = new Promise(resolve => { release = resolve; });
    await page.goto(origin + "/fincas/7"); await visible(page.getByRole("status"));
    while (!state.calls.length) await page.waitForTimeout(10);
    state.fincasGate = null; state.fincas = [{ id: 8, nombre_finca: "Finca nueva", ubicacion: "San Juan" }];
    await page.evaluate(() => { history.pushState({}, "", "/fincas/8"); dispatchEvent(new PopStateEvent("popstate")); });
    await visible(page.getByRole("heading", { name: "Finca nueva", exact: true }));
    release(); await page.waitForTimeout(100);
    assert.equal(await page.getByText("Finca ensayo", { exact: true }).count(), 0);
    state.fincasGate = new Promise(resolve => { release = resolve; });
    await page.evaluate(() => { history.pushState({}, "", "/fincas/7"); dispatchEvent(new PopStateEvent("popstate")); });
    await visible(page.getByRole("status")); assert.equal(await page.getByText("Finca nueva", { exact: true }).count(), 0);
    release(); await visible(page.getByRole("heading", { name: "Finca no disponible", exact: true }));
  });
  await scenario("R5C: logout durante consulta no restaura datos", { storedToken: token() }, async ({ page, state }) => {
    let release; state.fincasGate = new Promise(resolve => { release = resolve; });
    await page.goto(origin + "/fincas/7"); await visible(page.getByRole("status"));
    await page.getByRole("button", { name: "Cerrar Sesión", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cerrar Sesión", exact: true }).click(); await pathIs(page, "/");
    release(); await page.waitForTimeout(100);
    assert.equal(await page.getByText("Finca ensayo", { exact: true }).count(), 0);
    assert.equal(await page.getByRole("alert").count(), 0);
  });
  for (const path of ["/fincas", "/fincas/7"]) {
    await scenario(`R5C: sesión nueva aísla datos en ${path}`, { storedToken: token() }, async ({ page, state }) => {
      await page.goto(origin + path); await visible(page.getByText("Finca ensayo", { exact: true }).first());
      let release; state.fincasGate = new Promise(resolve => { release = resolve; });
      state.fincas = [{ id: 7, nombre_finca: "Finca de otra sesión", ubicacion: "Salta" }];
      await page.evaluate(value => { localStorage.setItem("token", value); dispatchEvent(new StorageEvent("storage", { key: "token" })); }, token(7200));
      await visible(page.getByRole("status"));
      assert.equal(await page.getByText("Finca ensayo", { exact: true }).count(), 0);
      release(); await visible(page.getByText("Finca de otra sesión", { exact: true }).first());
      assert.equal(await page.getByText("Finca ensayo", { exact: true }).count(), 0);
    });
  }
  await scenario("R5C: respuesta de sesión anterior no reemplaza la actual", { storedToken: token() }, async ({ page, state }) => {
    let release; state.fincasGate = new Promise(resolve => { release = resolve; });
    await page.goto(origin + "/fincas/7"); await visible(page.getByRole("status"));
    while (!state.calls.length) await page.waitForTimeout(10);
    state.fincasGate = null; state.fincas = [{ id: 7, nombre_finca: "Sesión actual", ubicacion: "Córdoba" }];
    await page.evaluate(value => { localStorage.setItem("token", value); dispatchEvent(new StorageEvent("storage", { key: "token" })); }, token(7200));
    await visible(page.getByRole("heading", { name: "Sesión actual", exact: true }));
    release(); await page.waitForTimeout(100);
    assert.equal(await page.getByText("Finca ensayo", { exact: true }).count(), 0);
  });
  for (const width of [1280, 390, 320]) {
    await scenario(`R5C: vistas reales y reflujo a ${width}`, { storedToken: token(), width, touch: width < 768 }, async ({ page, state }) => {
      await page.goto(origin + "/fincas"); await visible(page.getByRole("link", { name: /Finca ensayo/ }));
      await noOverflow(page); await screenshot(page, `mis-fincas-${width}`);
      await page.getByRole("link", { name: /Finca ensayo/ }).click();
      await visible(page.getByRole("heading", { name: "Finca ensayo", exact: true }));
      await noOverflow(page); await screenshot(page, `detalle-finca-${width}`);
      const back = page.getByRole("link", { name: "Volver a Mis fincas", exact: true });
      await back.focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
      assert.equal(await back.evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== "none"), true);
      await page.keyboard.press("Enter"); await pathIs(page, "/fincas");
      await visible(page.getByRole("link", { name: /Finca ensayo/ }));
      let release; state.fincasGate = new Promise(resolve => { release = resolve; });
      await page.getByRole("link", { name: /Finca ensayo/ }).click(); await visible(page.getByRole("status"));
      await noOverflow(page); await screenshot(page, `finca-cargando-${width}`); release();
      await visible(page.getByRole("heading", { name: "Finca ensayo", exact: true }));
    });
  }
  await scenario("R5C: servicios reales con POST, cursor y detalle simulados", { storedToken: token(), serviceHarness: true }, async ({ page, state }) => {
    await page.goto(origin + "/contacto");
    const cursor = " opaco+/=ñ? & ";
    const result = await page.evaluate(async cursor => {
      const api = await import("/__r5c/services/apiService.js");
      const payload = { name: "Escenario de transporte", crop: {}, soil: {}, furrow: { widthM: 1.3 }, irrigation: {} };
      const created = await api.createIrrigationSimulation(7, payload);
      const history = await api.getIrrigationSimulationHistory(7, { limit: 2, cursor });
      const detail = await api.getIrrigationSimulationDetail(7, 22);
      return { created, history, detail };
    }, cursor);
    assert.equal(result.created.model.contractVersion, "irrigation-contract-v1");
    assert.equal(result.history.items[0].model.contractVersion, "irrigation-contract-v1");
    assert.equal(result.history.items[1].model.contractVersion, "irrigation-contract-v2");
    assert.equal(result.detail.model.contractVersion, "irrigation-contract-v2");
    assert.equal(result.history.pagination.nextCursor, "opaque-next-cursor");
    assert.equal(state.calls.length, 3); assert.equal(state.simulationPosts, 1);
    assert.ok(state.calls.every(c => c.authorization?.startsWith("Bearer ")));
    const query = new URLSearchParams(state.calls[1].query); assert.equal(query.get("cursor"), cursor); assert.equal(query.get("limit"), "2");
    assert.equal(state.calls.filter(c => /simulations\/\d+$/.test(c.path)).length, 1);
  });
  for (const [failure, code] of [["network", "NETWORK_ERROR"], ["json", "INVALID_RESPONSE"], ["500", "INTERNAL_ERROR"]]) {
    await scenario(`R5C: POST incierto ${failure} conserva error y no reintenta`, { storedToken: token(), serviceHarness: true }, async ({ page, state }) => {
      state.simulationFailure = failure; await page.goto(origin + "/contacto");
      const error = await page.evaluate(async () => {
        const api = await import("/__r5c/services/apiService.js");
        try { await api.createIrrigationSimulation(7, { crop: {}, soil: {}, furrow: {}, irrigation: {} }); return null; }
        catch (error) { return { code: error.code, status: error.status }; }
      });
      assert.equal(error.code, code); assert.equal(state.simulationPosts, 1); assert.equal(state.calls.length, 1);
    });
  }
} finally { await browser.close(); }
console.log(`Browser: ${passed} PASS / ${failed} FAIL`);
if (failed) process.exitCode = 1;
