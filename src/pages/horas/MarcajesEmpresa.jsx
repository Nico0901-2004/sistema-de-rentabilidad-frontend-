import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import { getMarcajesEmpresa } from "../../services/horasService";
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
    });
  }

  const raw = String(value);
  const hhmmss = raw.match(/\b\d{2}:\d{2}:\d{2}\b/);
  return hhmmss ? hhmmss[0] : raw;
};

const formatFechaLocal = (value) => {
  if (!value) return "--";
  const raw = String(value).slice(0, 10);
  const parts = raw.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    const localDate = new Date(y, (m || 1) - 1, d || 1);
    return localDate.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return raw;
};

const MarcajesEmpresa = () => {
  const [marcajes, setMarcajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMarcajes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getMarcajesEmpresa();
      if (res.success) {
        // Ordenar por fecha descendente (más reciente primero)
        const ordenados = res.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setMarcajes(ordenados);
      } else {
        setError("No se pudo cargar los marcajes de la empresa.");
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

  const columns = [
    {
      header: "Usuario",
      headerClassName: "ps-4",
      cellClassName: "ps-4 fw-semibold text-dark",
      render: (m) => m.nombre || "Sin nombre",
    },
    {
      header: "Fecha",
      render: (m) => formatFechaLocal(m.fecha),
    },
    {
      header: "Entrada",
      render: (m) => (
        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-3">
          <i className="bi bi-box-arrow-in-right me-2"></i>
          {formatHoraLocal(m.hora_entrada)}
        </span>
      ),
    },
    {
      header: "Salida",
      render: (m) => (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-3">
          <i className="bi bi-box-arrow-right me-2"></i>
          {formatHoraLocal(m.hora_salida)}
        </span>
      ),
    },
    {
      header: "Estado",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (m) => {
        const completado = m.hora_entrada && m.hora_salida;
        return (
          <span
            className={`badge rounded-pill border small px-3 ${
              completado
                ? "bg-light text-dark"
                : "bg-warning-subtle text-warning"
            }`}
          >
            {completado ? "Completado" : "Jornada Activa"}
          </span>
        );
      },
    },
  ];

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header mb-4">
          <h2 className="fw-bold mb-1">Marcajes de la Empresa</h2>
          <p className="text-muted small mb-0">
            Entradas y salidas de todos los empleados y líderes
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="alert"
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* DataTable */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <DataTable
            columns={columns}
            data={marcajes}
            loading={loading}
            error={error}
            rowKey={(m) => `${m.id_marcaje}-${m.id_usuario}`}
            pageSize={6}
          />
        </div>

        {/* Empty State */}
        {!loading && !error && marcajes.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white animate-scaleIn">
            <div className="mb-3">
              <div
                className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center"
                style={{ width: 60, height: 60 }}
              >
                <i className="bi bi-inbox text-muted fs-4"></i>
              </div>
            </div>
            <h5 className="fw-bold text-dark mb-2">Sin marcajes registrados</h5>
            <p className="text-muted small mx-auto mb-0" style={{ maxWidth: "480px" }}>
              No hay registros de entrada/salida en la empresa.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MarcajesEmpresa;
