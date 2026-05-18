import React from "react";

const FormActions = ({
  onCancel,
  loading = false,
  submitLabel = "Guardar",
  loadingLabel = "Guardando...",
  cancelLabel = "Cancelar",
  submitClassName = "btn btn-primary flex-fill fw-bold",
  cancelClassName = "btn btn-light fw-semibold px-4",
  showCancel = true,
}) => (
  <div className="d-flex gap-2 mt-4">
    {showCancel && (
      <button type="button" className={cancelClassName} onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </button>
    )}
    <button type="submit" className={submitClassName} disabled={loading}>
      {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>{loadingLabel}</> : submitLabel}
    </button>
  </div>
);

export default FormActions;
