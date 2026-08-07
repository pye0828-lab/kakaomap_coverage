/* ============================================================================
   GeoMeasure K 자체 점검 — 거리·면적·GeoJSON 검증 로직
   ----------------------------------------------------------------------------
   실행: node selfcheck.test.js   (의존성 없음, 프레임워크 없음)
   · 거리 기준값은 상위 CLAUDE.md §4 용춘목장 실측. 거리 계산부를 건드리면
     이 파일을 반드시 다시 돌린다.
   · 지도 SDK·DOM 은 최소 스텁만 둔다. 브라우저 동작이 아니라 "깨지면 조용히
     틀린 값을 내는" 순수 로직만 대상으로 한다.
   · 브라우저에서 거리만 빠르게 보려면 index.html?selfcheck=1 도 그대로 쓴다.
   ============================================================================ */
// index.html 의 인라인 스크립트를 그대로 로드해 순수 로직만 검증한다.
// (지도 SDK·DOM 은 최소 스텁. 사본을 만들지 않으므로 코드가 바뀌면 같이 따라간다)
const fs=require('fs'), vm=require('vm'), assert=require('assert');
// 사본을 두면 코드와 갈라진다 — index.html 의 인라인 스크립트를 매번 그대로 뽑아 쓴다.
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const m=html.match(/<script>\n([\s\S]*)\n<\/script>/);
if(!m){ console.error('index.html 에서 인라인 스크립트를 찾지 못했습니다'); process.exit(1); }
const src=m[1];

const el=()=>({value:'', textContent:'', innerHTML:'', checked:true, style:{},
               classList:{toggle(){},add(){},remove(){}}, addEventListener(){}, dataset:{}});
const ctx={
  window:{}, location:{search:'', origin:'http://x'},
  document:{getElementById:el, querySelectorAll:()=>[], querySelector:()=>null,
            createElement:el, body:{appendChild(){}}, addEventListener(){}},
  localStorage:{getItem:()=>null, setItem(){}},
  console, setTimeout, clearTimeout, URLSearchParams, Blob:class{}, FileReader:class{},
  navigator:{}, Math, Date, JSON, isFinite, parseFloat, parseInt, String, Number, Array, Object,
};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx);

// 최상위 const/let 은 샌드박스 객체의 프로퍼티가 되지 않는다(function 만 된다).
// esc·safeColor 같은 화살표 상수는 컨텍스트 안에서 식을 실행해 꺼낸다.
const run = expr => vm.runInContext(expr, ctx);
// realm 이 달라 프로토타입이 다르므로 deepStrictEqual 대신 필드를 직접 본다.
const eqPt = (p,lat,lng) => assert.ok(p && p.lat===lat && p.lng===lng, JSON.stringify(p));

let pass=0, fail=0;
const t=(name,fn)=>{ try{ fn(); pass++; console.log('PASS  '+name); }
                     catch(e){ fail++; console.log('FAIL  '+name+'\n      '+e.message); } };

// ---- 1. 거리: 용춘목장 실측 (CLAUDE.md §2.4 필수 기준) ----
const A={lat:33.4011689,lng:126.3664674},
      B={lat:33.4022213,lng:126.3647669},
      C={lat:33.4042634,lng:126.3655233};
t('A↔B 196.7 m', ()=>assert.ok(Math.abs(ctx.haversine(A,B)-196.7)<=0.1, ctx.haversine(A,B).toFixed(1)));
t('B↔C 237.9 m', ()=>assert.ok(Math.abs(ctx.haversine(B,C)-237.9)<=0.1, ctx.haversine(B,C).toFixed(1)));
t('C↔A 355.5 m', ()=>assert.ok(Math.abs(ctx.haversine(C,A)-355.5)<=0.1, ctx.haversine(C,A).toFixed(1)));

