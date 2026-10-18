import fs from 'node:fs';

const updates = new Map();

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function replaceOnce(source, oldText, newText, file) {
  const count = source.split(oldText).length - 1;

  if (count !== 1) {
    throw new Error(`${file}: 예상한 수정 위치가 없습니다. 반복 실행 여부를 확인하세요.`);
  }

  return source.replace(oldText, newText);
}

const httpFile = 'src/common/HttpHandler.js';
let http = read(httpFile);

if (http.includes('function listNearbyParkingLots')) {
  throw new Error('이미 주차장 조회 함수가 있습니다. 중복 적용을 중단합니다.');
}

http =
  "import parkingRows from '@/assets/parking/gangseo-parking-lots.json';\n" +
  "import { normalizeParkingLots, findNearbyParkingLots } from '@/common/ParkingSearch.js';\n\n" +
  http +
  `

// ----- 주차장 데모 조회 ----- //
export async function listNearbyParkingLots(params = {}) {
  const parkingLots = normalizeParkingLots(parkingRows);

  if (parkingLots.length !== 37) {
    throw new Error('#10의 실제 주차장 37건 연결을 확인하세요.');
  }

  return {
    data: {
      items: findNearbyParkingLots(
        parkingLots,
        params.destination,
        params.radiusMeters,
      ),
      sourceTotal: parkingLots.length,
    },
  };
}
`;

updates.set(httpFile, http);

const mapFile = 'src/pages/Map/MapView.vue';
let map = read(mapFile);

if (map.includes("provide('parkingMap'")) {
  throw new Error('이미 지도 공유 코드가 있습니다.');
}

map = replaceOnce(
  map,
  'import { onMounted, onUnmounted, ref } from "vue";',
  'import { onMounted, onUnmounted, ref, shallowRef, provide } from "vue";',
  mapFile,
);

map = replaceOnce(
  map,
  'let baseTileLayer = null;',
  `let baseTileLayer = null;

const mapInstance = shallowRef(null);
provide('parkingMap', mapInstance);`,
  mapFile,
);

map = replaceOnce(
  map,
  '  initMap();',
  '  initMap();\n  mapInstance.value = map;',
  mapFile,
);

map = replaceOnce(
  map,
  'onUnmounted(() => {',
  'onUnmounted(() => {\n  mapInstance.value = null;',
  mapFile,
);

updates.set(mapFile, map);

const routerFile = 'src/router/index.js';
let router = read(routerFile);

if (router.includes("name: 'MapParking'")) {
  throw new Error('이미 주차장 라우터가 있습니다.');
}

router = replaceOnce(
  router,
  "        path: 'settings',",
  `        path: 'parking',
        name: 'MapParking',
        component: () => import('@/pages/Map/MapParkingPanel.vue')
      },
      {
        path: 'settings',`,
  routerFile,
);

updates.set(routerFile, router);

const appFile = 'src/App.vue';
let app = read(appFile);

if (app.includes("page: 'MapParking'")) {
  throw new Error('이미 주변 주차장 메뉴가 있습니다.');
}

app = replaceOnce(
  app,
  "        page: 'UserSettings',",
  `        page: 'MapParking',
        name: '주변 주차장',
        icon: 'mdi-map-marker-radius',
        path: '/map/parking',
      },
      {
        page: 'UserSettings',`,
  appFile,
);

updates.set(appFile, app);

// 네 파일의 수정 위치를 모두 확인한 후 저장합니다.
for (const [file, content] of updates) {
  fs.writeFileSync(file, content, 'utf8');
  console.log('연결 완료:', file);
}