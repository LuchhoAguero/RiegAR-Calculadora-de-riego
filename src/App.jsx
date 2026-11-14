import React from 'react';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import { isSimulationSandbox } from './utils/irrigationAvailability.js';
import './styles/_globals.scss';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        {isSimulationSandbox() && <p role="note" className="demo-notice">Demostración académica · datos de prueba</p>}
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}
