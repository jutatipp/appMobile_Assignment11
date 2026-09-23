import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { Event } from '../types/event';
import { isEvent } from './api';

export async function readFavorites(): Promise<string[]> {
  try {
    const data: unknown = JSON.parse((await AsyncStorage.getItem('favorites')) || '[]');
    return Array.isArray(data) && data.every((id) => typeof id === 'string') ? data : [];
  } catch {
    return [];
  }
}
export async function saveFavorites(ids: string[]) {
  await AsyncStorage.setItem('favorites', JSON.stringify(ids));
}

// SQLite เก็บ cache จริง แยกจาก Favorite ที่อยู่ใน AsyncStorage
async function database() {
  const db = await SQLite.openDatabaseAsync('nongkhai.db');
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS event_cache (id TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
  );
  return db;
}
export async function readCache() {
  const db = await database();
  const rows = await db.getAllAsync<{ payload: string }>('SELECT payload FROM event_cache');
  const meta = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM metadata WHERE key = ?',
    'updatedAt',
  );
  const events: Event[] = [];
  for (const row of rows) {
    try {
      const value: unknown = JSON.parse(row.payload);
      if (isEvent(value)) events.push(value);
    } catch {
      /* ข้าม cache ที่เสีย */
    }
  }
  return { events, updatedAt: meta?.value || null };
}
export async function saveCache(events: Event[]) {
  const db = await database();
  const updatedAt = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM event_cache');
    for (const event of events)
      await db.runAsync(
        'INSERT INTO event_cache (id, payload) VALUES (?, ?)',
        event.id,
        JSON.stringify(event),
      );
    await db.runAsync(
      'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
      'updatedAt',
      updatedAt,
    );
  });
  return updatedAt;
}
export async function clearCache() {
  const db = await database();
  await db.execAsync('DELETE FROM event_cache; DELETE FROM metadata;');
}
