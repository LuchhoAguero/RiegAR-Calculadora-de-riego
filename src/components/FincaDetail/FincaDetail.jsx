import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCalculosByFinca,
  deleteCalculo,
  updateCalculo,
} from "../../services/apiService";
import Modal from "../Modal/Modal.jsx";
import s from "./FincaDetail.module.scss";
import { FaTrashCan, FaPenToSquare } from "react-icons/fa6"; // Added FaPenToSquare for edit icon

export default function FincaDetail() {
  const { id: fincaId } = useParams();
  const [calculos, setCalculos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los modales
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [calculoToDelete, setCalculoToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [calculoToEdit, setCalculoToEdit] = useState({
    id: "",
    nombre_calculo: "",
  });

  useEffect(() => {
    const fetchCalculos = async () => {
      try {
        setIsLoading(true);
        const data = await getCalculosByFinca(fincaId);
        setCalculos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalculos();
  }, [fincaId]);

  // --- Lógica de Borrado ---
  const openDeleteModal = (id) => {
    setCalculoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCalculo = async () => {
    if (!calculoToDelete) return;
    try {
      await deleteCalculo(calculoToDelete);
      setCalculos(calculos.filter((c) => c.id !== calculoToDelete));
      setIsDeleteModalOpen(false);
      setCalculoToDelete(null);
    } catch (err) {
      alert(err.message);
      setIsDeleteModalOpen(false);
    }
  };

  // --- Lógica de Edición ---
  const openEditModal = (calculo) => {
    setCalculoToEdit({
      id: calculo.id,
      nombre_calculo: calculo.nombre_calculo,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCalculo = async (e) => {
    e.preventDefault();
    try {
      await updateCalculo(calculoToEdit.id, {
        nombre_calculo: calculoToEdit.nombre_calculo,
      });

      setCalculos(
        calculos.map((c) =>
          c.id === calculoToEdit.id
            ? { ...c, nombre_calculo: calculoToEdit.nombre_calculo }
            : c
        )
      );

      setIsEditModalOpen(false);
    } catch (err) {
      alert("Error al actualizar: " + err.message);
    }
  };

  if (isLoading)
    return <div className={s.loadingText}>Cargando cálculos...</div>;
  if (error)
    return <div className={s.errorText}>Error al cargar cálculos: {error}</div>;

  return (
    <div className="container" style={{ padding: "2rem 0" }}>
      <div className={s.header}>
        <h1>Historial de Cálculos</h1>
        <Link
          to={`/finca/${fincaId}/nuevo-calculo`}
          className={s.newCalculoBtn}
        >
          + Nuevo Cálculo
        </Link>
      </div>

      <div className={s.calculoList}>
        {calculos.length === 0 ? (
          <p className={s.emptyText}>
            No hay cálculos guardados para esta finca.
          </p>
        ) : (
          calculos.map((calculo) => (
            <div key={calculo.id} className={s.calculoItem}>
              <div className={s.itemHeader}>
                <h3>{calculo.nombre_calculo}</h3>

                <div className={s.actions}>
                  <button
                    onClick={() => openEditModal(calculo)}
                    className={s.btnEdit}
                    title="Editar nombre"
                  >
                    <FaPenToSquare />
                  </button>
                  <button
                    onClick={() => openDeleteModal(calculo.id)}
                    className={s.btnDelete}
                    title="Eliminar cálculo"
                  >
                    <FaTrashCan />
                  </button>
                </div>
              </div>

              <div className={s.grid}>
                <span>
                  <strong>Canal:</strong> {calculo.tipo_canal}
                </span>
                <span>
                  <strong>Q:</strong> {Number(calculo.Q_m3s).toFixed(4)} m³/s
                </span>
                <span>
                  <strong>h:</strong> {Number(calculo.h).toFixed(2)} m
                </span>
                <span>
                  <strong>b:</strong>{" "}
                  {calculo.b ? Number(calculo.b).toFixed(2) : "N/A"} m
                </span>
                <span>
                  <strong>z:</strong>{" "}
                  {calculo.z ? Number(calculo.z).toFixed(2) : "N/A"}
                </span>
                <span>
                  <strong>n:</strong> {Number(calculo.n).toFixed(3)}
                </span>
              </div>
              <span className={s.date}>
                Guardado el: {new Date(calculo.created_at).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal de Borrado */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteCalculo}
        title="¿Eliminar Cálculo?"
        message="Estás a punto de borrar este cálculo permanentemente."
        type="danger"
      />

      {/* Modal de Edición */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Cálculo"
        type="edit"
      >
        <form onSubmit={handleUpdateCalculo} className={s.editForm}>
          <div className={s.field}>
            <label>Nombre del Cálculo</label>
            <input
              type="text"
              value={calculoToEdit.nombre_calculo}
              onChange={(e) =>
                setCalculoToEdit({
                  ...calculoToEdit,
                  nombre_calculo: e.target.value,
                })
              }
              required
            />
          </div>

          <div className={s.modalActions}>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className={s.btnCancel}
            >
              Cancelar
            </button>
            <button type="submit" className={s.btnSave}>
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
