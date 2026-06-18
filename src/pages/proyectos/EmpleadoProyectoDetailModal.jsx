import React from "react";
import { EstadoProyectoBadge, formatProyectoDate, getFaseHorasEstimadas, getFaseId, getFaseNombre, getProyectoEstado, getServicioNombre, getTotalHorasEstimadas } from "./projectUtils";

const EmpleadoProyectoDetailModal = ({ proyecto, onClose, horasRegistradas = 0, fases = [] }) => {
  if (!proyecto) return null;

  const totalEstimadas = getTotalHorasEstimadas(fases);

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
            <div className="col-12 col-md-7">
              <div className="p-3 rounded-4 bg-light h-100">
                <h6 className="fw-bold small mb-3">Información del proyecto</h6>
                <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                  {proyecto.descripcion || "Sin descripción registrada."}
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge badge-role badge-active">
                    Horas registradas: {Number(horasRegistradas || 0).toFixed(1)}h
                  </span>
                  {fases.length > 0 && (
                    <span className="badge badge-role badge-empleado">
                      {fases.length} fase{fases.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="badge badge-role badge-lider">
                    Estimadas: {totalEstimadas.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-5">
              <div className="p-3 rounded-4 bg-light h-100">
                <h6 className="fw-bold small mb-3">Fechas y asignación</h6>
                <div className="small text-muted mb-2">
                  <i className="bi bi-calendar-event me-2"></i>
                  Asignación / inicio: {formatProyectoDate(proyecto.fecha_inicio)}
                </div>
                <div className="small text-muted mb-2">
                  <i className="bi bi-calendar-check me-2"></i>
                  Fin estimado: {formatProyectoDate(proyecto.fecha_fin_estimada)}
                </div>
                {proyecto.fecha_fin_real && (
                  <div className="small text-muted mb-2">
                    <i className="bi bi-flag-fill me-2" style={{ color: "#059669" }}></i>
                    Fin real: {formatProyectoDate(proyecto.fecha_fin_real)}
                  </div>
                )}
                {proyecto.lider_nombre && (
                  <div className="small text-muted mt-3">
                    <i className="bi bi-star-fill me-2" style={{ color: "#D97706" }}></i>
                    Líder: <strong>{proyecto.lider_nombre}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {fases.length > 0 && (
            <div className="mt-3">
              <h6 className="fw-bold small mb-2">Fases del proyecto</h6>
              <div className="d-flex flex-wrap gap-2">
                {fases.map((fase) => (
                  <span key={getFaseId(fase) ?? getFaseNombre(fase)} className="badge rounded-pill" style={{ background: "rgba(79,70,229,.1)", color: "var(--primary)" }}>
                    {getFaseNombre(fase)}
                    {getFaseHorasEstimadas(fase) > 0 ? ` · ${getFaseHorasEstimadas(fase).toFixed(1)}h` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default EmpleadoProyectoDetailModal;
