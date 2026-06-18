import React, { useState, useEffect } from "react";
import { createHora, updateHora, getMisHoras } from "../../services/horasService";
import { getMisProyectos } from "../../services/proyectoService"; // CORRECCIÓN CRÍTICA: Usamos getMisProyectos con accesos de empleado
import { getFasesByProyecto } from "../../services/faseService"; 
import { notifySuccess } from "../../utils/notify";

const today = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const HorasForm = ({ idRegistroEdicion, proyectoPreseleccionado, fasesPreseleccionadas = [], onSaved, onCancel, forceRequired = false }) => {
  const proyectoInicial =
    proyectoPreseleccionado && typeof proyectoPreseleccionado === "object"
      ? proyectoPreseleccionado
      : null;
  const proyectoInicialId = proyectoInicial?.id_proyecto || proyectoPreseleccionado || "";
  const [proyectos, setProyectos] = useState([]);
  const [fases, setFases] = useState([]);
  const [form, setForm] = useState({
    id_proyecto: proyectoInicialId,
    id_fase: "",
    fecha: today(),
    horas: 1,
    descripcion: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isProjectLocked = Boolean(proyectoInicialId);
  const isEdicion = Boolean(idRegistroEdicion);

  // 1. Cargar proyectos asignados al empleado al montar el componente
  useEffect(() => {
    getMisProyectos() // CORRECCIÓN: Invocación autorizada para el rol empleado
      .then((res) => {
        const rawData = res?.success ? res.data : res;
        const data = Array.isArray(rawData) ? rawData : [];
        const proyectoYaIncluido = data.some(
          (p) => String(p.id_proyecto) === String(proyectoInicialId)
        );

        if (proyectoInicial && !proyectoYaIncluido) {
          setProyectos([proyectoInicial, ...data]);
        } else {
          setProyectos(data);
        }
      })
      .catch(() => {
        if (proyectoInicial) setProyectos([proyectoInicial]);
        else setError("No se pudieron cargar tus proyectos asignados.");
      });
  }, [proyectoInicial, proyectoInicialId]);

  // 2. Lógica para HU 33 (Edición): Precargar los datos si recibimos un idRegistroEdicion
  useEffect(() => {
    if (isEdicion) {
      setLoading(true);
      getMisHoras()
        .then((res) => {
          const registros = res?.success ? res.data : (Array.isArray(res) ? res : []);
          // Buscamos el registro específico que queremos editar
          const registroAEditar = registros.find(
            (r) => (r.id_registro || r.id) === idRegistroEdicion
          );

          if (registroAEditar) {
            setForm({
              id_proyecto: registroAEditar.id_proyecto || "",
              id_fase: registroAEditar.id_fase || "",
              fecha: registroAEditar.fecha ? registroAEditar.fecha.split("T")[0] : today(),
              horas: Number(registroAEditar.horas || 1),
              descripcion: registroAEditar.descripcion || "",
            });
          } else {
            setError("No se encontraron los datos del registro a editar.");
          }
        })
        .catch(() => setError("Error al precargar los datos de edición."))
        .finally(() => setLoading(false));
    }
  }, [idRegistroEdicion, isEdicion]);

  // 3. HU 32: Cargar fases automáticamente cada vez que cambie o se seleccione un proyecto
  useEffect(() => {
    if (form.id_proyecto) {
      getFasesByProyecto(form.id_proyecto)
        .then((res) => {
          const rawData = res?.success ? res.data : res;
          setFases(Array.isArray(rawData) ? rawData : []);
        })
        .catch(() => setFases(fasesPreseleccionadas));
    } else {
      setFases([]);
    }
  }, [form.id_proyecto, fasesPreseleccionadas]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.id_proyecto) {
      setError("Selecciona un proyecto.");
      return;
    }
    if (!form.id_fase) {
      setError("Selecciona una fase asociada al proyecto.");
      return;
    }
    if (Number(form.horas) < 0.5 || Number(form.horas) > 12) {
      setError("Las horas deben estar entre 0.5 y 12.");
      return;
    }

    setLoading(true);
    try {
      const dataPayload = {
        id_proyecto: Number(form.id_proyecto),
        id_fase: Number(form.id_fase),
        horas: Number(form.horas),
        descripcion: form.descripcion || null,
      };

      let response;
      if (isEdicion) {
        response = await updateHora(idRegistroEdicion, dataPayload);
      } else {
        response = await createHora(dataPayload);
      }

      if (response?.success || response) {
        notifySuccess(isEdicion ? "¡Registro actualizado con éxito!" : "¡Horas registradas correctamente!");
        onSaved?.();
      } else {
        setError("Error al procesar la solicitud.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el registro en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !forceRequired && onCancel()}>
      <div className="modal-card p-4 animate-scaleIn" style={{ zIndex: 1100 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0">{isEdicion ? "Editar Horas" : "Registrar Horas"}</h5>
            <p className="text-muted small mb-0">Imputación de tiempos para el control de rentabilidad</p>
          </div>
          {!forceRequired && (
            <button className="btn btn-sm btn-light rounded-circle p-1 lh-1" type="button" onClick={onCancel}>
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
          {/* Campo: Proyecto */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Proyecto *</label>
            <select
              name="id_proyecto"
              value={form.id_proyecto}
              onChange={handleChange}
              className="form-select"
              required
              disabled={isProjectLocked || isEdicion}
            >
              <option value="">— Selecciona un proyecto —</option>
              {proyectos.map((p) => (
                <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre || p.proyecto_nombre}</option>
              ))}
            </select>
          </div>

          {/* Campo: Fase */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Fase del Proyecto *</label>
            <select
              name="id_fase"
              value={form.id_fase}
              onChange={handleChange}
              className="form-select"
              required
              disabled={!form.id_proyecto}
            >
              <option value="">— Selecciona una fase —</option>
              {fases.map((f) => (
                <option key={f.id_fase || f.id} value={f.id_fase || f.id}>
                  {f.nombre || f.fase_nombre || f.nombre_fase}
                </option>
              ))}
            </select>
            {!form.id_proyecto && (
              <div className="form-text text-muted small">Debes seleccionar un proyecto primero para ver sus fases.</div>
            )}
          </div>

          {/* Campo: Fecha */}
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
              disabled
              readOnly
            />
            <div className="form-text text-muted small">El backend registra la fecha automáticamente.</div>
          </div>

          {/* Campo: Cantidad de Horas */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Horas a Imputar *</label>
            <input
              type="number"
              name="horas"
              value={form.horas}
              onChange={handleChange}
              className="form-control"
              min="0.5"
              max="12"
              step="0.5"
              required
              placeholder="Ej. 7.5"
            />
            <div className="form-text text-muted small">El backend acepta entre 0.5 y 12 horas por día.</div>
          </div>

          {/* Campo: Descripción */}
          <div className="mb-4">
            <label className="form-label fw-semibold small">Descripción de la tarea</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="form-control"
              rows={3}
              placeholder="Describe brevemente las tareas realizadas..."
              maxLength={100}
            />
          </div>

          <div className="d-flex gap-2">
            {!forceRequired && (
              <button type="button" className="btn btn-light flex-fill fw-semibold" onClick={onCancel}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
              ) : (
                <><i className="bi bi-check-circle me-2"></i>{isEdicion ? "Guardar Cambios" : "Confirmar Registro"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HorasForm;
