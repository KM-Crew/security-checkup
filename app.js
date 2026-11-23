/* 이 사이트 보안 몇 점? — 사이트 보안 검사 · (덤) 비밀번호 검사 · 스미싱 퀴즈
   사이트 검사는 공개된 응답만 봅니다(Mozilla HTTP Observatory + Google 공개 DNS). 공격·침투 시도는 하지 않습니다.
   비밀번호·퀴즈 입력은 브라우저 안에서만 처리합니다. */
'use strict';

/* 근거 출처: 화면에는 기관·문서 이름과 주소를 글자로만 보여 줍니다(허브 iframe 안이라 새 창·이동 링크 없음). */
const SOURCES = {
  obs: { short: 'Mozilla Observatory', name: 'HTTP Observatory(웹 보안 헤더 검사)', org: 'Mozilla', url: 'developer.mozilla.org/observatory' },
  gdns: { short: 'Google 공개 DNS', name: 'DNS-over-HTTPS JSON API', org: 'Google Public DNS', url: 'developers.google.com/speed/public-dns' },
  spf: { short: 'RFC 7208', name: 'SPF(보내는 메일 서버 지정)', org: 'IETF', url: 'rfc-editor.org/rfc/rfc7208' },
  dmarc: { short: 'RFC 7489', name: 'DMARC(위조 메일 처리 정책)', org: 'IETF', url: 'rfc-editor.org/rfc/rfc7489' },
  dnssec: { short: 'RFC 4033', name: 'DNSSEC(DNS 응답 서명)', org: 'IETF', url: 'rfc-editor.org/rfc/rfc4033' },
  caa: { short: 'RFC 8659', name: 'CAA(인증서 발급 기관 지정)', org: 'IETF', url: 'rfc-editor.org/rfc/rfc8659' },
  nist: { short: 'NIST', name: 'NIST SP 800-63B 디지털 신원 지침', org: '미국 국립표준기술연구소', url: 'pages.nist.gov/800-63-4' },
  hibp: { short: 'HIBP', name: 'Pwned Passwords(k-익명 범위 조회)', org: 'Have I Been Pwned', url: 'haveibeenpwned.com/Passwords' },
  cisa: { short: 'CISA', name: 'Secure Our World', more: '2단계 인증·비밀번호 관리자·업데이트·피싱 구별', org: '미국 사이버보안·기반시설보안청(CISA)', url: 'cisa.gov/secure-our-world' },
  kisaPhone: { short: 'KISA 보호나라', name: '스마트폰 10대 안전수칙', org: '한국인터넷진흥원(KISA) 보호나라', url: 'boho.or.kr' },
  kisaSmish: { short: 'KISA 보호나라', name: '스미싱 피해 예방 수칙', org: '한국인터넷진흥원(KISA) 보호나라', url: 'boho.or.kr' },
  police: { short: '경찰청', name: '메신저 피싱·사이버 사기 예방', org: '경찰청 사이버수사국', url: 'ecrm.police.go.kr' },
  fss: { short: '금융감독원', name: '보이스피싱 지킴이', org: '금융감독원', url: 'fss.or.kr' }
};
const srcLine = keys => keys.map(k => SOURCES[k]).filter(Boolean).map(x => `${x.short} 「${x.name}」`).join(' · ');

const GRADES = [
  { min: 90, lv: 3, name: '철벽 금고', nick: '금고 씨', line: '해커가 와도 문 앞에서 돌아갈 사이트예요.' },
  { min: 70, lv: 2, name: '튼튼한 자물쇠', nick: '자물쇠 군', line: '꽤 단단해요. 빈틈 몇 개만 막으면 금고급.' },
  { min: 50, lv: 1, name: '삐걱대는 문', nick: '삐걱이', line: '기본은 했지만 빈틈이 보여요.' },
  { min: 0, lv: 0, name: '활짝 열린 대문', nick: '활짝이', line: '기본 보호 장치가 많이 빠져 있어요.' }
];
const GRADE_COLOR = ['#e5484d', '#f5a524', '#2f9e6b', '#2f5cff'];

/* 등급 캐릭터: 자물쇠 얼굴. 등급이 낮을수록 고리가 열리고 표정이 울상. 외부 이미지 없이 SVG로 그림. */
function gradeChar(lv, size = 120) {
  const c = GRADE_COLOR[lv];
  const shackle = [
    'M38 56 V36 a22 22 0 0 1 44 0 V22', // 0: 활짝 열림(한쪽이 빠져 위로)
    'M38 56 V38 a22 22 0 0 1 44 0 V46',  // 1: 덜 잠김(틈)
    'M38 56 V38 a22 22 0 0 1 44 0 V56',  // 2: 잠김
    'M38 56 V38 a22 22 0 0 1 44 0 V56'   // 3: 잠김
  ][lv];
  const eyes = [
    '<path d="M44 76 l8 6 M52 76 l-8 6 M68 76 l8 6 M76 76 l-8 6" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>',
    '<circle cx="48" cy="78" r="4" fill="#222"/><circle cx="72" cy="78" r="4" fill="#222"/><path d="M42 70 l10 3 M78 70 l-10 3" stroke="#222" stroke-width="3" stroke-linecap="round"/>',
    '<circle cx="48" cy="78" r="4.5" fill="#222"/><circle cx="72" cy="78" r="4.5" fill="#222"/>',
    '<path d="M42 80 q6 -8 12 0 M66 80 q6 -8 12 0" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
  ][lv];
  const mouth = [
    '<ellipse cx="60" cy="96" rx="7" ry="6" fill="#222"/>',
    '<path d="M50 96 q5 -4 10 0 t10 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>',
    '<path d="M50 92 q10 9 20 0" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
    '<path d="M47 90 q13 14 26 0 z" fill="#222"/>'
  ][lv];
  const extra = [
    '<path d="M40 86 q-3 8 0 10 q3 -2 0 -10" fill="#5ab0ff"/><path d="M80 86 q-3 8 0 10 q3 -2 0 -10" fill="#5ab0ff"/>',
    '<path d="M88 62 q-5 9 0 12 q5 -3 0 -12" fill="#5ab0ff"/>',
    '<circle cx="40" cy="90" r="5" fill="#ff8fa3" opacity=".6"/><circle cx="80" cy="90" r="5" fill="#ff8fa3" opacity=".6"/>',
    '<circle cx="40" cy="90" r="5" fill="#ff8fa3" opacity=".6"/><circle cx="80" cy="90" r="5" fill="#ff8fa3" opacity=".6"/><path d="M98 20 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z M18 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#f5c400"/>'
  ][lv];
  return `<svg class="gchar lv${lv}" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="${GRADES[3 - lv].nick} 캐릭터">
    <path d="${shackle}" stroke="#8a93a6" stroke-width="9" fill="none" stroke-linecap="round"/>
    <rect x="24" y="54" width="72" height="58" rx="16" fill="${c}"/>
    <rect x="32" y="62" width="56" height="44" rx="12" fill="#fff" opacity=".92"/>
    ${eyes}${mouth}${extra}</svg>`;
}

