<template>
  <v-row no-gutters class="searchbox-list">
    <v-combobox
      v-model="keyword"
      v-model:search="searchText"
      prepend-inner-icon="mdi-magnify"
      class="inputbox"
      variant="outlined" density="compact" rounded="m"
      bg-color="#ffffff" base-color="#8AB63F" color="#8AB63F"
      hide-details clearable
      placeholder="장소 검색"
      @keydown.enter.prevent="handleEvent('search')"
    />
  </v-row>

  <v-row class="mb-3" no-gutters>
    <v-col cols="12" class="list-header">{{ searched ? '검색 결과' : '주변' }}</v-col>
  </v-row>

  <v-row no-gutters class="container-list">  
    <v-col v-for="place in places" :key="place.id" cols="12">
      <PlaceCard
        :place="place"
        @select="handleEvent('select', $event)"
        @click="handleEvent('detail', $event)"
      />
    </v-col>
    <v-col v-if="(searched || fetchFailed) && !places.length" class="pa-3" cols="12">
      현재 지도 영역에 검색 결과가 없습니다.
    </v-col>
  </v-row>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, computed, watch, inject } from "vue";
import { toLonLat, transformExtent } from "ol/proj";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"

import * as HttpHandler from '@/common/HttpHandler.js';
import { searchHistory } from '@/common/MapHistory.js';
import { createPlaceViewportCache } from '@/common/PlaceViewportCache.js';
import Util from '@/common/Util.js';
import PlaceCard from '@/components/map/place/PlaceCard.vue';

const emit = defineEmits(['update-map-markers', 'show-detail', 'close-detail']);

const router = useRouter();
const util = Util.getInstance();

const keyword = ref(null);
const searchText = ref('');
const historyItems = ref([]);
const places = ref([]);
const destination = ref(null);
const searched = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const fetchFailed = ref(false);
const totalCnt = ref(0);
const mapInstance = inject('parkingMap', ref(null));

let attachedMap = null;
let requestId = 0;
let appliedKeyword = '';
let placeController = null;

watch(mapInstance, (nextMap) => {
  if (placeController) {
    placeController.destroy();
    placeController = null;
  }
  
  attachedMap?.un('moveend', refreshPlaces);
  attachedMap?.un('change:size', refreshPlaces);
  attachedMap = nextMap;
  
  if (!attachedMap) return;
  
  // Initialize viewport cache controller
  placeController = createPlaceViewportCache({
    fetchPage: async (params) => {
      const response = await HttpHandler.listPlaces(params);
      const items = HttpHandler.normalizePlaceListResponse(response);
      return items;
    },
    onChange: (visiblePlaces, meta) => {
      places.value = visiblePlaces.map(HttpHandler.transformPlaceResponse);
      totalCnt.value = visiblePlaces.length;
      fetchFailed.value = !!meta.error;
    },
    cacheScale: 1.5,
    offscreenTtlMs: 15_000,
    cacheTtlMs: 60_000,
    maxVisible: 20,
    maxOffscreen: 5,
    pageSize: 10,
    maxPages: 5,
    debounceMs: 300,
  });
  
  attachedMap.on('moveend', refreshPlaces);
  attachedMap.on('change:size', refreshPlaces);
  refreshPlaces();
}, { immediate: true });

// 현재 목록에 표시된 장소를 MapView의 공통 마커 레이어에 반영합니다.
watch(places, (items) => {
  const markers = [];
  for (const place of items) {
    const coord = util.getPlaceCoordinate(place);
    if (!coord) continue;

    markers.push({
      id: `location-${place.id}`,
      lat: coord.lat,
      lng: coord.lng,
      type: 'cus-location-mark',
      data: place,
    });
  }
  emit('update-map-markers', markers);
}, { deep: true, immediate: true });

// ----- 라이프 사이클 ----- //
onMounted(async () => {
  updateHistory();
});

onUnmounted(() => {
  requestId += 1;
  if (placeController) {
    placeController.destroy();
    placeController = null;
  }
  attachedMap?.un('moveend', refreshPlaces);
  attachedMap?.un('change:size', refreshPlaces);
  emit('update-map-markers', []);
})

