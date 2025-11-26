import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getFincas,
  createFinca,
  deleteFinca,
  updateFinca,
} from "../../services/apiService";
import Modal from "../Modal/Modal.jsx";
import s from "./Dashboard.module.scss";
// import { FaEdit, FaTrash } from "react-icons/fa"; // Puedes descomentar si usas los íconos

export default function Dashboard() {
  const [fincas, setFincas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el formulario de nueva finca
  const [nombreFinca, setNombreFinca] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [formError, setFormError] = useState(null);

  // Estados para el modal de borrado
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fincaToDelete, setFincaToDelete] = useState(null);

  // --- ESTADOS PARA EDICIÓN ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fincaToEdit, setFincaToEdit] = useState({
    id: "",
    nombre_finca: "",
    ubicacion: "",
  });

  // Función para cargar las fincas del usuario
  const fetchFincas = async () => {
    try {
      setIsLoading(true);
      const data = await getFincas();
      setFincas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect para cargar las fincas cuando el componente se monta
  useEffect(() => {
    fetchFincas();
  }, []);

  // Manejador para crear una nueva finca
  const handleCreateFinca = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!nombreFinca) {
      setFormError("El nombre de la finca es obligatorio.");
      return;
    }

    try {
      await createFinca({ nombre_finca: nombreFinca, ubicacion });
      // Limpia el formulario y recarga la lista de fincas
      setNombreFinca("");
      setUbicacion("");
      fetchFincas();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const openDeleteModal = (e, fincaId) => {
    e.preventDefault(); // Importante para no navegar al link
    setFincaToDelete(fincaId);
    setIsDeleteModalOpen(true);
  };

  // Función que se ejecuta cuando el usuario confirma en el modal de borrado
  const confirmDeleteFinca = async () => {
    if (!fincaToDelete) return;

    try {
      await deleteFinca(fincaToDelete);
      // Actualizamos el estado local eliminando la finca borrada
      setFincas(fincas.filter((f) => f.id !== fincaToDelete));
      setIsDeleteModalOpen(false);
      setFincaToDelete(null);
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const openEditModal = (e, finca) => {
    e.preventDefault(); // Evita navegar al link
    setFincaToEdit(finca); // Cargamos los datos de la finca en el estado
    setIsEditModalOpen(true);
  };

  // Función para guardar los cambios de edición
  const handleUpdateFinca = async (e) => {
    e.preventDefault(); // Evita recargar la página por el submit del form

    try {
      await updateFinca(fincaToEdit.id, {
        nombre_finca: fincaToEdit.nombre_finca,
        ubicacion: fincaToEdit.ubicacion,
      });

      // Actualizamos la lista localmente (optimistic UI)
      setFincas(
        fincas.map((f) =>
          f.id === fincaToEdit.id ? { ...f, ...fincaToEdit } : f
        )
      );

      setIsEditModalOpen(false); // Cerramos modal
    } catch (err) {
      alert("Error al actualizar: " + err.message);
    }
  };

  // --- RENDERIZADO ---

  if (isLoading) {
    return <div className={s.loadingText}>Cargando panel...</div>;
  }

  if (error) {
    return <div className={s.errorText}>Error al cargar fincas: {error}</div>;
  }

  return (
    <div className="container" style={{ padding: "2rem 0" }}>
      <h1>Mi Panel de Control</h1>
      <p>Bienvenido. Aquí puedes administrar tus fincas y cálculos.</p>

      {/* Formulario para crear nueva finca */}
      <div className={s.formCard}>
        <h2>Crear Nueva Finca</h2>
        <form onSubmit={handleCreateFinca}>
          <div className={s.field}>
            <label htmlFor="nombreFinca">Nombre de la Finca (*)</label>
            <input
              type="text"
              id="nombreFinca"
              value={nombreFinca}
              onChange={(e) => setNombreFinca(e.target.value)}
            />
          </div>
          <div className={s.field}>
            <label htmlFor="ubicacion">Ubicación (Opcional)</label>
            <input
              type="text"
              id="ubicacion"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
            />
          </div>

          {formError && <p className={s.errorText}>{formError}</p>}

          <button type="submit" className={s.submitBtn}>
            Guardar Finca
          </button>
        </form>
      </div>

      {/* Lista de Fincas */}
      <div className={s.fincaList}>
        <h2>Mis Fincas</h2>
        {fincas.length === 0 ? (
          <p>Aún no has creado ninguna finca. ¡Añade una!</p>
        ) : (
          fincas.map((finca) => (
            <Link
              to={`/finca/${finca.id}`}
              key={finca.id}
              className={s.fincaLink}
            >
              <div className={s.fincaItem}>
                <div>
                  <h3>{finca.nombre_finca}</h3>
                  <span>{finca.ubicacion || "Sin ubicación"}</span>
                </div>
                <div className={s.actions}>
                  <span>Ver cálculos &rarr;</span>

                  {/* BOTÓN EDITAR */}
                  <button
                    onClick={(e) => openEditModal(e, finca)}
                    className={s.btnEdit}
                  >
                    Editar
                  </button>

                  {/* BOTÓN BORRAR */}
                  <button
                    onClick={(e) => openDeleteModal(e, finca.id)}
                    className={s.btnDelete}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Modal de Confirmación Borrar */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteFinca}
        title="¿Eliminar Finca?"
        message="Estás a punto de borrar esta finca y todos sus cálculos asociados. Esta acción no se puede deshacer."
        type="danger"
      />

      {/* Modal de Edición */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Finca"
        type="edit"
      >
        <form onSubmit={handleUpdateFinca} className={s.editForm}>
          <div className={s.field}>
            <label>Nombre de la Finca</label>
            <input
              type="text"
              value={fincaToEdit.nombre_finca}
              onChange={(e) =>
                setFincaToEdit({ ...fincaToEdit, nombre_finca: e.target.value })
              }
              required
            />
          </div>
          <div className={s.field}>
            <label>Ubicación</label>
            <input
              type="text"
              value={fincaToEdit.ubicacion}
              onChange={(e) =>
                setFincaToEdit({ ...fincaToEdit, ubicacion: e.target.value })
              }
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
            <button type="submit" className={`${s.submitBtn} ${s.btnSave}`}>
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
