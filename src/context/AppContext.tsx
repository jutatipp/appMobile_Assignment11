import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Event } from '../types/event';
import { getEvents } from '../services/api';
import {
  readCache,
  readFavorites,
  saveCache,
  saveFavorites,
  clearCache,
} from '../services/storage';
import { errorMessage } from '../utils/format';

type AppState = {
  events: Event[];
  favorites: string[];
  ready: boolean;
  loading: boolean;
  offline: boolean;
  error: string;
  updatedAt: string | null;
  refresh: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addEvent: (event: Event) => Promise<void>;
  resetCache: () => Promise<void>;
};
const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const favoriteBusy = useRef(false);

  async function refresh() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    try {
      const next = await getEvents(controller.signal);
      if (controller.signal.aborted) return;
      setEvents(next);
      setUpdatedAt(await saveCache(next));
    } catch (err) {
      if (!controller.signal.aborted) setError(errorMessage(err));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const unsubscribe = NetInfo.addEventListener((state) =>
      setOffline(state.isConnected === false || state.isInternetReachable === false),
    );
    async function initialize() {
      try {
        const [cache, saved] = await Promise.all([readCache(), readFavorites()]);
        if (!active) return;
        setEvents(cache.events);
        setUpdatedAt(cache.updatedAt);
        setFavorites(saved);
      } catch (err) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) {
          setReady(true);
          void refresh();
        }
      }
    }
    void initialize();
    return () => {
      active = false;
      unsubscribe();
      request.current?.abort();
    };
  }, []);

  async function toggleFavorite(id: string) {
    if (!ready || favoriteBusy.current) return;
    favoriteBusy.current = true;
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    try {
      await saveFavorites(next);
      setFavorites(next);
    } catch {
      Alert.alert('บันทึกไม่สำเร็จ', 'พื้นที่จัดเก็บอาจเต็ม กรุณาลองอีกครั้ง');
    } finally {
      favoriteBusy.current = false;
    }
  }
  async function addEvent(event: Event) {
    const next = [event, ...events.filter((item) => item.id !== event.id)];
    setEvents(next);
    try {
      setUpdatedAt(await saveCache(next));
    } catch {
      setError('สร้างกิจกรรมแล้ว แต่บันทึก cache ไม่สำเร็จ');
    }
  }
  async function resetCache() {
    await clearCache();
    setEvents([]);
    setUpdatedAt(null);
    await refresh();
  }
  return (
    <AppContext.Provider
      value={{
        events,
        favorites,
        ready,
        loading,
        offline,
        error,
        updatedAt,
        refresh,
        toggleFavorite,
        addEvent,
        resetCache,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp ต้องอยู่ภายใน AppProvider');
  return context;
}
