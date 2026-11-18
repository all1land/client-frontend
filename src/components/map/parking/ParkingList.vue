<template>
  <v-row no-gutters class="container-list">
    <v-col
      v-for="parking in items"
      :key="parking.id"
      cols="12"
    >
      <ParkingCard
        :parking="parking"
        :selected="parking.id === selectedId"
        @select="onSelect"
        @click="onClick"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import ParkingCard from '@/components/map/parking/ParkingCard.vue';

defineProps({
  items: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
});

const emit = defineEmits(['select', 'click']);

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
</style>