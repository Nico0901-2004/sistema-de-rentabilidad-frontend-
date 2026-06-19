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
import MisHorasList     from "../pages/horas/MisHorasList";
import MarcajesList     from "../pages/horas/MarcajesList"; // HU 34
import MarcajesEmpresa  from "../pages/horas/MarcajesEmpresa";
import HorasEmpresa     from "../pages/horas/HorasEmpresa";

// Compartidas
import ProyectoList     from "../pages/proyectos/ProyectoList";
import MiPerfil         from "../pages/profile/MiPerfil";

/* ── Admin sees AdminUsuarioList on /usuarios; propietario sees UsuarioList */
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

const puedeVerMarcajes = (user) => {
  const tipoPago = String(user?.tipo_pago || "").toLowerCase();
  const ocultarMarcajePorTipoPago = user?.rol === "empleado" && tipoPago === "por_hora";

  return (user?.rol === "lider" || user?.rol === "empleado") && !ocultarMarcajePorTipoPago;
};

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

const RequireMarcajesAccess = ({ children }) => {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!puedeVerMarcajes(user)) {
    return <Navigate to={getHome(user)} replace />;
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
        <RequireAuth><RequireRole roles={["propietario"]}><EmpresaConfig /></RequireRole></RequireAuth>
      } />
      <Route path="/usuarios" element={
        <RequireAuth><RequireRole roles={["admin", "propietario"]}><UsuarioListRoute /></RequireRole></RequireAuth>
      } />
      <Route path="/servicios" element={
        <RequireAuth><RequireRole roles={["propietario"]}><ServicioList /></RequireRole></RequireAuth>
      } />
      <Route path="/rentabilidad" element={
        <RequireAuth><RequireRole roles={["propietario"]}><Rentabilidad /></RequireRole></RequireAuth>
      } />

      {/* ══════════ LIDER ══════════ */}
      <Route path="/panel-lider" element={
        <RequireAuth><RequireRole roles={["lider"]}><Dashboard /></RequireRole></RequireAuth>
      } />
      <Route path="/notas" element={
        <RequireAuth><RequireRole roles={["lider"]}><NotasLists /></RequireRole></RequireAuth>
      } />

      {/* ══════════ EMPLEADO ══════════ */}
      <Route path="/mi-espacio" element={
        <RequireAuth><RequireRole roles={["empleado"]}><Dashboard /></RequireRole></RequireAuth>
      } />

      {/* ══════════ GESTIÓN DE HORAS MODULADO COMPARTIDO (HU 30) ══════════ */}
      <Route path="/mis-horas" element={
        <RequireAuth>
          <RequireRole roles={["empleado", "lider"]}><MisHorasList /></RequireRole>
        </RequireAuth>
      } />

      {/* ══════════ ASISTENCIA COMPARTIDA (HU 34) ══════════ */}
      <Route path="/mis-marcajes" element={
        <RequireAuth>
          {/* CORRECCIÓN: Permitimos al Líder acceder a su vista de historial de asistencia técnica */}
          <RequireMarcajesAccess><MarcajesList /></RequireMarcajesAccess>
        </RequireAuth>
      } />
      <Route path="/marcajes-empresa" element={
        <RequireAuth>
          <RequireRole roles={["propietario"]}><MarcajesEmpresa /></RequireRole>
        </RequireAuth>
      } />
      <Route path="/horas-equipo" element={
        <RequireAuth>
          <RequireRole roles={["lider", "propietario"]}><HorasEmpresa /></RequireRole>
        </RequireAuth>
      } />

      {/* ══════════ COMPARTIDAS ══════════ */}
      <Route path="/proyectos" element={
        <RequireAuth>
          <RequireRole roles={["propietario", "lider", "empleado"]}><ProyectoList /></RequireRole>
        </RequireAuth>
      } />
      <Route path="/proyectos/:proyectoId/fases" element={
        <RequireAuth>
          <RequireRole roles={["propietario", "lider", "empleado"]}><FasesLists /></RequireRole>
        </RequireAuth>
      } />
      <Route path="/proyectos/:proyectoId/notas" element={
        <RequireAuth>
          <RequireRole roles={["propietario", "lider"]}><NotasLists /></RequireRole>
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
