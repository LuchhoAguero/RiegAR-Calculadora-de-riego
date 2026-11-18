import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
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
import { academicDemoAvailable, localSimulationPreparation } from "../utils/irrigationAvailability.js";
const AcademicDemoPage = academicDemoAvailable ? lazy(() => import("../pages/AcademicDemoPage.jsx")) : null;
const ResultsDemoPage = localSimulationPreparation ? lazy(() => import("../pages/ResultsDemoPage.jsx")) : null;
const SimulationDetailPage = lazy(() => import("../pages/SimulationDetailPage.jsx"));

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
      {AcademicDemoPage && <Route path="/demo/*" element={<Suspense fallback={<p className="container" role="status">Cargando la demostración...</p>}><AcademicDemoPage /></Suspense>} />}
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
      <Route path="/fincas/:fincaId/simulaciones/:simulationId" element={<ProtectedRoute><Suspense fallback={<p className="container" role="status">Cargando el detalle de simulación...</p>}><SimulationDetailPage /></Suspense></ProtectedRoute>} />
      {ResultsDemoPage && <Route path="/desarrollo/resultados-v2" element={<ProtectedRoute><Suspense fallback={<p className="container" role="status">Cargando la demostración...</p>}><ResultsDemoPage /></Suspense></ProtectedRoute>} />}
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
      <Route path="*" element={<div className="container"><h1>Página no encontrada</h1><p>Revisá la dirección o volvé al inicio para continuar.</p><p><Link to="/">Volver al inicio</Link></p></div>} />
    </Routes>
  );
}
