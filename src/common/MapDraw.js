import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { circular } from 'ol/geom/Polygon.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import PointerInteraction from 'ol/interaction/Pointer.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { getDistance } from 'ol/sphere.js';
import { Style, Fill, Stroke, Text, Circle as CircleStyle } from 'ol/style.js';

/**
 * 도착지 중심의 검색 반경을 미터 단위로 표시하고 테두리 드래그로 편집합니다.
 * 편집 완료 시 options.onRadiusChange(radiusMeters)를 호출합니다.
 */
export function createMapDraw(map, options = {}) {
  // ----- 선언부 ----- //
  const projection = map.getView().getProjection();
  const viewport = map.getViewport();
  const source = new VectorSource({ wrapX: false });
  const feature = new Feature();
  const tolerance = options.pixelTolerance ?? 10;
  let center = null;
  let radiusMeters = 0;
  let initialRadius = 0;
  let handleCoordinate = null;
  let editing = false;
  let dragging = false;
  let disposed = false;
  let savedCursor = null;
  let savedCursorPriority = '';

  const layer = new VectorLayer({ source, style: styleFeature, zIndex: 15 });
  const interaction = new PointerInteraction({
    handleMoveEvent: handleMove,
    handleDownEvent: handleDown,
    handleDragEvent: handleDrag,
    handleUpEvent: handleUp,
  });

  // ----- 지도 등록 및 초기화 ----- //
  map.addLayer(layer);
  map.addInteraction(interaction);
  viewport.addEventListener('pointerleave', handleLeave);
  if (options.center) setCircle(options.center, options.radiusMeters);

  return { setCircle, getRadius, clear, source, layer, destroy };

  // ----- 함수 정의 ----- //
  function setCircle(location, radius) {
    if (disposed) return;
    const latitude = location?.latitude ?? location?.lat;
    const longitude = location?.longitude ?? location?.lng;
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
        !Number.isFinite(radius) || radius <= 0) {
      clear();
      return;
    }
    dragging = false;
    setEditing(false);
    center = [longitude, latitude];
    radiusMeters = radius;
    redrawCircle();
  }

  function getRadius() {
    return radiusMeters;
  }

  function redrawCircle() {
    // 지상 거리로 원을 만든 뒤 지도 좌표로 변환해 위도에 따른 축척 차이를 반영합니다.
    feature.setGeometry(circular(center, radiusMeters, 128).transform('EPSG:4326', projection));
    if (!source.hasFeature(feature)) source.addFeature(feature);
  }

  function styleFeature() {
    const color = editing ? '#F56652' : '#e6432d';
    const styles = [new Style({
      fill: new Fill({ color: 'rgba(245, 102, 82, 0.08)' }),
      stroke: new Stroke({ color, width: editing ? 3 : 2 }),
    })];
    if (center) {
      styles.push(new Style({
        geometry: new Point(fromLonLat(center, projection)),
        text: new Text({
          text: '반경 ' + Math.round(radiusMeters).toLocaleString() + ' m',
          font: '13px sans-serif',
          fill: new Fill({ color }),
          backgroundFill: new Fill({ color: '#ffffff' }),
          padding: [4, 6, 4, 6],
          offsetY: +22,
        }),
      }));
    }
    if (editing && handleCoordinate) {
      styles.push(new Style({
        geometry: new Point(handleCoordinate),
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: '#ffffff' }),
          stroke: new Stroke({ color, width: 2 }),
        }),
      }));
    }
    return styles;
  }

  function boundaryAt(event) {
    const geometry = feature.getGeometry();
    if (!geometry || !center || event.dragging) return null;
    const closest = geometry.getClosestPoint(event.coordinate);
    const pixel = map.getPixelFromCoordinate(closest);
    return Math.hypot(pixel[0] - event.pixel[0], pixel[1] - event.pixel[1]) <= tolerance
      ? closest : null;
  }

  function setEditing(active, coordinate = null) {
    if (active && savedCursor === null) {
      savedCursor = viewport.style.getPropertyValue('cursor');
      savedCursorPriority = viewport.style.getPropertyPriority('cursor');
      viewport.style.setProperty('cursor', 'ew-resize', 'important');
    } else if (!active && savedCursor !== null) {
      if (savedCursor) viewport.style.setProperty('cursor', savedCursor, savedCursorPriority);
      else viewport.style.removeProperty('cursor');
      savedCursor = null;
    }
    editing = active;
    handleCoordinate = coordinate;
    feature.changed();
  }

  function handleMove(event) {
    if (disposed || dragging) return;
    const coordinate = boundaryAt(event);
    setEditing(Boolean(coordinate), coordinate);
  }

  function handleDown(event) {
    if (disposed || (event.originalEvent.button != null && event.originalEvent.button !== 0)) return false;
    const coordinate = boundaryAt(event);
    if (!coordinate) return false;
    dragging = true;
    initialRadius = radiusMeters;
    setEditing(true, coordinate);
    return true;
  }

  function handleDrag(event) {
    if (disposed || !dragging) return;
    const radius = getDistance(center, toLonLat(event.coordinate, projection));
    if (!Number.isFinite(radius)) return;
    radiusMeters = Math.max(1, Math.round(radius));
    redrawCircle();
    handleCoordinate = feature.getGeometry().getClosestPoint(event.coordinate);
    feature.changed();
  }

  function handleUp(event) {
    if (!dragging || disposed) return false;
    dragging = false;
    const coordinate = boundaryAt(event);
    setEditing(Boolean(coordinate), coordinate);
    if (radiusMeters !== initialRadius) options.onRadiusChange?.(radiusMeters);
    return false;
  }

  function handleLeave() {
    if (!dragging) setEditing(false);
  }

  function clear() {
    dragging = false;
    setEditing(false);
    center = null;
    radiusMeters = 0;
    feature.setGeometry(undefined);
    source.clear();
  }

  // ----- lifecycle - destroy ----- //
  function destroy() {
    if (disposed) return;
    clear();
    disposed = true;
    viewport.removeEventListener('pointerleave', handleLeave);
    map.removeInteraction(interaction);
    map.removeLayer(layer);
  }
}
