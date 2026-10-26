<template>
  <v-row no-gutters class="searchbox-list">
    <v-col cols="12">
      <v-text-field
          v-model="departure.name"
          class="inputbox | search-upper"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details readonly
          placeholder="출발지 입력"
          @keydown.enter.prevent="handleEvent('search')"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
          v-model="parking.name"
          class="inputbox | search-lower"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          placeholder="주차장 선택"
          @keydown.enter.prevent="handleEvent('search')"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
          v-model="arrival.name"
          class="inputbox | search-lower"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details readonly
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

    <v-col v-if="ParkingErrMsg" class="pa-3" cols="12">
      {{ ParkingErrMsg }}
    </v-col>
  </v-row>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, watch, inject} from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"

import * as HttpHandler from '@/common/HttpHandler.js';
import { routeHistory } from '@/common/MapHistory.js';
import ParkingCard from '@/components/map/parking/ParkingCard.vue';

const currentLocation = inject('currentLocation', ref(null));

const departure = ref({ lat: null, lng: null, name: null });
const arrival = ref({ lat: null, lng: null, name: null });
const parking = ref({ lat: null, lng: null, name: null });

const radiusMeters = ref(1000);

const parkingList = ref([]);
const parkingLoading = ref(false);
const parkingError = ref('');
const ParkingErrMsg = ref('');
let parkingRequestId = 0;

watch(currentLocation, () => getStoredDepart(), { immediate: true, deep: true });

// ----- 라이프 사이클 ----- //
onMounted(() => {
  setInputForm();

});

onUnmounted(() => {
  parkingRequestId++;
})

// 출발지, 도착지, 주차지 변경 시 로컬 스토리지에 저장하는 함수 호출
watch([departure, arrival, parking], () => updateRouteSearch(), { deep: true });

// 주차장 목록 안내 상태 계산
watch(
  [arrival, departure, parkingLoading, parkingError, parkingList],
  () => {
    let msg = '';
    switch (true) {
      case !arrival.value?.name?.trim():
        msg = '도착지를 먼저 선택해주세요.';
        break;
      case !Number.isFinite(departure.value.lat) || !Number.isFinite(departure.value.lng):
        msg = '현재 위치를 알 수 없습니다. 브라우저와 기기의 위치 정보 권한을 허용했는지 확인해주세요.';
        break;
      case parkingLoading.value:
        msg = '주차장을 조회하고 있습니다.';
        break;
      case Boolean(parkingError.value):
        msg = '조건에 맞는 주차장을 조회하지 못했습니다. 잠시 후 다시 시도해주세요.';
        break;
      case !parkingList.value.length:
        msg = '조건에 맞는 주차장이 없습니다.';
        break;
      default:
        break;
    }
    ParkingErrMsg.value = msg;
  },
  { deep: true, immediate: true },
);

// ----- 함수 정의 ----- //

function setInputForm() {
  getStoredArrival();
  getStoredDepart();

  // -> 위의 두개 처리 후에 fetchListParking 호출
  fetchListParking();
}

// 버튼 클릭 및 카드 선택 이벤트 핸들러
function handleEvent(action, payload) {
  switch (action) {
    case 'search':
      findDirections();
      break;

    case 'select':
      if (payload) selectParking(payload);
      break;

    case 'clear':
      clearInputForm();
      break;

    default:
      console.error('알 수 없는 경로 액션 타입:', action);
  }
}

// 로컬 스토리지에서 도착지 정보를 가져오는 함수
function getStoredArrival() {
  try {
    const storedArrival = JSON.parse(localStorage.getItem('route-search'));
    if (storedArrival) {
      arrival.value = storedArrival.arrival ?? storedArrival;
    }
  } catch (error) {
    console.error('도착지 불러오기 실패:', error);
    arrival.value = { lat: null, lng: null, name: null };
  }
}

// 현재 위치를 기반으로 출발지 정보를 가져오는 함수
function getStoredDepart() {
  const location = currentLocation.value;
  if (
    !Number.isFinite(location?.latitude) ||
    !Number.isFinite(location?.longitude) ||
    location.latitude < -90 || location.latitude > 90 ||
    location.longitude < -180 || location.longitude > 180
  ) {
    departure.value = { lat: null, lng: null, name: '위치 확인 필요' };
    return null;
  }

  // 현위치 이름은 올포랜드로 임시 고정
  departure.value = {
    lat: location.latitude,
    lng: location.longitude,
    name: '올포랜드',
  };
  return departure.value;
}

function clearInputForm() {
  // departure.value = { lat: null, lng: null, name: null };
  // arrival.value = { lat: null, lng: null, name: null };
  parking.value = { lat: null, lng: null, name: null };
}

function updateRouteSearch() {
  try {
    const routeSearch = {
      departure: departure.value,
      parking: parking.value,
      arrival: arrival.value,
    };
    localStorage.setItem('route-search', JSON.stringify(routeSearch));
  } catch (error) {
    console.error('도착지 저장 실패:', error);
  }
}

async function fetchListParking() {
  const requestId = ++parkingRequestId;
  const { lat, lng } = arrival.value;
  const radius = radiusMeters.value;
  parkingList.value = [];
  parkingError.value = '';
  parkingLoading.value = false;

  if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    parkingError.value = '도착지 좌표를 확인해주세요.';
    return;
  }
  if (!Number.isFinite(radius) || radius <= 0) {
    parkingError.value = '검색 반경을 확인해주세요.';
    return;
  }

  parkingLoading.value = true;
  try {
    const response = await HttpHandler.nearbyParking({
      latitude: lat,
      longitude: lng,
      radius,
    });
    if (requestId !== parkingRequestId) return;

    parkingList.value = response.data.map((item) => ({
      ...item,
      lat: item.latitude,
      lng: item.longitude,
      address: item.name,
      road_name_address: item.roadNameAddress,
      description: Number.isFinite(item.distanceMeters)
        ? `도착지에서 ${Math.round(item.distanceMeters)}m`
        : '',
    }));
  } catch (error) {
    if (requestId !== parkingRequestId) return;
    parkingError.value = error.message || '주차장 목록 조회에 실패했습니다.';
  } finally {
    if (requestId === parkingRequestId) {
      parkingLoading.value = false;
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