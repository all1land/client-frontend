<template>
  <v-row no-gutters class="container-list">
    <!-- 추천 주차장 목록 -->
    <template v-if="recommendedItems.length > 0">
      <v-col
        v-for="parking in recommendedItems"
        :key="`recommended-${parking.id}`"
        cols="12"
      >
        <ParkingCard
          :parking="parking"
          :selected="parking.id === selectedId"
          :is-recommended="true"
          @select="onSelect"
          @click="onClick"
        />
      </v-col>
    </template>

    <!-- 일반 주차장 목록 -->
    <template v-if="nonRecommendedItems.length > 0">
      <v-col
        v-for="parking in nonRecommendedItems"
        :key="`parking-${parking.id}`"
        cols="12"
      >
        <ParkingCard
          :parking="parking"
          :selected="parking.id === selectedId"
          @select="onSelect"
          @click="onClick"
        />
      </v-col>
    </template>
  </v-row>
</template>

<script setup>
import { computed } from 'vue';
import ParkingCard from '@/components/map/parking/ParkingCard.vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  recommendedIds: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
});

const emit = defineEmits(['select', 'click']);

const recommendedItems = computed(() => {
  return props.items.filter((item) => props.recommendedIds.includes(item.id));
});

const nonRecommendedItems = computed(() => {
  return props.items.filter((item) => !props.recommendedIds.includes(item.id));
});

function onSelect(parking) {
  emit('select', parking);
}

function onClick(parking) {
  emit('click', parking);
}
</script>

<style scoped>
.container-list {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  justify-content: center;
  align-items: flex-start;
  align-content: flex-start;
}

.header-text {
  font-size: 14px;
  font-weight: 600;
  color: #364153;
}
</style>