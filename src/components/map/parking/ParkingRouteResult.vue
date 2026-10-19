<template>
  <v-card variant="outlined" class="mt-4">
    <v-card-title>선택한 주차장 경로</v-card-title>

    <v-card-text>
      <p class="mb-3">{{ parking.name }}</p>

      <div class="origin-actions">
        <v-btn
          variant="outlined"
          :loading="locating"
          :disabled="locating"
          @click="useCurrentLocation"
        >
          추정 현재 위치 사용
        </v-btn>

        <v-btn
          variant="outlined"
          :color="selectingOrigin ? 'primary' : undefined"
          @click="toggleOriginSelection"
        >
          {{ selectingOrigin ? '출발지 선택 취소' : '지도에서 출발지 선택' }}
        </v-btn>
      </div>

      <v-alert
        v-if="selectingOrigin"
        type="info"
        class="mb-3"
      >
        지도에서 차량 출발지를 클릭하세요.
        주황색 경로의 출발지로 사용합니다.
      </v-alert>

      <div v-if="origin" class="mb-3">
        <p>
          차량 출발지:
          {{ origin.source === 'browser' ? '브라우저 추정 위치' : '지도에서 선택한 위치' }}
        </p>

        <p v-if="origin.source === 'browser'">
          위치 정확도: 약 {{ Math.ceil(origin.accuracy).toLocaleString() }}m
        </p>

        <p class="mt-1">
          출발지는 지도에 주황색 원으로 표시됩니다.
          실제 위치와 다르면 지도에서 다시 선택하세요.
        </p>

        <v-btn
          variant="text"
          size="small"
          @click="clearOrigin"
        >
          차량 출발지 지우기
        </v-btn>
      </div>

      <p v-else class="mb-3">
        차량 경로를 보려면 현재 위치를 사용하거나
        지도에서 출발지를 선택하세요.
      </p>

      <v-alert
        v-if="locationError"
        type="warning"
        class="mb-3"
      >
        {{ locationError }}
      </v-alert>

      <v-progress-linear
        v-if="loading"
        indeterminate
        class="mb-3"
      />

      <div class="mb-3">
        <strong>도보: 주차장 → 목적지 · 보라색</strong>

        <p v-if="walking">
          {{ distance(walking.distanceMeters) }} /
          {{ duration(walking.durationSeconds) }}
        </p>

        <p v-if="walkingError">{{ walkingError }}</p>
      </div>

      <div v-if="origin" class="mb-3">
        <strong>차량: 출발지 → 주차장 · 주황색</strong>

        <p v-if="driving">
          {{ distance(driving.distanceMeters) }} /
          {{ duration(driving.durationSeconds) }}
        </p>

        <p v-if="drivingError">{{ drivingError }}</p>
      </div>

      <v-btn
        variant="text"
        :disabled="loading"
        @click="loadRoutes"
      >
        경로 다시 조회
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
// ----- 선언부 ----- //
import { inject, ref, watch, onBeforeUnmount } from 'vue';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {
  Style,
  Stroke,
  Fill,
  Circle as CircleStyle,
} from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';

import {
  getWalkingRoute,
  getDrivingRoute,
} from '@/common/HttpHandler.js';

const props = defineProps({
  parking: { type: Object, required: true },
  destination: { type: Object, required: true },
});

const mapInstance = inject('parkingMap');

if (!mapInstance) {
  throw new Error('기존 지도 객체가 연결되지 않았습니다.');
}

const origin = ref(null);
const walking = ref(null);
const driving = ref(null);
const walkingError = ref('');
const drivingError = ref('');
const locationError = ref('');
const loading = ref(false);
const locating = ref(false);
const selectingOrigin = ref(false);

const routeSource = new VectorSource();
const originSource = new VectorSource();

const routeLayer = new VectorLayer({
  source: routeSource,
  zIndex: 15,
  style: (feature) => new Style({
    stroke: new Stroke({
      color: feature.get('mode') === 'walking'
        ? '#7c3aed'
        : '#ea580c',
      width: 5,
    }),
  }),
});

const originLayer = new VectorLayer({
  source: originSource,
  zIndex: 30,
  style: new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({ color: '#ea580c' }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
    }),
  }),
});

let attachedMap = null;
let originalCursor = '';
let cursorChanged = false;
let requestId = 0;
let locationRequestId = 0;
let disposed = false;

// ----- 라이프 사이클 ----- //
const stopMapWatch = watch(mapInstance, (nextMap) => {
  detachMap();

  if (!nextMap) return;

  attachedMap = nextMap;
  attachedMap.addLayer(routeLayer);
  attachedMap.addLayer(originLayer);

  // 출발지 선택 모드에서 지도 클릭을 처리합니다.
  attachedMap.on('click', handleOriginClick);

  updateCursor();
  redrawOrigin();
  redrawRoutes();
}, { immediate: true });

watch(
  [() => props.parking, () => props.destination, origin],
  loadRoutes,
  { immediate: true },
);

watch(selectingOrigin, updateCursor);

onBeforeUnmount(() => {
  disposed = true;
  requestId += 1;
  locationRequestId += 1;
  stopMapWatch();
  detachMap();
});

// ----- 함수 정의 ----- //
function restoreCursor() {
  if (attachedMap && cursorChanged) {
    attachedMap.getTargetElement().style.cursor = originalCursor;
  }

  cursorChanged = false;
}

function updateCursor() {
  if (!attachedMap) return;

  if (selectingOrigin.value) {
    if (!cursorChanged) {
      originalCursor = attachedMap.getTargetElement().style.cursor;
      cursorChanged = true;
    }

    attachedMap.getTargetElement().style.cursor = 'crosshair';
  } else {
    restoreCursor();
  }
}

