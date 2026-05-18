import React, { useEffect, useState } from "react";
import FormActions from "../../components/ui/FormActions";
import TextAreaField from "../../components/ui/TextAreaField";
import { createNota, updateNota } from "../../services/notaService";
import { notifySuccess, notifyError } from "../../utils/notify"; // Importación de utilidades de feedback

const EMPTY = {
  descripcion: "",
};

const NotasForm = ({ nota, proyectoId, onSaved, onCancel }) => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Límite máximo de caracteres definido en los criterios de aceptación
  const MAX_CARACTERES = 1000;

  useEffect(() => {
    if (!nota) {
      setForm(EMPTY);
      return;
    }

    setForm({
      descripcion: nota.descripcion || "",
    });
  }, [nota]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(""); // Limpiar error visual al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ── SUBTAREA: VALIDAR DESCRIPCIÓN ─────────────────────────────────
    const descripcion = form.descripcion.trim();
    
    // Criterio: La descripción de la nota es obligatoria
    if (!descripcion) {
      const msg = "La descripción de la nota es obligatoria.";
      setError(msg);
      notifyError(msg); // Feedback visual inmediato
      return;
    }

    // Criterio: El sistema debe validar el límite máximo de caracteres
    if (descripcion.length > MAX_CARACTERES) {
      const msg = `La descripción no puede superar los ${MAX_CARACTERES} caracteres.`;
      setError(msg);
      notifyError(msg); // Feedback visual inmediato
      return;
    }

    if (!nota?.id_nota && !proyectoId) {
      const msg = "Selecciona un proyecto antes de registrar notas.";
      setError(msg);
      notifyError(msg);
      return;
    }

    setLoading(true);
    try {
      const payload = { descripcion };
      const res = nota?.id_nota
        ? await updateNota(nota.id_nota, payload)
        : await createNota(proyectoId, payload);

      if (res?.success) {
        // ── SUBTAREA: FEEDBACK VISUAL (ÉXITO) ─────────────────────────
        notifySuccess(nota?.id_nota ? "Nota actualizada correctamente" : "Nota registrada con éxito");
        onSaved?.();
      } else {
        const msgError = res?.message || "Error al guardar la nota.";
        setError(msgError);
        notifyError(msgError); // Feedback visual de error del sistema
      }
    } catch (err) {
      // ── SUBTAREA: FEEDBACK VISUAL (ERROR TÉCNICO) ────────────────────
      const msgError = err.response?.data?.message || "Error de conexión con el servidor.";
      setError(msgError);
      notifyError(msgError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 rounded-4 mb-4 animate-scaleIn overflow-hidden shadow-sm">
      <div style={{ height: 4, background: "linear-gradient(90deg, #f59e0b, #d97706)" }}></div>
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">{nota?.id_nota ? "Editar nota" : "Nueva nota"}</h5>
            <p className="text-muted small mb-0">Registra observaciones sobre el desempeño o avance del proyecto</p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary rounded-3" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        </div>

        {/* Alerta interna para validaciones rápidas (UI/UX) */}
        {error && (
          <div className="alert alert-danger py-2 small rounded-3 mb-3 animate-fadeIn">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <TextAreaField
            className="mb-2"
            label="Descripción de la nota *"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            error={error}
            rows={5}
            maxLength={MAX_CARACTERES}
            placeholder="Escribe aquí las observaciones..."
            required
            disabled={loading}
          />

          {/* Contador de caracteres dinámico (Criterio Técnico) */}
          <div className="d-flex justify-content-end mb-3">
            <span className={`small ${form.descripcion.length >= MAX_CARACTERES ? "text-danger fw-bold" : "text-muted"}`}>
              {form.descripcion.length} / {MAX_CARACTERES}
            </span>
          </div>

          <FormActions
            onCancel={onCancel}
            loading={loading}
            loadingLabel="Procesando..."
            submitLabel={nota?.id_nota ? "Actualizar nota" : "Guardar nota"}
            submitClassName="btn btn-warning flex-fill fw-bold text-dark"
          />
        </form>
      </div>
    </div>
  );
};

export default NotasForm;
