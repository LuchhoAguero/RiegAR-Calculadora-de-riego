import React from "react";
import { Routes, Route } from "react-router-dom";
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
            <DashboardPage />
          </ProtectedRoute>
        }
      />
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
