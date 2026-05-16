import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import HorasForm from "./HorasForm";
import { getHoras } from "../../services/horasService";
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

  const registroObligatorio = useMemo(
    () => searchParams.get("registrar") === "true" && searchParams.get("obligatorio") === "1",
    [searchParams]
  );

  const fetchHoras = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getHoras();
      setHoras(getHorasData(response));
    } catch {
      setHoras([]);
      setError("Error al cargar las horas trabajadas.");
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

        <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
          <div className="table-responsive">
            <table className="table table-modern mb-0">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Fase</th>
                  <th>Horas</th>
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
                ) : horas.length > 0 ? (
                  horas.map((registro, index) => (
                    <tr key={getRegistroId(registro, index)} className="animate-fadeIn">
                      <td className="fw-semibold">
                        {registro.proyecto ?? registro.proyecto_nombre ?? "-"}
                      </td>
                      <td className="text-muted">
                        {registro.fase ?? registro.fase_nombre ?? "-"}
                      </td>
                      <td>
                        <span className="fw-bold" style={{ color: "var(--primary)" }}>
                          {registro.horas ?? "-"}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-sm btn-success" type="button">
                            Editar
                          </button>
                          <button className="btn btn-sm btn-danger" type="button">
                            Eliminar
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
