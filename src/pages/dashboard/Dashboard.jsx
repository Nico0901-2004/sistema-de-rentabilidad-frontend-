import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { getServicios } from "../../services/servicioService";
import { getUsuarios } from "../../services/usuarioService";
import { getProyectos, getMisProyectos, getHorasResumenProyecto } from "../../services/proyectoService";
import { getLiderNombre, getServicioNombre, getTotalHorasResumen, isProyectoActivo, normalizeHorasResumen } from "../proyectos/projectUtils";

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

const MiniMetric = ({ icon, label, value, color, bg }) => (
  <div className="d-flex align-items-center gap-3 p-3 rounded-4 h-100" style={{ background: bg }}>
    <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: 38, height: 38, background: "rgba(255,255,255,.72)" }}>
      <i className={`bi ${icon}`} style={{ color, fontSize: 17 }}></i>
    </div>
    <div style={{ minWidth: 0 }}>
      <p className="text-muted small mb-0">{label}</p>
      <h5 className="fw-bold mb-0 text-truncate" style={{ color }}>{value}</h5>
    </div>
  </div>
);

const RankingList = ({ title, icon, items, emptyMessage }) => (
  <div className="card border-0 rounded-4 overflow-hidden h-100" style={{ boxShadow: "var(--shadow-md)" }}>
    <div style={{ height: 3, background: "linear-gradient(90deg,var(--primary),var(--accent))" }}></div>
    <div className="card-body p-4">
      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <i className={`bi ${icon}`} style={{ color: "var(--primary)" }}></i>
        {title}
      </h6>
      {items.length === 0 ? (
        <div className="empty-state py-3">
          <i className="bi bi-inbox" style={{ fontSize: "1.8rem" }}></i>
          <h6>{emptyMessage}</h6>
        </div>
      ) : (
        items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="d-flex align-items-center justify-content-between gap-3 py-2"
            style={{ borderBottom: index < items.length - 1 ? "1px solid rgba(148,163,184,.16)" : "none" }}>
            <span className="fw-semibold text-truncate" style={{ fontSize: 13 }}>{item.label}</span>
            <span className="badge badge-role" style={{ background: "rgba(79,70,229,.1)", color: "var(--primary)" }}>
              {item.value}
            </span>
          </div>
        ))
      )}
    </div>
  </div>
);

