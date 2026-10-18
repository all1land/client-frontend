/**
 * all1land/mockup의 기존 직선거리 함수 재사용.
 * 좌표 순서: [경도, 위도], 반환 단위: 미터.
 * 원본 커밋: 835e3daf8bb2ea5ce0180a093cf57f222e12caee
 */
export function haversineDistance([lon1, lat1], [lon2, lat2]) {
  const EARTH_RADIUS = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
}
