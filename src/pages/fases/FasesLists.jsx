import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import { useAuth } from "../../context/AuthContext";
import { getProyectoById } from "../../services/proyectoService";
import { getFasesByProyecto } from "../../services/faseService";
import FasesForm from "./FasesForm";

const normalizeFases = (data) =>
  (Array.isArray(data) ? data : []).map((fase) => ({
    ...fase,
    horas_estimadas: Number(fase.horas_estimadas ?? 0),
    horas_trabajadas: Number(fase.horas_trabajadas ?? fase.horas_registradas ?? 0),
  }));
const getHorasFaseId = (registro) => registro.id_fase ?? registro.fase_id ?? null;
const getHorasFaseNombre = (registro) => registro.fase_nombre ?? registro.nombre_fase ?? registro.fase ?? "";

const FasesLists = ({ proyectoId: proyectoIdProp, embedded = false, onClose, onChanged, horasResumen = [] }) => {
  const params = useParams();
  const { user } = useAuth();
  const proyectoId = proyectoIdProp || params.proyectoId || params.id;
  const canManage = user?.rol === "propietario";

  const [proyecto, setProyecto] = useState(null);
  const [fases, setFases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState("fecha");

  const fetchFases = useCallback(async () => {
    if (!proyectoId) {
      setLoading(false);
      setError("Selecciona un proyecto para ver sus fases.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await getFasesByProyecto(proyectoId, orderBy);
      if (response?.success) setFases(normalizeFases(response.data));
      else setError(response?.message || "No se pudieron cargar las fases.");
    } catch (err) {
      setError(err.response?.data?.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [proyectoId, orderBy]);

  useEffect(() => {
    fetchFases();
  }, [fetchFases]);

  useEffect(() => {
    setSearch("");
    setOrderBy("fecha");
  }, [proyectoId]);

  useEffect(() => {
    if (!proyectoId) return;
    getProyectoById(proyectoId)
      .then((res) => {
        if (res?.success) setProyecto(res.data);
      })
      .catch(() => {});
  }, [proyectoId]);

  const horasRegistradasByFase = useMemo(() => {
    const map = new Map();

    horasResumen.forEach((registro) => {
      const faseId = getHorasFaseId(registro);
      const faseNombre = getHorasFaseNombre(registro);
      if (!faseId && !faseNombre) return;

      const key = String(faseId ?? faseNombre);
      map.set(key, Number(map.get(key) || 0) + Number(registro.total_horas ?? registro.horas ?? 0));
    });

    return map;
  }, [horasResumen]);
  const fasesConHoras = useMemo(() => {
    const map = new Map();

    fases.forEach((fase) => {
      const key = String(fase.id_fase ?? fase.nombre);
      map.set(key, fase);
    });

    horasResumen.forEach((registro, index) => {
      const faseId = getHorasFaseId(registro);
      const faseNombre = getHorasFaseNombre(registro);
      if (!faseId && !faseNombre) return;

      const key = String(faseId ?? faseNombre);
      if (map.has(key)) return;

      map.set(key, {
        id_fase: faseId ?? `resumen-${index}`,
        nombre: faseNombre || `Fase #${faseId}`,
        horas_estimadas: 0,
        horas_trabajadas: Number(registro.total_horas ?? registro.horas ?? 0),
        fromResumen: true,
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      const aId = Number(a.id_fase);
      const bId = Number(b.id_fase);
      if (Number.isFinite(aId) && Number.isFinite(bId)) return aId - bId;
      return String(a.nombre).localeCompare(String(b.nombre));
    });
  }, [fases, horasResumen]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return fasesConHoras.filter((fase) => fase.nombre.toLowerCase().includes(term));
  }, [fasesConHoras, search]);

  const totalHoras = fasesConHoras.reduce((acc, fase) => acc + Number(fase.horas_estimadas || 0), 0);

  const getHorasRegistradas = (fase) => {
    if (fase.horas_trabajadas !== undefined || fase.horas_registradas !== undefined) {
      return Number(fase.horas_trabajadas ?? fase.horas_registradas ?? 0);
    }

    const byId = fase.id_fase !== undefined && fase.id_fase !== null
      ? horasRegistradasByFase.get(String(fase.id_fase))
      : undefined;

    if (byId !== undefined) return byId;
    const byName = horasRegistradasByFase.get(String(fase.nombre));
    if (byName !== undefined) return byName;
    return 0;
  };
  const totalHorasRegistradas = fasesConHoras.reduce((acc, fase) => acc + Number(getHorasRegistradas(fase) || 0), 0);

  const handleSaved = () => {
    setShowForm(false);
    setEditingId(null);
    fetchFases();
    onChanged?.();
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const columns = [
    { header: "#", accessor: "id_fase", cellClassName: "text-muted fw-bold", render: (fase) => `#${fase.id_fase}` },
    {
      header: "Fase",
      render: (fase) => (
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, background: "rgba(79,70,229,.1)", flexShrink: 0 }}>
            <i className="bi bi-layers" style={{ color: "var(--primary)", fontSize: 14 }}></i>
          </div>
          <span className="fw-semibold">{fase.nombre}</span>
        </div>
      ),
    },
    {
      header: "Horas estimadas",
      cellClassName: "text-muted small",
      render: (fase) => `${Number(fase.horas_estimadas || 0).toFixed(1)}h`,
    },
    {
      header: "Horas registradas",
      cellClassName: "small fw-bold",
      cellStyle: { color: "var(--primary)" },
      render: (fase) => `${Number(getHorasRegistradas(fase) || 0).toFixed(1)}h`,
    },
  ];

  const filters = (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
      <div className="input-group" style={{ maxWidth: 360 }}>
        <span className="input-group-text bg-white border-end-0">
          <i className="bi bi-search text-muted"></i>
        </span>
        <input
          type="text"
          className="form-control border-start-0 ps-0"
          placeholder="Buscar fase..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <select className="form-select" style={{ maxWidth: 180 }} value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
        <option value="fecha">Más recientes</option>
        <option value="nombre">Nombre A-Z</option>
      </select>
    </div>
  );

  const content = (
    <div className="animate-fadeInUp">
      <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            {!embedded && (
              <Link to="/proyectos" className="btn btn-sm btn-light rounded-3" title="Volver a proyectos">
                <i className="bi bi-arrow-left"></i>
              </Link>
            )}
            <h2 className="fw-bold mb-0">Fases del proyecto</h2>
          </div>
          <p className="text-muted small mb-0">
            {proyecto?.nombre ? `Organiza las fases de ${proyecto.nombre}` : "Organiza el trabajo del proyecto por etapas"}
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          {embedded && onClose && (
            <button className="btn btn-light d-flex align-items-center gap-2 px-3" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
              Cerrar
            </button>
          )}
          {canManage && (
            <button
              className="btn btn-primary d-flex align-items-center gap-2 px-4"
              onClick={() => { setEditingId(null); setShowForm(true); }}
              disabled={!proyectoId}
            >
              <i className="bi bi-plus-circle-fill"></i>
              Nueva Fase
            </button>
          )}
        </div>
      </div>

      <div className="row g-3 mb-4 stagger">
        {[
          { label: "Total fases", value: fasesConHoras.length, icon: "bi-layers-fill", color: "var(--primary)", bg: "rgba(79,70,229,.1)" },
          { label: "Horas estimadas", value: `${totalHoras.toFixed(1)}h`, icon: "bi-clock-fill", color: "var(--accent)", bg: "rgba(6,182,212,.1)" },
          { label: "Horas registradas", value: `${totalHorasRegistradas.toFixed(1)}h`, icon: "bi-clock-history", color: "var(--success)", bg: "rgba(16,185,129,.1)" },
        ].map((stat, index) => (
          <div className="col-12 col-sm-4" key={index}>
            <div className="stat-card card-3d animate-fadeInUp">
              <div className="stat-card__glow" style={{ background: stat.color }}></div>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: stat.bg }}>
                  <i className={`bi ${stat.icon}`} style={{ color: stat.color, fontSize: 20 }}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">{stat.label}</p>
                  <h4 className="fw-bold mb-0" style={{ color: stat.color }}>{stat.value}</h4>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <FasesForm
          faseId={editingId}
          proyectoId={proyectoId}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={error}
        rowKey="id_fase"
        filters={filters}
        emptyIcon="bi-layers"
        emptyMessage="Sin fases"
        renderActions={canManage ? (fase) => (
          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-sm btn-success" title="Editar" onClick={() => handleEdit(fase.id_fase)}>
              <i className="bi bi-pencil-square"></i>
            </button>
            <button className="btn btn-sm btn-danger" title="El backend aún no expone eliminación de fases" disabled>
              <i className="bi bi-trash-fill"></i>
            </button>
          </div>
        ) : undefined}
      />
    </div>
  );

  if (embedded) return content;

  return <Layout>{content}</Layout>;
};

export default FasesLists;
