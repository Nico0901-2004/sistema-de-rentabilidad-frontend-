import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 
import { getMisMarcajes, marcarEntrada, marcarSalida, createHora, getMisHoras } from "../../services/horasService";
import { getMisProyectos } from "../../services/proyectoService";
import { getFasesByProyecto } from "../../services/faseService";
import { notifyError, notifySuccess, notifyInfo } from "../../utils/notify";

const getTodayDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getTodayUtcDate = () => new Date().toISOString().slice(0, 10);
const getTodayKey = () => `marcaje_${getTodayDate()}`;

const ButtonMarcaje = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const storageKey = useMemo(() => getTodayKey(), []);
  
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState("idle");
  const [mensaje, setMensaje] = useState("");
  const [marcaje, setMarcaje] = useState({ entrada: false, salida: false });

  // Estados para el control dinámico multiproyecto
  const [showModalHoras, setShowModalHoras] = useState(false);
  const [proyectosDisponibles, setProyectosDisponibles] = useState([]);
  const [fasesPorProyecto, setFasesPorProyecto] = useState({}); 
  const [filasHoras, setFilasHoras] = useState([
    { id_proyecto: "", id_fase: "", horas: 0.5, descripcion: "" }
  ]);
  const [errorModal, setErrorModal] = useState("");

  const cargarEstadoMarcaje = useCallback(async () => {
    try {
      const res = await getMisMarcajes();
      const list = Array.isArray(res?.data) ? res.data : [];
      const hoyLocal = getTodayDate();
      const hoyUtc = getTodayUtcDate();
      const fechaSet = new Set([hoyLocal, hoyUtc]);

      const deHoy = list.find((item) => fechaSet.has(String(item?.fecha || "").slice(0, 10)));
      const abierta = list.find((item) => Boolean(item?.hora_entrada) && !item?.hora_salida);

      const entrada = Boolean((deHoy || abierta)?.hora_entrada);
      const salida = Boolean((deHoy || abierta)?.hora_salida);

      setMarcaje({ entrada, salida });
      localStorage.setItem(storageKey, JSON.stringify({ entrada, salida }));
    } catch {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMarcaje({ entrada: Boolean(parsed?.entrada), salida: Boolean(parsed?.salida) });
        } catch {
          setMarcaje({ entrada: false, salida: false });
        }
      }
    }
  }, [storageKey]);

  useEffect(() => {
    cargarEstadoMarcaje();
  }, [cargarEstadoMarcaje]);

  const handleMarcarEntrada = async () => {
    if (loading || marcaje.entrada) return;
    try {
      setLoading(true);
      setEstado("idle");
      setMensaje("");

      const res = await marcarEntrada();
      const okMessage = res?.message || "Entrada registrada correctamente";

      setMarcaje({ entrada: true, salida: false });
      setEstado("success");
      setMensaje(okMessage);
      localStorage.setItem(storageKey, JSON.stringify({ entrada: true, salida: false }));
      notifySuccess(okMessage);
      await cargarEstadoMarcaje();
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      const errorMessage = backendMessage || "No se pudo registrar la entrada.";
      setEstado("error");
      setMensaje(errorMessage);
      notifyError(errorMessage);
      await cargarEstadoMarcaje();
    } finally {
      setLoading(false);
    }
  };

  // ── NUEVO FLUJO INTERCEPTOR DE SALIDA ──
  const handlePreMarcarSalida = async () => {
    if (loading || !marcaje.entrada || marcaje.salida) return;
    try {
      setLoading(true);
      setEstado("idle");
      setMensaje("");

      // 1. Si el rol es Líder, ellos no imputan horas en bloques masivos, marcan salida directo.
      if (user?.rol === "lider") {
        const resSalida = await marcarSalida();
        const okMessage = resSalida?.message || "Salida registrada de forma exitosa.";
        setMarcaje({ entrada: true, salida: true });
        localStorage.setItem(storageKey, JSON.stringify({ entrada: true, salida: true }));
        setEstado("success");
        setMensaje(okMessage);
        notifySuccess(okMessage);
        await cargarEstadoMarcaje();
        return;
      }

      // 2. Si es Empleado, cargamos sus proyectos activos y abrimos el modal PRIMERO
      let resProyectos = await getMisProyectos(); 
      const proyectos = resProyectos?.success ? resProyectos.data : (Array.isArray(resProyectos) ? resProyectos : []);
      
      setProyectosDisponibles(proyectos);
      setFilasHoras([{ id_proyecto: "", id_fase: "", horas: 0.5, descripcion: "" }]);
      setErrorModal("");
      
      // Desplegamos el modal para el llenado mandatorio
      setShowModalHoras(true);
    } catch (error) {
      notifyError("Error al inicializar el proceso de salida.");
    } finally {
      setLoading(false);
    }
  };

  const handleProyectoChange = async (index, idProyecto) => {
    const nuevasFilas = [...filasHoras];
    nuevasFilas[index].id_proyecto = idProyecto;
    nuevasFilas[index].id_fase = "";
    setFilasHoras(nuevasFilas);

    if (!idProyecto) return;

    if (!fasesPorProyecto[idProyecto]) {
      try {
        const res = await getFasesByProyecto(idProyecto);
        const fases = res?.success ? res.data : (Array.isArray(res) ? res : []);
        setFasesPorProyecto(prev => ({ ...prev, [idProyecto]: fases }));
      } catch (err) {
        notifyError("No se pudieron obtener las fases de este proyecto.");
      }
    }
  };

  const handleFilaChange = (index, campo, valor) => {
    const nuevasFilas = [...filasHoras];
    nuevasFilas[index][campo] = valor;
    setFilasHoras(nuevasFilas);
  };

  const agregarFila = () => {
    setFilasHoras([...filasHoras, { id_proyecto: "", id_fase: "", horas: 0.5, descripcion: "" }]);
  };

  const eliminarFila = (index) => {
    if (filasHoras.length > 1) {
      setFilasHoras(filasHoras.filter((_, i) => i !== index));
    }
  };

  // ── SE ENVÍAN LAS HORAS Y LUEGO AUTOMÁTICAMENTE SE MARCA LA SALIDA OFICIAL ──
  const handleGuardarHorasMasivas = async (e) => {
    e.preventDefault();
    setErrorModal("");

    let totalHorasDia = 0;
    for (const fila of filasHoras) {
      if (!fila.id_proyecto) return setErrorModal("Por favor, selecciona un proyecto en todas las filas.");
      if (!fila.id_fase) return setErrorModal("Por favor, selecciona una fase asociada para cada proyecto.");
      if (Number(fila.horas) < 0.5 || Number(fila.horas) > 12) return setErrorModal("Cada registro debe tener entre 0.5 y 12 horas.");
      totalHorasDia += Number(fila.horas);
    }

    if (totalHorasDia > 12) {
      return setErrorModal("El total de horas acumuladas para el día de hoy no puede superar las 12 horas.");
    }

    try {
      setLoading(true);

      // A) Guardamos cada uno de los registros de tiempos
      for (const fila of filasHoras) {
        const payloadHora = {
          id_proyecto: Number(fila.id_proyecto),
          id_fase: Number(fila.id_fase),
          horas: Number(fila.horas),
          descripcion: fila.descripcion.trim() || null
        };
        await createHora(payloadHora);
      }

      notifySuccess("¡Horas del día guardadas correctamente!");

      // B) AUTOMÁTICO: Como las horas ya se guardaron con éxito, marcamos la salida real en el servidor
      const resSalida = await marcarSalida();
      const okMessage = resSalida?.message || "Salida registrada de forma exitosa.";

      setMarcaje({ entrada: true, salida: true });
      localStorage.setItem(storageKey, JSON.stringify({ entrada: true, salida: true }));
      
      setEstado("success");
      setMensaje(okMessage);
      notifySuccess(okMessage);

      setShowModalHoras(false);
      await cargarEstadoMarcaje();
      navigate("/mis-horas", { replace: true });
    } catch (error) {
      const errMsg = error?.response?.data?.message || "Error al intentar finalizar la jornada.";
      setErrorModal(errMsg);
      notifyError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!marcaje.entrada && (
        <button className="btn btn-sm w-100 btn-success fw-bold animate-fadeIn" onClick={handleMarcarEntrada} disabled={loading}>
          <i className={`bi ${loading ? "bi-hourglass-split animate-spin" : "bi-box-arrow-in-right"} me-2`}></i>
          {loading ? "Marcando..." : "Marcar Entrada"}
        </button>
      )}

      {marcaje.entrada && !marcaje.salida && (
        <button className="btn btn-sm w-100 btn-warning fw-bold text-dark animate-fadeIn" onClick={handlePreMarcarSalida} disabled={loading}>
          <i className={`bi ${loading ? "bi-hourglass-split animate-spin" : "bi-box-arrow-right"} me-2`}></i>
          {loading ? "Procesando..." : "Marcar Salida"}
        </button>
      )}

      {marcaje.entrada && marcaje.salida && (
        <button className="btn btn-sm w-100 btn-secondary fw-bold animate-fadeIn" disabled>
          <i className="bi bi-check2-circle me-2"></i> Jornada Finalizada
        </button>
      )}

      {estado === "success" && mensaje && (
        <div className="alert alert-success py-2 small mb-0 mt-2 border-0 text-center animate-fadeIn">{mensaje}</div>
      )}
      {estado === "error" && mensaje && (
        <div className="alert alert-danger py-2 small mb-0 mt-2 border-0 text-center animate-fadeIn">{mensaje}</div>
      )}

      {/* MODAL MULTIPROYECTO DE REGISTRO DE HORAS PRE-SALIDA */}
      {showModalHoras && (
        <div className="modal-overlay" style={{ zIndex: 1060 }}>
          <div className="modal-card p-4 animate-scaleIn" style={{ maxWidth: "700px", width: "90%" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0">Imputación Diaria de Tiempos</h5>
                <p className="text-muted small mb-0">Distribuye tus horas trabajadas del día en tus proyectos obligatoriamente para poder registrar tu salida.</p>
              </div>
            </div>

            {errorModal && (
              <div className="alert alert-danger py-2 small rounded-3 mb-3 animate-fadeIn">
                <i className="bi bi-exclamation-circle-fill me-2"></i>{errorModal}
              </div>
            )}

            <form onSubmit={handleGuardarHorasMasivas}>
              <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }} className="mb-3">
                {filasHoras.map((fila, index) => (
                  <div key={index} className="p-3 border rounded-3 mb-3 bg-light relative animate-fadeIn">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-secondary small">Asignación #{index + 1}</span>
                      {filasHoras.length > 1 && (
                        <button type="button" className="btn btn-sm btn-outline-danger border-0 p-1 lh-1" onClick={() => eliminarFila(index)}>
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      )}
                    </div>

                    <div className="row g-2">
                      {/* Selector Proyecto */}
                      <div className="col-12 col-sm-6">
                        <label className="fw-semibold small mb-1">Proyecto *</label>
                        <select 
                          className="form-select form-select-sm" 
                          value={fila.id_proyecto} 
                          onChange={(e) => handleProyectoChange(index, e.target.value)} 
                          required
                        >
                          <option value="">— Selecciona proyecto —</option>
                          {proyectosDisponibles.map(p => (
                            <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre || p.proyecto_nombre}</option>
                          ))}
                        </select>
                      </div>

                      {/* Selector Fase Relacional */}
                      <div className="col-12 col-sm-6">
                        <label className="fw-semibold small mb-1">Fase del Proyecto *</label>
                        <select 
                          className="form-select form-select-sm" 
                          value={fila.id_fase} 
                          onChange={(e) => handleFilaChange(index, "id_fase", e.target.value)} 
                          disabled={!fila.id_proyecto} 
                          required
                        >
                          <option value="">— Selecciona fase —</option>
                          {(fasesPorProyecto[fila.id_proyecto] || []).map(f => (
                            <option key={f.id_fase} value={f.id_fase}>{f.nombre || f.fase_nombre}</option>
                          ))}
                        </select>
                      </div>

                      {/* Cantidad Horas */}
                      <div className="col-4 col-sm-3">
                        <label className="fw-semibold small mb-1">Horas *</label>
                        <input 
                          type="number" 
                          className="form-control form-control-sm" 
                          min="0.5" max="12" step="0.5" 
                          value={fila.horas} 
                          onChange={(e) => handleFilaChange(index, "horas", e.target.value)} 
                          required 
                        />
                      </div>

                      {/* Descripción Corta */}
                      <div className="col-8 col-sm-9">
                        <label className="fw-semibold small mb-1">Descripción de actividades</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          placeholder="Ej. Desarrollo de componentes de interfaz..." 
                          value={fila.descripcion} 
                          onChange={(e) => handleFilaChange(index, "descripcion", e.target.value)} 
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <button type="button" className="btn btn-sm btn-outline-primary fw-semibold" onClick={agregarFila}>
                  <i className="bi bi-plus-circle me-1"></i> Añadir otro proyecto / fase
                </button>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-warning flex-fill fw-bold text-dark w-100" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Guardando y Marcando Salida...</>
                  ) : (
                    <><i className="bi bi-check-lg me-1"></i> Guardar Horas y Registrar Salida</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ButtonMarcaje;