import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import { getHorasEmpresa } from "../../services/horasService";

const getHorasData = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.success && Array.isArray(response.data)) return response.data;
  return [];
};

const HorasEmpresaList = () => {
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filterEmpleado, setFilterEmpleado] = useState("");
  const [filterProyecto, setFilterProyecto] = useState("");

  const fetchHoras = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getHorasEmpresa();
      setHoras(getHorasData(response));
    } catch (err) {
      setHoras([]);
      setError(err?.response?.data?.message || "Error al cargar las horas de la empresa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoras();
  }, [fetchHoras]);

  const registrosDetallados = useMemo(() => {
    return horas.map((r) => ({
      ...r,
      horas: Number(r.horas || 0)
    }));
  }, [horas]);

  // Extraer listas únicas para los filtros desplegables
  const empleadosUnicos = useMemo(() => {
    const nombres = registrosDetallados.map(r => r.usuario_nombre || r.empleado_nombre || r.empleado || "Desconocido");
    return [...new Set(nombres)].filter(Boolean).sort();
  }, [registrosDetallados]);

  const proyectosUnicos = useMemo(() => {
    const nombres = registrosDetallados.map(r => r.proyecto_nombre || r.proyecto || "Sin proyecto");
    return [...new Set(nombres)].filter(Boolean).sort();
  }, [registrosDetallados]);

  // Aplicar filtros
  const registrosFiltrados = useMemo(() => {
    return registrosDetallados.filter((r) => {
      const nombreEmp = r.usuario_nombre || r.empleado_nombre || r.empleado || "Desconocido";
      const nombreProy = r.proyecto_nombre || r.proyecto || "Sin proyecto";
      
      const matchEmpleado = !filterEmpleado || nombreEmp === filterEmpleado;
      const matchProyecto = !filterProyecto || nombreProy === filterProyecto;
      
      return matchEmpleado && matchProyecto;
    });
  }, [registrosDetallados, filterEmpleado, filterProyecto]);

  const totalHoras = useMemo(
    () => registrosFiltrados.reduce((acc, item) => acc + item.horas, 0),
    [registrosFiltrados]
  );

  const columns = [
    {
      header: "Fecha",
      cellClassName: "small text-muted",
      render: (r) => r.fecha ? new Date(r.fecha).toLocaleDateString() : "-",
    },
    {
      header: "Empleado",
      render: (r) => (
        <span className="fw-semibold" style={{ color: "var(--text-main)" }}>
          {r.usuario_nombre || r.empleado_nombre || r.empleado || "-"}
        </span>
      ),
    },
    {
      header: "Proyecto",
      render: (r) => (
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-kanban text-muted" style={{ fontSize: 13 }}></i>
          <span>{r.proyecto_nombre || r.proyecto || "-"}</span>
        </div>
      ),
    },
    {
      header: "Fase",
      render: (r) => (
        <span className="badge rounded-pill" style={{ background: "rgba(6,182,212,.12)", color: "var(--accent)" }}>
          {r.fase_nombre || r.fase || "-"}
        </span>
      ),
    },
    {
      header: "Descripción",
      cellClassName: "text-muted small",
      cellStyle: { maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      render: (r) => r.descripcion || <span className="text-light-muted italic">Sin descripción</span>,
    },
    {
      header: "Horas",
      render: (r) => (
        <span className="fw-bold" style={{ color: "var(--primary)" }}>
          {r.horas.toFixed(1)}h
        </span>
      ),
    },
  ];

  const filters = (
    <div className="d-flex flex-wrap gap-3">
      <select className="form-select" style={{ maxWidth: 220 }} value={filterEmpleado} onChange={(e) => setFilterEmpleado(e.target.value)}>
        <option value="">- Todos los empleados -</option>
        {empleadosUnicos.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
      </select>
      <select className="form-select" style={{ maxWidth: 220 }} value={filterProyecto} onChange={(e) => setFilterProyecto(e.target.value)}>
        <option value="">- Todos los proyectos -</option>
        {proyectosUnicos.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Registro General de Horas</h2>
            <p className="text-muted small mb-0">Supervisión de tiempos imputados por el equipo</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center small rounded-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}

        <div className="row g-3 mb-3">
          <div className="col-12 col-sm-6">
            <div className="stat-card card-3d animate-fadeInUp">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, background: "rgba(79,70,229,.1)" }}>
                  <i className="bi bi-people-fill" style={{ color: "var(--primary)" }}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Total Registros (Filtro)</p>
                  <h5 className="fw-bold mb-0">{registrosFiltrados.length}</h5>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6">
            <div className="stat-card card-3d animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, background: "rgba(6,182,212,.1)" }}>
                  <i className="bi bi-clock-history" style={{ color: "var(--accent)" }}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Total Horas (Filtro)</p>
                  <h5 className="fw-bold mb-0">{totalHoras.toFixed(1)}h</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={registrosFiltrados}
          loading={loading}
          error=""
          rowKey={(r, i) => r.id_registro ?? r.id ?? i}
          filters={filters}
          emptyIcon="bi-inboxes"
          emptyMessage="No hay registros de horas en el equipo"
          rowClassName="animate-fadeIn"
        />
      </div>
    </Layout>
  );
};

export default HorasEmpresaList;