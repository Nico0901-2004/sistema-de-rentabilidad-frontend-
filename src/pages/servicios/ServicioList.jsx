import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import ServicioForm from "./ServicioForm";
import DataTable from "../../components/ui/DataTable";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { getServicios, desactivarServicio } from "../../services/servicioService";
import { notifySuccess, notifyError } from "../../utils/notify";

const ServicioList = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch]       = useState("");
  const [confirm, setConfirm]     = useState(null); // servicio

  const fetchServicios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getServicios();
      if (response.success) setServicios((response.data || []).filter((s) => s?.is_active !== false));
      else setError("No se pudo cargar la lista de servicios.");
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServicios(); }, [fetchServicios]);

  const handleSaved       = () => { setShowForm(false); setEditingId(null); fetchServicios(); };
  const handleEdit        = (id) => { setEditingId(id); setShowForm(true); };

  const handleConfirmAction = async () => {
    if (!confirm) return;
    try {
      await desactivarServicio(confirm.id_servicio);
      setServicios((prev) => prev.filter((x) => x.id_servicio !== confirm.id_servicio));
      notifySuccess("Servicio eliminado correctamente");
    } catch (err) {
      notifyError(err.response?.data?.message || "Error al procesar la acción.");
    } finally {
      setConfirm(null);
    }
  };

  const filtered = servicios.filter((s) =>
    s.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (s.descripcion || "").toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: "#", accessor: "id_servicio", cellClassName: "text-muted fw-bold", render: (s) => `#${s.id_servicio}` },
    {
      header: "Servicio",
      render: (s) => (
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: 32, height: 32, background: "rgba(79,70,229,.1)", flexShrink: 0 }}>
            <i className="bi bi-briefcase" style={{ color: "var(--primary)", fontSize: 14 }}></i>
          </div>
          <span className="fw-semibold">{s.nombre}</span>
        </div>
      ),
    },
    {
      header: "Descripción",
      cellClassName: "text-muted",
      cellStyle: { maxWidth: 200 },
      render: (s) => <span className="text-truncate d-block">{s.descripcion || "—"}</span>,
    },
  ];

  const filters = (
    <div className="input-group" style={{ maxWidth: 360 }}>
      <span className="input-group-text bg-white border-end-0">
        <i className="bi bi-search text-muted"></i>
      </span>
      <input type="text" className="form-control border-start-0 ps-0"
        placeholder="Buscar servicio..."
        value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        {/* Header */}
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Gestión de Servicios</h2>
            <p className="text-muted small mb-0">Administra los servicios de tu empresa</p>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2 px-4"
            onClick={() => { setEditingId(null); setShowForm(true); }}>
            <i className="bi bi-plus-circle-fill"></i>
            Nuevo Servicio
          </button>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4 stagger">
          {[
            { label: "Total servicios", value: servicios.length, icon: "bi-briefcase-fill", color: "var(--primary)", bg: "rgba(79,70,229,.1)" },
            // TEMP: oculto para no mostrar estado en frontend
            // { label: "Activos",         value: activos,          icon: "bi-check-circle-fill", color: "var(--success)", bg: "rgba(16,185,129,.1)" },
            // { label: "Inactivos",       value: servicios.length - activos, icon: "bi-x-circle-fill", color: "var(--danger)", bg: "rgba(239,68,68,.1)" },
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

        {showForm && (
          <ServicioForm
            servicioId={editingId}
            onSaved={handleSaved}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
          />
        )}

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          error={error}
          rowKey="id_servicio"
          filters={filters}
          emptyIcon="bi-briefcase"
          emptyMessage="Sin servicios"
          renderActions={(s) => (
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-sm btn-success" title="Editar" onClick={() => handleEdit(s.id_servicio)}>
                <i className="bi bi-pencil-square"></i>
              </button>
              <button className="btn btn-sm btn-danger" title="Eliminar" onClick={() => setConfirm(s)}>
                <i className="bi bi-trash-fill"></i>
              </button>
            </div>
          )}
        />
      </div>

      {confirm && (
        <ConfirmModal
          danger
          title="Eliminar servicio"
          message="¿Seguro que quieres eliminar este servicio?"
          confirmLabel={<><i className="bi bi-trash-fill me-2"></i>Eliminar</>}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirm(null)}
        />
      )}
    </Layout>
  );
};

export default ServicioList;