/* ---------- 사이트 검사 ---------- */
const OBS_URL = 'https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=';
const DNS_URL = 'https://dns.google/resolve?do=true&name=';

/* 입력값(주소·도메인)에서 호스트 이름만 꺼냄. IP·localhost·점 없는 이름은 거절 */
function parseHost(input) {
  let s = String(input || '').trim();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  try {
    const host = new URL(s).hostname.toLowerCase().replace(/\.$/, '');
    if (/^[\d.]+$/.test(host) || host.includes(':')) return null;
    return /^(?=.{4,253}$)([a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/.test(host) ? host : null;
  } catch (e) { return null; }
}

async function fetchJson(url, opt = {}, timeout = 10000) {
  const ctl = window.AbortController ? new AbortController() : null;
  const timer = ctl && setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, Object.assign({ signal: ctl && ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' }, opt));
    return await res.json();
  } finally { if (timer) clearTimeout(timer); }
}

/* Observatory 검사 항목 → 쉬운 이름·하는 일·고치는 법 */
const OBS_TESTS = {
  'redirection': ['HTTP → HTTPS 전환', 'http://로 들어와도 바로 암호화된 https://로 옮겨 줘요.', 'http 요청을 같은 주소의 https로 301 전환하세요.'],
  'strict-transport-security': ['HTTPS 강제(HSTS)', '브라우저가 이 사이트를 항상 암호화 연결로만 열게 해요.', 'Strict-Transport-Security 헤더를 max-age=31536000 이상으로 보내세요.'],
  'content-security-policy': ['콘텐츠 보안 정책(CSP)', '허락한 곳의 스크립트만 실행되게 해서 악성 코드 끼워 넣기(XSS)를 막아요.', "Content-Security-Policy 헤더를 default-src 'self'부터 시작해 보내세요."],
  'x-frame-options': ['클릭 가로채기 방지', '다른 사이트가 이 화면을 몰래 겹쳐 띄워 클릭을 훔치는 걸 막아요.', "CSP에 frame-ancestors 'self'를 넣거나 X-Frame-Options: DENY를 보내세요."],
  'cookies': ['쿠키 보호', '로그인 쿠키가 도청되거나 스크립트로 빼돌려지지 않게 해요.', '쿠키에 Secure·HttpOnly·SameSite 속성을 붙이세요.'],
  'x-content-type-options': ['파일 형식 위장 방지', '브라우저가 파일 종류를 멋대로 추측해 실행하지 않게 해요.', 'X-Content-Type-Options: nosniff를 보내세요.'],
  'referrer-policy': ['방문 경로 노출 제한', '다른 사이트로 넘어갈 때 지금 주소(검색어 등)가 새지 않게 해요.', 'Referrer-Policy: strict-origin-when-cross-origin을 보내세요.'],
  'subresource-integrity': ['외부 스크립트 변조 확인(SRI)', '외부에서 불러온 스크립트가 바꿔치기되지 않았는지 확인해요.', '외부 script 태그에 integrity 속성을 붙이세요.'],
  'cross-origin-resource-sharing': ['다른 사이트의 읽기 제한(CORS)', '다른 사이트가 이 사이트 내용을 마음대로 읽어 가지 못하게 해요.', 'Access-Control-Allow-Origin: *는 공개 자료에만 쓰세요.'],
  'cross-origin-resource-policy': ['자원 가져가기 제한(CORP)', '다른 사이트가 이 사이트의 파일을 몰래 끌어다 쓰는 걸 줄여요.', 'Cross-Origin-Resource-Policy: same-origin을 보내세요.'],
  'cross-origin-opener-policy': ['창 분리(COOP)', '이 사이트가 연 창·연 사이트와 서로 엿보지 못하게 떼어 놓아요.', 'Cross-Origin-Opener-Policy: same-origin을 보내세요.'],
  'cross-origin-embedder-policy': ['외부 자원 허락제(COEP)', '허락받은 외부 자원만 불러오게 해요.', 'Cross-Origin-Embedder-Policy: require-corp를 검토하세요.']
};
function obsItems(tests) {
  return Object.entries(tests || {}).map(([k, t]) => {
    const d = OBS_TESTS[k] || [k, '', ''];
    const status = t.pass == null ? 'na' : t.pass ? 'ok' : (t.score_modifier <= -20 ? 'bad' : 'warn');
    return { name: d[0], desc: d[1], fix: d[2], status };
  });
}

const txtOf = r => ((r && r.Answer) || []).filter(a => a.type === 16).map(a => String(a.data).replace(/"\s*"/g, '').replace(/"/g, '').trim());
/* DNS 항목 4개. 점수 합계 100 = SPF 25 + DMARC 35 + DNSSEC 20 + CAA 20
   ponytail: 'www.'만 떼고 그 이름 그대로 봄(상위 도메인 상속·공개 접미사 목록 미반영). 하위 도메인 정확도가 문제 되면 상위로 거슬러 조회 */
async function checkDns(host) {
  const d = host.replace(/^www\./, '');
  const q = (name, type) => fetchJson(DNS_URL + encodeURIComponent(name) + '&type=' + type, {}, 8000);
  const [txt, dm, a, caa] = await Promise.all([q(d, 'TXT'), q('_dmarc.' + d, 'TXT'), q(d, 'A'), q(d, 'CAA')]);
  const items = [];
  const spf = txtOf(txt).find(t => /^v=spf1\b/i.test(t));
  items.push(!spf ? { key: 'spf', pts: 0, status: 'bad', detail: 'SPF 기록이 없어요' }
    : /(^|\s)\+?all\b/i.test(spf) ? { key: 'spf', pts: 0, status: 'bad', detail: '모든 서버를 허용(+all)하고 있어요' }
    : /\?all\b/i.test(spf) ? { key: 'spf', pts: 10, status: 'warn', detail: '판단 보류(?all)로 되어 있어요' }
    : { key: 'spf', pts: 25, status: 'ok', detail: '보내는 서버를 지정해 두었어요' });
  const dmarc = txtOf(dm).find(t => /^v=DMARC1\b/i.test(t));
  const p = dmarc && ((dmarc.match(/(?:^|;)\s*p\s*=\s*(\w+)/i) || [])[1] || '').toLowerCase();
  items.push(!dmarc ? { key: 'dmarc', pts: 0, status: 'bad', detail: 'DMARC 기록이 없어요' }
    : p === 'reject' || p === 'quarantine' ? { key: 'dmarc', pts: 35, status: 'ok', detail: `위조 메일을 ${p === 'reject' ? '거절' : '스팸함 격리'}하게 해 두었어요` }
    : { key: 'dmarc', pts: 15, status: 'warn', detail: '기록은 있지만 위조 메일을 그냥 통과시켜요(p=none)' });
  items.push(a && a.AD ? { key: 'dnssec', pts: 20, status: 'ok', detail: 'DNS 응답에 서명이 있어요' } : { key: 'dnssec', pts: 0, status: 'warn', detail: 'DNS 응답 서명이 없어요' });
  items.push(((caa && caa.Answer) || []).some(x => x.type === 257) ? { key: 'caa', pts: 20, status: 'ok', detail: '인증서 발급 기관을 정해 두었어요' } : { key: 'caa', pts: 0, status: 'warn', detail: '아무 기관이나 인증서를 발급할 수 있어요' });
  return items.map(x => Object.assign(x, DNS_INFO[x.key]));
}
const DNS_INFO = {
  spf: { group: 'mail', name: '보내는 메일 서버 지정(SPF)', desc: '이 도메인 이름으로 메일을 보낼 수 있는 서버를 정해 둬요.', fix: 'TXT 기록에 v=spf1 … -all 을 넣으세요. 메일을 안 쓰면 v=spf1 -all.', src: 'spf' },
  dmarc: { group: 'mail', name: '위조 메일 차단 정책(DMARC)', desc: '이 사이트를 사칭한 피싱 메일을 받는 쪽에서 걸러 내게 해요.', fix: '_dmarc TXT 기록에 v=DMARC1; p=quarantine(또는 reject)을 넣으세요.', src: 'dmarc' },
  dnssec: { group: 'domain', name: 'DNS 위조 방지(DNSSEC)', desc: '가짜 DNS 응답으로 엉뚱한 서버에 접속되는 걸 막아요.', fix: '도메인 등록 업체·DNS 업체 설정에서 DNSSEC을 켜세요.', src: 'dnssec' },
  caa: { group: 'domain', name: '인증서 발급 기관 지정(CAA)', desc: '정해 둔 기관만 이 도메인의 HTTPS 인증서를 발급할 수 있어요.', fix: 'CAA 기록에 쓰는 인증 기관(예: 0 issue "letsencrypt.org")을 넣으세요.', src: 'caa' }
};

const OBS_ERR = {
  'invalid-hostname-lookup': '이 주소를 찾을 수 없어요. 철자를 확인해 주세요.',
  'invalid-site': '검사할 수 없는 주소예요. 예: example.com',
  'site-down': '사이트가 응답하지 않아요. 잠시 뒤 다시 해 보세요.'
};
const STATUS = { bad: ['❌', '위험'], warn: ['⚠️', '주의'], ok: ['✅', '통과'], na: ['➖', '해당 없음'] };
const ORDER = { bad: 0, warn: 1, ok: 2, na: 3 };

/* 점수: 웹 보안(Observatory 점수, 100 상한) 70% + DNS 30%. DNS 조회가 실패하면 웹 보안만 */
function totalScore(obsScore, dnsItems) {
  const web = clamp(Math.round(obsScore), 0, 100);
  if (!dnsItems) return { total: web, web, mail: null, domain: null };
  const sum = g => dnsItems.filter(x => x.group === g).reduce((s, x) => s + x.pts, 0);
  const dns = sum('mail') + sum('domain');
  return { total: Math.round(web * 0.7 + dns * 0.3), web, mail: Math.round(sum('mail') / 60 * 100), domain: Math.round(sum('domain') / 40 * 100) };
}

/* ---------- 랜딩 ---------- */
const scanForm = (value = '') => `
  <form class="scanform" id="scanform" novalidate>
    <input id="site" type="url" inputmode="url" autocomplete="url" autocapitalize="off" spellcheck="false" placeholder="example.com" value="${esc(value)}" aria-label="검사할 사이트 주소">
    <button class="btn primary" type="submit">검사</button>
  </form>
  <p class="formerr small hidden" id="formerr" role="alert">사이트 주소를 확인해 주세요. 예: example.com</p>`;
function bindForm(root) {
  $('#scanform', root).onsubmit = e => {
    e.preventDefault();
    const host = parseHost($('#site', root).value);
    if (!host) { $('#formerr', root).classList.remove('hidden'); $('#site', root).focus(); return; }
    Router.go('/scan?host=' + encodeURIComponent(host));
  };
}

Router.on('/', root => {
  const wrap = h('<div class="split s73 center"></div>');
  root.append(wrap);
  wrap.append(h(`
    <section class="hero">
      <div class="lock">🔒</div>
      <h1>이 사이트,<br>보안 몇 점?</h1>
      <p class="muted">주소만 넣으면 HTTPS·보안 헤더·메일 위조 방지까지 16가지를 살펴보고 점수를 매겨요.</p>
      ${scanForm()}
      <p class="badge">공개된 응답만 봐요 · 공격이나 침투 시도는 하지 않아요</p>
      <div class="feats"><span class="chip">🌐 보안 헤더 12종</span><span class="chip">✉️ 메일 위조 방지</span><span class="chip">🛠️ 고치는 법까지</span></div>
    </section>`));
  wrap.append(h(`
    <section class="tools">
      <b class="muted small">덤으로 해 보기</b>
      <a class="tool card" href="#/password"><b>🔑 비밀번호 검사</b><span class="muted">뚫리는 데 걸리는 시간·유출 이력</span></a>
      <a class="tool card" href="#/phishing"><b>📩 스미싱 퀴즈</b><span class="muted">진짜 문자일까, 가짜일까?</span></a>
    </section>`));
  root.append(h(`
    <section class="chars card">
      <b>이 사이트는 어떤 자물쇠일까?</b>
      <div class="charrow">${GRADES.map(g => `<div class="charcell">${gradeChar(g.lv, 72)}<span class="small">${g.name}</span></div>`).join('')}</div>
    </section>`));
  root.append(h(`<p class="center small"><a href="#/about" class="muted">어떻게 검사하나요? · 근거 출처</a></p>`));
  bindForm(root);
});

/* ---------- 검사 중 → 결과 ---------- */
Router.on('/scan', (root, params) => {
  const host = parseHost(params.get('host'));
  if (!host) { Router.go('/'); return; }
  let alive = true;
  const box = h(`
    <section class="narrow stack scanning" aria-live="polite">
      <h1 class="center">🔍 ${esc(host)}</h1>
      <ol class="steps">
        <li id="st-web"><i></i>HTTPS·보안 헤더 12종 확인<span class="muted small"> · Mozilla Observatory</span></li>
        <li id="st-dns"><i></i>메일 위조 방지·도메인 보호 확인<span class="muted small"> · Google 공개 DNS</span></li>
      </ol>
      <p class="muted small center">보통 5~20초 걸려요. 공개된 응답만 확인해요.</p>
    </section>`);
  root.append(box);
  const done = (id, ok) => { const li = $('#' + id, box); if (li) li.className = ok ? 'done' : 'fail'; };
  const obsP = fetchJson(OBS_URL + encodeURIComponent(host), { method: 'POST' }, 45000)
    .then(r => { if (!r || r.error || !r.scan || r.scan.error) throw Object.assign(new Error('obs'), { code: (r && (r.error || (r.scan && r.scan.error))) || 'unknown' }); return r; });
  const dnsP = checkDns(host).catch(() => null);
  obsP.then(() => alive && done('st-web', true), () => alive && done('st-web', false));
  dnsP.then(r => alive && done('st-dns', !!r));
  Promise.allSettled([obsP, dnsP]).then(([o, d]) => {
    if (!alive) return;
    if (o.status === 'rejected') return renderFail(root, host, o.reason);
    renderResult(root, host, o.value, d.value);
  });
  return () => { alive = false; };
});

function renderFail(root, host, err) {
  const code = err && err.code;
  root.innerHTML = '';
  root.append(h(`
    <section class="narrow stack center">
      <div class="hero"><div class="lock">🤔</div></div>
      <h2>${esc(host)} 검사를 못 했어요</h2>
      <p class="muted">${esc(OBS_ERR[code] || '검사 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 해 보세요.')}</p>
      ${scanForm(host)}
    </section>`));
  bindForm(root);
  Sfx.play('bad');
}

function itemRow(x) {
  const [icon, label] = STATUS[x.status];
  return `<li class="item s-${x.status}"><span class="ico" aria-hidden="true">${icon}</span><div class="grow">
    <div class="row"><b>${esc(x.name)}</b><span class="grow"></span><span class="tag s-${x.status}">${label}</span></div>
    <p class="small muted">${esc(x.detail ? x.detail + ' · ' + x.desc : x.desc)}</p>
    ${(x.status === 'bad' || x.status === 'warn') && x.fix ? `<p class="small fix">고치는 법: ${esc(x.fix)}</p>` : ''}
  </div></li>`;
}
const sortItems = arr => arr.slice().sort((a, b) => ORDER[a.status] - ORDER[b.status]);

/* 결과 이미지 칸 하나의 항목(한 줄 + 위험·주의면 고치는 법) */
const repRow = x => `<li class="ri s-${x.status}"><span class="ico">${STATUS[x.status][0]}</span><div class="grow"><div class="rh"><b>${esc(x.name)}</b><span class="tag s-${x.status}">${STATUS[x.status][1]}</span></div>
  ${(x.status === 'bad' || x.status === 'warn') && x.fix ? `<p>→ ${esc(x.fix)}</p>` : ''}</div></li>`;
const repList = items => `<ul class="rlist">${sortItems(items).map(repRow).join('')}</ul>`;
/* 16:9 결과 이미지: 위 [점수 카드 | 먼저 고칠 것 | 보안 헤더①] / 아래 [보안 헤더② | 메일·도메인 | 검사 방법] */
function buildReport({ host, card, todo, web, dnsItems, n, date }) {
  const w = sortItems(web), half = Math.ceil(w.length / 2);
  const cell = (title, body, cls = '') => `<section class="rc ${cls}">${title ? `<h3>${title}</h3>` : ''}<div class="rb">${body}</div></section>`;
  const dns = g => (dnsItems || []).filter(x => x.group === g);
  return h(`<div class="report16" id="report">
    ${cell('', `<div class="result">${card}</div>`, 'rc-card')}
    ${cell('🛠️ 먼저 고칠 것', (todo.length ? `<ol class="rtodo">${todo.map(x => `<li><b>${esc(x.name)}</b><p>${esc(x.fix)}</p></li>`).join('')}</ol>` : '<p class="ok">눈에 띄는 빈틈이 없어요. 훌륭해요!</p>')
      + `<p class="rsum">검사 ${n('bad') + n('warn') + n('ok') + n('na')}개 중 <b class="c-bad">위험 ${n('bad')}</b> · <b class="c-warn">주의 ${n('warn')}</b> · <b class="c-ok">통과 ${n('ok')}</b> · 해당 없음 ${n('na')}</p>`)}
    ${cell('🌐 HTTPS·보안 헤더', repList(w.slice(0, half)))}
    ${cell('🌐 HTTPS·보안 헤더 (이어서)', repList(w.slice(half)))}
    ${cell('✉️ 메일 위조 방지 · 🏷️ 도메인 보호', dnsItems ? repList(dns('mail')) + repList(dns('domain')) : '<p>Google 공개 DNS에 연결하지 못해 이 부분은 건너뛰었어요. 점수는 웹 보안만으로 매겼어요.</p>')}
    ${cell('🔍 검사 방법', `<p><b>${esc(host)}</b>의 공개된 응답만 확인했어요. 공격·침투 시도는 하지 않아요.</p>
      <p>점수 = 웹 보안 70% + 메일·도메인(DNS) 30%</p>
      <p class="rsrc">근거: Mozilla HTTP Observatory · Google 공개 DNS · RFC 7208(SPF) · RFC 7489(DMARC) · RFC 4033(DNSSEC) · RFC 8659(CAA)</p>
      <p class="rsrc">점수가 높아도 해킹이 불가능하다는 뜻은 아니고, 로그인·게시판 같은 프로그램 자체의 취약점은 확인하지 않아요.</p>
      <div class="rbrand">🔒 이 사이트 보안 몇 점?<span>km-crew.github.io/security-checkup · ${date} 검사</span></div>`)}
  </div>`);
}
/* 칸 안이 넘치면 그 칸 글자를 조금씩 줄임(최소 11px). 넘친 칸 수를 돌려줌 */
function fitCells(rep) {
  let over = 0;
  $$('.rb', rep).forEach(b => {
    let fs = 17;
    while (b.scrollHeight > b.clientHeight + 1 && fs > 11) { fs -= .5; b.style.fontSize = fs + 'px'; }
    if (b.scrollHeight > b.clientHeight + 1) over++;
  });
  return over;
}

function renderResult(root, host, obs, dnsItems) {
  const s = totalScore(obs.scan.score, dnsItems);
  const g = GRADES.find(x => s.total >= x.min);
  const web = obsItems(obs.tests);
  const all = web.concat(dnsItems || []);
  const todo = sortItems(all).filter(x => x.status === 'bad' || x.status === 'warn').slice(0, 3);
  const bars = [['웹 보안', s.web], ['메일 위조 방지', s.mail], ['도메인 보호', s.domain]].filter(b => b[1] != null);
  const group = (title, items, src) => items.length ? `<h3>${title}</h3><ul class="items">${sortItems(items).map(itemRow).join('')}</ul><p class="src small">근거: ${esc(srcLine(src))}</p>` : '';
  const date = new Date().toLocaleDateString('ko-KR');
  const n = st => all.filter(x => x.status === st).length;
  const card = `
        <div class="face">${gradeChar(g.lv)}</div>
        <div class="host">${esc(host)}</div>
        <div class="grade" style="color:${GRADE_COLOR[g.lv]}">${g.name}</div>
        <div class="score">${s.total}<small>점</small></div>
        <p>${g.line}</p>
        <div class="cats">${bars.map(([n, v]) => `<div class="catrow"><span>${n}</span><div class="bar grow"><i style="width:${v}%"></i></div><b>${v}</b></div>`).join('')}</div>
        <div class="counts"><span class="tag s-bad">위험 ${n('bad')}</span><span class="tag s-warn">주의 ${n('warn')}</span><span class="tag s-ok">통과 ${n('ok')}</span></div>
        <div class="stamp">이 사이트 보안 몇 점? · Observatory ${esc(obs.scan.grade || '-')} · ${date}</div>`;
  const details = `
        ${todo.length ? `<h2>먼저 고칠 것</h2><ol class="todo">${todo.map(x => `<li><b>${esc(x.name)}</b> — ${esc(x.fix)}</li>`).join('')}</ol>` : '<p class="ok">눈에 띄는 빈틈이 없어요. 훌륭해요!</p>'}
        ${group('🌐 HTTPS·보안 헤더', web, ['obs'])}
        ${dnsItems ? group('✉️ 메일 위조 방지', dnsItems.filter(x => x.group === 'mail'), ['spf', 'dmarc', 'gdns'])
          + group('🏷️ 도메인 보호', dnsItems.filter(x => x.group === 'domain'), ['dnssec', 'caa', 'gdns'])
          : '<div class="leakres warn"><b>DNS 확인은 건너뛰었어요</b><p>Google 공개 DNS에 연결하지 못해 웹 보안 점수만으로 매겼어요.</p></div>'}
        <p class="muted small">공개된 응답만 본 결과예요. 점수가 높아도 해킹이 불가능하다는 뜻은 아니고, 프로그램 자체의 취약점(로그인·게시판 등)은 확인하지 않아요.</p>`;
  root.innerHTML = '';
  root.append(h(`
    <section class="split">
      <div class="sticky"><div class="result card" id="card">${card}</div></div>
      <div class="stack">
        ${details}
        <div class="row"><button class="btn primary grow" id="save">결과 이미지 저장</button><button class="btn grow" id="share">공유하기</button></div>
        <div class="card stack"><b>다른 사이트도 검사하기</b>${scanForm()}</div>
      </div>
    </section>`));
  bindForm(root);
  Sfx.play(g.lv >= 2 ? 'ok' : 'bad');
  // 저장 이미지: 16:9 한 장(1920×1080, 1.5배 저장), 3×2 칸. 저장할 때만 화면 밖에 만들었다가 지움
  $('#save').onclick = async () => {
    const rep = buildReport({ host, card, todo, web, dnsItems, n, date });
    document.body.append(rep);
    try { fitCells(rep); await saveImage(rep, `security-${host}.png`, 1.5); } finally { rep.remove(); }
  };
  $('#share').onclick = () => shareText('이 사이트 보안 몇 점?', `${host} 보안 등급은 "${g.name}" (${s.total}점)! 네 사이트도 검사해 봐`, location.href);
}

/* ---------- (덤) 비밀번호 ---------- */
const COMMON_PW = ['123456', '12345678', '123456789', '1234', '12345', '1234567890', 'password', 'qwerty', '111111', '000000',
  'abc123', 'iloveyou', '1q2w3e4r', '1q2w3e4r!', 'qwer1234', 'a123456', 'asdf1234', 'admin', 'welcome', 'letmein',
  'p@ssw0rd', 'password1', 'qwerty123', 'zxcvbnm', 'sunshine', 'dragon', 'monkey', 'football', 'iloveyou1', 'q1w2e3r4'];

function analyzePassword(pw) {
  if (!pw) return null;
  const lower = pw.toLowerCase();
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  let bits = pw.length * Math.log2(Math.max(pool, 2));
  const issues = [];
  if (COMMON_PW.includes(lower)) { bits = Math.min(bits, 8); issues.push('가장 흔한 비밀번호 목록에 있어요'); }
  if (/(.)\1{2,}/.test(pw)) { bits -= 10; issues.push('같은 글자가 반복돼요'); }
  const seqs = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1q2w3e4r5t'];
  if (seqs.some(s => { for (let k = 0; k + 4 <= s.length; k++) if (lower.includes(s.slice(k, k + 4))) return true; return false; })) {
    bits -= 12; issues.push('키보드 순서나 연속 숫자가 들어 있어요');
  }
  if (/(19|20)\d{2}/.test(pw) || /\d{6}/.test(pw)) { bits -= 6; issues.push('생일·연도처럼 보이는 숫자가 있어요'); }
  if (pw.length < 10) issues.push('10자 이상이면 훨씬 단단해져요');
  if (pool <= 36) issues.push('길이를 늘리는 게 가장 효과적이에요. 글자 종류를 섞으면 조금 더 단단해져요');
  bits = Math.max(bits, 1);
  const seconds = Math.pow(2, bits) / 1e10 / 2; // 초당 100억 번 시도, 평균 절반에서 성공
  const level = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  return { bits, seconds, level, issues };
}
function humanTime(s) {
  if (s < 1) return '1초도 안 걸려요';
  const units = [['년', 31536000], ['일', 86400], ['시간', 3600], ['분', 60], ['초', 1]];
  if (s > 31536000 * 1e6) return '100만 년 이상';
  for (const [u, v] of units) if (s >= v) {
    const n = s / v;
    return (n >= 10000 ? Math.round(n / 10000) + '만 ' : Math.round(n) + '') + u;
  }
  return '1초';
}
const PW_LABEL = ['매우 약함', '약함', '보통', '강함', '매우 강함'];
const PW_COLOR = ['#e5484d', '#f76b15', '#f5a524', '#2f9e6b', '#1e7f5c'];

/* 유출 확인(Have I Been Pwned, k-익명): 비밀번호는 보내지 않고 SHA-1 해시 앞 5자리만 보낸 뒤 이 기기에서 비교 */
const HIBP_URL = 'https://api.pwnedpasswords.com/range/';
async function sha1Hex(str) {
  if (!(window.crypto && crypto.subtle)) throw new Error('nosubtle');
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}
function findSuffix(body, suffix) {
  for (const line of String(body).split(/\r?\n/)) {
    const [suf, n] = line.trim().split(':');
    if (suf && suf.toUpperCase() === suffix) return parseInt(n, 10) || 0;
  }
  return 0;
}
async function checkPwned(pw, timeout = 8000) {
  const hash = await sha1Hex(pw);
  const prefix = hash.slice(0, 5), suffix = hash.slice(5);
  const ctl = window.AbortController ? new AbortController() : null;
  const timer = ctl && setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(HIBP_URL + prefix, { signal: ctl && ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!res.ok) throw new Error('http ' + res.status);
    const body = await res.text();
    if (!/^[0-9A-F]{35}:\d+/im.test(body)) throw new Error('bad body');
    return { prefix, count: findSuffix(body, suffix) };
  } finally { if (timer) clearTimeout(timer); }
}
const fmtN = n => n.toLocaleString('ko-KR');

Router.on('/password', root => {
  root.append(h(`
    <section class="split">
      <div class="stack">
      <h1>비밀번호 검사</h1>
      <p class="muted">실제 비밀번호 대신 비슷한 형태로 넣어 봐도 돼요.</p>
      <div class="pwbox">
        <input id="pw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="비밀번호를 입력해 보세요" aria-label="검사할 비밀번호">
        <button class="btn ghost" id="eye" aria-label="보기">보기</button>
      </div>
      <p class="badge">🔒 강도 검사는 이 기기 안에서만 해요. 비밀번호는 전송·저장되지 않아요</p>
      </div>
      <div class="stack pw-right">
      <div class="card" id="out"><p class="muted">입력하면 바로 분석해요.</p></div>
      <div class="card leakcard stack">
        <b>🕵️ 유출된 적 있는 비밀번호일까?</b>
        <p class="small muted">해킹 사고로 새어 나간 비밀번호 수억 개와 비교해요. 비밀번호는 보내지 않고, <b>해시(암호화 지문)의 앞 5자리</b>만 보내 비슷한 후보 목록을 받아 이 기기에서 맞춰 봐요.</p>
        <button class="btn block" id="leakbtn" disabled>유출 이력 확인하기</button>
        <div id="leak" aria-live="polite"></div>
      </div>
      <a class="btn block" href="#/">🔒 사이트 보안 검사하러 가기</a>
      <p class="src small">근거: ${esc(srcLine(['nist', 'hibp']))}</p>
      </div>
    </section>`));
  const pw = $('#pw'), out = $('#out'), leak = $('#leak'), leakBtn = $('#leakbtn');
  let pwned = null, seq = 0;
  $('#eye').onclick = () => { pw.type = pw.type === 'password' ? 'text' : 'password'; $('#eye').textContent = pw.type === 'password' ? '보기' : '숨기기'; $('#eye').setAttribute('aria-label', $('#eye').textContent); };
  function render() {
    const r = analyzePassword(pw.value);
    leakBtn.disabled = !r;
    if (!r) { out.innerHTML = '<p class="muted">입력하면 바로 분석해요.</p>'; return; }
    if (pwned > 0) { r.level = 0; r.seconds = 0; r.issues.unshift(`실제 유출 목록에 ${fmtN(pwned)}번 나온 비밀번호예요. 해커는 이 목록부터 대입해요`); }
    out.innerHTML = `
      <div class="row"><b style="color:${PW_COLOR[r.level]}">${PW_LABEL[r.level]}</b><span class="grow"></span><span class="muted small">${pw.value.length}자</span></div>
      <div class="segs">${[0, 1, 2, 3, 4].map(k => `<i style="background:${k <= r.level ? PW_COLOR[r.level] : 'var(--line)'}"></i>`).join('')}</div>
      <p>해커 PC가 뚫는 데 걸리는 시간: <b>${pwned > 0 ? '사실상 바로' : humanTime(r.seconds)}</b></p>
      ${r.issues.length ? `<ul class="issues">${r.issues.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="ok">좋아요! 눈에 띄는 약점이 없어요.</p>'}
      <p class="muted small">초당 100억 번 대입하는 공격을 가정한 추정치예요.${pwned === 0 ? ' 유출 목록에도 없어요.' : ''}</p>`;
  }
  pw.oninput = () => { seq++; pwned = null; leak.innerHTML = ''; render(); };
  leakBtn.onclick = async () => {
    const value = pw.value, my = ++seq;
    if (!value) return;
    leakBtn.disabled = true;
    leak.innerHTML = '<p class="small muted">확인하는 중…</p>';
    try {
      const r = await checkPwned(value);
      if (my !== seq) return;
      pwned = r.count;
      leak.innerHTML = r.count > 0
        ? `<div class="leakres bad"><b>앗, 유출된 적 있어요!</b><p>공개된 유출 목록에 <b>${fmtN(r.count)}번</b> 나와요. 이 비밀번호를 쓰는 곳이 있다면 지금 바꾸세요.</p></div>`
        : `<div class="leakres good"><b>유출 목록에 없어요 👍</b><p>알려진 유출 비밀번호와 겹치지 않아요. 그래도 사이트마다 다르게 쓰세요.</p></div>`;
      leak.insertAdjacentHTML('beforeend', `<p class="small muted sent">보낸 값: <code>${r.prefix}</code> (해시 앞 5자리) · 비밀번호는 보내지 않았어요</p>`);
      Sfx.play(r.count > 0 ? 'bad' : 'ok');
      render();
    } catch (e) {
      if (my !== seq) return;
      leak.innerHTML = `<div class="leakres warn"><b>지금은 유출 확인 서버에 연결하지 못했어요</b><p>인터넷 연결을 확인하고 다시 눌러 보세요. 강도 검사는 그대로 쓸 수 있어요.</p></div>`;
    } finally { if (my === seq) leakBtn.disabled = !pw.value; }
  };
  return () => { seq++; pw.value = ''; };
});

/* ---------- (덤) 스미싱 퀴즈 12문제. 기관·회사 이름은 모두 지어낸 이름 ---------- */
const QUIZ = [
  { msg: '[국외발신]\n고객님 해외결제 980,000원 승인완료.\n본인 아닐 시 즉시 문의 070-1234-5678', fake: true,
    mark: ['[국외발신]', '980,000원', '070-1234-5678'], src: ['fss'],
    why: ['"국외발신" + 큰 금액으로 겁을 줘서 전화를 걸게 만드는 전형적인 수법', '카드사는 문의 번호로 070 번호를 쓰지 않아요', '카드사 앱에서 결제 내역을 직접 확인하세요'] },
  { msg: '[한빛택배] 주소지 불일치로 배송이 보류되었습니다. 주소 수정: http://bit.ly/3xYz9q', fake: true,
    mark: ['주소지 불일치', 'http://bit.ly/3xYz9q'], src: ['kisaSmish'],
    why: ['단축 주소(bit.ly 등)로 진짜 목적지를 숨김', '택배사는 주소 수정을 문자 링크로 요구하지 않아요', '배송 조회는 택배사 공식 앱에서'] },
  { msg: '엄마 나 폰 액정 깨져서 임시폰이야ㅠ\n급한데 문화상품권 좀 사서 번호 보내줄 수 있어?', fake: true,
    mark: ['임시폰', '문화상품권', '번호 보내줄'], src: ['police'],
    why: ['가족 사칭 + "임시폰" + 상품권 요구는 메신저 피싱의 3종 세트', '반드시 원래 번호로 전화해서 확인하세요'] },
  { msg: '[하늘카드] 11월 이용대금 명세서가 발송되었습니다. 자세한 내용은 하늘카드 앱에서 확인하세요.', fake: false,
    mark: ['하늘카드 앱에서 확인'], src: ['kisaSmish'],
    why: ['링크 없이 공식 앱 확인만 안내', '금액·개인정보 입력을 요구하지 않음', '그래도 의심되면 앱을 직접 열어 보세요'] },
  { msg: '[별빛은행] 인증번호 [482913]\n타인에게 절대 알려주지 마세요.', fake: false,
    mark: ['타인에게 절대 알려주지 마세요'], src: ['fss'],
    why: ['링크가 없는 일반적인 인증번호 문자', '단, 내가 요청하지 않았는데 왔다면 누군가 내 계정으로 시도 중일 수 있어요 → 비밀번호 변경'] },
  { msg: '[Web발신]\n귀하의 개인정보가 유출되어 계정이 24시간 내 정지됩니다.\n즉시 본인인증: http://safe-check.kr-auth.top', fake: true,
    mark: ['24시간 내 정지', 'http://safe-check.kr-auth.top'], src: ['kisaSmish', 'cisa'],
    why: ['"24시간 내 정지"처럼 시간 압박을 주는 문구', '.top 같은 낯선 도메인', '공식 기관은 문자 링크로 본인인증을 요구하지 않아요'] },
  { msg: '모바일 청첩장 보내드립니다♡\n꼭 와주세요!\nhttp://wedding-card.app/invite.apk', fake: true,
    mark: ['invite.apk'], src: ['kisaPhone', 'kisaSmish'],
    why: ['.apk = 앱 설치 파일. 청첩장은 설치 파일일 이유가 없어요', '설치하면 문자·연락처가 털리는 악성 앱일 수 있음'] },
  { msg: '[동네약국] 처방약 조제가 완료되었습니다. 방문 시 신분증을 지참해 주세요.', fake: false,
    mark: ['방문 시'], src: ['kisaSmish'],
    why: ['링크·전화 유도·금전 요구가 없는 단순 안내', '이런 문자는 대체로 안전해요'] },
  { msg: '[Web발신]\n[국민생활지원센터] 고물가 지원금 30만원 지급 대상자로 선정되셨습니다.\n오늘 18시 신청 마감 ▶ http://gov-support24.cc/apply', fake: true,
    mark: ['지급 대상자로 선정', '오늘 18시 신청 마감', 'http://gov-support24.cc/apply'], src: ['kisaSmish'],
    why: ['정부 지원금은 문자 속 링크로 신청받지 않아요. 정부 누리집을 직접 검색해 들어가세요', '"오늘 마감"으로 서두르게 만드는 문구', '.cc처럼 정부와 상관없는 도메인'] },
  { msg: '[미래통신] 11월 이용요금 52,300원이 25일 등록하신 계좌에서 자동이체될 예정입니다. 상세 내역은 미래통신 앱에서 확인하세요.', fake: false,
    mark: ['미래통신 앱에서 확인'], src: ['kisaSmish'],
    why: ['링크·전화번호 없이 정해진 날짜의 자동이체만 알림', '계좌 번호·비밀번호를 묻지 않아요', '금액이 이상하면 앱이나 고객센터에 직접 확인'] },
  { msg: '[달빛마켓] 구매자님이 안전결제로 52만원을 입금했습니다.\n판매 대금 받기(판매자 인증 필요): http://dalbit-pay.safe-trade.xyz', fake: true,
    mark: ['안전결제', '판매자 인증 필요', 'http://dalbit-pay.safe-trade.xyz'], src: ['police'],
    why: ['중고 거래에서 가짜 "안전결제" 주소를 보내 계좌·카드 정보를 빼 가는 수법', '진짜 안전결제는 거래 앱 안에서만 진행돼요', '앱 밖 링크로 옮기자는 순간 의심하세요'] },
  { msg: '[한울대학교 도서관] 대출하신 도서의 반납 예정일은 내일(11/24)입니다. 연장은 도서관 앱에서 할 수 있습니다.', fake: false,
    mark: ['도서관 앱에서'], src: ['kisaSmish'],
    why: ['링크·결제·개인정보 요구가 없는 일정 안내', '연장도 공식 앱으로 안내해요'] }
];
/* 문자 속 표시할 부분 칠하기(글자는 먼저 esc 처리) */
function markMsg(item, show) {
  let html = esc(item.msg);
  if (show) for (const m of item.mark || []) {
    const e = esc(m), at = html.indexOf(e);
    if (at >= 0) html = html.slice(0, at) + `<mark class="${item.fake ? 'sus' : 'safe'}">${e}</mark>` + html.slice(at + e.length);
  }
  return html.replace(/\n/g, '<br>');
}

Router.on('/phishing', root => {
  let i = 0, correct = 0;
  const box = h('<section></section>');
  root.append(box);
  function finish() {
    const pct = Math.round(correct / QUIZ.length * 100);
    box.innerHTML = `
      <div class="narrow stack center quizend">
        <h1>스미싱 판별력 ${pct}점</h1>
        <p class="muted">${QUIZ.length}문제 중 ${correct}문제를 맞혔어요. ${pct >= 90 ? '사기꾼이 울고 가겠어요!' : pct >= 70 ? '꽤 날카로워요.' : '링크 누르기 전에 한 번 더 의심해요.'}</p>
        <button class="btn block" id="retry">다시 풀기</button>
        <a class="btn primary block" href="#/">🔒 사이트 보안 검사하러 가기</a>
      </div>`;
    $('#retry', box).onclick = () => { i = 0; correct = 0; render(); };
  }
  function render() {
    const item = QUIZ[i];
    box.innerHTML = `
      <div class="row"><b>스미싱 퀴즈</b><span class="grow"></span><span class="muted small">${i + 1} / ${QUIZ.length}</span></div>
      <div class="bar" style="margin:12px 0 20px"><i style="width:${(i / QUIZ.length) * 100}%"></i></div>
      <div class="split center"><div class="phone"><div class="sms">${markMsg(item, false)}</div></div>
      <div><div class="row judge"><button class="btn big grow" data-v="real">진짜 문자</button><button class="btn big grow" data-v="fake">가짜 문자</button></div>
      <div class="explain hidden"></div></div></div>`;
    $$('.judge button', box).forEach(b => b.onclick = () => {
      const ok = (b.dataset.v === 'fake') === item.fake;
      if (ok) correct++;
      vibrate(ok ? 20 : [30, 40, 30]); Sfx.play(ok ? 'ok' : 'bad');
      $$('.judge button', box).forEach(x => x.disabled = true);
      $('.sms', box).innerHTML = markMsg(item, true);
      const ex = $('.explain', box);
      ex.classList.remove('hidden');
      ex.innerHTML = `
        <div class="card ${ok ? 'right' : 'wrong'}">
          <b>${ok ? '정답!' : '아쉬워요!'} 이 문자는 ${item.fake ? '가짜(스미싱)' : '진짜'}예요.</b>
          <p class="small marklegend">${item.fake ? '<mark class="sus">빨간 칠</mark> = 의심 포인트' : '<mark class="safe">초록 칠</mark> = 안심 포인트'}</p>
          <ul>${item.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
          <p class="src small">근거: ${esc(srcLine(item.src || []))}</p>
        </div>
        <button class="btn primary block next">${i + 1 < QUIZ.length ? '다음 문자' : '결과 보기'}</button>`;
      $('.next', box).onclick = () => { if (++i < QUIZ.length) render(); else finish(); };
    });
  }
  render();
});

/* ---------- 처리 방식 ---------- */
Router.on('/about', root => {
  root.append(h(`
    <section class="stack">
      <h1>어떻게 검사하나요?</h1>
      <div class="card stack">
        <p><b>사이트 검사는 누구나 볼 수 있는 공개 응답만 확인해요.</b> 입력한 주소의 도메인 이름만 아래 두 곳으로 보내고, 검사 대상 사이트에 공격·침투·대입 같은 시도는 하지 않아요.</p>
        <p><b>HTTPS·보안 헤더 12종</b>은 Mozilla HTTP Observatory가 그 사이트 첫 화면을 한 번 불러와 응답 헤더를 확인한 결과예요. 같은 주소는 잠깐 동안 최근 결과를 다시 써요.</p>
        <p><b>메일 위조 방지·도메인 보호</b>는 Google 공개 DNS에서 SPF·DMARC·DNSSEC·CAA 기록을 조회해 확인해요.</p>
        <p><b>점수</b> = 웹 보안(Observatory 점수, 100점 상한) 70% + DNS 4개 항목(SPF 25·DMARC 35·DNSSEC 20·CAA 20) 30%. 로그인·게시판 같은 프로그램 자체의 취약점은 확인하지 않으니, 점수는 "기본 보호 장치를 얼마나 갖췄나"로 봐 주세요.</p>
        <p><b>비밀번호 검사</b>(덤)는 이 기기 안에서만 계산해요. 유출 이력 확인 버튼을 누를 때만 비밀번호 SHA-1 해시의 <b>앞 5자리만</b> Have I Been Pwned로 보내고(k-익명성), 맞는지는 이 기기에서 비교해요.</p>
        <p><b>스미싱 퀴즈</b>(덤)의 기관·회사 이름과 주소는 모두 지어낸 것이에요.</p>
      </div>
      <h2>근거 출처</h2>
      <ul class="srclist">${Object.values(SOURCES).map(x => `<li><b>${esc(x.org)}</b> 「${esc(x.name)}」${x.more ? ` — ${esc(x.more)}` : ''}<span class="muted small"> ${esc(x.url)}</span></li>`).join('')}</ul>
      <a class="btn primary block" href="#/">사이트 검사하러 가기</a>
    </section>`));
});

Router.start($('#app'));
