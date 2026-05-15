import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import {
  getMisHoras,
  createHora,
  updateHora,
  deleteHora,
} from "../../services/horasService";
import { getProyectosDisponibles } from "../../services/proyectoService";
import { notifySuccess, notifyError } from "../../utils/notify";

/* ── Prefijo que marca un registro de edición ─── */
const EDIT_PREFIX = "[EDICIÓN]";
const isEditRecord = (h) =>
  (h.descripcion || "").startsWith(EDIT_PREFIX);

const isSuperseded = (h) =>
  (h.descripcion || "").includes("[SUPERSEDIDO]");

/* ── Formulario registro / edición no destructiva */
const HorasFormModal = ({
  registro,
  onSaved,
  onCancel,
  isMandatory,
}) => {
  const isEdit = Boolean(registro);
  const [proyectos, setProyectos] = useState([]);

  const rawHoras = registro
    ? Math.max(0, Number(registro.horas || 0))
    : 0;

  const initBase = registro
    ? Math.min(8, Math.max(1, Math.round(rawHoras)))
    : 1;

  const initExtra = registro
    ? Math.min(
      10,
      Math.max(0, Math.round(rawHoras - initBase))
    )
    : 0;

  const [form, setForm] = useState({
    id_proyecto: registro?.id_proyecto || "",
    fecha:
      registro?.fecha?.slice(0, 10) ||
      new Date().toISOString().split("T")[0],
    horas_base: initBase,
    horas_extra: initExtra,
    descripcion: isEdit
      ? (registro.descripcion || "")
        .replace(EDIT_PREFIX, "")
        .replace(/\[SUPERSEDIDO por #\d+\]/, "")
        .trim()
      : "",
    motivo: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getProyectosDisponibles()
      .then((res) => {
        if (res?.success) setProyectos(res.data);
      })
      .catch(() => { });
  }, []);

  const handleChange = (e) =>
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));

  const totalHoras =
    Number(form.horas_base) +
    Number(form.horas_extra || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    if (totalHoras < 1 || totalHoras > 18) {
      setError(
        "El total de horas debe estar entre 1 y 18."
      );
      setLoading(false);
      return;
    }

    try {
      if (isEdit) {
        const motivoTxt = form.motivo.trim()
          ? ` — Motivo: ${form.motivo.trim()}`
          : "";

        const newDesc =
          `${EDIT_PREFIX} (ref. #${registro.id_registro}${motivoTxt}) ${form.descripcion}`.trim();

        await createHora({
          id_proyecto: Number(form.id_proyecto),
          fecha: form.fecha,
          horas: totalHoras,
          descripcion: newDesc,
        });

        // Marcar el original como supersedido
        const originalDesc = (
          registro.descripcion || ""
        ).replace(/\s*\[SUPERSEDIDO\]$/, "");

        await updateHora(registro.id_registro, {
          descripcion: `${originalDesc} [SUPERSEDIDO]`,
        }).catch(() => { });

        notifySuccess(
          "Registro de edición creado correctamente."
        );
      } else {
        await createHora({
          id_proyecto: Number(form.id_proyecto),
          fecha: form.fecha,
          horas: totalHoras,
          descripcion: form.descripcion || null,
        });

        notifySuccess(
          "¡Horas registradas correctamente!"
        );
      }

      setSuccess(true);

      setTimeout(() => {
        onSaved?.();
      }, 700);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Error al guardar el registro."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (isMandatory) return;

        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="modal-card p-4 animate-scaleIn">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0">
              {isEdit ? (
                <>
                  <i
                    className="bi bi-pencil-fill me-2"
                    style={{ color: "var(--warning)" }}
                  ></i>
                  Editar Registro
                </>
              ) : (
                "Registrar Horas"
              )}
            </h5>

            <p className="text-muted small mb-0">
              {isMandatory
                ? "Debes registrar las horas de tu jornada antes de finalizar."
                : isEdit
                  ? "Se creará un registro nuevo. El original queda como referencia."
                  : "Ingresa las horas trabajadas en un proyecto"}
            </p>
          </div>

          {!isMandatory && (
            <button
              className="btn btn-sm btn-light rounded-circle p-1 lh-1"
              onClick={onCancel}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        {isMandatory && (
          <div className="alert alert-warning py-2 small rounded-3 mb-3 animate-fadeIn">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>

            <strong>Acción obligatoria:</strong> No puedes
            cerrar este formulario sin registrar tus horas.
          </div>
        )}

        {isEdit && (
          <div
            className="alert d-flex align-items-start gap-2 small rounded-3 mb-3 py-2"
            style={{
              background: "rgba(245,158,11,.08)",
              border: "1px solid rgba(245,158,11,.3)",
              color: "#92400e",
            }}
          >
            <i className="bi bi-info-circle-fill flex-shrink-0 mt-1"></i>

            <div>
              <strong>Edición no destructiva:</strong> El
              registro original (#{registro.id_registro})
              no se modificará. Se creará uno nuevo marcado
              como edición.
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center py-2 small rounded-3 mb-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success d-flex align-items-center py-2 small rounded-3 mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>

            {isEdit
              ? "¡Registro de edición creado!"
              : "¡Horas registradas correctamente!"}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold small">
              Proyecto *
            </label>

            <select
              name="id_proyecto"
              value={form.id_proyecto}
              onChange={handleChange}
              className="form-select"
              required
              disabled={isEdit}
            >
              <option value="">
                — Selecciona un proyecto —
              </option>

              {proyectos.map((p) => (
                <option
                  key={p.id_proyecto}
                  value={p.id_proyecto}
                >
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small">
              Fecha *
            </label>

            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className="form-control"
              required
              max={
                new Date().toISOString().split("T")[0]
              }
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">
                Horas trabajadas *
                <span className="text-muted fw-normal ms-1">
                  (1 – 8)
                </span>
              </label>

              <select
                name="horas_base"
                value={form.horas_base}
                onChange={handleChange}
                className="form-select"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h}>
                    {h} hora{h !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">
                Horas extra
                <span className="text-muted fw-normal">
                  (opcional, 0 – 10)
                </span>
              </label>

              <input
                type="number"
                name="horas_extra"
                value={form.horas_extra}
                onChange={handleChange}
                className="form-control"
                min="0"
                max="10"
                step="1"
                placeholder="0"
              />
            </div>
          </div>

          <div
            className="mb-3 p-2 rounded-3 d-flex align-items-center gap-2"
            style={{
              background: "rgba(79,70,229,.06)",
            }}
          >
            <i
              className="bi bi-clock-fill"
              style={{ color: "var(--primary)" }}
            ></i>

            <span
              className="small fw-semibold"
              style={{ color: "var(--primary)" }}
            >
              Total a registrar:
            </span>

            <span
              className="badge badge-role badge-active ms-auto"
              style={{ fontSize: 13 }}
            >
              {totalHoras} hora
              {totalHoras !== 1 ? "s" : ""}
            </span>
          </div>

          {isEdit && (
            <div className="mb-3">
              <label className="form-label fw-semibold small">
                Motivo de la edición
                <span className="text-muted fw-normal">
                  (opcional pero recomendado)
                </span>
              </label>

              <input
                type="text"
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                className="form-control"
                placeholder="Ej: Error en las horas registradas..."
              />
            </div>
          )}

          <div className="mb-4">
            <label className="form-label fw-semibold small">
              {isEdit
                ? "Nueva descripción"
                : "Descripción de la tarea"}
            </label>

            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="form-control"
              rows={3}
              placeholder="Describe brevemente las tareas realizadas..."
            />
          </div>

          <div className="d-flex gap-2">
            {!isMandatory && (
              <button
                type="button"
                className="btn btn-light flex-fill fw-semibold"
                onClick={onCancel}
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              className="btn btn-primary flex-fill"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Guardando...
                </>
              ) : success ? (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Guardado
                </>
              ) : isEdit ? (
                <>
                  <i className="bi bi-pencil-fill me-2"></i>
                  Crear edición
                </>
              ) : (
                <>
                  <i className="bi bi-clock-history me-2"></i>
                  Registrar Horas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── ConfirmModal ────────────────────────────── */
const ConfirmDelete = ({
  onConfirm,
  onCancel,
  registro,
}) => (
  <div
    className="modal-overlay"
    onClick={(e) =>
      e.target === e.currentTarget && onCancel()
    }
  >
    <div
      className="modal-card p-4 animate-scaleIn"
      style={{ maxWidth: 400 }}
    >
      <div className="d-flex align-items-start gap-3 mb-4">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: 44,
            height: 44,
            background: "rgba(239,68,68,.1)",
          }}
        >
          <i
            className="bi bi-trash-fill"
            style={{
              color: "var(--danger)",
              fontSize: 20,
            }}
          ></i>
        </div>

        <div>
          <h6 className="fw-bold mb-1">
            Eliminar registro
          </h6>

          <p className="text-muted small mb-0">
            ¿Eliminar el registro del{" "}
            {new Date(
              registro.fecha
            ).toLocaleDateString("es-AR")}{" "}
            — {Number(registro.horas).toFixed(1)}h?
          </p>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button
          className="btn btn-light flex-fill fw-semibold"
          onClick={onCancel}
        >
          Cancelar
        </button>

        <button
          className="btn btn-danger flex-fill fw-bold"
          onClick={onConfirm}
        >
          <i className="bi bi-trash-fill me-2"></i>
          Eliminar
        </button>
      </div>
    </div>
  </div>
);

/* ── MisHorasList ────────────────────────────── */
const MisHorasList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Detectar flujo obligatorio
  const query = new URLSearchParams(location.search);

  const esRegistroObligatorio =
    query.get("registrar") === "true";

  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(
    esRegistroObligatorio
  );

  const [editingRegistro, setEditingRegistro] =
    useState(null);

  const [confirmDelete, setConfirmDelete] =
    useState(null);

  const fetchHoras = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getMisHoras();

      if (res.success) setHoras(res.data);
      else
        setError(
          "No se pudo cargar el historial."
        );
    } catch {
      setError(
        "Error al conectar con el servidor."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoras();
  }, [fetchHoras]);

  const handleSaved = () => {
    setShowForm(false);
    setEditingRegistro(null);

    fetchHoras();

    if (esRegistroObligatorio) {
      localStorage.removeItem("entrada_marcada");
      localStorage.removeItem("salida_marcada");

      navigate("/mis-horas", {
        replace: true,
      });
    }
  };

  const handleCancel = () => {
    if (esRegistroObligatorio) {
      notifyError(
        "Es obligatorio registrar tus horas para cerrar el ciclo de marcaje."
      );
      return;
    }

    setShowForm(false);
    setEditingRegistro(null);
  };

  const handleEdit = (h) => {
    setEditingRegistro(h);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;

    try {
      await deleteHora(
        confirmDelete.id_registro
      );

      notifySuccess(
        "Registro eliminado correctamente."
      );

      fetchHoras();
    } catch (err) {
      notifyError(
        err.response?.data?.message ||
        "Error al eliminar."
      );
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = horas.filter(
    (h) =>
      (h.proyecto_nombre || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (h.descripcion || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const totalHoras = filtered.reduce(
    (acc, h) => acc + Number(h.horas || 0),
    0
  );

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">
              Mis Horas
            </h2>

            <p className="text-muted small mb-0">
              Historial de horas registradas en
              proyectos
            </p>
          </div>

          <button
            className="btn btn-primary d-flex align-items-center gap-2 px-4"
            disabled={esRegistroObligatorio}
            onClick={() => {
              setEditingRegistro(null);
              setShowForm(true);
            }}
          >
            <i className="bi bi-clock-history"></i>
            Registrar Horas
          </button>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4 stagger">
          {[
            {
              label: "Total registros",
              value: horas.length,
              icon: "bi-list-check",
              color: "var(--primary)",
              bg: "rgba(79,70,229,.1)",
            },
            {
              label: "Total horas",
              value: `${horas
                .reduce(
                  (a, h) =>
                    a + Number(h.horas || 0),
                  0
                )
                .toFixed(1)}h`,
              icon: "bi-clock-fill",
              color: "var(--accent)",
              bg: "rgba(6,182,212,.1)",
            },
            {
              label: "Proyectos activos",
              value: new Set(
                horas.map((h) => h.id_proyecto)
              ).size,
              icon: "bi-kanban-fill",
              color: "var(--success)",
              bg: "rgba(16,185,129,.1)",
            },
          ].map((s, i) => (
            <div
              className="col-12 col-sm-4"
              key={i}
            >
              <div className="stat-card card-3d animate-fadeInUp">
                <div
                  className="stat-card__glow"
                  style={{
                    background: s.color,
                  }}
                ></div>

                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: 44,
                      height: 44,
                      background: s.bg,
                    }}
                  >
                    <i
                      className={`bi ${s.icon}`}
                      style={{
                        color: s.color,
                        fontSize: 20,
                      }}
                    ></i>
                  </div>

                  <div>
                    <p className="text-muted small mb-0">
                      {s.label}
                    </p>

                    <h4
                      className="fw-bold mb-0"
                      style={{
                        color: s.color,
                      }}
                    >
                      {s.value}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
          <div
            className="input-group"
            style={{ maxWidth: 360 }}
          >
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>

            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Buscar por proyecto o descripción..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {search && (
            <span className="text-muted small">
              {filtered.length} resultado
              {filtered.length !== 1
                ? "s"
                : ""}{" "}
              —&nbsp;
              <strong
                style={{
                  color: "var(--primary)",
                }}
              >
                {totalHoras.toFixed(1)}h
              </strong>
            </span>
          )}
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center small rounded-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        <div
          className="card border-0 rounded-4 overflow-hidden"
          style={{
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="table-responsive">
            <table className="table table-modern mb-0">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>ID</th>
                  <th>Proyecto / Fase</th>
                  <th>Fecha</th>
                  <th>Horas</th>
                  <th>Descripción</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map(
                    (_, i) => (
                      <tr key={i}>
                        {Array.from({
                          length: 6,
                        }).map((_, j) => (
                          <td key={j}>
                            <div
                              className="skeleton rounded"
                              style={{
                                height: 20,
                                width: "80%",
                              }}
                            ></div>
                          </td>
                        ))}
                      </tr>
                    )
                  )
                ) : filtered.length > 0 ? (
                  filtered.map((h) => {
                    const isEdit =
                      isEditRecord(h);

                    const isSuper =
                      isSuperseded(h);

                    const desc = (
                      h.descripcion || ""
                    )
                      .replace(
                        EDIT_PREFIX,
                        ""
                      )
                      .replace(
                        /\s*\(ref\. #\d+[^)]*\)/,
                        ""
                      )
                      .replace(
                        /\s*\[SUPERSEDIDO\]$/,
                        ""
                      )
                      .trim();

                    return (
                      <tr
                        key={h.id_registro}
                        className="animate-fadeIn"
                        style={{
                          opacity: isSuper
                            ? 0.5
                            : 1,
                        }}
                      >
                        {/* ID */}
                        <td
                          className="fw-bold text-muted"
                          style={{
                            fontSize: 12,
                          }}
                        >
                          <div>
                            #{h.id_registro}
                          </div>

                          {isEdit && (
                            <span
                              className="badge badge-role badge-edit mt-1"
                              style={{
                                fontSize: 9,
                              }}
                            >
                              Edición
                            </span>
                          )}

                          {isSuper && (
                            <span
                              className="badge badge-role badge-inactive mt-1"
                              style={{
                                fontSize: 9,
                              }}
                            >
                              Supersedido
                            </span>
                          )}
                        </td>

                        {/* PROYECTO + FASE */}
                        <td>
                          <div className="d-flex align-items-start gap-2">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center"
                              style={{
                                width: 28,
                                height: 28,
                                background:
                                  "rgba(79,70,229,.1)",
                                flexShrink: 0,
                              }}
                            >
                              <i
                                className="bi bi-kanban"
                                style={{
                                  color:
                                    "var(--primary)",
                                  fontSize: 12,
                                }}
                              ></i>
                            </div>

                            <div className="d-flex flex-column">
                              <span
                                className="fw-bold text-dark"
                                style={{
                                  fontSize: "13px",
                                  lineHeight: 1.2,
                                }}
                              >
                                {h.proyecto_nombre ||
                                  "Proyecto sin nombre"}
                              </span>

                              <span
                                className="text-primary fw-semibold"
                                style={{
                                  fontSize: "11px",
                                }}
                              >
                                <i className="bi bi-layers-half me-1"></i>

                                {h.fase_nombre ||
                                  "Fase: General"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* FECHA */}
                        <td className="text-muted small">
                          {h.fecha
                            ? new Date(
                              h.fecha
                            ).toLocaleDateString(
                              "es-AR"
                            )
                            : "—"}
                        </td>

                        {/* HORAS */}
                        <td>
                          <span
                            className={`badge rounded-pill ${isSuper
                              ? "bg-secondary"
                              : "bg-success"
                              } px-3`}
                          >
                            {Number(
                              h.horas
                            ).toFixed(1)}
                            h
                          </span>
                        </td>

                        {/* DESCRIPCIÓN */}
                        <td
                          className="text-muted small"
                          style={{
                            maxWidth: 220,
                          }}
                        >
                          {isEdit && (
                            <div
                              className="mb-1"
                              style={{
                                fontSize: 10,
                                color: "#92400e",
                              }}
                            >
                              <i className="bi bi-pencil-fill me-1"></i>

                              {(h.descripcion || "").match(
                                /\(ref\. #\d+[^)]*\)/
                              )?.[0] || ""}
                            </div>
                          )}

                          <span
                            className="text-truncate d-block"
                            style={{
                              maxWidth: "200px",
                            }}
                            title={desc}
                          >
                            {desc || "—"}
                          </span>
                        </td>

                        {/* ACCIONES */}
                        <td className="text-end">
                          {!isSuper && (
                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                className="btn btn-sm btn-outline-warning border-0"
                                title="Editar (no destructivo)"
                                onClick={() =>
                                  handleEdit(h)
                                }
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger border-0"
                                title="Eliminar"
                                onClick={() =>
                                  setConfirmDelete(
                                    h
                                  )
                                }
                              >
                                <i className="bi bi-trash-fill"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <i className="bi bi-clock-history"></i>

                        <h6>
                          Sin registros
                        </h6>

                        <p>
                          Comienza registrando
                          tus horas con el botón
                          de arriba.
                        </p>
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
        <HorasFormModal
          registro={editingRegistro}
          isMandatory={
            esRegistroObligatorio
          }
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      )}

      {confirmDelete && (
        <ConfirmDelete
          registro={confirmDelete}
          onConfirm={
            handleDeleteConfirm
          }
          onCancel={() =>
            setConfirmDelete(null)
          }
        />
      )}
    </Layout>
  );
};

export default MisHorasList;