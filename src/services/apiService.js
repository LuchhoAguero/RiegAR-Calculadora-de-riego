// src/services/apiService.js

// 1. Definimos la URL base de nuestro backend.
const BASE_URL = "http://localhost:4000"; // La URL donde corre tu servidor Node.js

/**
 * Función de ayuda para crear las cabeceras.
 * Si es una petición protegida, añade el token JWT.
 */
function getAuthHeaders(isProtected = false) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (isProtected) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * Una función de ayuda para manejar las respuestas de la API.
 * Revisa si la respuesta es exitosa y, si no, lanza un error.
 */
async function handleResponse(response) {
  const data = await response.json();

  if (response.ok) {
    return data; // Retorna los datos si todo fue bien (ej. el token)
  } else {
    // Lanza un error con el mensaje del backend si la respuesta no fue 2xx
    throw new Error(data.error || "Ocurrió un error en el servidor.");
  }
}

// --- Rutas de Autenticación (Públicas) ---

/**
 * Llama al endpoint de registro en el backend.
 * @param {object} userData - { nombre, email, password }
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: getAuthHeaders(false), // No es protegida
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

/**
 * Llama al endpoint de login en el backend.
 * @param {object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: getAuthHeaders(false), // No es protegida
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

// --- Rutas de Fincas (Protegidas) ---

/**
 * Obtiene la lista de fincas del usuario logueado.
 */
export const getFincas = async () => {
  const response = await fetch(`${BASE_URL}/api/fincas`, {
    method: "GET",
    headers: getAuthHeaders(true), // <-- ¡Es protegida!
  });
  return handleResponse(response);
};

/**
 * Crea una nueva finca para el usuario logueado.
 * @param {object} fincaData - { nombre_finca, ubicacion }
 */
export const createFinca = async (fincaData) => {
  const response = await fetch(`${BASE_URL}/api/fincas`, {
    method: "POST",
    headers: getAuthHeaders(true), // <-- ¡Es protegida!
    body: JSON.stringify(fincaData),
  });
  return handleResponse(response);
};

/**
 * Obtiene todos los cálculos para una finca específica.
 * @param {string} fincaId - El ID de la finca.
 */
export const getCalculosByFinca = async (fincaId) => {
  const response = await fetch(`${BASE_URL}/api/fincas/${fincaId}/calculos`, {
    method: "GET",
    headers: getAuthHeaders(true), // Es protegida
  });
  return handleResponse(response);
};

/**
 * Guarda un nuevo cálculo para una finca específica.
 * @param {string} fincaId - El ID de la finca.
 * @param {object} calculoData - Todos los datos del cálculo (tipo_canal, b, h, etc.)
 */
export const saveCalculo = async (fincaId, calculoData) => {
  const response = await fetch(`${BASE_URL}/api/fincas/${fincaId}/calculos`, {
    method: "POST",
    headers: getAuthHeaders(true), // Es protegida
    body: JSON.stringify(calculoData),
  });
  return handleResponse(response);
};
export const deleteCalculo = async (calculoId) => {
  const response = await fetch(`${BASE_URL}/api/calculos/${calculoId}`, {
    method: "DELETE",
    headers: getAuthHeaders(true),
  });
  return handleResponse(response);
};

export const deleteFinca = async (fincaId) => {
  const response = await fetch(`${BASE_URL}/api/fincas/${fincaId}`, {
    method: "DELETE",
    headers: getAuthHeaders(true),
  });
  return handleResponse(response);
};
export const updateFinca = async (fincaId, fincaData) => {
  const response = await fetch(`${BASE_URL}/api/fincas/${fincaId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(fincaData),
  });
  return handleResponse(response);
};
export const updateCalculo = async (calculoId, data) => {
  const response = await fetch(`${BASE_URL}/api/calculos/${calculoId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const sendContactMessage = async (contactData) => {
  const response = await fetch(`${BASE_URL}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactData),
  });
  return handleResponse(response);
};
