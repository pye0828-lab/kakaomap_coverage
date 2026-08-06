# kakaomap_coverage — 레포 코딩 지침

> 이 파일은 **이 저장소(`kakaomap_coverage`) 안의 코드 작성에만** 적용된다. 상위 폴더의 프로젝트 지침(목표·범위·이식 대응표)과 역할이 다르다 — 여기는 **어떻게 쓸 것인가**만 다룬다.
> 작성자: 개발5파트 / 작성일: 2026-08-05

---

## 1. 이 코드는 바이브코딩 산출물이다

사람이 자연어로 지시하고 AI 에이전트가 코드를 쓰는 방식으로 개발한다. 그래서 다음을 **명시적으로 남긴다**.

- **소스 상단 헤더 주석**에 다음을 기재한다: 도구 성격(AI 협업 작성), 작성일, 원본 출처(`dream2k2/gmap-plus-fsm-`), 적용 코드룰(Ponytail).
- **주석은 전부 한글로 쓴다.** 영문 주석 금지(식별자·API명 등 고유명사는 예외).
  - 이유: 작성자가 자연어로 읽고 지시하는 코드다. 주석이 대화 언어와 같아야 다음 세션에서 맥락이 즉시 붙는다.
- 주석은 **"무엇을"이 아니라 "왜"**를 쓴다. 코드를 그대로 옮겨 적은 주석은 지운다.
  - ✅ `// 카카오는 도메인 화이트리스트로 보호되므로 키를 코드에 박아도 된다`
  - ❌ `// 지도를 생성한다`
- **AI가 판단해서 넣은 비자명한 결정**(대안이 있었는데 하나를 고른 지점)은 한 줄 주석으로 근거를 남긴다. 나중에 사람이 되짚을 수 있어야 한다.

### 1.1 커밋 (에이전트 필독)

- **커밋은 사람이 시킬 때만 한다.** 작업이 끝났다고 바로 커밋하지 않는다. 다 하면 무엇을 바꿨는지 보고하고 지시를 기다린다 — 확인 없이 쌓인 이력을 되돌리는 건 사람 몫이 된다. push·병합·배포도 같다.
- **메시지는 한글로, 짧게.** 제목 한 줄(50자 안팎) + 필요하면 본문 3~5줄 + 검증 한 줄. 그 이상은 장황한 것이다.
  - 본문에는 **비자명한 '왜'만** 적는다. 코드에 보이는 것, 주석에 이미 있는 것, 검토하며 재본 것은 옮겨 적지 않는다.
  - 근거를 길게 남겨야 하면 **소스 주석이나 README 로 간다.** 커밋 메시지는 문서가 아니다.

---

## 2. Ponytail 코드룰 (적용)

> 출처: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT). 원문 규칙을 이 레포에 맞게 한글로 옮긴 것이며, 판단이 갈리면 원문을 따른다.
> 핵심: **가장 게으른 시니어 개발자처럼 생각한다. 게으르다 = 효율적이다, 대충 한다가 아니다. 최고의 코드는 아예 쓰지 않은 코드다.**

### 2.1 사다리 — 코드를 쓰기 전에, 먼저 걸리는 칸에서 멈춘다

1. **이걸 만들 필요가 있나?** (YAGNI) — 없으면 안 쓴다.
2. **이 코드베이스에 이미 있나?** — 있으면 그 헬퍼·유틸·패턴을 재사용한다. 다시 쓰지 않는다.
3. **표준 라이브러리가 해주나?** — 해주면 그걸 쓴다.
4. **플랫폼 기본 기능이 커버하나?** — 커버하면 그걸 쓴다.
5. **이미 설치된 의존성이 해결하나?** — 하면 그걸 쓴다.
6. **한 줄로 되나?** — 되면 한 줄로 쓴다.
7. **그제서야** — 동작하는 최소한의 코드를 쓴다.

사다리는 **문제를 이해한 다음에** 오르는 것이지, 이해를 대신하는 게 아니다. 과제와 그것이 건드리는 코드를 읽고, 실제 흐름을 끝까지 따라간 뒤에 오른다.

