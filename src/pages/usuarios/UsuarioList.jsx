import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import UsuarioForm from "./UsuarioForm";
import DataTable from "../../components/ui/DataTable";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useAuth } from "../../context/AuthContext";
import { getUsuarios, deleteUsuario } from "../../services/usuarioService";
import { notifySuccess, notifyError } from "../../utils/notify";

const ROL_BADGE = { lider: "badge-lider", empleado: "badge-empleado" };
const ROL_LABEL = { lider: "Líder", empleado: "Empleado" };

const UsuarioList = () => {
  const { user } = useAuth();
  const rol = user?.rol;
  const isLider = rol === "lider";

  const [usuarios, setUsuarios]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [showForm, setShowForm]           = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [search, setSearch]               = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUsuarios();
      if (response.success) setUsuarios((response.data || []).filter((u) => u?.is_active !== false));
      else setError("No se pudo cargar la lista de usuarios.");
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const handleSaved = () => { setShowForm(false); setEditingUsuario(null); fetchUsuarios(); };

  const handleEdit = (u) => { setEditingUsuario(u); setShowForm(true); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteUsuario(confirmDelete.id_usuario);
      setUsuarios((prev) => prev.filter((x) => x.id_usuario !== confirmDelete.id_usuario));
      notifySuccess("Usuario eliminado correctamente");
    } catch (err) {
      notifyError(err.response?.data?.message || "Error al eliminar el usuario.");
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = usuarios.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const lideres   = usuarios.filter((u) => u.rol === "lider").length;
  const empleados = usuarios.filter((u) => u.rol === "empleado").length;

  const title    = isLider ? "Equipo de mi Empresa" : "Gestión de Usuarios";
  const subtitle = isLider
    ? "Lista de colaboradores de tu empresa (solo lectura)"
    : "Administra los miembros de tu empresa";

  const columns = [
    { header: "#", accessor: "id_usuario", cellClassName: "text-muted fw-bold", render: (u) => `#${u.id_usuario}` },
    {
      header: "Colaborador",
      render: (u) => (
        <div className="d-flex align-items-center gap-2">
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
            {u.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <span className="fw-semibold">{u.nombre}</span>
        </div>
      ),
    },
    { header: "Correo", accessor: "email", cellClassName: "text-muted" },
    {
      header: "Rol",
      render: (u) => (
        <span className={`badge badge-role usuarios-rol-badge ${ROL_BADGE[u.rol] || "badge-owner"}`}>
          {ROL_LABEL[u.rol] || u.rol}
        </span>
      ),
    },
  ];

  const filters = (
    <div className="input-group" style={{ maxWidth: 360 }}>
      <span className="input-group-text bg-white border-end-0">
        <i className="bi bi-search text-muted"></i>
      </span>
      <input type="text" className="form-control border-start-0 ps-0"
        placeholder="Buscar por nombre o email..."
        value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        {/* Header */}
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">{title}</h2>
            <p className="text-muted small mb-0">{subtitle}</p>
          </div>
          {!isLider && (
            <button className="btn btn-primary d-flex align-items-center gap-2 px-4"
              onClick={() => { setEditingUsuario(null); setShowForm(true); }}>
              <i className="bi bi-person-plus-fill"></i>
              Nuevo Usuario
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4 stagger">
          {isLider ? (
            [
              { label: "Colaboradores", value: usuarios.length, icon: "bi-people-fill",  color: "var(--primary)", bg: "rgba(79,70,229,.1)" },
              { label: "Líderes",       value: lideres,          icon: "bi-star-fill",     color: "var(--warning)", bg: "rgba(245,158,11,.1)" },
              { label: "Empleados",     value: empleados,         icon: "bi-person-fill",   color: "var(--success)", bg: "rgba(16,185,129,.1)" },
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
            ))
          ) : (
            [
              { label: "Total colaboradores", value: usuarios.length, icon: "bi-people-fill",  color: "var(--primary)", bg: "rgba(79,70,229,.1)" },
              { label: "Líderes",             value: lideres,         icon: "bi-star-fill",     color: "var(--warning)", bg: "rgba(245,158,11,.1)" },
              { label: "Empleados",           value: empleados,       icon: "bi-person-fill",   color: "var(--success)", bg: "rgba(16,185,129,.1)" },
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
            ))
          )}
        </div>

        {/* Form inline */}
        {showForm && !isLider && (
          <UsuarioForm
            usuario={editingUsuario}
            onCreated={handleSaved}
            onCancel={() => { setShowForm(false); setEditingUsuario(null); }}
          />
        )}

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          error={error}
          rowKey="id_usuario"
          filters={filters}
          emptyIcon="bi-people"
          emptyMessage={isLider ? "Sin empleados" : "Sin usuarios"}
          renderActions={!isLider ? (u) => (
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-sm btn-success" title="Editar" onClick={() => handleEdit(u)}>
                <i className="bi bi-pencil-square"></i>
              </button>
              <button className="btn btn-sm btn-danger" title="Eliminar" onClick={() => setConfirmDelete(u)}>
                <i className="bi bi-trash-fill"></i>
              </button>
            </div>
          ) : undefined}
        />
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Eliminar usuario"
          message="¿Seguro que quieres eliminar este usuario?"
          confirmLabel={<><i className="bi bi-trash-fill me-2"></i>Eliminar</>}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Layout>
  );
};

export default UsuarioList;
