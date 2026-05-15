import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createEmpresa,
  getEmpresaById,
  updateEmpresa,
} from "../../services/empresaService";
import api from "../../services/api";

const EmpresaForm = ({ show, onClose, onSuccess, empresaId, owner }) => {
  const navigate    = useNavigate();
  const [nombre, setNombre]           = useState("");
  const [error, setError]             = useState("");
  const [saving, setSaving]           = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [successMsg, setSuccessMsg]   = useState("");
  const [confirmDeleteOwner, setConfirmDeleteOwner] = useState(false);
  const [deletingOwner, setDeletingOwner]           = useState(false);
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [currentOwner, setCurrentOwner] = useState(null);
  const [assigningOwner, setAssigningOwner] = useState(false);

  const isEdit = Boolean(empresaId);

  const handleClose = () => {
    setNombre("");
    setError("");
    setSuccessMsg("");
    setConfirmDeleteOwner(false);
    setOwners([]);
    setLoadingOwners(false);
    setSelectedOwnerId("");
    setCurrentOwner(null);
    setAssigningOwner(false);
    onClose();
  };

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!show || !empresaId) { setNombre(""); return; }
      try {
        setLoadingData(true);
        setError("");
        const response = await getEmpresaById(empresaId);
        if (response.success) setNombre(response.data.nombre);
        else setError("No se pudo cargar los datos de la empresa.");
      } catch {
        setError("Error al cargar los datos de la empresa.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchEmpresa();
  }, [empresaId, show]);

  useEffect(() => {
    const fetchOwners = async () => {
      if (!show || !empresaId) return;
      try {
        setLoadingOwners(true);
        const res = await api.get("/usuarios/propietarios");
        const list = res.data?.data || [];
        setOwners(list);

        const ownerFromList = list.find((o) => String(o.id_empresa) === String(empresaId)) || null;
        const resolvedCurrent = owner || ownerFromList;
        setCurrentOwner(resolvedCurrent);
        setSelectedOwnerId(resolvedCurrent?.id_usuario ? String(resolvedCurrent.id_usuario) : "");
      } catch {
        // silent (no bloquear edición de empresa)
      } finally {
        setLoadingOwners(false);
      }
    };

    fetchOwners();
  }, [show, empresaId, owner]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!nombre.trim()) { setError("El nombre de la empresa es obligatorio."); return; }
    try {
      setSaving(true);
      const response = isEdit
        ? await updateEmpresa(empresaId, { nombre: nombre.trim() })
        : await createEmpresa({ nombre: nombre.trim() });
      if (!response.success) { setError("No se pudo guardar la empresa."); return; }
      setSuccessMsg(isEdit ? "Empresa actualizada correctamente." : "Empresa creada correctamente.");
      if (onSuccess) onSuccess();
      setTimeout(handleClose, 900);
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        "Error al guardar empresa."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOwner = async () => {
    if (!currentOwner) return;
    try {
      setDeletingOwner(true);
      await api.delete(`/usuarios/${currentOwner.id_usuario}/hard-delete`);
      setConfirmDeleteOwner(false);
      if (onSuccess) onSuccess();
      setSuccessMsg("Propietario eliminado. La empresa quedó sin propietario asignado.");
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar el propietario.");
      setConfirmDeleteOwner(false);
    } finally {
      setDeletingOwner(false);
    }
  };

  const handleAssignOwner = async () => {
    if (!empresaId || !selectedOwnerId) return;
    if (currentOwner?.id_usuario && String(currentOwner.id_usuario) === String(selectedOwnerId)) return;

    try {
      setAssigningOwner(true);
      setError("");
      setSuccessMsg("");
      const res = await api.put(`/usuarios/${selectedOwnerId}`, { id_empresa: empresaId });
      if (!res.data?.success) {
        setError(res.data?.message || "No se pudo asignar el propietario.");
        return;
      }
      const updatedOwner = owners.find((o) => String(o.id_usuario) === String(selectedOwnerId)) || currentOwner;
      setCurrentOwner(updatedOwner);
      setSuccessMsg("Propietario asignado correctamente.");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Error al asignar el propietario.");
    } finally {
      setAssigningOwner(false);
    }
  };

  return (
    <>
      {/* ── Modal principal ── */}
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <div className="modal-card p-4 animate-scaleIn" style={{ maxWidth: 500 }}>

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="fw-bold mb-0">{isEdit ? "Editar Empresa" : "Crear Empresa"}</h5>
              <p className="text-muted small mb-0">
                {isEdit ? "Modifica el nombre y gestiona el propietario" : "Registra una nueva empresa en el sistema"}
              </p>
            </div>
            <button className="btn btn-sm btn-light rounded-circle p-1 lh-1" onClick={handleClose} disabled={saving}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center py-2 small rounded-3 mb-3">
              <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success d-flex align-items-center py-2 small rounded-3 mb-3">
              <i className="bi bi-check-circle-fill me-2"></i>{successMsg}
            </div>
          )}

          {loadingData ? (
            <div className="text-center py-4">
              <span className="spinner-border spinner-border-sm me-2"></span>
              <span className="text-muted small">Cargando datos...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Nombre */}
              <div className="mb-4">
                <label className="form-label fw-semibold small">Nombre de la empresa *</label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-building text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Empresa ABC"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              {/* TEMP: Sección de propietario oculta (pendiente de corrección de binding/mapeo) */}
              {/* {isEdit && (
                <div className="mb-4">
                  ...
                </div>
              )} */}

              {/* Botones del form */}
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-light flex-fill fw-semibold" onClick={handleClose} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-fill" disabled={saving || loadingData}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
                    : isEdit
                      ? <><i className="bi bi-check-lg me-2"></i>Guardar cambios</>
                      : <><i className="bi bi-building-add me-2"></i>Crear empresa</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Modal confirmación eliminar propietario ── */}
      {confirmDeleteOwner && currentOwner && (
        <div className="modal-overlay" style={{ zIndex: 2100 }}
          onClick={(e) => e.target === e.currentTarget && setConfirmDeleteOwner(false)}>
          <div className="modal-card p-4 animate-scaleIn" style={{ maxWidth: 440 }}>
            <div className="d-flex align-items-start gap-3 mb-4">
              <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 48, height: 48, background: "rgba(239,68,68,.1)" }}>
                <i className="bi bi-trash-fill" style={{ color: "var(--danger)", fontSize: 22 }}></i>
              </div>
              <div>
                <h6 className="fw-bold mb-1">Eliminar propietario permanentemente</h6>
                <p className="text-muted small mb-0">
                  ¿Estás seguro de eliminar a <strong>{currentOwner.nombre}</strong> ({currentOwner.email})?
                </p>
                <div className="alert alert-danger d-flex align-items-start gap-2 small rounded-3 mt-2 mb-0 py-2">
                  <i className="bi bi-exclamation-octagon-fill flex-shrink-0 mt-1"></i>
                  <div>
                    Esta acción es <strong>irreversible</strong>. Se eliminarán también sus registros de horas y asignaciones de proyectos.
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-light flex-fill fw-semibold"
                onClick={() => setConfirmDeleteOwner(false)}
                disabled={deletingOwner}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger flex-fill fw-bold"
                onClick={handleDeleteOwner}
                disabled={deletingOwner}
              >
                {deletingOwner
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Eliminando...</>
                  : <><i className="bi bi-trash-fill me-2"></i>Eliminar permanentemente</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmpresaForm;
