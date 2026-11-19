// src/main.jsx

import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import IrrigationDraftProvider from "./context/IrrigationDraftContext.jsx";
import { simulationPreparationAvailable } from "./utils/irrigationAvailability.js";
import "./styles/_globals.scss";

// Conservar AppRoutes; el router de datos permite bloquear salidas del borrador.
const router = createBrowserRouter([{ path: "*", element: <App /> }]);
createRoot(document.getElementById("root")).render(
  <AuthProvider>
    {simulationPreparationAvailable
      ? <IrrigationDraftProvider><RouterProvider router={router} /></IrrigationDraftProvider>
      : <RouterProvider router={router} />}
  </AuthProvider>
);
