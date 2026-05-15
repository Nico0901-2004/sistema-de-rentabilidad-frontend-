import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { getProyectoById } from "../../services/proyectoService";
import { getFasesByProyecto } from "../../services/faseService";
import FasesForm from "./FasesForm";

const normalizeFases = (data) => (Array.isArray(data) ? data : []);

const FasesLists = ({ proyectoId: proyectoIdProp, embedded = false, onClose }) => {
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
    if (!proyectoId) return;
    getProyectoById(proyectoId)
      .then((res) => {
        if (res?.success) setProyecto(res.data);
      })
      .catch(() => {});
  }, [proyectoId]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return fases.filter((fase) => fase.nombre.toLowerCase().includes(term));
  }, [fases, search]);

  const totalHoras = fases.reduce((acc, fase) => acc + Number(fase.horas_estimadas || 0), 0);

  const handleSaved = () => {
    setShowForm(false);
    setEditingId(null);
    fetchFases();
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

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
          { label: "Total fases", value: fases.length, icon: "bi-layers-fill", color: "var(--primary)", bg: "rgba(79,70,229,.1)" },
          { label: "Horas estimadas", value: `${totalHoras.toFixed(1)}h`, icon: "bi-clock-fill", color: "var(--accent)", bg: "rgba(6,182,212,.1)" },
          { label: "Activas", value: fases.filter((fase) => fase.is_active).length, icon: "bi-check-circle-fill", color: "var(--success)", bg: "rgba(16,185,129,.1)" },
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

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
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

      {error && (
        <div className="alert alert-danger d-flex align-items-center small rounded-3">
          <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
        </div>
      )}

      <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
        <div className="table-responsive">
          <table className="table table-modern mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Fase</th>
                <th>Horas estimadas</th>
                {canManage && <th className="text-end">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: canManage ? 4 : 3 }).map((_, j) => (
                      <td key={j}><div className="skeleton rounded" style={{ height: 20, width: "80%" }}></div></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((fase) => (
                  <tr key={fase.id_fase} className="animate-fadeIn">
                    <td className="text-muted fw-bold">#{fase.id_fase}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, background: "rgba(79,70,229,.1)", flexShrink: 0 }}>
                          <i className="bi bi-layers" style={{ color: "var(--primary)", fontSize: 14 }}></i>
                        </div>
                        <span className="fw-semibold">{fase.nombre}</span>
                      </div>
                    </td>
                    <td className="text-muted small">
                      {Number(fase.horas_estimadas || 0).toFixed(1)}h
                    </td>
                    {canManage && (
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-sm btn-success" title="Editar" onClick={() => handleEdit(fase.id_fase)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-sm btn-danger" title="El backend aún no expone eliminación de fases" disabled>
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 4 : 3}>
                    <div className="empty-state">
                      <i className="bi bi-layers"></i>
                      <h6>Sin fases</h6>
                      <p>{canManage ? "Crea la primera fase del proyecto con el botón de arriba." : "Este proyecto aún no tiene fases registradas."}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return <Layout>{content}</Layout>;
};

export default FasesLists;
