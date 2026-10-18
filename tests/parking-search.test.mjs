import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  normalizeParkingLots,
  findNearbyParkingLots,
} from '../src/common/ParkingSearch.js';

const actual = JSON.parse(
  fs.readFileSync(
    new URL('../src/assets/parking/gangseo-parking-lots.json', import.meta.url),
    'utf8',
  ),
);

test('실제 Seed 데이터는 37건이며 식별자가 중복되지 않는다', () => {
  const rows = normalizeParkingLots(actual);
  assert.equal(rows.length, 37);
  assert.equal(new Set(rows.map((row) => row.id)).size, 37);
});

test('반경 밖 데이터를 제외하고 가까운 순으로 정렬한다', () => {
  const rows = normalizeParkingLots([
    { id: 'far', name: '멀리', longitude: 0, latitude: 0.02 },
    { id: 'near', name: '근처', longitude: 0, latitude: 0.001 },
    { id: 'same', name: '동일 위치', longitude: 0, latitude: 0 },
  ]);

  const result = findNearbyParkingLots(
    rows, { longitude: 0, latitude: 0 }, 1000,
  );

  assert.deepEqual(result.map((row) => row.id), ['same', 'near']);
  assert.equal(result[0].straightDistanceMeters, 0);
  assert.ok(result[1].straightDistanceMeters > 110);
  assert.ok(result[1].straightDistanceMeters < 112);
  assert.equal(rows[0].straightDistanceMeters, undefined);
});

test('실제 주차장 위치를 목적지로 선택하면 자신이 0m로 조회된다', () => {
  const rows = normalizeParkingLots(actual);
  const first = rows[0];
  const result = findNearbyParkingLots(rows, first, 300);
  const self = result.find((row) => row.id === first.id);
  assert.ok(self);
  assert.equal(self.straightDistanceMeters, 0);
});

test('같은 목적지에서 반경을 늘리면 결과가 줄어들지 않는다', () => {
  const rows = normalizeParkingLots(actual);
  const small = findNearbyParkingLots(rows, rows[0], 300);
  const large = findNearbyParkingLots(rows, rows[0], 2000);
  assert.ok(large.length >= small.length);
});

test('빈 좌표, 잘못된 반경, 중복 ID를 거부한다', () => {
  assert.throws(() =>
    findNearbyParkingLots([], { longitude: '', latitude: 0 }, 1000),
  );

  assert.throws(() =>
    findNearbyParkingLots([], { longitude: 0, latitude: 0 }, 0),
  );

  assert.throws(() => normalizeParkingLots([
    { id: 'a', name: '첫째', longitude: 0, latitude: 0 },
    { id: 'a', name: '둘째', longitude: 0, latitude: 0 },
  ]));
});