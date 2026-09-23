import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApi } from './index.mjs';

async function fixture(t, sessionMs) {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'nongkhai-test-'));
  const password = 'test-only-password';
  const api = await createApi({ dataDir, password, sessionMs });
  await new Promise((resolve) => api.server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => api.server.close(resolve));
    await rm(dataDir, { recursive: true });
  });
  const base = `http://127.0.0.1:${api.server.address().port}`;
  async function request(route, data, token) {
    return fetch(`${base}${route}`, {
      method: data === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }
  const login = async () =>
    (await request('/auth/login', { email: api.demoEmail, password })).json();
  return { request, login, dataDir };
}

test('API: list, detail, authorization, validation, duplicate retry and logout', async (t) => {
  const { request, login } = await fixture(t);
  const list = await (await request('/events')).json();
  assert.equal(list.length, 10);
  assert.equal((await request('/events/missing')).status, 404);
  assert.equal((await request('/registrations', {})).status, 401);
  assert.equal((await request('/auth/login', { email: 'wrong', password: 'wrong' })).status, 401);
  const session = await login();
  assert.equal((await request('/auth/me', undefined, session.token)).status, 200);
  const form = {
    eventId: list[0].id,
    name: 'Test Student',
    email: 'student@example.com',
    guests: 2,
  };
  assert.equal(
    (await request('/registrations', { ...form, guests: 0 }, session.token)).status,
    400,
  );
  const first = await (await request('/registrations', form, session.token)).json();
  const retry = await (await request('/registrations', form, session.token)).json();
  assert.equal(first.id, retry.id);
  await request('/auth/logout', {}, session.token);
  assert.equal((await request('/auth/me', undefined, session.token)).status, 401);
});

test('API: event creation, image validation, persistence and capacity', async (t) => {
  const { request, login, dataDir } = await fixture(t);
  const session = await login();
  const form = {
    title: 'กิจกรรมทดสอบ',
    description: 'กิจกรรมทดสอบเพื่อใช้เรียนรู้ React Native',
    district: 'หนองคาย',
    category: 'ชุมชน',
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    capacity: 1,
    latitude: 17.88,
    longitude: 102.74,
    imageUrl: '',
  };
  assert.equal(
    (
      await request(
        '/events',
        { ...form, imageUrl: 'data:image/png;base64,ZmFrZQ==' },
        session.token,
      )
    ).status,
    400,
  );
  assert.equal((await request('/events', { ...form, latitude: 999 }, session.token)).status, 400);
  const result = await request('/events', form, session.token);
  assert.equal(result.status, 201);
  const event = await result.json();
  assert.equal((await request(`/events/${event.id}`)).status, 200);
  assert.equal(
    (
      await request(
        '/registrations',
        { eventId: event.id, name: 'Student', email: 'student@example.com', guests: 2 },
        session.token,
      )
    ).status,
    409,
  );
  const restored = await createApi({ dataDir });
  await new Promise((resolve) => restored.server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => restored.server.close(resolve)));
  const persisted = await (
    await fetch(`http://127.0.0.1:${restored.server.address().port}/events/${event.id}`)
  ).json();
  assert.equal(persisted.title, form.title);
});

test('API rejects expired session on protected endpoint', async (t) => {
  const { request, login } = await fixture(t, 1);
  const session = await login();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal((await request('/registrations', {}, session.token)).status, 401);
});
