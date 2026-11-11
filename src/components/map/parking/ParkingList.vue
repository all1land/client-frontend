<template>
  <div>
    <ParkingCard
      v-for="parking in items"
      :key="parking.id"
      :parking="parking"
      :selected="parking.id === selectedId"
      @select="onSelect"
      @click="onSelect"
    />
  </div>
</template>

<script setup>
import ParkingCard from '@/components/map/parking/ParkingCard.vue';

defineProps({
  items: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
});

const emit = defineEmits(['select']);

function onSelect(parking) {
  console.log('[ParkingList] select', parking?.id);
  emit('select', parking);
}
</script>