// ---- 2. 면적: 위도 33°에서 한 변 약 100 m 인 정사각형 ≈ 10,000 ㎡ ----
t('면적 100m×100m ≈ 1만 ㎡', ()=>{
  const d=100/111320, dl=100/(111320*Math.cos(33.4*Math.PI/180));
  const sq=[{lat:33.4,lng:126.36},{lat:33.4,lng:126.36+dl},
            {lat:33.4+d,lng:126.36+dl},{lat:33.4+d,lng:126.36}];
  const a=ctx.polyArea(sq);
  assert.ok(Math.abs(a-10000)<100, a.toFixed(0)+' ㎡');
});
t('면적: 꼭짓점 2개면 0', ()=>assert.strictEqual(ctx.polyArea([{lat:1,lng:1},{lat:2,lng:2}]),0));
t('면적: 감김 방향 무관(절댓값)', ()=>{
  const p=[{lat:33.4,lng:126.36},{lat:33.401,lng:126.36},{lat:33.401,lng:126.361}];
  assert.ok(Math.abs(ctx.polyArea(p)-ctx.polyArea(p.slice().reverse()))<1e-6);
});

// ---- 2-1. 측위 오차 → 화면 배율 (센서는 틀어진다) ----
t('accBox: ±100 m 면 상하 약 100 m 씩', ()=>{
  const b=ctx.accBox(33.4,126.36,100);
  const up=ctx.haversine({lat:33.4,lng:126.36},{lat:b.ne.lat,lng:126.36});
  assert.ok(Math.abs(up-100)<2, up.toFixed(1)+' m');
});
t('accBox: ±20 km 면 상하 약 20 km 씩(과확대 방지의 근거)', ()=>{
  const b=ctx.accBox(33.4,126.36,20000);
  const up=ctx.haversine({lat:33.4,lng:126.36},{lat:b.ne.lat,lng:126.36});
  assert.ok(Math.abs(up-20000)<300, up.toFixed(1)+' m');
});
t('accBox: 경도 폭이 위도로 보정된다(고위도에서 더 넓음)', ()=>{
  const lo=ctx.accBox(0,126.36,1000), hi=ctx.accBox(60,126.36,1000);
  assert.ok((hi.ne.lng-hi.sw.lng) > (lo.ne.lng-lo.sw.lng)*1.9);
});
t('accBox: 극지방에서도 발산하지 않는다', ()=>{
  const b=ctx.accBox(89.999,0,1000);
  assert.ok(isFinite(b.ne.lng) && Math.abs(b.ne.lng)<=180*10, String(b.ne.lng));
});
t('accMessage: 1 km 초과는 km 표기 + 신뢰 경고', ()=>{
  const m=ctx.accMessage(23000);
  assert.ok(m.indexOf('23.0 km')>=0, m);
  assert.ok(m.indexOf('믿지 마세요')>=0, m);
});
t('accMessage: 100 m 이하는 경고 없이 값만', ()=>{
  const m=ctx.accMessage(12.3);
  assert.strictEqual(m,'정확도 ±12.3 m');
});

// ---- 3. 이스케이프·색 검증 (신뢰 경계) ----
t('esc: 스크립트 태그 무력화', ()=>
  assert.strictEqual(run('esc("<img src=x onerror=alert(1)>")'),
    '&lt;img src=x onerror=alert(1)&gt;'));
t('esc: 따옴표(속성 탈출) 차단', ()=>
  assert.strictEqual(run('esc(\'" onmouseover="evil()\')'), '&quot; onmouseover=&quot;evil()'));
t('safeColor: 정상 통과', ()=>assert.strictEqual(run('safeColor("#4cd07d","#000")'),'#4cd07d'));
t('safeColor: CSS 주입 거부', ()=>
  assert.strictEqual(run('safeColor("red;background:url(javascript:1)","#000")'),'#000'));
t('safeColor: 빈값/숫자 거부', ()=>{
  assert.strictEqual(run('safeColor("","#000")'),'#000');
  assert.strictEqual(run('safeColor(123,"#000")'),'#000');
});

