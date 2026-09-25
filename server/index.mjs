import { normalizePlan, validatePlan } from './tripPlan.mjs';
import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));

// API สำหรับห้องเรียน: มีบัญชีสาธิตหนึ่งบัญชี ไม่ใช่ระบบบัญชีสำหรับ production
export async function createApi({
  dataDir = path.join(root, 'data'),
  password = '123456',
  sessionMs = 60 * 60 * 1000,
} = {}) {
  if (password.length < 6) throw new Error('DEMO_PASSWORD ต้องยาวอย่างน้อย 6 ตัวอักษร');
  await mkdir(dataDir, { recursive: true });
  const file = path.join(dataDir, 'database.json');
  let database;
  try {
    database = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const seeds = JSON.parse(await readFile(path.join(root, '../src/data/places.json'), 'utf8'));
    database = { places: seeds };
    await writeFile(file, JSON.stringify(database, null, 2));
  }
  // เก็บสำเนาข้อมูลรุ่นเดิมก่อนย้าย เผื่อย้อนตรวจงานเก่า โดยรักษา ID และสถานที่ที่ผู้ใช้เพิ่ม
  if (!database.places && Array.isArray(database.events)) {
    await writeFile(
      path.join(dataDir, 'database.before-places.json'),
      JSON.stringify(database, null, 2),
      { flag: 'wx', mode: 0o600 },
    ).catch((error) => {
      if (error.code !== 'EEXIST') throw error;
    });
    const seeds = JSON.parse(await readFile(path.join(root, '../src/data/places.json'), 'utf8'));
    database = {
      places: database.events.map(({ startsAt, capacity, organizer, ...place }) => ({
        ...place,
        description: seeds.find((seed) => seed.id === place.id)?.description || place.description,
        contributor: organizer || 'นักสำรวจ',
      })),
    };
    await writeFile(file, JSON.stringify(database, null, 2));
  }
  database.trips ||= [];
  // เปลี่ยนบัญชีสาธิตโดยรักษาทริปเดิมไว้
  for (const trip of database.trips)
    if (['student@example.com', 'test@test.com'].includes(trip.owner))
      trip.owner = 'jutatip@gmail.com';
  database.trips = database.trips.map(normalizePlan);
  const sessions = new Map();
  const attempts = new Map();
  let writeQueue = Promise.resolve();
  async function persist() {
    const snapshot = JSON.stringify(database, null, 2);
    writeQueue = writeQueue
      .catch(() => {})
      .then(async () => {
        // เขียนไฟล์ชั่วคราวก่อน เพื่อไม่ให้ไฟล์หลักขาดครึ่งถ้า process หยุดขณะเขียน
        await writeFile(`${file}.tmp`, snapshot, { mode: 0o600 });
        await rename(`${file}.tmp`, file);
      });
    await writeQueue;
  }
  await persist();
  const demoEmail = 'jutatip@gmail.com';
  function reply(response, status, data) {
    response.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end(JSON.stringify(data));
  }
  function authorize(request) {
    const token = request.headers.authorization?.replace(/^Bearer /, '');
    const session = sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      sessions.delete(token);
      return null;
    }
    return { ...session, token };
  }
  async function body(request) {
    let size = 0;
    const chunks = [];
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 4.3 * 1024 * 1024)
        throw Object.assign(new Error('ข้อมูลมีขนาดใหญ่เกินไป'), { status: 413 });
      chunks.push(chunk);
    }
    try {
      const data = JSON.parse(Buffer.concat(chunks).toString());
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
      return data;
    } catch {
      throw Object.assign(new Error('ต้องส่ง JSON object ที่ถูกต้อง'), { status: 400 });
    }
  }
  const text = (value, min, max) =>
    typeof value === 'string' && value.trim().length >= min && value.length <= max;
  function validImage(value) {
    if (value === '') return true;
    if (typeof value !== 'string') return false;
    const match = value.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return false;
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > 3 * 1024 * 1024) return false;
    return match[1] === 'jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const method = request.method;
    const route = url.pathname;
    try {
      if (method === 'GET' && route === '/health') return reply(response, 200, { ok: true });
      // เปิด fault เฉพาะตอนทดสอบ ห้ามใช้เป็น production configuration
      if (process.env.ENABLE_TEST_FAULTS === '1' && method === 'GET' && route === '/places') {
        const fault = request.headers['x-test-fault'];
        if (fault === '500') return reply(response, 500, { message: 'จำลอง server error' });
        if (fault === 'invalid-json') {
          response.writeHead(200);
          return response.end('{bad');
        }
        if (fault === 'invalid-shape') return reply(response, 200, { unexpected: true });
        if (fault === 'slow') await new Promise((resolve) => setTimeout(resolve, 15000));
      }
      if (method === 'GET' && route === '/places') return reply(response, 200, database.places);
      if (method === 'GET' && route.startsWith('/places/')) {
        const place = database.places.find((item) => item.id === route.slice('/places/'.length));
        return reply(response, place ? 200 : 404, place || { message: 'ไม่พบสถานที่นี้' });
      }
      if (method === 'POST' && route === '/auth/login') {
        const address = request.socket.remoteAddress;
        const attempt = attempts.get(address) || { count: 0, reset: Date.now() + 60000 };
        if (attempt.reset < Date.now()) {
          attempt.count = 0;
          attempt.reset = Date.now() + 60000;
        }
        attempts.set(address, attempt);
        if (attempt.count >= 10)
          return reply(response, 429, { message: 'ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอ 1 นาที' });
        const data = await body(request);
        const input = Buffer.from(typeof data.password === 'string' ? data.password : '');
        const expected = Buffer.from(password);
        if (
          typeof data.email !== 'string' ||
          data.email.trim().toLowerCase() !== demoEmail ||
          input.length !== expected.length ||
          !timingSafeEqual(input, expected)
        ) {
          attempt.count++;
          return reply(response, 401, { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        attempt.count = 0;
        const token = randomBytes(32).toString('hex');
        const session = {
          name: 'Jutatip',
          email: demoEmail,
          expiresAt: Date.now() + sessionMs,
        };
        sessions.set(token, session);
        return reply(response, 200, { token, ...session });
      }
      const protectedRoute =
        route === '/trips' ||
        route.startsWith('/trips/') ||
        route === '/auth/me' ||
        route === '/auth/logout' ||
        (route === '/places' && method === 'POST');
      const session = authorize(request);
      if (protectedRoute && !session)
        return reply(response, 401, { message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง' });
      if (method === 'GET' && route === '/auth/me')
        return reply(response, 200, { email: session.email, name: session.name });
      if (method === 'POST' && route === '/auth/logout') {
        sessions.delete(session.token);
        return reply(response, 200, { ok: true });
      }
      if (route === '/trips' && method === 'GET')
        return reply(
          response,
          200,
          database.trips.filter((trip) => trip.owner === session.email),
        );
      const tripPath = route.match(/^\/trips\/([a-zA-Z0-9-]+)(?:\/(memories))?$/);
      let trip =
        tripPath &&
        database.trips.find((item) => item.id === tripPath[1] && item.owner === session.email);
      if (tripPath && !trip) return reply(response, 404, { message: 'ไม่พบทริปนี้' });
      if (tripPath && !tripPath[2] && method === 'GET') return reply(response, 200, trip);
      if (tripPath && !tripPath[2] && method === 'DELETE') {
        database.trips = database.trips.filter((item) => item.id !== trip.id);
        await persist();
        return reply(response, 200, { ok: true });
      }
      if (tripPath?.[2] === 'memories' && method === 'POST') {
        const data = await body(request);
        trip = database.trips.find(
          (item) => item.id === tripPath[1] && item.owner === session.email,
        );
        if (!trip) return reply(response, 404, { message: 'ไม่พบทริปนี้' });
        if (
          !text(data.id, 1, 80) ||
          !/^[a-zA-Z0-9-]+$/.test(data.id) ||
          !data.imageUrl ||
          !validImage(data.imageUrl) ||
          typeof data.createdAt !== 'string' ||
          !Number.isFinite(Date.parse(data.createdAt))
        )
          return reply(response, 400, {
            message: 'รูปภาพหรือวันที่ไม่ถูกต้อง รองรับ JPEG/PNG ไม่เกิน 3 MB',
          });
        if (!trip.memories.some((memory) => memory.id === data.id)) {
          trip.memories.push({ id: data.id, imageUrl: data.imageUrl, createdAt: data.createdAt });
          trip.updatedAt = new Date().toISOString();
        }
        await persist();
        return reply(response, 200, trip);
      }
      if (
        (route === '/trips' && method === 'POST') ||
        (tripPath && !tripPath[2] && method === 'PATCH')
      ) {
        const data = await body(request);
        if (tripPath) {
          trip = database.trips.find(
            (item) => item.id === tripPath[1] && item.owner === session.email,
          );
          if (!trip) return reply(response, 404, { message: 'ไม่พบทริปนี้' });
        }
        if (
          !text(data.title, 2, 100) ||
          typeof data.startsAt !== 'string' ||
          !Number.isFinite(Date.parse(data.startsAt)) ||
          !Array.isArray(data.placeIds) ||
          data.placeIds.length > 100 ||
          new Set(data.placeIds).size !== data.placeIds.length ||
          !data.placeIds.every((id) => database.places.some((place) => place.id === id))
        )
          return reply(response, 400, { message: 'กรอกชื่อ วันเวลา และสถานที่ในทริปให้ถูกต้อง' });
        const stopTimes =
          data.stopTimes ??
          (trip?.stopTimes || []).filter((stop) => data.placeIds.includes(stop.placeId));
        if (
          !Array.isArray(stopTimes) ||
          stopTimes.length > 100 ||
          new Set(stopTimes.map((stop) => stop?.placeId)).size !== stopTimes.length ||
          !stopTimes.every(
            (stop) =>
              stop &&
              data.placeIds.includes(stop.placeId) &&
              typeof stop.startsAt === 'string' &&
              typeof stop.endsAt === 'string' &&
              Number.isFinite(Date.parse(stop.startsAt)) &&
              Number.isFinite(Date.parse(stop.endsAt)) &&
              Date.parse(stop.startsAt) >= Date.parse(data.startsAt) &&
              Date.parse(stop.endsAt) > Date.parse(stop.startsAt),
          )
        )
          return reply(response, 400, {
            message: 'เวลาเที่ยวต้องอยู่หลังเริ่มทริป และเวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม',
          });
        let plan;
        try {
          plan = validatePlan(data, trip, stopTimes);
        } catch (error) {
          return reply(response, 400, { message: error.message });
        }
        if (route === '/trips' && (!text(data.id, 1, 80) || !/^[a-zA-Z0-9-]+$/.test(data.id)))
          return reply(response, 400, { message: 'รหัสทริปไม่ถูกต้อง' });
        const existing = database.trips.find((item) => item.id === data.id);
        if (route === '/trips' && existing) {
          await persist();
          return reply(
            response,
            existing.owner === session.email ? 200 : 409,
            existing.owner === session.email ? existing : { message: 'รหัสทริปซ้ำ กรุณาลองใหม่' },
          );
        }
        const next = {
          ...(trip || { id: data.id, owner: session.email, memories: [] }),
          title: data.title.trim(),
          startsAt: new Date(data.startsAt).toISOString(),
          placeIds: data.placeIds,
          stopTimes,
          ...plan,
          updatedAt: new Date().toISOString(),
        };
        if (trip) database.trips[database.trips.indexOf(trip)] = next;
        else database.trips.unshift(next);
        await persist();
        return reply(response, trip ? 200 : 201, next);
      }
      if (method === 'POST' && route === '/places') {
        const data = await body(request);
        if (
          !text(data.title, 4, 100) ||
          !text(data.description, 20, 2000) ||
          !text(data.district, 1, 100) ||
          !text(data.category, 1, 40) ||
          !Number.isFinite(data.latitude) ||
          Math.abs(data.latitude) > 90 ||
          !Number.isFinite(data.longitude) ||
          Math.abs(data.longitude) > 180 ||
          !validImage(data.imageUrl)
        )
          return reply(response, 400, {
            message: 'ข้อมูลสถานที่หรือรูปภาพไม่ถูกต้อง (รองรับ JPEG/PNG ไม่เกิน 3 MB)',
          });
        const place = {
          id: randomUUID(),
          title: data.title.trim(),
          description: data.description.trim(),
          district: data.district.trim(),
          category: data.category.trim(),
          latitude: data.latitude,
          longitude: data.longitude,
          imageUrl: data.imageUrl,
          contributor: session.name,
        };
        database.places.unshift(place);
        await persist();
        return reply(response, 201, place);
      }
      return reply(response, 404, { message: 'ไม่พบ API route นี้' });
    } catch (error) {
      return reply(response, error.status || 500, {
        message: error.status ? error.message : 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง',
      });
    }
  });
  return { server, demoEmail, password };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3001);
  const { server, demoEmail, password } = await createApi({ password: process.env.DEMO_PASSWORD });
  server.listen(port, '0.0.0.0', () => {
    console.log(
      `Nong Khai API ready on port ${port}\nDemo email: ${demoEmail}\nDemo password: ${password}\nบัญชีจำลองสำหรับทดสอบในเครือข่ายส่วนตัวเท่านั้น`,
    );
  });
}
