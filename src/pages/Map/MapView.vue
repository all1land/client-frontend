<template>
  <div class="map-view">
    <MapTypeControl
      :current-map-type="currentMapType"
      @change-map-type="changeMapType"
    />

    <div ref="mapElement" class="map"></div>
  </div>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref } from "vue";
import { mapMeta, MAP_TYPE } from "@/common/MapMeta.js";

import { fromLonLat, toLonLat, } from "ol/proj";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import "ol/ol.css";

import MapTypeControl from "@/components/map/hud/MapTypeControl.vue";

const emit = defineEmits([
  "show-right-btn",
  "hide-top-appbar",
]);


// 발산역 기준 좌표 [경도, 위도]
const BALSAN_STATION = [126.8375, 37.5585];
const DEFAULT_ZOOM = 16;

const mapElement = ref(null);
const currentMapType = ref(MAP_TYPE.BASIC);

let map = null;
let baseTileLayer = null;

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

  currentMapType.value = meta.mapType ?? MAP_TYPE.BASIC;

  const tileSource = meta.tileSources[currentMapType.value];

  baseTileLayer = new TileLayer({
    source: createTileSource(tileSource),
  });

  map = new Map({
    target: mapElement.value,

    layers: [
      baseTileLayer,
    ],

    view: new View({
      center: fromLonLat(center),
      zoom: zoom,
      minZoom: meta.view?.minZoom ?? 0,
      maxZoom: meta.view?.maxZoom ?? 19,
    }),
  });

  map.on("moveend", saveMapView);
}

function createTileSource(source) {
  return new XYZ({
    url: source.url,
    minZoom: source.minZoom,
    maxZoom: source.maxZoom,
    attributions: source.attributions,
  });
}

function changeMapType(type) {
  const meta = mapMeta.get();

  const tileSource = meta.tileSources[type];

  if (!tileSource) {
    return;
  }

  baseTileLayer.setSource(
    createTileSource(tileSource)
  );

  currentMapType.value = type;

  mapMeta.setMapType(type);
}

function saveMapView() {
  if (!map) {
    return;
  }

  const view =  map.getView();
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