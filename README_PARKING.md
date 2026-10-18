# 목적지 검색 기반 주차장 조회 및 경로 안내

## 실행

- Node.js 20 사용
- 최초 패키지 설치: npm ci
- 개발 서버: npm run dev
- 계산 및 데이터 테스트: node --test tests/parking-search.test.mjs
- 프로덕션 빌드: npm run build

저장소에는 최종 소스와 데모 데이터가 포함되어 있습니다.
별도의 코드 삽입·연결 스크립트를 실행할 필요가 없습니다.

## 경로 서버 연결

기존 backend의 feat/#9-tmap-route 기능을 사용합니다.

개인 .env.development.local 설정:

VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=10000

서버 주소는 실제 실행 환경에 맞춥니다.
TMAP 키는 백엔드 application-secret.yml에서 관리합니다.
개인 환경설정과 실제 키를 커밋하지 않습니다.

## 데이터

- backend #10의 강서구 주차장 Seed 37건을 JSON으로 변환했습니다.
- 출처는 src/assets/parking/source.json에 기록되어 있습니다.
- 현재 주차장 목록은 실시간 DB 조회가 아닙니다.
- 식별자는 제공기관코드와 주차장관리번호 조합입니다.

scripts/prepare-parking-demo.mjs는 데이터·거리 함수 재생성용입니다.
일반 실행에는 필요하지 않습니다.
재생성 시 형제 폴더 ../backend, ../mockup과 스크립트에 지정된
원본 커밋이 필요하며, 생성 대상 파일을 덮어씁니다.

## 사용자 흐름

지도 홈 목적지 검색 → 목적지 선택 → 주변 주차장 조회
→ 주차장 선택 → 도보 경로 확인
→ 차량 출발지 지정 → 차량 경로 확인

## 제한사항

- 목적지 검색은 기존 목업 장소 10건 범위입니다.
- 주차장 후보 정렬은 직선거리 기준입니다.
- 차량·도보 거리와 시간은 기존 #9 API 응답을 사용합니다.
- 브라우저 추정 위치에는 오차가 발생할 수 있습니다.
- 지도에서 차량 출발지를 직접 선택할 수 있습니다.
- Pretendard 폰트 경로 경고는 별도 확인이 필요합니다.
- GitHub Pages 등 외부 배포에서는 별도로 접근 가능한 경로 서버와
  해당 환경의 서버 주소·CORS 설정이 필요합니다.