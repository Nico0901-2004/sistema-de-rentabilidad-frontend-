import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import EmpresaForm from "./EmpresaForm";
import { getEmpresas } from "../../services/empresaService";
import { getPropietarios } from "../../services/usuarioService";

const EmpresaList = () => {
  const [empresas, setEmpresas] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [empresaId, setEmpresaId] = useState(null);
  const [editingOwner, setEditingOwner] = useState(null);

  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [empRes, ownerRes] = await Promise.all([
        getEmpresas(),
        getPropietarios().catch(() => ({ data: [] })),
      ]);

      if (empRes?.success) setEmpresas(empRes.data);
      setOwners(ownerRes?.data || []);
    } catch {
      setError("Error al cargar empresas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ownerOf = (id_empresa) => owners.find((o) => String(o.id_empresa) === String(id_empresa));

  // ✅ filtro usando empresa_nombre (que es lo que viene del backend)
  const filtered = empresas.filter((e) =>
    (e.empresa_nombre || "").toLowerCase().includes(search.toLowerCase())
  );

  // ✅ stats correctos usando propietario_nombre
  const empresasConOwner = empresas.filter((e) => e.propietario_nombre);
  const empresasSinOwner = empresas.filter((e) => !e.propietario_nombre);

  return (
    <Layout>
      <div className="animate-fadeInUp">
        {/* Header */}
        <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">Empresas del Sistema</h2>
            <p className="text-muted small mb-0">
              {empresas.length} empresa{empresas.length !== 1 ? "s" : ""} registradas
            </p>
          </div>

          <button
            className="btn btn-primary d-flex align-items-center gap-2 px-4"
            onClick={() => {
              setEmpresaId(null);
              setEditingOwner(null);
              setShowModal(true);
            }}
          >
            <i className="bi bi-building-add"></i>
            Nueva Empresa
          </button>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4 stagger">
          {[
            {
              label: "Total empresas",
              value: empresas.length,
              icon: "bi-building-fill",
              color: "var(--primary)",
              bg: "rgba(79,70,229,.1)",
            },
            {
              label: "Con propietario",
              value: empresasConOwner.length,
              icon: "bi-person-check-fill",
              color: "var(--success)",
              bg: "rgba(16,185,129,.1)",
            },
            {
              label: "Sin propietario",
              value: empresasSinOwner.length,
              icon: "bi-person-x-fill",
              color: "var(--warning)",
              bg: "rgba(245,158,11,.1)",
            },
          ].map((s, i) => (
            <div className="col-12 col-sm-4" key={i}>
              <div className="stat-card card-3d animate-fadeInUp">
                <div className="stat-card__glow" style={{ background: s.color }}></div>
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 44, height: 44, background: s.bg }}
                  >
                    <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: 20 }}></i>
                  </div>
                  <div>
                    <p className="text-muted small mb-0">{s.label}</p>
                    <h4 className="fw-bold mb-0" style={{ color: s.color }}>
                      {loading ? "…" : s.value}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-3">
          <div className="input-group" style={{ maxWidth: 360 }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center small rounded-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="row g-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="col-12 col-md-6 col-lg-4" key={i}>
                <div className="card border-0 rounded-4 p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <div className="skeleton rounded mb-3" style={{ height: 20, width: "60%" }}></div>
                  <div className="skeleton rounded mb-2" style={{ height: 14, width: "80%" }}></div>
                  <div className="skeleton rounded" style={{ height: 14, width: "50%" }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="row g-3 stagger">
            {filtered.map((empresa) => {
              // si existe owner en el endpoint /usuarios/propietarios lo usamos para email/avatar
              const owner = ownerOf(empresa.id_empresa);

              return (
                <div className="col-12 col-md-6 col-lg-4" key={empresa.id_empresa}>
                  <div
                    className="card border-0 rounded-4 h-100 card-3d animate-fadeInUp overflow-hidden"
                    style={{ boxShadow: "var(--shadow-md)" }}
                  >
                    {/* Accent bar */}
                    <div style={{ height: 4, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}></div>

                    <div className="p-4">
                      {/* Empresa info */}
                      <div className="d-flex align-items-start justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center"
                            style={{
                              width: 44,
                              height: 44,
                              background: "rgba(79,70,229,.1)",
                              flexShrink: 0,
                            }}
                          >
                            <i className="bi bi-building-fill" style={{ color: "var(--primary)", fontSize: 20 }}></i>
                          </div>

                          <div>
                            <h6 className="fw-bold mb-0">{empresa.empresa_nombre}</h6>
                            <span className="text-muted" style={{ fontSize: 12 }}>
                              ID #{empresa.id_empresa}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Propietario */}
                      <div
                        className="rounded-3 p-3 mb-3"
                        style={{
                          background: empresa.propietario_nombre
                            ? "rgba(16,185,129,.06)"
                            : "rgba(245,158,11,.06)",
                        }}
                      >
                        {empresa.propietario_nombre ? (
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                              {empresa.propietario_nombre
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="fw-semibold mb-0" style={{ fontSize: 13 }}>
                                {empresa.propietario_nombre}
                              </p>

                              {/* Si existe el owner completo, mostramos email */}
                              <p className="text-muted mb-0" style={{ fontSize: 11 }}>
                                {owner?.email || "Propietario asignado"}
                              </p>
                            </div>

                            <span className="badge badge-role badge-propietario ms-auto">
                              Propietario
                            </span>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-2 text-warning">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            <span style={{ fontSize: 12 }} className="fw-medium">
                              Sin propietario asignado
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-success flex-fill fw-semibold"
                          onClick={() => {
                            setEmpresaId(empresa.id_empresa);
                            setEditingOwner(owner || null);
                            setShowModal(true);
                          }}
                        >
                          <i className="bi bi-pencil-square me-1"></i>Editar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card border-0 rounded-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div className="empty-state">
              <i className="bi bi-building"></i>
              <h6>No hay empresas</h6>
              <p>Crea la primera empresa con el botón de arriba.</p>
            </div>
          </div>
        )}
      </div>

      <EmpresaForm
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingOwner(null);
        }}
        onSuccess={fetchData}
        empresaId={empresaId}
        owner={editingOwner}
      />
    </Layout>
  );
};

export default EmpresaList;