// ---- 4. GeoJSON 파싱: 정상 왕복 ----
const good={type:'FeatureCollection', name:'용춘목장', features:[
  {type:'Feature',geometry:{type:'Point',coordinates:[126.3664674,33.4011689]},
   properties:{kind:'gw',radius:350,label:'A',color:'#38b6ff'}},
  {type:'Feature',geometry:{type:'Polygon',coordinates:[[[126.36,33.40],[126.361,33.40],[126.361,33.401],[126.36,33.401],[126.36,33.40]]]},
   properties:{kind:'area',name:'방목지1',desc:'남측',fillColor:'#4cd07d',strokeColor:'#4cd07d',opacity:0.3,labelPos:[126.3605,33.4005]}},
  {type:'Feature',geometry:{type:'Point',coordinates:[126.365,33.402]},
   properties:{kind:'text',text:'급수대',fontSize:16}},
  {type:'Feature',geometry:{type:'LineString',coordinates:[[126.36,33.40],[126.37,33.41]]},
   properties:{kind:'route'}},
]};
t('정상 파일: 지점1·영역1·텍스트1', ()=>{
  const {log,out}=ctx.parseGeoJSON(good);
  assert.strictEqual(out.pts.length,1);
  assert.strictEqual(out.areas.length,1);
  assert.strictEqual(out.texts.length,1);
  assert.strictEqual(log.length,0, '경고 '+JSON.stringify(log));
});
t('반경은 보존(사용자 지정값)', ()=>assert.strictEqual(ctx.parseGeoJSON(good).out.radius,350));

/* ---- 텍스트 사진: pid 가 곧 사진의 주인 열쇠다 ----
   pid 를 흘리면 파일을 다시 열었을 때 사진이 미아가 되고, 그건 화면에
   "사진이 없다"로만 보여서 조용히 유실된다. 왕복을 여기서 잡는다. */
const T1PX='data:image/png;base64,iVBORw0KGgo=';
t('텍스트 pid·사진 왕복', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[126.365,33.402]},
     properties:{kind:'text',text:'배선 주의',fontSize:16,pid:'abc123',
                 photos:[{uri:T1PX,name:'배선.jpg'}]}}]});
  assert.strictEqual(out.texts[0].pid,'abc123');
  assert.strictEqual(out.texts[0].photos.length,1);
  assert.strictEqual(out.texts[0].photos[0].name,'배선.jpg');
});
t('pid 없는 구버전 텍스트는 null (불러올 때 새로 만든다)', ()=>{
  const {out}=ctx.parseGeoJSON(good);
  assert.strictEqual(out.texts[0].pid,null);
  assert.strictEqual(out.texts[0].photos.length,0);
});
/* 하향호환은 사용자가 명시적으로 요구한 성질이다. pid·photos 가 없던 시절의
   파일을 열었을 때 경고가 한 건이라도 뜨면, 멀쩡한 파일을 사용자가 손상된
   것으로 오해한다 — 조용히 깨지는 자리라 여기에 못을 박는다. */
t('구버전 파일(pid·photos 없음)은 경고 0건으로 읽힌다', ()=>{
  const {log,out}=ctx.parseGeoJSON(good);
  assert.strictEqual(log.length,0,'경고: '+JSON.stringify(log));
  assert.strictEqual(out.pts[0].pid,null);
  assert.strictEqual(out.pts[0].photos.length,0);
});
t('텍스트 사진도 지점과 같은 검증을 탄다(2MB 초과 거부)', ()=>{
  const big='data:image/png;base64,'+'A'.repeat(2*1024*1024);
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[126.365,33.402]},
     properties:{kind:'text',text:'x',pid:'p1',photos:[{uri:big}]}}]});
  assert.strictEqual(out.texts[0].photos.length,0);
});

