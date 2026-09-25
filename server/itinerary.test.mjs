import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/utils/itinerary.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { tripDays, tripDay, placeDay, tripEnd } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
);

test('calendar days include empty days, handle Thai midnight and same-day trips', () => {
  assert.equal(tripDay('2026-12-20T18:00:00Z'), '2026-12-21');
  assert.deepEqual(tripDays({ startsAt: '2026-12-20T02:00:00Z', endsAt: '2026-12-22T11:00:00Z' }), [
    '2026-12-20',
    '2026-12-21',
    '2026-12-22',
  ]);
  assert.deepEqual(tripDays({ startsAt: '2026-12-20T02:00:00Z', endsAt: '2026-12-20T11:00:00Z' }), [
    '2026-12-20',
  ]);
  assert.deepEqual(tripDays({ startsAt: '2026-12-31T02:00:00Z', endsAt: '2027-01-02T11:00:00Z' }), [
    '2026-12-31',
    '2027-01-01',
    '2027-01-02',
  ]);
});
test('legacy plans preserve timed days, and unscheduled places stay on assigned day', () => {
  const trip = {
    startsAt: '2026-12-20T02:00:00Z',
    placeIds: ['a', 'b'],
    stopTimes: [{ placeId: 'a', startsAt: '2026-12-22T02:00:00Z', endsAt: '2026-12-22T04:00:00Z' }],
  };
  assert.equal(tripEnd(trip), '2026-12-22T16:59:00.000Z');
  assert.equal(placeDay(trip, 'a'), '2026-12-22');
  assert.equal(placeDay(trip, 'b'), '2026-12-20');
  assert.equal(
    placeDay({ ...trip, placeDays: [{ placeId: 'b', date: '2026-12-21' }] }, 'b'),
    '2026-12-21',
  );
  assert.equal(tripDays(trip).length, 3);
});
