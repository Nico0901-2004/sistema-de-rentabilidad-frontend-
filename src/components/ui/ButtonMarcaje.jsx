import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMisMarcajes, marcarEntrada, marcarSalida } from "../../services/horasService";
import { notifyError, notifySuccess } from "../../utils/notify";

const getTodayDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getTodayUtcDate = () => new Date().toISOString().slice(0, 10);

const getTodayKey = () => `marcaje_${getTodayDate()}`;

const ButtonMarcaje = () => {
  const navigate = useNavigate();
  const storageKey = useMemo(() => getTodayKey(), []);
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState("idle");
  const [mensaje, setMensaje] = useState("");
  const [marcaje, setMarcaje] = useState({ entrada: false, salida: false });

  const cargarEstadoMarcaje = useCallback(async () => {
    try {
      const res = await getMisMarcajes();
      const list = Array.isArray(res?.data) ? res.data : [];
      const hoyLocal = getTodayDate();
      const hoyUtc = getTodayUtcDate();
      const fechaSet = new Set([hoyLocal, hoyUtc]);

      const deHoy = list.find((item) => fechaSet.has(String(item?.fecha || "").slice(0, 10)));

      // Fallback robusto: si hay entrada abierta en cualquier fecha,
      // siempre debe permitir marcar salida al reingresar.
      const abierta = list.find((item) => Boolean(item?.hora_entrada) && !item?.hora_salida);

      const entrada = Boolean((deHoy || abierta)?.hora_entrada);
      const salida = Boolean((deHoy || abierta)?.hora_salida);

      setMarcaje({ entrada, salida });
      localStorage.setItem(storageKey, JSON.stringify({ entrada, salida }));
    } catch {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMarcaje({ entrada: Boolean(parsed?.entrada), salida: Boolean(parsed?.salida) });
        } catch {
          setMarcaje({ entrada: false, salida: false });
        }
      }
    }
  }, [storageKey]);

  useEffect(() => {
    cargarEstadoMarcaje();
  }, [cargarEstadoMarcaje]);

  const handleMarcarEntrada = async () => {
    if (loading || marcaje.entrada) return;

    try {
      setLoading(true);
      setEstado("idle");
      setMensaje("");

      const res = await marcarEntrada();
      const okMessage = res?.message || "Entrada registrada correctamente";

      setMarcaje({ entrada: true, salida: false });
      setEstado("success");
      setMensaje(okMessage);
      localStorage.setItem(storageKey, JSON.stringify({ entrada: true, salida: false }));
      notifySuccess(okMessage);
      await cargarEstadoMarcaje();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "No se pudo registrar la entrada.";
      setEstado("error");
      setMensaje(errorMessage);
      notifyError(errorMessage);
      await cargarEstadoMarcaje();
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarSalida = async () => {
    if (loading || !marcaje.entrada || marcaje.salida) return;

    try {
      setLoading(true);
      setEstado("idle");
      setMensaje("");

      const res = await marcarSalida();
      const okMessage = res?.message || "Salida registrada correctamente";

      setMarcaje({ entrada: true, salida: true });
      setEstado("success");
      setMensaje(okMessage);
      localStorage.setItem(storageKey, JSON.stringify({ entrada: true, salida: true }));
      notifySuccess(okMessage);
      await cargarEstadoMarcaje();

      navigate("/mis-horas?registrar=true&obligatorio=1", { replace: false });
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "No se pudo registrar la salida.";
      setEstado("error");
      setMensaje(errorMessage);
      notifyError(errorMessage);
      await cargarEstadoMarcaje();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!marcaje.entrada && (
        <button
          className="btn btn-sm w-100 btn-success fw-bold"
          onClick={handleMarcarEntrada}
          disabled={loading}
        >
          <i className={`bi ${loading ? "bi-hourglass-split" : "bi-box-arrow-in-right"} me-2`}></i>
          {loading ? "Marcando..." : "Marcar Entrada"}
        </button>
      )}

      {marcaje.entrada && !marcaje.salida && (
        <button
          className="btn btn-sm w-100 btn-warning fw-bold text-dark"
          onClick={handleMarcarSalida}
          disabled={loading}
        >
          <i className={`bi ${loading ? "bi-hourglass-split" : "bi-box-arrow-right"} me-2`}></i>
          {loading ? "Marcando..." : "Marcar Salida"}
        </button>
      )}

      {marcaje.entrada && marcaje.salida && (
        <button className="btn btn-sm w-100 btn-secondary fw-bold" disabled>
          <i className="bi bi-check2-circle me-2"></i>
          Se registro tu marcaje
        </button>
      )}

      {estado === "success" && (
        <div className="alert alert-success py-2 small mb-0 mt-2 border-0 text-center">
          {mensaje}
        </div>
      )}

      {estado === "error" && (
        <div className="alert alert-danger py-2 small mb-0 mt-2 border-0 text-center">
          {mensaje}
        </div>
      )}
    </div>
  );
};

export default ButtonMarcaje;