**버그 수정 = 증상이 아니라 근본 원인.** 리포트는 증상을 말할 뿐이다. 건드리는 함수의 모든 호출부를 grep해서 **공유 함수를 한 번 고친다** — 거기 가드 하나가 호출부마다 하나씩 넣는 것보다 diff가 작고, 티켓에 적힌 경로만 패치하면 형제 호출부가 그대로 깨진 채 남는다.

### 2.2 규칙

- 명시적으로 요청하지 않은 **추상화 금지**.
- 피할 수 있으면 **새 의존성 추가 금지**.
- 아무도 요청하지 않은 **보일러플레이트 금지**.
- **추가보다 삭제. 영리함보다 지루함. 파일은 최소로.**
- **가장 짧게 동작하는 diff가 이긴다** — 단, 문제를 이해한 뒤에. 엉뚱한 자리의 최소 변경은 게으른 게 아니라 두 번째 버그다.
- 복잡한 요청은 되묻는다: *"X가 정말 필요합니까, 아니면 Y로 충분합니까?"*
- 표준 라이브러리 접근 두 가지가 코드량이 같으면 **엣지케이스에 안전한 쪽**을 고른다. 게으르다는 건 코드가 적다는 뜻이지, 허술한 알고리즘을 쓴다는 뜻이 아니다.
- **의도적으로 모서리를 자른 단순화**(전역 락, O(n²) 스캔, 순진한 휴리스틱 등 한계가 뚜렷한 선택)는 `ponytail:` 주석으로 **그 한계와 개선 경로**를 적어둔다.

### 2.3 게으르면 안 되는 것

- **문제를 이해하는 것** — 이해 못 한 채 낸 작은 diff는 효율로 포장한 게으름이다.
- 신뢰 경계에서의 **입력 검증**.
- 데이터 유실을 막는 **에러 처리**.
- **보안**, **접근성**.
- **실제 하드웨어에 필요한 보정** — 플랫폼은 스펙대로가 아니다. 시계는 흐르고 센서는 틀어진다.
  - 이 레포에서는 **GPS 정확도(accuracy) 표시·측위 오차**가 여기 해당한다. 값을 그대로 믿고 표시하지 않는다.
- **명시적으로 요청된 것**.

### 2.4 검증은 남긴다

자명하지 않은 로직은 **깨지면 실패하는 가장 작은 확인 하나**를 남긴다. 프레임워크·픽스처 없이 assert 기반 자체 점검이나 작은 테스트 파일 하나면 된다. 자명한 한 줄짜리는 테스트가 필요 없다.

- 이 레포의 **필수 검증 기준**: 상위 `CLAUDE.md` §4의 용춘목장 실측값. 이식본에 A/B/C 좌표 입력 시 **A↔B 196.7 m · B↔C 237.9 m · C↔A 355.5 m**가 나와야 한다. 거리 계산부를 건드리면 이 확인을 반드시 다시 돌린다.

---

## 3. 웹서버 설정 (필수)

- **서비스 URL**: `https://yepark.co.kr/bovicare-gmapkakao/`
- **실제 경로**: `/var/www/html/webpage-kakaomap-coverage/` (라즈베리파이, nginx)
- **설정 파일**: `/etc/nginx/sites-enabled/default` 의 `server_name yepark.co.kr` HTTPS 블록

이 레포는 단일 `index.html`을 정적으로 그대로 서빙한다(빌드 없음). 그래서 **`CLAUDE.md`·`README.md`·`.git/`이 웹루트에 그대로 놓인다** — 아래 차단 설정이 서비스 공개의 전제조건이다.

### 3.1 필수 설정 세 가지

**(1) 서비스 경로 매핑** — 폴더명(`webpage-kakaomap-coverage`)을 URL에 노출하지 않기 위해 `alias`로 붙인다.

```nginx
# trailing slash 없이 들어와도 alias가 먹도록 리다이렉트 (없으면 404)
location = /bovicare-gmapkakao {
    return 301 /bovicare-gmapkakao/;
}

location /bovicare-gmapkakao/ {
    alias /var/www/html/webpage-kakaomap-coverage/;
    index index.html;
    try_files $uri $uri/ =404;
}
```

