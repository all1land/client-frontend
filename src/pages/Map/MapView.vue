<template>
  <div class="map-view">
    <div ref="mapElement" class="map"></div>
  </div>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import "ol/ol.css";

import { mapMeta } from "@/common/MapMeta.js";

const emit = defineEmits([
  "show-right-btn",
  "hide-top-appbar",
]);

const router = useRouter();
const route = useRoute();

// 발산역 기준 좌표 [경도, 위도]
const BALSAN_STATION = [126.8375, 37.5585];
const DEFAULT_ZOOM = 16;

const mapElement = ref(null);
let map = null;

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit("hide-top-appbar");
  initMap();
});

onUnmounted(() => {
  if (map) {
    map.setTarget(undefined);
    map = null;
  }
});

// ----- 함수 정의 ----- //
function initMap() {
  const meta = mapMeta.get();

  const center = meta.view?.center ?? BALSAN_STATION;
  const zoom = meta.view?.zoom ?? DEFAULT_ZOOM;

  map = new Map({
    target: mapElement.value,

    layers: [
      new TileLayer({
        source: new OSM(),
      }),
    ],

    view: new View({
      center: fromLonLat(center),
      zoom: zoom,
      minZoom: meta.view?.minZoom ?? 0,
      maxZoom: meta.view?.maxZoom ?? 19,
    }),
  });

  // 지도 이동/줌 종료 시 현재 상태 저장
  map.on("moveend", saveMapView);
}

function saveMapView() {
  if (!map) {
    return;
  }

  const view = map.getView();
  const center = view.getCenter();

  if (!center) {
    return;
  }

  mapMeta.updateView({
    center: toLonLat(center),
    zoom: view.getZoom(),
  });
}
</script>

<style scoped>
.map-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 100%;
}
</style>