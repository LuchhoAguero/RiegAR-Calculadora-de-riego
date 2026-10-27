import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import CalculatorPage from "../pages/CalculatorPage.jsx";
import GuidePage from "../pages/GuidePage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";
import ContactPage from "../pages/ContactPage.jsx"; // Asegúrate que esta línea esté correcta
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import FincaDetailPage from "../pages/FincaDetailPage.jsx";
import NuevoCalculoPage from "../pages/NuevoCalculoPage.jsx";
import FarmDetailPage from "../pages/FarmDetailPage.jsx";
import NewSimulationPage from "../pages/NewSimulationPage.jsx";
const ResultsDemoPage = import.meta.env.DEV ? lazy(() => import("../pages/ResultsDemoPage.jsx")) : null;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/calculadora" element={<CalculatorPage />} />
      <Route path="/guia" element={<GuidePage />} />
      <Route path="/configuracion" element={<SettingsPage />} />
      <Route path="/contacto" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Navigate to="/fincas" replace />
          </ProtectedRoute>
        }
      />
      <Route path="/fincas" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/fincas/:fincaId" element={<ProtectedRoute><FarmDetailPage /></ProtectedRoute>} />
      <Route path="/fincas/:fincaId/simulaciones/nueva" element={<ProtectedRoute><NewSimulationPage /></ProtectedRoute>} />
      {import.meta.env.DEV && <Route path="/desarrollo/resultados-v2" element={<ProtectedRoute><Suspense fallback={<p className="container" role="status">Cargando la demostración...</p>}><ResultsDemoPage /></Suspense></ProtectedRoute>} />}
      <Route
        path="/finca/:id"
        element={
          <ProtectedRoute>
            <FincaDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finca/:id/nuevo-calculo"
        element={
          <ProtectedRoute>
            <NuevoCalculoPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
