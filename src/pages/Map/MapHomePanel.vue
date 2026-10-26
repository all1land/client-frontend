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
      {{ searched ? '검색 결과' : '주변' }}
    </v-row>
    
    <v-col v-for="place in places" :key="place.id" cols="12">
      <PlaceCard
        :place="place"
        @select="handleEvent('select', $event)"
      />
    </v-col>
    <v-col v-if="searched && !places.length" class="pa-3" cols="12">
      등록된 데모 장소에서 일치하는 결과가 없습니다.
    </v-col>
  </v-row>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, computed, watch} from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"

import * as HttpHandler from '@/common/HttpHandler.js';
import { searchHistory } from '@/common/MapHistory.js';
import PlaceCard from '@/components/map/place/PlaceCard.vue';

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
let placeList = [];

// ----- 라이프 사이클 ----- //
onMounted(async () => {
  updateHistory();
  fetchListPlaces();
});

onUnmounted(() => {

})

// ----- 함수 정의 ----- //
function updateHistory() {
  historyItems.value = searchHistory.getAll().map((item) => item.keyword);
}

// 버튼 클릭 이벤트 핸들러
function handleEvent(action, payload) {
  console.log('handleEvent triggered with action:', action, 'and payload:', payload);
  switch (action) {
    case 'search':
      if (loading.value) return;
      const value = String(searchText.value || keyword.value || '').trim();
      destination.value = null;
      errorMessage.value = '';
      searched.value = true;
      if (!value) {
        places.value = placeList;
        return;
      }
      keyword.value = value;
      searchHistory.add({ key: value, keyword: value });
      updateHistory();
      const normalized = value.toLocaleLowerCase();
      places.value = placeList.filter((place) =>
        [place.title, place.road_name_address].some((text) =>
          String(text ?? '').toLocaleLowerCase().includes(normalized),
        ),
      );
      // 검색 결과가 한 곳이면 목적지로 바로 연결합니다.
      if (places.value.length === 1) selectDestination(places.value[0]);
      break;
    case 'select':
      selectDestination(payload);
      break;
    case 'clear':
      searchText.value = '';
      keyword.value = '';
      places.value = placeList;
      break;
    default:
      console.error('알 수 없는 인증 액션 타입:', action);
  }
}

async function fetchListPlaces() {
  try {
    const response = await HttpHandler.listPlaces({ page: 1, limit: 10 });
    const list = response?.data?.items || [];
    placeList = list;
    places.value = placeList;
  } catch (error) {
    console.error('장소 목록 조회 실패:', error);
    places.value = [];
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