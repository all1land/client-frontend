<template>
  <div class="map-view">

    <MapSidePannel>
      <router-view @update-map-markers="setMapMarkers" />
    </MapSidePannel>

    <MapTypeControl
      :current-map-type="currentMapType"
      @change-map-type="changeMapType"
    />

    <div ref="mapElement" class="map"></div>
    <v-snackbar v-model="showLocationError" :timeout="6000" role="alert">
      {{ locationError }}
    </v-snackbar>

    <div class="map-bottom-right">

      <div class="location-control">
        <v-chip class="location-chip" size="small" variant="flat">접속 위치</v-chip>
        <button
          type="button"
          class="location-button"
          :disabled="locationLoading"
          :aria-busy="locationLoading"
          aria-label="접속 위치 다시 찾기"
          @click="locateCurrentPosition"
        >
          <v-progress-circular v-if="locationLoading" indeterminate :size="20" :width="2" color="primary" />
          <v-icon v-else icon="mdi-crosshairs-gps" size="20" />
        </button>
      </div>
      <div class="zoom-box">
        <button type="button" @click="zoomBy(1)">+</button>
        <input
          class="zoom-slider"
          type="range" step="0.1"
          :min="minZoom"
          :max="maxZoom"
          :value="zoomValue"
          @input="setZoom($event.target.value)"
        />
        <button type="button" @click="zoomBy(-1)">−</button>
      </div>

      <div class="bottom-row">
        <div ref="attributionElement" class="attribution-box"></div>
        <div ref="scaleElement" class="scale-box"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, shallowRef, provide, watch, inject } from "vue";
import { mapMeta, MAP_TYPE } from "@/common/MapMeta.js";
import { drawMapMarker, clearMapMarkers } from '@/common/MapMarker.js';

import { fromLonLat, toLonLat, } from "ol/proj";
import { defaults as defaultControls, Attribution, ScaleLine } from "ol/control";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import "ol/ol.css";

import MapSidePannel from "@/components/map/MapSidePannel.vue";
import MapTypeControl from "@/components/map/hud/MapTypeControl.vue";

const emit = defineEmits([
  "show-right-btn",
]);


// 발산역 기준 좌표 [경도, 위도]
const BALSAN_STATION = [126.8375, 37.5585];
const DEFAULT_ZOOM = 16;
const currentLocation = inject('currentLocation', ref(null));
const locationLoading = ref(false);
const locationError = ref('');
const showLocationError = ref(false);
let locationRequestId = 0;

const mapElement = ref(null);
const attributionElement = ref(null);
const scaleElement = ref(null);
const minZoom = ref(0);
const maxZoom = ref(19);
const zoomValue = ref(DEFAULT_ZOOM);
const currentMapType = ref(MAP_TYPE.BASIC);

let map = null;
let baseTileLayer = null;

const mapInstance = shallowRef(null);
provide('parkingMap', mapInstance);
const mapMarkers = ref([]);
watch(mapInstance, () => drawMarkers());
watch(mapMarkers, () => drawMarkers(), { deep: true });

// ----- 라이프 사이클 ----- //
onMounted(() => {
  initMap();
  mapInstance.value = map;
});

onUnmounted(() => {
  locationRequestId++;
  mapInstance.value = null;
  if (map) {
    clearMapMarkers(map);
    map.setTarget(undefined);
    map = null;
  }
});

// ----- 함수 정의 ----- //

function setMapMarkers(markers = []) {
  mapMarkers.value = markers;
}

function drawMarkers() {
  if (!map) return;
  clearMapMarkers(map);
  for (const marker of mapMarkers.value) {
    if (!Number.isFinite(marker.lat) || !Number.isFinite(marker.lng) ||
        marker.lat < -90 || marker.lat > 90 || marker.lng < -180 || marker.lng > 180) continue;
    drawMapMarker(map, marker);
  }
}

function initMap() {
  const meta = mapMeta.get();

  const center = meta.view?.center ?? BALSAN_STATION;
  const zoom = meta.view?.zoom ?? DEFAULT_ZOOM;

  currentMapType.value = meta.mapType ?? MAP_TYPE.BASIC;

  const tileSource = meta.tileSources[currentMapType.value];

  baseTileLayer = new TileLayer({
    source: createTileSource(tileSource),
  });

  map = new Map({
    target: mapElement.value,

    layers: [
      baseTileLayer,
    ],

    controls: defaultControls({ zoom: false, attribution: false }).extend([
      new Attribution({
        target: attributionElement.value,
        collapsible: false,
      }),
      new ScaleLine({ target: scaleElement.value }),
    ]),

    view: new View({
      center: fromLonLat(center),
      zoom: zoom,
      minZoom: meta.view?.minZoom ?? 0,
      maxZoom: meta.view?.maxZoom ?? 19,
    }),
  });

  const view = map.getView();
  minZoom.value = view.getMinZoom();
  maxZoom.value = view.getMaxZoom();
  zoomValue.value = view.getZoom();
  view.on("change:resolution", () => {
    zoomValue.value = view.getZoom();
  });

  map.on("moveend", saveMapView);
}

