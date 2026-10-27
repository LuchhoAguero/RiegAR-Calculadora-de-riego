// R5-F: lecturas autenticadas con API simulada. Cualquier escritura está prohibida.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import v1 from "../test/fixtures/irrigation-v1-snapshot.json" with { type: "json" };
import v2Fixtures from "../src/fixtures/irrigation-v2-results.json" with { type: "json" };
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const origin="http://127.0.0.1:4173",out=process.env.R5F_SCREENSHOTS;
if(out)await mkdir(out,{recursive:true});
const token=(seconds=3600)=>`e30.${Buffer.from(JSON.stringify({exp:Date.now()/1000+seconds,userId:1})).toString("base64url")}.signature`;
const clone=value=>structuredClone(value),detailsPath=(id=101,farm=7)=>`/fincas/${farm}/simulaciones/${id}`;
function snapshot(version,id,farm=7,name){const s=clone(version===1?v1:v2Fixtures[0].snapshot);s.simulation={...s.simulation,id,fincaId:farm,name:name||`${version===1?"Histórico V1":"Escenario V2"} ${id}`};return s;}
function summary(s){return {simulation:clone(s.simulation),model:clone(s.model),summary:{targetDepthMm:s.output.waterNeed.targetDepthMm,appliedVolumeL:s.output.application.appliedVolumeL,applicationEfficiencyPct:s.output.efficiency.applicationEfficiencyPct,diagnostics:{count:s.output.diagnostics.items.length,severities:[...new Set(s.output.diagnostics.items.map(d=>d.severity))]},...(s.model.contractVersion==="irrigation-contract-v2"?{furrowCount:s.input.furrow.furrowCount,totalAppliedVolumeL:s.output.totals.totalAppliedVolumeL}:{})}};}
const pageOf=(items=[],hasMore=false,nextCursor=null)=>({items,pagination:{limit:20,hasMore,nextCursor}});
const cursor="eyJ2IjoxLCJjcmVhdGVkQXQiOiIyMDI2LTEwLTI3VDEyOjAwOjAwLjAwMFoiLCJpZCI6MTgxfQ";
let passed=0,failed=0;const results=[],measurements=[];
async function fixture({width=1280,auth=true}={}){
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<768});if(auth)await context.addInitScript(t=>localStorage.setItem("token",t),token());
 const page=await context.newPage();page.setDefaultTimeout(10000);
 const state={fincas:[{id:7,nombre_finca:"Finca ensayo",ubicacion:"Mendoza"},{id:8,nombre_finca:"Otra finca",ubicacion:"San Juan"}],pages:{7:[pageOf([summary(snapshot(2,202)),summary(snapshot(1,101))])],8:[pageOf([summary(snapshot(1,801,8,"Historia de otra finca"))])]},details:{"7/101":snapshot(1,101),"7/202":snapshot(2,202),"8/801":snapshot(1,801,8)},calls:[],errors:[],writes:[],historyGate:null,detailGate:null,historyStatus:200,detailStatus:200,historyNetwork:false,detailNetwork:false,authMessage:null};
 page.on("pageerror",error=>state.errors.push(error.message));page.on("dialog",dialog=>dialog.accept());
 await context.route("**/*",async route=>{
  const request=route.request(),url=new URL(request.url());if(url.origin===origin)return route.continue();if(url.origin!=="http://localhost:4000")return route.abort();
  state.calls.push({path:url.pathname,query:url.search,method:request.method()});
  if(request.method()!=="GET"){state.writes.push(url.pathname);return route.abort();}
  const reply=(value,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(value)});
  if(url.pathname==="/api/fincas")return reply(clone(state.fincas));
  const match=url.pathname.match(/^\/api\/fincas\/(\d+)\/irrigation-simulations(?:\/(\d+))?$/);assert.ok(match,"Solo endpoints reales");
  const farm=match[1],id=match[2],kind=id?"detail":"history",status=state[kind+"Status"],network=state[kind+"Network"],gate=state[kind+"Gate"];
  const body=clone(id?state.details[`${farm}/${id}`]:state.pages[farm]?.[url.searchParams.has("cursor")?1:0]);
  if(gate)await gate;if(network)return route.abort("failed");
  if(status!==200||!body)return reply({error:state.authMessage||(status===401?"Acceso denegado: No se proporcionó token.":status===403?"No tenés permiso para consultar.":"Recurso no encontrado o no tienes permiso."),code:status===404?"RESOURCE_NOT_FOUND":"READ_ERROR"},body?status:404);
  return reply(body);
 });
 return {context,page,state};
}
async function scenario(name,options,check){
 if(process.env.R5F_FILTER&&!name.includes(process.env.R5F_FILTER))return;
 const f=await fixture(options);
 try{await check(f);assert.deepEqual(f.state.errors,[]);assert.deepEqual(f.state.writes,[]);passed++;results.push({name,result:"PASS",apiGets:f.state.calls.length,apiWrites:0});console.log("PASS "+name);}
 catch(error){failed++;results.push({name,result:"FAIL",message:error.message});console.error(`FAIL ${name} [${f.page.url()}]: ${error.message}`);}
 finally{await f.context.close();}
}
const visible=locator=>locator.waitFor({state:"visible"});
const paths=state=>state.calls.filter(call=>call.path.endsWith("irrigation-simulations"));
const detailCalls=state=>state.calls.filter(call=>/irrigation-simulations\/\d+$/.test(call.path));
const historyReady=page=>visible(page.getByRole("status").filter({hasText:"No hay más simulaciones para mostrar."}));
async function openHistory(page,farm=7){await page.goto(origin+`/fincas/${farm}`);await visible(page.getByRole("heading",{name:"Historial de simulaciones de riego",exact:true}));}
async function openDetail(page,id=101,farm=7){await page.goto(origin+detailsPath(id,farm));await visible(page.getByRole("article",{name:id===101?"Resultados históricos de riego V1":"Resultados de riego por surcos V2",exact:true}));}
async function noOverflow(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
async function shot(page,name){if(!out)return;await page.evaluate(()=>{scrollTo(0,0);return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await page.screenshot({path:`${out}/${name}.png`,fullPage:true,animations:"disabled"});measurements.push({name,...await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth}))});}
async function waitCalls(page,state,kind,count){for(let i=0;i<300&&(kind==="history"?paths(state):detailCalls(state)).length<count;i++)await page.waitForTimeout(10);assert.ok((kind==="history"?paths(state):detailCalls(state)).length>=count);}
async function changeSession(page){await page.evaluate(value=>{localStorage.setItem("token",value);dispatchEvent(new StorageEvent("storage",{key:"token"}));},token(7200));}
function pagination(state){
 const item=(version,id)=>{const s=snapshot(version,id);s.simulation.createdAt="2026-10-27T12:00:00.000Z";return summary(s);};
 state.pages[7]=[pageOf(Array.from({length:20},(_,i)=>item(i%2?1:2,200-i)),true,cursor),pageOf([item(1,181),item(2,180),item(1,179),item(1,179)])];
}

