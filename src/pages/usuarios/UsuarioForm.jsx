import React, { useEffect, useState } from "react";
import {
  createHistorialSueldo,
  createUser,
  getUsuarioById,
  updateUsuario,
} from "../../services/usuarioService";
import { notifySuccess, notifyError } from "../../utils/notify";

const initialForm = {
  nombre: "",
  email: "",
  password: "",
  rol: "lider",
  monto: "",
  tipo_pago: "mensual",
  horas_mensuales: "",
};

const getEmpleadoFields = (usuario) => ({
  monto: usuario?.monto ?? usuario?.monto_sueldo ?? usuario?.sueldo ?? "",
  tipo_pago: usuario?.tipo_pago ?? usuario?.tipo_sueldo ?? "mensual",
  horas_mensuales: usuario?.horas_mensuales ?? "",
});

const hasEmpleadoInfo = (usuario) =>
  !isBlank(usuario?.monto) ||
  !isBlank(usuario?.monto_sueldo) ||
  !isBlank(usuario?.sueldo) ||
  !isBlank(usuario?.tipo_pago) ||
  !isBlank(usuario?.tipo_sueldo) ||
  !isBlank(usuario?.horas_mensuales);

const buildForm = (usuario) => ({
  ...initialForm,
  nombre: usuario?.nombre || "",
  email: usuario?.email || "",
  rol: usuario?.rol || "lider",
  ...getEmpleadoFields(usuario),
});

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

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

