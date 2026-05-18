import React from "react";

const ProjectContentModal = ({ children, onClose }) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal-card p-4 animate-scaleIn" style={{ maxWidth: 1120, maxHeight: "90vh", overflowY: "auto" }}>
      {children}
    </div>
  </div>
);

export default ProjectContentModal;
