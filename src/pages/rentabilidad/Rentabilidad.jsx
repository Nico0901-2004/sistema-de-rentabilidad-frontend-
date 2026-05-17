import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import { getRentabilidadProyectos } from "../../services/proyectoService";

const numberFields = {
  ingresos: ["ingresos_totales", "ingreso_total", "ingresos", "presupuesto"],
  costos: ["costos_totales", "costo_total", "costo_real", "costos"],
  utilidad: ["utilidad", "ganancia", "rentabilidad"],
  horas: ["horas_registradas", "total_horas", "horas"],
};

const getFirstNumber = (item, fields) => {
  const field = fields.find((key) => item[key] !== undefined && item[key] !== null && item[key] !== "");
  if (!field) return null;
  const value = Number(item[field]);
  return Number.isFinite(value) ? value : null;
};

const hasAnyField = (items, fields) => items.some((item) => fields.some((field) => item[field] !== undefined && item[field] !== null));

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  });

const formatNumber = (value, decimals = 1) =>
  Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const formatDate = (date) => (date ? String(date).slice(0, 10) : "—");

const getProjectDate = (project) => project.fecha_inicio || project.fecha_fin_real || project.fecha_fin_estimada || "";

const buildRow = (project) => {
  const ingresos = getFirstNumber(project, numberFields.ingresos);
  const costos = getFirstNumber(project, numberFields.costos);
  const utilidad = getFirstNumber(project, numberFields.utilidad);
  const horas = getFirstNumber(project, numberFields.horas);
  const margen = ingresos && utilidad !== null ? (utilidad / ingresos) * 100 : null;

  return {
    ...project,
    ingresos,
    costos,
    utilidad,
    horas,
    margen,
    servicio: project.nombre_servicio || project.servicio_nombre,
    lider: project.nombre_lider || project.lider_nombre,
  };
};

const getMarginStatus = (margin) => {
  if (margin === null) {
    return {
      label: "Sin margen",
      icon: "bi-dash-circle",
      color: "#64748B",
      bg: "rgba(100,116,139,.12)",
      border: "rgba(100,116,139,.25)",
    };
  }

  if (margin < 0) {
    return {
      label: "Pérdida",
      icon: "bi-arrow-down-circle-fill",
      color: "#DC2626",
      bg: "#FEE2E2",
      border: "rgba(220,38,38,.35)",
    };
  }

  if (margin < 30) {
    return {
      label: "Al límite",
      icon: "bi-exclamation-triangle-fill",
      color: "#B45309",
      bg: "#FEF3C7",
      border: "rgba(180,83,9,.35)",
    };
  }

  return {
    label: "Ganancia",
    icon: "bi-check-circle-fill",
    color: "#047857",
    bg: "#D1FAE5",
    border: "rgba(4,120,87,.35)",
  };
};

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className="stat-card card-3d animate-fadeInUp">
    <div className="stat-card__glow" style={{ background: color }}></div>
    <div className="d-flex align-items-center gap-3">
      <div
        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 46, height: 46, background: bg }}
      >
        <i className={`bi ${icon}`} style={{ color, fontSize: 21 }}></i>
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="text-muted small mb-0">{label}</p>
        <h4 className="fw-bold mb-0 text-truncate" style={{ color }}>{value}</h4>
      </div>
    </div>
  </div>
);

