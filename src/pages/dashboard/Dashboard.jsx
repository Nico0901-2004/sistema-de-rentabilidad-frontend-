import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { getServicios } from "../../services/servicioService";
import { getUsuarios } from "../../services/usuarioService";
import { getProyectos, getMisProyectos, getHorasResumenProyecto } from "../../services/proyectoService";

/* ── StatCard ──────────────────────────────────── */
const StatCard = ({ icon, label, value, color, bg, delay = 0, to }) => {
  const inner = (
    <div className="stat-card card-3d animate-fadeInUp" style={{ animationDelay: `${delay}s`, position: "relative", overflow: "hidden", cursor: to ? "pointer" : "default" }}>
      <div className="stat-card__glow" style={{ background: color }}></div>
      <div className="d-flex align-items-center gap-3">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 48, height: 48, background: bg }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: 22 }}></i>
        </div>
        <div>
          <p className="text-muted small mb-0">{label}</p>
          <h3 className="fw-bold mb-0" style={{ color }}>{value}</h3>
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="text-decoration-none d-block">{inner}</Link> : inner;
};

/* ── ProyectoHorasCard (propietario) ──────────── */
const ProyectoHorasCard = ({ proyecto }) => {
  const [resumen, setResumen]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getHorasResumenProyecto(proyecto.id_proyecto)
      .then((r) => { if (r?.success) setResumen(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [proyecto.id_proyecto]);

  const totalHoras = resumen.reduce((acc, r) => acc + Number(r.total_horas || 0), 0);

  return (
    <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg,var(--primary),var(--accent))" }}></div>
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-2 gap-2">
          <Link to="/proyectos" className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden text-decoration-none">
            <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 34, height: 34, background: "rgba(79,70,229,.1)" }}>
              <i className="bi bi-kanban-fill" style={{ color: "var(--primary)", fontSize: 14 }}></i>
            </div>
            <div className="overflow-hidden">
              <p className="fw-bold mb-0 text-truncate" style={{ fontSize: 13, color: "var(--text)" }}>{proyecto.nombre}</p>
              {proyecto.servicio_nombre && (
                <span style={{ fontSize: 10, color: "#0891b2", background: "rgba(6,182,212,.1)", padding: "1px 7px", borderRadius: 20 }}>
                  {proyecto.servicio_nombre}
                </span>
              )}
            </div>
          </Link>
          <div className="text-end flex-shrink-0">
            <p className="fw-bold mb-0" style={{ fontSize: 16, color: "var(--primary)" }}>
              {loading ? "…" : `${totalHoras.toFixed(1)}h`}
            </p>
            <p className="text-muted mb-0" style={{ fontSize: 10 }}>horas totales</p>
          </div>
        </div>

        {resumen.length > 0 && (
          <button
            className="btn btn-sm w-100 mt-1"
            style={{ fontSize: 11, background: "rgba(79,70,229,.06)", color: "var(--primary)", border: "none" }}
            onClick={() => setExpanded(!expanded)}
          >
            <i className={`bi ${expanded ? "bi-chevron-up" : "bi-chevron-down"} me-1`}></i>
            {expanded ? "Ocultar desglose" : `Ver desglose (${resumen.length} empleados)`}
          </button>
        )}

        {expanded && resumen.map((r) => (
          <div key={r.id_usuario} className="d-flex align-items-center justify-content-between mt-2 p-2 rounded-3"
            style={{ background: "rgba(79,70,229,.03)", fontSize: 12 }}>
            <div className="d-flex align-items-center gap-2">
              <div className="avatar flex-shrink-0" style={{ width: 24, height: 24, fontSize: 9 }}>
                {r.empleado_nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <span className="text-truncate" style={{ maxWidth: 130 }}>{r.empleado_nombre}</span>
            </div>
            <span className="badge badge-role badge-active" style={{ fontSize: 10 }}>
              {Number(r.total_horas).toFixed(1)}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════ */
const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const rol = user?.rol;
  const propietarioSinEmpresa = rol === "propietario" && !user?.id_empresa;

  const [stats, setStats]               = useState({ servicios: 0, líderes: 0, empleados: 0, proyectos: 0 });
  const [proyectos, setProyectos]       = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  /* ── Propietario stats ─────────────────────── */
  useEffect(() => {
    if (rol !== "propietario" || !user?.id_empresa) return;
    setLoadingStats(true);
    Promise.all([
      getServicios().catch(() => ({ data: [] })),
      getUsuarios().catch(() => ({ data: [] })),
      getProyectos().catch(() => ({ data: [] })),
    ]).then(([svc, usr, pry]) => {
      const svcList = Array.isArray(svc?.data) ? svc.data : [];
      const usrList = Array.isArray(usr?.data) ? usr.data : [];
      const pryList = Array.isArray(pry?.data) ? pry.data : [];
      setStats({
        servicios: svcList.filter((s) => s.is_active).length,
        líderes:   usrList.filter((u) => u.rol === "lider").length,
        empleados: usrList.filter((u) => u.rol === "empleado").length,
        proyectos: pryList.filter((p) => p.is_active).length,
      });
      setProyectos(pryList.filter((p) => p.is_active).slice(0, 6));
    }).finally(() => setLoadingStats(false));
  }, [rol, user?.id_empresa]);

  /* ── Lider / Empleado stats ────────────────── */
  const [misProyectos, setMisProyectos] = useState([]);
  const [loadingMios, setLoadingMios]   = useState(false);

  useEffect(() => {
    if (rol !== "lider" && rol !== "empleado") return;
    setLoadingMios(true);
    getMisProyectos()
      .then((r) => { if (r?.success) setMisProyectos(r.data || []); })
      .catch(() => {})
      .finally(() => setLoadingMios(false));
  }, [rol]);

  /* ── OWNER ─────────────────────────────────── */
  if (rol === "propietario") {
    if (propietarioSinEmpresa) {
      return (
        <Layout>
          <div className="animate-fadeInUp">
            <div className="page-header">
              <h2 className="fw-bold mb-1">Cuenta sin empresa asignada</h2>
              <p className="text-muted small mb-0">Tu cuenta está activa, pero todavía no tiene una empresa vinculada.</p>
            </div>

            <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)", maxWidth: 720 }}>
              <div style={{ height: 4, background: "linear-gradient(90deg,#F59E0B,#06B6D4)" }}></div>
              <div className="card-body p-4 p-md-5">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 52, height: 52, background: "rgba(245,158,11,.12)" }}
                  >
                    <i className="bi bi-building-exclamation" style={{ color: "#D97706", fontSize: 24 }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-2">Acceso de empresa pendiente</h5>
                    <p className="text-muted mb-4">
                      Tu cuenta está activa, pero actualmente no tienes una empresa asignada.
                      Contacta con el administrador para recuperar el acceso a las funciones de empresa.
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      <Link to="/perfil" className="btn btn-primary px-4">
                        <i className="bi bi-person-circle me-2"></i>Mi Perfil
                      </Link>
                      <button
                        type="button"
                        className="btn btn-outline-danger px-4"
                        onClick={async () => {
                          await logout();
                          navigate("/login");
                        }}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      );
    }

    return (
      <Layout>
        <div className="animate-fadeInUp">
          <div className="page-header">
            <h2 className="fw-bold mb-1">{saludo}, {user?.nombre?.split(" ")[0]} 👋</h2>
            <p className="text-muted small mb-0">Resumen de tu empresa</p>
          </div>

          <div className="row g-3 mb-4 stagger">
            {[
              { icon: "bi-briefcase-fill",  label: "Servicios activos",  value: loadingStats ? "…" : stats.servicios, color: "#4F46E5", bg: "rgba(79,70,229,.1)",  to: "/servicios", delay: .05 },
              { icon: "bi-star-fill",        label: "Líderes",            value: loadingStats ? "…" : stats.líderes,   color: "#F59E0B", bg: "rgba(245,158,11,.1)", to: "/usuarios",  delay: .10 },
              { icon: "bi-people-fill",      label: "Empleados",          value: loadingStats ? "…" : stats.empleados, color: "#10B981", bg: "rgba(16,185,129,.1)", to: "/usuarios",  delay: .15 },
              { icon: "bi-kanban-fill",      label: "Proyectos activos",  value: loadingStats ? "…" : stats.proyectos, color: "#06B6D4", bg: "rgba(6,182,212,.1)",  to: "/proyectos", delay: .20 },
            ].map((s, i) => (
              <div className="col-6 col-lg-3" key={i}>
                <StatCard {...s} />
              </div>
            ))}
          </div>

          {proyectos.length > 0 && (
            <>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold text-muted text-uppercase small d-flex align-items-center gap-2 mb-0">
                  <i className="bi bi-clock-history" style={{ color: "var(--primary)" }}></i>
                  Horas registradas por proyecto
                </h6>
                <Link to="/proyectos" className="btn btn-sm btn-light rounded-3 fw-semibold" style={{ fontSize: 12 }}>
                  Ver todos <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
              <div className="row g-3 mb-4 stagger">
                {proyectos.map((p) => (
                  <div className="col-12 col-md-6 col-lg-4" key={p.id_proyecto}>
                    <ProyectoHorasCard proyecto={p} />
                  </div>
                ))}
              </div>
            </>
          )}

          {proyectos.length === 0 && !loadingStats && (
            <div className="card border-0 rounded-4 mb-4" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="card-body text-center py-5">
                <i className="bi bi-kanban" style={{ fontSize: "2.5rem", color: "#CBD5E1" }}></i>
                <h6 className="mt-3 mb-1 text-muted">Sin proyectos activos</h6>
                <p className="text-muted small mb-3">Crea proyectos desde el menú lateral para ver sus estadísticas aquí.</p>
                <Link to="/proyectos" className="btn btn-primary btn-sm px-4">
                  <i className="bi bi-plus-circle me-2"></i>Crear proyecto
                </Link>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  /* ── LIDER ─────────────────────────────────── */
  if (rol === "lider") {
    return (
      <Layout>
        <div className="animate-fadeInUp">
          <div className="page-header">
            <h2 className="fw-bold mb-1">{saludo}, {user?.nombre?.split(" ")[0]} 👋</h2>
            <p className="text-muted small mb-0">Panel de líder de equipo</p>
          </div>

          <div className="row g-3 mb-4 stagger">
            {[
              { icon: "bi-kanban-fill",    label: "Proyectos asignados", value: loadingMios ? "…" : misProyectos.length, color: "#4F46E5", bg: "rgba(79,70,229,.1)",  to: "/proyectos", delay: .05 },
              { icon: "bi-people-fill",    label: "Mi equipo",           value: "—", color: "#10B981", bg: "rgba(16,185,129,.1)", to: "/usuarios",  delay: .10 },
              { icon: "bi-clock-history",  label: "Horas esta semana",   value: "—", color: "#F59E0B", bg: "rgba(245,158,11,.1)", to: "/horas",     delay: .15 },
              { icon: "bi-check2-circle",  label: "Tareas completadas",  value: "—", color: "#06B6D4", bg: "rgba(6,182,212,.1)",  delay: .20 },
            ].map((s, i) => (
              <div className="col-6 col-md-3" key={i}>
                <StatCard {...s} />
              </div>
            ))}
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
                <div style={{ height: 3, background: "linear-gradient(90deg,#4F46E5,#06B6D4)" }}></div>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-bold mb-0"><i className="bi bi-kanban me-2 text-primary"></i>Mis Proyectos</h6>
                    <Link to="/proyectos" className="btn btn-sm btn-light rounded-3" style={{ fontSize: 11 }}>
                      Ver todos <i className="bi bi-arrow-right ms-1"></i>
                    </Link>
                  </div>
                  {loadingMios ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton rounded-3 mb-2" style={{ height: 36 }}></div>)
                  ) : misProyectos.length === 0 ? (
                    <div className="empty-state py-4">
                      <i className="bi bi-kanban" style={{ fontSize: "2rem" }}></i>
                      <h6>Sin proyectos asignados</h6>
                      <p>Tus proyectos aparecerán aquí cuando el propietario los asigne.</p>
                    </div>
                  ) : misProyectos.slice(0, 5).map((p) => (
                    <Link key={p.id_proyecto} to="/proyectos" className="text-decoration-none">
                      <div className="d-flex align-items-center justify-content-between p-2 rounded-3 mb-1"
                        style={{ background: "rgba(79,70,229,.03)", transition: "background .15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(79,70,229,.07)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(79,70,229,.03)"}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 28, height: 28, background: "rgba(79,70,229,.1)" }}>
                            <i className="bi bi-kanban-fill" style={{ color: "var(--primary)", fontSize: 11 }}></i>
                          </div>
                          <span className="fw-semibold" style={{ fontSize: 13, color: "var(--text)" }}>{p.nombre}</span>
                        </div>
                        {p.servicio_nombre && (
                          <span style={{ fontSize: 10, color: "#0891b2", background: "rgba(6,182,212,.1)", padding: "2px 8px", borderRadius: 20 }}>
                            {p.servicio_nombre}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
                <div style={{ height: 3, background: "linear-gradient(90deg,#10B981,#06B6D4)" }}></div>
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3"><i className="bi bi-clock me-2 text-success"></i>Reporte de Horas</h6>
                  <div className="empty-state py-3">
                    <i className="bi bi-clock" style={{ fontSize: "2rem" }}></i>
                    <h6>Acceso rápido</h6>
                    <p>Revisa las horas registradas por tu equipo.</p>
                    <Link to="/horas" className="btn btn-sm btn-success px-4">
                      <i className="bi bi-clock-history me-2"></i>Ver Horas
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── EMPLEADO ──────────────────────────────── */
  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header">
          <h2 className="fw-bold mb-1">{saludo}, {user?.nombre?.split(" ")[0]} 👋</h2>
          <p className="text-muted small mb-0">Tu espacio de trabajo</p>
        </div>

        <div className="row g-3 mb-4 stagger">
          {[
            { icon: "bi-kanban-fill",    label: "Proyectos asignados", value: loadingMios ? "…" : misProyectos.length, color: "#4F46E5", bg: "rgba(79,70,229,.1)",  to: "/proyectos", delay: .05 },
            { icon: "bi-clock-history",  label: "Horas este mes",      value: "—", color: "#10B981", bg: "rgba(16,185,129,.1)", to: "/mis-horas", delay: .10 },
            { icon: "bi-calendar-check", label: "Horas esta semana",   value: "—", color: "#F59E0B", bg: "rgba(245,158,11,.1)", to: "/mis-horas", delay: .15 },
            { icon: "bi-check2-all",     label: "Tareas completadas",  value: "—", color: "#06B6D4", bg: "rgba(6,182,212,.1)",  delay: .20 },
          ].map((s, i) => (
            <div className="col-6 col-md-3" key={i}>
              <StatCard {...s} />
            </div>
          ))}
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
              <div style={{ height: 3, background: "linear-gradient(90deg,#4F46E5,#06B6D4)" }}></div>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold mb-0"><i className="bi bi-kanban me-2 text-primary"></i>Mis Proyectos</h6>
                  <Link to="/proyectos" className="btn btn-sm btn-light rounded-3" style={{ fontSize: 11 }}>
                    Ver todos <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
                {loadingMios ? (
                  Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton rounded-3 mb-2" style={{ height: 36 }}></div>)
                ) : misProyectos.length === 0 ? (
                  <div className="empty-state py-4">
                    <i className="bi bi-kanban" style={{ fontSize: "2rem" }}></i>
                    <h6>Sin proyectos asignados</h6>
                    <p>Serás notificado cuando tu líder te asigne un proyecto.</p>
                  </div>
                ) : misProyectos.slice(0, 5).map((p) => (
                  <Link key={p.id_proyecto} to="/proyectos" className="text-decoration-none">
                    <div className="d-flex align-items-center justify-content-between p-2 rounded-3 mb-1"
                      style={{ background: "rgba(79,70,229,.03)", transition: "background .15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(79,70,229,.07)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(79,70,229,.03)"}>
                      <span className="fw-semibold" style={{ fontSize: 13, color: "var(--text)" }}>{p.nombre}</span>
                      {p.lider_nombre && (
                        <span style={{ fontSize: 10, color: "#d97706", background: "rgba(245,158,11,.08)", padding: "2px 8px", borderRadius: 20 }}>
                          Líder: {p.lider_nombre.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
              <div style={{ height: 3, background: "linear-gradient(90deg,#10B981,#06B6D4)" }}></div>
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3"><i className="bi bi-plus-circle me-2 text-success"></i>Registrar Horas</h6>
                <div className="empty-state py-3">
                  <i className="bi bi-clock-history" style={{ fontSize: "2rem" }}></i>
                  <h6>Registro de horas</h6>
                  <p>Registra y consulta tus horas trabajadas.</p>
                  <Link to="/mis-horas" className="btn btn-sm btn-success px-4">
                    <i className="bi bi-clock-history me-2"></i>Mis Horas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
