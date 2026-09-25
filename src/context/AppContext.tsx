import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Place } from '../types/place';
import { getPlaces } from '../services/api';
import {
  readCache,
  readFavorites,
  saveCache,
  saveFavorites,
  clearCache,
} from '../services/storage';
import { errorMessage } from '../utils/format';

type AppState = {
  places: Place[];
  favorites: string[];
  ready: boolean;
  loading: boolean;
  offline: boolean;
  error: string;
  updatedAt: string | null;
  refresh: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addPlace: (place: Place) => Promise<void>;
  resetCache: () => Promise<void>;
};
const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
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
      const next = await getPlaces(controller.signal);
      if (controller.signal.aborted) return;
      setPlaces(next);
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
        setPlaces(cache.places);
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
  async function addPlace(place: Place) {
    const next = [place, ...places.filter((item) => item.id !== place.id)];
    setPlaces(next);
    try {
      setUpdatedAt(await saveCache(next));
    } catch {
      setError('สร้างสถานที่แล้ว แต่บันทึก cache ไม่สำเร็จ');
    }
  }
  async function resetCache() {
    await clearCache();
    setPlaces([]);
    setUpdatedAt(null);
    await refresh();
  }
  return (
    <AppContext.Provider
      value={{
        places,
        favorites,
        ready,
        loading,
        offline,
        error,
        updatedAt,
        refresh,
        toggleFavorite,
        addPlace,
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
