import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="d-flex" style={{ height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Topbar */}
        <header
          className="d-flex justify-content-between align-items-center px-4"
          style={{
            height: 64,
            background: "rgba(255,255,255,.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <span className="fw-bold gradient-text" style={{ fontSize: 16 }}>
            Sistema de Rentabilidad
          </span>

          <div className="d-flex align-items-center gap-3">
            {/* User pill */}
            <div
              className="d-flex align-items-center gap-2 rounded-pill px-3 py-1"
              style={{ background: "rgba(79,70,229,.06)", cursor: "pointer" }}
              onClick={() => navigate("/perfil")}
              title="Mi perfil"
            >
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                {user?.nombre
                  ? user.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                  : "?"}
              </div>
              <span className="fw-semibold d-none d-sm-inline" style={{ fontSize: 13 }}>
                {user?.nombre?.split(" ")[0] || user?.email}
              </span>
            </div>

            <button
              className="btn btn-sm btn-outline-danger rounded-3 d-flex align-items-center gap-1"
              onClick={handleLogout}
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-sm-inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="app-main flex-grow-1 p-4">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
