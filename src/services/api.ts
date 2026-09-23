import Constants from 'expo-constants';
import { Event, EventDraft, Registration, Session } from '../types/event';

// Expo แสดง IP ของเครื่องที่เปิด Metro จึงใช้ API บนเครื่องเดียวกันได้ทันที
const host = Constants.expoConfig?.hostUri?.split(':')[0];
export const API_URL = process.env.EXPO_PUBLIC_API_URL || (host ? `http://${host}:3001` : '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request(path: string, options: RequestInit = {}, token?: string): Promise<unknown> {
  if (!API_URL) throw new Error('ยังไม่ได้ตั้ง EXPO_PUBLIC_API_URL กรุณาดูวิธีตั้งค่าใน README');
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 12000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(__DEV__ && path === '/events' && process.env.EXPO_PUBLIC_TEST_FAULT
          ? { 'x-test-fault': process.env.EXPO_PUBLIC_TEST_FAULT }
          : {}),
      },
    });
    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw new Error('API ส่งข้อมูลที่ไม่ใช่ JSON');
    }
    if (!response.ok) {
      const message =
        data && typeof data === 'object' && 'message' in data
          ? String(data.message)
          : `API error ${response.status}`;
      throw new ApiError(message, response.status);
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      throw new Error('คำขอถูกยกเลิกหรือใช้เวลานานเกินไป');
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

export function isEvent(value: unknown): value is Event {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return (
    ['id', 'title', 'category', 'district', 'description', 'imageUrl', 'organizer'].every(
      (key) => typeof e[key] === 'string',
    ) &&
    typeof e.startsAt === 'string' &&
    Number.isFinite(Date.parse(e.startsAt)) &&
    typeof e.latitude === 'number' &&
    Math.abs(e.latitude) <= 90 &&
    typeof e.longitude === 'number' &&
    Math.abs(e.longitude) <= 180 &&
    typeof e.capacity === 'number' &&
    e.capacity > 0
  );
}
export async function getEvents(signal?: AbortSignal) {
  const data = await request('/events', { signal });
  if (!Array.isArray(data) || !data.every(isEvent))
    throw new Error('รูปแบบรายการกิจกรรมจาก API ไม่ถูกต้อง');
  return data;
}
export async function getEvent(id: string, signal?: AbortSignal) {
  const data = await request(`/events/${encodeURIComponent(id)}`, { signal });
  if (!isEvent(data)) throw new Error('รูปแบบรายละเอียดจาก API ไม่ถูกต้อง');
  return data;
}
export async function login(email: string, password: string) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (
    !data ||
    typeof data !== 'object' ||
    !('token' in data) ||
    typeof data.token !== 'string' ||
    !('expiresAt' in data) ||
    typeof data.expiresAt !== 'number' ||
    !('name' in data) ||
    typeof data.name !== 'string' ||
    !('email' in data) ||
    typeof data.email !== 'string'
  )
    throw new Error('ข้อมูล session ไม่ถูกต้อง');
  return data as Session;
}
export async function checkSession(token: string) {
  await request('/auth/me', {}, token);
}
export async function revokeSession(token: string) {
  await request('/auth/logout', { method: 'POST' }, token);
}
export async function registerEvent(
  token: string,
  eventId: string,
  name: string,
  email: string,
  guests: number,
) {
  const data = await request(
    '/registrations',
    { method: 'POST', body: JSON.stringify({ eventId, name, email, guests }) },
    token,
  );
  if (!data || typeof data !== 'object') throw new Error('ข้อมูลลงทะเบียนจาก API ไม่ถูกต้อง');
  const registration = data as Record<string, unknown>;
  if (
    !['id', 'eventId', 'name', 'email'].every((key) => typeof registration[key] === 'string') ||
    registration.eventId !== eventId ||
    typeof registration.guests !== 'number'
  ) {
    throw new Error('ข้อมูลลงทะเบียนจาก API ไม่ถูกต้อง');
  }
  return data as Registration;
}
export async function createEvent(token: string, draft: EventDraft) {
  const data = await request('/events', { method: 'POST', body: JSON.stringify(draft) }, token);
  if (!isEvent(data)) throw new Error('ข้อมูลกิจกรรมใหม่ไม่ถูกต้อง');
  return data;
}
