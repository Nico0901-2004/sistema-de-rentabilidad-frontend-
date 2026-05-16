import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import { getMisMarcajes } from "../../services/horasService";
import { notifyError } from "../../utils/notify";

const formatHoraLocal = (value) => {
  if (!value) return "--:--:--";

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Lima",
    });
  }

  const raw = String(value);
  const hhmmss = raw.match(/\b\d{2}:\d{2}:\d{2}\b/);
  return hhmmss ? hhmmss[0] : raw;
};

const MarcajesList = () => {
  const [marcajes, setMarcajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMarcajes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMisMarcajes();
      if (res.success) {
        // Ordenar por fecha descendente (más reciente primero)
        const ordenados = res.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setMarcajes(ordenados);
      } else {
        setError("No se pudo cargar el historial de marcajes.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
      notifyError("Error al cargar marcajes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarcajes();
  }, [fetchMarcajes]);

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header mb-4">
          <h2 className="fw-bold mb-1">Mis Marcajes</h2>
          <p className="text-muted small mb-0">Historial de asistencia (Entradas y Salidas)</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center small rounded-3 mb-4">
            <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
          </div>
        )}

        <div className="card border-0 rounded-4 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 py-3 text-muted small fw-bold text-uppercase">Fecha</th>
                  <th className="py-3 text-muted small fw-bold text-uppercase">Entrada</th>
                  <th className="py-3 text-muted small fw-bold text-uppercase">Salida</th>
                  <th className="py-3 text-muted small fw-bold text-uppercase text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="4" className="p-3">
                        <div className="skeleton rounded" style={{ height: "25px", width: "100%" }}></div>
                      </td>
                    </tr>
                  ))
                ) : marcajes.length > 0 ? (
                  marcajes.map((m) => (
                    <tr key={m.id_marcaje} className="animate-fadeIn">
                      <td className="ps-4 fw-semibold text-dark">
                        {new Date(m.fecha).toLocaleDateString("es-PE", { 
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-3">
                          <i className="bi bi-box-arrow-in-right me-2"></i>{formatHoraLocal(m.hora_entrada)}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-3">
                          <i className="bi bi-box-arrow-right me-2"></i>{formatHoraLocal(m.hora_salida)}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill bg-light text-dark border small px-3">
                          Completado
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5">
                      <div className="text-muted">
                        <i className="bi bi-calendar-x mb-3 d-block" style={{ fontSize: "2rem", opacity: 0.3 }}></i>
                        <p className="mb-0">No se encontraron registros de marcaje.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MarcajesList;
