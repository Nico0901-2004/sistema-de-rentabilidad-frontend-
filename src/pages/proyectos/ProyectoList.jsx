import React, { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "../../components/layout/Layout";
import ProyectoForm from "./ProyectoForm";
import HorasForm from "../horas/HorasForm";
import FasesLists from "../fases/FasesLists";
import NotasLists from "../notas/NotasLists";
import { useAuth } from "../../context/AuthContext";
import { getHoras } from "../../services/horasService";
import { 
  getProyectos, getMisProyectos, getProyectoById, eliminarProyecto, 
  finalizarProyecto, getHorasResumenProyecto // Asegúrate de que esté importado
} from "../../services/proyectoService";
import { notifySuccess, notifyError } from "../../utils/notify"; // Importación necesaria para feedback


const getServicioNombre = (proyecto) => proyecto.nombre_servicio || proyecto.servicio_nombre || "—";
const getLiderNombre = (proyecto) => proyecto.nombre_lider || proyecto.lider_nombre || "—";
const isProyectoActivo = (proyecto) => proyecto.is_active !== false;
const formatProyectoDate = (date) => date ? date.slice(0, 10) : "---";
const formatShortDate = (date) => date ? String(date).slice(0, 10) : "—";
const getHorasResumenData = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.success && Array.isArray(response.data)) return response.data;
  return [];
};
const getHoraFaseId = (registro) => registro.id_fase ?? registro.fase_id ?? null;
const getHoraFaseNombre = (registro) => registro.fase_nombre ?? registro.nombre_fase ?? registro.fase ?? "";
const getHoraFecha = (registro) => registro.fecha ?? registro.fecha_registro ?? registro.created_at ?? "";
const getHoraProyectoId = (registro, fallbackId) => Number(registro.id_proyecto ?? registro.proyecto_id ?? fallbackId);

const normalizeHorasResumen = (response, proyecto) =>
  getHorasResumenData(response).map((registro, index) => ({
    ...registro,
    id_resumen: registro.id_resumen ?? registro.id_registro ?? `${proyecto.id_proyecto}-${index}`,
    id_proyecto: getHoraProyectoId(registro, proyecto.id_proyecto),
    proyecto_nombre: registro.proyecto_nombre ?? registro.nombre_proyecto ?? proyecto.nombre,
    id_fase: getHoraFaseId(registro),
    fase_nombre: getHoraFaseNombre(registro),
    fecha: getHoraFecha(registro),
    total_horas: Number(registro.total_horas ?? registro.horas ?? 0),
  }));

const getTotalHorasResumen = (resumen = []) =>
  resumen.reduce((acc, registro) => acc + Number(registro.total_horas || 0), 0);

const groupHorasByFase = (resumen = []) => {
  const map = new Map();

  resumen.forEach((registro) => {
    const faseId = registro.id_fase;
    const faseNombre = registro.fase_nombre;
    if (!faseId && !faseNombre) return;

    const key = String(faseId ?? faseNombre);
    const actual = map.get(key) || {
      id_fase: faseId,
      fase_nombre: faseNombre || `Fase #${faseId}`,
      total_horas: 0,
    };

    actual.total_horas += Number(registro.total_horas || 0);
    map.set(key, actual);
  });

  return Array.from(map.values()).sort((a, b) =>
    String(a.fase_nombre).localeCompare(String(b.fase_nombre))
  );
};

const isDateInRange = (date, desde, hasta) => {
  if (!date) return false;
  const normalized = String(date).slice(0, 10);
  return (!desde || normalized >= desde) && (!hasta || normalized <= hasta);
};

