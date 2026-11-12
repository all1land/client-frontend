import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Style from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';

// 네이버 지도 스타일
// - 자동차: 진한 파란 외곽선 + 파란 실선
// - 도보: 흰 외곽선 + 파란 점선(원형 점)
const ROUTE_COLOR = '#127ab7';
const WALKING_COLOR = '#6A7282';
const ROUTE_OUTLINE_COLOR = 'rgb(17, 70, 168)';

// 도보 점선: 길이 0.1 + round cap으로 원형 점을 만들고, 외곽선/본선이 같은 패턴을 써서 점 위치를 맞춤
const WALKING_DASH = [0.1, 12];

const routeStyles = {
  DRIVING: [
    new Style({
      zIndex: 0,
      stroke: new Stroke({
        color: ROUTE_OUTLINE_COLOR,
        width: 8,
        lineCap: 'round',
        lineJoin: 'round',
      }),
    }),
    new Style({
      zIndex: 1,
      stroke: new Stroke({
        color: ROUTE_COLOR,
        width: 6,
        lineCap: 'round',
        lineJoin: 'round',
      }),
    }),
  ],
  WALKING: [
    new Style({
      zIndex: 0,
      stroke: new Stroke({
        color: '#ffffff',
        width: 9,
        lineCap: 'round',
        lineJoin: 'round',
        lineDash: WALKING_DASH,
      }),
    }),
    new Style({
      zIndex: 1,
      stroke: new Stroke({
        color: WALKING_COLOR,
        width: 7,
        lineCap: 'round',
        lineJoin: 'round',
        lineDash: WALKING_DASH,
      }),
    }),
  ],
};

/** POST /api/routes/all 응답의 [경도, 위도] 좌표를 지도 투영 좌표로 변환해 표시합니다. */
export function createMapRoute(map) {
  const source = new VectorSource({ wrapX: false });
  const layer = new VectorLayer({
    source,
    zIndex: 30,
    style: (feature) => routeStyles[feature.get('mode')],
  });
  layer.set('name', 'map-routes');
  let disposed = false;
  map.addLayer(layer);

  function clear() {
    source.clear();
  }

  function draw(response, { fit = true, padding } = {}) {
    if (disposed) return 0;
    clear();
    const data = response?.data ?? response;
    if (response?.success === false || !Array.isArray(data?.segments)) {
      throw new Error('경로 응답의 segments 형식을 확인해주세요.');
    }
    const projection = map.getView().getProjection();
    const features = [...data.segments]
      .sort((a, b) => a.sequence - b.sequence)
      .map((segment) => {
        if (!Object.hasOwn(routeStyles, segment.mode) ||
            !Array.isArray(segment.coordinates) || segment.coordinates.length < 2 ||
            !segment.coordinates.every((point) => Array.isArray(point) && point.length === 2 &&
              Number.isFinite(point[0]) && Math.abs(point[0]) <= 180 &&
              Number.isFinite(point[1]) && Math.abs(point[1]) <= 90)) {
          throw new Error('경로 구간의 이동 방식 또는 좌표가 올바르지 않습니다.');
        }
        return new Feature({
          ...segment,
          geometry: new LineString(segment.coordinates.map((point) => [...point]))
            .transform('EPSG:4326', projection),
        });
      });
    source.addFeatures(features);
    if (fit && features.length) {
      // 넓은 화면에서는 왼쪽 검색 패널(300px)에 경로가 가려지지 않게 여백을 둡니다.
      const wide = (map.getSize()?.[0] ?? 0) > 700;
      map.getView().fit(source.getExtent(), {
        padding: padding ?? (wide ? [48, 48, 48, 348] : [32, 32, 32, 32]),
        maxZoom: 17,
        duration: 400,
      });
    }
    return features.length;
  }

  function destroy() {
    if (disposed) return;
    disposed = true;
    clear();
    map.removeLayer(layer);
  }

  return { draw, clear, destroy, source, layer };
}