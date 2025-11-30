import React from "react";
import { useToast } from "../hooks/useToast";
import { getMe } from "../api/users";
import {
  getAuthToken,
  setAuthToken,
  AUTH_TOKEN_EVENT,
  addUnauthorizedHandler,
} from "../api/client";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const qc = useQueryClient();

  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const loadMe = React.useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await getMe();
      setUser(data);
      return data;
    } catch (e) {
      setAuthToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMe();
  }, [loadMe]);

  React.useEffect(() => {
    const onToken = () => loadMe();
    window.addEventListener(AUTH_TOKEN_EVENT, onToken);
    return () => window.removeEventListener(AUTH_TOKEN_EVENT, onToken);
  }, [loadMe]);

  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") loadMe();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadMe]);

  React.useEffect(() => {
    const off = addUnauthorizedHandler(() => {
      setUser(null);
      qc.clear();
      toast.info("Session expired. Please log in again.");
    });
    return () => off();
  }, [qc, toast]);

  const login = async (jwt) => {
    if (jwt) setAuthToken(jwt);
    setLoading(true);
    await qc.clear();
    const me = await loadMe();
    return me;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    qc.clear();
  };

  const value = React.useMemo(
    () => ({
      user,
      role: user?.role,
      isBusiness: user?.isBusiness,
      loading,
      login,
      logout,
      reload: loadMe,
    }),
    [user, loading, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
