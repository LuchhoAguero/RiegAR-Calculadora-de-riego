// src/main.jsx

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // 1. Importar BrowserRouter
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import "./styles/_globals.scss";

// 2. Envolver <App /> con <BrowserRouter>
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
