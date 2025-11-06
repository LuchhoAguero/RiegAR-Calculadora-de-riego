// src/context/AuthContext.jsx

import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 3. Estado: ahora lee el token inicial desde localStorage
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // 4. Función de Login: guarda el token en el estado Y en localStorage
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  // 5. Función de Logout: borra el token del estado Y de localStorage
  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  const value = {
    token,
    isLoggedIn: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
