import React, { useState, useEffect } from "react";
import { createProyecto, updateProyecto, getProyectoById } from "../../services/proyectoService";
import { getServicios } from "../../services/servicioService";
import { getUsuarios } from "../../services/usuarioService";
import { notifySuccess, notifyError } from "../../utils/notify"; 

const EMPTY = {
  nombre: "", 
  descripcion: "", 
  id_servicio: "",
  id_lider: "",
  presupuesto: "", 
  margen: "0", 
  fecha_inicio: "", 
  fecha_fin_estimada: "",
  empleados_ids: [],
};

const ProyectoForm = ({ proyectoId, onSaved, onCancel }) => {
  const [form, setForm] = useState(EMPTY);
  const [originalForm, setOriginalForm] = useState(EMPTY); 
  const [servicios, setServicios] = useState([]);
  const [lideres, setLideres] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); 
  const [loading, setLoading] = useState(false);

  // --- LÓGICA DEL TICKET: Calcular fecha actual y evaluar si es pasada ---
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const isPastDate = form.fecha_inicio && form.fecha_inicio < todayStr;
  // ------------------------------------------------------------------------

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
    if (!proyectoId) return;
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
            margen: p.margen !== undefined && p.margen !== null ? String(p.margen) : "0",
            fecha_inicio: p.fecha_inicio?.slice(0, 10) || "",
            fecha_fin_estimada: p.fecha_fin_estimada?.slice(0, 10) || "",
            empleados_ids: (p.empleados || []).map((e) => e.id_usuario),
          };
          
          setForm(loadedForm);
          setOriginalForm(loadedForm); 
        }
      });
  }, [proyectoId]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(""); 

    if (proyectoId) {
      const isUnchanged = JSON.stringify(form) === JSON.stringify(originalForm);
      if (isUnchanged) {
        setSuccess("No se realizaron cambios.");
        notifySuccess("No se realizaron cambios."); 
        setTimeout(() => onSaved?.(), 1000); 
        return; 
      }
    }

    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();

    // Validaciones
    if (nombre.length < 3 || nombre.length > 100) return setError("El nombre debe tener entre 3 y 100 caracteres.");
    if (descripcion && (descripcion.length < 3 || descripcion.length > 500)) return setError("La descripción debe tener entre 3 y 500 caracteres.");
    if (descripcion && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(descripcion)) return setError("La descripción solo debe contener letras y espacios.");
    if (!form.id_servicio) return setError("Selecciona un servicio.");
    if (!form.id_lider) return setError("Selecciona un líder responsable.");
    if (!form.presupuesto || Number(form.presupuesto) < 1) return setError("El presupuesto debe ser mayor o igual a 1.");
    
    const margenNum = Number(form.margen);
    if (form.margen === "" || isNaN(margenNum) || margenNum < 0 || margenNum > 100) {
      return setError("El margen (% ganancia) debe ser un número entre 0 y 100.");
    }

    if (!form.fecha_inicio) return setError("La fecha de inicio es obligatoria.");
    if (!form.fecha_fin_estimada) return setError("La fecha fin estimada es obligatoria.");
    if (form.fecha_inicio && form.fecha_fin_estimada) {
      if (new Date(form.fecha_inicio) > new Date(form.fecha_fin_estimada)) {
        return setError("La fecha de inicio no puede ser posterior a la fecha fin.");
      }
    }

    setLoading(true);
    const payload = {
      nombre,
      ...(descripcion ? { descripcion } : {}),
      id_servicio: Number(form.id_servicio),
      id_lider: Number(form.id_lider),
      presupuesto: Number(form.presupuesto),
      margen: margenNum,
      fecha_inicio: form.fecha_inicio,
      fecha_fin_estimada: form.fecha_fin_estimada,
      empleados: form.empleados_ids.map(Number),
    };

    try {
      const res = proyectoId
        ? await updateProyecto(proyectoId, payload)
        : await createProyecto(payload);
        
      if (res?.success) {
        const successMsg = proyectoId ? "Proyecto actualizado correctamente." : "Proyecto creado correctamente.";
        setSuccess(successMsg);
        notifySuccess(successMsg); 
        setTimeout(() => onSaved?.(), 1000);
      } else {
        const errorMsg = res?.message || "Error al guardar.";
        setError(errorMsg);
        notifyError(errorMsg); 
      }
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
        <h5 className="fw-bold mb-1">{proyectoId ? "Editar proyecto" : "Nuevo proyecto"}</h5>
        <p className="text-muted small mb-4">Organiza el trabajo asignando servicio y personal</p>

        {error && (
          <div className="alert alert-danger py-2 small rounded-3 mb-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}

        {/* ALERTA DE ÉXITO / SIN CAMBIOS */}
        {success && (
          <div className="alert alert-success py-2 small rounded-3 mb-3 animate-fadeIn">
            <i className="bi bi-check-circle-fill me-2"></i>{success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
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
                {servicios.map(s => <option key={s.id_servicio} value={s.id_servicio}>{s.nombre}</option>)}
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Líder responsable *</label>
              <select name="id_lider" value={form.id_lider} onChange={handleChange} className="form-select" required disabled={loading || !!success}>
                <option value="">Selecciona un líder</option>
                {lideres.map(l => <option key={l.id_usuario} value={l.id_usuario}>{l.nombre}</option>)}
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
              <label className="form-label fw-semibold small">Fecha inicio *</label>
              <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} className="form-control" required disabled={loading || !!success} />
              {/* --- ADVERTENCIA VISUAL (SOFT WARNING) --- */}
              {isPastDate && (
                <div className="form-text text-warning small mt-1 fw-medium animate-fadeIn">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  Advertencia: Estás registrando una fecha en el pasado.
                </div>
              )}
            </div>
            
            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">Fecha fin estimada *</label>
              <input type="date" name="fecha_fin_estimada" value={form.fecha_fin_estimada} onChange={handleChange} className="form-control" required disabled={loading || !!success} />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold small d-flex justify-content-between">
                <span>Asignar Equipo (Empleados)</span>
                <span className="text-muted fw-normal">{form.empleados_ids.length} seleccionados</span>
              </label>
              <div className="border rounded-3 p-2 bg-light" style={{ maxHeight: 150, overflowY: "auto", pointerEvents: (loading || !!success) ? "none" : "auto", opacity: (loading || !!success) ? 0.6 : 1 }}>
                {empleados.map(u => (
                  <div key={u.id_usuario} 
                       className={`d-flex align-items-center p-2 mb-1 rounded-2 pointer ${form.empleados_ids.includes(u.id_usuario) ? 'bg-white shadow-sm' : ''}`}
                       onClick={() => toggleEmpleado(u.id_usuario)}
                       style={{ cursor: 'pointer' }}>
                    <div className={`me-2 border rounded d-flex align-items-center justify-content-center`} style={{ width: 18, height: 18, background: form.empleados_ids.includes(u.id_usuario) ? 'var(--primary)' : 'white' }}>
                      {form.empleados_ids.includes(u.id_usuario) && <i className="bi bi-check text-white small"></i>}
                    </div>
                    <span className="small">{u.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="button" className="btn btn-light fw-semibold px-4" onClick={onCancel} disabled={loading || !!success}>Cancelar</button>
            <button type="submit" className="btn btn-primary flex-fill fw-bold" disabled={loading || !!success}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
              ) : success ? (
                <><i className="bi bi-check-lg me-2"></i>{success === "No se realizaron cambios." ? "Sin cambios" : "Guardado"}</>
              ) : proyectoId ? (
                "Actualizar Proyecto"
              ) : (
                "Crear Proyecto"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProyectoForm;