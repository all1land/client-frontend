<template>
  <row no-gutters class="place-list">
    <PlaceCard
      v-for="place in places"
      :key="place.id"
      :place="place"
    />
  </row>
</template>

<script setup>
import { onMounted, ref } from "vue";

import * as HttpHandler from '@/common/HttpHandler.js';

import PlaceCard from "@/components/map/place/PlaceCard.vue";

const places = ref([]);

onMounted(fetchListPlaces);

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
.place-list {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
</style>