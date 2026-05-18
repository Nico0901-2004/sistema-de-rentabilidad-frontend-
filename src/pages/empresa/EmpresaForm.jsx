import React, { useEffect, useState } from "react";
import {
  createEmpresa,
  getEmpresaById,
  updateEmpresa,
} from "../../services/empresaService";

const EmpresaForm = ({ show, onClose, onSuccess, empresaId }) => {
  const [nombre, setNombre]           = useState("");
  const [error, setError]             = useState("");
  const [saving, setSaving]           = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [successMsg, setSuccessMsg]   = useState("");

  const isEdit = Boolean(empresaId);

  const handleClose = () => {
    setNombre("");
    setError("");
    setSuccessMsg("");
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

  return (
    <>
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
    </>
  );
};

export default EmpresaForm;
