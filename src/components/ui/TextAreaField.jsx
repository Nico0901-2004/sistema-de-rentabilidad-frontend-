import React from "react";

const TextAreaField = ({
  label,
  error,
  helpText,
  className = "",
  labelClassName = "form-label fw-semibold small",
  textareaClassName = "",
  ...props
}) => (
  <div className={className}>
    {label && <label className={labelClassName}>{label}</label>}
    <textarea className={`form-control ${error ? "is-invalid" : ""} ${textareaClassName}`.trim()} {...props} />
    {helpText && <div className="form-text text-muted small">{helpText}</div>}
  </div>
);

export default TextAreaField;