**(2) 내부 폴더명 직접 접근 차단** — `alias`를 써도 `root` 하위에 실제 폴더가 있으면 폴더명으로 우회 접근된다. 기존 차단 regex에 폴더명을 **추가**한다(새 location을 만들지 않는다 — 형제 경로가 이미 한 줄에 모여 있다).

```nginx
location ~ ^/(webpage-yepark-home|...|webpage-kakaomap-coverage)(/|$) {
    deny all;
    return 404;
}
```

**(3) 형상관리·문서 파일 차단** — server 블록 전역에 이미 걸려 있어야 한다. 없으면 넣는다.

```nginx
location ~ /\. {                              # .git, .env 등 숨김 파일
    deny all;
    return 404;
}

# CLAUDE.md·README.md 문서와 selfcheck.test.js 같은 개발용 스크립트
location ~* \.(md|sh|gitignore|gitattributes|test\.js)$ {
    deny all;
    return 404;
}
```

**(4) 위치(geolocation) 허용** — 이게 없으면 GPS 기능이 **통째로 죽는다.**

`conf.d/security.conf` 등에 아래 헤더가 있으면 브라우저 권한·HTTPS·OS 설정이 모두 정상이어도 측위가 무조건 실패한다. `geolocation=()` 는 빈 허용목록 = 전면 차단이다.

```nginx
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;   # ← GPS 죽음
```

`$uri` 로 값만 갈라 이 도구에서만 허용한다.

```nginx
map $uri $geolocation_policy {
    default                    "geolocation=()";
    ~^/bovicare-gmapkakao/     "geolocation=(self)";
}

add_header Permissions-Policy "${geolocation_policy}, microphone=(), camera=()" always;
```

> **`add_header` 를 server·location 블록에 넣어 고치지 말 것.** nginx 는 하위 블록에
> `add_header` 가 하나라도 있으면 **상위 블록의 `add_header` 를 전부 무효화**한다.
> 그 경로에서만 HSTS·X-Frame-Options 등 나머지 헤더가 조용히 사라진다.
> `add_header` 는 한 곳에만 두고 값을 변수로 가른다.
>
> `self` = 같은 오리진 문서만 허용. 서드파티 iframe 은 계속 차단되고 브라우저 권한
> 프롬프트도 그대로 뜬다.

> **`camera=()` 는 그대로 둔다.** 지점 사진 첨부는 `<input type="file">` 이 OS 선택창을
> 띄우는 방식이라 이 정책과 무관하다 — `capture` 속성도, `getUserMedia` 도 쓰지 않는다.
> (`capture="environment"` 를 쓰면 UA 에 따라 이 헤더에 걸릴 수 있는데, 그 속성은
> 앨범 선택지를 없애는 부작용이 있어 채택하지 않았다. 사진 버튼은 하나다.)

**진단 요령**: 이 헤더로 막히면 브라우저는 `code 1 (PERMISSION_DENIED)` 을 준다 —
사용자 거부와 코드가 같아서 권한 화면만 계속 확인하게 된다. 헤더부터 본다.

```bash
curl -sI https://yepark.co.kr/bovicare-gmapkakao/ | grep -i permissions-policy
```

> `test\.js` 는 `*.test.js` 만 막는다 — 서비스 코드인 일반 `.js` 는 그대로 서빙된다.
> 이 레포는 빌드가 없어 개발용 파일이 웹루트에 그대로 놓이므로, **파일을 추가할 때
> 서비스에 필요한 것인지 먼저 따진다.** 아니면 이 목록에 확장자를 추가한다.

### 3.1.1 백업 파일은 `sites-enabled/` 밖에 둔다

`nginx.conf` 가 `include /etc/nginx/sites-enabled/*;` 로 **확장자를 가리지 않고** 읽는다.
`default.bak.20260724` 같은 파일을 같은 디렉터리에 두면 server 블록이 중복 로드되고,
`server_name` 이 겹쳐 어느 쪽이 먹는지가 파일명 정렬 순서로 결정된다.

```bash
sudo mkdir -p /etc/nginx/backups
sudo cp /etc/nginx/sites-enabled/default /etc/nginx/backups/default.bak.$(date +%Y%m%d-%H%M%S)
```

> 이유: 작업 지침·내부 맥락·배포 경로가 서비스 URL로 그대로 노출되는 것을 막는다. GitHub 퍼블릭 레포에서는 공개 유지 — 차단 대상은 **웹서버뿐**이다.

