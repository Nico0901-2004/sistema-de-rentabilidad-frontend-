import React, { useCallback, useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import DataTable from "../../components/ui/DataTable";
import ProyectoDetailModal from "./ProyectoDetailModal";
import ProjectContentModal from "./ProjectContentModal";
import FasesLists from "../fases/FasesLists";
import { getFasesByProyecto } from "../../services/faseService";
import { finalizarProyecto, getHorasResumenProyecto, getMisProyectos } from "../../services/proyectoService";
import { notifyError, notifySuccess } from "../../utils/notify";
import { EstadoProyectoBadge, canFinishProyecto, formatShortDate, getProyectoEstado, getServicioNombre, getTotalHorasEstimadas, isProyectoActivo, normalizeHorasResumen, normalizeProyectoFases } from "./projectUtils";

const getTodayDateValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const LiderProjectsView = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [contentModal, setContentModal] = useState(null);
  const [search, setSearch] = useState("");
  const [horasByProyecto, setHorasByProyecto] = useState({});
  const [fasesByProyecto, setFasesByProyecto] = useState({});
  const [loadingHoras, setLoadingHoras] = useState(false);
  const [horasError, setHorasError] = useState("");

  // --- NUEVOS ESTADOS PARA H37 ---
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [proyectoAFinalizar, setProyectoAFinalizar] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setLoadingHoras(true);
    setError("");
    setHorasError("");

    try {
      const proyectosRes = await getMisProyectos();

      if (!proyectosRes?.success) {
        setProyectos([]);
        setError("No se pudieron cargar tus proyectos.");
        setHorasByProyecto({});
        setFasesByProyecto({});
        return;
      }

      const proyectosList = proyectosRes.data || [];
      setProyectos(proyectosList);

      const resumenEntries = await Promise.all(
        proyectosList.map(async (proyecto) => {
          try {
            const resumen = await getHorasResumenProyecto(proyecto.id_proyecto);
            return [proyecto.id_proyecto, normalizeHorasResumen(resumen, proyecto)];
          } catch {
            return [proyecto.id_proyecto, []];
          }
        })
      );

      const fasesEntries = await Promise.all(
        proyectosList.map(async (proyecto) => {
          try {
            const fases = await getFasesByProyecto(proyecto.id_proyecto);
            return [proyecto.id_proyecto, normalizeProyectoFases(fases)];
          } catch {
            return [proyecto.id_proyecto, []];
          }
        })
      );

      setHorasByProyecto(Object.fromEntries(resumenEntries));
      setFasesByProyecto(Object.fromEntries(fasesEntries));
    } catch {
      setProyectos([]);
      setHorasByProyecto({});
      setFasesByProyecto({});
      setError("Error al conectar con el servidor.");
      setHorasError("");
    } finally {
      setLoading(false);
      setLoadingHoras(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // --- SUBTAREA: FEEDBACK VISUAL (MENSAJES) ---
  const handleConfirmFinalizar = async () => {
    if (!proyectoAFinalizar) return;

    try {
      setLoading(true);
      const res = await finalizarProyecto(proyectoAFinalizar.id_proyecto);

      if (res.success) {
        notifySuccess("Proyecto finalizado correctamente. El registro de horas ha sido bloqueado.");
        setShowFinalizarModal(false);
        fetch(); // Recargar lista para ver el cambio de estado (is_active: false)
      } else {
        notifyError(res.message || "No se pudo finalizar el proyecto.");
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Error al procesar el cierre del proyecto.");
    } finally {
      setLoading(false);
    }
  };

  const getResumenProyecto = useCallback(
    (proyectoId) => horasByProyecto[proyectoId] || [],
    [horasByProyecto]
  );

  const getFasesProyecto = useCallback(
    (proyectoId) => fasesByProyecto[proyectoId] || [],
    [fasesByProyecto]
  );

  const filtered = proyectos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    getServicioNombre(p).toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Proyecto",
      render: (p) => {
        const active = isProyectoActivo(p) && !p.fecha_fin_real;
        return (
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32, background: active ? "rgba(79,70,229,.1)" : "rgba(100,116,139,.1)", flexShrink: 0 }}>
              <i className="bi bi-kanban" style={{ color: active ? "var(--primary)" : "#94a3b8", fontSize: 14 }}></i>
            </div>
            <div>
              <span className={`fw-semibold d-block ${!active ? "text-muted" : ""}`}>{p.nombre}</span>
              <EstadoProyectoBadge estado={getProyectoEstado(p)} className="mt-1" />
            </div>
          </div>
        );
      },
    },
    {
      header: "Horas estimadas",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (p) => {
        const fasesProyecto = getFasesProyecto(p.id_proyecto);
        const totalHorasEstimadas = getTotalHorasEstimadas(fasesProyecto);

        return (
          <>
            <span className="fw-bold" style={{ color: "var(--primary)" }}>
              {loadingHoras ? "..." : `${totalHorasEstimadas.toFixed(1)}h`}
            </span>
            {fasesProyecto.length > 0 && (
              <span className="d-block text-muted" style={{ fontSize: 11 }}>
                {fasesProyecto.length} fase{fasesProyecto.length !== 1 ? "s" : ""}
              </span>
            )}
          </>
        );
      },
    },
    {
      header: "Fecha inicio",
      cellClassName: "text-muted small",
      render: (p) => formatShortDate(p.fecha_inicio),
    },
    {
      header: "Fecha fin estimada",
      cellClassName: "text-muted small",
      render: (p) => formatShortDate(p.fecha_fin_estimada),
    },
    {
      header: "Fecha fin real",
      cellClassName: "text-muted small",
      render: (p) => p.fecha_fin_real ? <span className="text-success fw-semibold"><i className="bi bi-check-circle me-1"></i>{formatShortDate(p.fecha_fin_real)}</span> : "—",
    },
    { header: "Servicio", cellClassName: "text-muted small", render: (p) => getServicioNombre(p) },
  ];

  const filters = (
    <div className="input-group" style={{ maxWidth: 360 }}>
      <span className="input-group-text bg-white border-end-0">
        <i className="bi bi-search text-muted"></i>
      </span>
      <input type="text" className="form-control border-start-0 ps-0"
        placeholder="Buscar proyecto..." value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Proyectos que lidero</h2>
            <p className="text-muted small mb-0">
              {proyectos.length} proyecto{proyectos.length !== 1 ? "s" : ""} bajo tu liderazgo
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          error={error}
          rowKey="id_proyecto"
          filters={filters}
          emptyIcon="bi-kanban"
          emptyMessage="No hay proyectos"
          onRowClick={setSelected}
          rowClassName="animate-fadeIn"
          rowStyle={{ cursor: "pointer" }}
          renderActions={(p) => {
            const canFinish = canFinishProyecto(p);
            
            return (
              <div className="d-flex gap-2 justify-content-end">
                <button className="btn btn-sm btn-primary shadow-sm" title="Fases" onClick={() => setContentModal({ type: "fases", proyecto: p })}>
                  <i className="bi bi-layers"></i>
                </button>
                
                {canFinish ? (
                  <button
                    className="btn btn-sm btn-danger shadow-sm"
                    title="Finalizar Proyecto"
                    onClick={() => {
                      setProyectoAFinalizar(p);
                      setShowFinalizarModal(true);
                    }}
                  >
                    <i className="bi bi-check-circle-fill"></i>
                  </button>
                ) : (
                  <button className="btn btn-sm btn-light shadow-sm text-muted" title="Solo proyectos en ejecución pueden finalizarse" disabled>
                    <i className="bi bi-check-all"></i>
                  </button>
                )}
              </div>
            );
          }}
        />
      </div>

      {horasError && !loadingHoras && (
        <div className="alert alert-warning d-flex align-items-center small rounded-3 mt-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{horasError}
        </div>
      )}

      <ProyectoDetailModal
        proyecto={selected}
        horasResumen={selected ? getResumenProyecto(selected.id_proyecto) : []}
        fases={selected ? getFasesProyecto(selected.id_proyecto) : []}
        horasLoading={loadingHoras}
        horasError={horasError}
        onClose={() => setSelected(null)}
      />
      
      {contentModal && (
        <ProjectContentModal onClose={() => setContentModal(null)}>
          {contentModal.type === "fases" && (
            <FasesLists
              embedded
              proyectoId={contentModal.proyecto.id_proyecto}
              proyecto={contentModal.proyecto}
              horasResumen={getResumenProyecto(contentModal.proyecto.id_proyecto)}
              onChanged={fetch}
              onClose={() => setContentModal(null)}
            />
          )}
        </ProjectContentModal>    
      )}
      
      {showFinalizarModal && (
        <div className="modal-overlay" onClick={() => setShowFinalizarModal(false)}>
          <div className="modal-card p-0 animate-scaleIn" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="bg-danger p-3 text-white">
              <h6 className="fw-bold mb-0">Finalizar Proyecto</h6>
            </div>
            <div className="p-4">
              <p className="text-muted small">
                ¿Estás seguro de finalizar el proyecto <strong>{proyectoAFinalizar?.nombre}</strong>? 
                Esta operación es irreversible y bloqueará el registro de horas.
              </p>
              
              <div className="mb-3">
                <label className="form-label small fw-bold">Fecha de finalización real *</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm"
                  value={getTodayDateValue()}
                  disabled
                  readOnly
                />
              </div>

              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-light flex-fill fw-semibold" onClick={() => setShowFinalizarModal(false)}>Cancelar</button>
                <button className="btn btn-danger flex-fill fw-bold" onClick={handleConfirmFinalizar} disabled={loading}>
                  {loading ? "Procesando..." : "Confirmar Cierre"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LiderProjectsView;
