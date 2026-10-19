import { haversineDistance } from './GeoUtil.js';

function coordinate(value, min, max) {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    String(value).trim() === ''
  ) {
    throw new Error('좌표가 없습니다.');
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error('좌표 범위가 올바르지 않습니다.');
  }

  return number;
}

export function normalizeParkingLots(rows) {
  if (!Array.isArray(rows)) {
    throw new Error('주차장 데이터가 배열이 아닙니다.');
  }

  const ids = new Set();

  return rows.map((row) => {
    const id = String(row.id ?? '').trim();
    const name = String(row.name ?? '').trim();

    if (!id || !name || ids.has(id)) {
      throw new Error('주차장 ID·이름 누락 또는 ID 중복을 확인하세요.');
    }

    ids.add(id);

    return {
      ...row,
      id,
      name,
      longitude: coordinate(row.longitude, -180, 180),
      latitude: coordinate(row.latitude, -90, 90),
    };
  });
}

export function findNearbyParkingLots(rows, destination, radiusMeters) {
  const longitude = coordinate(destination?.longitude, -180, 180);
  const latitude = coordinate(destination?.latitude, -90, 90);
  const radius = Number(radiusMeters);

  if (!Number.isFinite(radius) || radius <= 0 || radius > 5000) {
    throw new Error('조회 반경은 0m 초과, 5,000m 이하여야 합니다.');
  }

  return rows
    .map((parking) => ({
      ...parking,
      straightDistanceMeters: haversineDistance(
        [longitude, latitude],
        [parking.longitude, parking.latitude],
      ),
    }))
    .filter((parking) => parking.straightDistanceMeters <= radius)
    .sort(
      (a, b) =>
        a.straightDistanceMeters - b.straightDistanceMeters ||
        a.id.localeCompare(b.id),
    );
}