### 3.2 적용 절차

```bash
sudo mkdir -p /etc/nginx/backups   # sites-enabled/ 안에 두면 중복 로드된다 (§3.1.1)
sudo cp /etc/nginx/sites-enabled/default /etc/nginx/backups/default.bak.$(date +%Y%m%d-%H%M%S)
# ... 위 설정 추가 ...
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t`가 실패하면 reload하지 않는다. (`&&`로 묶는 이유)

### 3.3 적용 확인 — 배포 후 반드시 돌린다

```bash
for u in /bovicare-gmapkakao /bovicare-gmapkakao/ \
         /bovicare-gmapkakao/CLAUDE.md /bovicare-gmapkakao/README.md \
         /bovicare-gmapkakao/selfcheck.test.js \
         /bovicare-gmapkakao/.git/config /webpage-kakaomap-coverage/ ; do
  printf "%-40s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' https://yepark.co.kr$u)"
done
```

기대값 — 이와 다르면 설정이 안 먹은 것이다:

| 경로 | 기대 |
|---|---|
| `/bovicare-gmapkakao` | **301** (→ `/bovicare-gmapkakao/`) |
| `/bovicare-gmapkakao/` | **200** |
| `/bovicare-gmapkakao/CLAUDE.md` | **404** |
| `/bovicare-gmapkakao/README.md` | **404** |
| `/bovicare-gmapkakao/selfcheck.test.js` | **404** |
| `/bovicare-gmapkakao/.git/config` | **404** |
| `/webpage-kakaomap-coverage/` | **404** |

위치 기능은 헤더로 따로 확인한다 — 이건 200/404 로는 안 잡힌다.

```bash
curl -sI https://yepark.co.kr/bovicare-gmapkakao/ | grep -i permissions-policy
# 기대: Permissions-Policy: geolocation=(self), microphone=(), camera=()
curl -sI https://yepark.co.kr/ | grep -i permissions-policy
# 기대: geolocation=(), microphone=(), camera=()  ← 다른 사이트는 차단 유지
```

### 3.3.1 개발용 사본 경로

`/bovicare-gmapkakao/` 는 **돌아가는 서비스**다. 기능을 손볼 때는 라이브를 직접 고치지 말고
git worktree 로 뜬 사본에서 작업한 뒤 검증이 끝나면 옮긴다. 카카오 도메인 등록은
`https://yepark.co.kr` **origin 단위**라 경로가 달라도 지도는 그대로 뜬다.

```bash
git worktree add /var/www/html/webpage-kakaomap-coverage-dev -b <브랜치명>
```

nginx 쪽은 세 곳이 짝이다 — `location /bovicare-gmapkakao-dev/` (alias),
내부 폴더명 차단 regex 의 `webpage-kakaomap-coverage-dev`, 그리고 위 두 정책 map.
사본을 정리할 때는 `git worktree remove` 로 지운다(디렉터리만 지우면 등록이 남는다).

### 3.4 서버를 새로 세팅하거나 웹서버를 교체하면

위 3개 설정부터 다시 넣고 3.3을 돌린다. Apache로 교체하는 경우 (2)(3)에 해당하는 최소 설정:

```apache
<FilesMatch "\.(md|sh|gitignore|gitattributes)$">
    Require all denied
</FilesMatch>
<DirectoryMatch "/\.">
    Require all denied
</DirectoryMatch>
```

---

## 4. 키 취급

- **카카오 JavaScript 키는 코드에 그대로 넣는다.** 클라이언트 노출형이고 **도메인 화이트리스트**로 보호된다 — 이게 정상 사용법이다.
  - 화이트리스트 등록 위치는 `앱 설정 > 앱 > 플랫폼키 > JavaScript 키 [수정] > JavaScript SDK 도메인`. 콘솔 메뉴 경로와 에러코드 대응은 [`README.md`](README.md) "사용 / 설정"에 한 곳으로 정리했다 — **여기에 중복해서 적지 않는다.**
- 그 외 토큰·계정정보는 이 레포에 넣지 않는다. (레포 밖 `key/` 폴더에서 관리)
