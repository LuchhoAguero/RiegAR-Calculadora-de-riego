import { invalidateSession } from "../context/session.js";
import { isRealSimulationEnvironment, isSimulationSandbox } from "../utils/irrigationAvailability.js";
import { isTokenCurrent } from "../context/session.js";
import { V2_CONTRACT, V2_MODEL, V2_SOURCE } from "../utils/irrigationV2Results.js";

const BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:4000";
const SERVER_ERROR = "Ocurrió un error en el servidor.";

function getAuthHeaders(isProtected = false) {
  const headers = { "Content-Type": "application/json" };
  const token = isProtected ? localStorage.getItem("token") : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Solo se copian campos públicos, nunca el cuerpo completo, SQL ni stack.
function publicMessage(value, fallback = SERVER_ERROR) {
  if (typeof value !== "string" || !value.trim() || value.length > 500 ||
      /\b(stack|sql|sqlMessage|errno|jwt_secret)\b|\bpassword\s*[:=]|\bat\s+\S+\s*\(|\b(select|insert|delete|update)\s+.+\s+(from|into|set)\b/i.test(value)) return fallback;
  return value;
}

export class ApiError extends Error {
  constructor(message, { status = null, code, field, errors } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.error = message;
    if (typeof code === "string") this.code = code;
    if (typeof field === "string") this.field = field;
    if (Array.isArray(errors)) this.errors = errors;
  }
}

async function request(url, options, expectedStatus) {
  const authorization = options.headers.Authorization;
  const token = authorization?.slice(7);
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    // Un POST incierto nunca se repite automáticamente.
    throw new ApiError("No se pudo conectar con el servidor. Verificá el resultado antes de volver a enviar.", { code: "NETWORK_ERROR" });
  }
  let body;
  try {
    const text = await response.text();
    body = text.trim() ? JSON.parse(text) : null;
  } catch {
    if (response.status === 401) invalidateSession(token);
    throw new ApiError("No se pudo interpretar la respuesta del servidor. Verificá el resultado antes de volver a enviar.", {
      status: response.status, code: "INVALID_RESPONSE",
    });
  }
  if (response.ok) {
    if (expectedStatus !== undefined && response.status !== expectedStatus) throw new ApiError("No se pudo verificar la confirmación del servidor. Revisá el historial antes de volver a enviar.", { status: response.status, code: "INVALID_RESPONSE" });
    return body;
  }
  if (response.status === 401 || (response.status === 403 && body?.error === "Token inválido o expirado.")) invalidateSession(token);
  const errors = Array.isArray(body?.errors) ? body.errors.map(item =>
    Object.fromEntries(["code", "category", "field", "rule", "expected", "message"]
      .filter(key => typeof item?.[key] === "string")
      .map(key => [key, publicMessage(item[key])]))
  ) : undefined;
  const serverMessages = [SERVER_ERROR, "Error en el servidor.", "No se pudo enviar el correo.", "La simulación no pudo completarse con estos datos."];
  const message = response.status >= 500 && !serverMessages.includes(body?.error) ? SERVER_ERROR : publicMessage(body?.error);
  throw new ApiError(message, {
    status: response.status,
    code: typeof body?.code === "string" ? publicMessage(body.code) : undefined,
    field: typeof body?.field === "string" ? publicMessage(body.field) : undefined,
    errors,
  });
}

// --- Rutas de Autenticación (Públicas) ---

/**
 * Llama al endpoint de registro en el backend.
 * @param {object} userData - { nombre, email, password }
 */
export const registerUser = async (userData) => {
  const response = await request(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: getAuthHeaders(false), // No es protegida
    body: JSON.stringify(userData),
  });
  return response;
};

/**
 * Llama al endpoint de login en el backend.
 * @param {object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  const response = await request(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: getAuthHeaders(false), // No es protegida
    body: JSON.stringify(credentials),
  });
  return response;
};

// --- Rutas de Fincas (Protegidas) ---

/**
 * Obtiene la lista de fincas del usuario logueado.
 */
export const getFincas = async () => {
  const response = await request(`${BASE_URL}/api/fincas`, {
    method: "GET",
    headers: getAuthHeaders(true), // <-- ¡Es protegida!
  });
  return response;
};

/**
 * Crea una nueva finca para el usuario logueado.
 * @param {object} fincaData - { nombre_finca, ubicacion }
 */
export const createFinca = async (fincaData) => {
  const response = await request(`${BASE_URL}/api/fincas`, {
    method: "POST",
    headers: getAuthHeaders(true), // <-- ¡Es protegida!
    body: JSON.stringify(fincaData),
  });
  return response;
};

/**
 * Obtiene todos los cálculos para una finca específica.
 * @param {string} fincaId - El ID de la finca.
 */
export const getCalculosByFinca = async (fincaId) => {
  const response = await request(`${BASE_URL}/api/fincas/${fincaId}/calculos`, {
    method: "GET",
    headers: getAuthHeaders(true), // Es protegida
  });
  return response;
};

/**
 * Guarda un nuevo cálculo para una finca específica.
 * @param {string} fincaId - El ID de la finca.
 * @param {object} calculoData - Todos los datos del cálculo (tipo_canal, b, h, etc.)
 */
