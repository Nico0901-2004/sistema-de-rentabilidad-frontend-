import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useAuth } from "../../context/AuthContext";
import { getProyectoById } from "../../services/proyectoService";
import { desactivarNota, getNotasByProyecto } from "../../services/notaService";
import NotasForm from "./NotasForm";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const NotasLists = ({ proyectoId: proyectoIdProp, embedded = false, onClose }) => {
  const params = useParams();
  const { user } = useAuth();
  const proyectoId = proyectoIdProp || params.proyectoId || params.id;
  const canManage = user?.rol === "lider";

  const [proyecto, setProyecto] = useState(null);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingNota, setEditingNota] = useState(null);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [confirm, setConfirm] = useState(null);
  const canCreate = canManage && (!proyecto || Number(proyecto.id_lider) === Number(user?.id_usuario));

  const fetchNotas = useCallback(async () => {
    if (!proyectoId) {
      setLoading(false);
      setError("Selecciona un proyecto para ver sus notas.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await getNotasByProyecto(proyectoId);
      if (response?.success) setNotas(Array.isArray(response.data) ? response.data : []);
      else setError(response?.message || "No se pudieron cargar las notas.");
    } catch (err) {
      setError(err.response?.data?.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  useEffect(() => {
    if (!proyectoId) return;
    getProyectoById(proyectoId)
      .then((res) => {
        if (res?.success) setProyecto(res.data);
      })
      .catch(() => {});
  }, [proyectoId]);

  const filtered = useMemo(() => {
    const desde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
    const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null;

    return [...notas]
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
      .filter((nota) => {
        if (!nota.fecha) return !desde && !hasta;
        const fechaNota = new Date(nota.fecha);
        if (Number.isNaN(fechaNota.getTime())) return false;
        if (desde && fechaNota < desde) return false;
        if (hasta && fechaNota > hasta) return false;
        return true;
      });
  }, [notas, fechaDesde, fechaHasta]);

  const handleSaved = () => {
    setShowForm(false);
    setEditingNota(null);
    fetchNotas();
  };

  const handleDelete = async (nota) => {
    if (!nota) return;

    try {
      await desactivarNota(nota.id_nota);
      await fetchNotas();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo eliminar la nota.");
    } finally {
      setConfirm(null);
    }
  };

  const columns = [
    { header: "#", accessor: "id_nota", cellClassName: "text-muted fw-bold", render: (nota) => `#${nota.id_nota}` },
    {
      header: "Nota",
      cellStyle: { minWidth: 280 },
      render: (nota) => (
        <div className="d-flex align-items-start gap-2">
          <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 32, height: 32, background: "rgba(79,70,229,.1)" }}>
            <i className="bi bi-journal-text" style={{ color: "var(--primary)", fontSize: 14 }}></i>
          </div>
          <span className="text-muted small" style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {nota.descripcion}
          </span>
        </div>
      ),
    },
    { header: "Líder", accessor: "nombre_lider", cellClassName: "text-muted small", render: (nota) => nota.nombre_lider || "-" },
    { header: "Fecha", accessor: "fecha", cellClassName: "text-muted small", render: (nota) => formatDate(nota.fecha) },
  ];

  const filters = (
    <div className="d-flex align-items-end flex-wrap gap-3">
      <div>
        <label className="form-label fw-semibold small mb-1">Desde</label>
        <input
          type="date"
          className="form-control"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
        />
      </div>
      <div>
        <label className="form-label fw-semibold small mb-1">Hasta</label>
        <input
          type="date"
          className="form-control"
          value={fechaHasta}
          min={fechaDesde || undefined}
          onChange={(e) => setFechaHasta(e.target.value)}
        />
      </div>
      {(fechaDesde || fechaHasta) && (
        <button
          type="button"
          className="btn btn-light fw-semibold"
          onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
        >
          Limpiar filtro
        </button>
      )}
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
            <h2 className="fw-bold mb-0">Notas del proyecto</h2>
          </div>
          <p className="text-muted small mb-0">
            {proyecto?.nombre ? `Seguimiento y observaciones de ${proyecto.nombre}` : "Seguimiento y observaciones del proyecto"}
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          {embedded && onClose && (
            <button className="btn btn-light d-flex align-items-center gap-2 px-3" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
              Cerrar
            </button>
          )}
          {canCreate && (
            <button
              className="btn btn-primary d-flex align-items-center gap-2 px-4"
              onClick={() => { setEditingNota(null); setShowForm(true); }}
              disabled={!proyectoId}
            >
              <i className="bi bi-plus-circle-fill"></i>
              Nueva Nota
            </button>
          )}
        </div>
      </div>

      <div className="row g-3 mb-4 stagger">
        {[
          { label: "Total notas", value: notas.length, icon: "bi-journal-text", color: "var(--primary)", bg: "rgba(79,70,229,.1)" },
          { label: "Registradas por", value: new Set(notas.map((nota) => nota.id_lider)).size, icon: "bi-person-lines-fill", color: "var(--accent)", bg: "rgba(6,182,212,.1)" },
          { label: "Activas", value: notas.filter((nota) => nota.is_active).length, icon: "bi-check-circle-fill", color: "var(--success)", bg: "rgba(16,185,129,.1)" },
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
        <NotasForm
          nota={editingNota}
          proyectoId={proyectoId}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingNota(null); }}
        />
      )}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={error}
        rowKey="id_nota"
        filters={filters}
        emptyIcon="bi-journal-text"
        emptyMessage="Sin notas"
        renderActions={canManage ? (nota) => (
          Number(nota.id_lider) === Number(user?.id_usuario) ? (
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-sm btn-success"
                title="Editar"
                onClick={() => { setEditingNota(nota); setShowForm(true); }}
              >
                <i className="bi bi-pencil-square"></i>
              </button>
              <button className="btn btn-sm btn-danger" title="Eliminar" onClick={() => setConfirm(nota)}>
                <i className="bi bi-trash-fill"></i>
              </button>
            </div>
          ) : null
        ) : undefined}
      />

      {confirm && (
        <ConfirmModal
          danger
          title="Eliminar nota"
          message="¿Deseas eliminar esta nota? Se ocultará del proyecto."
          confirmLabel={<><i className="bi bi-trash-fill me-2"></i>Eliminar</>}
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );

  if (embedded) return content;

  return <Layout>{content}</Layout>;
};

export default NotasLists;
