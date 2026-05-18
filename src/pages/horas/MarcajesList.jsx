import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
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

  const columns = [
    {
      header: "Fecha",
      headerClassName: "ps-4",
      cellClassName: "ps-4 fw-semibold text-dark",
      render: (m) => formatFechaLocal(m.fecha),
    },
    {
      header: "Entrada",
      render: (m) => (
        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-3">
          <i className="bi bi-box-arrow-in-right me-2"></i>{formatHoraLocal(m.hora_entrada)}
        </span>
      ),
    },
    {
      header: "Salida",
      render: (m) => (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-3">
          <i className="bi bi-box-arrow-right me-2"></i>{formatHoraLocal(m.hora_salida)}
        </span>
      ),
    },
    {
      header: "Estado",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: () => <span className="badge rounded-pill bg-light text-dark border small px-3">Completado</span>,
    },
  ];

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header mb-4">
          <h2 className="fw-bold mb-1">Mis Marcajes</h2>
          <p className="text-muted small mb-0">Historial de asistencia (Entradas y Salidas)</p>
        </div>

        <DataTable
          columns={columns}
          data={marcajes}
          loading={loading}
          error={error}
          rowKey="id_marcaje"
          emptyIcon="bi-calendar-x"
          emptyMessage="No se encontraron registros de marcaje"
          skeletonRows={5}
        />
      </div>
    </Layout>
  );
};

export default MarcajesList;
