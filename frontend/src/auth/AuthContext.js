import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAccessToken, clearAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  async function login(usernameOrEmail, password) {
    const resp = await api.post('/auth/login', { usernameOrEmail, password });
    setAccessToken(resp.data.accessToken);
    setUser(resp.data.user);
    return resp.data.user;
  }

  async function logout() {
    try { await api.post('/auth/logout'); } catch {}
    clearAccessToken();
    setUser(null);
  }

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.post('/auth/refresh');
        setAccessToken(resp.data.accessToken);
        setUser(resp.data.user);
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
