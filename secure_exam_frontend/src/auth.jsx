import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, tokens, setSessionExpiredHandler } from "./api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export const isAdmin = (u) => u && (u.role === "ADMIN" || u.role === "SUPERADMIN");

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokens.access);

  const logout = useCallback(() => { tokens.clear(); setUser(null); }, []);
  useEffect(() => { setSessionExpiredHandler(() => setUser(null)); }, []);
  useEffect(() => {
    if (!tokens.access) return;
    api.me().then(setUser).catch(() => tokens.clear()).finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    tokens.set(await api.login(username, password));
    const me = await api.me();
    setUser(me);
    return me;
  };
  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}
