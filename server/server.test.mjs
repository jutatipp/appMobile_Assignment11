import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApi } from './index.mjs';

async function fixture(t, options = {}) {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'nongkhai-trip-test-'));
  const password = 'test-only-password';
  const api = await createApi({ dataDir, password, ...options });
  await new Promise((resolve) => api.server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => api.server.close(resolve));
    await rm(dataDir, { recursive: true });
  });
  const base = `http://127.0.0.1:${api.server.address().port}`;
  async function request(route, method = 'GET', data, token) {
    return fetch(base + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }
  const login = async () =>
    (await request('/auth/login', 'POST', { email: api.demoEmail, password })).json();
  return { request, login, dataDir, password };
}
const draft = (ids = []) => ({
  id: 'trip-test',
  title: 'หนองคายวันหยุด',
  startsAt: '2026-12-20T02:00:00.000Z',
  placeIds: ids,
});
const image =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4WQAAAAASUVORK5CYII=';

test('places, login, protected trips and session expiry/logout', async (t) => {
  const { request, login } = await fixture(t);
  assert.equal((await (await request('/places')).json()).length, 10);
  assert.equal((await request('/places/missing')).status, 404);
  assert.equal((await request('/trips')).status, 401);
  assert.equal((await request('/trips', 'POST', draft())).status, 401);
  assert.equal(
    (await request('/auth/login', 'POST', { email: 'wrong', password: 'wrong' })).status,
    401,
  );
  const auth = await login();
  assert.equal((await request('/auth/me', 'GET', undefined, auth.token)).status, 200);
  await request('/auth/logout', 'POST', {}, auth.token);
  assert.equal((await request('/trips', 'GET', undefined, auth.token)).status, 401);
});

