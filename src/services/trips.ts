import { request } from './api';
import { Memory, Trip, TripDraft } from '../types/trip';

export function isTrip(value: unknown): value is Trip {
  if (!value || typeof value !== 'object') return false;
  const t = value as Trip;
  return (
    typeof t.id === 'string' &&
    typeof t.owner === 'string' &&
    typeof t.title === 'string' &&
    typeof t.startsAt === 'string' &&
    Number.isFinite(Date.parse(t.startsAt)) &&
    (t.endsAt === undefined ||
      (typeof t.endsAt === 'string' && Number.isFinite(Date.parse(t.endsAt)))) &&
    (t.placeDays === undefined ||
      (Array.isArray(t.placeDays) &&
        t.placeDays.every(
          (item) =>
            item &&
            typeof item.placeId === 'string' &&
            typeof item.date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(item.date),
        ))) &&
    typeof t.updatedAt === 'string' &&
    Array.isArray(t.placeIds) &&
    t.placeIds.every((id) => typeof id === 'string') &&
    (t.stopTimes === undefined ||
      (Array.isArray(t.stopTimes) &&
        t.stopTimes.every(
          (stop) =>
            stop &&
            t.placeIds.includes(stop.placeId) &&
            Number.isFinite(Date.parse(stop.startsAt)) &&
            Number.isFinite(Date.parse(stop.endsAt)) &&
            Date.parse(stop.endsAt) > Date.parse(stop.startsAt),
        ))) &&
    Array.isArray(t.memories) &&
    t.memories.every(
      (m) =>
        m &&
        typeof m.id === 'string' &&
        typeof m.imageUrl === 'string' &&
        typeof m.createdAt === 'string',
    )
  );
}
function parse(value: unknown) {
  if (!isTrip(value)) throw new Error('ข้อมูลทริปไม่ถูกต้อง');
  return value;
}
export async function fetchTrips(token: string) {
  const data = await request('/trips', {}, token);
  if (!Array.isArray(data) || !data.every(isTrip)) throw new Error('รายการทริปไม่ถูกต้อง');
  return data;
}
export async function saveTrip(token: string, draft: TripDraft, id: string, editing = false) {
  return parse(
    await request(
      editing ? `/trips/${id}` : '/trips',
      { method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ ...draft, id }) },
      token,
    ),
  );
}
export async function uploadMemory(token: string, tripId: string, memory: Memory) {
  return parse(
    await request(
      `/trips/${tripId}/memories`,
      { method: 'POST', body: JSON.stringify(memory) },
      token,
    ),
  );
}
export async function deleteTrip(token: string, id: string) {
  await request(`/trips/${id}`, { method: 'DELETE' }, token);
}
export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
