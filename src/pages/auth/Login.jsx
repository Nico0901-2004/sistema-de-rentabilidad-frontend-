import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOwnerContact, login } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

/* ── Animated background blobs ──────────────────────── */
const AnimatedBg = () => (
  <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(135deg, #0f0c29 0%, #1a1a5e 30%, #0d47a1 60%, #1565c0 80%, #ffffff 100%)",
    }} />
    {[
      { w: 600, h: 600, top: "-15%", left: "-10%", color: "rgba(79,70,229,0.35)", delay: "0s", dur: "18s" },
      { w: 500, h: 500, top: "50%",  left: "60%",  color: "rgba(6,182,212,0.25)",  delay: "3s", dur: "22s" },
      { w: 400, h: 400, top: "20%",  left: "40%",  color: "rgba(255,255,255,0.08)",delay: "6s", dur: "16s" },
      { w: 350, h: 350, top: "70%",  left: "-5%",  color: "rgba(99,102,241,0.2)",  delay: "9s", dur: "20s" },
    ].map((b, i) => (
      <div key={i} style={{
        position: "absolute",
        width: b.w, height: b.h,
        top: b.top, left: b.left,
        borderRadius: "50%",
        background: b.color,
        filter: "blur(80px)",
        animation: `blobFloat ${b.dur} ease-in-out infinite alternate`,
        animationDelay: b.delay,
      }} />
    ))}
    {/* Floating particles */}
    {Array.from({ length: 20 }).map((_, i) => (
      <div key={`p${i}`} style={{
        position: "absolute",
        width: Math.random() * 4 + 2,
        height: Math.random() * 4 + 2,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.4)",
        top:  `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animation: `particleDrift ${8 + Math.random() * 12}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 8}s`,
      }} />
    ))}
    <style>{`
      @keyframes blobFloat {
        from { transform: translate(0, 0) scale(1); }
        to   { transform: translate(40px, -40px) scale(1.08); }
      }
      @keyframes particleDrift {
        0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
        50%       { transform: translateY(-30px) translateX(15px); opacity: 0.9; }
      }
    `}</style>
  </div>
);

/* ── Modal: Olvidaste tu contraseña ─────────────────── */
const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await getOwnerContact(email);
      if (res?.success) setResult(res.data);
      else setError(res?.message || "No se pudo obtener el contacto.");
    } catch (err) {
      setError(err.response?.data?.message || "No se encontró ninguna cuenta con ese correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,12,41,.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)  translateY(0); }
        }
      `}</style>
      <div style={{ background: "#fff", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 440, margin: "1rem", boxShadow: "0 20px 60px rgba(0,0,0,.35)", animation: "scaleIn .25s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <h5 style={{ fontWeight: 800, margin: 0, color: "#1e293b" }}>¿Olvidaste tu contraseña?</h5>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13, marginTop: 4 }}>Ingresa tu email y te diremos a quién contactar.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "0.6rem 1rem", marginBottom: "1rem", color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="bi bi-exclamation-circle-fill"></i>{error}
              </div>
            )}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>Tu correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
                style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", transition: "border .2s", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
                onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.6rem", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontWeight: 600, cursor: "pointer", fontSize: 14, color: "#374151" }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: "0.6rem", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4f46e5,#3730a3)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><span className="spinner-border spinner-border-sm" style={{ width: 16, height: 16 }}></span>Buscando...</> : "Consultar"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: 24, color: "#fff" }}>
              <i className="bi bi-person-check-fill"></i>
            </div>
            <h6 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>¡Propietario encontrado!</h6>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: "1rem" }}>Contacta a <strong>{result.nombre}</strong> para recuperar tu acceso:</p>
            <div style={{ background: "linear-gradient(135deg,rgba(79,70,229,.08),rgba(6,182,212,.06))", border: "1px solid rgba(79,70,229,.2)", borderRadius: 12, padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <i className="bi bi-envelope-fill" style={{ color: "#4f46e5", fontSize: 18 }}></i>
              <a href={`mailto:${result.email}`} style={{ color: "#4f46e5", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>{result.email}</a>
            </div>
            <button onClick={onClose} style={{ marginTop: "1.25rem", width: "100%", padding: "0.6rem", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4f46e5,#3730a3)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Login ────────────────────────────────────────── */
const LOGIN_LOCKOUT_KEY = "login_attempts_lockout";
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000;
const FAILED_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const LOCKOUT_ERROR_PREFIX = "Demasiados intentos fallidos.";
const normalizeEmail = (email) => email.trim().toLowerCase();

const getStoredAttempts = () => {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_LOCKOUT_KEY)) || {};
  } catch {
    return {};
  }
};

const saveStoredAttempts = (attempts) => {
  localStorage.setItem(LOGIN_LOCKOUT_KEY, JSON.stringify(attempts));
};

const getLockUntil = (email) => {
  if (!email) return 0;
  const attempts = getStoredAttempts();
  const lockedUntil = attempts[email]?.lockedUntil || 0;

  if (lockedUntil && lockedUntil <= Date.now()) {
    delete attempts[email];
    saveStoredAttempts(attempts);
    return 0;
  }

  return lockedUntil;
};

const registerFailedLogin = (email) => {
  if (!email) return 0;

  const attempts = getStoredAttempts();
  const current = attempts[email] || { count: 0, lockedUntil: 0 };
  const lastFailedAt = current.lastFailedAt || 0;
  const attemptsExpired = !lastFailedAt || Date.now() - lastFailedAt >= FAILED_ATTEMPT_WINDOW_MS;
  const currentCount = attemptsExpired ? 0 : current.count;
  const nextCount = current.lockedUntil > Date.now() ? current.count : currentCount + 1;
  const lockedUntil = nextCount >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;

  attempts[email] = { count: nextCount, lockedUntil, lastFailedAt: Date.now() };
  saveStoredAttempts(attempts);
  return { count: nextCount, lockedUntil };
};

const registerLockUntil = (email, lockedUntil) => {
  if (!email || !lockedUntil) return 0;

  const lockedUntilTime = typeof lockedUntil === "number" ? lockedUntil : new Date(lockedUntil).getTime();
  if (!Number.isFinite(lockedUntilTime) || lockedUntilTime <= Date.now()) return 0;

  const attempts = getStoredAttempts();
  attempts[email] = { count: MAX_FAILED_ATTEMPTS, lockedUntil: lockedUntilTime, lastFailedAt: Date.now() };
  saveStoredAttempts(attempts);
  return lockedUntilTime;
};

const clearFailedLogin = (email) => {
  if (!email) return;
  const attempts = getStoredAttempts();
  delete attempts[email];
  saveStoredAttempts(attempts);
};

const formatRemainingTime = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const isLockoutError = (message) => message.startsWith(LOCKOUT_ERROR_PREFIX);
const isLoginAttemptError = (message) => Boolean(message);
const buildFailedAttemptMessage = (failedAttempts, maxFailedAttempts) => {
  if (!failedAttempts || !maxFailedAttempts) return "Credenciales incorrectas.";
  if (failedAttempts >= maxFailedAttempts) return "Demasiados intentos fallidos. Intenta nuevamente más tarde.";
  return `Credenciales incorrectas. Vas ${failedAttempts} intento${failedAttempts === 1 ? "" : "s"} fallido${failedAttempts === 1 ? "" : "s"}; al tercer intento se bloqueará por 5 minutos.`;
};

const Login = () => {
  const [formData, setFormData]     = useState({ email: "", password: "" });
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();
  const auth = useAuth();
  const normalizedEmail = useMemo(() => normalizeEmail(formData.email), [formData.email]);
  const isLocked = lockedUntil > now;
  const remainingTime = formatRemainingTime(lockedUntil - now);

  useEffect(() => {
    const activeLock = getLockUntil(normalizedEmail);
    setLockedUntil(activeLock);

    if (!normalizedEmail || !activeLock) {
      setError((currentError) => (isLoginAttemptError(currentError) ? "" : currentError));
    }
  }, [normalizedEmail]);

  useEffect(() => {
    if (!isLocked) return;

    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (lockedUntil <= currentTime) {
        clearFailedLogin(normalizedEmail);
        setLockedUntil(0);
        setError((currentError) => (isLockoutError(currentError) ? "" : currentError));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockedUntil, normalizedEmail]);

  const handleChange = (e) => {
    setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.email || !formData.password) { setError("Por favor, completa todos los campos."); return; }
    const activeLock = getLockUntil(normalizedEmail);
    if (activeLock > Date.now()) {
      setLockedUntil(activeLock);
      setNow(Date.now());
      setError(`Demasiados intentos fallidos. Intenta nuevamente en ${formatRemainingTime(activeLock - Date.now())}.`);
      return;
    }

    try {
      setLoading(true);
      const data = await login(formData);
      clearFailedLogin(normalizedEmail);
      auth.login(data.token, data.user);
      const destinos = { admin: "/admin-dashboard", propietario: "/dashboard", lider: "/panel-lider", empleado: "/mi-espacio" };
      navigate(destinos[data.user?.rol] || "/dashboard");
    } catch (err) {
      const status = err.response?.status;
      if (status === 423) {
        const retryAfterSeconds = err.response?.data?.retryAfterSeconds;
        const apiLockedUntil = err.response?.data?.lockedUntil;
        const fallbackLockedUntil = retryAfterSeconds ? Date.now() + retryAfterSeconds * 1000 : 0;
        const newLockedUntil = registerLockUntil(normalizedEmail, apiLockedUntil || fallbackLockedUntil);

        setLockedUntil(newLockedUntil);
        setNow(Date.now());
        setError(
          newLockedUntil
            ? `Demasiados intentos fallidos. Intenta nuevamente en ${formatRemainingTime(newLockedUntil - Date.now())}.`
            : err.response?.data?.message || "Demasiados intentos fallidos. Intenta nuevamente más tarde."
        );
      } else if (status === 401) {
        const apiFailedAttempts = err.response?.data?.failedAttempts;
        const apiMaxFailedAttempts = err.response?.data?.maxFailedAttempts || MAX_FAILED_ATTEMPTS;
        const localAttempt = registerFailedLogin(normalizedEmail);
        const failedAttempts = apiFailedAttempts || localAttempt.count;

        setLockedUntil(localAttempt.lockedUntil);
        setNow(Date.now());
        setError(
          localAttempt.lockedUntil
            ? `Demasiados intentos fallidos. Intenta nuevamente en ${formatRemainingTime(localAttempt.lockedUntil - Date.now())}.`
            : buildFailedAttemptMessage(failedAttempts, apiMaxFailedAttempts)
        );
      } else if (!err.response || status >= 500) {
        setError("Error de servidor");
      } else {
        setError(err.response?.data?.message || "Error de servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBg />

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{
          width: "100%", maxWidth: 420,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          boxShadow: "0 25px 60px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.5) inset",
          overflow: "hidden",
        }}>
          {/* Gradient top bar */}
          <div style={{ height: 5, background: "linear-gradient(90deg, #4f46e5, #06b6d4, #4f46e5)", backgroundSize: "200% 100%", animation: "shimmerBar 3s linear infinite" }} />
          <style>{`@keyframes shimmerBar { 0%{background-position:0 0} 100%{background-position:200% 0} }`}</style>

          <div style={{ padding: "2.25rem 2.5rem 2.5rem" }}>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16, margin: "0 auto 1rem",
                background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(79,70,229,.4)",
                animation: "pulse-ring 2.5s infinite",
              }}>
                <i className="bi bi-building-fill" style={{ color: "#fff", fontSize: 24 }}></i>
              </div>
              <h4 style={{ fontWeight: 800, margin: 0, letterSpacing: "-.02em", color: "#1e293b" }}>Sistema de Rentabilidad</h4>
              <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: 14 }}>Ingresa tus credenciales para continuar</p>
            </div>

            {(error || isLocked) && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "0.6rem 1rem", marginBottom: "1.25rem", color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="bi bi-exclamation-circle-fill"></i>{isLocked ? `Demasiados intentos fallidos. Intenta nuevamente en ${remainingTime}.` : error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>Correo electrónico</label>
                <div style={{ position: "relative" }}>
                  <i className="bi bi-envelope" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 16 }}></i>
                  <input
                    type="email" name="email"
                    value={formData.email} onChange={handleChange}
                    placeholder="usuario@empresa.com" required autoComplete="email"
                    style={{ width: "100%", padding: "0.7rem 0.85rem 0.7rem 2.5rem", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, background: "#fafbfc", outline: "none", transition: "all .2s", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,.12)"; e.target.style.background = "#fff"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; e.target.style.background = "#fafbfc"; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "0.5rem" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <i className="bi bi-lock" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 16 }}></i>
                  <input
                    type={showPassword ? "text" : "password"} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="••••••••" required autoComplete="current-password"
                    style={{ width: "100%", padding: "0.7rem 2.75rem 0.7rem 2.5rem", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, background: "#fafbfc", outline: "none", transition: "all .2s", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,.12)"; e.target.style.background = "#fff"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; e.target.style.background = "#fafbfc"; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, lineHeight: 1, fontSize: 16 }}>
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div style={{ textAlign: "right", marginBottom: "1.5rem" }}>
                <button type="button" onClick={() => setShowForgot(true)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#4f46e5", fontSize: 12, fontWeight: 600, padding: 0, textDecoration: "underline", textDecorationStyle: "dotted" }}>
                  ¿Olvidaste tu contraseña? Contacta con tu propietario
                </button>
              </div>

              <button type="submit" disabled={loading || isLocked} style={{
                width: "100%", padding: "0.85rem", borderRadius: 12, border: "none",
                background: loading || isLocked ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5 0%,#3730a3 100%)",
                color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading || isLocked ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(79,70,229,.4)", transition: "all .2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
                onMouseEnter={(e) => { if (!loading && !isLocked) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(79,70,229,.5)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(79,70,229,.4)"; }}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm" style={{ width: 18, height: 18 }}></span>Ingresando...</>
                  : isLocked
                    ? <><i className="bi bi-lock-fill" style={{ fontSize: 18 }}></i>Bloqueado {remainingTime}</>
                  : <><i className="bi bi-box-arrow-in-right" style={{ fontSize: 18 }}></i>Ingresar</>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
