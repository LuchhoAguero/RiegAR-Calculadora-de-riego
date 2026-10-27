import test from "node:test";
import assert from "node:assert/strict";
import v1 from "./fixtures/irrigation-v1-snapshot.json" with { type: "json" };
import v2Fixtures from "../src/fixtures/irrigation-v2-results.json" with { type: "json" };
import { inspectV1Snapshot, V1_METRICS, V1_INPUT_FIELDS } from "../src/utils/irrigationV1Results.js";
import { appendHistory, validateHistoryPage } from "../src/utils/irrigationHistory.js";
const clone = value => structuredClone(value);
const summary = snapshot => ({ simulation: clone(snapshot.simulation), model: clone(snapshot.model), summary: {
  targetDepthMm: snapshot.output.waterNeed.targetDepthMm, appliedVolumeL: snapshot.output.application.appliedVolumeL,
  applicationEfficiencyPct: snapshot.output.efficiency.applicationEfficiencyPct,
  diagnostics: { count: snapshot.output.diagnostics.items.length, severities: [...new Set(snapshot.output.diagnostics.items.map(item => item.severity))] },
  ...(snapshot.model.contractVersion === "irrigation-contract-v2" ? { furrowCount: snapshot.input.furrow.furrowCount, totalAppliedVolumeL: snapshot.output.totals.totalAppliedVolumeL } : {}),
} });
const page = (items = [summary(v1), summary(v2Fixtures[0].snapshot)]) => ({ items, pagination: { limit: 20, hasMore: false, nextCursor: null } });
const freeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };

