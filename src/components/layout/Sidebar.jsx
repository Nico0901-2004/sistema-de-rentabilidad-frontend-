import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ButtonMarcaje from "../ui/ButtonMarcaje";

const getNavItems = (rol, puedeVerMarcajes) => {
  switch (rol) {
    case "admin":
      return [
        { to: "/admin-dashboard", icon: "bi-grid-fill", label: "Resumen" },
        { to: "/empresas", icon: "bi-building-fill", label: "Empresas" },
        { to: "/propietarios", icon: "bi-people-fill", label: "Propietarios" },
        { to: "/perfil", icon: "bi-person-circle", label: "Mi Perfil" },
      ];
    case "propietario":
      return [
        { to: "/dashboard", icon: "bi-grid-fill", label: "Dashboard" },
        { to: "/empresa-config", icon: "bi-building", label: "Mi Empresa" },
        { to: "/usuarios", icon: "bi-people-fill", label: "Usuarios" },
        { to: "/servicios", icon: "bi-briefcase-fill", label: "Servicios" },
        { to: "/proyectos", icon: "bi-kanban-fill", label: "Proyectos" },
        { to: "/rentabilidad", icon: "bi-graph-up-arrow", label: "Rentabilidad" },
        { to: "/perfil", icon: "bi-person-circle", label: "Mi Perfil" },
      ];
    case "lider":
      return [
        { to: "/panel-lider", icon: "bi-grid-fill", label: "Mi Panel" },
        ...(puedeVerMarcajes ? [{ to: "/mis-marcajes", icon: "bi-calendar-check", label: "Mis Marcajes" }] : []),
        { to: "/proyectos", icon: "bi-kanban-fill", label: "Proyectos" },
        { to: "/notas", icon: "bi-journal-text", label: "Notas" },
        { to: "/perfil", icon: "bi-person-circle", label: "Mi Perfil" },
      ];
    case "empleado":
      return [
        { to: "/mi-espacio", icon: "bi-grid-fill", label: "Mi Espacio" },
        ...(puedeVerMarcajes ? [{ to: "/mis-marcajes", icon: "bi-calendar-check", label: "Mis Marcajes" }] : []),
        { to: "/proyectos", icon: "bi-kanban-fill", label: "Mis Proyectos" },
        { to: "/mis-horas", icon: "bi-clock-history", label: "Mis Horas" },
        { to: "/perfil", icon: "bi-person-circle", label: "Mi Perfil" },
      ];
    default:
      return [{ to: "/perfil", icon: "bi-person-circle", label: "Mi Perfil" }];
  }
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const rol = user?.rol || "empleado";
  const tipoPago = String(user?.tipo_pago || "").toLowerCase();
  const ocultarMarcajePorTipoPago = user?.rol === "empleado" && tipoPago === "por_hora";
  const puedeVerMarcajes = (user?.rol === "lider" || user?.rol === "empleado") && !ocultarMarcajePorTipoPago;

  const navItems = getNavItems(rol, puedeVerMarcajes);
  const active = (path) => location.pathname === path;

  // CORRECCIÓN: Mapeo exhaustivo de propiedades para garantizar la renderización del nombre real
  const nombreEmpresa = user?.empresa_nombre || user?.empresaNombre || user?.empresa || (rol === "admin" ? "Panel Admin" : "Mi Empresa");

  const rolConfig = {
    admin: { label: "Administrador", color: "#FCA5A5", bg: "rgba(239,68,68,.25)" },
    propietario: { label: "Propietario", color: "#A5B4FC", bg: "rgba(99,102,241,.25)" },
    lider: { label: "Líder", color: "#FDE68A", bg: "rgba(245,158,11,.25)" },
    empleado: { label: "Empleado", color: "#6EE7B7", bg: "rgba(16,185,129,.25)" },
  };
  const rc = rolConfig[rol] || rolConfig.empleado;

  return (
    <div
      className="d-flex flex-column"
      style={{
        width: 250,
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
        background: "linear-gradient(180deg,#0F0C29 0%,#302B63 50%,#24243e 100%)",
        boxShadow: "4px 0 30px rgba(15,12,41,.5)",
        zIndex: 200,
        flexShrink: 0,
      }}
    >
      <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}>
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 40, height: 40, background: "linear-gradient(135deg,#4F46E5,#06B6D4)" }}
          >
            <i className="bi bi-building-fill text-white" style={{ fontSize: 16 }}></i>
          </div>
          <div className="overflow-hidden">
            <p className="fw-bold text-white mb-0 text-truncate" style={{ fontSize: 13, maxWidth: 155 }} title={nombreEmpresa}>
              {nombreEmpresa}
            </p>
            <span
              className="rounded-pill px-2 py-0"
              style={{ fontSize: 10, fontWeight: 700, background: rc.bg, color: rc.color, letterSpacing: ".05em" }}
            >
              {rc.label}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-grow-1 py-3 px-2">
        {navItems.map((item) => {
          const isActive = active(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded-3 text-decoration-none"
              style={{
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#fff" : "rgba(199,210,254,.7)",
                background: isActive
                  ? "linear-gradient(135deg,rgba(99,102,241,.6),rgba(79,70,229,.4))"
                  : "transparent",
                transition: "all .2s cubic-bezier(.4,0,.2,1)",
                boxShadow: isActive ? "0 4px 12px rgba(79,70,229,.3), inset 0 1px 0 rgba(255,255,255,.1)" : "none",
                border: isActive ? "1px solid rgba(255,255,255,.08)" : "1px solid transparent",
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: 15, width: 18, textAlign: "center", flexShrink: 0 }}></i>
              <span className="text-truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {puedeVerMarcajes && (
        <div className="px-3 mb-3">
          <ButtonMarcaje />
        </div>
      )}

      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <div
          className="d-flex align-items-center gap-2 rounded-3 p-2 mb-2"
          style={{ background: "rgba(255,255,255,.05)", cursor: "pointer", transition: "background .2s" }}
          onClick={() => navigate("/perfil")}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 32, height: 32, background: "linear-gradient(135deg,#4F46E5,#06B6D4)", fontSize: 12, fontWeight: 700, color: "#fff" }}
          >
            {user?.nombre ? user.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?"}
          </div>
          <div className="overflow-hidden">
            <p className="text-white fw-semibold mb-0 text-truncate" style={{ fontSize: 12, maxWidth: 140 }}>
              {user?.nombre || "Usuario"}
            </p>
            <p className="mb-0 text-truncate" style={{ fontSize: 10, color: "rgba(199,210,254,.5)", maxWidth: 140 }}>
              {user?.email}
            </p>
          </div>
        </div>

        <button
          className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-3"
          style={{ background: "rgba(239,68,68,.15)", color: "#FCA5A5", fontSize: 12, fontWeight: 600, border: "1px solid rgba(239,68,68,.2)", transition: "all .2s" }}
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          <i className="bi bi-box-arrow-left"></i>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
