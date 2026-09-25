import type { Trip } from '../types/trip';

export const tripDay = (iso: string) =>
  new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 10);
export function tripEnd(trip: Pick<Trip, 'startsAt' | 'endsAt' | 'stopTimes'>) {
  if (trip.endsAt) return trip.endsAt;
  const latest = Math.max(
    Date.parse(trip.startsAt),
    ...(trip.stopTimes || []).map((stop) => Date.parse(stop.endsAt)),
  );
  return new Date(tripDay(new Date(latest).toISOString()) + 'T23:59:00+07:00').toISOString();
}
export function tripDays(trip: Pick<Trip, 'startsAt' | 'endsAt' | 'stopTimes'>) {
  const start = Date.parse(tripDay(trip.startsAt) + 'T00:00:00+07:00');
  const end = Date.parse(tripDay(tripEnd(trip)) + 'T00:00:00+07:00');
  return Array.from(
    { length: Math.min(366, Math.max(1, Math.round((end - start) / 86400000) + 1)) },
    (_, index) => tripDay(new Date(start + index * 86400000).toISOString()),
  );
}
export function placeDay(trip: Trip, placeId: string) {
  return (
    trip.placeDays?.find((item) => item.placeId === placeId)?.date ||
    tripDay(trip.stopTimes?.find((stop) => stop.placeId === placeId)?.startsAt || trip.startsAt)
  );
}
