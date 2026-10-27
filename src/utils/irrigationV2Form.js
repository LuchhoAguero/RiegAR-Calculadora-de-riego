// Captura y validación UX derivadas de INPUT_CONTRACT V2. Sin engine ni transporte.
const number = (path, label, unit, min, exclusiveMin = false, max, help = "") => ({ path, label, unit, min, exclusiveMin, max, help, type: "number" });
export const STEPS = [
  { title: "Cultivo", description: "Ingresá los datos del cultivo para este escenario.", fields: [
    number("crop.etoMmPerDay", "Evapotranspiración de referencia (ETo)", "mm/día", 0),
    number("crop.cropCoefficient", "Coeficiente de cultivo (Kc)", "adimensional", 0),
    number("crop.daysWithoutIrrigation", "Días sin riego", "días", 0),
  ] },
  { title: "Suelo", description: "Usá los datos conocidos de tu suelo; la textura no completa otros valores.", fields: [
    { path: "soil.texture", label: "Textura del suelo", type: "text", optional: true, maxLength: 64, help: "Descripción opcional, hasta 64 caracteres." },
    number("soil.fieldCapacityPct", "Capacidad de campo", "%", 0, true, 100, "Porcentaje gravimétrico en base seca; debe superar el punto de marchitez."),
    number("soil.wiltingPointPct", "Punto de marchitez permanente", "%", 0, false, undefined, "Porcentaje gravimétrico en base seca."),
    number("soil.bulkDensityGcm3", "Densidad aparente", "g/cm³", 0, true),
    number("soil.rootDepthM", "Profundidad radicular", "m", 0, true),
    number("soil.depletionThresholdPct", "Umbral de agotamiento", "%", 0, true, 100),
  ] },
  { title: "Surcos", description: "Describí la geometría y cuántos surcos incluye el escenario.", fields: [
    number("furrow.furrowSpacingM", "Distancia entre surcos", "m", 0, true),
    number("furrow.lengthM", "Longitud del surco", "m", 0, true),
    number("furrow.slopePct", "Pendiente", "%", 0),
    { ...number("furrow.furrowCount", "Cantidad de surcos", "surcos", 1, false, Number.MAX_SAFE_INTEGER), integer: true },
  ] },
  { title: "Riego", description: "Ingresá las condiciones de aplicación por surco.", fields: [
    number("irrigation.flowLps", "Caudal por surco", "L/s", 0, true),
    number("irrigation.durationMin", "Duración del riego", "min", 0, true),
    number("irrigation.advanceTimeMin", "Tiempo de avance", "min", 0, false, undefined, "No puede superar la duración del riego."),
  ] },
  { title: "Revisión", description: "Revisá todos los datos. Esta preparación local no calcula ni guarda.", fields: [
    { path: "name", label: "Nombre de la simulación", type: "text", optional: true, maxLength: 255, help: "Opcional, hasta 255 caracteres." },
  ] },
];
export const FIELDS = STEPS.flatMap(step => step.fields);
export const emptyValues = () => Object.fromEntries(FIELDS.map(field => [field.path, ""]));
export const fieldId = path => `v2-${path.replaceAll(".", "-")}`;

// Comparar decimales canónicos evita perder dígitos silenciosamente al pasar a Number.
// No exige representación binaria exacta: 0,1 y 1,3 son entradas ordinarias válidas.
function canonical(text) {
  const [, sign, whole, fraction = "", exponent = "0"] = text.match(/^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/);
  const digits = whole + fraction, point = whole.length + Number(exponent);
  const expanded = point <= 0 ? "0." + "0".repeat(-point) + digits
    : point >= digits.length ? digits + "0".repeat(point - digits.length)
      : digits.slice(0, point) + "." + digits.slice(point);
  let [a, b = ""] = expanded.split(".");
  a = a.replace(/^0+(?=\d)/, ""); b = b.replace(/0+$/, "");
  return (sign && (a !== "0" || b) ? "-" : "") + a + (b ? "." + b : "");
}

