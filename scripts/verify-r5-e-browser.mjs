// DEV resultados y producción. La demostración no puede llamar a ninguna API.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import fixtures from "../src/fixtures/irrigation-v2-results.json" with { type: "json" };
import { METRICS } from "../src/utils/irrigationV2Results.js";
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const dev = "http://127.0.0.1:4174", production = "http://127.0.0.1:4173", path = "/desarrollo/resultados-v2";
const out = process.env.R5E_SCREENSHOTS;
if (out) await mkdir(out, { recursive: true });
const token = () => `e30.${Buffer.from(JSON.stringify({ exp: Date.now()/1000+3600,userId:1 })).toString("base64url")}.signature`;
let passed=0, failed=0;const results=[],measurements=[],contrasts=[];
async function scenario(name,{width=1280,auth=true,origin=dev}={},check){
  if(process.env.R5E_FILTER&&!name.includes(process.env.R5E_FILTER))return;
  const context=await browser.newContext({viewport:{width,height:900}});
  if(auth)await context.addInitScript(value=>localStorage.setItem("token",value),token());
  const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[],api=[];
  page.on("pageerror",error=>errors.push(error.message));
  await context.route("**/*",route=>{const url=new URL(route.request().url());if(url.origin===origin)return route.continue();api.push({origin:url.origin,method:route.request().method()});return route.abort();});
  try{await check(page,origin);assert.deepEqual(errors,[]);assert.deepEqual(api,[]);passed++;results.push({name,result:"PASS",apiCalls:0});console.log("PASS "+name);}
  catch(error){failed++;results.push({name,result:"FAIL",message:error.message});console.error(`FAIL ${name} [${page.url()}]: ${error.message}`);}
  finally{await context.close();}
}
const visible=locator=>locator.waitFor({state:"visible"});
const noOverflow=async page=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
async function open(page){await page.goto(dev+path);await visible(page.getByRole("article",{name:"Resultados de riego por surcos V2",exact:true}));}
async function choose(page,id){await page.getByLabel("Caso de demostración",{exact:true}).selectOption(id);}
async function shot(page,name){
  if(!out)return;
  await page.evaluate(()=>{scrollTo(0,0);return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  await page.screenshot({path:`${out}/${name}.png`,fullPage:true,animations:"disabled"});
  measurements.push({name,...await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth}))});
}
async function contrast(locator,label,background){
  const pair=await locator.evaluate((element,background)=>{const css=getComputedStyle(element),parse=c=>c.match(/[\d.]+/g).map(Number);return{fg:parse(css.color),bg:parse(background||css.backgroundColor)};},background);
  const lum=rgb=>{const c=rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
  const [low,high]=[lum(pair.fg),lum(pair.bg)].sort((a,b)=>a-b),ratio=(high+.05)/(low+.05);assert.ok(ratio>=4.5,label);contrasts.push({label,ratio:+ratio.toFixed(2)});
}

try{
  await scenario("Demostración protegida sin sesión",{auth:false},async page=>{await page.goto(dev+path);await page.waitForURL(dev+"/login");});
  await scenario("Producción excluye demostración y fixtures",{origin:production},async page=>{
    await page.goto(production+path);await visible(page.locator("main"));assert.equal(await page.locator("[data-metric],#results-demo-case,#results-demo-label").count(),0);
  });
  await scenario("19 magnitudes V2, unidades y mensajes originales",{},async page=>{
    await open(page);assert.equal(await page.getByRole("heading",{level:1}).count(),1);
    const paths=await page.locator("[data-metric]").evaluateAll(nodes=>[...new Set(nodes.map(node=>node.dataset.metric))]);assert.deepEqual(paths.sort(),METRICS.map(m=>m.path).sort());
    for(const metric of METRICS)assert.ok((await page.locator(`[data-metric="${metric.path}"]`).first().innerText()).includes(metric.unit));
    for(const item of fixtures[0].snapshot.output.diagnostics.items)await visible(page.getByText(item.message,{exact:true}));
    assert.match(await page.locator('[data-metric="totals.totalAppliedVolumeL"]').innerText(),/116\.640/);
    assert.match(await page.locator('[data-metric="totals.totalAppliedVolumeM3"]').innerText(),/116,64/);
    assert.equal(await page.getByRole("button",{name:/guardar|recalcular|eliminar/i}).count(),0);
  });
  await scenario("Precisión completa accesible y evidencia técnica",{width:390},async page=>{
    await open(page);const summary=page.locator('summary[aria-label="Ver valor completo de Infiltración estimada al inicio"]');
    await summary.focus();await page.keyboard.press("Enter");await visible(page.getByText("49,29503017546495 mm",{exact:true}));
    await page.getByText("Información técnica de P02",{exact:true}).click();await visible(page.getByText(/infiltratedDepthEndMm.*45/));
    await noOverflow(page);await shot(page,"tecnico-390");
  });
  await scenario("Navegación de teclado, foco y select anunciado",{},async page=>{
    await open(page);const select=page.getByLabel("Caso de demostración",{exact:true});await select.focus();
    await page.keyboard.press("ArrowDown");await page.keyboard.press("Enter");assert.equal(await select.inputValue(),"zero");
    assert.equal(await select.getAttribute("aria-describedby"),"results-demo-description");
    await page.keyboard.press("Escape");await select.focus();await page.keyboard.press("Tab");const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle}));assert.equal(focus.tag,"SUMMARY");assert.notEqual(focus.outline,"none");
  });
  await scenario("Fixture original inmutable tras recorrer todos los casos",{},async page=>{
    await open(page);
    const before=await page.evaluate(async()=>{const {default:data}=await import("/src/fixtures/irrigation-v2-results.json?import");const freeze=value=>{if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}};freeze(data);return data;});assert.deepEqual(before,fixtures);
    for(const id of ["zero","multiple","none","small","incomplete","unsupported","fatal","golden"])await choose(page,id);
    const after=await page.evaluate(async()=>(await import("/src/fixtures/irrigation-v2-results.json?import")).default);assert.deepEqual(after,fixtures);
  });
  for(const width of [1280,390,320]){
    await scenario(`Referencia, ceros, null y múltiples diagnósticos a ${width}`,{width},async page=>{
      await open(page);await noOverflow(page);await shot(page,`referencia-${width}`);
      await contrast(page.locator('[data-diagnostic="P02"]'),`Advertencia ${width}`);
      await contrast(page.locator('[data-metric="totals.totalAppliedVolumeM3"] p').first(),`Total agua ${width}`,"rgb(11, 93, 120)");
      await choose(page,"zero");await visible(page.getByText("No aplica",{exact:true}).first());assert.equal(await page.getByText("No aplica",{exact:true}).count(),2);
      assert.match(await page.locator('[data-metric="waterNeed.dailyCropWaterUseMmPerDay"]').innerText(),/0/);
      await noOverflow(page);await shot(page,`consumo-cero-${width}`);
      await choose(page,"multiple");assert.equal(await page.locator('[data-diagnostic="P03"]').count(),3);assert.equal(await page.locator('[data-diagnostic="P05"]').count(),3);
      assert.equal(await page.locator('[data-diagnostic="P01"]').count(),1);await contrast(page.locator('[data-diagnostic="P03"]').first(),`Información ${width}`);
      await noOverflow(page);await shot(page,`diagnosticos-multiples-${width}`);
    });
  }
  await scenario("Sin diagnósticos: estado neutro, no certificación",{width:320},async page=>{
    await open(page);await choose(page,"none");await visible(page.getByText("No se recibieron diagnósticos en estos resultados. Esto no certifica que el riego sea seguro u óptimo.",{exact:true}));
    assert.equal(await page.locator("[data-diagnostic]").count(),0);await noOverflow(page);await shot(page,"sin-diagnosticos-320");
  });
  await scenario("Decimales pequeños no se convierten visualmente a cero",{width:320},async page=>{
    await open(page);await choose(page,"small");const text=await page.locator('[data-metric="waterNeed.dailyCropWaterUseMmPerDay"]').innerText();assert.match(text,/1E-10/);await noOverflow(page);await shot(page,"decimales-pequenos-320");
  });
  for(const [id,title] of [["incomplete","No se pueden presentar estos resultados"],["unsupported","Versión contractual no soportada"],["fatal","No se pueden presentar estos resultados"]]){
    await scenario(`Caso negativo ${id} sin magnitudes ni fallback`,{width:320},async page=>{
      await open(page);await choose(page,id);await visible(page.getByRole("heading",{name:title,exact:true}));await visible(page.getByRole("alert"));
      assert.equal(await page.locator("[data-metric]").count(),0);
      if(id==="fatal"){await visible(page.getByRole("heading",{name:"P02 · Error",exact:true}));await contrast(page.locator('[data-severity="error"]'),"Error fatal");}
      await noOverflow(page);await shot(page,`${id}-320`);
    });
  }
}finally{await browser.close();}
if(out)await writeFile(`${out}/qa.json`,JSON.stringify({passed,failed,results,measurements,contrasts,realBackendCalls:0,apiCalls:0},null,2));
console.log(`R5-E navegador: ${passed} PASS / ${failed} FAIL; demostración sin API ni POST.`);if(failed)process.exitCode=1;
