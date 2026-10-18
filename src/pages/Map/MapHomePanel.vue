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
      label="목적지 검색"
      :items="historyItems"
      @keydown.enter.prevent="searchPlaces"
    />

    <v-btn
      color="primary"
      :loading="loading"
      @click="searchPlaces"
    >
      검색
    </v-btn>
  </v-row>

  <v-alert v-if="errorMessage" type="error" class="ma-3">
    {{ errorMessage }}
  </v-alert>

  <template v-if="destination">
    <div class="ma-3">
      <strong>목적지: {{ destination.name }}</strong>
      <v-btn
        variant="text"
        size="small"
        @click="destination = null"
      >
        목적지 다시 선택
      </v-btn>
    </div>

    <MapParkingPanel :selected-destination="destination" />
  </template>

  <v-row v-else no-gutters class="container-list">
    <v-col cols="12" class="list-header">
      {{ searched ? '목적지 검색 결과' : '목적지를 검색하거나 선택하세요' }}
    </v-col>

    <v-col
      v-for="place in places"
      :key="place.id"
      cols="12"
    >
      <PlaceCard :place="place" />

      <v-btn
        variant="outlined"
        size="small"
        class="mb-4"
        @click="selectDestination(place)"
      >
        이 장소를 목적지로 선택
      </v-btn>
    </v-col>

    <v-col v-if="searched && !places.length" cols="12">
      등록된 데모 장소에서 일치하는 결과가 없습니다.
    </v-col>
  </v-row>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, ref } from 'vue';

import * as HttpHandler from '@/common/HttpHandler.js';
import { searchHistory } from '@/common/MapHistory.js';

import PlaceCard from '@/components/map/place/PlaceCard.vue';
import MapParkingPanel from '@/pages/Map/MapParkingPanel.vue';

const keyword = ref('');
const searchText = ref('');
const historyItems = ref([]);
const places = ref([]);
const destination = ref(null);
const searched = ref(false);
const loading = ref(false);
const errorMessage = ref('');

let allPlaces = [];

// ----- 라이프 사이클 ----- //
onMounted(async () => {
  updateHistory();
  loading.value = true;

  try {
    const response = await HttpHandler.listPlaces({
      page: 1,
      limit: 100,
    });

    allPlaces = response?.data?.items ?? [];
    places.value = allPlaces;
  } catch (error) {
    errorMessage.value = error.message || '장소를 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
});

// ----- 함수 정의 ----- //
function updateHistory() {
  historyItems.value = searchHistory.getAll().map((item) => item.keyword);
}

function searchPlaces() {
  if (loading.value) return;

  const value = String(searchText.value || keyword.value || '').trim();

  destination.value = null;
  errorMessage.value = '';
  searched.value = true;

  if (!value) {
    places.value = allPlaces;
    return;
  }

  keyword.value = value;
  searchHistory.add({ key: value, keyword: value });
  updateHistory();

  const normalized = value.toLocaleLowerCase();

  places.value = allPlaces.filter((place) =>
    [
      place.title,
      place.road_name_address,
    ].some((text) =>
      String(text ?? '').toLocaleLowerCase().includes(normalized),
    ),
  );

  // 검색 결과가 한 곳이면 목적지로 바로 연결합니다.
  if (places.value.length === 1) {
    selectDestination(places.value[0]);
  }
}

function selectDestination(place) {
  // 현재 팀 목업의 lot은 위도 필드로 사용되고 있습니다.
  const rawLatitude = place.latitude ?? place.lat ?? place.lot;
  const rawLongitude = place.longitude ?? place.lng;

  if (
    rawLatitude == null || rawLongitude == null ||
    String(rawLatitude).trim() === '' ||
    String(rawLongitude).trim() === ''
  ) {
    errorMessage.value = '선택한 장소에 좌표가 없습니다.';
    return;
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    errorMessage.value = '선택한 장소의 좌표를 확인하세요.';
    return;
  }

  errorMessage.value = '';

  destination.value = {
    id: place.id,
    name: place.title,
    latitude,
    longitude,
  };
}
</script>

<style scoped>
.inputbox :deep(.v-field__input) {
  color: #364153 !important;
  font-size: 16px !important;
}

.inputbox :deep(.v-icon) {
  color: #8AB63F !important;
  opacity: 1;
}

.container-list {
  margin: 12px;
  width: auto;
  overflow-y: auto;
  justify-content: center;
  align-items: flex-start;
}

.list-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.searchbox-list {
  margin: 12px;
}
</style>