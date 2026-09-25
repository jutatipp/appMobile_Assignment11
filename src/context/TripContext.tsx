import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import { Memory, Trip, TripDraft } from '../types/trip';
import * as api from '../services/trips';
import { ApiError } from '../services/api';
import * as storage from '../services/tripStorage';
import { errorMessage } from '../utils/format';
import { cancelReminder, hasReminder, scheduleStops } from '../services/notifications';

type State = {
  trips: Trip[];
  ready: boolean;
  loading: boolean;
  error: string;
  pendingIds: string[];
  refresh: () => Promise<void>;
  save: (draft: TripDraft, id: string, editing?: boolean) => Promise<Trip>;
  remove: (id: string) => Promise<void>;
  addMemory: (id: string, memory: Memory) => Promise<void>;
};
const Context = createContext<State | null>(null);
export function TripProvider({ children }: { children: ReactNode }) {
  const { session, expireSession } = useAuth();
  const { places } = useApp();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [ready, setReady] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const current = useRef(session);
  current.current = session;
  const items = useRef<Trip[]>([]);
  const working = useRef(false);
  const operations = useRef(Promise.resolve());
  function inOrder<T>(task: () => Promise<T>): Promise<T> {
    const next = operations.current.then(task, task);
    operations.current = next.then(
      () => {},
      () => {},
    );
    return next;
  }
  async function display(next: Trip[], owner: string) {
    const pending = await storage.pendingMemories(owner);
    for (const entry of pending) {
      const trip = next.find((item) => item.id === entry.tripId);
      if (trip && !trip.memories.some((memory) => memory.id === entry.id))
        trip.memories.push(entry.memory);
    }
    if (current.current?.email === owner) {
      items.current = next;
      setTrips(next);
    }
    await storage.cacheTrips(owner, next);
  }
  async function refreshWork() {
    if (!session || working.current) return;
    working.current = true;
    setLoading(true);
    setError('');
    const owner = session.email;
    try {
      for (const item of await storage.pendingMemories(owner)) {
        await api.uploadMemory(session.token, item.tripId, item.memory);
        await storage.clearPending(item.id);
      }
      const next = await api.fetchTrips(session.token);
      if (current.current?.token === session.token) await display(next, owner);
    } catch (err) {
      if (current.current?.token === session.token) {
        setError(errorMessage(err));
        if (err instanceof ApiError && err.status === 401) await expireSession();
      }
    } finally {
      try {
        const pending = await storage.pendingMemories(owner);
        if (current.current?.token === session.token) setPendingIds(pending.map((item) => item.id));
      } finally {
        working.current = false;
        setLoading(false);
      }
    }
  }
  useEffect(() => {
    let active = true;
    items.current = [];
    setTrips([]);
    setPendingIds([]);
    setError('');
    setReady(false);
    async function initialize() {
      try {
        if (session) {
          const cached = await storage.readTrips(session.email);
          const pending = await storage.pendingMemories(session.email);
          for (const entry of pending) {
            const trip = cached.find((t) => t.id === entry.tripId);
            if (trip && !trip.memories.some((m) => m.id === entry.id))
              trip.memories.push(entry.memory);
          }
          if (!active) return;
          items.current = cached;
          setTrips(cached);
          setPendingIds(pending.map((item) => item.id));
        }
      } catch (err) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) {
          await refresh().catch((err) => {
            if (active) setError(errorMessage(err));
          });
          if (active) {
            setLoadedFor(session?.token || null);
            setReady(true);
          }
        }
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, [session?.token]);
  useEffect(() => {
    if (!ready || !session) return;
    let wasOffline = false;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      if (online && wasOffline) void refresh().catch(() => {});
      wasOffline = !online;
    });
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh().catch(() => {});
    });
    return () => {
      unsubscribe();
      listener.remove();
    };
  }, [ready, session?.token]);
  function requireSession() {
    if (!session) throw new Error('กรุณาเข้าสู่ระบบก่อน');
    return session;
  }
  async function saveWork(draft: TripDraft, id: string, editing = false) {
    const auth = requireSession();
    const previous = items.current.find((t) => t.id === id);
    const trip = await api.saveTrip(auth.token, draft, id, editing);
    if (current.current?.token !== auth.token)
      throw new Error('บัญชีเปลี่ยนแล้ว กรุณาเปิดทริปใหม่');
    // รักษารูปในเครื่องที่ยังส่งไม่สำเร็จ
    const pending = await storage.pendingMemories(auth.email);
    for (const item of pending.filter((p) => p.tripId === trip.id))
      if (!trip.memories.some((m) => m.id === item.id)) trip.memories.push(item.memory);
    const next = [trip, ...items.current.filter((item) => item.id !== trip.id)];
    if (
      previous &&
      (previous.startsAt !== trip.startsAt ||
        JSON.stringify(previous.stopTimes) !== JSON.stringify(trip.stopTimes) ||
        previous.title !== trip.title)
    ) {
      try {
        if (await hasReminder(id)) {
          await cancelReminder(id);
          await scheduleStops(
            trip,
            Object.fromEntries(places.map((place) => [place.id, place.title])),
          );
        }
      } catch {
        setError('บันทึกทริปแล้ว กรุณาตรวจเวลาเที่ยวและตั้งเตือนอีกครั้ง');
      }
    }
    await display(next, auth.email);
    return trip;
  }
  async function removeWork(id: string) {
    const auth = requireSession();
    await api.deleteTrip(auth.token, id);
    if (current.current?.token !== auth.token) return;
    await storage.clearTripPending(auth.email, id);
    await display(
      items.current.filter((item) => item.id !== id),
      auth.email,
    );
    await cancelReminder(id).catch(() => setError('ลบทริปแล้ว แต่ยกเลิกการแจ้งเตือนไม่สำเร็จ'));
  }
  async function addMemory(id: string, memory: Memory) {
    const auth = requireSession();
    if (!items.current.some((t) => t.id === id)) throw new Error('ไม่พบทริปนี้');
    await storage.queueMemory(auth.email, id, memory);
    const next = items.current.map((t) =>
      t.id === id
        ? { ...t, memories: [...t.memories.filter((m) => m.id !== memory.id), memory] }
        : t,
    );
    await display(next, auth.email);
    setPendingIds((ids) => [...ids.filter((value) => value !== memory.id), memory.id]);
    void refresh().catch((err) => setError(errorMessage(err)));
  }
  const refresh = () => inOrder(refreshWork);
  async function authenticated<T>(task: () => Promise<T>) {
    const token = session?.token;
    try {
      return await task();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && current.current?.token === token)
        await expireSession();
      throw error;
    }
  }
  const save = (draft: TripDraft, id: string, editing = false) =>
    inOrder(() => authenticated(() => saveWork(draft, id, editing)));
  const remove = (id: string) => inOrder(() => authenticated(() => removeWork(id)));
  return (
    <Context.Provider
      value={{
        trips: trips.filter((trip) => trip.owner === session?.email),
        ready: ready && loadedFor === (session?.token || null),
        loading,
        error,
        pendingIds,
        refresh,
        save,
        remove,
        addMemory,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useTrips() {
  const value = useContext(Context);
  if (!value) throw new Error('useTrips ต้องอยู่ใน TripProvider');
  return value;
}
