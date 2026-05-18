import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import { getHorasByLider } from "../../services/horasService";

const HorasList = () => {
  const [horas, setHoras]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [filterProyecto, setFilterProyecto] = useState("");

  const fetchHoras = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getHorasByLider();
      if (res.success) setHoras(res.data);
      else setError("No se pudo cargar el reporte.");
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHoras(); }, [fetchHoras]);

  const proyectosUnicos = [...new Map(horas.map((h) => [h.id_proyecto, h.proyecto_nombre])).entries()];

  const filtered = horas.filter((h) => {
    const matchSearch =
      h.empleado_nombre.toLowerCase().includes(search.toLowerCase()) ||
      h.proyecto_nombre.toLowerCase().includes(search.toLowerCase()) ||
      (h.descripcion || "").toLowerCase().includes(search.toLowerCase());
    const matchProyecto = !filterProyecto || String(h.id_proyecto) === filterProyecto;
    return matchSearch && matchProyecto;
  });

  const totalHoras = filtered.reduce((acc, h) => acc + Number(h.horas || 0), 0);

  const columns = [
    { header: "#", accessor: "id_registro", cellClassName: "text-muted fw-bold", render: (h) => `#${h.id_registro}` },
    {
      header: "Empleado",
      render: (h) => (
        <div className="d-flex align-items-center gap-2">
          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
            {h.empleado_nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <span className="fw-semibold small">{h.empleado_nombre}</span>
        </div>
      ),
    },
    {
      header: "Proyecto",
      render: (h) => <span className="badge badge-role badge-lider small">{h.proyecto_nombre}</span>,
    },
    {
      header: "Fecha",
      cellClassName: "text-muted small",
      render: (h) => h.fecha ? new Date(h.fecha).toLocaleDateString("es-AR") : "—",
    },
    {
      header: "Horas",
      render: (h) => (
        <span className="fw-bold" style={{ color: "var(--primary)" }}>
          {Number(h.horas).toFixed(1)}h
        </span>
      ),
    },
    {
      header: "Descripción",
      cellClassName: "text-muted small",
      cellStyle: { maxWidth: 250 },
      render: (h) => <span className="text-truncate d-block">{h.descripcion || "—"}</span>,
    },
  ];

  const filters = (
    <div className="d-flex flex-wrap gap-3">
      <div className="input-group" style={{ maxWidth: 300 }}>
        <span className="input-group-text bg-white border-end-0">
          <i className="bi bi-search text-muted"></i>
        </span>
        <input type="text" className="form-control border-start-0 ps-0"
          placeholder="Buscar empleado, proyecto..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <select
        className="form-select"
        style={{ maxWidth: 220 }}
        value={filterProyecto}
        onChange={(e) => setFilterProyecto(e.target.value)}
      >
        <option value="">— Todos los proyectos —</option>
        {proyectosUnicos.map(([id, nombre]) => (
          <option key={id} value={String(id)}>{nombre}</option>
        ))}
      </select>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        {/* Header */}
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Reporte de Horas</h2>
            <p className="text-muted small mb-0">Horas registradas por los empleados en tus proyectos</p>
          </div>
          <div
            className="d-flex align-items-center gap-2 rounded-3 px-3 py-2"
            style={{ background: "rgba(79,70,229,.08)" }}
          >
            <i className="bi bi-clock-fill" style={{ color: "var(--primary)" }}></i>
            <span className="fw-bold" style={{ color: "var(--primary)" }}>{totalHoras.toFixed(1)}h</span>
            <span className="text-muted small">total filtrado</span>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4 stagger">
          {[
            { label: "Total registros", value: horas.length,  icon: "bi-list-check",       color: "var(--primary)", bg: "rgba(79,70,229,.1)" },
            { label: "Total horas",     value: `${horas.reduce((a, h) => a + Number(h.horas || 0), 0).toFixed(1)}h`, icon: "bi-clock-fill", color: "var(--accent)", bg: "rgba(6,182,212,.1)" },
            { label: "Proyectos",       value: proyectosUnicos.length, icon: "bi-kanban-fill", color: "var(--success)", bg: "rgba(16,185,129,.1)" },
          ].map((s, i) => (
            <div className="col-12 col-sm-4" key={i}>
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

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          error={error}
          rowKey="id_registro"
          filters={filters}
          emptyIcon="bi-clock-history"
          emptyMessage="Sin registros de horas"
          skeletonRows={5}
        />
      </div>
    </Layout>
  );
};

export default HorasList;
