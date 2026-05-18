import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import AdminOwnerForm from "./AdminOwnerForm";
import DataTable from "../../components/ui/DataTable";
import { getUsuarios, updateUsuario } from "../../services/usuarioService";
import { notifySuccess, notifyError } from "../../utils/notify";

const AdminUsuarioList = () => {
  const [owners, setOwners]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [showForm, setShowForm]       = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [search, setSearch]           = useState("");

  const fetchOwners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getUsuarios();
      if (res?.success) setOwners(res.data);
      else setError("No se pudo cargar la lista.");
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const handleSaved = () => {
    setShowForm(false);
    setEditingOwner(null);
    fetchOwners();
  };

  const handleEdit = (owner) => {
    setEditingOwner(owner);
    setShowForm(true);
  };

  // 🔁 AHORA ESTE MÉTODO REEMPLAZA AL DELETE (DESACTIVA)
  const handleDelete = async (owner) => {
    if (!window.confirm(`¿Eliminar al propietario "${owner.nombre}"?`)) return;

    try {
      await updateUsuario(owner.id_usuario, { is_active: false });
      notifySuccess("Propietario eliminado correctamente");
      fetchOwners();
    } catch (err) {
      notifyError(err.response?.data?.message || "Error al eliminar el propietario.");
    }
  };

  const filtered = owners.filter((o) =>
    o.nombre.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase()) ||
    (o.empresa_nombre || "").toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: "#", accessor: "id_usuario", cellClassName: "fw-bold text-muted", render: (o) => `#${o.id_usuario}` },
    {
      header: "Propietario",
      render: (o) => (
        <div className="d-flex align-items-center gap-2">
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
            {o.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <span className="fw-semibold">{o.nombre}</span>
        </div>
      ),
    },
    { header: "Correo", accessor: "email", cellClassName: "text-muted" },
    {
      header: "Empresa",
      render: (o) => o.empresa_nombre
        ? <span className="badge badge-role badge-propietario">{o.empresa_nombre}</span>
        : <span className="text-muted small">Sin empresa</span>,
    },
  ];

  const filters = (
    <div className="input-group" style={{ maxWidth: 360 }}>
      <span className="input-group-text bg-white border-end-0">
        <i className="bi bi-search text-muted"></i>
      </span>
      <input
        type="text"
        className="form-control border-start-0 ps-0"
        placeholder="Buscar por nombre, email o empresa..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        {/* Header */}
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Gestión de Propietarios</h2>
            <p className="text-muted small mb-0">
              {owners.length} propietario{owners.length !== 1 ? "s" : ""} registrados en el sistema
            </p>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2 px-4"
            onClick={() => { setEditingOwner(null); setShowForm(true); }}
          >
            <i className="bi bi-person-plus-fill"></i>
            Nuevo Propietario
          </button>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4 stagger">
          {[
            { label: "Total propietarios", value: owners.length, icon: "bi-people-fill", color: "var(--primary)", bg: "rgba(79,70,229,.1)" },
            // TEMP: oculto para no mostrar estado en frontend
            // { label: "Activos", value: owners.filter(o => o.is_active).length, icon: "bi-check-circle-fill", color: "var(--success)", bg: "rgba(16,185,129,.1)" },
            // { label: "Inactivos", value: owners.filter(o => !o.is_active).length, icon: "bi-x-circle-fill", color: "var(--danger)", bg: "rgba(239,68,68,.1)" },
          ].map((s, i) => (
            <div className="col-12 col-sm-4" key={i}>
              <div className="stat-card card-3d animate-fadeInUp">
                <div className="stat-card__glow" style={{ background: s.color }}></div>
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 44, height: 44, background: s.bg }}
                  >
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
          rowKey="id_usuario"
          filters={filters}
          emptyIcon="bi-people"
          emptyMessage="Sin propietarios"
          rowClassName="animate-fadeIn"
          renderActions={(o) => (
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-sm btn-success" title="Editar propietario" onClick={() => handleEdit(o)}>
                <i className="bi bi-pencil-square"></i>
              </button>
              <button className="btn btn-sm btn-danger" title="Eliminar propietario" onClick={() => handleDelete(o)}>
                <i className="bi bi-trash-fill"></i>
              </button>
            </div>
          )}
        />
      </div>

      {showForm && (
        <AdminOwnerForm
          owner={editingOwner}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingOwner(null); }}
        />
      )}
    </Layout>
  );
};

export default AdminUsuarioList;
