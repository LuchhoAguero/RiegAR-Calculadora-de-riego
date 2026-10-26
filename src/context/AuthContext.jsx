import React, { createContext, useCallback, useEffect, useState } from "react";
import { isTokenCurrent, tokenExpiresAt, SESSION_INVALIDATED } from "./session.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem("token");
    return isTokenCurrent(stored) ? stored : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  useEffect(() => {
    let timer;
    const sync = () => {
      clearTimeout(timer);
      const stored = localStorage.getItem("token");
      if (!isTokenCurrent(stored)) {
        logout();
        return;
      }
      setToken(stored);
      timer = setTimeout(sync, Math.min(tokenExpiresAt(stored) - Date.now(), 2147483647));
    };
    const onStorage = event => {
      if (event.key === "token" || event.key === null) sync();
    };
    sync();
    window.addEventListener(SESSION_INVALIDATED, sync);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SESSION_INVALIDATED, sync);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [token, logout]);

  const login = newToken => {
    if (!isTokenCurrent(newToken)) throw new Error("La sesión recibida no es válida. Volvé a iniciar sesión.");
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  return <AuthContext.Provider value={{ token, isLoggedIn: isTokenCurrent(token), login, logout }}>{children}</AuthContext.Provider>;
};
