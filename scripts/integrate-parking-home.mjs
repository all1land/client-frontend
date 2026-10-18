import fs from 'node:fs';

const changes = new Map();

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function replace(source, before, after, file) {
  if (source.split(before).length !== 2) {
    throw new Error(`${file}: 예상한 코드 위치가 없습니다. 중복 실행하지 마세요.`);
  }

  return source.replace(before, after);
}

const panelFile = 'src/pages/Map/MapParkingPanel.vue';
let panel = read(panelFile);

panel = replace(
  panel,
  "import { inject, ref, watch, onBeforeUnmount } from 'vue';",
  "import { computed, inject, ref, watch, onBeforeUnmount } from 'vue';",
  panelFile,
);

panel = replace(
  panel,
  "import ParkingList from '@/components/map/parking/ParkingList.vue';",
  `import ParkingList from '@/components/map/parking/ParkingList.vue';
import ParkingRouteResult from '@/components/map/parking/ParkingRouteResult.vue';`,
  panelFile,
);

panel = replace(
  panel,
  'const destination = ref(null);',
  `const props = defineProps({
  selectedDestination: { type: Object, required: true },
});

const destination = computed(() => props.selectedDestination);

const selectedParking = computed(() =>
  items.value.find((item) => item.id === selectedId.value) ?? null,
);`,
  panelFile,
);

panel = replace(
  panel,
  'watch([destination, radiusMeters], searchParking);',
  `watch(
  [destination, radiusMeters],
  searchParking,
  { immediate: true },
);`,
  panelFile,
);

panel = replace(
  panel,
  `  const [longitude, latitude] = toLonLat(event.coordinate);
  destination.value = { longitude, latitude };`,
  '  // 目的地は地図ホームの検索結果から選択します。',
  panelFile,
);

panel = replace(
  panel,
  "import { fromLonLat, toLonLat } from 'ol/proj';",
  "import { fromLonLat } from 'ol/proj';",
  panelFile,
);

panel = replace(
  panel,
  '地図ホームの検索結果から選択します。',
  '지도 홈 검색 결과에서 선택합니다.',
  panelFile,
);

panel = panel.replace(
  '// 目的地は지도 홈 검색 결과에서 선택합니다.',
  '// 목적지는 지도 홈 검색 결과에서 선택합니다.',
);

panel = replace(
  panel,
  `      지도를 클릭해 목적지를 선택하세요.
      빨강은 목적지, 파랑은 주차장, 초록은 선택한 주차장입니다.`,
  `      선택한 목적지 주변 주차장입니다.
      주차장을 선택하면 목적지까지의 경로를 조회합니다.`,
  panelFile,
);

panel = replace(
  panel,
  '  </section>',
  `    <ParkingRouteResult
      v-if="selectedParking"
      :parking="selectedParking"
      :destination="destination"
    />
  </section>`,
  panelFile,
);

panel = replace(
  panel,
  "    items.value = response.data.items;\n    sourceTotal.value = response.data.sourceTotal;",
  `    items.value = response.data.items;
    sourceTotal.value = response.data.sourceTotal;

    attachedMap?.getView().animate({
      center: fromLonLat([
        destination.value.longitude,
        destination.value.latitude,
      ]),
      zoom: 15,
      duration: 300,
    });`,
  panelFile,
);

changes.set(panelFile, panel);

const appFile = 'src/App.vue';
let app = read(appFile);


const parkingMenu =
  /^[ \t]*\{\s*page:\s*'MapParking',[\s\S]*?path:\s*'\/map\/parking',?\s*\},?\s*/m;

if (!parkingMenu.test(app)) {
  throw new Error('?? ??? ?? ??? ?? ?????.');
}

app = app.replace(parkingMenu, '');

changes.set(appFile, app);

const routerFile = 'src/router/index.js';
let router = read(routerFile);

router = replace(
  router,
  `        name: 'MapParking',
        component: () => import('@/pages/Map/MapParkingPanel.vue')`,
  `        name: 'MapParking',
        redirect: '/map'`,
  routerFile,
);

changes.set(routerFile, router);

const httpFile = 'src/common/HttpHandler.js';
let http = read(httpFile);

if (http.includes('export async function getWalkingRoute')) {
  throw new Error('이미 경로 API 함수가 있습니다.');
}

http += `

// ----- 기존 #9 경로 API 호출 ----- //
function requireRouteApi() {
  if (!import.meta.env.VITE_API_BASE_URL) {
    throw new Error('경로 API 서버 주소가 설정되지 않았습니다.');
  }
}

export async function getWalkingRoute(params = {}) {
  requireRouteApi();
  return request('GET', '/api/routes/walking', {
    params,
    timeout: 10000,
  });
}

export async function getDrivingRoute(params = {}) {
  requireRouteApi();
  return request('GET', '/api/routes/driving', {
    params,
    timeout: 10000,
  });
}
`;

changes.set(httpFile, http);

for (const [file, content] of changes) {
  fs.writeFileSync(file, content, 'utf8');
  console.log('수정 완료:', file);
}