test("V1 tiene 14 magnitudes y ancho, sin extensiones V2",()=>{
  assert.equal(V1_METRICS.length,14);assert.equal(V1_INPUT_FIELDS.filter(f=>f.type==="number").length,14);
  assert.ok(V1_INPUT_FIELDS.some(f=>f.path==="furrow.widthM"));assert.ok(!V1_INPUT_FIELDS.some(f=>f.path==="furrow.furrowSpacingM"||f.path==="furrow.furrowCount"));
  assert.equal(inspectV1Snapshot(freeze(clone(v1))).status,"supported");
  for(const metric of V1_METRICS){const [group,key]=metric.path.split(".");assert.equal(v1.metadata.units.output[group][key],metric.unit);}
});
for(const metric of V1_METRICS)test(`V1 requiere ${metric.path}`,()=>{const s=clone(v1),[group,key]=metric.path.split(".");delete s.output[group][key];assert.equal(inspectV1Snapshot(s).status,"invalid");});
for(const [group,key,value]of [["furrow","widthM","1.3"],["furrow","widthM",0],["furrow","furrowCount",18],["furrow","furrowSpacingM",1.3],["soil","fieldCapacityPct",101],["irrigation","advanceTimeMin",61]])test(`V1 entrada histórica inválida ${key}`,()=>{const s=clone(v1);s.input[group][key]=value;assert.equal(inspectV1Snapshot(s).status,"invalid");});
for(const value of [null,"0",NaN,Infinity,-1])test(`V1 no coacciona magnitudes ${String(value)}`,()=>{const s=clone(v1);s.output.waterNeed.targetDepthMm=value;assert.equal(inspectV1Snapshot(s).status,"invalid");});
test("V1 rechaza campos de output V2, aun con contrato V1",()=>{const s=clone(v1);s.output.totals={totalAppliedVolumeL:100};assert.equal(inspectV1Snapshot(s).status,"invalid");});
for(const change of [s=>{s.model.sourceHash="otro";},s=>{s.model.modelVersion="irrigation-estimation-v2";},s=>{delete s.metadata.assumptions.widthMeaning;},s=>{s.metadata.metadataSchemaVersion="irrigation-metadata-v2";},s=>{s.metadata.units.input.furrow.widthM="cm";},s=>{s.output.diagnostics.items[0].severity="error";},s=>{s.output.diagnostics.items[0].id="P99";}])test("V1 respeta provenance, unidades y diagnósticos",()=>{const s=clone(v1);change(s);assert.equal(inspectV1Snapshot(s).status,"invalid");});
test("Contrato determina V1; campos presentes no fuerzan renderer",()=>{const s=clone(v1);s.model.contractVersion="irrigation-contract-v2";assert.equal(inspectV1Snapshot(s).status,"unsupported");});
test("V1 no modifica, redondea o recalcula sus 14 resultados",()=>{const s=clone(v1),before=clone(s);freeze(s);assert.equal(inspectV1Snapshot(s).status,"supported");assert.deepEqual(s,before);});
test("History acepta vacío, uno y mixto sin DETAIL",()=>{for(const items of [[],[summary(v1)],[summary(v1),summary(v2Fixtures[0].snapshot)]]){const p=page(items);assert.equal(validateHistoryPage(p,"7"),p);}});
test("Cursor opaco se conserva exacto, sin decodificación ni normalización",()=>{const p=page();p.pagination={limit:20,hasMore:true,nextCursor:" opaco+/=&ñ  "};assert.equal(validateHistoryPage(p,7).pagination.nextCursor,p.pagination.nextCursor);});
for(const [field,value]of [["limit",0],["limit",101],["limit","20"],["hasMore","false"],["nextCursor","cursor con fin"]])test(`Paginación inválida ${field}`,()=>{const p=page();p.pagination[field]=value;assert.throws(()=>validateHistoryPage(p,7),{code:"INVALID_HISTORY_RESPONSE"});});
for(const cursor of [null,"",{},22])test(`hasMore requiere cursor textual ${JSON.stringify(cursor)}`,()=>{const p=page();p.pagination.hasMore=true;p.pagination.nextCursor=cursor;assert.throws(()=>validateHistoryPage(p,7));});
test("Una página vacía no puede prometer más resultados",()=>{const p=page([]);p.pagination={limit:20,hasMore:true,nextCursor:"opaco"};assert.throws(()=>validateHistoryPage(p,7));});
for(const limit of [1,100])test(`Límite permitido ${limit}`,()=>{const p=page([summary(v1)]);p.pagination.limit=limit;assert.equal(validateHistoryPage(p,7),p);});
test("No se aceptan filas de otra finca o IDs con coerción",()=>{for(const change of [i=>{i.simulation.fincaId=8;},i=>{i.simulation.id="101";},i=>{i.simulation.id=0;}]){const p=page();change(p.items[0]);assert.throws(()=>validateHistoryPage(p,7));}});
for(const change of [i=>{delete i.summary.diagnostics;},i=>{i.summary.targetDepthMm=null;},i=>{i.summary.appliedVolumeL=0;},i=>{i.summary.applicationEfficiencyPct=101;},i=>{i.summary.diagnostics.count=-1;},i=>{i.summary.diagnostics.severities=["error"];},i=>{i.summary.diagnostics.severities=["warning","warning"];},i=>{i.summary.furrowCount=18;}])test("Summary V1 inválido rechaza página completa, sin completar datos",()=>{const p=page();change(p.items[0]);assert.throws(()=>validateHistoryPage(p,7));});
for(const change of [i=>{delete i.summary.furrowCount;},i=>{i.summary.furrowCount=1.2;},i=>{i.summary.totalAppliedVolumeL=0;},i=>{delete i.summary.totalAppliedVolumeL;}])test("Summary V2 requiere cantidad y total",()=>{const p=page([summary(v2Fixtures[0].snapshot)]);change(p.items[0]);assert.throws(()=>validateHistoryPage(p,7));});
test("Versiones desconocidas quedan sin interpretación de magnitudes",()=>{const p=page();p.items[0].model.contractVersion="irrigation-contract-v99";p.items[0].summary={};assert.equal(validateHistoryPage(p,7),p);});
test("Append conserva orden y primer valor, sin duplicados visuales ni mutación",()=>{
 const a=summary(v1),b=summary(v2Fixtures[0].snapshot);const c=clone(a);c.simulation.id=102;
 const previous=freeze([a,b]),incoming=freeze([b,c,c]),before=clone([previous,incoming]);
 const merged=appendHistory(previous,incoming);assert.deepEqual(merged.map(i=>i.simulation.id),[101,1,102]);assert.equal(merged[0],a);assert.deepEqual([previous,incoming],before);
});
