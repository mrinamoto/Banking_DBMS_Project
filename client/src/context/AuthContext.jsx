/* eslint-disable react/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

function persistSession(data) {
  localStorage.setItem("bank_token", data.token);
  localStorage.setItem("bank_user", JSON.stringify(data.user));
}

function clearSession() {
  localStorage.removeItem("bank_token");
  localStorage.removeItem("bank_user");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = localStorage.getItem("bank_token");
      if (!token) {
        clearSession();
        if (active) setAuthLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (active) {
          localStorage.setItem("bank_user", JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch {
        clearSession();
        if (active) setUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    function handleUnauthorized() {
      clearSession();
      setUser(null);
      setAuthLoading(false);
    }

    window.addEventListener("bank:unauthorized", handleUnauthorized);
    restoreSession();
    return () => {
      active = false;
      window.removeEventListener("bank:unauthorized", handleUnauthorized);
    };
  }, []);

  async function login(username, password) {
    const { data } = await api.post("/auth/login", { username, password });
    persistSession(data);
    setUser(data.user);
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    persistSession(data);
    setUser(data.user);
  }

  async function logout() {
    try {
      if (localStorage.getItem("bank_token")) await api.post("/auth/logout");
    } finally {
      clearSession();
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({ user, authLoading, login, register, logout }),
    [user, authLoading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
