import React, { useCallback, useMemo, useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ProyectoForm from "./ProyectoForm";
import ProyectoDetailModal from "./ProyectoDetailModal";
import ProjectContentModal from "./ProjectContentModal";
import FasesLists from "../fases/FasesLists";
import NotasLists from "../notas/NotasLists";
import { getFasesByProyecto } from "../../services/faseService";
import { getProyectoById, getProyectos, eliminarProyecto, getHorasResumenProyecto } from "../../services/proyectoService";
import { notifySuccess, notifyError } from "../../utils/notify";
import { formatShortDate, getFaseId, getFaseNombre, getServicioNombre, getLiderNombre, getTotalHorasEstimadas, isDateInRange, isProyectoActivo, normalizeHorasResumen, normalizeProyectoFases } from "./projectUtils";

const PropietarioProjectsView = () => {
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
  const [fasesByProyecto, setFasesByProyecto] = useState({});
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
        const fasesEntries = await Promise.all(
          proyectosConDetalle.map(async (proyecto) => {
            try {
              const fases = await getFasesByProyecto(proyecto.id_proyecto);
              return [proyecto.id_proyecto, normalizeProyectoFases(fases)];
            } catch {
              return [proyecto.id_proyecto, []];
            }
          })
        );
        setHorasResumenByProyecto(Object.fromEntries(resumenEntries));
        setFasesByProyecto(Object.fromEntries(fasesEntries));
        setHorasError("");
        setLoadingHoras(false);
      } else {
        setError("No se pudo cargar la lista de proyectos.");
        setLoadingHoras(false);
      }
    } catch {
      setError("Error al conectar con el servidor.");
      setHorasResumenByProyecto({});
      setFasesByProyecto({});
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

    Object.values(fasesByProyecto).flat().forEach((fase) => {
      const faseId = getFaseId(fase);
      const faseNombre = getFaseNombre(fase);
      if (!faseId && !faseNombre) return;
      const key = String(faseId ?? faseNombre);
      if (!fases.has(key)) fases.set(key, faseNombre || `Fase #${faseId}`);
    });

    return Array.from(fases.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [fasesByProyecto]);

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
      const fasesProyecto = fasesByProyecto[p.id_proyecto] || [];

      const matchSearch = !term ||
        p.nombre.toLowerCase().includes(term) ||
        (p.descripcion || "").toLowerCase().includes(term) ||
        getServicioNombre(p).toLowerCase().includes(term) ||
        getLiderNombre(p).toLowerCase().includes(term);
      const matchProyecto = !filterProyecto || String(p.id_proyecto) === filterProyecto;
      const matchFase = !filterFase || fasesProyecto.some((fase) =>
        String(getFaseId(fase) ?? getFaseNombre(fase)) === filterFase
      );
      const matchFecha = !(fechaDesde || fechaHasta) || resumenByDate.length > 0;

      return matchSearch && matchProyecto && matchFase && matchFecha;
    });
  }, [proyectos, horasResumenByProyecto, fasesByProyecto, search, filterProyecto, filterFase, fechaDesde, fechaHasta]);

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

  const getFasesVisible = useCallback((proyectoId) => {
    const fases = fasesByProyecto[proyectoId] || [];
    return fases.filter((fase) => !filterFase ||
      String(getFaseId(fase) ?? getFaseNombre(fase)) === filterFase
    );
  }, [fasesByProyecto, filterFase]);

  const filters = (
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
  );

  const columns = [
    { header: "", key: "indicator", style: { width: "3%" }, render: () => <i className="bi bi-chevron-right" style={{ color: "var(--primary)", fontSize: 12 }}></i> },
    {
      header: "Proyecto",
      style: { width: "26%" },
      render: (p) => {
        const active = isProyectoActivo(p);
        return (
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32, background: active ? "rgba(79,70,229,.1)" : "rgba(100,116,139,.1)", flexShrink: 0 }}>
              <i className="bi bi-kanban" style={{ color: active ? "var(--primary)" : "#94a3b8", fontSize: 14 }}></i>
            </div>
            <div style={{ minWidth: 0 }}>
              <span className={`fw-semibold d-block text-truncate ${!active ? "text-muted" : ""}`}>{p.nombre}</span>
              {p.presupuesto ? (
                <span className="text-muted" style={{ fontSize: 11 }}>
                  #{p.id_proyecto} · S/ {Number(p.presupuesto).toLocaleString("es-PE")}
                </span>
              ) : (
                <span className="text-muted" style={{ fontSize: 11 }}>#{p.id_proyecto}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Servicio",
      style: { width: "14%" },
      cellClassName: "text-muted small text-truncate",
      cellStyle: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      render: (p) => getServicioNombre(p),
    },
    {
      header: "Líder",
      style: { width: "14%" },
      cellClassName: "text-muted small",
      render: (p) => (
        <span className="d-flex align-items-center gap-1" style={{ fontSize: 11, minWidth: 0 }}>
          <i className="bi bi-star-fill flex-shrink-0" style={{ color: "#D97706", fontSize: 9 }}></i>
          <span className="text-truncate" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {getLiderNombre(p)}
          </span>
        </span>
      ),
    },
    {
      header: "Horas Estimadas", // CORRECCIÓN: Modificado título para reflejar solo lo estimado en tabla
      headerClassName: "text-center",
      style: { width: "10%" },
      cellClassName: "text-center",
      render: (p) => {
        // CORRECCIÓN: Comentada la visualización de horas totales registradas
        // const resumenVisible = getResumenVisible(p.id_proyecto);
        // const totalHorasProyecto = getTotalHorasResumen(resumenVisible);
        const fasesProyecto = getFasesVisible(p.id_proyecto);
        const totalHorasEstimadas = getTotalHorasEstimadas(fasesProyecto);

        return (
          <>
            {/* <span className="fw-bold" style={{ color: "var(--primary)" }}>
              {loadingHoras ? "..." : `${totalHorasProyecto.toFixed(1)}h`}
            </span> 
            */}
            <span className="fw-bold" style={{ color: "var(--accent)" }}>
              {totalHorasEstimadas.toFixed(1)}h
            </span>
            {fasesProyecto.length > 0 && (
              <span className="d-block text-muted" style={{ fontSize: 11 }}>
                {fasesProyecto.length} fase{fasesProyecto.length !== 1 ? "s" : ""}
              </span>
            )}
          </>
        );
      },
    },
    {
      header: "Fechas",
      headerClassName: "text-center",
      style: { width: "21%" },
      cellClassName: "text-muted small",
      render: (p) => (
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
      ),
    },
  ];

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

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          error={error}
          rowKey="id_proyecto"
          filters={filters}
          tableClassName="align-middle"
          emptyIcon="bi-kanban"
          emptyMessage="Sin proyectos"
          onRowClick={setSelected}
          rowClassName="animate-fadeIn"
          rowStyle={{ cursor: "pointer" }}
          renderActions={(p) => (
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
          )}
        />
      </div>

      <ProyectoDetailModal
        proyecto={selected}
        horasResumen={selected ? getResumenVisible(selected.id_proyecto) : []}
        fases={selected ? (fasesByProyecto[selected.id_proyecto] || []) : []}
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
              onChanged={fetch}
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

export default PropietarioProjectsView;
