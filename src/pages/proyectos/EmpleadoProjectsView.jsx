import React, { useCallback, useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import HorasForm from "../horas/HorasForm";
import EmpleadoProyectoDetailModal from "./EmpleadoProyectoDetailModal";
import { getFasesByProyecto } from "../../services/faseService";
import { getHoras } from "../../services/horasService";
import { getMisProyectos } from "../../services/proyectoService";
import { getFaseId, getFaseNombre, getTotalHorasEstimadas, normalizeProyectoFases } from "./projectUtils";

const EmpleadoProjectsView = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [horasProyecto, setHorasProyecto] = useState(null);
  const [search, setSearch] = useState("");
  const [faseFilter, setFaseFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [horasByProyecto, setHorasByProyecto] = useState({});
  const [fasesByProyecto, setFasesByProyecto] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    let proyectoList = [];

    try {
      const proyectosRes = await getMisProyectos();
      if (proyectosRes?.success) {
        proyectoList = proyectosRes.data || [];
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

      horasData.forEach((registro) => {
        const proyectoId = Number(registro.id_proyecto);
        if (!proyectoId) return;

        horasMap[proyectoId] = Number(horasMap[proyectoId] || 0) + Number(registro.horas || 0);
      });

      setHorasByProyecto(horasMap);
    } catch {
      // Si falla horas, no bloqueamos la vista de proyectos.
      setHorasByProyecto({});
    }

    try {
      const fasesEntries = await Promise.all(
        proyectoList.map(async (proyecto) => {
          try {
            const fases = await getFasesByProyecto(proyecto.id_proyecto);
            return [proyecto.id_proyecto, normalizeProyectoFases(fases)];
          } catch {
            return [proyecto.id_proyecto, []];
          }
        })
      );

      setFasesByProyecto(Object.fromEntries(fasesEntries));
    } catch {
      setFasesByProyecto({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const proyectosConResumen = proyectos.map((p) => {
    const fases = fasesByProyecto[p.id_proyecto] || [];
    return {
      ...p,
      horas_registradas: Number(horasByProyecto[p.id_proyecto] || 0),
      fases,
    };
  });

  const fasesDisponibles = Array.from(
    proyectosConResumen
      .flatMap((p) => p.fases || [])
      .reduce((map, fase) => {
        const key = String(getFaseId(fase) ?? getFaseNombre(fase));
        if (!map.has(key)) map.set(key, getFaseNombre(fase));
        return map;
      }, new Map())
      .entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filtered = proyectosConResumen.filter((p) => {
    const text = search.trim().toLowerCase();
    const matchText = !text ||
      p.nombre?.toLowerCase().includes(text) ||
      (p.descripcion || "").toLowerCase().includes(text);
    const matchFase = !faseFilter || (p.fases || []).some((fase) =>
      String(getFaseId(fase) ?? getFaseNombre(fase)) === faseFilter
    );
    return matchText && matchFase;
  });

  const columns = [
    {
      header: "Proyecto",
      cellClassName: "fw-semibold",
      render: (p) => (
        <>
          <div>{p.nombre}</div>
          {p.servicio_nombre && <small className="text-muted">{p.servicio_nombre}</small>}
        </>
      ),
    },
    {
      header: "Fases",
      cellClassName: "text-muted small",
      render: (p) => (
        <>
          {p.fases?.length ? p.fases.map(getFaseNombre).join(", ") : "—"}
          {getTotalHorasEstimadas(p.fases) > 0 && (
            <small className="d-block text-muted">
              {getTotalHorasEstimadas(p.fases).toFixed(1)}h estimadas
            </small>
          )}
        </>
      ),
    },
    {
      header: "Horas registradas",
      render: (p) => (
        <span className="fw-bold" style={{ color: "var(--primary)" }}>
          {Number(p.horas_registradas || 0).toFixed(1)}h
        </span>
      ),
    },
    {
      header: "Fechas",
      cellClassName: "text-muted small",
      render: (p) => (
        <>
          {p.fecha_inicio ? `Inicio: ${p.fecha_inicio.slice(0, 10)}` : "Inicio: —"}
          <br />
          {p.fecha_fin_estimada ? `Fin est.: ${p.fecha_fin_estimada.slice(0, 10)}` : "Fin est.: —"}
        </>
      ),
    },
  ];

  const filters = (
    <div className="row g-2">
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
          {fasesDisponibles.map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Mis proyectos asignados</h2>
            <p className="text-muted small mb-0">Proyectos a los que has sido asignado</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={loading || proyectos.length === 0 ? proyectosConResumen : filtered}
          loading={loading}
          error={error}
          rowKey="id_proyecto"
          filters={filters}
          emptyIcon={proyectos.length === 0 ? "bi-kanban" : "bi-search"}
          emptyMessage={proyectos.length === 0 ? "Sin proyectos asignados" : "Sin resultados"}
          onRowClick={setSelected}
          rowClassName="animate-fadeIn"
          rowStyle={{ cursor: "pointer" }}
          renderActions={(p) => (
            <button
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-2"
              onClick={() => setHorasProyecto(p)}
            >
              <i className="bi bi-clock-history"></i>
              Registrar horas
            </button>
          )}
        />

      </div>

      {horasProyecto !== null && (
        <HorasForm
          proyectoPreseleccionado={horasProyecto}
          fasesPreseleccionadas={horasProyecto?.fases || []}
          onSaved={() => {
            setHorasProyecto(null);
            fetchData();
          }}
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


export default EmpleadoProjectsView;
