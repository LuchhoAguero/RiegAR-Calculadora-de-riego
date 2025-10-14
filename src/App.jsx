import React from 'react';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx'; // 1. Importamos nuestro gestor de rutas
import './styles/_globals.scss';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        {/* 2. Y simplemente lo renderizamos aquí. ¡Limpísimo! */}
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}