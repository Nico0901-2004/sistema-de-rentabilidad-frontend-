import React from "react";
import Modal from "./Modal";

const ConfirmModal = ({
  show = true,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  warning = false,
  icon,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const isDanger = danger || (!warning && false);
  const tone = isDanger ? "danger" : warning ? "warning" : "primary";
  const iconName = icon || (isDanger ? "bi-trash-fill" : "bi-exclamation-triangle-fill");
  const iconColor = isDanger ? "var(--danger)" : warning ? "var(--warning)" : "var(--primary)";
  const iconBg = isDanger ? "rgba(239,68,68,.1)" : warning ? "rgba(245,158,11,.1)" : "rgba(79,70,229,.1)";

  return (
    <Modal show={show} onClose={onCancel} maxWidth={420} bodyClassName="p-4" hideClose>
      <div className="d-flex align-items-start gap-3 mb-4">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 44, height: 44, background: iconBg }}
        >
          <i className={`bi ${iconName}`} style={{ color: iconColor, fontSize: 20 }}></i>
        </div>
        <div>
          <h6 className="fw-bold mb-1">{title}</h6>
          <p className="text-muted small mb-0">{message}</p>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-light flex-fill fw-semibold" type="button" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button className={`btn btn-${tone} flex-fill fw-bold`} type="button" onClick={onConfirm} disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Procesando...</> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
