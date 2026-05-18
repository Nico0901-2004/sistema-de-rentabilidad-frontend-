import React, { useState, useEffect } from "react";
import FormActions from "../../components/ui/FormActions";
import FormField from "../../components/ui/FormField";
import TextAreaField from "../../components/ui/TextAreaField";
import {
  createServicio,
  updateServicio,
  getServicioById,
} from "../../services/servicioService";
import { notifySuccess, notifyError } from "../../utils/notify";

const ServicioForm = ({ servicioId, onSaved, onCancel }) => {
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!servicioId) return;
    getServicioById(servicioId)
      .then((res) => {
        if (res?.success) {
          setForm({
            nombre: res.data.nombre || "",
            descripcion: res.data.descripcion || "",
          });
        }
      })
      .catch(() => setError("No se pudo cargar el servicio."));
  }, [servicioId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = servicioId
        ? await updateServicio(servicioId, form)
        : await createServicio(form);

      if (response?.success) {
        notifySuccess(servicioId ? "Servicio actualizado correctamente" : "Servicio creado correctamente");
        onSaved?.();
      } else {
        const msg = response?.message || "Error al guardar el servicio.";
        setError(msg);
        notifyError(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Error al guardar el servicio.";
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4 rounded-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-bold">
            {servicioId ? "Editar servicio" : "Crear nuevo servicio"}
          </h5>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-3"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>

        {error && <div className="alert alert-danger small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <FormField
            className="mb-3"
            label="Nombre"
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            inputClassName="bg-light border-0"
            required
            minLength={3}
          />
          <TextAreaField
            className="mb-4"
            label={<><span>Descripción </span><span className="text-muted fw-normal">(opcional)</span></>}
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            textareaClassName="bg-light border-0"
            rows={3}
          />
          <FormActions
            showCancel={false}
            loading={loading}
            submitClassName="btn btn-primary w-100"
            submitLabel={servicioId ? "Guardar cambios" : "Crear servicio"}
          />
        </form>
      </div>
    </div>
  );
};

export default ServicioForm;
