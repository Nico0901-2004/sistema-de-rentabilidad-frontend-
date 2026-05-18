import React from "react";

const Modal = ({
  show,
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = 520,
  className = "",
  bodyClassName = "p-4",
  hideClose = false,
  closeOnBackdrop = true,
  accent,
  zIndex,
}) => {
  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      style={zIndex ? { zIndex } : undefined}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className={`modal-card animate-scaleIn ${className}`} style={{ maxWidth }}>
        {accent && <div style={{ height: 4, background: accent }}></div>}

        {(title || !hideClose) && (
          <div className="d-flex justify-content-between align-items-start gap-3 p-4 pb-0">
            <div>
              {title && <h5 className="fw-bold mb-0">{title}</h5>}
              {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
            </div>

            {!hideClose && (
              <button className="btn btn-sm btn-light rounded-circle p-1 lh-1" type="button" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        )}

        <div className={bodyClassName}>{children}</div>

        {footer && <div className="d-flex gap-2 p-4 pt-0">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