test('create, retry, ordered stops, validation, memories, restart and delete', async (t) => {
  const { request, login, dataDir, password } = await fixture(t);
  const auth = await login();
  const places = await (await request('/places')).json();
  const ids = places.slice(0, 2).map((p) => p.id);
  const call = (route, method = 'GET', body) => request(route, method, body, auth.token);
  assert.equal((await call('/trips', 'POST', { ...draft(ids), startsAt: 'invalid' })).status, 400);
  assert.equal((await call('/trips', 'POST', draft(['missing']))).status, 400);
  assert.equal((await call('/trips', 'POST', draft([ids[0], ids[0]]))).status, 400);
  assert.equal((await call('/trips', 'POST', draft(ids))).status, 201);
  assert.equal((await call('/trips', 'POST', draft(ids))).status, 200);
  assert.equal((await (await call('/trips')).json()).length, 1);
  const updated = await (await call('/trips/trip-test', 'PATCH', draft([...ids].reverse()))).json();
  assert.deepEqual(updated.placeIds, [...ids].reverse());
  const memory = { id: 'memory-1', imageUrl: image, createdAt: '2026-09-24T00:00:00Z' };
  assert.equal(
    (
      await call('/trips/trip-test/memories', 'POST', {
        ...memory,
        imageUrl: 'data:image/png;base64,AAAA',
      })
    ).status,
    400,
  );
  assert.equal((await call('/trips/trip-test/memories', 'POST', memory)).status, 200);
  const retried = await (await call('/trips/trip-test/memories', 'POST', memory)).json();
  assert.equal(retried.memories.length, 1);
  const stored = JSON.parse(await readFile(path.join(dataDir, 'database.json'), 'utf8'));
  assert.equal(stored.trips[0].memories[0].imageUrl, image);
  stored.trips.push({ ...stored.trips[0], id: 'foreign', owner: 'another@example.com' });
  await writeFile(path.join(dataDir, 'database.json'), JSON.stringify(stored));
  const restarted = await createApi({ dataDir, password });
  await new Promise((resolve) => restarted.server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${restarted.server.address().port}`;
    const session = await (
      await fetch(base + '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: restarted.demoEmail, password }),
      })
    ).json();
    const headers = { Authorization: `Bearer ${session.token}` };
    const list = await (await fetch(base + '/trips', { headers })).json();
    assert.equal(list.length, 1);
    assert.equal(list[0].memories.length, 1);
    for (const method of ['GET', 'PATCH', 'DELETE'])
      assert.equal((await fetch(base + '/trips/foreign', { method, headers })).status, 404);
    assert.equal(
      (
        await fetch(base + '/trips/foreign/memories', {
          method: 'POST',
          headers,
          body: JSON.stringify(memory),
        })
      ).status,
      404,
    );
  } finally {
    await new Promise((resolve) => restarted.server.close(resolve));
  }
  assert.equal((await call('/trips/trip-test', 'DELETE')).status, 200);
  assert.equal((await call('/trips/trip-test')).status, 404);
  assert.equal((await (await call('/trips')).json()).length, 0);
});

test('expired token cannot mutate trips', async (t) => {
  const { request, login } = await fixture(t, { sessionMs: 1 });
  const auth = await login();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal((await request('/trips', 'POST', draft(), auth.token)).status, 401);
});

test('requested login account, normalization, password rejection and legacy trip migration', async (t) => {
  const { request, dataDir } = await fixture(t, { password: '123456' });
  const response = await request('/auth/login', 'POST', {
    email: ' JUTATIP@gmail.com ',
    password: '123456',
  });
  assert.equal(response.status, 200);
  const auth = await response.json();
  assert.equal(auth.email, 'jutatip@gmail.com');
  assert.equal(auth.name, 'Jutatip');
  assert.equal(
    (
      await request('/auth/login', 'POST', {
        email: 'jutatip@gmail.com',
        password: 'wrong-password',
      })
    ).status,
    401,
  );
  assert.equal(
    (await request('/auth/login', 'POST', { email: 'test@test.com', password: '123456' })).status,
    401,
  );
  const stored = JSON.parse(await readFile(path.join(dataDir, 'database.json'), 'utf8'));
  stored.trips = [
    { ...draft(), owner: 'test@test.com', memories: [], updatedAt: new Date().toISOString() },
  ];
  await writeFile(path.join(dataDir, 'database.json'), JSON.stringify(stored));
  const migrated = await createApi({ dataDir });
  assert.equal(migrated.demoEmail, 'jutatip@gmail.com');
  const saved = JSON.parse(await readFile(path.join(dataDir, 'database.json'), 'utf8'));
  assert.equal(saved.trips[0].owner, 'jutatip@gmail.com');
  assert.equal(saved.trips[0].id, 'trip-test');
});

test('per-place visit times validate, survive edits and restart, and clear when a place is removed', async (t) => {
  const { request, login, dataDir, password } = await fixture(t);
  const auth = await login();
  const places = await (await request('/places')).json();
  const ids = places.slice(0, 2).map((p) => p.id);
  const call = (route, method, body) => request(route, method, body, auth.token);
  const stop = {
    placeId: ids[0],
    startsAt: '2026-12-20T03:00:00.000Z',
    endsAt: '2026-12-20T05:00:00.000Z',
  };
  for (const stopTimes of [
    [{ ...stop, placeId: 'missing' }],
    [stop, stop],
    [{ ...stop, endsAt: stop.startsAt }],
    [{ ...stop, startsAt: 'bad' }],
    [{ ...stop, startsAt: '2026-12-19T03:00:00Z' }],
    [null],
    {},
  ]) {
    assert.equal((await call('/trips', 'POST', { ...draft(ids), stopTimes })).status, 400);
  }
  assert.equal((await call('/trips', 'POST', { ...draft(ids), stopTimes: [stop] })).status, 201);
  const edited = await (await call('/trips/trip-test', 'PATCH', draft([...ids].reverse()))).json();
  assert.deepEqual(edited.stopTimes, [stop]);
  await createApi({ dataDir, password });
  const stored = JSON.parse(await readFile(path.join(dataDir, 'database.json'), 'utf8'));
  assert.deepEqual(stored.trips[0].stopTimes, [stop]);
  const removed = await (await call('/trips/trip-test', 'PATCH', draft([ids[1]]))).json();
  assert.deepEqual(removed.stopTimes, []);
});

test('trip date range, assigned days without times, and clear-time preservation', async (t) => {
  const { request, login, dataDir, password } = await fixture(t);
  const auth = await login();
  const places = await (await request('/places')).json();
  const ids = places.slice(0, 2).map((p) => p.id);
  const call = (route, method, body) => request(route, method, body, auth.token);
  const plan = {
    ...draft(ids),
    endsAt: '2026-12-22T11:00:00Z',
    placeDays: [
      { placeId: ids[0], date: '2026-12-20' },
      { placeId: ids[1], date: '2026-12-22' },
    ],
  };
  assert.equal((await call('/trips', 'POST', { ...plan, endsAt: plan.startsAt })).status, 400);
  assert.equal(
    (
      await call('/trips', 'POST', {
        ...plan,
        placeDays: [{ placeId: ids[0], date: '2026-12-23' }, plan.placeDays[1]],
      })
    ).status,
    400,
  );
  assert.equal((await call('/trips', 'POST', plan)).status, 201);
  const saved = await (await call('/trips/trip-test', 'GET')).json();
  assert.deepEqual(saved.placeDays, plan.placeDays);
  assert.deepEqual(saved.stopTimes, []);
  const stop = {
    placeId: ids[1],
    startsAt: '2026-12-22T02:00:00Z',
    endsAt: '2026-12-22T04:00:00Z',
  };
  assert.equal(
    (await call('/trips/trip-test', 'PATCH', { ...plan, stopTimes: [stop] })).status,
    200,
  );
  assert.equal(
    (
      await call('/trips/trip-test', 'PATCH', {
        ...plan,
        stopTimes: [{ ...stop, endsAt: '2026-12-22T12:00:00Z' }],
      })
    ).status,
    400,
  );
  assert.equal(
    (await call('/trips/trip-test', 'PATCH', { ...plan, endsAt: '2026-12-21T11:00:00Z' })).status,
    400,
  );
  const cleared = await (
    await call('/trips/trip-test', 'PATCH', { ...plan, stopTimes: [] })
  ).json();
  assert.deepEqual(cleared.placeDays, plan.placeDays);
  assert.deepEqual(cleared.stopTimes, []);
  await createApi({ dataDir, password });
  const persisted = JSON.parse(await readFile(path.join(dataDir, 'database.json'), 'utf8'))
    .trips[0];
  assert.deepEqual(persisted.placeDays, plan.placeDays);
  assert.equal(persisted.endsAt, '2026-12-22T11:00:00.000Z');
  const removed = await (
    await call('/trips/trip-test', 'PATCH', { ...draft([ids[0]]), endsAt: plan.endsAt })
  ).json();
  assert.deepEqual(removed.placeDays, [plan.placeDays[0]]);
});
