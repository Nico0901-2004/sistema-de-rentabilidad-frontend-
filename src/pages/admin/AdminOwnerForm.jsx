import React, { useState, useEffect } from "react";
import { getEmpresas } from "../../services/empresaService";
import { createUser, updateUsuario } from "../../services/usuarioService";
import { notifySuccess } from "../../utils/notify";

const AdminOwnerForm = ({ onSaved, onCancel, owner }) => {
  const isEdit = Boolean(owner);
  const [form, setForm] = useState({
    nombre:     owner?.nombre     || "",
    email:      owner?.email      || "",
    password:   "",
    id_empresa: owner?.id_empresa || "",
    is_active:  owner?.is_active  !== undefined ? String(owner.is_active) : "true",
  });
  const [empresas, setEmpresas]       = useState([]);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    getEmpresas()
      .then((res) => { if (res?.success) setEmpresas(res.data); })
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let response;
      if (isEdit) {
        const payload = { nombre: form.nombre, email: form.email };
        if (form.password) payload.password = form.password;
        if (form.id_empresa) payload.id_empresa = Number(form.id_empresa);
        payload.is_active = form.is_active === "true";
        response = await updateUsuario(owner.id_usuario, payload);
      } else {
        response = await createUser({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          id_empresa: Number(form.id_empresa),
        });
      }
      if (response?.success || response?.user) {
        notifySuccess(isEdit ? "Propietario actualizado correctamente." : "Propietario creado correctamente.");
        onSaved?.();
      } else {
        setError(response?.message || "Error al guardar el propietario.");
      }
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      if (apiMessage === "La empresa ya tiene un propietario") {
        setError("Esta empresa ya tiene Propietario");
      } else {
        setError(apiMessage || "Error al guardar el propietario.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-card p-4 animate-scaleIn">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0">{isEdit ? "Editar Propietario" : "Crear Propietario"}</h5>
            <p className="text-muted small mb-0">
              {isEdit ? "Modifica los datos del propietario" : "Asigna un propietario a una empresa"}
            </p>
          </div>
          <button className="btn btn-sm btn-light rounded-circle p-1 lh-1" onClick={onCancel}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center py-2 small rounded-3 mb-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Empresa — visible siempre (requerido en create, editable en edit) */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Empresa</label>
            <select name="id_empresa" value={form.id_empresa} onChange={handleChange}
              className="form-select" required={!isEdit}>
              <option value="">— Selecciona una empresa —</option>
              {empresas.map((e) => (
                <option key={e.id_empresa} value={e.id_empresa}>{e.empresa_nombre}</option>
              ))}
            </select>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Nombre completo</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                className="form-control" placeholder="Ej: Juan Pérez" required />
            </div>

            {isEdit && (
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold small">Estado</label>
                <select name="is_active" value={form.is_active} onChange={handleChange} className="form-select">
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small">Correo electrónico</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              className="form-control" placeholder="propietario@empresa.com" required />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold small">
              Contraseña {isEdit && <span className="text-muted fw-normal">(dejar vacío para no cambiar)</span>}
            </label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-control"
                placeholder={isEdit ? "Nueva contraseña (opcional)" : "Mínimo 8 caracteres"}
                required={!isEdit}
                minLength={form.password ? 8 : undefined}
              />
              <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(!showPassword)}>
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
            {!isEdit && (
              <div className="form-text small text-muted mt-1">
                Debe tener mayúsculas, minúsculas, número y carácter especial.
              </div>
            )}
          </div>

          <div className="d-flex gap-2">
            <button type="button" className="btn btn-light flex-fill fw-semibold" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>{isEdit ? "Guardando..." : "Creando..."}</>
                : isEdit
                  ? <><i className="bi bi-check-lg me-2"></i>Guardar cambios</>
                  : <><i className="bi bi-person-plus me-2"></i>Crear Propietario</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOwnerForm;
