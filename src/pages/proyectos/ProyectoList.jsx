import { useAuth } from "../../context/AuthContext";
import PropietarioProjectsView from "./PropietarioProjectsView";
import LiderProjectsView from "./LiderProjectsView";
import EmpleadoProjectsView from "./EmpleadoProjectsView";

const ProyectoList = () => {
  const { user } = useAuth();
  const rol = user?.rol;

  if (rol === "propietario") return <PropietarioProjectsView />;
  if (rol === "lider") return <LiderProjectsView />;
  return <EmpleadoProjectsView />;
};

export default ProyectoList;