const UsuarioForm = ({ onCreated, onCancel, usuario }) => {
  const isEdit = Boolean(usuario);
  const [form, setForm] = useState(() => buildForm(usuario));
  const [originalForm, setOriginalForm] = useState(() => buildForm(usuario));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalleError, setDetalleError] = useState("");
  const [hasEmployeeData, setHasEmployeeData] = useState(() => hasEmpleadoInfo(usuario));
  const [showPassword, setShowPassword] = useState(false);

  const isEmpleado = form.rol === "empleado";

  useEffect(() => {
    let active = true;

    const loadUsuario = async () => {
      if (!isEdit || !usuario?.id_usuario) {
        const next = buildForm(usuario);
        setForm(next);
        setOriginalForm(next);
        setHasEmployeeData(hasEmpleadoInfo(usuario));
        return;
      }

      try {
        setLoadingDetalle(true);
        setDetalleError("");
        const response = await getUsuarioById(usuario.id_usuario);
        if (!active) return;
        const detalle = { ...usuario, ...(response.data || {}) };
        const next = buildForm(detalle);
        setForm(next);
        setOriginalForm(next);
        setHasEmployeeData(hasEmpleadoInfo(detalle));
      } catch (err) {
        if (!active) return;
        const next = buildForm(usuario);
        setForm(next);
        setOriginalForm(next);
        setHasEmployeeData(hasEmpleadoInfo(usuario));
        setDetalleError(getApiMessage(err, "No se pudo cargar el detalle actualizado del usuario."));
      } finally {
        if (active) setLoadingDetalle(false);
      }
    };

    loadUsuario();
    return () => {
      active = false;
    };
  }, [isEdit, usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "rol" && value === "lider") {
        next.monto = "";
        next.tipo_pago = "mensual";
        next.horas_mensuales = "";
      }
      if (name === "tipo_pago" && value === "por_hora") {
        next.horas_mensuales = "";
      }
      return next;
    });
  };

  const validate = () => {
    const nombre = form.nombre.trim();
    const email = form.email.trim();
    const password = form.password.trim();

    if (!nombre) return "El nombre es obligatorio.";
    if (nombre.length < 3 || nombre.length > 100) return "El nombre debe tener entre 3 y 100 caracteres.";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) return "El nombre solo debe contener letras y espacios.";
    if (!email) return "El email es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email inválido.";
    if (!["lider", "empleado"].includes(form.rol)) return "Rol inválido.";

    if ((!isEdit || password) && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/.test(password)) {
      return "La contraseña debe tener 8 caracteres, mayúscula, minúscula, número y carácter especial.";
    }

    if (isEmpleado) {
      const salaryTouched = !isBlank(form.monto) || !isBlank(form.horas_mensuales) || form.tipo_pago !== originalForm.tipo_pago;
      const mustValidateSalary = !isEdit || hasEmployeeData || salaryTouched;

      if (mustValidateSalary) {
        const monto = Number(form.monto);
        const horas = Number(form.horas_mensuales);

        if (!form.tipo_pago) return "El tipo de pago es obligatorio.";
        if (!["mensual", "por_hora"].includes(form.tipo_pago)) return "Tipo de pago inválido.";
        if (isBlank(form.monto)) return "El monto es obligatorio para empleados.";
        const montoMin = isEdit ? 0.5 : 0.01;
        if (Number.isNaN(monto) || monto < montoMin || monto > 999999.99) return `El monto debe ser numérico y estar entre ${montoMin} y 999999.99.`;
        if (form.tipo_pago === "mensual" && isBlank(form.horas_mensuales)) {
          return "Las horas mensuales son obligatorias para sueldo mensual.";
        }
        if (form.tipo_pago === "mensual" && (Number.isNaN(horas) || horas < 1 || horas > 320)) {
          return "Las horas mensuales deben estar entre 1 y 320.";
        }
      }
    }

    return "";
  };

  const buildUsuarioPayload = ({ includeRol = false } = {}) => {
    const payload = {
      nombre: form.nombre,
      email: form.email,
    };
    if (includeRol) payload.rol = form.rol;
    if (form.password) payload.password = form.password;
    return cleanPayload(payload);
  };

  const buildCreatePayload = () => {
    const payload = {
      ...buildUsuarioPayload({ includeRol: true }),
      password: form.password,
    };

    if (form.rol === "empleado") {
      payload.monto = form.monto;
      payload.tipo_pago = form.tipo_pago;
      if (form.tipo_pago === "mensual") payload.horas_mensuales = form.horas_mensuales;
    }

    return cleanPayload(payload);
  };

  const buildHistorialPayload = () => {
    if (!isEmpleado || isBlank(form.monto)) return null;

    const changed =
      String(form.monto).trim() !== String(originalForm.monto || "").trim() ||
      form.tipo_pago !== originalForm.tipo_pago ||
      String(form.horas_mensuales || "").trim() !== String(originalForm.horas_mensuales || "").trim();

    if (isEdit && !changed) return null;

    const payload = {
      id_usuario: usuario.id_usuario,
      tipo_pago: form.tipo_pago,
      monto: form.monto,
    };
    if (form.tipo_pago === "mensual") payload.horas_mensuales = form.horas_mensuales;
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
        response = await updateUsuario(usuario.id_usuario, buildUsuarioPayload());
        const historialPayload = buildHistorialPayload();
        if (historialPayload) await createHistorialSueldo(historialPayload);
      } else {
        response = await createUser(buildCreatePayload());
      }

      const msg = response?.message || (isEdit ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
      setSuccess(true);
      notifySuccess(msg);
      setTimeout(() => onCreated?.(), 700);
    } catch (err) {
      const msg = getApiMessage(err, "Error al guardar el usuario.");
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 rounded-4 mb-4 animate-scaleIn overflow-hidden"
      style={{ boxShadow: "var(--shadow-md)" }}>
      <div style={{ height: 4, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}></div>
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0">{isEdit ? "Editar usuario" : "Nuevo usuario"}</h5>
            <p className="text-muted small mb-0">
              {isEdit ? "Modifica los datos del colaborador" : "Completa los datos del nuevo colaborador"}
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
            Cargando datos del usuario...
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
            {isEdit ? "¡Usuario actualizado!" : "¡Usuario creado exitosamente!"}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Nombre completo</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                className="form-control" placeholder="Ej: Juan Pérez" required disabled={loadingDetalle} />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Rol</label>
              <select name="rol" value={form.rol} onChange={handleChange} className="form-select" required disabled={loadingDetalle}>
                <option value="lider">Líder de equipo</option>
                <option value="empleado">Empleado</option>
              </select>
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Correo electrónico</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="form-control" placeholder="usuario@empresa.com" required disabled={loadingDetalle} />
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
            </div>

            {isEmpleado && (
              <div className="col-12 animate-fadeIn">
                <div className="p-3 rounded-3" style={{ backgroundColor: "rgba(79, 70, 229, 0.05)", border: "1px dashed var(--primary)" }}>
                  <div className="d-flex align-items-center mb-2 text-primary">
                    <i className="bi bi-cash-stack me-2"></i>
                    <span className="fw-bold small">Información salarial</span>
                  </div>
                  <div className="row g-2">
                    <div className="col-12 col-sm-4">
                      <label className="form-label small fw-semibold text-muted">Monto</label>
                      <input
                        type="number"
                        name="monto"
                        value={form.monto}
                        onChange={handleChange}
                        className="form-control form-control-sm"
                        placeholder="0.00"
                        min={isEdit ? "0.5" : "0.01"}
                        max="999999.99"
                        step="0.01"
                        disabled={loadingDetalle}
                      />
                    </div>
                    <div className="col-12 col-sm-4">
                      <label className="form-label small fw-semibold text-muted">Tipo de pago</label>
                      <select
                        name="tipo_pago"
                        value={form.tipo_pago}
                        onChange={handleChange}
                        className="form-select form-select-sm"
                        disabled={loadingDetalle}
                      >
                        <option value="mensual">Mensual</option>
                        <option value="por_hora">Por hora</option>
                      </select>
                    </div>
                    {form.tipo_pago === "mensual" && (
                      <div className="col-12 col-sm-4">
                        <label className="form-label small fw-semibold text-muted">Horas mensuales</label>
                        <input
                          type="number"
                          name="horas_mensuales"
                          value={form.horas_mensuales}
                          onChange={handleChange}
                          className="form-control form-control-sm"
                          placeholder="160"
                          min="1"
                          max="320"
                          step="1"
                          disabled={loadingDetalle}
                        />
                      </div>
                    )}
                  </div>
                  {isEdit && !hasEmployeeData && (
                    <p className="text-muted small mb-0 mt-2">
                      El backend no entregó sueldo activo en el detalle disponible; si completas estos campos se registrará un nuevo historial salarial.
                    </p>
                  )}
                </div>
              </div>
            )}
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
                    : <><i className="bi bi-person-plus-fill me-2"></i>Crear usuario</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioForm;
