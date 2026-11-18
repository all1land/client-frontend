<template>
  <section class="direction-result container-list" aria-label="길찾기 결과">
    <h2>길찾기 결과</h2>
    <div class="route-total">
      <strong>{{ formatDuration(result.summary?.totalDurationSeconds ?? result.totalDurationSeconds) }}</strong>
      <span>총 {{ formatDistance(result.totalDistanceMeters) }}</span>
    </div>
    <div class="route-steps">
      <div class="route-step">
        <v-icon icon="mdi-walk" color="primary" />
        <span>출발지 도보</span>
        <strong>{{ formatDuration(result.summary?.departureWalkingDurationSeconds) }}</strong>
      </div>
      <div class="route-step">
        <v-icon icon="mdi-car" color="primary" />
        <span>자동차</span>
        <strong>{{ formatDuration(result.summary?.drivingDurationSeconds) }}</strong>
      </div>
      <div class="route-step">
        <v-icon icon="mdi-walk" color="primary" />
        <span>도착지 도보</span>
        <strong>{{ formatDuration(result.summary?.arrivalWalkingDurationSeconds) }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  result: { type: Object, required: true },
});

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '정보 없음';
  const minutes = Math.ceil(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}시간${remainingMinutes ? ` ${remainingMinutes}분` : ''}` : `${minutes}분`;
}

function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters < 0) return '정보 없음';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;
}
</script>

<style scoped>
.direction-result {
  width: 100%;
  overflow-y: auto;
  padding: 12px;
  color: #364153;
}

.direction-result h2 {
  font-size: 18px;
  font-weight: 600;
}

.route-total {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
}

.route-total strong {
  color: #228cca;
  font-size: 24px;
}

.route-steps {
  display: grid;
  gap: 16px;
  padding: 20px 0;
}

.route-step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.route-step strong {
  margin-left: auto;
}
</style>
