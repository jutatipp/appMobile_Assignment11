import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Session } from '../types/place';
import { ApiError, checkSession, login, revokeSession } from '../services/api';

type AuthState = {
  session: Session | null;
  ready: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  expireSession: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);
const SESSION_KEY = 'nongkhai-session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    async function restore() {
      try {
        const raw = await SecureStore.getItemAsync(SESSION_KEY);
        const saved: Session | null = raw ? JSON.parse(raw) : null;
        if (
          saved &&
          typeof saved.token === 'string' &&
          typeof saved.email === 'string' &&
          typeof saved.name === 'string' &&
          saved.expiresAt > Date.now()
        ) {
          try {
            await checkSession(saved.token);
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              await SecureStore.deleteItemAsync(SESSION_KEY);
              return;
            }
          }
          setSession(saved);
        } else {
          await SecureStore.deleteItemAsync(SESSION_KEY);
        }
      } catch {
        /* session เสียหรืออ่านไม่ได้ ให้ผู้ใช้ login ใหม่ */
      } finally {
        setReady(true);
      }
    }
    void restore();
  }, []);

  useEffect(() => {
    if (!session) return;
    const expire = () => {
      if (session.expiresAt <= Date.now()) void expireSession();
    };
    const timer = setTimeout(expire, Math.max(0, session.expiresAt - Date.now()));
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') expire();
    });
    return () => {
      clearTimeout(timer);
      listener.remove();
    };
  }, [session]);

  async function signIn(email: string, password: string, remember = true) {
    const next = await login(email.trim().toLowerCase(), password);
    if (remember) await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
    else await SecureStore.deleteItemAsync(SESSION_KEY);
    setSession(next);
  }
  async function expireSession() {
    setSession(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
  async function signOut() {
    if (session) {
      try {
        await revokeSession(session.token);
      } catch {
        /* offline: ล้าง session ในเครื่อง */
      }
    }
    await expireSession();
  }
  return (
    <AuthContext.Provider value={{ session, ready, signIn, signOut, expireSession }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth ต้องอยู่ภายใน AuthProvider');
  return context;
}
