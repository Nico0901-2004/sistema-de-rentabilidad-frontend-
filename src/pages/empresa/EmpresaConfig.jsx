import React, { useState, useEffect } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { getEmpresaById, updateEmpresa } from "../../services/empresaService";

const EmpresaConfig = () => {
  const { user, updateUser } = useAuth();
  const empresaId = user?.id_empresa;

  const [nombre, setNombre]   = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const getBackendMessage = (payload) => {
    if (!payload) return "";
    if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
    const firstErrorMsg = payload?.errors?.[0]?.msg;
    if (typeof firstErrorMsg === "string" && firstErrorMsg.trim()) return firstErrorMsg;
    return "";
  };

  useEffect(() => {
    if (!empresaId) {
      setMensaje({ texto: "No se encontró la empresa asociada a tu cuenta.", tipo: "danger" });
      setFetching(false);
      return;
    }

    getEmpresaById(empresaId)
      .then((res) => {
        // CORRECCIÓN: Manejo flexible por si la respuesta viene con la propiedad .data o directa
        const empresaData = res?.data || res;
        if (empresaData && (empresaData.nombre || empresaData.empresa_nombre)) {
          const nombreReal = empresaData.nombre || empresaData.empresa_nombre;
          setNombre(nombreReal);
          // Aprovechamos en sincronizar el Sidebar por si acaso
          updateUser({ empresa_nombre: nombreReal });
        } else {
          setMensaje({ texto: "No se pudo cargar la empresa.", tipo: "danger" });
        }
      })
      .catch(() => setMensaje({ texto: "Error al cargar los datos.", tipo: "danger" }))
      .finally(() => setFetching(false));
  }, [empresaId, updateUser]);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setMensaje({ texto: "El nombre no puede estar vacío.", tipo: "danger" });
      return;
    }
    if (nombre.trim().length < 3 || nombre.trim().length > 100) {
      setMensaje({ texto: "El nombre debe tener entre 3 y 100 caracteres.", tipo: "danger" });
      return;
    }
    try {
      setLoading(true);
      setMensaje({ texto: "", tipo: "" });
      const res = await updateEmpresa(empresaId, { nombre: nombre.trim() });
      
      // El backend puede retornar res.success o el objeto actualizado directamente
      if (res?.success || res) {
        setMensaje({ texto: "Cambios guardados correctamente.", tipo: "success" });
        
        // CORRECCIÓN: Actualizamos exactamente la propiedad que lee el Sidebar
        updateUser({ empresa_nombre: nombre.trim() });
      } else {
        setMensaje({ texto: getBackendMessage(res) || "Error al actualizar.", tipo: "danger" });
      }
    } catch (err) {
      setMensaje({ texto: getBackendMessage(err.response?.data) || "Error al actualizar la empresa.", tipo: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="animate-fadeInUp">
        <div className="page-header">
          <h2 className="fw-bold mb-1">Configuración de Empresa</h2>
          <p className="text-muted small mb-0">Configura la información de tu empresa</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-0 rounded-4 overflow-hidden" style={{ boxShadow: "var(--shadow-md)" }}>
              <div style={{ height: 4, background: "linear-gradient(90deg,var(--primary),var(--accent))" }}></div>
              <div className="card-body p-4 p-md-5">

                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 48, height: 48, background: "rgba(79,70,229,.1)" }}>
                    <i className="bi bi-building-fill" style={{ color: "var(--primary)", fontSize: 22 }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">Información de la empresa</h5>
                    <p className="text-muted small mb-0">ID de empresa: #{empresaId || "—"}</p>
                  </div>
                </div>

                {mensaje.texto && (
                  <div className={`alert alert-${mensaje.tipo} d-flex align-items-center py-2 small rounded-3 mb-4`}>
                    <i className={`bi ${mensaje.tipo === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"} me-2`}></i>
                    {mensaje.texto}
                  </div>
                )}

                {fetching ? (
                  <div className="skeleton rounded-3 mb-3" style={{ height: 44 }}></div>
                ) : (
                  <div className="mb-4">
                    <label className="form-label fw-semibold small">Nombre de la empresa</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre de tu empresa"
                      minLength={3}
                      maxLength={100}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* EL MENSAJE INFORMATIVO SE HA REMOVIDO CORRECTAMENTE DESDE AQUÍ */}

                <button
                  className="btn btn-primary w-100 py-2 fw-bold"
                  onClick={handleGuardar}
                  disabled={loading || fetching}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
                    : <><i className="bi bi-save me-2"></i>Guardar cambios</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmpresaConfig;
