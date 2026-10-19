<template>
  <v-row no-gutters class="searchbox-list">
    <v-col cols="12">
      <v-text-field
          v-model="search.departure.name"
          class="inputbox | search-upper"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          placeholder="출발지 입력"
          @keydown.enter.prevent="handleEvent('search')"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
          v-model="search.parking.name"
          class="inputbox | search-lower"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          placeholder="주차장 선택"
          @keydown.enter.prevent="handleEvent('search')"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
          v-model="search.arrival.name"
          class="inputbox | search-lower"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          placeholder="도착지"
          @keydown.enter.prevent="handleEvent('search')"
      />
    </v-col>
  </v-row>

  <v-row class="pl-3 | pr-3 | mb-3 | justify-space-between | align-center" no-gutters>
    <v-btn width="88" prepend-icon="mdi-swap-vertical" variant="outlined" color="primary" @click="handleEvent('clear')">다시입력</v-btn>
    <v-btn width="88" append-icon="mdi-chevron-right" variant="outlined" color="primary" @click="handleEvent('search')">길찾기</v-btn>
  </v-row>

  <v-divider class="my-2" />

  <v-row class="mb-3" no-gutters>
    <v-col cols="12" class="list-header">주차장</v-col>
  </v-row>
  
  <v-row no-gutters class="container-list">
    <v-col
      v-for="parking in parkingList"
      :key="parking.id"
      cols="12"
    >
      <ParkingCard 
        :parking="parking"
        @select="handleEvent('select', $event)"
      />
    </v-col>

    <v-col v-if="!parkingList.length" class="pa-3" cols="12">
      조건에 맞는 주차장이 없습니다.
    </v-col>
  </v-row>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, computed, watch} from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"

import * as HttpHandler from '@/common/HttpHandler.js';
import { routeHistory } from '@/common/MapHistory.js';
import ParkingCard from '@/components/map/parking/ParkingCard.vue';

const mockDeparture = '올포랜드 마곡본부';


const parkingList = ref([]);

const selectedParking = ref(null);
const radiusMeters = ref(1000);


const search = ref(createSearch());
let parkingRequestId = 0;

// ----- 라이프 사이클 ----- //
onMounted(() => {

});

onUnmounted(() => {

})



watch(() => search.value.arrival, () => {
  resetSearch();
  fetchListParking();
}, { deep: true, immediate: true });


// ----- 함수 정의 ----- //

function getStoredArrival() {
  const empty = { lat: null, lng: null, name: '' };
  try {
    const stored = JSON.parse(localStorage.getItem('route-search'));
    if (!stored || typeof stored !== 'object') return empty;
    const { lat, lng, name } = stored;
    if (
      !Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lng) || lng < -180 || lng > 180 ||
      typeof name !== 'string'
    ) return empty;
    return { lat, lng, name };
  } catch (error) {
    console.error('도착지 불러오기 실패:', error);
    return empty;
  }
}

function createSearch() {
  return {
    departure: { lat: null, lng: null, name: mockDeparture },
    arrival: getStoredArrival(),
    parking: { lat: null, lng: null, name: '' },
  };
}


// 버튼 클릭 및 카드 선택 이벤트 핸들러
function handleEvent(action, payload) {
  switch (action) {
    case 'search':
      findDirections();
      break;

    case 'select':
      if (payload) selectPlace(payload);
      break;

    case 'clear':
      clearInputForm();
      break;

    default:
      console.error('알 수 없는 경로 액션 타입:', action);
  }
}

function resetSearch() {
  search.value.parking = { lat: null, lng: null, name: '' };
  selectedParking.value = null;
}

function selectPlace(parking) {
  selectedParking.value = parking;
  search.value.parking = {
    lat: parking.lat ?? parking.latitude ?? null,
    lng: parking.lng ?? parking.longitude ?? null,
    name: parking.name ?? parking.title ?? parking.address ?? '',
  };
}

function findDirections() {
  saveRouteHistory();
  if (search.value.arrival.name.trim()) fetchListParking();
}

function clearInputForm() {
  search.value = createSearch();
  selectedParking.value = null;
}

function saveRouteHistory() {
  const snapshot = (location) => ({
    lat: location.lat,
    lng: location.lng,
    name: location.name.trim(),
  });
  const departure = snapshot(search.value.departure);
  const arrival = snapshot(search.value.arrival);
  const parking = snapshot(search.value.parking);
  if (!departure.name || !arrival.name) return;

  routeHistory.add({
    key: JSON.stringify([departure, parking, arrival]),
    departure,
    parking,
    arrival,
    parkingPlace: selectedParking.value ? { ...selectedParking.value } : null,
  });
}

async function fetchListParking() {
  const requestId = ++parkingRequestId;
  const { lat, lng, name } = search.value.arrival;
  if (!name.trim()) {
    parkingList.value = [];
    return;
  }

  // 도착지 좌표가 연결되기 전에는 목업 목록을 표시합니다.
  if (lat == null || lng == null) {
    parkingList.value = ['A', 'B', 'C'].map((suffix, index) => ({
      id: `mock-parking-${index + 1}`,
      name: `${name} 인근 주차장 ${suffix}`,
      address: `${name} 인근 주차장 ${suffix}`,
      description: '목업 주차장',
      totalSpaces: 10 * (index + 1),
      lat: null,
      lng: null,
    }));
    return;
  }

  parkingList.value = [];
  try {
    const response = await HttpHandler.listParking({
      destination: { latitude: lat, longitude: lng },
      radiusMeters: radiusMeters.value,
    });
    if (requestId === parkingRequestId) {
      parkingList.value = response?.data?.items || [];
    }
  } catch (error) {
    if (requestId === parkingRequestId) {
      console.error('주차장 목록 조회 실패:', error);
      parkingList.value = [];
    }
  }
}
</script>

<style scoped>
.search-upper :deep(.v-field__input) {
  color: #364153 !important;
  font-size: 16px !important;
}
.search-lower :deep(.v-field__input) {
  color: #364153 !important;
  font-size: 16px !important;
}

.search-upper :deep(.v-field__input::placeholder) {
  color: #364153 !important;
  font-size: 16px !important;
  opacity: 1;
}
.search-lower :deep(.v-field__input::placeholder) {
  color: #364153 !important;
  font-size: 16px !important;
  opacity: 1;
}

.search-upper :deep(.v-icon) {
  color: #364153 !important;
  opacity: 1;
}
.search-lower :deep(.v-icon) {
  color: #364153 !important;
  opacity: 1;
}

.container-list {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  justify-content: center;
  align-items: flex-start;
  align-content: flex-start;
}
.list-header {
  width: 100%;
  font-size: 18px;
  font-weight: 600;
  margin: 12px 12px 0px 12px;
}
.searchbox-list {
  margin: 12px;
  margin-bottom: 8px;
}
</style>