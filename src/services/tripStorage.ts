import * as SQLite from 'expo-sqlite';
import { Trip, Memory } from '../types/trip';
import { isTrip } from './trips';

async function database() {
  const db = await SQLite.openDatabaseAsync('trips.db');
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS cache (owner TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS pending (id TEXT PRIMARY KEY, owner TEXT NOT NULL, tripId TEXT NOT NULL, payload TEXT NOT NULL);',
  );
  // ย้าย cache และรูปที่รอส่งของบัญชีสาธิตเดิม โดยไม่เขียนทับบัญชีใหม่
  await db.runAsync(
    "UPDATE OR IGNORE cache SET owner = 'jutatip@gmail.com' WHERE owner IN ('student@example.com', 'test@test.com') AND NOT EXISTS (SELECT 1 FROM cache WHERE owner = 'jutatip@gmail.com')",
  );
  await db.runAsync(
    "UPDATE pending SET owner = 'jutatip@gmail.com' WHERE owner IN ('student@example.com', 'test@test.com')",
  );
  return db;
}
export async function readTrips(owner: string): Promise<Trip[]> {
  const db = await database();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM cache WHERE owner = ?',
    owner,
  );
  try {
    const data: unknown = JSON.parse(row?.payload || '[]');
    return Array.isArray(data)
      ? data
          .filter(isTrip)
          .map((trip) =>
            owner === 'jutatip@gmail.com' &&
            ['student@example.com', 'test@test.com'].includes(trip.owner)
              ? { ...trip, owner }
              : trip,
          )
      : [];
  } catch {
    return [];
  }
}
export async function cacheTrips(owner: string, trips: Trip[]) {
  const db = await database();
  await db.runAsync(
    'INSERT OR REPLACE INTO cache (owner, payload) VALUES (?, ?)',
    owner,
    JSON.stringify(trips),
  );
}
export async function queueMemory(owner: string, tripId: string, memory: Memory) {
  const db = await database();
  await db.runAsync(
    'INSERT OR REPLACE INTO pending (id, owner, tripId, payload) VALUES (?, ?, ?, ?)',
    memory.id,
    owner,
    tripId,
    JSON.stringify(memory),
  );
}
export async function pendingMemories(owner: string) {
  const db = await database();
  const rows = await db.getAllAsync<{ id: string; tripId: string; payload: string }>(
    'SELECT id, tripId, payload FROM pending WHERE owner = ?',
    owner,
  );
  return rows.map((row) => ({
    id: row.id,
    tripId: row.tripId,
    memory: JSON.parse(row.payload) as Memory,
  }));
}
export async function clearPending(id: string) {
  const db = await database();
  await db.runAsync('DELETE FROM pending WHERE id = ?', id);
}
export async function clearTripPending(owner: string, tripId: string) {
  const db = await database();
  await db.runAsync('DELETE FROM pending WHERE owner = ? AND tripId = ?', owner, tripId);
}
