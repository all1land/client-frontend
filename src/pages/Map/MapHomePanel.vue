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
      @keydown.enter.prevent="searchPlaces()"
      @click:clear="searchPlaces('')"
    />
  </v-row>

  <v-row class="mb-3" no-gutters>
    <v-col cols="12" class="list-header">{{ searched ? '검색 결과' : '주변' }}</v-col>
  </v-row>

  <v-row ref="resultList" no-gutters class="container-list">
    <v-col v-for="place in places" :key="place.id" cols="12">
      <PlaceCard
        :place="place"
        @select="selectDestination"
        @click="showDetail"
      />
    </v-col>
    <v-col v-if="errorMessage" class="pa-3" cols="12" role="alert">
      {{ errorMessage }}
    </v-col>
    <v-col v-else-if="!loading && !places.length" class="pa-3" cols="12">
      현재 지도 영역에 검색 결과가 없습니다.
    </v-col>
  </v-row>

  <div v-if="pageCount > 1" class="place-pagination">
    <v-pagination
      :model-value="pageIndex"
      :length="pageCount"
      :total-visible="7"
      :disabled="loading"
      size="small"
      density="compact"
      aria-label="장소 검색 결과 페이지"
      @update:model-value="loadPlaces"
    />
  </div>

</template>

<script setup>
import { onUnmounted, ref, watch, inject } from 'vue';
import { toLonLat, transformExtent } from 'ol/proj';
import { useRouter } from 'vue-router';
import * as HttpHandler from '@/common/HttpHandler.js';
import { searchHistory } from '@/common/MapHistory.js';
import Util from '@/common/Util.js';
import PlaceCard from '@/components/map/place/PlaceCard.vue';

const emit = defineEmits(['update-map-markers', 'show-detail', 'close-detail']);
const router = useRouter();
const util = Util.getInstance();
const mapInstance = inject('parkingMap', ref(null));
const pageSize = 10;

const keyword = ref(null);
const searchText = ref('');
const places = ref([]);
const resultList = ref(null);
const searched = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const pageIndex = ref(1);
const pageCount = ref(0);

let attachedMap = null;
let appliedKeyword = '';
let viewport = null;
let refreshTimer;
let requestId = 0;

watch(mapInstance, (nextMap) => {
  detachMap();
  attachedMap = nextMap;
  if (!attachedMap) return;
  attachedMap.on('moveend', refreshViewport);
  attachedMap.on('change:size', refreshViewport);
  refreshViewport();
}, { immediate: true });

onUnmounted(() => {
  detachMap();
  emit('update-map-markers', []);
});

function detachMap() {
  requestId++;
  clearTimeout(refreshTimer);
  attachedMap?.un('moveend', refreshViewport);
  attachedMap?.un('change:size', refreshViewport);
  attachedMap = null;
  viewport = null;
}

function refreshViewport() {
  const size = attachedMap.getSize();
  if (!size || size[0] <= 0 || size[1] <= 0) return;

  const view = attachedMap.getView();
  const center = view.getCenter();
  if (!center) return;

  const projection = view.getProjection();
  const [west, south, east, north] = transformExtent(view.calculateExtent(size), projection, 'EPSG:4326');
  const bounds = {
    minLon: Math.max(-180, west),
    minLat: Math.max(-90, south),
    maxLon: Math.min(180, east),
    maxLat: Math.min(90, north),
  };
  if (!Object.values(bounds).every(Number.isFinite) ||
      bounds.minLon >= bounds.maxLon || bounds.minLat >= bounds.maxLat) return;
  if (viewport && Object.keys(bounds).every((key) => viewport[key] === bounds[key])) return;

  const [centerLon, centerLat] = toLonLat(center, projection);
  const zoom = Math.max(0, Math.round(view.getZoom() ?? 0));
  viewport = { ...bounds, centerLat, centerLon, zoom };
  requestId++;
  loading.value = true;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => { void loadPlaces(1); }, 300);
}

function searchPlaces(value = String(searchText.value ?? '').trim()) {
  appliedKeyword = value;
  keyword.value = value;
  searchText.value = value;
  searched.value = Boolean(value);
  if (value) searchHistory.add({ key: value, keyword: value });

  places.value = [];
  pageIndex.value = 1;
  pageCount.value = 0;
  emit('close-detail');
  emit('update-map-markers', []);
  void loadPlaces(1);
}

async function loadPlaces(nextPage) {
  if (!viewport) return;
  clearTimeout(refreshTimer);
  const currentRequest = ++requestId;
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await HttpHandler.listPlaces({
      ...viewport, keyword: appliedKeyword, pageIndex: nextPage, pageSize,
    });
    if (currentRequest !== requestId) return;

    const { items, markers, pagination } = HttpHandler.normalizePlaceSearchResponse(response);
    if (pagination.pageNum > 0 && nextPage > pagination.pageNum) {
      return await loadPlaces(pagination.pageNum);
    }
    places.value = items.map(HttpHandler.transformPlaceResponse);
    pageIndex.value = pagination.pageNum > 0 ? pagination.pageIndex : 1;
    pageCount.value = pagination.pageNum;
    if (resultList.value?.$el) resultList.value.$el.scrollTop = 0;
    emit('update-map-markers', markers.flatMap((item) => {
      const id = String(item?.poiId ?? item?.id ?? '');
      const coord = util.getPlaceCoordinate(item);
      return id && coord ? [{
        id: `location-${id}`,
        ...coord,
        type: 'cus-location-mark',
        data: { id, ...coord, categoryCode: item.categoryCode },
      }] : [];
    }));
  } catch (error) {
    if (currentRequest !== requestId) return;
    errorMessage.value = '장소 검색 결과를 불러오지 못했습니다.';
    console.error('장소 검색 실패:', error);
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function showDetail(place) {
  if (place?.id != null) emit('show-detail', { id: place.id, kind: 'place' });
}

function selectDestination(place) {
  const coord = util.getPlaceCoordinate(place);
  if (!coord) {
    errorMessage.value = '선택한 장소에 좌표가 없습니다.';
    return;
  }

  errorMessage.value = '';
  try {
    localStorage.setItem('route-search', JSON.stringify({ ...coord, name: util.getPlaceName(place) }));
  } catch (error) {
    console.error('목적지 저장 실패:', error);
    errorMessage.value = '목적지를 저장하지 못했습니다. 브라우저 설정을 확인해 주세요.';
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

.place-pagination {
  width: 100%;
  padding: 8px 0;
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