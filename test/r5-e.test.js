import test from "node:test";
import assert from "node:assert/strict";
import fixtures from "../src/fixtures/irrigation-v2-results.json" with { type: "json" };
import { METRICS, RULE_IDS, inspectV2Snapshot, formatResult, valueAt } from "../src/utils/irrigationV2Results.js";
const base = () => structuredClone(fixtures[0].snapshot);
function assign(snapshot, path, value) { const parts = path.split("."), key = parts.pop(); valueAt(snapshot,parts.join("."))[key] = value; }
function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }

for (const fixture of fixtures) test(`Fixture V2 ${fixture.id} sin reinterpretar`, () => assert.equal(inspectV2Snapshot(freeze(structuredClone(fixture.snapshot))).status,"supported"));
test("19 magnitudes, ninguna cantidad de surcos inventada como output", () => {
  assert.equal(METRICS.length,19);assert.equal(new Set(METRICS.map(m=>m.path)).size,19);
  assert.ok(!METRICS.some(m=>m.path.includes("furrowCount")));
  const snapshot=base();for(const metric of METRICS)assert.equal(valueAt(snapshot.metadata.units.output,metric.path),metric.canonicalUnit||metric.unit);
});
for (const metric of METRICS) test(`Propiedad obligatoria ${metric.path}`, () => {
  const snapshot=base(),[group,key]=metric.path.split(".");delete snapshot.output[group][key];assert.equal(inspectV2Snapshot(snapshot).status,"invalid");
});
for (const metric of METRICS) test(`Dominio y no coerción ${metric.path}`, () => {
  for(const value of [-1,"1",Infinity,NaN,undefined]) {const snapshot=base();assign(snapshot,"output."+metric.path,value);assert.equal(inspectV2Snapshot(snapshot).status,"invalid");}
  if(!metric.nullable){const snapshot=base();assign(snapshot,"output."+metric.path,null);assert.equal(inspectV2Snapshot(snapshot).status,"invalid");}
  if(metric.positive){const snapshot=base();assign(snapshot,"output."+metric.path,0);assert.equal(inspectV2Snapshot(snapshot).status,"invalid");}
});
test("Nullable solo en los dos días, condicionado a consumo diario",()=>{
  const zero=structuredClone(fixtures.find(f=>f.id==="zero").snapshot);
  assert.equal(zero.output.waterNeed.dailyCropWaterUseMmPerDay,0);
  assert.equal(zero.output.soilWater.daysUntilAvailableWaterExhaustion,null);
  assert.equal(zero.output.soilWater.daysUntilDepletionThreshold,null);
  for(const path of METRICS.filter(m=>m.nullable).map(m=>m.path)){
    const wrong=base();assign(wrong,"output."+path,null);assert.equal(inspectV2Snapshot(wrong).status,"invalid");
    const wrongZero=structuredClone(zero);assign(wrongZero,"output."+path,0);assert.equal(inspectV2Snapshot(wrongZero).status,"invalid");
  }
});
test("Cero autorizado en objetivo, eficiencia y lámina, sin defaults",()=>{
  const snapshot=structuredClone(fixtures.find(f=>f.id==="zero").snapshot);snapshot.output.efficiency.applicationEfficiencyPct=0;snapshot.output.application.infiltratedDepthEndMm=0;
  assert.equal(inspectV2Snapshot(snapshot).status,"supported");assert.equal(formatResult(0).text,"0");
});
for(const version of ["irrigation-contract-v1","irrigation-contract-v99",""]) test(`Versión ${version} sin fallback por campos presentes`,()=>{const s=base();s.model.contractVersion=version;assert.equal(inspectV2Snapshot(s).status,"unsupported");});
for(const path of ["model","input","output","metadata","simulation"]) test(`Envelope incompleto ${path}`,()=>{const s=base();delete s[path];assert.equal(inspectV2Snapshot(s).status,"invalid");});
for(const path of ["metadataSchemaVersion","effectiveParameters","units","assumptions","evidenceState","referenceVersions","implementationReference","diagnosticRules","parameterProvenance"]) test(`Metadata incompleta ${path}`,()=>{const s=base();delete s.metadata[path];assert.equal(inspectV2Snapshot(s).status,"invalid");});
test("Metadata anidada y unidades incoherentes no se completan",()=>{
  const s=base();delete s.metadata.assumptions.initialMoisture;assert.equal(inspectV2Snapshot(s).status,"invalid");
  const u=base();u.metadata.units.output.totals.totalAppliedVolumeL="m3";assert.equal(inspectV2Snapshot(u).code,"INVALID_UNITS");
});
for(const [path,value] of [["model.modelVersion","irrigation-estimation-v1"],["model.sourceHash","a".repeat(64)],["metadata.metadataSchemaVersion","irrigation-metadata-v1"],["metadata.diagnosticRules.ruleVersion","desconocida"],["metadata.diagnosticRules.evaluated",["P01"]],["metadata.assumptions.daysReferenceState","hoy"],["input.furrow.furrowCount",1.5],["input.furrow.furrowSpacingM",0],["simulation.id",0],["simulation.createdAt","2026-02-31T12:00:00.000Z"]]) test(`Rechazo estructural ${path}`,()=>{const s=base();assign(s,path,value);assert.equal(inspectV2Snapshot(s).status,"invalid");});
test("V2 con widthM no se reinterpreta",()=>{const s=base();delete s.input.furrow.furrowSpacingM;s.input.furrow.widthM=1.3;assert.equal(inspectV2Snapshot(s).status,"invalid");});
test("P01-P05 recibidos con mensajes, puntos y severidades preservados",()=>{
  const ids=new Set(fixtures.flatMap(f=>f.snapshot.output.diagnostics.items.map(d=>d.id)));assert.deepEqual([...ids].sort(),RULE_IDS);
  const items=fixtures.find(f=>f.id==="multiple").snapshot.output.diagnostics.items;
  assert.deepEqual(items.map(d=>d.id),["P01","P03","P03","P03","P05","P05","P05"]);
  assert.deepEqual(items.filter(d=>d.id==="P03").map(d=>d.evidence.point),["start","middle","end"]);
  assert.ok(items.every(d=>d.message&&["info","warning"].includes(d.severity)));
});
for(const change of [d=>{d.id="P99";},d=>{d.severity="critical";},d=>{d.ruleVersion="otra";},d=>{d.fields=null;},d=>{d.evidence=null;},d=>{d.message=22;},d=>{d.extra=true;}]) test("Diagnóstico malformado no genera otros diagnósticos",()=>{const s=base();change(s.output.diagnostics.items[0]);assert.equal(inspectV2Snapshot(s).status,"invalid");});
test("Diagnóstico fatal: estado inválido y mensaje recibido intacto, sin magnitudes válidas",()=>{
  const s=base();s.output.diagnostics.items[0].severity="error";const result=inspectV2Snapshot(s);
  assert.equal(result.code,"FATAL_DIAGNOSTIC");assert.equal(result.status,"invalid");assert.equal(result.fatalItems[0],s.output.diagnostics.items[0]);
});
test("Diagnóstico sin mensaje permitido por backend no se sustituye con una regla inventada",()=>{const s=base();delete s.output.diagnostics.items[0].message;assert.equal(inspectV2Snapshot(s).status,"supported");});
test("Arrays vacíos, sin diagnóstico inventado",()=>{assert.deepEqual(fixtures.find(f=>f.id==="none").snapshot.output.diagnostics.items,[]);});
test("Snapshot y valores históricos nunca se recalculan ni mutan",()=>{
  const s=base();s.output.totals.totalAppliedVolumeL=1;s.output.totals.totalAppliedVolumeM3=2;
  const before=structuredClone(s);freeze(s);assert.equal(inspectV2Snapshot(s).status,"supported");
  for(const metric of METRICS)formatResult(valueAt(s.output,metric.path));assert.deepEqual(s,before);
});
for(const s of [null,[],new Date(),"snapshot",{model:{get contractVersion(){throw Error("no ejecutar");}}}])test("Snapshot malformado no rompe la vista",()=>assert.equal(inspectV2Snapshot(s).status,"invalid"));
test("Ciclo, accessor y array disperso no se evalúan como JSON válido",()=>{
  const cycle=base();cycle.metadata.loop=cycle;assert.equal(inspectV2Snapshot(cycle).status,"invalid");
  const hole=base();hole.output.diagnostics.items=new Array(2);assert.equal(inspectV2Snapshot(hole).status,"invalid");
});
for(const [value,text,full,approximate] of [[116640,"116.640","116.640",false],[116.64,"116,64","116,64",false],[1.3,"1,3","1,3",false],[0,"0","0",false],[null,"No aplica","No aplica",false],[49.29503017546495,"49,3","49,29503017546495",true]])test(`Formato es-AR ${value}`,()=>assert.deepEqual(formatResult(value),{text,full,approximate}));
for(const value of [.001,1e-10,5e-324,1e22,1.234567891e-10])test(`Positivo ${value} no se presenta como cero y conserva precisión`,()=>{const f=formatResult(value);assert.notEqual(f.text,"0");assert.ok(f.full.length);assert.equal(Number(f.full.replaceAll(".","").replace(",",".").replace("E","e")),value);});
for(const value of [NaN,Infinity,undefined,"1"])test("Formato rechaza datos no numéricos/no finitos",()=>assert.throws(()=>formatResult(value),TypeError));