export const saveCalculo = async (fincaId, calculoData) => {
  const response = await request(`${BASE_URL}/api/fincas/${fincaId}/calculos`, {
    method: "POST",
    headers: getAuthHeaders(true), // Es protegida
    body: JSON.stringify(calculoData),
  });
  return response;
};
export const deleteCalculo = async (calculoId) => {
  const response = await request(`${BASE_URL}/api/calculos/${calculoId}`, {
    method: "DELETE",
    headers: getAuthHeaders(true),
  });
  return response;
};

export const deleteFinca = async (fincaId) => {
  const response = await request(`${BASE_URL}/api/fincas/${fincaId}`, {
    method: "DELETE",
    headers: getAuthHeaders(true),
  });
  return response;
};
export const updateFinca = async (fincaId, fincaData) => {
  const response = await request(`${BASE_URL}/api/fincas/${fincaId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(fincaData),
  });
  return response;
};
export const updateCalculo = async (calculoId, data) => {
  const response = await request(`${BASE_URL}/api/calculos/${calculoId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  });
  return response;
};

export const sendContactMessage = async (contactData) => {
  const response = await request(`${BASE_URL}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactData),
  });
  return response;
};

// IDs de las rutas nuevas: INT UNSIGNED canónico, sin coerción parcial.
export function isValidResourceId(value) {
  if (typeof value !== "string" && typeof value !== "number") return false;
  const text = String(value);
  return /^[1-9]\d{0,9}$/.test(text) && Number(text) <= 4294967295 && String(Number(text)) === text;
}

function simulationCollection(fincaId) {
  if (!isValidResourceId(fincaId)) throw new ApiError("Identificador de finca inválido.", {
    code: "INVALID_ROUTE_PARAMETER", field: "fincaId",
  });
  return `${BASE_URL}/api/fincas/${fincaId}/irrigation-simulations`;
}

const creationPermits = new WeakMap();
const currentSession = token => typeof token === "string" && isTokenCurrent(token) && localStorage.getItem("token") === token;
const creationDisabled = () => new ApiError("La creación de simulaciones no está habilitada para esta sesión y este servicio.", { code: "SIMULATION_CREATION_DISABLED" });

// La comprobación autenticada se repite antes de cada intento de escritura; nunca reintenta el POST.
export const getIrrigationCreationCapability = async sessionToken => {
  try {
    if (!isRealSimulationEnvironment() || !currentSession(sessionToken)) throw creationDisabled();
    const capability = await request(`${BASE_URL}/api/capabilities/irrigation`, {
      method: "GET", headers: getAuthHeaders(true), redirect: "error",
    }, 200);
    if (!currentSession(sessionToken)) throw creationDisabled();
    if (capability?.creationEnabled !== true || capability.contractVersion !== V2_CONTRACT ||
        capability.modelVersion !== V2_MODEL || capability.sourceHash !== V2_SOURCE ||
        capability.frontendOrigin !== globalThis.location.origin) {
      throw new ApiError("El servicio no confirmó la creación con el contrato V2 esperado. Podés seguir consultando el historial.", { code: "SIMULATION_CAPABILITY_MISMATCH" });
    }
    const permit = Object.freeze({ ...capability });
    creationPermits.set(permit, { token: sessionToken, origin: globalThis.location.origin, expires: Date.now() + 60000 });
    return permit;
  } catch (error) {
    error.phase = "capability";
    throw error;
  }
};

export const createIrrigationSimulation = async (fincaId, payload, capability) => {
  const url = simulationCollection(fincaId);
  if (!isSimulationSandbox(import.meta.env)) {
    const permit = capability && creationPermits.get(capability);
    if (!isRealSimulationEnvironment() || !permit || !currentSession(permit.token) ||
        permit.origin !== globalThis.location.origin || Date.now() >= permit.expires) throw creationDisabled();
    creationPermits.delete(capability);
  }
  return request(url, { method: "POST", headers: getAuthHeaders(true), body: JSON.stringify(payload), redirect: "error" }, 201);
};

export const getIrrigationSimulationHistory = async (fincaId, { limit, cursor } = {}) => {
  const url = simulationCollection(fincaId);
  const query = new URLSearchParams();
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new ApiError("El límite debe ser un entero entre 1 y 100.", {
      code: "INVALID_PAGINATION", field: "limit",
    });
    query.set("limit", String(limit));
  }
  if (cursor !== undefined && cursor !== null) {
    if (typeof cursor !== "string") throw new ApiError("El cursor debe ser texto.", { code: "INVALID_PAGINATION", field: "cursor" });
    query.set("cursor", cursor); // Opaco: no decodificar, recortar ni reconstruir.
  }
  const suffix = query.toString();
  return request(suffix ? `${url}?${suffix}` : url, { method: "GET", headers: getAuthHeaders(true) });
};

export const getIrrigationSimulationDetail = async (fincaId, simulationId) => {
  const url = simulationCollection(fincaId);
  if (!isValidResourceId(simulationId)) throw new ApiError("Identificador de simulación inválido.", {
    code: "INVALID_ROUTE_PARAMETER", field: "simulationId",
  });
  return request(`${url}/${simulationId}`, { method: "GET", headers: getAuthHeaders(true) });
};
