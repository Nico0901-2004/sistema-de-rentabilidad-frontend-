import React, { useState, useEffect } from "react";
import { createProyecto, updateProyecto, getProyectoById } from "../../services/proyectoService";
import { createFase } from "../../services/faseService";
import { getServicios } from "../../services/servicioService";
import { getUsuarios } from "../../services/usuarioService";
import { notifySuccess, notifyError } from "../../utils/notify";
import { ESTADOS_PROYECTO, EstadoProyectoBadge, getTransicionesPermitidas } from "./projectUtils";

const EMPTY = {
  nombre: "",
  descripcion: "",
  id_servicio: "",
  id_lider: "",
  presupuesto: "",
  margen: "",
  fecha_inicio: "",
  fecha_fin_estimada: "",
  empleados_ids: [],
  estado: ESTADOS_PROYECTO.COTIZADO,
};

const EMPTY_FASE = {
  nombre: "",
  horas_estimadas: "",
};

const TEXT_ONLY_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

const ProyectoForm = ({ proyectoId, onSaved, onCancel, children }) => {
  const [form, setForm] = useState(EMPTY);
  const [originalForm, setOriginalForm] = useState(EMPTY);
  const [fasesDraft, setFasesDraft] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [lideres, setLideres] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(proyectoId);
  const formId = `proyecto-form-${proyectoId || "nuevo"}`;
  const requiresApprovalData = isEditing && form.estado === ESTADOS_PROYECTO.APROBADO;
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const isPastDate = form.fecha_inicio && form.fecha_inicio < todayStr;

  useEffect(() => {
    Promise.all([getServicios(), getUsuarios()])
      .then(([sRes, uRes]) => {
        if (sRes?.success && Array.isArray(sRes.data)) {
          setServicios(sRes.data);
        } else if (Array.isArray(sRes)) {
          setServicios(sRes);
        }

        if (uRes?.success || Array.isArray(uRes?.data)) {
          const users = uRes.data || [];
          setLideres(users.filter((u) => u.rol === "lider"));
          setEmpleados(users.filter((u) => u.rol === "empleado"));
        }
      })
      .catch(() => {
        setError("Error al cargar datos iniciales.");
        notifyError("Error al cargar datos iniciales.");
      });
  }, []);

  useEffect(() => {
    if (!proyectoId) {
      setForm(EMPTY);
      setOriginalForm(EMPTY);
      setFasesDraft([]);
      return;
    }

    getProyectoById(proyectoId)
      .then((res) => {
        if (res?.success) {
          const p = res.data;
          const loadedForm = {
            ...EMPTY,
            nombre: p.nombre || "",
            descripcion: p.descripcion || "",
            id_servicio: p.id_servicio || "",
            id_lider: p.id_lider || "",
            presupuesto: p.presupuesto || "",
            margen: p.margen !== undefined && p.margen !== null ? String(p.margen) : "",
            fecha_inicio: p.fecha_inicio?.slice(0, 10) || "",
            fecha_fin_estimada: p.fecha_fin_estimada?.slice(0, 10) || "",
            empleados_ids: (p.empleados || []).map((e) => e.id_usuario),
            estado: p.estado || ESTADOS_PROYECTO.COTIZADO,
          };

          setForm(loadedForm);
          setOriginalForm(loadedForm);
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "No se pudo cargar el proyecto.";
        setError(msg);
        notifyError(msg);
      });
  }, [proyectoId]);

  const stateOptions = isEditing
    ? Array.from(new Set([originalForm.estado || form.estado, ...getTransicionesPermitidas(originalForm)]))
    : [ESTADOS_PROYECTO.COTIZADO];

  const handleChange = (e) => {
    setError("");
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEmpleado = (id) => {
    setError("");
    setForm((prev) => {
      const ids = prev.empleados_ids.includes(id)
        ? prev.empleados_ids.filter((x) => x !== id)
        : [...prev.empleados_ids, id];
      return { ...prev, empleados_ids: ids };
    });
  };

  const handleFaseChange = (index, field, value) => {
    setError("");
    setFasesDraft((prev) =>
      prev.map((fase, i) => (i === index ? { ...fase, [field]: value } : fase))
    );
  };

  const addFase = () => {
    setError("");
    setFasesDraft((prev) => [...prev, { ...EMPTY_FASE }]);
  };

  const removeFase = (index) => {
    setError("");
    setFasesDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const validateFases = () => {
    const nombres = new Set();

    for (const fase of fasesDraft) {
      const nombre = fase.nombre.trim();
      const horasNum = Number(fase.horas_estimadas);

      if (!nombre) return "El nombre de cada fase es obligatorio.";
      if (nombre.length < 3 || nombre.length > 100) return "El nombre de cada fase debe tener entre 3 y 100 caracteres.";
      if (!TEXT_ONLY_REGEX.test(nombre)) return "El nombre de la fase solo debe contener letras y espacios.";
      if (fase.horas_estimadas === "" || isNaN(horasNum) || horasNum < 1) return "Las horas estimadas de cada fase deben ser mayores o iguales a 1.";

      const key = nombre.toLowerCase();
      if (nombres.has(key)) return "No puedes repetir nombres de fases en el mismo proyecto.";
      nombres.add(key);
    }

    return "";
  };

  const validateForm = (nombre, descripcion, margenNum) => {
    if (nombre.length < 3 || nombre.length > 100) return "El nombre debe tener entre 3 y 100 caracteres.";
    if (descripcion && (descripcion.length < 3 || descripcion.length > 500)) return "La descripción debe tener entre 3 y 500 caracteres.";
    if (descripcion && !TEXT_ONLY_REGEX.test(descripcion)) return "La descripción solo debe contener letras y espacios.";
    if (!form.id_servicio) return "Selecciona un servicio.";
    if (!form.presupuesto || Number(form.presupuesto) < 1) return "El presupuesto debe ser mayor o igual a 1.";
    if (form.margen === "" || isNaN(margenNum) || margenNum < 0 || margenNum > 100) return "El margen (% ganancia) debe ser un número entre 0 y 100.";

    if (requiresApprovalData) {
      if (!form.id_lider) return "Selecciona un líder responsable para aprobar el proyecto.";
      if (!form.fecha_inicio) return "La fecha de inicio es obligatoria para aprobar el proyecto.";
      if (!form.fecha_fin_estimada) return "La fecha fin estimada es obligatoria para aprobar el proyecto.";
      if (form.empleados_ids.length === 0) return "Asigna al menos un empleado para aprobar el proyecto.";
    }

    if (form.fecha_inicio && form.fecha_fin_estimada && new Date(form.fecha_inicio) > new Date(form.fecha_fin_estimada)) {
      return "La fecha de inicio no puede ser posterior a la fecha fin.";
    }

    if (!isEditing) return validateFases();
    return "";
  };

  const buildPayload = (nombre, descripcion, margenNum) => ({
    nombre,
    ...(descripcion ? { descripcion } : {}),
    id_servicio: Number(form.id_servicio),
    presupuesto: Number(form.presupuesto),
    margen: margenNum,
    ...(form.id_lider ? { id_lider: Number(form.id_lider) } : {}),
    ...(form.fecha_inicio ? { fecha_inicio: form.fecha_inicio } : {}),
    ...(form.fecha_fin_estimada ? { fecha_fin_estimada: form.fecha_fin_estimada } : {}),
    ...(form.empleados_ids.length > 0 ? { empleados: form.empleados_ids.map(Number) } : {}),
    ...(isEditing ? { estado: form.estado } : {}),
  });

  const createDraftFases = async (proyectoIdCreado) => {
    const payloads = fasesDraft.map((fase) => ({
      nombre: fase.nombre.trim(),
      horas_estimadas: Number(fase.horas_estimadas),
    }));

    for (const fase of payloads) {
      await createFase(proyectoIdCreado, fase);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");

    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();
    const margenNum = Number(form.margen);
    const validationMsg = validateForm(nombre, descripcion, margenNum);

    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    if (isEditing) {
      const isUnchanged = JSON.stringify(form) === JSON.stringify(originalForm);
      if (isUnchanged) {
        setSuccess("No se realizaron cambios.");
        notifySuccess("No se realizaron cambios.");
        setTimeout(() => onSaved?.(), 1000);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = buildPayload(nombre, descripcion, margenNum);
      const res = isEditing
        ? await updateProyecto(proyectoId, payload)
        : await createProyecto(payload);

      if (!res?.success) {
        const errorMsg = res?.message || "Error al guardar.";
        setError(errorMsg);
        notifyError(errorMsg);
        return;
      }

      const createdId = res.data?.id_proyecto;
      if (!isEditing && fasesDraft.length > 0 && createdId) {
        try {
          await createDraftFases(createdId);
        } catch (faseErr) {
          const faseMsg = faseErr.response?.data?.message || "El proyecto fue creado, pero no se pudieron crear todas las fases.";
          setError(faseMsg);
          notifyError(faseMsg);
          setTimeout(() => onSaved?.(), 1300);
          return;
        }
      }

      const successMsg = isEditing ? "Proyecto actualizado correctamente." : "Proyecto creado correctamente.";
      setSuccess(successMsg);
      notifySuccess(successMsg);
      setTimeout(() => onSaved?.(), 1000);
    } catch (err) {
      const catchMsg = err.response?.data?.message || "Error en el servidor.";
      setError(catchMsg);
      notifyError(catchMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 rounded-4 mb-4 animate-scaleIn overflow-hidden shadow-sm">
      <div style={{ height: 4, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}></div>
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
          <div>
            <h5 className="fw-bold mb-1">{isEditing ? "Editar proyecto" : "Nuevo proyecto"}</h5>
            <p className="text-muted small mb-0">Organiza el trabajo asignando servicio y personal</p>
          </div>
          <EstadoProyectoBadge estado={isEditing ? form.estado : ESTADOS_PROYECTO.COTIZADO} />
        </div>

        {error && (
          <div className="alert alert-danger py-2 small rounded-3 mb-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}

        {success && (
          <div className="alert alert-success py-2 small rounded-3 mb-3 animate-fadeIn">
            <i className="bi bi-check-circle-fill me-2"></i>{success}
          </div>
        )}

        <form id={formId} onSubmit={handleSubmit}>
          <div className="row g-3">
            {isEditing && (
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold small">Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange} className="form-select" disabled={loading || !!success}>
                  {stateOptions.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
            )}

            {!isEditing && (
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold small">Estado inicial</label>
                <div className="form-control bg-light d-flex align-items-center" style={{ minHeight: 38 }}>
                  <EstadoProyectoBadge estado={ESTADOS_PROYECTO.COTIZADO} />
                </div>
              </div>
            )}

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Nombre del proyecto *</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange} className="form-control" minLength={3} maxLength={100} required disabled={loading || !!success} />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold small">Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="form-control"
                rows={3}
                maxLength={500}
                disabled={loading || !!success}
              />
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Servicio *</label>
              <select name="id_servicio" value={form.id_servicio} onChange={handleChange} className="form-select" required disabled={loading || !!success}>
                <option value="">Selecciona servicio</option>
                {servicios.map((s) => <option key={s.id_servicio} value={s.id_servicio}>{s.nombre}</option>)}
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Líder responsable {requiresApprovalData ? "*" : ""}</label>
              <select name="id_lider" value={form.id_lider} onChange={handleChange} className="form-select" required={requiresApprovalData} disabled={loading || !!success}>
                <option value="">Selecciona un líder</option>
                {lideres.map((l) => <option key={l.id_usuario} value={l.id_usuario}>{l.nombre}</option>)}
              </select>
            </div>

            <div className="col-6 col-sm-3">
              <label className="form-label fw-semibold small">Presupuesto *</label>
              <input type="number" name="presupuesto" value={form.presupuesto} onChange={handleChange} className="form-control" min="1" step="0.01" placeholder="0.00" required disabled={loading || !!success} />
            </div>

            <div className="col-6 col-sm-3">
              <label className="form-label fw-semibold small">Margen (% ganancia) *</label>
              <div className="input-group">
                <input type="number" name="margen" value={form.margen} onChange={handleChange} className="form-control" min="0" max="100" step="0.01" placeholder="0.00" required disabled={loading || !!success} />
                <span className="input-group-text small">%</span>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Fecha inicio {requiresApprovalData ? "*" : ""}</label>
              <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} className="form-control" required={requiresApprovalData} disabled={loading || !!success} />
              {isPastDate && (
                <div className="form-text text-warning small mt-1 fw-medium animate-fadeIn">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  Advertencia: Estás registrando una fecha en el pasado.
                </div>
              )}
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Fecha fin estimada {requiresApprovalData ? "*" : ""}</label>
              <input type="date" name="fecha_fin_estimada" value={form.fecha_fin_estimada} onChange={handleChange} className="form-control" required={requiresApprovalData} disabled={loading || !!success} />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold small d-flex justify-content-between">
                <span>Asignar Equipo (Empleados) {requiresApprovalData ? "*" : ""}</span>
                <span className="text-muted fw-normal">{form.empleados_ids.length} seleccionados</span>
              </label>
              <div className="border rounded-3 p-2 bg-light" style={{ maxHeight: 150, overflowY: "auto", pointerEvents: (loading || !!success) ? "none" : "auto", opacity: (loading || !!success) ? 0.6 : 1 }}>
                {empleados.map((u) => (
                  <div
                    key={u.id_usuario}
                    className={`d-flex align-items-center p-2 mb-1 rounded-2 pointer ${form.empleados_ids.includes(u.id_usuario) ? "bg-white shadow-sm" : ""}`}
                    onClick={() => toggleEmpleado(u.id_usuario)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="me-2 border rounded d-flex align-items-center justify-content-center" style={{ width: 18, height: 18, background: form.empleados_ids.includes(u.id_usuario) ? "var(--primary)" : "white" }}>
                      {form.empleados_ids.includes(u.id_usuario) && <i className="bi bi-check text-white small"></i>}
                    </div>
                    <span className="small">{u.nombre}</span>
                  </div>
                ))}
              </div>
            </div>

            {!isEditing && (
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                  <label className="form-label fw-semibold small mb-0">Fases iniciales</label>
                  <button type="button" className="btn btn-sm btn-light fw-semibold" onClick={addFase} disabled={loading || !!success}>
                    <i className="bi bi-plus-circle me-1"></i>
                    Agregar fase
                  </button>
                </div>

                {fasesDraft.length === 0 ? (
                  <div className="border rounded-3 p-3 bg-light text-muted small">
                    Puedes crear el proyecto sin fases y agregarlas después.
                  </div>
                ) : (
                  <div className="d-grid gap-2">
                    {fasesDraft.map((fase, index) => (
                      <div className="row g-2 align-items-end border rounded-3 p-2 mx-0 bg-light" key={`fase-${index}`}>
                        <div className="col-12 col-md-7">
                          <label className="form-label fw-semibold small">Nombre de fase *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={fase.nombre}
                            onChange={(event) => handleFaseChange(index, "nombre", event.target.value)}
                            minLength={3}
                            maxLength={100}
                            disabled={loading || !!success}
                            placeholder="Ej: Diseño"
                          />
                        </div>
                        <div className="col-8 col-md-3">
                          <label className="form-label fw-semibold small">Horas *</label>
                          <input
                            type="number"
                            className="form-control"
                            value={fase.horas_estimadas}
                            onChange={(event) => handleFaseChange(index, "horas_estimadas", event.target.value)}
                            min="1"
                            step="0.1"
                            disabled={loading || !!success}
                            placeholder="0.0"
                          />
                        </div>
                        <div className="col-4 col-md-2">
                          <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeFase(index)} disabled={loading || !!success} title="Quitar fase">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {children}

        <div className="d-flex gap-2 mt-4">
          <button type="button" className="btn btn-light fw-semibold px-4" onClick={onCancel} disabled={loading || !!success}>Cancelar</button>
          <button type="submit" form={formId} className="btn btn-primary flex-fill fw-bold" disabled={loading || !!success}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
            ) : success ? (
              <><i className="bi bi-check-lg me-2"></i>{success === "No se realizaron cambios." ? "Sin cambios" : "Guardado"}</>
            ) : isEditing ? (
              "Actualizar Proyecto"
            ) : (
              "Crear Proyecto"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProyectoForm;
