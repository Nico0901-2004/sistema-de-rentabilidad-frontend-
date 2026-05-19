import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ── Pages ─────────────────────────────────────────── */
import Login            from "../pages/auth/Login";

// Admin
import AdminDashboard   from "../pages/admin/AdminDashboard";
import AdminUsuarioList from "../pages/admin/AdminUsuarioList";
import EmpresaList      from "../pages/empresa/EmpresaList";

// Owner
import Dashboard        from "../pages/dashboard/Dashboard";
import EmpresaConfig    from "../pages/empresa/EmpresaConfig";
import UsuarioList      from "../pages/usuarios/UsuarioList";
import ServicioList     from "../pages/servicios/ServicioList";
import FasesLists       from "../pages/fases/FasesLists";
import NotasLists       from "../pages/notas/NotasLists";
import Rentabilidad     from "../pages/rentabilidad/Rentabilidad";

// Horas y Asistencia
import HorasList        from "../pages/horas/HorasList";
import MisHorasList     from "../pages/horas/MisHorasList";
import MarcajesList     from "../pages/horas/MarcajesList"; // HU 34

// Compartidas
import ProyectoList     from "../pages/proyectos/ProyectoList";
import MiPerfil         from "../pages/profile/MiPerfil";

/* ── Admin sees AdminUsuarioList on /usuarios; propietario/lider see UsuarioList */
const UsuarioListRoute = () => {
  const { user } = useAuth();
  return user?.rol === "admin" ? <AdminUsuarioList /> : <UsuarioList />;
};

/* ── Helpers ───────────────────────────────────────── */
const HOME = {
  admin:       "/admin-dashboard",
  propietario: "/dashboard",
  lider:       "/panel-lider",
  empleado:    "/mi-espacio",
};

const getHome = (user) => HOME[user?.rol] || "/login";

/* ── Guards ────────────────────────────────────────── */
const RequireAuth = ({ children }) => {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const RequireRole = ({ roles, children }) => {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.rol)) {
    return <Navigate to={getHome(user)} replace />;
  }
  return children;
};

const RequireEmpresa = ({ children }) => {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol === "propietario" && !user.id_empresa) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/* ── Router ────────────────────────────────────────── */
export default function AppRouter() {
  const { user, authLoading } = useAuth();
  const homeRedirect = user ? getHome(user) : "/login";

  if (authLoading) return null;

  return (
    <Routes>
      {/* Raíz */}
      <Route path="/" element={<Navigate to={homeRedirect} replace />} />

      {/* Login */}
      <Route
        path="/login"
        element={user ? <Navigate to={homeRedirect} replace /> : <Login />}
      />

      {/* ══════════ ADMIN ══════════ */}
      <Route path="/admin-dashboard" element={
        <RequireAuth><RequireRole roles={["admin"]}><AdminDashboard /></RequireRole></RequireAuth>
      } />
      <Route path="/empresas" element={
        <RequireAuth><RequireRole roles={["admin"]}><EmpresaList /></RequireRole></RequireAuth>
      } />
      <Route path="/propietarios" element={
        <RequireAuth><RequireRole roles={["admin"]}><AdminUsuarioList /></RequireRole></RequireAuth>
      } />

      {/* ══════════ OWNER ══════════ */}
      <Route path="/dashboard" element={
        <RequireAuth><RequireRole roles={["propietario"]}><Dashboard /></RequireRole></RequireAuth>
      } />
      <Route path="/empresa-config" element={
        <RequireAuth><RequireRole roles={["propietario"]}><RequireEmpresa><EmpresaConfig /></RequireEmpresa></RequireRole></RequireAuth>
      } />
      <Route path="/usuarios" element={
        <RequireAuth><RequireRole roles={["admin", "propietario", "lider"]}><RequireEmpresa><UsuarioListRoute /></RequireEmpresa></RequireRole></RequireAuth>
      } />
      <Route path="/servicios" element={
        <RequireAuth><RequireRole roles={["propietario"]}><RequireEmpresa><ServicioList /></RequireEmpresa></RequireRole></RequireAuth>
      } />
      <Route path="/rentabilidad" element={
        <RequireAuth><RequireRole roles={["propietario"]}><RequireEmpresa><Rentabilidad /></RequireEmpresa></RequireRole></RequireAuth>
      } />

      {/* ══════════ LIDER ══════════ */}
      <Route path="/panel-lider" element={
        <RequireAuth><RequireRole roles={["lider"]}><Dashboard /></RequireRole></RequireAuth>
      } />
      <Route path="/horas" element={
        <RequireAuth><RequireRole roles={["lider"]}><HorasList /></RequireRole></RequireAuth>
      } />

      {/* ══════════ EMPLEADO ══════════ */}
      <Route path="/mi-espacio" element={
        <RequireAuth><RequireRole roles={["empleado"]}><Dashboard /></RequireRole></RequireAuth>
      } />
      <Route path="/mis-horas" element={
        <RequireAuth><RequireRole roles={["empleado"]}><MisHorasList /></RequireRole></RequireAuth>
      } />

      {/* ══════════ ASISTENCIA (HU 34) ══════════ */}
      <Route path="/mis-marcajes" element={
        <RequireAuth><RequireRole roles={["lider", "empleado"]}><MarcajesList /></RequireRole></RequireAuth>
      } />

      {/* ══════════ COMPARTIDAS ══════════ */}
      <Route path="/proyectos" element={
        <RequireAuth>
          <RequireRole roles={["propietario", "lider", "empleado"]}><RequireEmpresa><ProyectoList /></RequireEmpresa></RequireRole>
        </RequireAuth>
      } />
      <Route path="/proyectos/:proyectoId/fases" element={
        <RequireAuth>
          <RequireRole roles={["propietario", "lider"]}><RequireEmpresa><FasesLists /></RequireEmpresa></RequireRole>
        </RequireAuth>
      } />
      <Route path="/proyectos/:proyectoId/notas" element={
        <RequireAuth>
          <RequireRole roles={["propietario", "lider"]}><RequireEmpresa><NotasLists /></RequireEmpresa></RequireRole>
        </RequireAuth>
      } />
      <Route path="/perfil" element={
        <RequireAuth><MiPerfil /></RequireAuth>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
    </Routes>
  );
}
