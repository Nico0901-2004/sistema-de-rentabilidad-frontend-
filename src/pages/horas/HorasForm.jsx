import React, { useState, useEffect } from "react";
import { createHora } from "../../services/horasService";
import { getProyectosDisponibles } from "../../services/proyectoService";
import { notifySuccess } from "../../utils/notify";

const today = () => new Date().toISOString().split("T")[0];

const HorasForm = ({ proyectoPreseleccionado, onSaved, onCancel, forceRequired = false }) => {
  const [proyectos, setProyectos] = useState([]);
  const [form, setForm] = useState({
    id_proyecto: proyectoPreseleccionado || "",
    fecha: today(),
    horas_base: 1,
    horas_extra: 0,
    descripcion: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isProjectLocked = Boolean(proyectoPreseleccionado);

  useEffect(() => {
    getProyectosDisponibles()
      .then((res) => {
        if (res?.success) setProyectos(res.data);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const totalHoras = Number(form.horas_base) + Number(form.horas_extra || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.id_proyecto) {
      setError("Selecciona un proyecto.");
      return;
    }
    if (totalHoras < 1 || totalHoras > 18) {
      setError("El total de horas debe estar entre 1 y 18.");
      return;
    }

    setLoading(true);
    try {
      const res = await createHora({
        id_proyecto: Number(form.id_proyecto),
        fecha: form.fecha,
        horas: totalHoras,
        descripcion: form.descripcion || null,
      });
      if (res?.success) {
        notifySuccess("¡Horas registradas correctamente!");
        onSaved?.();
      } else {
        setError(res?.message || "Error al guardar el registro.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !forceRequired && onCancel()}>
      <div className="modal-card p-4 animate-scaleIn">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0">Registrar Horas</h5>
            <p className="text-muted small mb-0">Ingresa las horas trabajadas en el proyecto</p>
          </div>
          {!forceRequired && (
            <button className="btn btn-sm btn-light rounded-circle p-1 lh-1" onClick={onCancel}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        {forceRequired && (
          <div className="alert alert-warning d-flex align-items-center py-2 small rounded-3 mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Este registro es obligatorio para completar tu marcaje de salida.
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center py-2 small rounded-3 mb-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold small">Proyecto *</label>
            <select
              name="id_proyecto"
              value={form.id_proyecto}
              onChange={handleChange}
              className="form-select"
              required
              disabled={isProjectLocked}
            >
              <option value="">— Selecciona un proyecto —</option>
              {proyectos.map((p) => (
                <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
              ))}
            </select>
            {isProjectLocked && (
              <div className="form-text small" style={{ color: "var(--primary)" }}>
                <i className="bi bi-lock-fill me-1"></i>Proyecto pre-seleccionado desde tu lista.
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small">Fecha *</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className="form-control"
              required
              max={today()}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">
                Horas trabajadas *
                <span className="text-muted fw-normal ms-1">(1 – 8)</span>
              </label>
              <select
                name="horas_base"
                value={form.horas_base}
                onChange={handleChange}
                className="form-select"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h}>{h} hora{h !== 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">
                Horas extra <span className="text-muted fw-normal">(opcional, 0 – 10)</span>
              </label>
              <input
                type="number"
                name="horas_extra"
                value={form.horas_extra}
                onChange={handleChange}
                className="form-control"
                min="0"
                max="10"
                step="1"
                placeholder="0"
              />
            </div>
          </div>

          <div className="mb-3 p-2 rounded-3 d-flex align-items-center gap-2"
            style={{ background: "rgba(79,70,229,.06)" }}>
            <i className="bi bi-clock-fill" style={{ color: "var(--primary)" }}></i>
            <span className="small fw-semibold" style={{ color: "var(--primary)" }}>
              Total a registrar:
            </span>
            <span className="badge badge-role badge-active ms-auto" style={{ fontSize: 13 }}>
              {totalHoras} hora{totalHoras !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold small">Descripción de la tarea</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="form-control"
              rows={3}
              placeholder="Describe brevemente las tareas realizadas..."
            />
          </div>

          <div className="d-flex gap-2">
            {!forceRequired && (
              <button type="button" className="btn btn-light flex-fill fw-semibold" onClick={onCancel}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
                : <><i className="bi bi-clock-history me-2"></i>Registrar {totalHoras}h</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HorasForm;
