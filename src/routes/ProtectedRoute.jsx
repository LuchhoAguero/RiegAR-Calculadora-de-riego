// src/routes/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) {
    // Si el usuario no está logueado, redirige a la página de login
    return <Navigate to="/login" replace />;
  }

  // Si está logueado, muestra el componente hijo (la página)
  return children;
}
