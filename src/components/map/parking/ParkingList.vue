<template>
  <div>
    <ParkingCard
      v-for="parking in items"
      :key="parking.id"
      :parking="parking"
      :selected="parking.id === selectedId"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup>
import ParkingCard from '@/components/map/parking/ParkingCard.vue';

defineProps({
  items: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
});

defineEmits(['select']);
</script>