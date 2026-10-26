<template>
  <section class="parking-panel">
    <h2 class="mb-4">목적지 주변 주차장</h2>

    <p class="mb-4">
      선택한 목적지 주변 주차장입니다.
      주차장을 선택하면 목적지까지의 경로를 조회합니다.
    </p>

    <v-select
      v-model="radiusMeters"
      label="조회 반경"
      :items="radiusOptions"
      item-title="title"
      item-value="value"
    />

    <p v-if="destination" class="mb-3">
      목적지: {{ destination.latitude.toFixed(6) }},
      {{ destination.longitude.toFixed(6) }}
    </p>

    <v-alert v-if="errorMessage" type="error" class="mb-3">
      {{ errorMessage }}
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate class="mb-3" />

    <template v-if="destination && !loading && !errorMessage">
      <p class="mb-3">
        전체 {{ sourceTotal }}건 중 주변 {{ items.length }}건 · 직선거리순
      </p>

      <v-alert v-if="items.length === 0" type="info" class="mb-3">
        반경 안에 주차장이 없습니다.
      </v-alert>
    </template>

    <ParkingList
      :items="items"
      :selected-id="selectedId"
      @select="selectParking"
    />
    <ParkingRouteResult
      v-if="selectedParking"
      :parking="selectedParking"
      :destination="destination"
    />
  </section>
</template>

<script setup>
import { computed, inject, ref, watch, onBeforeUnmount } from 'vue';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import { fromLonLat } from 'ol/proj';

import ParkingList from '@/components/map/parking/ParkingList.vue';
import ParkingRouteResult from '@/components/map/parking/ParkingRouteResult.vue';
import HttpHandler from '@/common/HttpHandler.js';
import { createMapDraw } from '@/common/MapDraw.js';

// ----- 선언부 ----- //
const mapInstance = inject('parkingMap');

if (!mapInstance) {
  throw new Error('기존 지도 객체가 연결되지 않았습니다.');
}

const props = defineProps({
  selectedDestination: { type: Object, required: true },
});

const destination = computed(() => props.selectedDestination);

const selectedParking = computed(() =>
  items.value.find((item) => item.id === selectedId.value) ?? null,
);
const radiusMeters = ref(1000);
const items = ref([]);
const sourceTotal = ref(0);
const selectedId = ref('');
const loading = ref(false);
const errorMessage = ref('');

const presetRadiusOptions = [
  { title: '300m', value: 300 },
  { title: '500m', value: 500 },
  { title: '1km', value: 1000 },
  { title: '2km', value: 2000 },
];

const markerSource = new VectorSource();
const markerLayer = new VectorLayer({
  source: markerSource,
  zIndex: 20,
  style: markerStyle,
});

const radiusOptions = computed(() => presetRadiusOptions.some((item) => item.value === radiusMeters.value)
  ? presetRadiusOptions
  : [...presetRadiusOptions, { title: radiusMeters.value.toLocaleString() + 'm', value: radiusMeters.value }]);

let radiusDraw = null;
let attachedMap = null;
let requestId = 0;

// ----- 라이프 사이클 및 상태 연결 ----- //
const stopMapWatch = watch(mapInstance, (nextMap) => {
  detachMap();

  if (!nextMap) return;

  attachedMap = nextMap;
  radiusDraw = createMapDraw(attachedMap, {
    onRadiusChange(radius) {
      radiusMeters.value = radius;
    },
  });
  updateRadiusCircle();
  attachedMap.addLayer(markerLayer);
  attachedMap.on('singleclick', handleMapClick);
  redrawMarkers();
}, { immediate: true });

watch(
  [destination, radiusMeters],
  () => {
    updateRadiusCircle();
    searchParking();
  },
  { immediate: true, deep: true },
);

onBeforeUnmount(() => {
  requestId += 1;
  stopMapWatch();
  detachMap();
});

// ----- 함수 정의 ----- //
function markerStyle(feature) {
  const isDestination = feature.get('kind') === 'destination';
  const isSelected = feature.get('parkingId') === selectedId.value;
  const color = isDestination
    ? '#dc2626'
    : isSelected ? '#16a34a' : '#2563eb';

  return new Style({
    image: new CircleStyle({
      radius: isDestination ? 9 : 7,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
  });
}

function updateRadiusCircle() {
  radiusDraw?.setCircle(destination.value, radiusMeters.value);
}

function detachMap() {
  radiusDraw?.destroy();
  radiusDraw = null;
  if (!attachedMap) return;
  attachedMap.un('singleclick', handleMapClick);
  attachedMap.removeLayer(markerLayer);
  attachedMap = null;
}

function handleMapClick(event) {
  const feature = attachedMap.forEachFeatureAtPixel(
    event.pixel,
    (item) => item.get('kind') === 'parking' ? item : undefined,
    {
      layerFilter: (layer) => layer === markerLayer,
      hitTolerance: 6,
    },
  );

  if (feature) {
    const parking = items.value.find(
      (item) => item.id === feature.get('parkingId'),
    );

    if (parking) selectParking(parking);
    return;
  }

  // 목적지는 지도 홈 검색 결과에서 선택합니다.
}

async function searchParking() {
  const currentRequest = ++requestId;
  selectedId.value = '';
  items.value = [];
  sourceTotal.value = 0;
  errorMessage.value = '';
  redrawMarkers();

  if (!destination.value) {
    loading.value = false;
    return;
  }

  loading.value = true;

  try {
    const response = await nearbyParking({
      latitude: destination.value.latitude,
      longitude: destination.value.longitude,
      radius: radiusMeters.value,
    });

    if (currentRequest !== requestId) return;

    items.value = response.data.map((item) => ({
      ...item,
      address: item.name,
      road_name_address: item.roadNameAddress,
      description: Number.isFinite(item.distanceMeters) ? Math.round(item.distanceMeters) + 'm' : '',
    }));
    sourceTotal.value = items.value.length;

    attachedMap?.getView().animate({
      center: fromLonLat([
        destination.value.longitude,
        destination.value.latitude,
      ]),
      zoom: 15,
      duration: 300,
    });
  } catch (error) {
    if (currentRequest !== requestId) return;
    errorMessage.value = error.message || '주차장 조회에 실패했습니다.';
  } finally {
    if (currentRequest === requestId) {
      loading.value = false;
      redrawMarkers();
    }
  }
}

function redrawMarkers() {
  markerSource.clear();

  if (destination.value) {
    markerSource.addFeature(new Feature({
      kind: 'destination',
      geometry: new Point(fromLonLat([
        destination.value.longitude,
        destination.value.latitude,
      ])),
    }));
  }

  for (const parking of items.value) {
    markerSource.addFeature(new Feature({
      kind: 'parking',
      parkingId: parking.id,
      geometry: new Point(fromLonLat([
        parking.longitude,
        parking.latitude,
      ])),
    }));
  }
}

function selectParking(parking) {
  selectedId.value = parking.id;
  markerLayer.changed();

  attachedMap?.getView().animate({
    center: fromLonLat([parking.longitude, parking.latitude]),
    duration: 300,
  });
}
</script>

<style scoped>
.parking-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}
</style>