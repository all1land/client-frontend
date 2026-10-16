<template>
  <v-row no-gutters | class="searchbox-list">
    <v-col cols="12">
      <v-text-field
          v-model="search.keyword"
          class="inputbox | search-upper"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          :items="searchItems"
          placeholder="출발지 입력"
          item-title="keyword"
          item-value="keyword"
          @keydown.enter="saveSearchHistory"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
          v-model="search.keyword"
          class="inputbox | search-lower"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          :items="searchItems"
          placeholder="주차장 선택"
          item-title="keyword"
          item-value="keyword"
          readonly
          @keydown.enter="saveSearchHistory"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
          v-model="search.keyword"
          class="inputbox | search-lower"
          variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#364153" color="#364153"
          hide-details
          :items="searchItems"
          placeholder="도착지 입력"
          item-title="keyword"
          item-value="keyword"
          @keydown.enter="saveSearchHistory"
      />
    </v-col>
  </v-row>
  <v-row class="pl-3 | pr-3 | mb-3 | justify-space-between | align-center" no-gutters>
    <v-btn width="88" prepend-icon="mdi-swap-vertical" variant="outlined" color="primary" @click="fetchListPlaces">다시입력</v-btn>
    <v-btn width="88" append-icon="mdi-chevron-right" variant="outlined" color="primary" @click="fetchListPlaces">길찾기</v-btn>
  </v-row>

  <v-divider class="my-2" />

  <v-row v-if="places.length" no-gutters class="container-list">
    <v-col cols="12" class="list-header">주차장</v-col>
    <PlaceCard
      v-for="place in places"
      :key="place.id"
      :place="place"
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
import { onMounted, onUnmounted, ref, computed, watch} from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"

import * as HttpHandler from '@/common/HttpHandler.js';
import { searchHistory } from '@/common/MapHistory.js';

import PlaceCard from "@/components/map/place/PlaceCard.vue";

const places = ref([]);

const search = ref({
  keyword: ''
});
const searchItems = ref([]);


// ----- 라이프 사이클 ----- //
onMounted(() => {
  getSearchHistory();
  fetchListPlaces();
});

onUnmounted(() => {
})

// ----- 함수 정의 ----- //
function saveSearchHistory() {
  const keyword = search.value.keyword.trim();

  if (!keyword) {
    return;
  }

  searchHistory.add({
    key: keyword,
    keyword,
  });
  searchItems.value = searchHistory.getAll();
}

function getSearchHistory() {
  // TODO: 검색기록 + 연관검색어 함께 뿌려주기
  searchItems.value = searchHistory.getAll();
}


async function fetchListPlaces() {
  try {
    const response = await HttpHandler.listPlaces({
      page: 1,
      limit: 10,
    });

    const list = response?.data?.items || [];
    places.value = list;

  } catch (error) {
    console.error('장소 목록 조회 실패:', error);
    places.value = [];
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
  margin: 12px;
  width: 100%;
  height: 100%;
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
  margin-bottom: 8px;
}
</style>