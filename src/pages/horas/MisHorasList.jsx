import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import HorasForm from "./HorasForm";
import { getMisHoras } from "../../services/horasService";
import { notifyInfo } from "../../utils/notify";

const getHorasData = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.success && Array.isArray(response.data)) return response.data;
  return [];
};

const getRegistroId = (registro, index) =>
  registro.id ?? registro.id_registro ?? index;

const MisHorasList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
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
    }
  }, [searchParams]);

  const resumenHoras = useMemo(() => {
    const map = new Map();

    horas.forEach((registro) => {
      const idProyecto = registro.id_proyecto ?? "sin-proyecto";
      const idFase = registro.id_fase ?? "sin-fase";
      const key = `${idProyecto}-${idFase}`;

      const actual = map.get(key) || {
        id_proyecto: registro.id_proyecto,
        id_fase: registro.id_fase,
        proyecto_nombre: registro.proyecto_nombre ?? registro.proyecto ?? "-",
        fase_nombre: registro.fase_nombre ?? registro.fase ?? "-",
        total_horas: 0,
      };

      actual.total_horas += Number(registro.horas ?? 0);
      map.set(key, actual);
    });

    return Array.from(map.values());
  }, [horas]);

  const fasesUnicas = useMemo(() => {
    const map = new Map();

    resumenHoras.forEach((r) => {
      const id = String(r.id_fase ?? "");
      if (!map.has(id)) {
        map.set(id, r.fase_nombre ?? "-");
      }
    });

    return Array.from(map.entries());
  }, [resumenHoras]);

  const resumenFiltrado = useMemo(() => {
    if (!filterFase) return resumenHoras;
    return resumenHoras.filter((r) => String(r.id_fase ?? "") === filterFase);
  }, [resumenHoras, filterFase]);

  const totalHoras = useMemo(
    () => resumenFiltrado.reduce((acc, item) => acc + Number(item.total_horas || 0), 0),
    [resumenFiltrado]
  );

  const handleSaved = async () => {
    setShowForm(false);
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
    if (searchParams.get("registrar") === "true") {
      setSearchParams({});
    }
  };

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Mis Horas</h2>
            <p className="text-muted small mb-0">Horas trabajadas registradas por proyecto y fase</p>
          </div>
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

        <div className="d-flex flex-wrap gap-3 mb-3">
          <select
            className="form-select"
            style={{ maxWidth: 260 }}
            value={filterFase}
            onChange={(e) => setFilterFase(e.target.value)}
          >
            <option value="">- Todas las fases -</option>
            {fasesUnicas.map(([id, nombre]) => (
              <option key={id || nombre} value={id}>{nombre}</option>
            ))}
          </select>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-sm-4">
            <div className="stat-card card-3d animate-fadeInUp">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 40, height: 40, background: "rgba(79,70,229,.1)" }}>
                  <i className="bi bi-list-check" style={{ color: "var(--primary)" }}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Registros</p>
                  <h5 className="fw-bold mb-0">{resumenFiltrado.length}</h5>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="stat-card card-3d animate-fadeInUp">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 40, height: 40, background: "rgba(6,182,212,.1)" }}>
                  <i className="bi bi-clock-history" style={{ color: "var(--accent)" }}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Total horas</p>
                  <h5 className="fw-bold mb-0">{totalHoras.toFixed(1)}h</h5>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="stat-card card-3d animate-fadeInUp">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 40, height: 40, background: "rgba(16,185,129,.1)" }}>
                  <i className="bi bi-diagram-3" style={{ color: "var(--success)" }}></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Fases</p>
                  <h5 className="fw-bold mb-0">{fasesUnicas.length}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
          <div className="table-responsive">
            <table className="table table-modern mb-0">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Fase</th>
                  <th>Total horas</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j}>
                          <div className="skeleton rounded" style={{ height: 20, width: "80%" }}></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : resumenFiltrado.length > 0 ? (
                  resumenFiltrado.map((registro, index) => (
                    <tr key={getRegistroId(registro, index)} className="animate-fadeIn">
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-3 d-flex align-items-center justify-content-center"
                            style={{ width: 30, height: 30, background: "rgba(79,70,229,.1)" }}>
                            <i className="bi bi-kanban" style={{ color: "var(--primary)", fontSize: 13 }}></i>
                          </div>
                          <span className="fw-semibold">
                            {registro.proyecto ?? registro.proyecto_nombre ?? "-"}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted">
                        <span className="badge rounded-pill" style={{ background: "rgba(6,182,212,.12)", color: "var(--accent)" }}>
                          {registro.fase ?? registro.fase_nombre ?? "-"}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bold" style={{ color: "var(--primary)" }}>
                          {Number(registro.total_horas || 0).toFixed(1)}h
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-sm btn-success shadow-sm" type="button" title="Editar">
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-sm btn-danger shadow-sm" type="button" title="Eliminar">
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      <div className="empty-state">
                        <i className="bi bi-clock-history"></i>
                        <h6>Sin horas registradas</h6>
                        <p>No se encontraron datos para mostrar.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <HorasForm
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
