# BoviCareKorMap (kakaomap_coverage)

게이트웨이 커버리지(반경) 확인용 지도 측정 도구. 지점 좌표 확인·경로 거리 측정·지점별 반경원 표시·GPS 실시간 추적 기능을 제공한다.

## 원본 / 출처

이 도구는 [dream2k2/gmap-plus-fsm-](https://github.com/dream2k2/gmap-plus-fsm-) (`GeoMeasure`, Google Maps 기반)를 참조하여 새로 작성했다.

- 원본 배경: 국내 현장(제주 등)의 게이트웨이 커버리지 검토 시 Google 위성지도가 오래되어, 국내에서 더 최신인 **카카오맵 스카이뷰**로 지도 엔진을 교체했다.
- Google Maps API → **Kakao Maps JS API**로 전면 교체 (좌표계는 WGS84로 동일, 검색·오버레이 방식은 카카오 API에 맞춰 재작성).
- 지점 좌표/거리 계산 로직 등 지도 엔진과 무관한 부분은 원본의 구조를 참고했다.
- 이 저장소는 원본의 fork가 아닌 독립 저장소다.

## 기능

- 장소/좌표 검색
- GPS 현재 위치 확인 및 실시간 추적 (측위 정확도 ± 표시)
- 지도 탭으로 지점 추가, 지점 간 경로 거리 자동 계산 (폐합 둘레 포함)
- 지점별 반경원(커버리지) 표시, 마커 드래그로 위치 조정
- 지도 타입 전환(스카이뷰 / 스카이뷰+라벨 / 일반 / 지형)

## 사용 / 설정

정적 HTML 한 파일이라 별도 빌드가 필요 없다. 웹서버에 `index.html`을 올리면 동작한다.

단, **Kakao Maps JavaScript 키**가 필요하다. [Kakao Developers](https://developers.kakao.com)에서 애플리케이션을 만든 뒤:

1. **앱 키 → JavaScript 키**를 `index.html`의 SDK 로드 URL `appkey=`에 지정
2. **제품 설정 → 카카오맵 → 활성화 ON**
   - 켜지 않으면 SDK 요청이 `403 disabled OPEN_MAP_AND_LOCAL service`로 거부된다
3. **앱 설정 → 플랫폼 → Web → 사이트 도메인**에 서비스할 주소를 **origin(스킴+호스트+포트)** 형태로 등록
   - 예: `https://yepark.co.kr`, 로컬 확인용 `http://localhost:8080`
   - 경로(`/bovicarekormap`)는 검사하지 않으므로 origin만 맞으면 된다
   - 미등록 시 `401 domain mismatched`

> 카카오 JavaScript 키는 클라이언트에 노출되는 것이 정상이며, 도메인 화이트리스트로 보호된다.

지도가 안 뜨면 화면에 현재 접속 origin과 함께 안내가 표시되므로, 그 값을 위 3번에 그대로 등록하면 된다.

## 자체 점검

거리 계산이 맞는지 지도 없이 확인할 수 있다. 지도 SDK가 필요 없어 도메인 등록 전에도 돌아간다.

```
index.html?selfcheck=1
```

원본 도구로 측정한 기준값(용춘목장 3지점)과 대조해 PASS/FAIL을 출력한다. 거리 계산부를 수정했다면 반드시 통과를 확인할 것.

## 배포

`https://yepark.co.kr/bovicarekormap` (자체 호스팅)

**웹서버에서 `*.md` 외부 접근을 차단할 것.** 이 저장소의 문서 파일이 서비스 URL로 그대로 노출되는 것을 막는다. 설정 방법은 [`CLAUDE.md`](CLAUDE.md) §3.

## 코드 규칙

이 저장소는 바이브코딩(사람 지시 + AI 에이전트 작성)으로 개발하며, 주석은 한글로 쓰고 [Ponytail](https://github.com/DietrichGebert/ponytail) 코드룰을 적용한다. 상세는 [`CLAUDE.md`](CLAUDE.md).