// ---- 지점 이름: 사용자 데이터라 왕복해야 한다 (label·color 는 순서에서 파생) ----
t('지점 이름 보존', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[126.36,33.4]},
     properties:{kind:'gw',label:'A',name:'본관 GW',color:'#38b6ff'}}]});
  assert.strictEqual(out.pts[0].name,'본관 GW');
});
t('이름 없으면 빈 문자열(글자로 대체는 표시 단계에서)', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[126.36,33.4]},properties:{kind:'gw'}}]});
  assert.strictEqual(out.pts[0].name,'');
});
t('지점 이름 40자 초과는 잘림', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[126.36,33.4]},
     properties:{kind:'gw',name:'가'.repeat(500)}}]});
  assert.strictEqual(out.pts[0].name.length,40);
});
t('지점 이름이 문자열이 아니면 무시', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[126.36,33.4]},
     properties:{kind:'gw',name:{evil:1}}}]});
  assert.strictEqual(out.pts[0].name,'');
});
t('지점 이름의 스크립트는 이스케이프된다', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[126.36,33.4]},
     properties:{kind:'gw',name:'<script>alert(1)</script>'}}]});
  // 파싱은 원문을 보존하고, DOM 에 넣을 때 esc() 가 막는다
  assert.ok(run('esc('+JSON.stringify(out.pts[0].name)+')').indexOf('<script')===-1);
});
t('목장명 보존', ()=>assert.strictEqual(ctx.parseGeoJSON(good).out.ranch,'용춘목장'));
t('LineString 은 무시(파생값)', ()=>{
  // 경로가 지점으로 재생성되므로 파싱 결과에 별도 항목이 없어야 한다
  const {out}=ctx.parseGeoJSON(good);
  assert.strictEqual(out.pts.length,1);
});
t('Polygon 닫힘점 제거', ()=>{
  const {out}=ctx.parseGeoJSON(good);
  assert.strictEqual(out.areas[0].path.length,4);   // 링 5점 → 표시용 4점
});

// ---- 4-1. 지점 사진 ----
// 사진은 파일 하나로 오가는 게 절대 조건이라 왕복(export→import)이 깨지면 안 되고,
// 외부 파일의 문자열이 <img src> 로 DOM 에 꽂히는 경로라 검증도 함께 본다.
const JPG='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAg=';
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
// 최상위 let 인 pts 는 샌드박스 프로퍼티가 아니라 컨텍스트 안에서 채워 넣는다
run('function __setPts(a){ pts.length=0; a.forEach(x=>pts.push(x)); }');
const roundTrip = (photoMap) => {
  ctx.__setPts([{lat:33.4011689,lng:126.3664674,name:'A동 GW',pid:'abc123',photos:[]}]);
  const gj=ctx.buildGeoJSON(photoMap);
  return {gj, back:ctx.parseGeoJSON(JSON.parse(JSON.stringify(gj)))};   // 파일을 거친 것과 같게
};

const badPhotos = arr => ctx.parseGeoJSON({type:'FeatureCollection',features:[
  {type:'Feature',geometry:{type:'Point',coordinates:[126.36,33.4]},
   properties:{kind:'gw',photos:arr}}]});
