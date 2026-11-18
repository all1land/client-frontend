<template>
  <section class="direction-result container-list" aria-label="길찾기 결과">
    <!-- 요약: 총 소요시간 / 도착 예상 시각 / 총 거리 -->
    <v-row no-gutters class="align-center | summary-main">
      <div class="total-duration">{{ formatDuration(totalSeconds) }}</div>
      <v-chip
        v-if="arrivalTimeText"
        class="ml-2 | tag-chip"
        size="small"
        variant="flat"
        prepend-icon="mdi-flag-checkered"
      >
        {{ arrivalTimeText }} 도착
      </v-chip>
    </v-row>
    <v-row no-gutters class="mt-1">
      <v-col cols="12" class="info-row">
        <v-icon color="#6A7282" size="18" class="mr-1">mdi-map-marker-distance</v-icon>
        <span class="description-text">총 {{ formatDistance(result.totalDistanceMeters) }}</span>
      </v-col>
    </v-row>

    <!-- 소요시간 비율 바 -->
    <v-row
      v-if="barSegments.length"
      no-gutters
      class="mt-3 | duration-bar"
      role="img"
      :aria-label="barAriaLabel"
    >
      <div
        v-for="segment in barSegments"
        :key="segment.key"
        class="bar-segment"
        :style="{ flex: `${segment.seconds} 1 0`, backgroundColor: segment.color }"
        :title="`${segment.label} ${formatDuration(segment.seconds)}`"
      >
        <template v-if="segment.share >= 0.2">
          <v-icon :icon="segment.icon" size="16" color="#FFFFFF" class="mr-1" />
          <span>{{ minutesText(segment.seconds) }}</span>
        </template>
        <span v-else-if="segment.share >= 0.1">{{ minutesText(segment.seconds) }}</span>
      </div>
    </v-row>

    <v-divider class="my-3" />

    <!-- 구간별 타임라인 -->
    <div class="section-title">구간별 소요시간</div>
    <template v-for="(node, index) in timelineNodes" :key="node.key">
      <v-row no-gutters class="align-center | timeline-node">
        <span class="node-dot" :class="{ 'node-dot--end': node.isEnd }" />
        <div class="card-description">{{ node.label }}</div>
        <div class="ml-auto | card-description">{{ node.time }}</div>
      </v-row>

      <v-row v-if="steps[index]" no-gutters class="align-center | timeline-step">
        <span class="step-line" :style="{ backgroundColor: steps[index].color }" />
        <v-icon :icon="steps[index].icon" size="18" :color="steps[index].color" class="mr-2" />
        <div class="description-text">{{ steps[index].label }}</div>
        <div class="ml-auto | value-text | step-duration">{{ formatDuration(steps[index].seconds) }}</div>
      </v-row>
    </template>
  </section>
</template>

<script setup>
// ----- 선언부 ----- //
import { computed } from "vue";

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  // 출발 시각 (미지정 시 현재 시각 기준으로 도착 예상 시각 계산)
  departureTime: {
    type: [Date, String, Number],
    default: null,
  },
});

// 구간별 표시 색상
const COLORS = {
  walk: '#8AB63F',
  car: '#127ab7',
};

// ----- 화면 표시용 값 ----- //
const steps = computed(() => {
  const summary = props.result.summary ?? {};
  return [
    { key: 'departureWalk', label: '출발지 도보', icon: 'mdi-walk', color: COLORS.walk, seconds: summary.departureWalkingDurationSeconds },
    { key: 'driving', label: '자동차', icon: 'mdi-car', color: COLORS.car, seconds: summary.drivingDurationSeconds },
    { key: 'arrivalWalk', label: '도착지 도보', icon: 'mdi-walk', color: COLORS.walk, seconds: summary.arrivalWalkingDurationSeconds },
  ];
});

const totalSeconds = computed(() => {
  const total = props.result.summary?.totalDurationSeconds ?? props.result.totalDurationSeconds;
  if (Number.isFinite(total)) return total;

  const sum = steps.value.reduce((acc, step) => acc + (isValidSeconds(step.seconds) ? step.seconds : 0), 0);
  return sum > 0 ? sum : NaN;
});

