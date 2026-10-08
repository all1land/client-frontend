<template>
  <div class="map-view">

    <MapSidePannel>
      <router-view />
    </MapSidePannel>

    <MapTypeControl
      :current-map-type="currentMapType"
      @change-map-type="changeMapType"
    />

    <div ref="mapElement" class="map"></div>

    <div class="map-bottom-right">

      <div class="zoom-box">
        <button type="button" @click="zoomBy(1)">+</button>
        <input
          class="zoom-slider"
          type="range" step="0.1"
          :min="minZoom"
          :max="maxZoom"
          :value="zoomValue"
          @input="setZoom($event.target.value)"
        />
        <button type="button" @click="zoomBy(-1)">−</button>
      </div>

      <div class="bottom-row">
        <div ref="attributionElement" class="attribution-box"></div>
        <div ref="scaleElement" class="scale-box"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref } from "vue";
import { mapMeta, MAP_TYPE } from "@/common/MapMeta.js";

import { fromLonLat, toLonLat, } from "ol/proj";
import { defaults as defaultControls, Attribution, ScaleLine } from "ol/control";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import "ol/ol.css";

import MapSidePannel from "@/components/map/MapSidePannel.vue";
import MapTypeControl from "@/components/map/hud/MapTypeControl.vue";

const emit = defineEmits([
  "show-right-btn",
]);


// 발산역 기준 좌표 [경도, 위도]
const BALSAN_STATION = [126.8375, 37.5585];
const DEFAULT_ZOOM = 16;

const mapElement = ref(null);
const attributionElement = ref(null);
const scaleElement = ref(null);
const minZoom = ref(0);
const maxZoom = ref(19);
const zoomValue = ref(DEFAULT_ZOOM);
const currentMapType = ref(MAP_TYPE.BASIC);

let map = null;
let baseTileLayer = null;

// ----- 라이프 사이클 ----- //
onMounted(() => {
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

    controls: defaultControls({ zoom: false, attribution: false }).extend([
      new Attribution({
        target: attributionElement.value,
        collapsible: false,
      }),
      new ScaleLine({ target: scaleElement.value }),
    ]),

    view: new View({
      center: fromLonLat(center),
      zoom: zoom,
      minZoom: meta.view?.minZoom ?? 0,
      maxZoom: meta.view?.maxZoom ?? 19,
    }),
  });

  const view = map.getView();
  minZoom.value = view.getMinZoom();
  maxZoom.value = view.getMaxZoom();
  zoomValue.value = view.getZoom();
  view.on("change:resolution", () => {
    zoomValue.value = view.getZoom();
  });

  map.on("moveend", saveMapView);
}

function setZoom(value) {
  map?.getView().setZoom(Number(value));
}

function zoomBy(delta) {
  const view = map?.getView();
  if (!view) {
    return;
  }

  view.animate({ zoom: view.getZoom() + delta, duration: 200 });
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

.map-bottom-right {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.zoom-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
  background-color: #ffffff;
  border: 1px solid #dcdfe4;
  border-radius: 6px;
  overflow: hidden;
}

.zoom-box button {
  width: 36px;
  height: 36px;
  border: 0;
  color: #4b5565;
  font-size: 18px;
  cursor: pointer;
}

.zoom-slider {
  writing-mode: vertical-lr;
  direction: rtl;
  width: 20px;
  height: 120px;
  margin: 4px 0;
  cursor: pointer;
}

.bottom-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.map-bottom-right :deep(.ol-attribution),
.map-bottom-right :deep(.ol-scale-line) {
  position: static;
  background: transparent;
}
.map-bottom-right :deep(.ol-attribution) {
  max-width: none;
}
.map-bottom-right :deep(.ol-attribution ul) {
  background: transparent;
  white-space: nowrap;
  text-shadow: 0 0 2px #fff, 0 0 2px #fff;
}
.map-bottom-right :deep(.ol-scale-line) {
  border-radius: 4px;
}
.attribution-box {
  flex: 0 0 auto;
  white-space: nowrap;
}
.map-bottom-right :deep(.ol-scale-line-inner) {
  margin: 1px;
}

</style>