/* eslint-disable react/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

function persistSession(data, setUser) {
  localStorage.setItem("bank_token", data.token);
  localStorage.setItem("bank_user", JSON.stringify(data.user));
  setUser(data.user);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bank_user"));
    } catch {
      return null;
    }
  });

  async function login(username, password) {
    const { data } = await api.post("/auth/login", { username, password });
    persistSession(data, setUser);
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    persistSession(data, setUser);
  }

  function logout() {
    localStorage.removeItem("bank_token");
    localStorage.removeItem("bank_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
