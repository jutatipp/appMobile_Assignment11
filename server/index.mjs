import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// API สำหรับห้องเรียน: มีบัญชีสาธิตหนึ่งบัญชี ไม่ใช่ระบบบัญชีสำหรับ production
export async function createApi({
  dataDir = path.join(root, 'data'),
  password = randomBytes(6).toString('hex'),
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
    const seeds = JSON.parse(await readFile(path.join(root, '../src/data/events.json'), 'utf8'));
    // วันกิจกรรมใน seed ขยับตามวันเริ่ม API ครั้งแรก เพื่อให้สาธิตการตั้งเตือนได้
    database = {
      events: seeds.map((event, index) => ({
        ...event,
        startsAt: new Date(Date.now() + (index + 2) * 86400000).toISOString(),
      })),
      registrations: [],
    };
    await writeFile(file, JSON.stringify(database, null, 2));
  }
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
  const demoEmail = 'student@example.com';
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
      if (process.env.ENABLE_TEST_FAULTS === '1' && method === 'GET' && route === '/events') {
        const fault = request.headers['x-test-fault'];
        if (fault === '500') return reply(response, 500, { message: 'จำลอง server error' });
        if (fault === 'invalid-json') {
          response.writeHead(200);
          return response.end('{bad');
        }
        if (fault === 'invalid-shape') return reply(response, 200, { unexpected: true });
        if (fault === 'slow') await new Promise((resolve) => setTimeout(resolve, 15000));
      }
      if (method === 'GET' && route === '/events') return reply(response, 200, database.events);
      if (method === 'GET' && route.startsWith('/events/')) {
        const event = database.events.find((item) => item.id === route.slice('/events/'.length));
        return reply(response, event ? 200 : 404, event || { message: 'ไม่พบกิจกรรมนี้' });
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
          data.email !== demoEmail ||
          input.length !== expected.length ||
          !timingSafeEqual(input, expected)
        ) {
          attempt.count++;
          return reply(response, 401, { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        attempt.count = 0;
        const token = randomBytes(32).toString('hex');
        const session = {
          name: 'นักเดินทางหนองคาย',
          email: demoEmail,
          expiresAt: Date.now() + sessionMs,
        };
        sessions.set(token, session);
        return reply(response, 200, { token, ...session });
      }
      const protectedRoute =
        route === '/auth/me' ||
        route === '/auth/logout' ||
        route === '/registrations' ||
        (route === '/events' && method === 'POST');
      const session = authorize(request);
      if (protectedRoute && !session)
        return reply(response, 401, { message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง' });
      if (method === 'GET' && route === '/auth/me')
        return reply(response, 200, { email: session.email, name: session.name });
      if (method === 'POST' && route === '/auth/logout') {
        sessions.delete(session.token);
        return reply(response, 200, { ok: true });
      }
      if (method === 'POST' && route === '/registrations') {
        const data = await body(request);
        const event = database.events.find((item) => item.id === data.eventId);
        if (!event) return reply(response, 404, { message: 'ไม่พบกิจกรรมนี้' });
        if (
          !text(data.name, 2, 80) ||
          !text(data.email, 3, 200) ||
          !emailPattern.test(data.email) ||
          !Number.isInteger(data.guests) ||
          data.guests < 1 ||
          data.guests > 5
        )
          return reply(response, 400, { message: 'ข้อมูลลงทะเบียนไม่ถูกต้อง' });
        // หนึ่งบัญชีต่อหนึ่งกิจกรรม: retry หลังเน็ตขาดจะได้รายการเดิม ไม่เพิ่มซ้ำ
        const previous = database.registrations.find(
          (item) => item.eventId === event.id && item.owner === session.email,
        );
        if (previous) {
          const { owner, ...result } = previous;
          return reply(response, 200, result);
        }
        if (Date.parse(event.startsAt) <= Date.now())
          return reply(response, 409, { message: 'กิจกรรมนี้เริ่มแล้ว' });
        const total = database.registrations
          .filter((item) => item.eventId === event.id)
          .reduce((sum, item) => sum + item.guests, 0);
        if (total + data.guests > event.capacity)
          return reply(response, 409, { message: 'จำนวนที่ว่างไม่เพียงพอ' });
        const registration = {
          id: randomUUID(),
          eventId: event.id,
          name: data.name.trim(),
          email: data.email.trim(),
          guests: data.guests,
        };
        database.registrations.push({ ...registration, owner: session.email });
        await persist();
        return reply(response, 201, registration);
      }
      if (method === 'POST' && route === '/events') {
        const data = await body(request);
        if (
          !text(data.title, 4, 100) ||
          !text(data.description, 20, 2000) ||
          !text(data.district, 1, 100) ||
          !text(data.category, 1, 40) ||
          typeof data.startsAt !== 'string' ||
          !Number.isFinite(Date.parse(data.startsAt)) ||
          Date.parse(data.startsAt) <= Date.now() ||
          !Number.isInteger(data.capacity) ||
          data.capacity < 1 ||
          data.capacity > 100 ||
          !Number.isFinite(data.latitude) ||
          Math.abs(data.latitude) > 90 ||
          !Number.isFinite(data.longitude) ||
          Math.abs(data.longitude) > 180 ||
          !validImage(data.imageUrl)
        )
          return reply(response, 400, {
            message: 'ข้อมูลกิจกรรมหรือรูปภาพไม่ถูกต้อง (รองรับ JPEG/PNG ไม่เกิน 3 MB)',
          });
        const event = {
          id: randomUUID(),
          title: data.title.trim(),
          description: data.description.trim(),
          district: data.district.trim(),
          category: data.category.trim(),
          startsAt: data.startsAt,
          capacity: data.capacity,
          latitude: data.latitude,
          longitude: data.longitude,
          imageUrl: data.imageUrl,
          organizer: session.name,
        };
        database.events.unshift(event);
        await persist();
        return reply(response, 201, event);
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