// ----- 함수 정의 ----- //
function updateHistory() {
  historyItems.value = searchHistory.getAll().map((item) => item.keyword);
}

// 버튼 클릭 이벤트 핸들러
async function handleEvent(action, payload) {
  console.log('handleEvent triggered with action:', action, 'and payload:', payload);
  switch (action) {
    case 'search':
      if (loading.value) return;
      const value = String(searchText.value || keyword.value || '').trim();
      destination.value = null;
      errorMessage.value = '';
      searched.value = true;
      keyword.value = value;
      appliedKeyword = value;
      if (value) {
        searchHistory.add({ key: value, keyword: value });
        updateHistory();
      }
      if (placeController) {
        placeController.invalidate();
        await placeController.refresh();
      }
      // 검색 결과가 한 곳이면 목적지로 바로 연결합니다.
      if (value && places.value.length === 1) selectDestination(places.value[0]);
      break;

    case 'select':
      selectDestination(payload);
      break;

    case 'detail':
      if (payload?.id != null) {
        emit('show-detail', {
          id: payload.id,
          kind: 'place',
        });
      }
      break;

    case 'clear':
      searchText.value = '';
      keyword.value = '';
      appliedKeyword = '';
      searched.value = false;
      if (placeController) {
        placeController.invalidate();
        await placeController.refresh();
      }
      break;
      
    default:
      console.error('알 수 없는 인증 액션 타입:', action);
  }
}

function refreshPlaces() {
  if (!placeController || !attachedMap) return;
  
  const size = attachedMap.getSize();
  if (!size || size[0] <= 0 || size[1] <= 0) return;

  const view = attachedMap.getView();
  const center = view.getCenter();
  if (!center) return;
  
  const projection = view.getProjection();
  const [centerLon, centerLat] = toLonLat(center, projection);
  const [west, south, east, north] = transformExtent(view.calculateExtent(size), projection, 'EPSG:4326');
  
  const minLon = Math.max(-180, west);
  const minLat = Math.max(-90, south);
  const maxLon = Math.min(180, east);
  const maxLat = Math.min(90, north);
  
  if (![minLon, minLat, maxLon, maxLat].every(Number.isFinite) || minLon >= maxLon || minLat >= maxLat) return;

  const zoomLevel = Math.max(0, Math.round(view.getZoom() ?? 0));
  placeController.update(
    { minLat, minLon, maxLat, maxLon },
    { search: appliedKeyword, level: zoomLevel }
  );
}

function selectDestination(place) {
  const coord = util.getPlaceCoordinate(place);
  if (!coord) {
    errorMessage.value = '선택한 장소에 좌표가 없습니다.';
    return;
  }
  
  const { lat, lng } = coord;
  errorMessage.value = '';
  destination.value = { id: place.id, name: util.getPlaceName(place), lat, lng };
  
  try {
    localStorage.setItem('route-search', JSON.stringify({ lat, lng, name: destination.value.name }));
  } catch (error) {
    console.error('도착지 저장 실패:', error);
    errorMessage.value = '도착지를 저장하지 못했습니다. 브라우저 저장소 설정을 확인하세요.';
    return;
  }
  router.push('/map/directions');
}
</script>

<style scoped>
.inputbox {
  width: 100%;
  flex: 1 1 100%;
  margin: 0;
}

.inputbox :deep(.v-field__input) {
  color: #364153 !important;
  font-size: 16px !important;
}
.inputbox :deep(.v-field__input::placeholder) {
  color: #364153 !important;
  font-size: 16px !important;
}
.inputbox :deep(.v-field__overlay) {
  border: 2.5px solid #8AB63F !important;
  border-radius: 4px !important;
}
.inputbox :deep(.v-icon) {
  color: #8AB63F !important;
  opacity: 1;
}
.container-list {
  display: block;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  margin: 0;
  overflow-y: auto;
}

.list-header {
  width: 100%;
  font-size: 18px;
  font-weight: 600;
  margin: 12px 12px 0px 12px;
}

.searchbox-list {
  margin: 24px 12px 8px 12px;
}
</style>