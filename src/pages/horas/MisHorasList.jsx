import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import HorasForm from "./HorasForm";
import { getMisHoras } from "../../services/horasService";
import { notifyInfo, notifyError } from "../../utils/notify";

const getHorasData = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.success && Array.isArray(response.data)) return response.data;
  return [];
};

const getRegistroId = (registro, index) =>
  registro.id_registro ?? registro.id ?? index;

const MisHorasList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedHoraId, setSelectedHoraId] = useState(null); // Estado para rastrear el ID en Edición (HU 33)
  const [filterFase, setFilterFase] = useState("");

  const registroObligatorio = useMemo(
    () => searchParams.get("registrar") === "true" && searchParams.get("obligatorio") === "1",
    [searchParams]
  );

  const fetchHoras = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMisHoras();
      if (response && response.success === false) {
        throw new Error(response.message || "No se pudo obtener el reporte de horas.");
      }
      setHoras(getHorasData(response));
    } catch (err) {
      setHoras([]);

      const status = err?.response?.status;
      const backendMessage = err?.response?.data?.message || err?.message;

      if (status === 401) {
        setError("Sesión expirada. Inicia sesión nuevamente.");
      } else if (status === 403) {
        setError(backendMessage || "No tienes permisos para ver tus horas.");
      } else if (status === 404) {
        setError("El endpoint de horas no está disponible.");
      } else {
        setError(backendMessage || "Error al cargar las horas trabajadas.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoras();
  }, [fetchHoras]);

  useEffect(() => {
    if (searchParams.get("registrar") === "true") {
      setShowForm(true);
      setSelectedHoraId(null);
    }
  }, [searchParams]);

  // Aseguramos que cada fila mantenga sus propiedades individuales para las acciones de la HU 30
  const registrosDetallados = useMemo(() => {
    return horas.map((r) => ({
      ...r,
      id_registro: r.id_registro ?? r.id,
      horas: Number(r.horas || 0)
    }));
  }, [horas]);

  // Extraemos las fases únicas basándonos en los registros reales del empleado
  const fasesUnicas = useMemo(() => {
    const map = new Map();
    registrosDetallados.forEach((r) => {
      const id = String(r.id_fase ?? "");
      if (id && id !== "undefined" && !map.has(id)) {
        map.set(id, r.fase_nombre ?? r.fase ?? "-");
      }
    });
    return Array.from(map.entries());
  }, [registrosDetallados]);

  // Filtramos la lista según la fase seleccionada por el usuario
  const registrosFiltrados = useMemo(() => {
    if (!filterFase) return registrosDetallados;
    return registrosDetallados.filter((r) => String(r.id_fase ?? "") === filterFase);
  }, [registrosDetallados, filterFase]);

  // Sumamos el total de horas acumuladas de la lista filtrada
  const totalHoras = useMemo(
    () => registrosFiltrados.reduce((acc, item) => acc + Number(item.horas || 0), 0),
    [registrosFiltrados]
  );

  const handleSaved = async () => {
    setShowForm(false);
    setSelectedHoraId(null);
    await fetchHoras();

    if (searchParams.get("registrar") === "true") {
      setSearchParams({});
    }
  };

  const handleCancel = () => {
    if (registroObligatorio) {
      notifyInfo("Debes registrar tus horas para completar el proceso de salida.");
      return;
    }

    setShowForm(false);
    setSelectedHoraId(null);
    if (searchParams.get("registrar") === "true") {
      setSearchParams({});
    }
  };

  // Manejador para abrir el formulario en Modo Edición (HU 33)
  const handleEditClick = (idRegistro) => {
    if (!idRegistro) {
      notifyError("No se pudo identificar el ID del registro para editar.");
      return;
    }
    setSelectedHoraId(idRegistro);
    setShowForm(true);
  };

  const columns = [
    {
      header: "Fecha",
      cellClassName: "small text-muted",
      render: (registro) => registro.fecha ? new Date(registro.fecha).toLocaleDateString() : "-",
    },
    {
      header: "Proyecto",
      render: (registro) => (
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: 30, height: 30, background: "rgba(79,70,229,.1)" }}>
            <i className="bi bi-kanban" style={{ color: "var(--primary)", fontSize: 13 }}></i>
          </div>
          <span className="fw-semibold">
            {registro.proyecto_nombre ?? registro.proyecto ?? "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Fase",
      render: (registro) => (
        <span className="badge rounded-pill" style={{ background: "rgba(6,182,212,.12)", color: "var(--accent)" }}>
          {registro.fase_nombre ?? registro.fase ?? "-"}
        </span>
      ),
    },
    {
      header: "Descripción",
      cellClassName: "text-muted small",
      cellStyle: { maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      render: (registro) => registro.descripcion || <span className="text-light-muted italic">Sin descripción</span>,
    },
    {
      header: "Horas",
      render: (registro) => (
        <span className="fw-bold" style={{ color: "var(--primary)" }}>
          {registro.horas.toFixed(1)}h
        </span>
      ),
    },
  ];

  const filters = (
    <div className="d-flex flex-wrap gap-3">
      <select
        className="form-select"
        style={{ maxWidth: 260 }}
        value={filterFase}
        onChange={(e) => setFilterFase(e.target.value)}
      >
        <option value="">- Todas las fases -</option>
        {fasesUnicas.map(([id, nombre]) => (
          <option key={id} value={id}>{nombre}</option>
        ))}
      </select>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Mis Horas Trabajadas</h2>
            <p className="text-muted small mb-0">Horas registradas de forma detallada por proyecto y fase</p>
          </div>
          {/* SE REMOVIÓ EL BOTÓN "REGISTRAR HORAS" DE ESTA SECCIÓN */}
        </div>

        {registroObligatorio && (
          <div className="alert alert-warning d-flex align-items-center small rounded-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Debes registrar tus horas para completar el flujo de salida.
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center small rounded-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        <div className="row g-3 mb-3">
          <div className="col-12 col-sm-6">
            <div className="stat-card card-3d animate-fadeInUp">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 40, height: 40, background: "rgba(79,70,229,.1)" }}>
                  <i className="bi bi-list-check" style={{ color: "var(--primary)" }}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Total Registros</p>
                  <h5 className="fw-bold mb-0">{registrosFiltrados.length}</h5>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6">
            <div className="stat-card card-3d animate-fadeInUp">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 40, height: 40, background: "rgba(6,182,212,.1)" }}>
                  <i className="bi bi-clock-history" style={{ color: "var(--accent)" }}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Total Horas Acumuladas</p>
                  <h5 className="fw-bold mb-0">{totalHoras.toFixed(1)}h</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={registrosFiltrados}
          loading={loading}
          error=""
          rowKey={(registro, index) => getRegistroId(registro, index)}
          filters={filters}
          emptyIcon="bi-clock-history"
          emptyMessage="Sin horas registradas"
          rowClassName="animate-fadeIn"
          renderActions={(registro) => (
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-sm btn-success shadow-sm" type="button" title="Editar registro" onClick={() => handleEditClick(registro.id_registro)}>
                <i className="bi bi-pencil-square"></i>
              </button>
            </div>
          )}
        />
      </div>

      {showForm && (
        <HorasForm
          idRegistroEdicion={selectedHoraId}
          proyectoPreseleccionado={null}
          onSaved={handleSaved}
          onCancel={handleCancel}
          forceRequired={registroObligatorio}
        />
      )}
    </Layout>
  );
};

export default MisHorasList;