/* ── Confirm modal ───────────────────────────── */
const ConfirmModal = ({ title, message, confirmLabel, danger, onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
    <div className="modal-card p-4 animate-scaleIn" style={{ maxWidth: 420 }}>
      <div className="d-flex align-items-start gap-3 mb-4">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 44, height: 44, background: danger ? "rgba(239,68,68,.1)" : "rgba(245,158,11,.1)" }}>
          <i className={`bi ${danger ? "bi-trash-fill" : "bi-exclamation-triangle-fill"}`}
            style={{ color: danger ? "var(--danger)" : "var(--warning)", fontSize: 20 }}></i>
        </div>
        <div>
          <h6 className="fw-bold mb-1">{title}</h6>
          <p className="text-muted small mb-0">{message}</p>
        </div>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-light flex-fill fw-semibold" onClick={onCancel}>Cancelar</button>
        <button className={`btn ${danger ? "btn-danger" : "btn-warning"} flex-fill fw-bold`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

/* ── Detalle de proyecto ─────────────────────── */
const ProyectoDetailModal = ({ proyecto, onClose, horasResumen = [], horasLoading = false, horasError = "" }) => {
  if (!proyecto) return null;

  const empleados = Array.isArray(proyecto.empleados) ? proyecto.empleados : [];
  const totalHoras = getTotalHorasResumen(horasResumen);
  const horasPorFase = groupHorasByFase(horasResumen);
  const resumenSinFase = horasResumen.length > 0 && horasPorFase.length === 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card p-0 animate-scaleIn" style={{ maxWidth: 760 }}>
        <div style={{ height: 4, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}></div>
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">{proyecto.nombre}</h5>
              <p className="text-muted small mb-0">{getServicioNombre(proyecto)}</p>
            </div>
            <button className="btn btn-sm btn-light rounded-3" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="p-3 rounded-4 bg-light h-100">
                <h6 className="fw-bold small mb-3">Información</h6>
                <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                  {proyecto.descripcion || "Sin descripción registrada."}
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge badge-role badge-active">
                    {isProyectoActivo(proyecto) ? "Activo" : "Inactivo"}
                  </span>
                  <span className="badge badge-role badge-lider">
                    Horas: {horasLoading ? "..." : `${totalHoras.toFixed(1)}h`}
                  </span>
                  {proyecto.presupuesto && (
                    <span className="badge badge-role badge-propietario">
                      Presupuesto: S/ {Number(proyecto.presupuesto).toLocaleString("es-PE")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 rounded-4 bg-light h-100">
                <h6 className="fw-bold small mb-3">Fechas y equipo</h6>
                <div className="small text-muted mb-2">
                  <i className="bi bi-calendar-event me-2"></i>
                  Inicio: {formatProyectoDate(proyecto.fecha_inicio)}
                </div>
                <div className="small text-muted mb-2">
                  <i className="bi bi-calendar-check me-2"></i>
                  Fin estimado: {formatProyectoDate(proyecto.fecha_fin_estimada)}
                </div>
                <div className="small text-muted mb-3">
                  <i className="bi bi-flag-fill me-2" style={{ color: "#059669" }}></i>
                  Fin real: <strong>{formatProyectoDate(proyecto.fecha_fin_real)}</strong>
                </div>
                <div className="small text-muted mb-2">
                  <i className="bi bi-star-fill me-2" style={{ color: "#D97706" }}></i>
                  Líder: <strong>{getLiderNombre(proyecto)}</strong>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {empleados.length > 0 ? empleados.map((empleado) => (
                    <span className="badge badge-role badge-empleado" key={empleado.id_usuario}>
                      {empleado.nombre}
                    </span>
                  )) : (
                    <span className="text-muted small">Sin empleados asignados.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-4 bg-light">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
              <h6 className="fw-bold small mb-0">
                <i className="bi bi-clock-history me-2" style={{ color: "var(--primary)" }}></i>
                Horas por fase
              </h6>
              <span className="fw-bold" style={{ color: "var(--primary)" }}>
                {horasLoading ? "..." : `${totalHoras.toFixed(1)}h`}
              </span>
            </div>

            {horasError ? (
              <p className="text-muted small mb-0">{horasError}</p>
            ) : horasLoading ? (
              <div className="skeleton rounded" style={{ height: 24, width: "60%" }}></div>
            ) : horasPorFase.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th className="text-muted small">Fase</th>
                      <th className="text-end text-muted small">Total horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horasPorFase.map((fase) => (
                      <tr key={fase.id_fase ?? fase.fase_nombre}>
                        <td className="fw-semibold small">{fase.fase_nombre}</td>
                        <td className="text-end fw-bold small" style={{ color: "var(--primary)" }}>
                          {Number(fase.total_horas || 0).toFixed(1)}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : resumenSinFase ? (
              <p className="text-muted small mb-0">
                El endpoint devuelve horas del proyecto, pero no incluye fase para mostrar el desglose.
              </p>
            ) : (
              <p className="text-muted small mb-0">Sin horas registradas para este proyecto.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectContentModal = ({ children, onClose }) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal-card p-4 animate-scaleIn" style={{ maxWidth: 1120, maxHeight: "90vh", overflowY: "auto" }}>
      {children}
    </div>
  </div>
);

const EmpleadoProyectoDetailModal = ({ proyecto, onClose, horasRegistradas = 0, fases = [] }) => {
  if (!proyecto) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card p-0 animate-scaleIn" style={{ maxWidth: 760 }}>
        <div style={{ height: 4, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}></div>
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">{proyecto.nombre}</h5>
              <p className="text-muted small mb-0">{getServicioNombre(proyecto)}</p>
            </div>
            <button className="btn btn-sm btn-light rounded-3" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-7">
              <div className="p-3 rounded-4 bg-light h-100">
                <h6 className="fw-bold small mb-3">Información del proyecto</h6>
                <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                  {proyecto.descripcion || "Sin descripción registrada."}
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge badge-role badge-active">
                    Horas registradas: {Number(horasRegistradas || 0).toFixed(1)}h
                  </span>
                  {fases.length > 0 && (
                    <span className="badge badge-role badge-empleado">
                      {fases.length} fase{fases.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-5">
              <div className="p-3 rounded-4 bg-light h-100">
                <h6 className="fw-bold small mb-3">Fechas y asignación</h6>
                <div className="small text-muted mb-2">
                  <i className="bi bi-calendar-event me-2"></i>
                  Asignación / inicio: {formatProyectoDate(proyecto.fecha_inicio)}
                </div>
                <div className="small text-muted mb-2">
                  <i className="bi bi-calendar-check me-2"></i>
                  Fin estimado: {formatProyectoDate(proyecto.fecha_fin_estimada)}
                </div>
                {proyecto.fecha_fin_real && (
                  <div className="small text-muted mb-2">
                    <i className="bi bi-flag-fill me-2" style={{ color: "#059669" }}></i>
                    Fin real: {formatProyectoDate(proyecto.fecha_fin_real)}
                  </div>
                )}
                {proyecto.lider_nombre && (
                  <div className="small text-muted mt-3">
                    <i className="bi bi-star-fill me-2" style={{ color: "#D97706" }}></i>
                    Líder: <strong>{proyecto.lider_nombre}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {fases.length > 0 && (
            <div className="mt-3">
              <h6 className="fw-bold small mb-2">Fases con horas registradas</h6>
              <div className="d-flex flex-wrap gap-2">
                {fases.map((fase) => (
                  <span key={fase} className="badge rounded-pill" style={{ background: "rgba(79,70,229,.1)", color: "var(--primary)" }}>
                    {fase}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Vista propietario ───────────────────────── */
const PropietarioView = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterProyecto, setFilterProyecto] = useState("");
  const [filterFase, setFilterFase] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [selected, setSelected] = useState(null);
  const [contentModal, setContentModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [horasResumenByProyecto, setHorasResumenByProyecto] = useState({});
  const [loadingHoras, setLoadingHoras] = useState(false);
  const [horasError, setHorasError] = useState("");

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setHorasError("");
      const res = await getProyectos();
      if (res.success) {
        const proyectosConDetalle = await Promise.all(
          (res.data || []).map(async (proyecto) => {
            try {
              const detalle = await getProyectoById(proyecto.id_proyecto);
              return detalle?.success ? { ...proyecto, ...detalle.data } : proyecto;
            } catch {
              return proyecto;
            }
          })
        );

        setProyectos(proyectosConDetalle);
        setLoading(false);
        setLoadingHoras(true);
        const resumenEntries = await Promise.all(
          proyectosConDetalle.map(async (proyecto) => {
            try {
              const resumen = await getHorasResumenProyecto(proyecto.id_proyecto);
              return [proyecto.id_proyecto, normalizeHorasResumen(resumen, proyecto)];
            } catch {
              return [proyecto.id_proyecto, []];
            }
          })
        );
        setHorasResumenByProyecto(Object.fromEntries(resumenEntries));
        setHorasError("");
        setLoadingHoras(false);
      } else {
        setError("No se pudo cargar la lista de proyectos.");
        setLoadingHoras(false);
      }
    } catch {
      setError("Error al conectar con el servidor.");
      setHorasResumenByProyecto({});
    } finally {
      setLoading(false);
      setLoadingHoras(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSaved = () => { setShowForm(false); setEditingId(null); fetch(); };
  const handleEdit = (id) => { setEditingId(id); setShowForm(true); };

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      setLoading(true);
      let res;

      if (confirm.type === "delete") {
        res = await eliminarProyecto(confirm.proyecto.id_proyecto);
      }

      if (res?.success) {
        setProyectos((prev) =>
          prev.filter((p) => p.id_proyecto !== confirm.proyecto.id_proyecto)
        );
        notifySuccess("Proyecto eliminado correctamente.");
        setConfirm(null);
      } else {
        notifyError(res?.message || "Error al eliminar el proyecto.");
      }
    } catch (err) {
      const backendMessage = err.response?.data?.message;

      // Backend legacy: si el proyecto ya estaba desactivado, simulamos eliminación en UI.
      if (backendMessage === "El proyecto ya está desactivado") {
        setProyectos((prev) =>
          prev.filter((p) => p.id_proyecto !== confirm.proyecto.id_proyecto)
        );
        notifySuccess("Proyecto eliminado correctamente.");
        return;
      }

      notifyError(backendMessage || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  };

  const resumenRows = useMemo(
    () => Object.values(horasResumenByProyecto).flat(),
    [horasResumenByProyecto]
  );

  const fechasDisponibles = resumenRows.some((registro) => Boolean(registro.fecha));

  const fasesDisponibles = useMemo(() => {
    const fases = new Map();

    resumenRows.forEach((registro) => {
      const faseId = registro.id_fase;
      const faseNombre = registro.fase_nombre;
      if (!faseId && !faseNombre) return;
      const key = String(faseId ?? faseNombre);
      if (!fases.has(key)) fases.set(key, faseNombre || `Fase #${faseId}`);
    });

    return Array.from(fases.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [resumenRows]);

  const clearHourFilters = () => {
    setSearch("");
    setFilterProyecto("");
    setFilterFase("");
    setFechaDesde("");
    setFechaHasta("");
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return proyectos.filter((p) => {
      const resumen = horasResumenByProyecto[p.id_proyecto] || [];
      const resumenByDate = fechaDesde || fechaHasta
        ? resumen.filter((registro) => isDateInRange(registro.fecha, fechaDesde, fechaHasta))
        : resumen;

      const matchSearch = !term ||
        p.nombre.toLowerCase().includes(term) ||
        (p.descripcion || "").toLowerCase().includes(term) ||
        getServicioNombre(p).toLowerCase().includes(term) ||
        getLiderNombre(p).toLowerCase().includes(term);
      const matchProyecto = !filterProyecto || String(p.id_proyecto) === filterProyecto;
      const matchFase = !filterFase || resumenByDate.some((registro) =>
        String(registro.id_fase ?? registro.fase_nombre) === filterFase
      );
      const matchFecha = !(fechaDesde || fechaHasta) || resumenByDate.length > 0;

      return matchSearch && matchProyecto && matchFase && matchFecha;
    });
  }, [proyectos, horasResumenByProyecto, search, filterProyecto, filterFase, fechaDesde, fechaHasta]);

  const getResumenVisible = useCallback((proyectoId) => {
    const resumen = horasResumenByProyecto[proyectoId] || [];
    return resumen.filter((registro) => {
      const matchFase = !filterFase ||
        String(registro.id_fase ?? registro.fase_nombre) === filterFase;
      const matchFecha = !(fechaDesde || fechaHasta) ||
        isDateInRange(registro.fecha, fechaDesde, fechaHasta);
      return matchFase && matchFecha;
    });
  }, [horasResumenByProyecto, filterFase, fechaDesde, fechaHasta]);

  const totalHorasFiltradas = filtered.reduce(
    (acc, proyecto) => acc + getTotalHorasResumen(getResumenVisible(proyecto.id_proyecto)),
    0
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Gestión de Proyectos</h2>
            <p className="text-muted small mb-0">Administra los proyectos de tu empresa</p>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2 px-4"
            onClick={() => { setEditingId(null); setShowForm(true); }}>
            <i className="bi bi-plus-circle-fill"></i>
            Nuevo Proyecto
          </button>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4 stagger">
          {[
            { label: "Total proyectos", value: proyectos.length, icon: "bi-kanban-fill", color: "var(--primary)", bg: "rgba(79,70,229,.1)" },
            { label: "Horas registradas", value: loadingHoras ? "..." : `${totalHorasFiltradas.toFixed(1)}h`, icon: "bi-clock-history", color: "var(--accent)", bg: "rgba(6,182,212,.1)" },
            // TEMP: oculto para no mostrar estado en frontend
            // { label: "Activos", value: proyectos.filter(isProyectoActivo).length, icon: "bi-check-circle-fill", color: "var(--success)", bg: "rgba(16,185,129,.1)" },
            // { label: "Inactivos", value: proyectos.filter(p => !isProyectoActivo(p)).length, icon: "bi-x-circle-fill", color: "var(--danger)", bg: "rgba(239,68,68,.1)" },
          ].map((s, i) => (
            <div className="col-6 col-sm-4" key={i}>
              <div className="stat-card card-3d animate-fadeInUp">
                <div className="stat-card__glow" style={{ background: s.color }}></div>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 44, height: 44, background: s.bg }}>
                    <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: 20 }}></i>
                  </div>
                  <div>
                    <p className="text-muted small mb-0">{s.label}</p>
                    <h4 className="fw-bold mb-0" style={{ color: s.color }}>{s.value}</h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <ProyectoForm
            proyectoId={editingId}
            onSaved={handleSaved}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
          />
        )}

        <div className="card border-0 rounded-4 mb-3" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-end">
              <div className="col-12 col-xl-3">
                <label className="form-label small fw-bold text-muted">Buscar</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input type="text" className="form-control border-start-0 ps-0"
                    placeholder="Proyecto, servicio o líder..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>

              <div className="col-12 col-sm-6 col-xl-3">
                <label className="form-label small fw-bold text-muted">Proyecto</label>
                <select className="form-select" value={filterProyecto} onChange={(e) => setFilterProyecto(e.target.value)}>
                  <option value="">Todos los proyectos</option>
                  {proyectos.map((p) => (
                    <option key={p.id_proyecto} value={String(p.id_proyecto)}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {fasesDisponibles.length > 0 && (
                <div className="col-12 col-sm-6 col-xl-2">
                  <label className="form-label small fw-bold text-muted">Fase</label>
                  <select className="form-select" value={filterFase} onChange={(e) => setFilterFase(e.target.value)}>
                    <option value="">Todas las fases</option>
                    {fasesDisponibles.map(([id, nombre]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {fechasDisponibles && (
                <>
                  <div className="col-6 col-xl-1">
                    <label className="form-label small fw-bold text-muted">Desde</label>
                    <input type="date" className="form-control" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                  </div>
                  <div className="col-6 col-xl-1">
                    <label className="form-label small fw-bold text-muted">Hasta</label>
                    <input type="date" className="form-control" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                  </div>
                </>
              )}

              <div className="col-12 col-sm-6 col-xl-2">
                <button className="btn btn-light w-100 fw-semibold" onClick={clearHourFilters}>
                  <i className="bi bi-x-circle me-2"></i>
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center small rounded-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}

        <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
          <div className="table-responsive">
            <table className="table table-modern mb-0 align-middle" style={{ width: "100%", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "3%" }}></th>
                  <th style={{ width: "26%" }}>Proyecto</th>
                  <th style={{ width: "14%" }}>Servicio</th>
                  <th style={{ width: "14%" }}>Líder</th>
                  <th className="text-center" style={{ width: "10%" }}>Horas</th>
                  <th className="text-center" style={{ width: "21%" }}>Fechas</th>
                  <th className="text-end" style={{ width: "12%" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="skeleton rounded" style={{ height: 20, width: "80%" }}></div></td>
                    ))}</tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((p) => {
                    const active = isProyectoActivo(p);
                    const resumenVisible = getResumenVisible(p.id_proyecto);
                    const totalHorasProyecto = getTotalHorasResumen(resumenVisible);
                    const fasesConHoras = groupHorasByFase(resumenVisible);
                    return (
                      <tr key={p.id_proyecto} className="animate-fadeIn" style={{ cursor: "pointer" }} onClick={() => setSelected(p)}>
                        <td><i className="bi bi-chevron-right" style={{ color: "var(--primary)", fontSize: 12 }}></i></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-3 d-flex align-items-center justify-content-center"
                              style={{ width: 32, height: 32, background: active ? "rgba(79,70,229,.1)" : "rgba(100,116,139,.1)", flexShrink: 0 }}>
                              <i className="bi bi-kanban" style={{ color: active ? "var(--primary)" : "#94a3b8", fontSize: 14 }}></i>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <span className={`fw-semibold d-block text-truncate ${!active ? "text-muted" : ""}`}>{p.nombre}</span>
                              {p.presupuesto && (
                                <span className="text-muted" style={{ fontSize: 11 }}>
                                  #{p.id_proyecto} · S/ {Number(p.presupuesto).toLocaleString("es-PE")}
                                </span>
                              )}
                              {!p.presupuesto && (
                                <span className="text-muted" style={{ fontSize: 11 }}>#{p.id_proyecto}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-muted small text-truncate" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {getServicioNombre(p)}
                        </td>
                        <td className="text-muted small">
                          <span className="d-flex align-items-center gap-1" style={{ fontSize: 11, minWidth: 0 }}>
                            <i className="bi bi-star-fill flex-shrink-0" style={{ color: "#D97706", fontSize: 9 }}></i>
                            <span className="text-truncate" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {getLiderNombre(p)}
                            </span>
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="fw-bold" style={{ color: "var(--primary)" }}>
                            {loadingHoras ? "..." : `${totalHorasProyecto.toFixed(1)}h`}
                          </span>
                          {fasesConHoras.length > 0 && (
                            <span className="d-block text-muted" style={{ fontSize: 11 }}>
                              {fasesConHoras.length} fase{fasesConHoras.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </td>
                        <td className="text-muted small">
                          <div className="d-grid gap-1 mx-auto" style={{ lineHeight: 1.15 }}>
                            <div className="d-flex align-items-center gap-1">
                              <span className="fw-semibold text-muted" style={{ fontSize: 10, width: 46 }}>Inicio</span>
                              <span className="text-nowrap">{formatShortDate(p.fecha_inicio)}</span>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <span className="fw-semibold text-muted" style={{ fontSize: 10, width: 46 }}>Fin est.</span>
                              <span className="text-nowrap">{formatShortDate(p.fecha_fin_estimada)}</span>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <span className="fw-semibold text-muted" style={{ fontSize: 10, width: 46 }}>Fin real</span>
                              <span className={`text-nowrap ${p.fecha_fin_real ? "text-success fw-semibold" : ""}`}>
                                {formatShortDate(p.fecha_fin_real)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <div className="d-grid gap-1 ms-auto" style={{ gridTemplateColumns: "repeat(2, 30px)", width: 64 }}>
                            <button className="btn btn-sm btn-primary shadow-sm" title="Ver fases" onClick={() => setContentModal({ type: "fases", proyecto: p })}>
                              <i className="bi bi-layers"></i>
                            </button>
                            <button className="btn btn-sm btn-info shadow-sm text-white" title="Ver notas" onClick={() => setContentModal({ type: "notas", proyecto: p })}>
                              <i className="bi bi-journal-text"></i>
                            </button>
                            <button className="btn btn-sm btn-success shadow-sm" title="Editar" onClick={() => handleEdit(p.id_proyecto)}>
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button className="btn btn-sm btn-danger shadow-sm" title="Eliminar" onClick={() => setConfirm({ type: "delete", proyecto: p })}>
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <i className="bi bi-kanban"></i>
                        <h6>Sin proyectos</h6>
                        <p>Crea el primer proyecto con el botón de arriba.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ProyectoDetailModal
        proyecto={selected}
        horasResumen={selected ? getResumenVisible(selected.id_proyecto) : []}
        horasLoading={loadingHoras}
        horasError={horasError}
        onClose={() => setSelected(null)}
      />

      {contentModal && (
        <ProjectContentModal onClose={() => setContentModal(null)}>
          {contentModal.type === "fases" ? (
            <FasesLists
              embedded
              proyectoId={contentModal.proyecto.id_proyecto}
              horasResumen={horasResumenByProyecto[contentModal.proyecto.id_proyecto] || []}
              onClose={() => setContentModal(null)}
            />
          ) : (
            <NotasLists
              embedded
              proyectoId={contentModal.proyecto.id_proyecto}
              onClose={() => setContentModal(null)}
            />
          )}
        </ProjectContentModal>
      )}

      {confirm && (
        <ConfirmModal
          danger
          title="Eliminar proyecto"
          message={`¿Estás seguro de eliminar el proyecto "${confirm.proyecto.nombre}"?`}
          confirmLabel="Sí, eliminar"
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </Layout>
  );
};

/* ── Vista lider ─────────────────────────────── */
/* ── Vista lider ─────────────────────────────── */
const LiderView = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [contentModal, setContentModal] = useState(null);
  const [search, setSearch] = useState("");

  // --- NUEVOS ESTADOS PARA H37 ---
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [proyectoAFinalizar, setProyectoAFinalizar] = useState(null);
  const [fechaFinReal, setFechaFinReal] = useState(new Date().toISOString().split('T')[0]);

  const fetch = useCallback(() => {
    setLoading(true);
    getMisProyectos()
      .then((res) => { 
        if (res.success) setProyectos(res.data); 
        else setError("No se pudieron cargar tus proyectos."); 
      })
      .catch(() => setError("Error al conectar con el servidor."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // --- SUBTAREA: FEEDBACK VISUAL (MENSAJES) ---
  const handleConfirmFinalizar = async () => {
    if (!proyectoAFinalizar) return;

    try {
      setLoading(true);
      // Enviamos el ID y el objeto con la fecha fin real
      const res = await finalizarProyecto(proyectoAFinalizar.id_proyecto, { 
        fecha_fin_real: fechaFinReal 
      });

      if (res.success) {
        notifySuccess("Proyecto finalizado correctamente. El registro de horas ha sido bloqueado.");
        setShowFinalizarModal(false);
        fetch(); // Recargar lista para ver el cambio de estado (is_active: false)
      } else {
        notifyError(res.message || "No se pudo finalizar el proyecto.");
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Error al procesar el cierre del proyecto.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = proyectos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    getServicioNombre(p).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        {/* ... Header y Stats se mantienen igual ... */}
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Proyectos que lidero</h2>
            <p className="text-muted small mb-0">
              {proyectos.length} proyecto{proyectos.length !== 1 ? "s" : ""} bajo tu liderazgo
            </p>
          </div>
        </div>

        {/* ... Stats Block ... */}

        <div className="mb-3">
          <div className="input-group" style={{ maxWidth: 360 }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input type="text" className="form-control border-start-0 ps-0"
              placeholder="Buscar proyecto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
          <div className="table-responsive">
            <table className="table table-modern mb-0">
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>Proyecto</th>
                  <th>Servicio</th>
                  <th>Fechas</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   // ... Skeletons ...
                   <tr><td colSpan="5">Cargando...</td></tr>
                ) : filtered.length > 0 ? (
                  filtered.map((p) => {
                    const active = isProyectoActivo(p);
                    return (
                      <tr key={p.id_proyecto} className="animate-fadeIn" style={{ cursor: "pointer" }} onClick={() => setSelected(p)}>
                        <td><i className="bi bi-chevron-right" style={{ color: "var(--primary)", fontSize: 12 }}></i></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-3 d-flex align-items-center justify-content-center"
                              style={{ width: 32, height: 32, background: active ? "rgba(79,70,229,.1)" : "rgba(100,116,139,.1)", flexShrink: 0 }}>
                              <i className="bi bi-kanban" style={{ color: active ? "var(--primary)" : "#94a3b8", fontSize: 14 }}></i>
                            </div>
                            <div>
                              <span className={`fw-semibold d-block ${!active ? "text-muted" : ""}`}>{p.nombre}</span>
                              {p.horas_estimadas && <span className="text-muted" style={{ fontSize: 11 }}>{p.horas_estimadas}h estimadas</span>}
                            </div>
                          </div>
                        </td>
                        <td className="text-muted small">{getServicioNombre(p)}</td>
                        <td className="text-muted small">
                          {p.fecha_inicio ? p.fecha_inicio.slice(0, 10) : "—"}
                          {p.fecha_fin_estimada ? <><br /><span style={{ fontSize: 10 }}>Est: {p.fecha_fin_estimada.slice(0, 10)}</span></> : ""}
                          {p.fecha_fin_real && <><br /><span className="text-success" style={{ fontSize: 10 }}>Real: {p.fecha_fin_real.slice(0, 10)}</span></>}
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-sm btn-primary shadow-sm" title="Fases" onClick={() => setContentModal({ type: "fases", proyecto: p })}>
                              <i className="bi bi-layers"></i>
                            </button>
                            <button className="btn btn-sm btn-info shadow-sm text-white" title="Notas" onClick={() => setContentModal({ type: "notas", proyecto: p })}>
                              <i className="bi bi-journal-text"></i>
                            </button>
                            
                            {/* --- SUBTAREA: BOTÓN FINALIZAR PROYECTO --- */}
                            {active && (
                              <button 
                                className="btn btn-sm btn-danger shadow-sm" 
                                title="Finalizar Proyecto"
                                onClick={() => {
                                  setProyectoAFinalizar(p);
                                  setShowFinalizarModal(true);
                                }}
                              >
                                <i className="bi bi-check-circle-fill"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="text-center py-4">No hay proyectos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ProyectoDetailModal proyecto={selected} onClose={() => setSelected(null)} />
      {contentModal && (
        <ProjectContentModal onClose={() => setContentModal(null)}>
          {contentModal.type === "fases" ? (
            <FasesLists
              embedded
              proyectoId={contentModal.proyecto.id_proyecto}
              onClose={() => setContentModal(null)}
            />
          ) : (
            <NotasLists
              embedded
              proyectoId={contentModal.proyecto.id_proyecto}
              onClose={() => setContentModal(null)}
            />
          )}
        </ProjectContentModal>    
      )}
      {showFinalizarModal && (
        <div className="modal-overlay" onClick={() => setShowFinalizarModal(false)}>
          <div className="modal-card p-0 animate-scaleIn" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="bg-danger p-3 text-white">
              <h6 className="fw-bold mb-0">Finalizar Proyecto</h6>
            </div>
            <div className="p-4">
              <p className="text-muted small">
                ¿Estás seguro de finalizar el proyecto <strong>{proyectoAFinalizar?.nombre}</strong>? 
                Esta operación es irreversible y bloqueará el registro de horas.
              </p>
              
              <div className="mb-3">
                <label className="form-label small fw-bold">Fecha de finalización real *</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm"
                  value={fechaFinReal}
                  max={new Date().toISOString().split('T')[0]} // No permite fechas futuras
                  onChange={(e) => setFechaFinReal(e.target.value)}
                />
              </div>

              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-light flex-fill fw-semibold" onClick={() => setShowFinalizarModal(false)}>Cancelar</button>
                <button className="btn btn-danger flex-fill fw-bold" onClick={handleConfirmFinalizar} disabled={loading}>
                  {loading ? "Procesando..." : "Confirmar Cierre"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

/* ── Vista empleado ──────────────────────────── */
const EmpleadoView = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [horasProyecto, setHorasProyecto] = useState(null);
  const [search, setSearch] = useState("");
  const [faseFilter, setFaseFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [horasByProyecto, setHorasByProyecto] = useState({});
  const [fasesByProyecto, setFasesByProyecto] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const proyectosRes = await getMisProyectos();
        if (proyectosRes?.success) {
          const proyectoList = proyectosRes.data || [];
          setProyectos(proyectoList);
        } else {
          setError("No se pudieron cargar tus proyectos.");
        }
      } catch {
        setError("Error al conectar con el servidor.");
      }

      try {
        const horasRes = await getHoras();
        const horasData = Array.isArray(horasRes)
          ? horasRes
          : (horasRes?.success && Array.isArray(horasRes.data) ? horasRes.data : []);

        const horasMap = {};
        const fasesMap = {};

        horasData.forEach((registro) => {
          const proyectoId = Number(registro.id_proyecto);
          if (!proyectoId) return;

          horasMap[proyectoId] = Number(horasMap[proyectoId] || 0) + Number(registro.horas || 0);

          const faseNombre = registro.fase || registro.fase_nombre;
          if (faseNombre) {
            if (!fasesMap[proyectoId]) fasesMap[proyectoId] = new Set();
            fasesMap[proyectoId].add(faseNombre);
          }
        });

        const fasesNormalized = Object.fromEntries(
          Object.entries(fasesMap).map(([id, fases]) => [id, Array.from(fases)])
        );

        setHorasByProyecto(horasMap);
        setFasesByProyecto(fasesNormalized);
      } catch {
        // Si falla horas, no bloqueamos la vista de proyectos.
        setHorasByProyecto({});
        setFasesByProyecto({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const proyectosConResumen = proyectos.map((p) => {
    const fases = fasesByProyecto[p.id_proyecto] || [];
    return {
      ...p,
      horas_registradas: Number(horasByProyecto[p.id_proyecto] || 0),
      fases,
    };
  });

  const fasesDisponibles = Array.from(
    new Set(proyectosConResumen.flatMap((p) => p.fases || []))
  ).sort((a, b) => a.localeCompare(b));

  const filtered = proyectosConResumen.filter((p) => {
    const text = search.trim().toLowerCase();
    const matchText = !text ||
      p.nombre?.toLowerCase().includes(text) ||
      (p.descripcion || "").toLowerCase().includes(text);
    const matchFase = !faseFilter || (p.fases || []).includes(faseFilter);
    return matchText && matchFase;
  });

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Mis proyectos asignados</h2>
            <p className="text-muted small mb-0">Proyectos a los que has sido asignado</p>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Buscar proyecto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={faseFilter}
              onChange={(e) => setFaseFilter(e.target.value)}
            >
              <option value="">Todas las fases</option>
              {fasesDisponibles.map((fase) => (
                <option key={fase} value={fase}>{fase}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center small rounded-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}

        {loading ? (
          <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
            <div className="table-responsive">
              <table className="table table-modern mb-0">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Fases</th>
                    <th>Horas registradas</th>
                    <th>Fechas</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j}><div className="skeleton rounded" style={{ height: 20, width: "80%" }}></div></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : proyectos.length === 0 ? (
          <div className="card border-0 rounded-4 d-flex flex-column align-items-center justify-content-center py-5"
            style={{ boxShadow: "var(--shadow-md)", minHeight: 300 }}>
            <i className="bi bi-kanban" style={{ fontSize: "3rem", color: "var(--primary)", opacity: .4 }}></i>
            <h5 className="fw-bold mt-3 mb-1">Sin proyectos asignados</h5>
            <p className="text-muted small">Contacta con tu líder para que te asigne a un proyecto.</p>
          </div>
        ) : (
          <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
            <div className="table-responsive">
              <table className="table table-modern mb-0">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Fases</th>
                    <th>Horas registradas</th>
                    <th>Fechas</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((p) => (
                      <tr
                        key={p.id_proyecto}
                        className="animate-fadeIn"
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelected(p)}
                      >
                        <td className="fw-semibold">
                          <div>{p.nombre}</div>
                          {p.servicio_nombre && <small className="text-muted">{p.servicio_nombre}</small>}
                        </td>
                        <td className="text-muted small">
                          {p.fases?.length ? p.fases.join(", ") : "—"}
                        </td>
                        <td>
                          <span className="fw-bold" style={{ color: "var(--primary)" }}>
                            {Number(p.horas_registradas || 0).toFixed(1)}h
                          </span>
                        </td>
                        <td className="text-muted small">
                          {p.fecha_inicio ? `Inicio: ${p.fecha_inicio.slice(0, 10)}` : "Inicio: —"}
                          <br />
                          {p.fecha_fin_estimada ? `Fin est.: ${p.fecha_fin_estimada.slice(0, 10)}` : "Fin est.: —"}
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-2"
                            onClick={() => setHorasProyecto(p)}
                          >
                            <i className="bi bi-clock-history"></i>
                            Registrar horas
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">
                        <div className="empty-state">
                          <i className="bi bi-search"></i>
                          <h6>Sin resultados</h6>
                          <p>No se encontraron proyectos con los filtros aplicados.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {horasProyecto !== null && (
        <HorasForm
          proyectoPreseleccionado={horasProyecto?.id_proyecto || null}
          onSaved={() => setHorasProyecto(null)}
          onCancel={() => setHorasProyecto(null)}
        />
      )}

      <EmpleadoProyectoDetailModal
        proyecto={selected}
        horasRegistradas={selected ? horasByProyecto[selected.id_proyecto] : 0}
        fases={selected ? (fasesByProyecto[selected.id_proyecto] || []) : []}
        onClose={() => setSelected(null)}
      />
    </Layout>
  );
};

/* ── Entry point ─────────────────────────────── */
const ProyectoList = () => {
  const { user } = useAuth();
  const rol = user?.rol;
  if (rol === "propietario") return <PropietarioView />;
  if (rol === "lider") return <LiderView />;
  return <EmpleadoView />;
};

export default ProyectoList;
