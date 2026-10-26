// Prueba de la build con API simulada; jamás conecta al backend real.
// node scripts/verify-r5-a1-browser.mjs <ruta absoluta a playwright/index.mjs>
// Requiere preview en http://127.0.0.1:4173 y Microsoft Edge instalado.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : "playwright");
const browser = await chromium.launch({ executablePath: process.env.R5A1_BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const origin = "http://127.0.0.1:4173";
const token = (seconds = 3600) => `e30.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + seconds, userId: 1 })).toString("base64url")}.signature`;
let passed = 0, failed = 0;
if (process.env.R5A1_SCREENSHOTS) await mkdir(process.env.R5A1_SCREENSHOTS, { recursive: true });
async function screenshot(page, name) {
  if (process.env.R5A1_SCREENSHOTS) await page.screenshot({ path: `${process.env.R5A1_SCREENSHOTS}/${name}.png`, fullPage: true, animations: "disabled" });
}

async function fixture({ storedToken = null, width = 1280 } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  if (storedToken) await context.addInitScript(value => localStorage.setItem("token", value), storedToken);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  if (process.env.R5A1_DEBUG) page.on("framenavigated", frame => console.log("navigation", frame.url()));
  const state = { fincas: [{ id: 7, nombre_finca: "Finca ensayo", ubicacion: "Mendoza" }], calculos: [], calls: [], errors: [], authStatus: null, contactStatus: 200, contactGate: null, deleteConflict: false };
  page.on("pageerror", error => state.errors.push(error.message));
  page.on("dialog", dialog => dialog.accept());
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin) return route.continue();
    if (url.origin !== "http://localhost:4000") return route.abort();
    const path = url.pathname, method = request.method();
    const data = request.postData() ? JSON.parse(request.postData()) : null;
    state.calls.push({ path, method, data });
    const reply = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (state.authStatus && path.startsWith("/api/fincas")) return reply({ error: state.authStatus === 403 ? "Token inválido o expirado." : "Acceso denegado: No se proporcionó token." }, state.authStatus);
    if (path === "/api/login") return reply(state.loginInvalid ? { error: "Credenciales inválidas." } : { token: state.loginToken || token() }, state.loginInvalid ? 401 : 200);
    if (path === "/api/register") return reply({ message: "Usuario registrado con éxito en la base de datos.", userId: 1 }, 201);
    if (path === "/api/contact") {
      if (state.contactGate) await state.contactGate;
      if (state.contactStatus === "network") return route.abort("failed");
      return reply(state.contactStatus === 200 ? { message: "Correo enviado con éxito." } : { error: "No se pudo enviar el correo." }, state.contactStatus);
    }
    if (path === "/api/fincas") {
      if (method === "GET") return reply(state.fincas);
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
    for (const path of ["/dashboard", "/finca/7", "/finca/7/nuevo-calculo"]) { await page.goto(origin + path); await pathIs(page, "/login"); }
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
    await pathIs(page, "/dashboard"); await visible(page.getByRole("link", { name: /Finca ensayo/ }));
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
    await page.getByLabel("Nombre de la Finca (*)", { exact: true }).fill("Segunda finca");
    await page.getByRole("button", { name: "Guardar Finca", exact: true }).click();
    await visible(page.getByRole("link", { name: /Segunda finca/ }));
    await page.getByRole("button", { name: "Editar finca Finca ensayo", exact: true }).click();
    const dialog = page.getByRole("dialog"); await visible(dialog);
    await dialog.getByLabel("Nombre de la Finca", { exact: true }).fill("Finca editada");
    await dialog.getByRole("button", { name: "Guardar Cambios" }).click();
    await visible(page.getByRole("link", { name: /Finca editada/ }));
    assert.equal(new URL(page.url()).pathname, "/dashboard");
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
    await page.getByRole("link", { name: "Calculadora", exact: true }).focus();
    await page.keyboard.press("Escape"); assert.equal(await menu.evaluate(node => node === document.activeElement), true);
    await noOverflow(page);
    await page.getByRole("button", { name: "Editar finca Finca ensayo", exact: true }).click();
    await visible(page.getByRole("dialog")); await noOverflow(page);
    const box = await page.getByRole("dialog").boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= 375);
    await screenshot(page, "modal-mobile");
    await page.keyboard.press("Escape");
    for (const path of ["/login", "/registro", "/contacto"]) { await page.goto(origin + path); await noOverflow(page); }
  });
} finally { await browser.close(); }
console.log(`Browser: ${passed} PASS / ${failed} FAIL`);
if (failed) process.exitCode = 1;
