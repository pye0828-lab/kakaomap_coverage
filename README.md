# BoviCareKorMap (kakaomap_coverage)

게이트웨이 커버리지(반경) 확인용 지도 측정 도구. 지점 좌표 확인·경로 거리 측정·지점별 반경원 표시·GPS 실시간 추적 기능을 제공한다.

## 원본 / 출처

이 도구는 [dream2k2/gmap-plus-fsm-](https://github.com/dream2k2/gmap-plus-fsm-) (`GeoMeasure`, Google Maps 기반)를 참조하여 새로 작성했다.

- 원본 배경: 국내 현장(제주 등)의 게이트웨이 커버리지 검토 시 Google 위성지도가 오래되어, 국내에서 더 최신인 **카카오맵 스카이뷰**로 지도 엔진을 교체했다.
- Google Maps API → **Kakao Maps JS API**로 전면 교체 (좌표계는 WGS84로 동일, 검색·오버레이 방식은 카카오 API에 맞춰 재작성).
- 지점 좌표/거리 계산 로직 등 지도 엔진과 무관한 부분은 원본의 구조를 참고했다.
- 이 저장소는 원본의 fork가 아닌 독립 저장소다.

## 기능

- 장소/좌표 검색 (검색 마커는 클릭으로 제거 — 지도 위치는 유지)
- GPS 현재 위치 확인 및 실시간 추적 (측위 정확도 ± 표시, 실패 시 사유·조치 안내)
- 지도 탭으로 지점 추가, 지점 간 경로 거리 자동 계산 (폐합 둘레 포함)
- 지점별 반경원(커버리지) 표시, 마커 드래그로 위치 조정
- **영역(폴리곤)** — 방목지·농장경계를 다각형으로 그리고 채움색·선색·투명도 지정, 면적 자동 계산
- **지도 위 텍스트** — 영역 이름·설명과 독립 텍스트, 라벨은 드래그로 위치 조정
- **GeoJSON 내보내기/불러오기** — 파일 하나 = 목장 하나, 드래그앤드롭 지원, 작업 자동저장
- 지도 타입 전환(스카이뷰 / 스카이뷰+라벨 / 일반 / 지형)

캡처 후 그림판으로 방목지 경계와 설명을 그려 넣던 수작업을 도구 안으로 옮긴 것이 영역·텍스트 기능이다.

### 모드

지도 클릭의 주인이 셋 중 하나다. 상단 고정 바에서 전환한다.

| 모드 | 지도 클릭 |
|---|---|
| 📏 측정 | 측정 지점 추가 |
| ⬟ 영역 | 다각형 꼭짓점 추가 (더블클릭/우클릭으로 닫기) |
| 👁 보기 | 무시 (라벨 드래그는 가능) |

### 저장 포맷

자체 JSON이 아니라 **GeoJSON**을 쓴다. 지도 엔진을 바꿔도 현장 데이터가 살아남아야 하기 때문이다.

| 항목 | geometry | properties |
|---|---|---|
| GW 커버리지 | Point | radius, label, color |
| 영역 | Polygon | name, desc, fillColor, strokeColor, opacity, labelPos |
| 텍스트 | Point | text, fontSize |
| 측정 경로 | LineString | — |

거리·면적처럼 **계산으로 나오는 값은 저장하지 않는다**(좌표를 옮겼을 때 어긋난 파일이 된다). 반경은 사용자가 정한 값이라 저장한다. 경로 LineString은 외부 뷰어용으로 내보내되, 불러올 때는 무시하고 GW 지점에서 다시 그린다.

불러오기는 신뢰 경계로 취급한다. 좌표 범위·타입·필수 필드를 검증하고, 버린 항목은 사유를 화면에 남긴다.

## 사용 / 설정

정적 HTML 한 파일이라 별도 빌드가 필요 없다. 웹서버에 `index.html`을 올리면 동작한다.

단, **Kakao Maps JavaScript 키**가 필요하다. [Kakao Developers](https://developers.kakao.com)에서 애플리케이션을 만든 뒤 아래 3가지를 설정한다. **하나라도 빠지면 지도가 안 뜬다.**

### 1. JavaScript 키를 코드에 넣기

`내 애플리케이션 > 앱 설정 > 앱 > 플랫폼키`

여기의 **JavaScript 키**를 `index.html` 맨 아래 SDK 로드 URL의 `appkey=`에 지정한다.

```html
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=여기에_JavaScript_키&libraries=services&autoload=false"></script>
```

### 2. 도메인 등록 (JavaScript SDK 도메인)

`내 애플리케이션 > 앱 설정 > 앱 > 플랫폼키 > JavaScript 키 [수정] > JavaScript SDK 도메인`

> ⚠️ 도메인 등록란은 **JavaScript 키 항목의 `수정` 안**에 있다. 별도의 "플랫폼" 메뉴가 아니다 — 여기서 많이 헤맨다.

서비스할 주소를 **origin(스킴 + 호스트 + 포트)** 형태로 등록한다.

| 용도 | 등록값 |
|---|---|
| 운영 | `https://yepark.co.kr` |
| 로컬 확인 | `http://localhost:8080` |

- **경로(`/bovicare-gmapkakao`)는 검사하지 않는다.** origin만 맞으면 된다 — 경로까지 넣으면 오히려 안 된다.
- 미등록 시 SDK 요청이 `401 domain mismatched`로 거부된다.

### 3. 카카오맵 제품 활성화

`내 애플리케이션 > 제품 설정 > 카카오맵` → **ON**

- 키와 도메인이 다 맞아도 이게 꺼져 있으면 `403 disabled OPEN_MAP_AND_LOCAL service`로 거부된다.
- 앱을 새로 만들면 **기본값이 OFF**다. 새 앱으로 옮길 때 반드시 다시 켠다.

---

> 카카오 JavaScript 키는 클라이언트에 노출되는 것이 정상이며, **도메인 화이트리스트로 보호**된다. 그래서 이 저장소에는 키를 코드에 그대로 둔다.

지도가 안 뜨면 화면에 **현재 접속 origin**과 함께 안내가 표시된다. 그 값을 위 2번에 그대로 복사해 넣으면 된다. 브라우저 콘솔의 에러 코드로 원인을 가릴 수 있다:

| 증상 | 원인 | 조치 |
|---|---|---|
| `401 domain mismatched` | 도메인 미등록 | 2번 |
| `403 disabled OPEN_MAP_AND_LOCAL service` | 카카오맵 제품 OFF | 3번 |

## 자체 점검

지도 SDK 없이 순수 로직만 확인한다. 도메인 등록 전에도, 브라우저 없이도 돌아간다.

**브라우저에서 거리만 빠르게 보기**

```
index.html?selfcheck=1
```

**전체 검증 (거리 · 면적 · GeoJSON 파싱 · 입력 검증)**

```
node selfcheck.test.js
```

의존성·프레임워크 없이 `node`만 있으면 된다. `index.html`의 인라인 스크립트를 **매번 그대로 추출해** 돌리므로 사본이 갈라지지 않는다.

기준값은 원본 도구로 측정한 용춘목장 3지점(A↔B 196.7 m · B↔C 237.9 m · C↔A 355.5 m)이다. **거리 계산부를 수정했다면 반드시 통과를 확인할 것.** GeoJSON 불러오기는 신뢰 경계라 손상·악의적 입력(위경도 뒤바뀜, NaN, CSS 주입, 과대 반경, 초장문 문자열)도 함께 검증한다.

## 배포

**https://yepark.co.kr/bovicare-gmapkakao/** (라즈베리파이 자체 호스팅, nginx)

**웹서버에서 `*.md`와 `.git/` 외부 접근을 차단할 것.** 이 저장소의 문서 파일과 형상관리 이력이 서비스 URL로 그대로 노출되는 것을 막는다. 필수 설정 3가지와 적용 확인 절차는 [`CLAUDE.md`](CLAUDE.md) §3.

## 코드 규칙

이 저장소는 바이브코딩(사람 지시 + AI 에이전트 작성)으로 개발하며, 주석은 한글로 쓰고 [Ponytail](https://github.com/DietrichGebert/ponytail) 코드룰을 적용한다. 상세는 [`CLAUDE.md`](CLAUDE.md).