try{
 await scenario("Rutas autenticadas y prioridad de nueva sin POST",{auth:false},async({page,state})=>{
  for(const path of ["/fincas/7",detailsPath(),"/fincas/7/simulaciones/nueva"]){await page.goto(origin+path);await page.waitForURL(origin+"/login");}assert.equal(state.calls.length,0);
 });
 await scenario("IDs inválidos no consultan; nueva conserva bloqueo productivo",{},async({page,state})=>{
  for(const path of [detailsPath("01"),detailsPath("0"),detailsPath(101,"4294967296")]){await page.goto(origin+path);await visible(page.getByRole("alert"));}assert.equal(state.calls.length,0);
  await page.goto(origin+"/fincas/7/simulaciones/nueva");await visible(page.getByRole("heading",{name:"Simulación en preparación",exact:true}));assert.equal(state.calls.length,0);
 });
 await scenario("Historial vacío y Manning accesible",{width:320},async({page,state})=>{
  state.pages[7]=[pageOf()];await openHistory(page);await visible(page.getByText("Todavía no hay simulaciones de riego guardadas para esta finca.",{exact:true}));
  await visible(page.getByRole("link",{name:"Ver cálculos Manning",exact:true}));assert.equal(detailCalls(state).length,0);await noOverflow(page);await shot(page,"historial-vacio-320");
 });
 await scenario("Mixto usa solo summary, sin DETAIL por tarjeta",{},async({page,state})=>{
  await openHistory(page);await historyReady(page);assert.equal(await page.locator("[data-simulation]").count(),2);assert.equal(detailCalls(state).length,0);assert.equal(paths(state).length,1);
  assert.equal(await page.locator('[data-simulation="101"] [data-summary]').count(),0);assert.equal(await page.locator('[data-simulation="202"] [data-summary]').count(),2);
  assert.equal(new URLSearchParams(paths(state)[0].query).get("limit"),"20");
 });
 await scenario("Paginación opaca, doble activación, orden y deduplicación",{},async({page,state})=>{
  pagination(state);await openHistory(page);await visible(page.getByRole("button",{name:"Cargar más simulaciones",exact:true}));
  let release;state.historyGate=new Promise(r=>release=r);
  await page.getByRole("button",{name:"Cargar más simulaciones",exact:true}).evaluate(button=>{button.click();button.click();});await waitCalls(page,state,"history",2);
  assert.equal(paths(state).length,2);assert.equal(new URLSearchParams(paths(state)[1].query).get("cursor"),cursor);release();await historyReady(page);
  assert.deepEqual(await page.locator("[data-simulation]").evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.simulation))),[...Array.from({length:20},(_,i)=>200-i),180,179]);assert.equal(detailCalls(state).length,0);
 });
 await scenario("Error de más resultados conserva filas y reintenta cursor correcto",{},async({page,state})=>{
  pagination(state);await openHistory(page);await visible(page.getByRole("button",{name:"Cargar más simulaciones",exact:true}));state.historyStatus=500;
  await page.getByRole("button",{name:"Cargar más simulaciones",exact:true}).click();await visible(page.getByRole("alert"));assert.equal(await page.locator("[data-simulation]").count(),20);assert.equal(paths(state).length,2);
  state.historyStatus=200;await page.getByRole("button",{name:"Volver a consultar historial",exact:true}).click();await historyReady(page);assert.equal(new URLSearchParams(paths(state)[2].query).get("cursor"),cursor);
  await page.getByRole("button",{name:"Actualizar historial",exact:true}).click();await visible(page.getByRole("button",{name:"Cargar más simulaciones",exact:true}));assert.equal(await page.locator("[data-simulation]").count(),20);assert.equal(new URLSearchParams(paths(state)[3].query).has("cursor"),false);
 });
 await scenario("Cargar más con teclado enfoca el primer resultado nuevo",{},async({page,state})=>{
  pagination(state);await openHistory(page);const button=page.getByRole("button",{name:"Cargar más simulaciones",exact:true});await visible(button);await button.focus();await page.keyboard.press("Enter");await historyReady(page);
  await page.waitForFunction(()=>document.activeElement?.getAttribute("href")==="/fincas/7/simulaciones/180");
  assert.equal(await page.getByRole("link",{name:"Ver resultado de Escenario V2 180",exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle!=="none"),true);assert.equal(paths(state).length,2);
 });
 await scenario("Cursor repetido detiene avance, sin ciclo automático",{},async({page,state})=>{
  pagination(state);state.pages[7][1].pagination={limit:20,hasMore:true,nextCursor:cursor};await openHistory(page);await page.getByRole("button",{name:"Cargar más simulaciones",exact:true}).click();
  await visible(page.getByRole("alert"));assert.match(await page.getByRole("alert").innerText(),/no avanzó/);assert.equal(paths(state).length,2);assert.equal(await page.locator("[data-simulation]").count(),20);
 });
 await scenario("Actualización fallida se reintenta desde primera página",{},async({page,state})=>{
  pagination(state);await openHistory(page);await visible(page.getByRole("button",{name:"Cargar más simulaciones",exact:true}));state.historyNetwork=true;
  await page.getByRole("button",{name:"Actualizar historial",exact:true}).click();await visible(page.getByRole("alert"));state.historyNetwork=false;
  await page.getByRole("button",{name:"Volver a consultar historial",exact:true}).click();await visible(page.getByRole("button",{name:"Cargar más simulaciones",exact:true}));assert.equal(new URLSearchParams(paths(state).at(-1).query).has("cursor"),false);
 });
 await scenario("404 tras carga elimina datos anteriores sin revelar ownership",{},async({page,state})=>{
  await openHistory(page);await historyReady(page);state.historyStatus=404;await page.getByRole("button",{name:"Actualizar historial",exact:true}).click();await visible(page.getByRole("alert"));assert.equal(await page.locator("[data-simulation]").count(),0);assert.match(await page.getByRole("alert").innerText(),/no está disponible/);
 });
 await scenario("Acceso directo V1, recarga, 14 magnitudes y ancho original",{},async({page,state})=>{
  await openDetail(page);await page.reload();await visible(page.getByRole("article",{name:"Resultados históricos de riego V1",exact:true}));
  const metrics=await page.locator("[data-metric]").evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.metric))]);assert.equal(metrics.length,14);assert.ok(!metrics.some(p=>p.startsWith("totals.")||p.includes("daysUntil")));
  await page.getByText("Ver datos de entrada almacenados",{exact:true}).click();await visible(page.getByText("Ancho del surco (contrato V1) (m)",{exact:true}));assert.equal(await page.getByText("Cantidad de surcos (surcos)",{exact:true}).count(),0);assert.equal(paths(state).length,0);assert.equal(detailCalls(state).length,2);
 });
 await scenario("Historial a V2, volver con foco al historial y atrás/adelante",{},async({page,state})=>{
  await openHistory(page);await page.getByRole("link",{name:"Ver resultado de Escenario V2 202",exact:true}).click();await visible(page.getByRole("article",{name:"Resultados de riego por surcos V2",exact:true}));
  assert.equal(new Set(await page.locator("[data-metric]").evaluateAll(n=>n.map(x=>x.dataset.metric))).size,19);
  await page.reload();await visible(page.getByRole("article",{name:"Resultados de riego por surcos V2",exact:true}));
  await page.getByRole("link",{name:"Volver al historial de la finca",exact:true}).click();await historyReady(page);assert.equal(await page.locator("#historial-simulaciones").evaluate(el=>el===document.activeElement),true);
  await page.goBack();await visible(page.getByRole("article",{name:"Resultados de riego por surcos V2",exact:true}));await page.goForward();await historyReady(page);
 });
 await scenario("Contrato desconocido no se interpreta por campos V2",{},async({page,state})=>{
  state.details["7/202"].model.contractVersion="irrigation-contract-v99";await page.goto(origin+detailsPath(202));await visible(page.getByRole("heading",{name:"Versión contractual no soportada",exact:true}));assert.equal(await page.locator("[data-metric]").count(),0);
  await shot(page,"version-no-soportada-1280");
 });
 await scenario("V2 leído por DETAIL conserva null y precisión",{},async({page,state})=>{
  const zero=clone(v2Fixtures.find(f=>f.id==="zero").snapshot);zero.simulation={...zero.simulation,id:303,fincaId:7};state.details["7/303"]=zero;
  await page.goto(origin+detailsPath(303));await visible(page.getByRole("article",{name:"Resultados de riego por surcos V2",exact:true}));assert.equal(await page.getByText("No aplica",{exact:true}).count(),2);
  await page.locator('summary[aria-label="Ver valor completo de Infiltración estimada al inicio"]').click();await visible(page.getByText("49,29503017546495 mm",{exact:true}));assert.equal(detailCalls(state).length,1);
 });
 await scenario("Summary desconocido no muestra métricas inferidas",{},async({page,state})=>{
  state.pages[7][0].items[0].model.contractVersion="irrigation-contract-v99";await openHistory(page);await historyReady(page);
  const card=page.locator('[data-simulation="202"]');await visible(card.getByText("Versión no soportada",{exact:true}));assert.equal(await card.getByText("Lámina objetivo",{exact:true}).count(),0);assert.equal(await card.locator("[data-summary]").count(),0);assert.equal(detailCalls(state).length,0);
 });
 await scenario("Detalle inválido o de otro recurso no muestra datos",{},async({page,state})=>{
  state.details["7/101"].simulation.fincaId=8;state.details["7/101"].simulation.name="Nombre ajeno no visible";await page.goto(origin+detailsPath());await visible(page.getByRole("alert"));assert.equal(await page.getByText("Nombre ajeno no visible",{exact:true}).count(),0);
  state.details["7/101"]=snapshot(1,101);delete state.details["7/101"].output.application.appliedVolumeL;await page.reload();await visible(page.getByRole("alert"));assert.equal(await page.locator("[data-metric]").count(),0);
 });
 await scenario("Historial inválido no filtra ni muestra resumen ajeno",{},async({page,state})=>{
  state.pages[7][0].items[0].simulation.fincaId=8;await openHistory(page);await visible(page.getByRole("alert"));assert.equal(await page.locator("[data-simulation]").count(),0);
 });
 for(const kind of ["history","detail"]){
  for(const status of [401,403,404,500])await scenario(`${kind}: error ${status} contractual`,{},async({page,state})=>{
    state[kind+"Status"]=status;await page.goto(origin+(kind==="history"?"/fincas/7":detailsPath()));
    if(status===401){await page.waitForURL(origin+"/login");assert.equal(await page.evaluate(()=>localStorage.getItem("token")),null);}else{await visible(page.getByRole("alert"));assert.ok(await page.evaluate(()=>localStorage.getItem("token")));if(status===404)await shot(page,`${kind}-error-1280`);}
  });
 }
 await scenario("403 de token inválido invalida sin mostrar resultado",{},async({page,state})=>{state.detailStatus=403;state.authMessage="Token inválido o expirado.";await page.goto(origin+detailsPath());await page.waitForURL(origin+"/login");});
 await scenario("Fallo de red DETAIL solo reintenta por acción explícita",{},async({page,state})=>{state.detailNetwork=true;await page.goto(origin+detailsPath());await visible(page.getByRole("alert"));assert.equal(detailCalls(state).length,1);state.detailNetwork=false;await page.getByRole("button",{name:"Volver a consultar",exact:true}).click();await visible(page.getByRole("article",{name:"Resultados históricos de riego V1",exact:true}));assert.equal(detailCalls(state).length,2);});
 await scenario("Historial de otra finca descarta respuesta atrasada",{},async({page,state})=>{
  let release;state.historyGate=new Promise(r=>release=r);await openHistory(page);await waitCalls(page,state,"history",1);state.historyGate=null;
  await shot(page,"historial-cargando-1280");
  await page.getByRole("navigation",{name:"Navegación principal"}).getByRole("link",{name:"Mis fincas",exact:true}).click();await page.getByRole("link",{name:/Otra finca.*Abrir finca/}).click();await historyReady(page);release();await page.waitForTimeout(100);
  await visible(page.getByText("Historia de otra finca",{exact:true}));assert.equal(await page.getByText("Histórico V1 101",{exact:true}).count(),0);
 });
 await scenario("Sesión nueva limpia historial antes de responder",{},async({page,state})=>{
  await openHistory(page);await historyReady(page);let release;state.historyGate=new Promise(r=>release=r);state.pages[7]=[pageOf([summary(snapshot(1,501,7,"Historial sesión nueva"))])];
  await changeSession(page);await visible(page.getByText("Cargando simulaciones guardadas...",{exact:true}));assert.equal(await page.locator("[data-simulation]").count(),0);release();await historyReady(page);await visible(page.getByText("Historial sesión nueva",{exact:true}));
 });
 await scenario("401 atrasado no invalida sesión nueva ni reemplaza historial",{},async({page,state})=>{
  let release;state.historyGate=new Promise(r=>release=r);state.historyStatus=401;await openHistory(page);await waitCalls(page,state,"history",1);state.historyGate=null;state.historyStatus=200;state.pages[7]=[pageOf([summary(snapshot(1,501,7,"Sesión vigente"))])];
  await changeSession(page);await historyReady(page);release();await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>localStorage.getItem("token")));await visible(page.getByText("Sesión vigente",{exact:true}));
 });
 await scenario("DETAIL de sesión anterior no aparece en sesión actual",{},async({page,state})=>{
  let release;state.detailGate=new Promise(r=>release=r);await page.goto(origin+detailsPath());await waitCalls(page,state,"detail",1);state.detailGate=null;state.details["7/101"].simulation.name="Detalle nueva sesión";
  await changeSession(page);await visible(page.getByText("Detalle nueva sesión",{exact:true}));release();await page.waitForTimeout(100);assert.equal(await page.getByText("Histórico V1 101",{exact:true}).count(),0);
 });
 await scenario("Cambio de simulación ignora DETAIL pendiente",{},async({page,state})=>{
  await openHistory(page);let release;state.detailGate=new Promise(r=>release=r);await page.getByRole("link",{name:"Ver resultado de Histórico V1 101",exact:true}).click();await waitCalls(page,state,"detail",1);state.detailGate=null;
  await page.getByRole("link",{name:"Volver al historial de la finca",exact:true}).click();await page.getByRole("link",{name:"Ver resultado de Escenario V2 202",exact:true}).click();await visible(page.getByRole("article",{name:"Resultados de riego por surcos V2",exact:true}));release();await page.waitForTimeout(100);assert.equal(await page.getByRole("article",{name:"Resultados históricos de riego V1",exact:true}).count(),0);
 });
 await scenario("Logout con lectura pendiente no restaura información",{},async({page,state})=>{
  let release;state.detailGate=new Promise(r=>release=r);await page.goto(origin+detailsPath());await waitCalls(page,state,"detail",1);await page.getByRole("button",{name:"Cerrar Sesión",exact:true}).click();await page.getByRole("dialog").getByRole("button",{name:"Cerrar Sesión",exact:true}).click();await page.waitForURL(origin+"/");release();await page.waitForTimeout(100);assert.equal(await page.getByText("Histórico V1 101",{exact:true}).count(),0);
 });
 for(const width of [1280,390,320])await scenario(`Historia y ambos detalles responsive ${width}`,{width},async({page,state})=>{
  await openHistory(page);await historyReady(page);await noOverflow(page);await shot(page,`historial-${width}`);
  await page.getByRole("link",{name:"Ver resultado de Histórico V1 101",exact:true}).click();await visible(page.getByRole("article",{name:"Resultados históricos de riego V1",exact:true}));await noOverflow(page);await shot(page,`detalle-v1-${width}`);
  assert.equal(await page.getByRole("heading",{level:1}).evaluate(el=>el===document.activeElement),true);
  await page.getByRole("link",{name:"Volver al historial de la finca",exact:true}).click();await historyReady(page);await page.getByRole("link",{name:"Ver resultado de Escenario V2 202",exact:true}).click();await visible(page.getByRole("article",{name:"Resultados de riego por surcos V2",exact:true}));await noOverflow(page);await shot(page,`detalle-v2-${width}`);
  assert.equal(await page.getByRole("button",{name:/guardar|editar|eliminar|recalcular/i}).count(),0);
 });
}finally{await browser.close();}
if(out)await writeFile(`${out}/qa.json`,JSON.stringify({passed,failed,results,measurements,realBackendCalls:0,apiWrites:0},null,2));
console.log(`R5-F navegador: ${passed} PASS / ${failed} FAIL; API simulada, cero escrituras.`);if(failed)process.exitCode=1;