function locateCurrentPosition() {
  if (locationLoading.value || !map) return;
  showLocationError.value = false;
  locationError.value = '';
  if (!navigator.geolocation) {
    locationError.value = '이 브라우저는 현재 위치 조회를 지원하지 않습니다.';
    showLocationError.value = true;
    return;
  }

  const requestId = ++locationRequestId;
  locationLoading.value = true;
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (requestId !== locationRequestId || !map) return;
      locationLoading.value = false;
      currentLocation.value = { latitude: coords.latitude, longitude: coords.longitude };
      const view = map.getView();
      view.cancelAnimations();
      view.animate({
        center: fromLonLat([coords.longitude, coords.latitude], view.getProjection()),
        zoom: Math.min(view.getMaxZoom(), Math.max(view.getMinZoom(), DEFAULT_ZOOM)),
        duration: 600,
      });
    },
    (error) => {
      if (requestId !== locationRequestId || !map) return;
      locationLoading.value = false;
      switch (error.code) {
        case 1:
          locationError.value = '위치 접근이 차단되어 있습니다. 브라우저와 기기의 위치 정보 권한을 허용해주세요.';
          break;
        case 3:
          locationError.value = '위치 조회 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
          break;
        default:
          locationError.value = '현재 위치를 알 수 없습니다. 기기의 위치 설정과 연결 상태를 확인해주세요.';
      }
      showLocationError.value = true;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}

function setZoom(value) {
  map?.getView().setZoom(Number(value));
}

function zoomBy(delta) {
  const view = map?.getView();
  if (!view) {
    return;
  }

  view.animate({ zoom: view.getZoom() + delta, duration: 200 });
}

function createTileSource(source) {
  return new XYZ({
    url: source.url,
    minZoom: source.minZoom,
    maxZoom: source.maxZoom,
    attributions: source.attributions,
  });
}

function changeMapType(type) {
  const meta = mapMeta.get();

  const tileSource = meta.tileSources[type];

  if (!tileSource) {
    return;
  }

  baseTileLayer.setSource(
    createTileSource(tileSource)
  );

  currentMapType.value = type;

  mapMeta.setMapType(type);
}

function saveMapView() {
  if (!map) {
    return;
  }

  const view =  map.getView();
  const center = view.getCenter();

  if (!center) {
    return;
  }

  mapMeta.updateView({
    center: toLonLat(center),
    zoom: view.getZoom(),
  });
}
</script>

<style scoped>
.map-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 100%;
}

.map-bottom-right {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.location-control {
  position: relative;
  width: 36px;
  height: 36px;
}

.location-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #ffffff;
  border: 1px solid #dcdfe4;
  border-radius: 6px;
  color: #4b5565;
  cursor: pointer;
}

.location-button:hover,
.location-button:focus-visible {
  background: #f0f7fc;
  color: #127ab7;
}

.location-button:focus-visible {
  outline: 2px solid #127ab7;
  outline-offset: 2px;
}

.location-button:disabled {
  cursor: wait;
}

.location-chip {
  min-width: max-content;
  align-items: center;
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.location-control:hover .location-chip,
.location-control:focus-within .location-chip {
  opacity: 1;
}

.zoom-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
  background-color: #ffffff;
  border: 1px solid #dcdfe4;
  border-radius: 6px;
  overflow: hidden;
}

.zoom-box button {
  width: 36px;
  height: 36px;
  border: 0;
  color: #4b5565;
  font-size: 18px;
  cursor: pointer;
}

.zoom-slider {
  writing-mode: vertical-lr;
  direction: rtl;
  width: 20px;
  height: 120px;
  margin: 4px 0;
  cursor: pointer;
}

.bottom-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.map-bottom-right :deep(.ol-attribution),
.map-bottom-right :deep(.ol-scale-line) {
  position: static;
  background: transparent;
}
.map-bottom-right :deep(.ol-attribution) {
  max-width: none;
}
.map-bottom-right :deep(.ol-attribution ul) {
  background: transparent;
  white-space: nowrap;
  text-shadow: 0 0 2px #fff, 0 0 2px #fff;
}
.map-bottom-right :deep(.ol-scale-line) {
  border-radius: 4px;
}
.attribution-box {
  flex: 0 0 auto;
  white-space: nowrap;
}
.map-bottom-right :deep(.ol-scale-line-inner) {
  margin: 1px;
}

</style>