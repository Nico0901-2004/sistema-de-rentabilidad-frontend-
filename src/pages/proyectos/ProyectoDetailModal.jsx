import React from "react";
import DataTable from "../../components/ui/DataTable";
import { EstadoProyectoBadge, formatProyectoDate, getFaseId, getFaseNombre, getFaseHorasEstimadas, getHorasRegistradasByFase, getLiderNombre, getProyectoEstado, getServicioNombre, getTotalHorasEstimadas, getTotalHorasResumen } from "./projectUtils";

const ProyectoDetailModal = ({ proyecto, onClose, horasResumen = [], fases = [], horasLoading = false, horasError = "" }) => {
  if (!proyecto) return null;

  const empleados = Array.isArray(proyecto.empleados) ? proyecto.empleados : [];
  const totalHoras = getTotalHorasResumen(horasResumen);
  const totalEstimadas = getTotalHorasEstimadas(fases);
  const horasRegistradasByFase = getHorasRegistradasByFase(horasResumen);
  const faseColumns = [
    { header: "Fase", cellClassName: "fw-semibold small", render: (fase) => getFaseNombre(fase) },
    {
      header: "Estimadas",
      headerClassName: "text-end",
      cellClassName: "text-end fw-bold small",
      cellStyle: { color: "var(--primary)" },
      render: (fase) => `${getFaseHorasEstimadas(fase).toFixed(1)}h`,
    },
    {
      header: "Registradas",
      headerClassName: "text-end",
      cellClassName: "text-end fw-bold small",
      cellStyle: { color: "var(--accent)" },
      render: (fase) => {
        const faseId = getFaseId(fase);
        const faseNombre = getFaseNombre(fase);
        const registradas = horasRegistradasByFase.get(String(faseId)) ??
          horasRegistradasByFase.get(String(faseNombre)) ?? 0;
        return `${Number(registradas || 0).toFixed(1)}h`;
      },
    },
  ];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card p-0 animate-scaleIn" style={{ maxWidth: 760 }}>
        <div style={{ height: 4, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}></div>
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">{proyecto.nombre}</h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <p className="text-muted small mb-0">{getServicioNombre(proyecto)}</p>
                <EstadoProyectoBadge estado={getProyectoEstado(proyecto)} />
              </div>
            </div>
            <button className="btn btn-sm btn-light rounded-3" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="p-3 rounded-4 bg-light h-100">
                <h6 className="fw-bold small mb-3">Información</h6>
                <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                  {proyecto.descripcion || "Sin descripción registrada."}
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge badge-role badge-lider">
                    Horas: {horasLoading ? "..." : `${totalHoras.toFixed(1)}h`}
                  </span>
                  <span className="badge badge-role badge-empleado">
                    Estimadas: {totalEstimadas.toFixed(1)}h
                  </span>
                  {proyecto.presupuesto && (
                    <span className="badge badge-role badge-propietario">
                      Presupuesto: S/ {Number(proyecto.presupuesto).toLocaleString("es-PE")}
                    </span>
                  )}
                  {/* BADGE COMPLEMENTARIO DE MARGEN DE GANANCIA */}
                  <span className="badge badge-role bg-success text-white">
                    Margen: {proyecto.margen !== undefined && proyecto.margen !== null ? Number(proyecto.margen).toFixed(2) : "0.00"}%
                  </span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 rounded-4 bg-light h-100">
                <h6 className="fw-bold small mb-3">Fechas y equipo</h6>
                <div className="small text-muted mb-2">
                  <i className="bi bi-calendar-event me-2"></i>
                  Inicio: {formatProyectoDate(proyecto.fecha_inicio)}
                </div>
                <div className="small text-muted mb-2">
                  <i className="bi bi-calendar-check me-2"></i>
                  Fin estimado: {formatProyectoDate(proyecto.fecha_fin_estimada)}
                </div>
                <div className="small text-muted mb-3">
                  <i className="bi bi-flag-fill me-2" style={{ color: "#059669" }}></i>
                  Fin real: <strong>{formatProyectoDate(proyecto.fecha_fin_real)}</strong>
                </div>
                <div className="small text-muted mb-2">
                  <i className="bi bi-star-fill me-2" style={{ color: "#D97706" }}></i>
                  Líder: <strong>{getLiderNombre(proyecto)}</strong>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {empleados.length > 0 ? empleados.map((empleado) => (
                    <span className="badge badge-role badge-empleado" key={empleado.id_usuario}>
                      {empleado.nombre}
                    </span>
                  )) : (
                    <span className="text-muted small">Sin empleados asignados.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-4 bg-light">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
              <h6 className="fw-bold small mb-0">
                <i className="bi bi-clock-history me-2" style={{ color: "var(--primary)" }}></i>
                Fases del proyecto
              </h6>
              <span className="fw-bold" style={{ color: "var(--primary)" }}>
                {fases.length} fase{fases.length !== 1 ? "s" : ""}
              </span>
            </div>

            {horasError ? (
              <p className="text-muted small mb-0">{horasError}</p>
            ) : horasLoading ? (
              <div className="skeleton rounded" style={{ height: 24, width: "60%" }}></div>
            ) : fases.length > 0 ? (
              <DataTable
                columns={faseColumns}
                data={fases}
                rowKey={(fase) => getFaseId(fase) ?? getFaseNombre(fase)}
                paginated={false}
                cardClassName="shadow-none"
                tableClassName="table-sm"
                emptyMessage="Sin fases"
              />
            ) : (
              <p className="text-muted small mb-0">Sin fases registradas para este proyecto.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProyectoDetailModal;