/* ── ProyectoHorasCard (propietario) ──────────── */
const ProyectoHorasCard = ({ proyecto, resumen: resumenProp, loading: loadingProp = false }) => {
  const [resumen, setResumen]   = useState(resumenProp || []);
  const [loading, setLoading]   = useState(!resumenProp);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (resumenProp) {
      setResumen(resumenProp);
      setLoading(loadingProp);
      return;
    }

    getHorasResumenProyecto(proyecto.id_proyecto)
      .then((r) => { if (r?.success) setResumen(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [proyecto.id_proyecto, resumenProp, loadingProp]);

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
            {expanded ? "Ocultar desglose" : `Ver desglose (${resumen.length} fases)`}
          </button>
        )}

        {expanded && resumen.map((r, index) => (
          <div key={r.id_resumen || r.id_fase || index} className="d-flex align-items-center justify-content-between mt-2 p-2 rounded-3"
            style={{ background: "rgba(79,70,229,.03)", fontSize: 12 }}>
            <div className="d-flex align-items-center gap-2">
              <div className="avatar flex-shrink-0" style={{ width: 24, height: 24, fontSize: 9 }}>
                {(r.fase_nombre || "SF").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <span className="text-truncate" style={{ maxWidth: 130 }}>{r.fase_nombre || "Sin fase"}</span>
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
  const { user } = useAuth();
  const rol = user?.rol;

  const [stats, setStats]               = useState({ servicios: 0, líderes: 0, empleados: 0, proyectos: 0 });
  const [proyectos, setProyectos]       = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError]     = useState("");
  const [horasResumen, setHorasResumen] = useState({});
  const [loadingHoras, setLoadingHoras] = useState(false);
  const [horasError, setHorasError]     = useState("");

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  /* ── Propietario stats ─────────────────────── */
  useEffect(() => {
    if (rol !== "propietario") return;
    let mounted = true;

    const fetchOwnerStats = async () => {
      setLoadingStats(true);
      setStatsError("");
      setHorasError("");

      const safeRequest = async (request) => {
        try {
          return await request();
        } catch {
          if (mounted) setStatsError("No se pudieron cargar todas las métricas del dashboard.");
          return { data: [] };
        }
      };

      const [svc, usr, pry] = await Promise.all([
        safeRequest(getServicios),
        safeRequest(getUsuarios),
        safeRequest(getProyectos),
      ]);

      if (!mounted) return;

      const svcList = Array.isArray(svc?.data) ? svc.data : [];
      const usrList = Array.isArray(usr?.data) ? usr.data : [];
      const pryList = Array.isArray(pry?.data) ? pry.data : [];
      const proyectosActivos = pryList.filter(isProyectoActivo);
      setStats({
        servicios: svcList.filter((s) => s?.is_active !== false).length,
        líderes:   usrList.filter((u) => u?.rol === "lider" && u?.is_active !== false).length,
        empleados: usrList.filter((u) => u?.rol === "empleado" && u?.is_active !== false).length,
        proyectos: proyectosActivos.length,
      });
      setProyectos(proyectosActivos);
      setLoadingStats(false);

      if (proyectosActivos.length === 0) {
        setHorasResumen({});
        return;
      }

      setLoadingHoras(true);
      try {
        let horasFallidas = false;
        const entries = await Promise.all(
          proyectosActivos.map(async (proyecto) => {
            try {
              const resumen = await getHorasResumenProyecto(proyecto.id_proyecto);
              return [proyecto.id_proyecto, normalizeHorasResumen(resumen, proyecto)];
            } catch {
              horasFallidas = true;
              return [proyecto.id_proyecto, []];
            }
          })
        );
        if (mounted) {
          setHorasResumen(Object.fromEntries(entries));
          if (horasFallidas) setHorasError("Algunos proyectos no devolvieron resumen de horas.");
        }
      } catch {
        if (mounted) setHorasError("No se pudo cargar el resumen de horas por proyecto.");
      } finally {
        if (mounted) setLoadingHoras(false);
      }
    };

    fetchOwnerStats().finally(() => {
      if (mounted) setLoadingStats(false);
    });

    return () => {
      mounted = false;
    };
  }, [rol]);

  const totalHorasEmpresa = useMemo(
    () => Object.values(horasResumen).reduce((acc, resumen) => acc + getTotalHorasResumen(resumen), 0),
    [horasResumen]
  );

  const proyectosRecientes = useMemo(() => proyectos.slice(0, 5), [proyectos]);

  const serviciosMasUsados = useMemo(() => {
    const counts = new Map();
    proyectos.forEach((proyecto) => {
      const servicio = getServicioNombre(proyecto);
      if (!servicio || servicio === "—") return;
      counts.set(servicio, Number(counts.get(servicio) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value: `${value} proyecto${value !== 1 ? "s" : ""}` }))
      .sort((a, b) => Number.parseInt(b.value, 10) - Number.parseInt(a.value, 10))
      .slice(0, 5);
  }, [proyectos]);

  const lideresConProyectos = useMemo(() => {
    const counts = new Map();
    proyectos.forEach((proyecto) => {
      const lider = getLiderNombre(proyecto);
      if (!lider || lider === "—") return;
      counts.set(lider, Number(counts.get(lider) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value: `${value} proyecto${value !== 1 ? "s" : ""}` }))
      .sort((a, b) => Number.parseInt(b.value, 10) - Number.parseInt(a.value, 10))
      .slice(0, 5);
  }, [proyectos]);

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
    return (
      <Layout>
        <div className="animate-fadeInUp">
          <div className="page-header">
            <h2 className="fw-bold mb-1">{saludo}, {user?.nombre?.split(" ")[0]} 👋</h2>
            <p className="text-muted small mb-0">Resumen de tu empresa</p>
          </div>

          {statsError && (
            <div className="alert alert-danger d-flex align-items-center small rounded-3 mb-3">
              <i className="bi bi-exclamation-circle-fill me-2"></i>{statsError}
            </div>
          )}

          <div className="row g-3 mb-4 stagger">
            {[
              { icon: "bi-briefcase-fill",  label: "Servicios",          value: loadingStats ? "…" : stats.servicios, color: "#4F46E5", bg: "rgba(79,70,229,.1)",  to: "/servicios", delay: .05 },
              { icon: "bi-star-fill",        label: "Líderes",            value: loadingStats ? "…" : stats.líderes,   color: "#F59E0B", bg: "rgba(245,158,11,.1)", to: "/usuarios",  delay: .10 },
              { icon: "bi-people-fill",      label: "Empleados",          value: loadingStats ? "…" : stats.empleados, color: "#10B981", bg: "rgba(16,185,129,.1)", to: "/usuarios",  delay: .15 },
              { icon: "bi-kanban-fill",      label: "Proyectos",          value: loadingStats ? "…" : stats.proyectos, color: "#06B6D4", bg: "rgba(6,182,212,.1)",  to: "/proyectos", delay: .20 },
            ].map((s, i) => (
              <div className="col-6 col-lg-3" key={i}>
                <StatCard {...s} />
              </div>
            ))}
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <MiniMetric
                icon="bi-clock-history"
                label="Horas registradas"
                value={loadingHoras ? "…" : `${totalHorasEmpresa.toFixed(1)}h`}
                color="#4F46E5"
                bg="rgba(79,70,229,.06)"
              />
            </div>
            <div className="col-12 col-md-4">
              <MiniMetric
                icon="bi-calendar-check"
                label="Proyectos con cierre real"
                value={loadingStats ? "…" : proyectos.filter((p) => p.fecha_fin_real).length}
                color="#10B981"
                bg="rgba(16,185,129,.08)"
              />
            </div>
            <div className="col-12 col-md-4">
              <MiniMetric
                icon="bi-list-check"
                label="Promedio de empleados por proyecto"
                value={loadingStats || proyectos.length === 0 ? (loadingStats ? "…" : "0.0") : (proyectos.reduce((acc, p) => acc + (Array.isArray(p.empleados) ? p.empleados.length : 0), 0) / proyectos.length).toFixed(1)}
                color="#06B6D4"
                bg="rgba(6,182,212,.08)"
              />
            </div>
          </div>

          {horasError && (
            <div className="alert alert-warning d-flex align-items-center small rounded-3 mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>{horasError}
            </div>
          )}

          {!loadingStats && proyectos.length > 0 && (
            <div className="row g-3 mb-4">
              <div className="col-12 col-lg-4">
                <RankingList title="Proyectos recientes" icon="bi-clock-history"
                  emptyMessage="Sin proyectos recientes"
                  items={proyectosRecientes.map((p) => ({ label: p.nombre, value: p.fecha_inicio ? String(p.fecha_inicio).slice(0, 10) : "Sin fecha" }))} />
              </div>
              <div className="col-12 col-lg-4">
                <RankingList title="Servicios más usados" icon="bi-briefcase-fill"
                  emptyMessage="Sin servicios asociados"
                  items={serviciosMasUsados} />
              </div>
              <div className="col-12 col-lg-4">
                <RankingList title="Líderes con más proyectos" icon="bi-star-fill"
                  emptyMessage="Sin líderes asociados"
                  items={lideresConProyectos} />
              </div>
            </div>
          )}

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
                {proyectos.slice(0, 6).map((p) => (
                  <div className="col-12 col-md-6 col-lg-4" key={p.id_proyecto}>
                    <ProyectoHorasCard proyecto={p} resumen={horasResumen[p.id_proyecto] || []} loading={loadingHoras} />
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
