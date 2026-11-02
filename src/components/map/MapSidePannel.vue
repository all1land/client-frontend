<template>
  <div class="map-side-wrapper">
    <!-- 패널 + 카드 + 버튼을 하나로 묶어 함께 이동 -->
    <div class="map-side-body" :class="{ folded: isFolded }">
      <!-- 메인 패널 -->
      <div class="map-side-panel" :inert="isFolded">
        <v-row no-gutters class="panel-content">
          <slot :open-detail="openDetail" :close-detail="closeDetail" />
        </v-row>
      </div>

      <!-- 상세 카드 (패널 오른쪽에 붙어 있음, 애니메이션 없음) -->
      <div v-show="isDetailOpen" class="detail-card" :inert="isFolded">
        <div class="detail-header">
          <!-- <v-btn
            icon="mdi-arrow-left"
            variant="text"
            size="small"
            @click="closeDetail"
          /> -->
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeDetail"
          />
        </div>

        <div class="detail-body">
          <slot name="detail" :detail="detailData" :close="closeDetail" />
        </div>
      </div>

      <!-- 북마크형 접기 버튼 (카드 열림 여부에 따라 위치만 바뀜) -->
      <button
        class="fold-button"
        :class="{ 'detail-open': isDetailOpen }"
        :aria-expanded="!isFolded"
        :aria-label="isFolded ? '패널 펼치기' : '패널 모두 접기'"
        @click="isFolded = !isFolded"
      >
        <v-icon :icon="isFolded ? 'mdi-chevron-right' : 'mdi-chevron-left'" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const isFolded = ref(false);
const isDetailOpen = ref(false);
const detailData = ref(null);

const emit = defineEmits(["detail-open", "detail-close"]);

// ----- 함수 정의 ----- //
function openDetail(data) {
  detailData.value = data;
  isDetailOpen.value = true;
  isFolded.value = false; // 접혀 있으면 펼침
  emit("detail-open", data);
}

function closeDetail() {
  // 애니메이션 없이 즉시 닫기
  isDetailOpen.value = false;
  detailData.value = null;
  emit("detail-close");
}

// 부모에서 ref로 호출할 수 있도록 노출
defineExpose({ openDetail, closeDetail });
</script>

<style scoped>
/* ===== 전체 래퍼: 위치만 담당, 클릭 통과 ===== */
.map-side-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 0;                  /* 자체 폭 없음 (자식은 overflow) */
  z-index: 1000;
  pointer-events: none;      /* 빈 영역이 지도 클릭을 막지 않도록 */
}

/* ===== 이동 단위: 패널 + 카드 + 버튼이 한 덩어리로 움직임 ===== */
.map-side-body {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  display: flex;
  flex-direction: row;
  transition: transform 0.3s ease;
}

/* 접힐 때: 패널 폭(300px)만 이동 → 카드가 열려 있으면 카드(300px)까지 같이 이동 */
.map-side-body.folded {
  transform: translateX(-100%);
}

/* 내부 요소는 클릭 가능하게 복구 */
.map-side-panel,
.detail-card,
.fold-button {
  pointer-events: auto;
}

/* ===== 메인 패널 ===== */
.map-side-panel {
  position: relative;
  flex: 0 0 300px;
  width: 300px;
  height: 100%;
  background-color: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.panel-content {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.panel-content > :deep(*) {
  flex: 0 0 auto;
}

.panel-content > :deep(.container-list) {
  flex: 1 1 0;
  min-height: 0;
}

/* ===== 상세 카드 (애니메이션 없음) ===== */
.detail-card {
  position: relative;
  flex: 0 0 300px;
  width: 300px;
  height: calc(100% - 32px);
  min-height: 0;
  margin: 16px 0 16px 16px;
  border-radius: 8px;

  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: end;
  padding: 0px;
  flex: 0 0 auto;
}

.detail-title {
  font-weight: 600;
}

.detail-body {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

/* ===== 접기 버튼 ===== */
.fold-button {
  position: absolute;
  top: 50%;
  left: 300px;               /* 기본: 패널 오른쪽 끝 */
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  padding: 0;
  background-color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 12px;
  color: #555;
  z-index: 3;
  transition: background-color 0.2s;
}

.fold-button.detail-open {
  left: 616px;               /* 패널 300 + 간격 16 + 카드 300 */
}

.fold-button:hover {
  background-color: #f5f5f5;
}
</style>