// 현장 파일명 예시 — 목장·구역·지점·MAC·날짜가 이름 자체에 들어 있다
const FNAME='색달목장_방목지_언덕2_D4F98D066F1D_260713.jpg';
t('사진 왕복: 내보내기→불러오기에서 보존', ()=>{
  const {back}=roundTrip({abc123:[{uri:JPG,name:FNAME},{uri:PNG}]});
  const got=back.out.pts[0].photos;         // realm 이 달라 deepStrictEqual 대신 값을 직접 본다
  assert.strictEqual(got.length,2);
  assert.strictEqual(got[0].uri,JPG);
  assert.strictEqual(got[1].uri,PNG);
  assert.strictEqual(back.log.length,0, '경고 '+JSON.stringify(back.log));
});
t('원본 파일명 왕복 (리사이즈로 EXIF 가 사라지므로 유일한 촬영 맥락)', ()=>{
  const {gj,back}=roundTrip({abc123:[{uri:JPG,name:FNAME}]});
  assert.strictEqual(gj.features[0].properties.photos[0].name, FNAME, '내보내기에 이름이 없다');
  assert.strictEqual(back.out.pts[0].photos[0].name, FNAME);
});
t('파일명 없는 사진은 키 자체가 안 나간다', ()=>{
  const {gj,back}=roundTrip({abc123:[{uri:JPG}]});
  assert.strictEqual('name' in gj.features[0].properties.photos[0], false);
  assert.strictEqual(back.out.pts[0].photos[0].name,'');
});
t('파일명 넣기 전 형식(문자열 배열)도 그대로 열린다', ()=>{
  const {out,log}=badPhotos([JPG,PNG]);     // 예전 내보내기 = data URI 문자열만
  assert.strictEqual(out.pts[0].photos.length,2);
  assert.strictEqual(out.pts[0].photos[0].uri,JPG);
  assert.strictEqual(out.pts[0].photos[0].name,'');
  assert.strictEqual(log.length,0, '경고 '+JSON.stringify(log));
});
t('파일명: 경로·제어문자 제거', ()=>{
  const {out}=badPhotos([{uri:JPG,name:'../../etc/pa\u0000ss\u001fwd.jpg'}]);
  assert.strictEqual(out.pts[0].photos[0].name,'passwd.jpg');
});
t('파일명: 120자 초과는 잘림', ()=>{
  const {out}=badPhotos([{uri:JPG,name:'가'.repeat(500)+'.jpg'}]);
  assert.strictEqual(out.pts[0].photos[0].name.length,120);
});
t('파일명이 문자열이 아니면 빈 값', ()=>{
  const {out}=badPhotos([{uri:JPG,name:{evil:1}},{uri:PNG,name:12345}]);
  assert.strictEqual(out.pts[0].photos[0].name,'');
  assert.strictEqual(out.pts[0].photos[1].name,'');
});
t('파일명의 스크립트는 이스케이프된다(팝업 title 로 들어간다)', ()=>{
  const {out}=badPhotos([{uri:JPG,name:'"><img src=x onerror=alert(1)>.jpg'}]);
  const n=out.pts[0].photos[0].name;
  const html=run('esc('+JSON.stringify(n)+')');
  assert.ok(html.indexOf('<img')===-1 && html.indexOf('"')===-1, html);
});
t('uri 없는 객체는 파일명이 있어도 버린다', ()=>{
  const {out,log}=badPhotos([{name:FNAME},{uri:'data:text/html;base64,AA==',name:FNAME}]);
  assert.strictEqual(out.pts[0].photos.length,0);
  assert.strictEqual(log.length,2);
});
t('지점 id(pid) 왕복: 사진을 잇는 열쇠라 살아야 한다', ()=>
  assert.strictEqual(roundTrip({}).back.out.pts[0].pid,'abc123'));
// 자동저장(localStorage)은 origin 당 약 5MB 고정이고 구글맵 판과 나눠 쓴다.
// 여기 사진이 섞이면 QuotaExceededError 로 좌표까지 통째로 유실된다.
t('자동저장 GeoJSON 에는 사진이 안 들어간다', ()=>{
  const {gj}=roundTrip(undefined);          // saveLocal() 이 부르는 방식
  assert.strictEqual(gj.features[0].properties.photos, undefined);
  assert.ok(JSON.stringify(gj).indexOf('base64')<0);
});
t('사진 없는 기존 파일도 그대로 열린다(역호환)', ()=>{
  const {out,log}=ctx.parseGeoJSON(good);   // photos 키 자체가 없는 파일
  assert.strictEqual(out.pts.length,1);
  assert.strictEqual(out.pts[0].photos.length,0);
  assert.strictEqual(log.length,0, '경고 '+JSON.stringify(log));
});
t('사진 모르는 구버전이 새 파일을 열어도 좌표는 산다', ()=>{
  // photos·pid 를 모르는 파서는 properties 를 무시할 뿐이다 — geometry 는 그대로여야 한다
  const {gj}=roundTrip({abc123:[JPG]});
  const c=gj.features[0].geometry.coordinates;
  assert.ok(c[0]===126.3664674 && c[1]===33.4011689, JSON.stringify(c));
});
t('data:text/html 은 거부 + 사유', ()=>{
  const {out,log}=badPhotos(['data:text/html;base64,PHNjcmlwdD4=']);
  assert.strictEqual(out.pts[0].photos.length,0);
  assert.ok(log.length>0, '버렸으면 사유를 남겨야 한다');
});
t('접두어 없는 문자열·javascript: 거부', ()=>{
  const {out}=badPhotos(['iVBORw0KGgo=', 'javascript:alert(1)', '<img src=x onerror=alert(1)>']);
  assert.strictEqual(out.pts[0].photos.length,0);
});
t('data URI 가 아닌 타입(객체·숫자) 거부', ()=>
  assert.strictEqual(badPhotos([{},7,null]).out.pts[0].photos.length,0));
