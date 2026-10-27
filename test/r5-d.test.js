import test from "node:test";
import assert from "node:assert/strict";
import { FIELDS, STEPS, emptyValues, parseNumber, validateValues, buildV2Payload } from "../src/utils/irrigationV2Form.js";

// Fixture de captura, no defaults del producto ni certificación del engine.
const raw = () => ({ ...emptyValues(),
  "crop.etoMmPerDay": "5", "crop.cropCoefficient": "0,7", "crop.daysWithoutIrrigation": "20",
  "soil.fieldCapacityPct": "20", "soil.wiltingPointPct": "10", "soil.bulkDensityGcm3": "1,3", "soil.rootDepthM": "0,7", "soil.depletionThresholdPct": "60",
  "furrow.furrowSpacingM": "1,3", "furrow.lengthM": "60", "furrow.slopePct": "0", "furrow.furrowCount": "18",
  "irrigation.flowLps": "0,9", "irrigation.durationMin": "120", "irrigation.advanceTimeMin": "20",
});
test("15 números obligatorios y 2 textos opcionales, todos inicialmente vacíos", () => {
  assert.equal(FIELDS.filter(f => f.type === "number").length, 15);
  assert.equal(FIELDS.filter(f => f.optional).length, 2);
  assert.deepEqual(STEPS.map(s => s.title), ["Cultivo", "Suelo", "Surcos", "Riego", "Revisión"]);
  assert.ok(Object.values(emptyValues()).every(value => value === ""));
});
for (const [text, value] of [["1,30",1.3],["1.30",1.3],["0,001",.001],["0.001",.001],["0,0000001",1e-7],["1,2345",1.2345],["0",0],["1300",1300],["0001,30",1.3]]) test(`Conversión explícita ${text}`, () => {
  const result = parseNumber(text); assert.equal(result.status,"valid"); assert.equal(result.value,value);
});
for (const text of ["", "1.234,56", "1,234.56", "1.234.567", "1e3", "1E-3", "NaN", "Infinity", " 1", "1 ", "1\n", "1 300", "1,", ".5", "+1", "abc"]) test(`No convierte entrada incompleta o inválida ${JSON.stringify(text)}`, () => {
  assert.notEqual(parseNumber(text).status,"valid"); assert.equal(parseNumber(text).value,undefined);
});
for (const text of ["1.300", "1,300", "12.345", "1000,001"]) test(`Ambigüedad ${text} no tiene opción implícita`, () => {
  assert.equal(parseNumber(text).status,"ambiguous");
  const decimal = parseNumber(text,{resolution:{raw:text,kind:"decimal"}});
  const integer = parseNumber(text,{resolution:{raw:text,kind:"integer"}});
  assert.equal(decimal.value,Number(text.replace(",",".")));
  assert.equal(integer.value,Number(text.replace(/[.,]/,"")));
  assert.equal(parseNumber(text,{resolution:{raw:"otro texto",kind:"decimal"}}).status,"ambiguous");
  assert.equal(parseNumber(text,{resolution:{raw:text,kind:"arbitrario"}}).status,"ambiguous");
});
for (const text of ["9007199254740993", "1.0000000000000001", "0."+"0".repeat(324)+"1", "9".repeat(310)]) test("Pérdida de precisión/underflow/overflow no se silencia: "+text.slice(0,30), () => assert.equal(parseNumber(text).status,"invalid"));
for (const text of ["1", "18", "9007199254740991"]) test(`Count seguro ${text}`, () => assert.equal(parseNumber(text,{integer:true}).status,"valid"));
for (const text of ["0", "-1", "18,0", "18.0", "1.300", "1,300", "9007199254740992", "1\n"]) test(`Count inválido ${JSON.stringify(text)}`, () => assert.equal(parseNumber(text,{integer:true}).status,"invalid"));
for (const field of ["crop.etoMmPerDay","crop.cropCoefficient","crop.daysWithoutIrrigation","soil.fieldCapacityPct","soil.wiltingPointPct","soil.bulkDensityGcm3","soil.rootDepthM","soil.depletionThresholdPct","furrow.furrowSpacingM","furrow.lengthM","furrow.slopePct","furrow.furrowCount","irrigation.flowLps","irrigation.durationMin","irrigation.advanceTimeMin"]) test(`Obligatorio ${field}`, () => {
  const input=raw();input[field]="";assert.ok(validateValues(input).errors[field]);assert.equal(buildV2Payload(input).ok,false);
});
for (const [field,valid,invalid] of [
 ["crop.etoMmPerDay","0","-1"],["crop.cropCoefficient","0","-1"],["crop.daysWithoutIrrigation","0,5","-1"],
 ["soil.fieldCapacityPct","100","100,1"],["soil.wiltingPointPct","0","-1"],
 ["soil.bulkDensityGcm3","0,001","0"],["soil.rootDepthM","0,001","0"],
 ["soil.depletionThresholdPct","100","100,1"],["furrow.furrowSpacingM","0,001","0"],
 ["furrow.lengthM","0,001","0"],["furrow.slopePct","0","-1"],["furrow.furrowCount","9007199254740991","9007199254740992"],
 ["irrigation.flowLps","0,001","0"],["irrigation.durationMin","0,5","0"],["irrigation.advanceTimeMin","0","-1"],
]) test(`Dominio ${field}`, () => {
  const input=raw();if(field==="irrigation.durationMin")input["irrigation.advanceTimeMin"]="0";
  input[field]=valid;assert.equal(validateValues(input).errors[field],undefined);
  input[field]=invalid;assert.ok(validateValues(input).errors[field]);
});
for(const field of ["soil.fieldCapacityPct","soil.depletionThresholdPct"]) test(`Porcentaje ${field} excluye cero`,()=>{const input=raw();input[field]="0";assert.ok(validateValues(input).errors[field]);});
test("CC debe superar PMP; igualdad no válida",()=>{const input=raw();input["soil.fieldCapacityPct"]="10";assert.match(validateValues(input).errors["soil.fieldCapacityPct"],/superar/);});
test("Avance igual a duración válido, superior inválido",()=>{const input=raw();input["irrigation.advanceTimeMin"]="120";assert.equal(buildV2Payload(input).ok,true);input["irrigation.advanceTimeMin"]="120,1";assert.match(validateValues(input).errors["irrigation.advanceTimeMin"],/superar/);});
test("Validar Cultivo no exige campos de los siguientes pasos",()=>{const input=emptyValues();Object.assign(input,{"crop.etoMmPerDay":"0","crop.cropCoefficient":"0","crop.daysWithoutIrrigation":"0"});assert.deepEqual(validateValues(input,{},0).errors,{});assert.equal(buildV2Payload(input).ok,false);});
test("Textura Unicode opcional, trim y límite 64 puntos de código",()=>{const input=raw();input["soil.texture"]="  "+"🌱".repeat(64)+"  ";assert.equal(buildV2Payload(input).payload.soil.texture,"🌱".repeat(64));input["soil.texture"]="🌱".repeat(65);assert.ok(validateValues(input).errors["soil.texture"]);});
test("Nombre Unicode opcional y límite 255 puntos de código",()=>{const input=raw();input.name="🌱".repeat(255);assert.equal(buildV2Payload(input).payload.name,input.name);input.name+="a";assert.ok(validateValues(input).errors.name);});
test("Vacíos opcionales se omiten, no se envían como strings vacíos",()=>{const input=raw();input.name="  ";input["soil.texture"]="  ";const {payload}=buildV2Payload(input);assert.equal(Object.hasOwn(payload,"name"),false);assert.equal(Object.hasOwn(payload.soil,"texture"),false);});
test("Payload V2 exacto, sin mutación, versiones, propietario o widthM",()=>{
  const input=raw();input.name="  Escenario local  ";input["soil.texture"]="  Franco  ";input.modelVersion="invento";input["furrow.widthM"]="9";input.userId=22;
  const before=structuredClone(input);
  assert.deepEqual(buildV2Payload(input),{ok:true,payload:{name:"Escenario local",crop:{etoMmPerDay:5,cropCoefficient:.7,daysWithoutIrrigation:20},soil:{texture:"Franco",fieldCapacityPct:20,wiltingPointPct:10,bulkDensityGcm3:1.3,rootDepthM:.7,depletionThresholdPct:60},furrow:{furrowSpacingM:1.3,lengthM:60,slopePct:0,furrowCount:18},irrigation:{flowLps:.9,durationMin:120,advanceTimeMin:20}}});
  assert.deepEqual(input,before);
});
test("Payload no existe hasta aclarar la ambigüedad; cambios invalidan elección",()=>{
  const input=raw();input["crop.etoMmPerDay"]="1.300";
  assert.equal(buildV2Payload(input).ok,false);
  const resolution={"crop.etoMmPerDay":{raw:"1.300",kind:"integer"}};
  assert.equal(buildV2Payload(input,resolution).payload.crop.etoMmPerDay,1300);
  input["crop.etoMmPerDay"]="1.400";assert.equal(buildV2Payload(input,resolution).ok,false);
});
