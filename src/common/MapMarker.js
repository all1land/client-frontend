import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { fromLonLat } from 'ol/proj.js';
import Icon from 'ol/style/Icon.js';
import Style from 'ol/style/Style.js';

import arrivalIcon from '@/assets/icons/icon-arrival-chip.svg?url';
import departIcon from '@/assets/icons/icon-depart-chip.svg?url';
import parkingChipIcon from '@/assets/icons/icon-parking-chip.svg?url';
import parkingMarkIcon from '@/assets/icons/icon-parking-mark.png?url';
import locationMarkIcon from '@/assets/icons/icon-location-mark.png?url'; 

// Vuetify 별명과 동일한 키를 사용하되 지도에는 이미지 URL을 전달합니다.
const markerIcons = {
  'cus-arrival-chip': { src: arrivalIcon, anchor: [0.5, 0.5] },
  'cus-depart-chip': { src: departIcon, anchor: [0.5, 0.5] },
  'cus-parking-chip': { src: parkingChipIcon, anchor: [0.5, 0.5] },
  'cus-parking-mark': { src: parkingMarkIcon, anchor: [0.5, 1] },
  'cus-location-mark': { src: locationMarkIcon, anchor: [0.5, 1] },

};
const markerTypes = {
  arrival: 'cus-arrival-chip',
  depart: 'cus-depart-chip',
  parking: 'cus-parking-chip',
  'parking-mark': 'cus-parking-mark',
  'location-mark': 'cus-location-mark',
};
const mapLayers = new WeakMap();

function getMarkerLayer(map) {
  let layer = mapLayers.get(map);
  if (!layer) {
    layer = new VectorLayer({ source: new VectorSource(), zIndex: 100 });
    layer.set('name', 'map-markers');
    mapLayers.set(map, layer);
  }
  if (!map.getLayers().getArray().includes(layer)) map.addLayer(layer);
  return layer;
}

/**
 * 위경도 좌표에 마커를 표시하고 Feature를 반환합니다.
 * 같은 지도에서 같은 id를 지정하면 기존 마커를 갱신합니다.
 * type: cus-arrival-chip / cus-depart-chip / cus-parking-chip / cus-parking-mark
 * Vuetify 형식($cus-arrival-chip)과 arrival / depart / parking / parking-mark도 지원합니다.
 * @param {import('ol/Map.js').default} map
 * @param {{lat: number, lng?: number, lot?: number, type: string,
 *   id?: string|number, width?: number, data?: object}} options
 * lot은 lng(경도)의 대체 키입니다. 좌표는 WGS84(위도/경도) 기준입니다.
 */
export function drawMapMarker(map, { lat, lng, lot, type, id, width = 32, data = {} } = {}) {
  if (!map?.getView || !map?.getLayers || !map?.addLayer) {
    throw new Error('마커를 표시할 지도가 필요합니다.');
  }
  const longitude = lng ?? lot;
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('유효한 위도(lat)와 경도(lng)가 필요합니다.');
  }
  const alias = typeof type === 'string' ? type.replace(/^\$/, '') : '';
  const key = markerTypes[alias] ?? alias;
  const icon = Object.hasOwn(markerIcons, key) ? markerIcons[key] : null;
  if (!icon) throw new Error(`지원하지 않는 마커 타입입니다: ${type}`);
  if (!Number.isFinite(width) || width <= 0) throw new Error('마커 너비는 양수여야 합니다.');

  const source = getMarkerLayer(map).getSource();
  const feature = (id != null ? source.getFeatureById(id) : null) ?? new Feature();
  feature.set('data', data);
  feature.set('type', key);
  feature.setGeometry(new Point(fromLonLat([longitude, lat], map.getView().getProjection())));
  feature.setStyle(new Style({
    image: new Icon({ src: icon.src, anchor: icon.anchor, width }),
  }));
  if (id != null) feature.setId(id);
  if (!source.hasFeature(feature)) source.addFeature(feature);
  return feature;
}

/** 이 유틸로 그린 마커 중 지정한 id의 마커만 삭제합니다. */
export function removeMapMarker(map, id) {
  const source = mapLayers.get(map)?.getSource();
  const feature = source?.getFeatureById(id);
  if (!feature) return false;
  source.removeFeature(feature);
  return true;
}

/** 이 유틸로 만든 마커와 전용 레이어를 모두 제거합니다. */
export function clearMapMarkers(map) {
  const layer = mapLayers.get(map);
  if (!layer) return;
  layer.getSource().clear();
  map.removeLayer(layer);
  mapLayers.delete(map);
}

export default drawMapMarker;
