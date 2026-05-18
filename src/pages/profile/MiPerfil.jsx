import React, { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { getEmpresaById } from "../../services/empresaService";
import { updateUsuario } from "../../services/usuarioService";

const ROL_CONFIG = {
  admin:       { label: "Administrador", color: "#DC2626", bg: "rgba(239,68,68,.1)",   icon: "bi-shield-fill" },
  propietario: { label: "Propietario",   color: "#4F46E5", bg: "rgba(79,70,229,.1)",   icon: "bi-briefcase-fill" },
  lider:       { label: "Líder",         color: "#D97706", bg: "rgba(245,158,11,.1)",  icon: "bi-star-fill" },
  empleado:    { label: "Empleado",      color: "#059669", bg: "rgba(16,185,129,.1)",  icon: "bi-person-fill" },
};

const MiPerfil = () => {
  const { user, updateUser } = useAuth();
  const [empresa, setEmpresa] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ nombre: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.rol === "admin";

  useEffect(() => {
    if (!user?.id_empresa) return;
    getEmpresaById(user.id_empresa)
      .then((r) => { if (r?.success) setEmpresa(r.data); })
      .catch(() => {});
  }, [user?.id_empresa]);

  const startEdit = () => {
    setForm({ nombre: user?.nombre || "", email: user?.email || "", password: "" });
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { nombre: form.nombre, email: form.email };
      if (form.password) payload.password = form.password;
      const res = await updateUsuario(user.id_usuario, payload);
      if (res?.success) {
        setSuccess("Perfil actualizado correctamente.");
        updateUser({ nombre: form.nombre, email: form.email });
        setEditing(false);
      } else {
        setError(res?.message || "Error al actualizar.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const rc = ROL_CONFIG[user?.rol] || ROL_CONFIG.empleado;
  const initiales = user?.nombre
    ? user.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header">
          <h2 className="fw-bold mb-1">Mi Perfil</h2>
          <p className="text-muted small mb-0">Información de tu cuenta en el sistema</p>
        </div>

        {success && (
          <div className="alert alert-success d-flex align-items-center small rounded-3 mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>{success}
          </div>
        )}

        <div className="row g-4">
          {/* Avatar card */}
          <div className="col-12 col-md-4">
            <div className="card border-0 rounded-4 overflow-hidden text-center" style={{ boxShadow: "var(--shadow-md)" }}>
              <div style={{ height: 80, background: "linear-gradient(135deg,#0F0C29,#302B63,#24243e)" }}></div>
              <div className="card-body px-4 pb-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
                  style={{
                    width: 80, height: 80, marginTop: -40,
                    background: "linear-gradient(135deg,var(--primary),var(--accent))",
                    border: "4px solid #fff",
                    boxShadow: "0 8px 24px rgba(79,70,229,.4)",
                    fontSize: 28, fontWeight: 800, color: "#fff",
                  }}
                >
                  {initiales}
                </div>
                <h5 className="fw-bold mt-3 mb-1">{user?.nombre || "—"}</h5>
                <p className="text-muted small mb-3">{user?.email}</p>
                <div
                  className="d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2"
                  style={{ background: rc.bg }}
                >
                  <i className={`bi ${rc.icon}`} style={{ color: rc.color }}></i>
                  <span className="fw-semibold small" style={{ color: rc.color }}>{rc.label}</span>
                </div>

                {isAdmin && !editing && (
                  <div className="mt-3">
                    <button className="btn btn-primary btn-sm w-100" onClick={startEdit}>
                      <i className="bi bi-pencil-fill me-2"></i>Editar perfil
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detalles / Formulario */}
          <div className="col-12 col-md-8">
            {editing && isAdmin ? (
              <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg,var(--primary),var(--accent))" }}></div>
                <div className="card-body p-4">
                  <h6 className="fw-bold text-muted text-uppercase small mb-4" style={{ letterSpacing: ".08em" }}>
                    Editar datos
                  </h6>
                  {error && (
                    <div className="alert alert-danger d-flex align-items-center py-2 small rounded-3 mb-3">
                      <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
                    </div>
                  )}
                  <form onSubmit={handleSave}>
                    <div className="row g-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label fw-semibold small">Nombre completo</label>
                        <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                          className="form-control" required />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label fw-semibold small">Correo electrónico</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange}
                          className="form-control" required />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold small">
                          Nueva contraseña <span className="text-muted fw-normal">(vacío = sin cambios)</span>
                        </label>
                        <div className="input-group">
                          <input
                            type={showPass ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Nueva contraseña (opcional)"
                            minLength={form.password ? 8 : undefined}
                          />
                          <button className="btn btn-outline-secondary" type="button"
                            onClick={() => setShowPass(!showPass)}>
                            <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-4">
                      <button type="button" className="btn btn-light fw-semibold px-4"
                        onClick={() => setEditing(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary flex-fill" disabled={saving}>
                        {saving
                          ? <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
                          : <><i className="bi bi-check-lg me-2"></i>Guardar cambios</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg,var(--primary),var(--accent))" }}></div>
                <div className="card-body p-4">
                  <h6 className="fw-bold text-muted text-uppercase small mb-4" style={{ letterSpacing: ".08em" }}>
                    Datos de la cuenta
                  </h6>
                  <div className="row g-3">
                    {[
                      { label: "Nombre completo",    value: user?.nombre,          icon: "bi-person" },
                      { label: "Correo electrónico", value: user?.email,           icon: "bi-envelope" },
                      { label: "Rol en el sistema",  value: rc.label,              icon: rc.icon },
                      { label: "ID de usuario",      value: `#${user?.id_usuario}`, icon: "bi-hash" },
                    ].map((f, i) => (
                      <div className="col-12 col-sm-6" key={i}>
                        <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
                          <i className={`bi ${f.icon}`}></i> {f.label}
                        </label>
                        <div
                          className="rounded-3 px-3 py-2 fw-medium"
                          style={{ background: "rgba(79,70,229,.04)", border: "1px solid rgba(79,70,229,.08)", fontSize: 14 }}
                        >
                          {f.value || "—"}
                        </div>
                      </div>
                    ))}
                    {empresa && (
                      <div className="col-12">
                        <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
                          <i className="bi bi-building"></i> Empresa
                        </label>
                        <div
                          className="rounded-3 px-3 py-2 d-flex align-items-center gap-2"
                          style={{ background: "rgba(79,70,229,.04)", border: "1px solid rgba(79,70,229,.08)" }}
                        >
                          <i className="bi bi-building-fill" style={{ color: "var(--primary)" }}></i>
                          <span className="fw-semibold" style={{ fontSize: 14 }}>{empresa.nombre}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isAdmin && (
                    <div
                      className="alert border-0 rounded-3 small d-flex align-items-start mt-4 mb-0"
                      style={{ background: "rgba(79,70,229,.06)", color: "var(--primary)" }}
                    >
                      <i className="bi bi-info-circle-fill me-2 mt-1 flex-shrink-0"></i>
                      Para cambiar tu contraseña o datos personales, contacta al administrador del sistema.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MiPerfil;
