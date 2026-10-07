<template>
  <v-row class="map-hud-position control-box">
    <button
      :class="{ active: currentMapType === MAP_TYPE.BASIC }"
      @click="changeMapType(MAP_TYPE.BASIC)"
    >
      일반
    </button>

    <button
      :class="{ active: currentMapType === MAP_TYPE.SATELLITE }"
      @click="changeMapType(MAP_TYPE.SATELLITE)"
    >
      위성
    </button>

    <button
      :class="{ active: currentMapType === MAP_TYPE.TERRAIN }"
      @click="changeMapType(MAP_TYPE.TERRAIN)"
    >
      지형
    </button>
  </v-row>
</template>

<script setup>
import { MAP_TYPE } from "@/common/MapMeta.js";

defineProps({
  currentMapType: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "change-map-type",
]);

function changeMapType(type) {
  emit("change-map-type", type);
}
</script>

<style scoped>
.map-hud-position {
  position: absolute;
  top: 16px;
  right: 16px;
}

.control-box {
  display: flex;

  background-color: #ffffff;

  border: 1px solid #dcdfe4;
  border-radius: 6px;

  overflow: hidden;

  z-index: 10;
}

.control-box button {
  height: 36px;
  padding: 0 14px;

  border: 0;
  border-right: 1px solid #dcdfe4;

  background-color: #ffffff;
  color: #4b5565;

  cursor: pointer;
}

.control-box button:last-child {
  border-right: 0;
}

.control-box button.active {
  background-color: #127ab7;
  color: #ffffff;
}
</style>