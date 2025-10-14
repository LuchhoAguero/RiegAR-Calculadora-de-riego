import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import CalculatorPage from "../pages/CalculatorPage.jsx";
import GuidePage from "../pages/GuidePage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";
import ContactPage from "../pages/ContactPage.jsx"; // Asegúrate que esta línea esté correcta

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/calculadora" element={<CalculatorPage />} />
      <Route path="/guia" element={<GuidePage />} />
      <Route path="/configuracion" element={<SettingsPage />} />
      <Route path="/contacto" element={<ContactPage />} />
    </Routes>
  );
}
