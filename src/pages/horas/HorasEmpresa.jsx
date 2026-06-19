import React, { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import { getHorasEmpresa } from "../../services/horasService";
import { notifyError } from "../../utils/notify";

const formatFechaLocal = (value) => {
  if (!value) return "--";
  const raw = String(value).slice(0, 10);
  const parts = raw.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    const localDate = new Date(y, (m || 1) - 1, d || 1);
    return localDate.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return raw;
};

const HorasEmpresa = () => {
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateDesde, setDateDesde] = useState("");
  const [dateHasta, setDateHasta] = useState("");
  const [filterFase, setFilterFase] = useState("");
  const [filterProyecto, setFilterProyecto] = useState("");
  const [errorFechas, setErrorFechas] = useState("");

  const fetchHoras = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setErrorFechas("");

      const res = await getHorasEmpresa();
      if (res.success) {
        const ordenados = res.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setHoras(ordenados);
      } else {
        setError("No se pudo cargar las horas del equipo.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
      notifyError("Error al cargar horas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoras();
  }, [fetchHoras]);

  // Validación de fechas
  const handleFilterChange = () => {
    setErrorFechas("");
    if (dateDesde && dateHasta && dateDesde > dateHasta) {
      setErrorFechas("La fecha 'Desde' no puede ser mayor que 'Hasta'");
    }
  };

  // Extraer fases únicas
  const fasesUnicas = useMemo(() => {
    const map = new Map();
    horas.forEach((h) => {
      const id = String(h.id_fase ?? "");
      if (id && id !== "undefined" && !map.has(id)) {
        map.set(id, h.fase_nombre ?? h.fase ?? "-");
      }
    });
    return Array.from(map.entries());
  }, [horas]);

  // Extraer proyectos únicos
  const proyectosUnicos = useMemo(() => {
    const map = new Map();
    horas.forEach((h) => {
      const id = String(h.id_proyecto ?? "");
      if (id && id !== "undefined" && !map.has(id)) {
        map.set(id, h.proyecto_nombre ?? h.proyecto ?? "-");
      }
    });
    return Array.from(map.entries());
  }, [horas]);

  // Filtrar por fecha, fase y proyecto
  const horasFiltradas = useMemo(() => {
    if (errorFechas) return horas;
    return horas.filter((hora) => {
      if (dateDesde && hora.fecha < dateDesde) return false;
      if (dateHasta && hora.fecha > dateHasta) return false;
      if (filterFase && String(hora.id_fase ?? "") !== filterFase) return false;
      if (filterProyecto && String(hora.id_proyecto ?? "") !== filterProyecto) return false;
      return true;
    });
  }, [horas, dateDesde, dateHasta, filterFase, filterProyecto, errorFechas]);

  // Calcular totales
  const { totalRegistros, totalHoras } = useMemo(() => {
    return {
      totalRegistros: horasFiltradas.length,
      totalHoras: horasFiltradas.reduce((sum, hora) => sum + Number(hora.horas || 0), 0),
    };
  }, [horasFiltradas]);

  const columns = [
    {
      header: "Empleado",
      cellClassName: "small",
      render: (h) => h.empleado_nombre || "Sin nombre",
    },
    {
      header: "Fecha",
      cellClassName: "small text-muted",
      render: (h) => formatFechaLocal(h.fecha),
    },
    {
      header: "Proyecto",
      render: (h) => (
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: 30, height: 30, background: "rgba(79,70,229,.1)" }}
          >
            <i
              className="bi bi-kanban"
              style={{ color: "var(--primary)", fontSize: 13 }}
            ></i>
          </div>
          <span className="fw-semibold">{h.proyecto_nombre || "-"}</span>
        </div>
      ),
    },
    {
      header: "Fase",
      render: (h) => (
        <span
          className="badge rounded-pill"
          style={{ background: "rgba(6,182,212,.12)", color: "var(--accent)" }}
        >
          {h.fase_nombre || "-"}
        </span>
      ),
    },
    {
      header: "Horas",
      render: (h) => (
        <span className="fw-bold" style={{ color: "var(--primary)" }}>
          {Number(h.horas || 0).toFixed(1)}h
        </span>
      ),
    },
    {
      header: "Descripción",
      cellClassName: "text-muted small",
      cellStyle: {
        maxWidth: 200,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      render: (h) =>
        h.descripcion || (
          <span className="text-light-muted italic">Sin descripción</span>
        ),
    },
  ];

  const filters = (
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <select
        className="form-control form-control-sm"
        style={{ maxWidth: 180 }}
        value={filterProyecto}
        onChange={(e) => setFilterProyecto(e.target.value)}
      >
        <option value="">- Todos los proyectos -</option>
        {proyectosUnicos.map(([id, nombre]) => (
          <option key={id} value={id}>{nombre}</option>
        ))}
      </select>

      <select
        className="form-control form-control-sm"
        style={{ maxWidth: 180 }}
        value={filterFase}
        onChange={(e) => setFilterFase(e.target.value)}
      >
        <option value="">- Todas las fases -</option>
        {fasesUnicas.map(([id, nombre]) => (
          <option key={id} value={id}>{nombre}</option>
        ))}
      </select>

      <label className="text-muted small mb-0">Desde:</label>
      <input
        type="date"
        className="form-control form-control-sm"
        style={{ maxWidth: 140 }}
        value={dateDesde}
        onChange={(e) => {
          setDateDesde(e.target.value);
          handleFilterChange();
        }}
      />
      <label className="text-muted small mb-0">Hasta:</label>
      <input
        type="date"
        className="form-control form-control-sm"
        style={{ maxWidth: 140 }}
        value={dateHasta}
        onChange={(e) => {
          setDateHasta(e.target.value);
          handleFilterChange();
        }}
      />
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => {
          setDateDesde("");
          setDateHasta("");
          setFilterFase("");
          setFilterProyecto("");
          setErrorFechas("");
        }}
        disabled={!dateDesde && !dateHasta && !filterFase && !filterProyecto}
      >
        <i className="bi bi-arrow-clockwise me-1"></i>
        Limpiar
      </button>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Horas del Equipo</h2>
            <p className="text-muted small mb-0">
              Horas registradas por empleados y líderes
            </p>
          </div>
        </div>

        {errorFechas && (
          <div className="alert alert-warning d-flex align-items-center small rounded-3 mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorFechas}
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center small rounded-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        <div className="row g-3 mb-3">
          <div className="col-12 col-sm-6">
            <div className="stat-card card-3d animate-fadeInUp">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 40, height: 40, background: "rgba(79,70,229,.1)" }}
                >
                  <i className="bi bi-list-check" style={{ color: "var(--primary)" }}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Total Registros</p>
                  <h5 className="fw-bold mb-0">{totalRegistros}</h5>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6">
            <div className="stat-card card-3d animate-fadeInUp">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 40, height: 40, background: "rgba(6,182,212,.1)" }}
                >
                  <i
                    className="bi bi-clock-history"
                    style={{ color: "var(--accent)" }}
                  ></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Total Horas Acumuladas</p>
                  <h5 className="fw-bold mb-0">{totalHoras.toFixed(1)}h</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={horasFiltradas}
          loading={loading}
          error=""
          rowKey={(h) => `${h.id_registro}`}
          filters={filters}
          emptyIcon="bi-clock-history"
          emptyMessage="Sin horas registradas"
          rowClassName="animate-fadeIn"
          pageSize={6}
        />
      </div>
    </Layout>
  );
};

export default HorasEmpresa;