t('photos 가 배열이 아니면 무시 + 사유', ()=>{
  const {out,log}=badPhotos(JPG);           // 단수 string 으로 온 경우
  assert.strictEqual(out.pts[0].photos.length,0);
  assert.ok(log.some(m=>m.includes('배열')));
});
t('한 장 2MB 초과 거부(DoS·용량 방어)', ()=>{
  const big='data:image/jpeg;base64,'+'A'.repeat(3*1024*1024);
  assert.strictEqual(badPhotos([big]).out.pts[0].photos.length,0);
});
t('장수 상한 20장', ()=>{
  const {out,log}=badPhotos(new Array(30).fill(JPG));
  assert.strictEqual(out.pts[0].photos.length,20);
  assert.ok(log.some(m=>m.includes('20장만')));
});
t('base64 문자셋 밖의 글자 거부', ()=>
  assert.strictEqual(badPhotos(['data:image/jpeg;base64,AAAA<>AAAA']).out.pts[0].photos.length,0));
t('okPhotoURI: 정상 3종 통과', ()=>{
  assert.ok(run('okPhotoURI('+JSON.stringify(JPG)+')'));
  assert.ok(run('okPhotoURI('+JSON.stringify(PNG)+')'));
  assert.ok(run('okPhotoURI("data:image/webp;base64,UklGRg==")'));
});

// ---- 5. GeoJSON 파싱: 손상·악의적 입력 (조용히 깨지면 안 된다) ----
t('최상위가 배열이면 중단 + 사유', ()=>{
  const {log,out}=ctx.parseGeoJSON([1,2,3]);
  assert.ok(log.length>0); assert.strictEqual(out.areas.length,0);
});
t('features 없으면 중단 + 사유', ()=>{
  const {log}=ctx.parseGeoJSON({type:'FeatureCollection'});
  assert.ok(log.some(m=>m.includes('features')));
});
t('위경도 뒤바뀐 좌표 거부', ()=>{
  const {log,out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[33.4,126.36]},properties:{kind:'gw'}}]});
  assert.strictEqual(out.pts.length,0, '위도 126 은 통과하면 안 된다');
  assert.ok(log.length>0);
});
t('NaN·문자열 좌표 거부', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:['126.3','33.4']},properties:{}},
    {type:'Feature',geometry:{type:'Point',coordinates:[NaN,33.4]},properties:{}}]});
  assert.strictEqual(out.pts.length,0);
});
t('꼭짓점 3개 미만 폴리곤 건너뜀', ()=>{
  const {log,out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Polygon',coordinates:[[[126.36,33.4],[126.37,33.4]]]},properties:{kind:'area'}}]});
  assert.strictEqual(out.areas.length,0);
  assert.ok(log.some(m=>m.includes('3개 미만')));
});
t('악성 색상은 기본색으로 대체', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Polygon',coordinates:[[[126.36,33.4],[126.37,33.4],[126.37,33.41]]]},
     properties:{kind:'area',fillColor:'url(javascript:alert(1))'}}]});
  assert.strictEqual(out.areas[0].style.fillColor,'#4cd07d');
});
t('반경 이상값 클램프', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[126.36,33.4]},properties:{kind:'gw',radius:1e9}}]});
  assert.strictEqual(out.radius,100000);
});
t('반경 불일치 시 첫 값으로 통일 + 사유', ()=>{
  const {log,out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Point',coordinates:[126.36,33.4]},properties:{kind:'gw',radius:350}},
    {type:'Feature',geometry:{type:'Point',coordinates:[126.37,33.4]},properties:{kind:'gw',radius:500}}]});
  assert.strictEqual(out.radius,350);
  assert.ok(log.some(m=>m.includes('통일')));
});
t('긴 문자열 잘림(DoS 방어)', ()=>{
  const {out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'Polygon',coordinates:[[[126.36,33.4],[126.37,33.4],[126.37,33.41]]]},
     properties:{kind:'area',name:'가'.repeat(5000)}}]});
  assert.strictEqual(out.areas[0].name.length,60);
});
t('알 수 없는 geometry 는 사유 남기고 건너뜀', ()=>{
  const {log}=ctx.parseGeoJSON({type:'FeatureCollection',features:[
    {type:'Feature',geometry:{type:'MultiPolygon',coordinates:[]},properties:{}}]});
  assert.ok(log.some(m=>m.includes('MultiPolygon')));
});
t('null·빈 feature 는 사유 남기고 건너뜀', ()=>{
  const {log,out}=ctx.parseGeoJSON({type:'FeatureCollection',features:[null,{},{type:'Feature'}]});
  assert.strictEqual(out.pts.length,0);
  assert.strictEqual(log.length,3);
});

