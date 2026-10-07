<template>
  <div class="map-side-panel" :class="{ folded: isFolded }">
    <!-- 패널 내용 -->
    <v-row no-gutters class="panel-content">
      <!-- 여기에 내용 -->
    </v-row>

    <!-- 북마크형 접기 버튼 -->
    <button class="fold-button" @click="isFolded = !isFolded">
      {{ isFolded ? "▶" : "◀" }}
    </button>
  </div>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, computed, watch} from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"


const isFolded = ref(false);

// ----- 라이프 사이클 ----- //
onMounted(() => {

});

onUnmounted(() => {

})

// ----- 함수 정의 ----- //




</script>

<style scoped>
.map-side-panel {
    position: absolute;
    top: 0;
    left: 0;
    width: 300px;
    height: 100%;
    background-color: white;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    transition: transform 0.3s ease;
}

.map-side-panel.folded {
    transform: translateX(-100%);
}


.fold-button {
    position: absolute;
    top: 50%;
    left: 100%;                 
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
}

.fold-button:hover {
    background-color: #f5f5f5;
}
</style>