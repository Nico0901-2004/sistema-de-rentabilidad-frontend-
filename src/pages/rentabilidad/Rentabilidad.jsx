import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import { getRentabilidadProyectos } from "../../services/proyectoService";
import { ESTADOS_PROYECTO_LIST, EstadoProyectoBadge, getProyectoEstado } from "../proyectos/projectUtils";

const numberFields = {
  presupuesto: ["presupuesto", "ingresos_totales", "ingreso_total", "ingresos"],
  costos: ["costo_total", "costos_totales", "costo_real", "costos"],
  rentabilidad: ["rentabilidad", "utilidad", "ganancia"],
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

const formatDate = (date) => {
  if (!date) return "—";
  const [year, month, day] = String(date).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : String(date);
};

const getProjectDate = (project) => project.fecha_inicio || project.fecha_fin_real || project.fecha_fin_estimada || "";

const buildRow = (project) => {
  const presupuesto = getFirstNumber(project, numberFields.presupuesto);
  const costos = getFirstNumber(project, numberFields.costos);
  const rentabilidad = getFirstNumber(project, numberFields.rentabilidad);
  const horas = getFirstNumber(project, numberFields.horas);
  
  // Capturamos el margen que viene del backend como el "Margen Deseado"
  const margenDeseado = project.margen !== undefined && project.margen !== null ? Number(project.margen) : null;
  
  // Calculamos el Margen Real en base a la ejecución financiera actual
  const margenReal = presupuesto && rentabilidad !== null ? (rentabilidad / presupuesto) * 100 : null;

  return {
    ...project,
    presupuesto,
    costos,
    rentabilidad,
    horas,
    margenDeseado,
    margenReal,
    estado: getProyectoEstado(project),
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
  <div className="stat-card card-3d animate-fadeInUp h-100" style={{ minWidth: 0 }}>
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
        <h4 className="fw-bold mb-0 text-truncate" style={{ color, fontSize: "clamp(.9rem, 1.2vw, 1.05rem)" }}>{value}</h4>
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
  const [estadoFiltro, setEstadoFiltro] = useState("");

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
    presupuesto: hasAnyField(proyectos, numberFields.presupuesto),
    costos: hasAnyField(proyectos, numberFields.costos),
    rentabilidad: hasAnyField(proyectos, numberFields.rentabilidad),
    horas: hasAnyField(proyectos, numberFields.horas),
    fechas: proyectos.some((p) => p.fecha_inicio || p.fecha_fin_estimada || p.fecha_fin_real),
    margenDeseado: rows.some((p) => p.margenDeseado !== null),
    margenReal: rows.some((p) => p.margenReal !== null),
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

      const margen = project.margenReal;
      const matchMargen =
        !margenFiltro ||
        (margenFiltro === "positivo" && margen !== null && margen >= 0) ||
        (margenFiltro === "alto" && margen !== null && margen >= 30) ||
        (margenFiltro === "riesgo" && margen !== null && margen >= 0 && margen < 30) ||
        (margenFiltro === "perdida" && margen !== null && margen < 0);
      const matchEstado = !estadoFiltro || project.estado === estadoFiltro;

      return matchSearch && matchDesde && matchHasta && matchMargen && matchEstado;
    });
  }, [rows, search, fechaDesde, fechaHasta, margenFiltro, estadoFiltro]);

  const totals = useMemo(() => {
    const sum = (field) => filtered.reduce((acc, item) => acc + Number(item[field] || 0), 0);
    const presupuesto = sum("presupuesto");
    const rentabilidad = sum("rentabilidad");
    return {
      presupuesto,
      costos: sum("costos"),
      rentabilidad,
      horas: sum("horas"),
      margenReal: presupuesto ? (rentabilidad / presupuesto) * 100 : 0,
    };
  }, [filtered]);

  const clearFilters = () => {
    setSearch("");
    setFechaDesde("");
    setFechaHasta("");
    setMargenFiltro("");
    setEstadoFiltro("");
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: "Proyecto",
        style: { width: "22%" },
        render: (project) => (
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, overflow: "hidden" }}>
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
        ),
      },
      {
        header: "Servicio",
        style: { width: "11%" },
        cellClassName: "text-muted small",
        render: (project) => <span className="d-block text-truncate">{project.servicio || "—"}</span>,
      },
      {
        header: "Estado",
        style: { width: "11%" },
        render: (project) => <EstadoProyectoBadge estado={project.estado} />,
      },
    ];

    if (available.presupuesto) {
      baseColumns.push({
        header: "Presupuesto",
        style: { width: "10.5%" },
        headerClassName: "text-end",
        cellClassName: "text-end fw-semibold",
        render: (project) => project.presupuesto !== null ? formatMoney(project.presupuesto) : "—",
      });
    }

    if (available.costos) {
      baseColumns.push({
        header: "Costos",
        style: { width: "9.5%" },
        headerClassName: "text-end",
        cellClassName: "text-end",
        render: (project) => project.costos !== null ? formatMoney(project.costos) : "—",
      });
    }

    if (available.rentabilidad) {
      baseColumns.push({
        header: "Rentabilidad",
        style: { width: "11.5%" },
        headerClassName: "text-end",
        cellClassName: "text-end fw-bold",
        render: (project) => (
          <span style={{ color: Number(project.rentabilidad || 0) >= 0 ? "var(--success)" : "var(--danger)" }}>
            {project.rentabilidad !== null ? formatMoney(project.rentabilidad) : "—"}
          </span>
        ),
      });
    }

    if (available.margenDeseado) {
      baseColumns.push({
        header: "Margen Deseado",
        style: { width: "8.5%" },
        headerClassName: "text-end",
        cellClassName: "text-end fw-semibold text-muted small",
        render: (project) => project.margenDeseado !== null ? `${formatNumber(project.margenDeseado, 1)}%` : "—",
      });
    }

    if (available.margenReal) {
      baseColumns.push({
        header: "Margen Real",
        style: { width: "8%" },
        headerClassName: "text-end",
        cellClassName: "text-end",
        render: (project) => project.margenReal !== null ? (() => {
          const status = getMarginStatus(project.margenReal);
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
              {formatNumber(project.margenReal, 1)}%
            </span>
          );
        })() : <span className="text-muted">—</span>,
      });
    }

    if (available.horas) {
      baseColumns.push({
        header: "Horas",
        style: { width: "7%" },
        headerClassName: "text-end",
        cellClassName: "text-end",
        render: (project) => project.horas !== null ? `${formatNumber(project.horas, 1)}h` : "—",
      });
    }

    if (available.fechas) {
      baseColumns.push({
        header: "Fechas",
        style: { width: "8.5%" },
        cellClassName: "text-muted small",
        render: (project) => (
          <div style={{ minWidth: 0, lineHeight: 1.25 }}>
            <span className="d-block text-truncate">Inicio</span>
            <strong className="d-block text-truncate mb-1" style={{ color: "var(--text)", fontSize: ".72rem" }}>
              {formatDate(project.fecha_inicio)}
            </strong>
            <span className="d-block text-truncate">Fin est.</span>
            <strong className="d-block text-truncate" style={{ color: "var(--text)", fontSize: ".72rem" }}>
              {formatDate(project.fecha_fin_estimada)}
            </strong>
            {project.fecha_fin_real && (
              <>
                <span className="d-block text-success text-truncate mt-1">Fin real</span>
                <strong className="d-block text-success text-truncate" style={{ fontSize: ".72rem" }}>
                  {formatDate(project.fecha_fin_real)}
                </strong>
              </>
            )}
          </div>
        ),
      });
    }

    return baseColumns;
  }, [available]);

  const filters = (
    <div className="card border-0 rounded-4 mb-3" style={{ boxShadow: "var(--shadow-md)" }}>
      <div className="card-body p-3">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-lg-4 col-xl-3">
            <label htmlFor="rentabilidad-proyecto" className="form-label small fw-bold text-muted mb-1">Proyecto</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0" style={{ minHeight: 42 }}>
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                id="rentabilidad-proyecto"
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Buscar por proyecto..."
                value={search}
                style={{ minHeight: 42 }}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {available.fechas && (
            <>
              <div className="col-6 col-md-4 col-lg-2 col-xl">
                <label htmlFor="rentabilidad-desde" className="form-label small fw-bold text-muted mb-1">Desde</label>
                <input
                  id="rentabilidad-desde"
                  type="date"
                  className="form-control"
                  value={fechaDesde}
                  max={fechaHasta || undefined}
                  style={{ minHeight: 42 }}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-4 col-lg-2 col-xl">
                <label htmlFor="rentabilidad-hasta" className="form-label small fw-bold text-muted mb-1">Hasta</label>
                <input
                  id="rentabilidad-hasta"
                  type="date"
                  className="form-control"
                  value={fechaHasta}
                  min={fechaDesde || undefined}
                  style={{ minHeight: 42 }}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>
            </>
          )}

          {available.margenReal && (
            <div className="col-6 col-md-4 col-lg-2 col-xl">
              <label htmlFor="rentabilidad-margen" className="form-label small fw-bold text-muted mb-1">Margen real</label>
              <select
                id="rentabilidad-margen"
                className="form-select"
                value={margenFiltro}
                style={{ minHeight: 42 }}
                onChange={(e) => setMargenFiltro(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="alto">30% o más</option>
                <option value="riesgo">0% a 29.9%</option>
                <option value="perdida">Pérdida</option>
                <option value="positivo">Rentable</option>
              </select>
            </div>
          )}

          <div className="col-6 col-md-4 col-lg-2 col-xl">
            <label htmlFor="rentabilidad-estado" className="form-label small fw-bold text-muted mb-1">Estado</label>
            <select
              id="rentabilidad-estado"
              className="form-select"
              value={estadoFiltro}
              style={{ minHeight: 42 }}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              {ESTADOS_PROYECTO_LIST.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-4 col-lg-2 col-xl">
            <button
              className="btn btn-light w-100 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 text-nowrap"
              style={{ minHeight: 42 }}
              onClick={clearFilters}
            >
              <i className="bi bi-x-circle"></i>
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp w-100" style={{ minWidth: 0 }}>
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

        <div className="row g-3 mb-3 stagger">
          {available.presupuesto && (
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard icon="bi-cash-stack" label="Presupuesto total" value={loading ? "..." : formatMoney(totals.presupuesto)} color="#4F46E5" bg="rgba(79,70,229,.1)" />
            </div>
          )}
          {available.costos && (
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard icon="bi-receipt" label="Costos totales" value={loading ? "..." : formatMoney(totals.costos)} color="#F59E0B" bg="rgba(245,158,11,.1)" />
            </div>
          )}
          {available.rentabilidad && (
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard icon="bi-graph-up-arrow" label="Rentabilidad total" value={loading ? "..." : formatMoney(totals.rentabilidad)} color={totals.rentabilidad >= 0 ? "#10B981" : "#EF4444"} bg={totals.rentabilidad >= 0 ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)"} />
            </div>
          )}
          {available.margenReal && (
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard icon="bi-percent" label="Margen real promedio" value={loading ? "..." : `${formatNumber(totals.margenReal, 1)}%`} color="#06B6D4" bg="rgba(6,182,212,.1)" />
            </div>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          error=""
          rowKey={(project) => project.id_proyecto || project.id || project.nombre}
          filters={filters}
          tableClassName="w-100"
          emptyIcon="bi-search"
          emptyMessage={proyectos.length === 0 ? "Sin datos de rentabilidad" : "Sin resultados"}
          rowClassName="animate-fadeIn"
        />
      </div>
    </Layout>
  );
};

export default Rentabilidad;
