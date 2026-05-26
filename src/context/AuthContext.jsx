import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getCurrentUser, logoutRequest } from "../services/authService";
import { getUsuarioById } from "../services/usuarioService";

const AUTH_CHANNEL = "auth";
const AUTH_EVENT_KEY = "auth_event";

const AuthContext = createContext({
  user: null,
  authLoading: true,
  login: () => {},
  logout: () => {},
  setUser: () => {},
  updateUser: () => {},
  refreshSession: () => {},
});

const clearLegacyAuthStorage = () => {
  try {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {
    // Storage can be unavailable in private or restricted browser modes.
  }
};

const hydrateUserDetail = async (baseUser) => {
  if (!baseUser?.id_usuario || !["empleado", "lider"].includes(baseUser.rol)) {
    return baseUser;
  }

  try {
    const response = await getUsuarioById(baseUser.id_usuario);
    return { ...baseUser, ...(response.data || {}) };
  } catch {
    return baseUser;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const channelRef = useRef(null);

  const refreshSession = useCallback(async () => {
    try {
      clearLegacyAuthStorage();
      const response = await getCurrentUser();
      const currentUser = response.user || response.data || null;
      setUser(await hydrateUserDetail(currentUser));
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const publishAuthEvent = useCallback((type) => {
    const event = { type, at: Date.now() };

    try {
      channelRef.current?.postMessage(event);
    } catch {
      // BroadcastChannel is optional; localStorage is the fallback.
    }

    try {
      localStorage.setItem(AUTH_EVENT_KEY, JSON.stringify(event));
    } catch {
      // Ignore storage failures; the current tab has already updated state.
    }
  }, []);

  useEffect(() => {
    clearLegacyAuthStorage();
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleAuthEvent = (event) => {
      if (!event?.type) return;

      if (event.type === "AUTH_LOGOUT") {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      if (event.type === "AUTH_LOGIN" || event.type === "AUTH_USER_UPDATED") {
        refreshSession();
      }
    };

    if ("BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel(AUTH_CHANNEL);
      channelRef.current.onmessage = ({ data }) => handleAuthEvent(data);
    }

    const handleStorage = (event) => {
      if (event.key !== AUTH_EVENT_KEY || !event.newValue) return;

      try {
        handleAuthEvent(JSON.parse(event.newValue));
      } catch {
        // Ignore malformed auth events.
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [refreshSession]);

  const login = async (newUser) => {
    clearLegacyAuthStorage();
    setAuthLoading(true);
    try {
      const response = await getCurrentUser();
      const currentUser = response.user || response.data || newUser || null;
      setUser(await hydrateUserDetail(currentUser));
      publishAuthEvent("AUTH_LOGIN");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Even if the request fails, the UI should leave the session locally.
    } finally {
      clearLegacyAuthStorage();
      setUser(null);
      setAuthLoading(false);
      publishAuthEvent("AUTH_LOGOUT");
    }
  };

  const updateUser = useCallback((fields) => {
    setUser((currentUser) => {
      const updated = currentUser ? { ...currentUser, ...fields } : currentUser;
      if (updated) publishAuthEvent("AUTH_USER_UPDATED");
      return updated;
    });
  }, [publishAuthEvent]);

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout, setUser, updateUser, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
