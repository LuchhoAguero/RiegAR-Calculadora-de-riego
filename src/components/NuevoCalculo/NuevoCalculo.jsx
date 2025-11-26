// src/components/NuevoCalculo/NuevoCalculo.jsx
import React, { useState } from "react"; // Importar useState
import { useParams, useNavigate } from "react-router-dom";
import Calculator from "../Calculator/Calculator.jsx";
import { saveCalculo } from "../../services/apiService.js";
import Modal from "../Modal/Modal.jsx"; // Importar Modal

export default function NuevoCalculo() {
  const { id: fincaId } = useParams();
  const navigate = useNavigate();

  // Estado para el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSaveCalculo = async (calculoData) => {
    try {
      await saveCalculo(fincaId, calculoData);
      // En lugar de alert, mostramos el modal
      setShowSuccessModal(true);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  // Función para cerrar el modal y navegar
  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate(`/finca/${fincaId}`);
  };

  return (
    <div className="container" style={{ padding: "2rem 0" }}>
      <h1>Nuevo Cálculo</h1>
      <Calculator onSave={handleSaveCalculo} />

      {/* Modal de Éxito */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccess}
        // No pasamos onConfirm, así solo muestra el botón de "Entendido/Aceptar"
        title="¡Guardado!"
        message="El cálculo se ha registrado exitosamente en tu finca."
        type="success"
      />
    </div>
  );
}