// 바에는 시간이 있는 구간만 표시
const barSegments = computed(() => {
  const validSteps = steps.value.filter((step) => isValidSeconds(step.seconds) && step.seconds > 0);
  const sum = validSteps.reduce((acc, step) => acc + step.seconds, 0);
  if (!sum) return [];

  return validSteps.map((step) => ({ ...step, share: step.seconds / sum }));
});

const barAriaLabel = computed(() =>
  barSegments.value.map((segment) => `${segment.label} ${formatDuration(segment.seconds)}`).join(', ')
);

const startDate = computed(() => {
  const date = props.departureTime ? new Date(props.departureTime) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
});

// 각 지점 도착 예상 시각 (출발 → 구간 종료 순)
const clockTexts = computed(() => {
  let cursor = startDate.value.getTime();
  const times = [cursor];

  steps.value.forEach((step) => {
    cursor += (isValidSeconds(step.seconds) ? step.seconds : 0) * 1000;
    times.push(cursor);
  });

  return times.map((time) => formatClock(new Date(time)));
});

const timelineNodes = computed(() => {
  const labels = ['출발', '차량 탑승', '주차 완료', '도착'];
  return labels.map((label, index) => ({
    key: `node-${index}`,
    label,
    time: clockTexts.value[index],
    isEnd: index === 0 || index === labels.length - 1,
  }));
});

const arrivalTimeText = computed(() => {
  if (!Number.isFinite(totalSeconds.value)) return '';
  return formatClock(new Date(startDate.value.getTime() + totalSeconds.value * 1000));
});

// ----- 함수 정의 ----- //
function isValidSeconds(seconds) {
  return Number.isFinite(seconds) && seconds >= 0;
}

// 시각 포맷 (날짜가 바뀌면 '내일' 등 표기)
function formatClock(date) {
  const time = date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dayDiff = Math.floor(
    (new Date(date).setHours(0, 0, 0, 0) - new Date(startDate.value).setHours(0, 0, 0, 0)) / 86400000
  );

  if (dayDiff <= 0) return time;
  return `${dayDiff === 1 ? '내일' : `${dayDiff}일 후`} ${time}`;
}

function minutesText(seconds) {
  return `${Math.max(1, Math.ceil(seconds / 60))}분`;
}

function formatDuration(seconds) {
  if (!isValidSeconds(seconds)) return '정보 없음';

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
  background-color: #FFFFFF;
  color: #364153;
}

/* ----- 요약 ----- */
.summary-main {
  flex-wrap: nowrap;
}

.total-duration {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  color: #127ab7;
}

.tag-chip {
  background-color: #F3F4F6 !important;
  color: #4A5565 !important;
  font-size: 12px;
}

.info-row {
  display: flex;
  align-items: center;
}

.description-text {
  font-size: 14px;
  color: #364153;
}

.card-description {
  font-size: 14px;
  color: #8B95A1;
}

/* ----- 소요시간 바 ----- */
.duration-bar {
  flex-wrap: nowrap;
  gap: 2px;
  width: 100%;
  height: 28px;
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 6px;
  overflow: hidden;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.bar-segment:first-child {
  border-radius: 14px 0px 0px 14px;
}

.bar-segment:last-child {
  border-radius: 0px 14px 14px 0px;
}

/* ----- 섹션 ----- */
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #364153;
  margin-bottom: 8px;
}

.value-text {
  font-size: 14px;
  color: #364153;
  text-align: right;
  word-break: keep-all;
}

/* ----- 타임라인 ----- */
.timeline-node {
  position: relative;
  flex-wrap: nowrap;
  min-height: 24px;
  padding-left: 20px;
}

.node-dot {
  position: absolute;
  left: 0px;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translateY(-50%);
  border: 2px solid #8B95A1;
  border-radius: 50%;
  background-color: #FFFFFF;
  z-index: 1;
}

.node-dot--end {
  border-color: #127ab7;
  background-color: #127ab7;
}

.timeline-step {
  position: relative;
  flex-wrap: nowrap;
  padding: 10px 0px 10px 20px;
}

/* 노드 점의 중앙을 지나는 세로 연결선 */
.step-line {
  position: absolute;
  left: 4px;
  top: -5px;
  bottom: -5px;
  width: 2px;
  border-radius: 1px;
}

.step-duration {
  font-weight: 600;
}
</style>