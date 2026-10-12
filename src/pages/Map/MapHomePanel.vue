<template>
  <v-row no-gutters class="searchbox-list">
    <v-autocomplete
        v-model="search.keyword"
        prepend-inner-icon="mdi-magnify"
        class="inputbox | mr-2"
        variant="outlined" density="compact" rounded="m" bg-color="#ffffff" base-color="#8AB63F" color="#8AB63F"
        hide-details
        :items="searchItems"
        item-title="keyword"
        item-value="keyword"
        @keydown.enter="saveSearch"
    />

  </v-row>
  <v-row no-gutters class="container-list">
    <v-col cols="12" class="list-header">주변</v-col>
    <PlaceCard
      v-for="place in places"
      :key="place.id"
      :place="place"
    />
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
const searchItems = ref([
  // TODO: 검색기록 + 연관검색어 함께 뿌려주기
]);


// ----- 라이프 사이클 ----- //
onMounted(() => {
  searchItems.value = searchHistory.getAll();
  fetchListPlaces();
});

onUnmounted(() => {
})

// ----- 함수 정의 ----- //
function saveSearch() {
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
.inputbox :deep(.v-field__input) {
  color: #364153 !important;
  font-size: 16px !important;
}

.inputbox :deep(.v-field__input::placeholder) {
  color: #364153 !important;
  font-size: 16px !important;
  opacity: 1;
}

.inputbox :deep(.v-icon) {
  color: #8AB63F !important;
  opacity: 1;
}

.inputbox :deep(.v-field__overlay) {
  border: 2.5px solid #8AB63F !important;
  border-radius: 4px !important;
}

.container-list {
  margin: 12px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
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