function detachMap() {
  if (!attachedMap) return;

  restoreCursor();
  attachedMap.un('click', handleOriginClick);
  attachedMap.removeLayer(routeLayer);
  attachedMap.removeLayer(originLayer);
  attachedMap = null;
}

function toggleOriginSelection() {
  locationRequestId += 1;
  locating.value = false;
  locationError.value = '';
  selectingOrigin.value = !selectingOrigin.value;
}

function handleOriginClick(event) {
  if (!selectingOrigin.value) return;

  const [rawLongitude, latitude] = toLonLat(event.coordinate);

  // 세계 지도 반복 표시에서도 표준 경도 범위로 변환합니다.
  const longitude = ((rawLongitude + 180) % 360 + 360) % 360 - 180;

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90
  ) {
    locationError.value = '선택한 위치의 좌표를 확인하세요.';
    return false;
  }

  locationRequestId += 1;
  locating.value = false;
  selectingOrigin.value = false;
  locationError.value = '';

  origin.value = {
    longitude,
    latitude,
    source: 'map',
    accuracy: null,
  };

  redrawOrigin();

  // 이 클릭이 주차장 선택 동작으로 이어지지 않도록 처리합니다.
  event.preventDefault();
  event.stopPropagation();

  return false;
}

function clearOrigin() {
  locationRequestId += 1;
  locating.value = false;
  selectingOrigin.value = false;
  locationError.value = '';
  origin.value = null;
  redrawOrigin();
}

function redrawOrigin() {
  originSource.clear();

  if (!origin.value) return;

  originSource.addFeature(new Feature({
    kind: 'drivingOrigin',
    geometry: new Point(fromLonLat([
      origin.value.longitude,
      origin.value.latitude,
    ])),
  }));
}

function distance(meters) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(2)}km`
    : `${Math.round(meters)}m`;
}

function duration(seconds) {
  return `${Math.max(1, Math.ceil(seconds / 60))}분`;
}

function validateRoute(response) {
  const result = response?.data;

  if (
    !result ||
    !Number.isFinite(result.distanceMeters) ||
    !Number.isFinite(result.durationSeconds) ||
    result.distanceMeters < 0 ||
    result.durationSeconds < 0 ||
    !Array.isArray(result.coordinates) ||
    result.coordinates.length < 2 ||
    !result.coordinates.every((coordinate) =>
      Array.isArray(coordinate) &&
      coordinate.length >= 2 &&
      Number.isFinite(coordinate[0]) &&
      Number.isFinite(coordinate[1]) &&
      Math.abs(coordinate[0]) <= 180 &&
      Math.abs(coordinate[1]) <= 90,
    )
  ) {
    throw new Error('경로 API 응답 형식을 확인하세요.');
  }

  return result;
}

async function loadRoutes() {
  const currentRequest = ++requestId;

  walking.value = null;
  driving.value = null;
  walkingError.value = '';
  drivingError.value = '';
  routeSource.clear();
  loading.value = true;

  const parking = { ...props.parking };
  const destination = { ...props.destination };
  const start = origin.value ? { ...origin.value } : null;

  async function load(request, target, errorTarget) {
    try {
      const result = validateRoute(await request());

      if (currentRequest === requestId && !disposed) {
        target.value = result;
      }
    } catch (error) {
      if (currentRequest === requestId && !disposed) {
        errorTarget.value = error.message || '경로 조회에 실패했습니다.';
      }
    }
  }

  const requests = [
    load(
      () => getWalkingRoute({
        startLat: parking.latitude,
        startLng: parking.longitude,
        endLat: destination.latitude,
        endLng: destination.longitude,
      }),
      walking,
      walkingError,
    ),
  ];

  if (start) {
    requests.push(load(
      () => getDrivingRoute({
        startLat: start.latitude,
        startLng: start.longitude,
        endLat: parking.latitude,
        endLng: parking.longitude,
      }),
      driving,
      drivingError,
    ));
  }

  await Promise.all(requests);

  if (currentRequest === requestId && !disposed) {
    loading.value = false;
    redrawRoutes();
  }
}

function redrawRoutes() {
  routeSource.clear();

  for (const [mode, result] of [
    ['walking', walking.value],
    ['driving', driving.value],
  ]) {
    if (!result) continue;

    const geometry = new LineString(result.coordinates).transform(
      'EPSG:4326',
      'EPSG:3857',
    );

    routeSource.addFeature(new Feature({ mode, geometry }));
  }
}

function useCurrentLocation() {
  locationError.value = '';
  selectingOrigin.value = false;

  if (!navigator.geolocation) {
    locationError.value =
      '이 브라우저는 현재 위치를 지원하지 않습니다. 지도에서 선택하세요.';
    return;
  }

  const currentLocationRequest = ++locationRequestId;
  locating.value = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (disposed || currentLocationRequest !== locationRequestId) return;

      locating.value = false;

      const { latitude, longitude, accuracy } = position.coords;

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(accuracy) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180 ||
        accuracy < 0
      ) {
        locationError.value =
          '위치 응답이 올바르지 않습니다. 지도에서 출발지를 선택하세요.';
        return;
      }

      origin.value = {
        latitude,
        longitude,
        accuracy,
        source: 'browser',
      };

      redrawOrigin();

      attachedMap?.getView().animate({
        center: fromLonLat([longitude, latitude]),
        duration: 300,
      });
    },
    () => {
      if (disposed || currentLocationRequest !== locationRequestId) return;

      locating.value = false;
      locationError.value =
        '현재 위치를 가져오지 못했습니다. 지도에서 출발지를 선택할 수 있습니다.';
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
}
</script>

<style scoped>
.origin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
</style>