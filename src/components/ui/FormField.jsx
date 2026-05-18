import React from "react";

const FormField = ({
  label,
  error,
  helpText,
  className = "",
  labelClassName = "form-label fw-semibold small",
  inputClassName = "",
  ...props
}) => (
  <div className={className}>
    {label && <label className={labelClassName}>{label}</label>}
    <input className={`form-control ${error ? "is-invalid" : ""} ${inputClassName}`.trim()} {...props} />
    {helpText && <div className="form-text text-muted small">{helpText}</div>}
  </div>
);

export default FormField;
