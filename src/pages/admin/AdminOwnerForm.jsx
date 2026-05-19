import React, { useState, useEffect, useMemo } from "react";
import { getEmpresas } from "../../services/empresaService";
import { createUser, getUsuarioById, getUsuarios, updateUsuario } from "../../services/usuarioService";
import { notifyError, notifySuccess } from "../../utils/notify";

const EMPTY_FORM = {
  nombre: "",
  email: "",
  password: "",
  id_empresa: "",
};

const buildForm = (owner) => ({
  ...EMPTY_FORM,
  nombre: owner?.nombre || "",
  email: owner?.email || "",
  id_empresa: owner?.id_empresa || "",
});

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";
const sameId = (a, b) => String(a) === String(b);
const isActive = (item) => item?.is_active !== false && item?.activo !== false;

const cleanPayload = (payload) =>
  Object.entries(payload).reduce((acc, [key, value]) => {
    if (!isBlank(value)) acc[key] = typeof value === "string" ? value.trim() : value;
    return acc;
  }, {});

const getApiMessage = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.errors?.[0]?.msg ||
  err?.message ||
  fallback;

const AdminOwnerForm = ({ onSaved, onCancel, owner }) => {
  const isEdit = Boolean(owner);
  const [form, setForm] = useState(() => buildForm(owner));
  const [empresas, setEmpresas]       = useState([]);
  const [owners, setOwners]           = useState([]);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalleError, setDetalleError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    Promise.all([
      getEmpresas(),
      getUsuarios().catch(() => ({ data: [] })),
    ])
      .then(([empRes, ownerRes]) => {
        if (empRes?.success) setEmpresas(empRes.data || []);
        setOwners((ownerRes?.data || []).filter(isActive));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;

    const loadOwner = async () => {
      if (!isEdit || !owner?.id_usuario) {
        setForm(buildForm(owner));
        setError("");
        setSuccess(false);
        setDetalleError("");
        return;
      }

      try {
        setLoadingDetalle(true);
        setError("");
        setSuccess(false);
        setDetalleError("");
        const response = await getUsuarioById(owner.id_usuario);
        if (!active) return;
        setForm(buildForm({ ...owner, ...(response.data || {}) }));
      } catch (err) {
        if (!active) return;
        setForm(buildForm(owner));
        setDetalleError(getApiMessage(err, "No se pudo cargar el detalle actualizado del propietario."));
      } finally {
        if (active) setLoadingDetalle(false);
      }
    };

    loadOwner();
    return () => {
      active = false;
    };
  }, [isEdit, owner]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const empresasDisponibles = useMemo(() => {
    const currentOwnerId = owner?.id_usuario;

    return empresas.filter((empresa) => {
      const ownerFromEmpresa = empresa.propietario_id || empresa.id_propietario;
      const ownerFromUsuarios = owners.find((o) => sameId(o.id_empresa, empresa.id_empresa))?.id_usuario;
      const assignedOwnerId = ownerFromEmpresa || ownerFromUsuarios;

      if (!assignedOwnerId) return true;
      return isEdit && currentOwnerId && sameId(assignedOwnerId, currentOwnerId);
    });
  }, [empresas, isEdit, owner?.id_usuario, owners]);

  const validate = () => {
    const nombre = form.nombre.trim();
    const email = form.email.trim();
    const password = form.password.trim();

    if (!nombre) return "El nombre es obligatorio.";
    if (nombre.length < 3 || nombre.length > 100) return "El nombre debe tener entre 3 y 100 caracteres.";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) return "El nombre solo debe contener letras y espacios.";
    if (!email) return "El email es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email inválido.";
    if (!form.id_empresa) return "Selecciona una empresa.";
    if (!empresasDisponibles.some((empresa) => sameId(empresa.id_empresa, form.id_empresa))) {
      return "Selecciona una empresa sin propietario.";
    }
    if ((!isEdit || password) && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/.test(password)) {
      return "La contraseña debe tener 8 caracteres, mayúscula, minúscula, número y carácter especial.";
    }

    return "";
  };

  const buildPayload = () => {
    const payload = {
      nombre: form.nombre,
      email: form.email,
    };

    if (form.password) payload.password = form.password;
    payload.id_empresa = Number(form.id_empresa);

    return cleanPayload(payload);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      notifyError(validationError);
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isEdit) {
        response = await updateUsuario(owner.id_usuario, buildPayload());
      } else {
        response = await createUser(buildPayload());
      }
      if (response?.success || response?.user) {
        setSuccess(true);
        notifySuccess(isEdit ? "Propietario actualizado correctamente." : "Propietario creado correctamente.");
        setTimeout(() => onSaved?.(), 600);
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
    <div className="card border-0 rounded-4 mb-4 animate-scaleIn overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
      <div style={{ height: 4, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}></div>
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0">{isEdit ? "Editar propietario" : "Crear propietario"}</h5>
            <p className="text-muted small mb-0">
              {isEdit ? "Modifica los datos de acceso del propietario" : "Asigna un propietario a una empresa"}
            </p>
          </div>
          <button type="button"
            className="btn btn-sm btn-light rounded-circle p-1 lh-1 d-flex align-items-center justify-content-center"
            style={{ width: 30, height: 30 }}
            onClick={onCancel}>
            <i className="bi bi-x-lg" style={{ fontSize: 12 }}></i>
          </button>
        </div>

        {loadingDetalle && (
          <div className="alert alert-info d-flex align-items-center py-2 small rounded-3 mb-3">
            <span className="spinner-border spinner-border-sm me-2"></span>
            Cargando datos del propietario...
          </div>
        )}
        {detalleError && (
          <div className="alert alert-warning d-flex align-items-center py-2 small rounded-3 mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{detalleError}
          </div>
        )}
        {error && (
          <div className="alert alert-danger d-flex align-items-center py-2 small rounded-3 mb-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}
        {success && (
          <div className="alert alert-success d-flex align-items-center py-2 small rounded-3 mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            {isEdit ? "Propietario actualizado." : "Propietario creado."}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Empresa</label>
              <select name="id_empresa" value={form.id_empresa} onChange={handleChange}
                className="form-select" required disabled={loadingDetalle}>
                <option value="">Selecciona una empresa</option>
                {empresasDisponibles.map((e) => (
                  <option key={e.id_empresa} value={e.id_empresa}>{e.empresa_nombre}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Nombre completo</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                className="form-control" placeholder="Ej: Juan Pérez" required disabled={loadingDetalle} />
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Correo electrónico</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="form-control" placeholder="propietario@empresa.com" required disabled={loadingDetalle} />
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">
                Contraseña {isEdit && <span className="text-muted fw-normal">(vacío = sin cambios)</span>}
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder={isEdit ? "Nueva contraseña (opcional)" : "Ej: MiPass123!"}
                  required={!isEdit}
                  disabled={loadingDetalle}
                />
                <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
              <div className="form-text small text-muted mt-1">
                Debe tener mayúscula, minúscula, número y carácter especial.
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="button" className="btn btn-light fw-semibold px-4" onClick={onCancel} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-fill" disabled={loading || loadingDetalle || success}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>{isEdit ? "Guardando..." : "Creando..."}</>
                : success
                  ? <><i className="bi bi-check-lg me-2"></i>{isEdit ? "Guardado" : "Creado"}</>
                : isEdit
                  ? <><i className="bi bi-check-lg me-2"></i>Guardar cambios</>
                  : <><i className="bi bi-person-plus-fill me-2"></i>Crear propietario</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOwnerForm;
