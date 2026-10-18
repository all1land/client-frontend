import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();

function git(repo, args) {
  return execFileSync(
    'git',
    ['-C', repo, ...args],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
}

function write(relativePath, text) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text, 'utf8');
}

const backendCommit = '4be757a24171ed721e28f278bbff60aaea584902';
const mockupCommit = '835e3daf8bb2ea5ce0180a093cf57f222e12caee';
const seedPath =
  'src/main/resources/db/seed/V5__insert_gangseo_parking_lots.sql';

const sql = git('../backend', [
  'show',
  `${backendCommit}:${seedPath}`,
]);

// 확인한 Seed SQL 구조 전용 변환입니다. SQL을 실행하지 않습니다.
const pattern =
  /ST_MakePoint\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)[\s\S]*?INSERT INTO tb_parking_lot\s*\(([\s\S]*?)\)\s*SELECT\s+([\s\S]*?)FROM new_location;/g;

function decode(value) {
  const token = value.trim();

  if (token === 'NULL') return null;

  const quoted = token.match(/^(?:TIME\s+|DATE\s+)?'((?:[^']|'')*)'$/);

  if (quoted) return quoted[1].replace(/''/g, "'");

  if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);

  if (token === 'id') return null;

  throw new Error(`알 수 없는 SQL 값: ${token}`);
}

const rows = [...sql.matchAll(pattern)].map((match) => {
  const columns = match[3].split(',').map((value) => value.trim());
  const tokens = match[4].match(/(?:'(?:[^']|'')*'|[^,'])+/g);

  if (!tokens || tokens.length !== columns.length) {
    throw new Error('Seed 컬럼과 값의 개수가 일치하지 않습니다.');
  }

  const source = Object.fromEntries(
    columns.map((column, index) => [column, decode(tokens[index])]),
  );

  const longitude = Number(match[1]);
  const latitude = Number(match[2]);

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 || longitude > 180 ||
    latitude < -90 || latitude > 90
  ) {
    throw new Error(`잘못된 좌표: ${source.name}`);
  }

  return {
    id: `${source.provider_code}:${source.external_id}`,
    externalId: source.external_id,
    providerCode: source.provider_code,
    name: source.name,
    longitude,
    latitude,
    address: source.road_name_address || source.lot_number_address || '',
    totalSpaces: source.total_spaces,
  };
});

if (rows.length !== 37) {
  throw new Error(`37건이 아닙니다: ${rows.length}건`);
}

if (new Set(rows.map((row) => row.id)).size !== rows.length) {
  throw new Error('주차장 식별자가 중복됩니다.');
}

const mockupSource = git('../mockup', [
  'show',
  `${mockupCommit}:src/pages/Map/MapView.vue`,
]);

const distanceFunction = mockupSource.match(
  /function haversineDistance\([\s\S]*?\n\}/,
);

if (!distanceFunction) {
  throw new Error('기존 목업 거리 함수를 찾지 못했습니다.');
}

write(
  'src/assets/parking/gangseo-parking-lots.json',
  JSON.stringify(rows, null, 2) + '\n',
);

write(
  'src/common/GeoUtil.js',
  [
    '/**',
    ' * all1land/mockup의 기존 직선거리 함수 재사용.',
    ' * 좌표 순서: [경도, 위도], 반환 단위: 미터.',
    ` * 원본 커밋: ${mockupCommit}`,
    ' */',
    `export ${distanceFunction[0]}`,
    '',
  ].join('\n'),
);

write(
  'src/assets/parking/source.json',
  JSON.stringify({
    repository: 'all1land/backend',
    commit: backendCommit,
    path: seedPath,
    count: rows.length,
    identity: 'provider_code + external_id',
    usage: 'Seed에서 변환한 프런트엔드 데모 데이터. 실행 중인 DB 조회가 아님.',
  }, null, 2) + '\n',
);

console.log(`실제 Seed 데이터 ${rows.length}건 변환 완료`);
console.log('기존 mockup 거리 함수 가져오기 완료');
console.log('첫 주차장:', rows[0].name);