export function parseNumber(raw, { integer = false, resolution } = {}) {
  if (raw === "") return { status: "empty", message: "Completá este dato." };
  if (typeof raw !== "string" || /\s/.test(raw) || !(integer ? /^\d+$/ : /^-?\d+(?:[.,]\d+)?$/).test(raw)) {
    return { status: "invalid", message: integer ? "Escribí un entero positivo sin separadores, por ejemplo 1300." : "Usá un número con coma o punto decimal, sin miles, espacios ni notación científica." };
  }
  let text = raw.replace(",", ".");
  const [whole, fraction] = text.split(".");
  if (!integer && !whole.startsWith("-") && /[1-9]/.test(whole) && fraction?.length === 3) {
    const choices = { decimal: canonical(text), integer: canonical(whole + fraction) };
    if (resolution?.raw !== raw || !Object.hasOwn(choices, resolution.kind)) return { status: "ambiguous", choices, message: "Este número tiene dos interpretaciones. Elegí una o editá el dato." };
    text = choices[resolution.kind];
  }
  const value = Number(text);
  if (!Number.isFinite(value)) return { status: "invalid", message: "El número debe ser finito y representable." };
  if (integer && (!Number.isSafeInteger(value) || value < 1)) return { status: "invalid", message: "La cantidad debe ser un entero entre 1 y 9007199254740991." };
  if (canonical(text) !== canonical(String(value))) return { status: "invalid", message: "Este número pierde precisión al convertirlo. Revisalo; no lo redondearemos automáticamente." };
  return { status: "valid", value, text: canonical(text) };
}

function validateField(field, raw, resolution) {
  if (field.type === "text") {
    if (typeof raw !== "string") return { error: "Ingresá texto." };
    const text = raw.trim();
    if (!text) return { value: undefined };
    return [...text].length > field.maxLength ? { error: `Usá hasta ${field.maxLength} caracteres.` } : { value: text };
  }
  const parsed = parseNumber(raw, { integer: field.integer, resolution });
  if (parsed.status !== "valid") return { error: parsed.message };
  const { value } = parsed;
  if ((field.exclusiveMin ? value <= field.min : value < field.min) || (field.max !== undefined && value > field.max)) {
    return { error: `Debe ser ${field.exclusiveMin ? "mayor que" : "mayor o igual que"} ${field.min}${field.max !== undefined ? ` y menor o igual que ${field.max}` : ""}.` };
  }
  return { value };
}

export function validateValues(raw, resolutions = {}, step = null) {
  const errors = {}, values = {};
  const fields = step === null ? FIELDS : STEPS[step].fields;
  for (const field of fields) {
    const result = validateField(field, raw[field.path] ?? "", resolutions[field.path]);
    if (result.error) errors[field.path] = result.error;
    else values[field.path] = result.value;
  }
  if (values["soil.fieldCapacityPct"] !== undefined && values["soil.wiltingPointPct"] !== undefined && values["soil.fieldCapacityPct"] <= values["soil.wiltingPointPct"]) errors["soil.fieldCapacityPct"] = "La capacidad de campo debe superar el punto de marchitez.";
  if (values["irrigation.advanceTimeMin"] !== undefined && values["irrigation.durationMin"] !== undefined && values["irrigation.advanceTimeMin"] > values["irrigation.durationMin"]) errors["irrigation.advanceTimeMin"] = "El tiempo de avance no puede superar la duración del riego.";
  return { errors, values };
}

export function buildV2Payload(raw, resolutions = {}) {
  const { errors, values } = validateValues(raw, resolutions);
  if (Object.keys(errors).length) return { ok: false, errors };
  const payload = { crop: {}, soil: {}, furrow: {}, irrigation: {} };
  for (const [path, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (path === "name") payload.name = value;
    else { const [group, key] = path.split("."); payload[group][key] = value; }
  }
  return { ok: true, payload };
}

export function reviewValue(field, raw, resolution) {
  if (field.type === "text") return raw.trim() || "Sin indicar";
  const parsed = parseNumber(raw, { integer: field.integer, resolution });
  return parsed.status === "valid" ? parsed.text.replace(".", ",") : raw || "Sin completar";
}