// ---- 6. 드로잉 좌표 정규화 (SDK 버전 흡수) ----
t('normPath: {x,y} 표기', ()=>{
  const p=ctx.normPath([{x:126.36,y:33.4},{x:126.37,y:33.41}]);
  assert.strictEqual(p.length,2);
  eqPt(p[0],33.4,126.36);
});
t('normPath: LatLng 객체 표기', ()=>{
  const ll=(la,ln)=>({getLat:()=>la,getLng:()=>ln});
  eqPt(ctx.normPath([ll(33.4,126.36)])[0],33.4,126.36);
});
t('normPath: 범위 밖 좌표 제거', ()=>
  assert.strictEqual(ctx.normPath([{x:999,y:999},{x:126.36,y:33.4}]).length,1));
t('normPath: 배열 아니면 빈 배열', ()=>
  assert.strictEqual(ctx.normPath(undefined).length,0));
t('normPath: getData() 폴리곤 points 형태를 그대로 받는다', ()=>{
  // 카카오 공식 샘플이 확정한 구조: data[POLYGON] = [{points:[{x:경도,y:위도}], options}]
  const entry={points:[{x:126.36,y:33.40},{x:126.37,y:33.40},{x:126.37,y:33.41}], options:{}};
  const p=ctx.normPath(entry.points);
  assert.strictEqual(p.length,3);
  eqPt(p[0],33.40,126.36);
  assert.ok(ctx.polyArea(p)>0, '면적이 0이면 위경도가 뒤바뀐 것');
});

// ---- 7. 링 닫힘 ----
t('ringOf: 첫 점과 끝 점이 같아진다', ()=>{
  const r=ctx.ringOf([{lat:33.4,lng:126.36},{lat:33.41,lng:126.36},{lat:33.41,lng:126.37}]);
  assert.strictEqual(r.length,4);
  assert.ok(r[0][0]===r[3][0] && r[0][1]===r[3][1], '링이 닫히지 않았다');
});
t('ringOf: 이미 닫혀 있으면 그대로', ()=>{
  const p=[{lat:33.4,lng:126.36},{lat:33.41,lng:126.36},{lat:33.41,lng:126.37},{lat:33.4,lng:126.36}];
  assert.strictEqual(ctx.ringOf(p).length,4);
});

console.log('\n'+(fail?('실패 '+fail+'건 / '):'')+'통과 '+pass+'건');
process.exit(fail?1:0);
