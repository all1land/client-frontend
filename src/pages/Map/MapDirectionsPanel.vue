<template>
  <v-row no-gutters class="searchbox-list">
    <v-col cols="12">
      <v-text-field
          v-model="search.departure"
          class="inputbox | search-upper"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          placeholder="출발지 입력"
          @keydown.enter="findDirections"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
          v-model="search.parking"
          class="inputbox | search-lower"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          placeholder="주차장 선택"
          @keydown.enter="findDirections"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
          v-model="search.arrival"
          class="inputbox | search-lower"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          placeholder="도착지"
          @keydown.enter="findDirections"
      />
    </v-col>
  </v-row>
  <v-row class="pl-3 | pr-3 | mb-3 | justify-space-between | align-center" no-gutters>
    <v-btn width="88" prepend-icon="mdi-swap-vertical" variant="outlined" color="primary" @click="clearInputForm">다시입력</v-btn>
    <v-btn width="88" append-icon="mdi-chevron-right" variant="outlined" color="primary" @click="findDirections">길찾기</v-btn>
  </v-row>

  <v-divider class="my-2" />

  <v-row v-if="parkingList.length" no-gutters class="container-list">
    <v-col cols="12" class="list-header">주차장</v-col>
    <PlaceCard
      v-for="place in parkingList"
      :key="place.id"
      :place="place"
      @select="selectPlace"
    />
  </v-row>

  <v-row v-else no-gutters class="container-list">
    <v-col cols="auto">
      조건에 맞는 장소가 없습니다.
    </v-col>
  </v-row>
</template>

<script setup>
// ----- 선언부 ----- //
import { ref, watch } from "vue";


import { routeHistory } from '@/common/MapHistory.js';

import PlaceCard from '@/components/map/place/PlaceCard.vue';

// 출발지 기본값
const mockDeparture = '올포랜드 마곡본부';
// TODO: MapHomePanel에서 라우팅으로 전달받은 도착지로 교체합니다.
const mockArrival = '목업 도착지';


const parkingList = ref([]);

const selectedParking = ref(null);

const search = ref({ departure: mockDeparture, arrival: mockArrival, parking: '' });



// ----- 라이프 사이클 ----- //


watch(() => search.value.arrival, () => {
  search.value.parking = '';
  selectedParking.value = null;
  fetchParkingList();
}, { immediate: true });

function selectPlace(place) {
  selectedParking.value = place;
  search.value.parking = place.title;
}



function findDirections() {
  saveRouteHistory();
  if (search.value.arrival.trim()) fetchParkingList();

}

function clearInputForm() {
  search.value = { departure: mockDeparture, arrival: mockArrival, parking: '' };
  selectedParking.value = null;
  parkingList.value = [];
  fetchParkingList();
}

function saveRouteHistory() {
  const departure = search.value.departure.trim();
  const arrival = search.value.arrival.trim();
  const parking = search.value.parking.trim();
  if (!departure || !arrival) return;

  routeHistory.add({
    key: JSON.stringify([departure, parking, arrival]),
    departure,
    parking,
    arrival,
    parkingPlace: selectedParking.value,
  });
}


function fetchParkingList() {
  const arrival = search.value.arrival.trim();
  if (!arrival) {
    parkingList.value = [];
    return;
  }

  // TODO: 주차장 API 연결 시 도착지 기반 조회로 교체합니다.
  parkingList.value = [
    { id: 'mock-parking-1', title: `${arrival} 인근 주차장 A`, description: '목업 주차장 · 도보 3분', road_name_address: `${arrival} 인근 (목업)` },
    { id: 'mock-parking-2', title: `${arrival} 인근 주차장 B`, description: '목업 주차장 · 도보 5분', road_name_address: `${arrival} 인근 (목업)` },
    { id: 'mock-parking-3', title: `${arrival} 인근 주차장 C`, description: '목업 주차장 · 도보 7분', road_name_address: `${arrival} 인근 (목업)` },
  ];
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
  margin: 12px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  justify-content: center;
  align-items: flex-start;
  align-content: flex-start;
}
.list-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.searchbox-list {
  margin: 12px;
  margin-bottom: 8px;
}
</style>