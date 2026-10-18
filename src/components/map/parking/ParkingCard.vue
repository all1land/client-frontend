<template>
  <v-card
    class="mb-2"
    :variant="selected ? 'tonal' : 'outlined'"
    :color="selected ? 'primary' : undefined"
  >
    <v-card-title>{{ parking.name }}</v-card-title>

    <v-card-text>
      <div>{{ parking.address || '주소 정보 없음' }}</div>
      <div class="mt-2">
        목적지까지 직선거리
        {{ Math.round(parking.straightDistanceMeters).toLocaleString() }}m
      </div>
      <div v-if="parking.totalSpaces != null">
        전체 주차 면수: {{ parking.totalSpaces }}
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn @click="$emit('select', parking)">
        지도에서 선택
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({
  parking: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

defineEmits(['select']);
</script>