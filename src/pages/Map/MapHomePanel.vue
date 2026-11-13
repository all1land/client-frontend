<template>
  <v-row no-gutters class="searchbox-list">
    <v-combobox
      v-model="keyword"
      v-model:search="searchText"
      prepend-inner-icon="mdi-magnify"
      class="inputbox | mr-2"
      variant="outlined"
      density="compact"
      rounded="m"
      bg-color="#ffffff"
      base-color="#8AB63F"
      color="#8AB63F"
      hide-details
      clearable
      placeholder="장소 검색"
      @keydown.enter.prevent="handleEvent('search')"
    />
  </v-row>

  <v-alert v-if="errorMessage" type="error" class="ma-3">
    {{ errorMessage }}
  </v-alert>

  
  <v-row no-gutters class="container-list">
    <v-row no-gutters class="list-header">
      {{ searched ? '검색 결과' : '주변' }} · {{ totalCnt }}건
    </v-row>
    
    <v-col v-for="place in places" :key="place.id" cols="12">
      <PlaceCard
        :place="place"
        @select="handleEvent('select', $event)"
        @click="handleEvent('detail', $event)"
      />
    </v-col>
    <v-col v-if="searched && !places.length" class="pa-3" cols="12">
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
import PlaceCard from '@/components/map/place/PlaceCard.vue';

const emit = defineEmits(['update-map-markers', 'show-detail', 'close-detail']);

const router = useRouter();

const keyword = ref(null);
const search = ref({});
const filter = ref({});
const searchText = ref('');
const historyItems = ref([]);
const places = ref([]);
const destination = ref(null);
const searched = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const totalCnt = ref(0);
const mapInstance = inject('parkingMap', ref(null));
let attachedMap = null;
let requestId = 0;
let appliedKeyword = '';

watch(mapInstance, (nextMap) => {
  attachedMap?.un('moveend', refreshPlaces);
  attachedMap?.un('change:size', refreshPlaces);
  attachedMap = nextMap;
  if (!attachedMap) return;
  attachedMap.on('moveend', refreshPlaces);
  attachedMap.on('change:size', refreshPlaces);
  refreshPlaces();
}, { immediate: true });

// 현재 목록에 표시된 장소를 MapView의 공통 마커 레이어에 반영합니다.
watch(places, (items) => {
  const markers = [];
  for (const place of items) {
    const rawLat = place.lat ?? place.latitude ?? place.lot;
    const rawLng = place.lng ?? place.longitude;
    if (rawLat == null || rawLng == null ||
        String(rawLat).trim() === '' || String(rawLng).trim() === '') continue;

    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

    markers.push({
      id: `location-${place.id}`,
      lat,
      lng,
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
      await fetchListPlaces();
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
      await fetchListPlaces();
      break;
      
    default:
      console.error('알 수 없는 인증 액션 타입:', action);
  }
}

function refreshPlaces() {
  fetchListPlaces();
}

async function fetchListPlaces() {
  const currentRequestId = ++requestId;
  const map = mapInstance.value;
  const size = map?.getSize();
  if (!map || !size || size[0] <= 0 || size[1] <= 0) return;

  const view = map.getView();
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

  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await HttpHandler.listPlaces({
      centerLat, centerLon,
      pageIndex: 1,
      pageSize: 10,
      keyword: appliedKeyword,
      zoom: Math.max(0, Math.round(view.getZoom() ?? 0)),
      minLat, minLon, maxLat, maxLon,
    });
    if (currentRequestId !== requestId) return;
    places.value = (response?.data?.list ?? []).map((place) => ({
      ...place,
      id: place.poiId,
      title: place.name,
      road_name_address: place.roadNameAddress,
    }));
    totalCnt.value = response?.data?.pagination?.totalCnt ?? 0;
  } catch (error) {
    if (currentRequestId !== requestId) return;
    console.error('장소 목록 조회 실패:', error);
    places.value = [];
    totalCnt.value = 0;
    errorMessage.value = error.message || '장소 목록을 불러오지 못했습니다.';
  } finally {
    if (currentRequestId === requestId) loading.value = false;
  }
}

function selectDestination(place) {
  const rawlat = place.lat ?? place.latitude ?? place.lot;
  const rawlng = place.lng ?? place.longitude;
  if (
    rawlat == null || rawlng == null ||
    String(rawlat).trim() === '' || String(rawlng).trim() === ''
  ) {
    errorMessage.value = '선택한 장소에 좌표가 없습니다.';
    return;
  }
  const lat = Number(rawlat);
  const lng = Number(rawlng);
  if (
    !Number.isFinite(lat) || !Number.isFinite(lng) ||
    lat < -90 || lat > 90 || lng < -180 || lng > 180
  ) {
    errorMessage.value = '선택한 장소의 좌표를 확인하세요.';
    return;
  }
  errorMessage.value = '';
  destination.value = { id: place.id, name: place.title ?? place.name ?? '', lat, lng };
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
  margin: 0;
  padding: 12px 12px 0;
}
.searchbox-list {
  margin: 12px;
}
</style>