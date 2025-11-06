// src/services/apiService.js

// 1. Definimos la URL base de nuestro backend.
// Esto evita tener que escribirla en cada petición.
const BASE_URL = "http://localhost:4000"; // La URL donde corre tu servidor Node.js

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

/**
 * Llama al endpoint de registro en el backend.
 * @param {object} userData - { nombre, email, password }
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse(response);
};