const Rentabilidad = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [margenFiltro, setMargenFiltro] = useState("");

  useEffect(() => {
    const fetchRentabilidad = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getRentabilidadProyectos();
        if (res?.success) {
          setProyectos(Array.isArray(res.data) ? res.data : []);
        } else {
          setError(res?.message || "No se pudo cargar la rentabilidad.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchRentabilidad();
  }, []);

  const rows = useMemo(() => proyectos.map(buildRow), [proyectos]);

  const available = useMemo(() => ({
    ingresos: hasAnyField(proyectos, numberFields.ingresos),
    costos: hasAnyField(proyectos, numberFields.costos),
    utilidad: hasAnyField(proyectos, numberFields.utilidad),
    horas: hasAnyField(proyectos, numberFields.horas),
    fechas: proyectos.some((p) => p.fecha_inicio || p.fecha_fin_estimada || p.fecha_fin_real),
    margen: rows.some((p) => p.margen !== null),
  }), [proyectos, rows]);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return rows.filter((project) => {
      const matchSearch = !text ||
        project.nombre?.toLowerCase().includes(text) ||
        (project.servicio || "").toLowerCase().includes(text) ||
        (project.lider || "").toLowerCase().includes(text);

      const projectDate = getProjectDate(project);
      const matchDesde = !fechaDesde || (projectDate && projectDate.slice(0, 10) >= fechaDesde);
      const matchHasta = !fechaHasta || (projectDate && projectDate.slice(0, 10) <= fechaHasta);

      const margen = project.margen;
      const matchMargen =
        !margenFiltro ||
        (margenFiltro === "positivo" && margen !== null && margen >= 0) ||
        (margenFiltro === "alto" && margen !== null && margen >= 30) ||
        (margenFiltro === "riesgo" && margen !== null && margen >= 0 && margen < 30) ||
        (margenFiltro === "perdida" && margen !== null && margen < 0);

      return matchSearch && matchDesde && matchHasta && matchMargen;
    });
  }, [rows, search, fechaDesde, fechaHasta, margenFiltro]);

  const totals = useMemo(() => {
    const sum = (field) => rows.reduce((acc, item) => acc + Number(item[field] || 0), 0);
    const ingresos = sum("ingresos");
    const utilidad = sum("utilidad");
    return {
      ingresos,
      costos: sum("costos"),
      utilidad,
      horas: sum("horas"),
      margen: ingresos ? (utilidad / ingresos) * 100 : 0,
    };
  }, [rows]);

  const clearFilters = () => {
    setSearch("");
    setFechaDesde("");
    setFechaHasta("");
    setMargenFiltro("");
  };

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Rentabilidad</h2>
            <p className="text-muted small mb-0">Métricas financieras por proyecto</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center small rounded-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}

        <div className="row g-3 mb-4 stagger">
          {available.ingresos && (
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard icon="bi-cash-stack" label="Ingresos totales" value={loading ? "..." : formatMoney(totals.ingresos)} color="#4F46E5" bg="rgba(79,70,229,.1)" />
            </div>
          )}
          {available.costos && (
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard icon="bi-receipt" label="Costos totales" value={loading ? "..." : formatMoney(totals.costos)} color="#F59E0B" bg="rgba(245,158,11,.1)" />
            </div>
          )}
          {available.utilidad && (
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard icon="bi-graph-up-arrow" label="Utilidad total" value={loading ? "..." : formatMoney(totals.utilidad)} color={totals.utilidad >= 0 ? "#10B981" : "#EF4444"} bg={totals.utilidad >= 0 ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)"} />
            </div>
          )}
          {available.margen && (
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard icon="bi-percent" label="Margen promedio" value={loading ? "..." : `${formatNumber(totals.margen, 1)}%`} color="#06B6D4" bg="rgba(6,182,212,.1)" />
            </div>
          )}
          {available.horas && (
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard icon="bi-clock-history" label="Horas registradas" value={loading ? "..." : `${formatNumber(totals.horas, 1)}h`} color="#64748B" bg="rgba(100,116,139,.1)" />
            </div>
          )}
        </div>

        <div className="card border-0 rounded-4 mb-4" style={{ boxShadow: "var(--shadow-md)" }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-end">
              <div className="col-12 col-lg-4">
                <label className="form-label small fw-bold text-muted">Proyecto</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Buscar por proyecto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {available.fechas && (
                <>
                  <div className="col-6 col-lg-2">
                    <label className="form-label small fw-bold text-muted">Desde</label>
                    <input type="date" className="form-control" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                  </div>
                  <div className="col-6 col-lg-2">
                    <label className="form-label small fw-bold text-muted">Hasta</label>
                    <input type="date" className="form-control" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                  </div>
                </>
              )}

              {available.margen && (
                <div className="col-12 col-lg-2">
                  <label className="form-label small fw-bold text-muted">Margen</label>
                  <select className="form-select" value={margenFiltro} onChange={(e) => setMargenFiltro(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="alto">30% o más</option>
                    <option value="riesgo">0% a 29.9%</option>
                    <option value="perdida">Pérdida</option>
                    <option value="positivo">Rentable</option>
                  </select>
                </div>
              )}

              <div className="col-12 col-lg-2">
                <button className="btn btn-light w-100 fw-semibold" onClick={clearFilters}>
                  <i className="bi bi-x-circle me-2"></i>
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
          <div className="table-responsive">
            <table className="table table-modern mb-0" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Servicio</th>
                  {available.ingresos && <th className="text-end">Ingresos</th>}
                  {available.costos && <th className="text-end">Costos</th>}
                  {available.utilidad && <th className="text-end">Utilidad</th>}
                  {available.margen && <th className="text-end">Margen</th>}
                  {available.horas && <th className="text-end">Horas</th>}
                  {available.fechas && <th>Fechas</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j}><div className="skeleton rounded" style={{ height: 20, width: "80%" }}></div></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((project) => (
                    <tr key={project.id_proyecto || project.id || project.nombre} className="animate-fadeIn">
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 34, height: 34, background: "rgba(79,70,229,.1)" }}
                          >
                            <i className="bi bi-kanban-fill" style={{ color: "var(--primary)", fontSize: 14 }}></i>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span className="fw-semibold d-block text-truncate">{project.nombre || "Proyecto sin nombre"}</span>
                            {project.lider && <span className="text-muted" style={{ fontSize: 11 }}>Líder: {project.lider}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="text-muted small">{project.servicio || "—"}</td>
                      {available.ingresos && <td className="text-end fw-semibold">{project.ingresos !== null ? formatMoney(project.ingresos) : "—"}</td>}
                      {available.costos && <td className="text-end">{project.costos !== null ? formatMoney(project.costos) : "—"}</td>}
                      {available.utilidad && (
                        <td className="text-end fw-bold" style={{ color: Number(project.utilidad || 0) >= 0 ? "var(--success)" : "var(--danger)" }}>
                          {project.utilidad !== null ? formatMoney(project.utilidad) : "—"}
                        </td>
                      )}
                      {available.margen && (
                        <td className="text-end">
                          {project.margen !== null ? (() => {
                            const status = getMarginStatus(project.margen);
                            return (
                              <span
                                className="d-inline-flex align-items-center justify-content-end gap-2 fw-bold"
                                title={status.label}
                                style={{
                                  minWidth: 72,
                                  padding: "5px 9px",
                                  borderRadius: 50,
                                  color: status.color,
                                  background: status.bg,
                                  border: `1.5px solid ${status.border}`,
                                  fontSize: 12,
                                  lineHeight: 1,
                                }}
                              >
                                <i className={`bi ${status.icon}`} style={{ fontSize: 12 }}></i>
                                {formatNumber(project.margen, 1)}%
                              </span>
                            );
                          })() : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      )}
                      {available.horas && <td className="text-end">{project.horas !== null ? `${formatNumber(project.horas, 1)}h` : "—"}</td>}
                      {available.fechas && (
                        <td className="text-muted small">
                          Inicio: {formatDate(project.fecha_inicio)}
                          <br />
                          Fin est.: {formatDate(project.fecha_fin_estimada)}
                          {project.fecha_fin_real && (
                            <>
                              <br />
                              <span className="text-success">Fin real: {formatDate(project.fecha_fin_real)}</span>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state py-5">
                        <i className="bi bi-search"></i>
                        <h6>{proyectos.length === 0 ? "Sin datos de rentabilidad" : "Sin resultados"}</h6>
                        <p>{proyectos.length === 0 ? "Los proyectos aparecerán aquí cuando existan datos disponibles." : "No se encontraron proyectos con los filtros aplicados."}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Rentabilidad;
