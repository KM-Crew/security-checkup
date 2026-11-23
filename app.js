/* 내 보안 몇 점? — 보안 습관 진단 · 비밀번호 검사 · 스미싱 퀴즈
   모든 입력은 브라우저 안에서만 처리하고 네트워크로 보내지 않습니다. */
'use strict';

/* 근거 출처: 화면에는 기관·문서 이름과 주소를 글자로만 보여 줍니다(허브 iframe 안이라 새 창·이동 링크 없음). */
const SOURCES = {
  nist: { short: 'NIST', name: 'NIST SP 800-63B 디지털 신원 지침', org: '미국 국립표준기술연구소', url: 'pages.nist.gov/800-63-4' },
  cisa: { short: 'CISA', name: 'Secure Our World', more: '2단계 인증·비밀번호 관리자·업데이트·피싱 구별', org: '미국 사이버보안·기반시설보안청(CISA)', url: 'cisa.gov/secure-our-world' },
  kisaPhone: { short: 'KISA 보호나라', name: '스마트폰 10대 안전수칙', org: '한국인터넷진흥원(KISA) 보호나라', url: 'boho.or.kr' },
  kisaSmish: { short: 'KISA 보호나라', name: '스미싱 피해 예방 수칙', org: '한국인터넷진흥원(KISA) 보호나라', url: 'boho.or.kr' },
  kisaRansom: { short: 'KISA 보호나라', name: '랜섬웨어 예방 수칙(중요 자료 백업)', org: '한국인터넷진흥원(KISA) 보호나라', url: 'boho.or.kr' },
  police: { short: '경찰청', name: '메신저 피싱·사이버 사기 예방', org: '경찰청 사이버수사국', url: 'ecrm.police.go.kr' },
  fss: { short: '금융감독원', name: '보이스피싱 지킴이', org: '금융감독원', url: 'fss.or.kr' },
  pipc: { short: '개인정보보호위원회', name: '개인정보 노출 줄이기(SNS 공개 범위)', org: '개인정보보호위원회', url: 'pipc.go.kr' },
  hibp: { short: 'HIBP', name: 'Pwned Passwords(k-익명 범위 조회)', org: 'Have I Been Pwned', url: 'haveibeenpwned.com/Passwords' }
};
const srcLine = keys => keys.map(k => SOURCES[k]).filter(Boolean).map(x => `${x.short} 「${x.name}」`).join(' · ');

const QUESTIONS = [
  { cat: '계정', q: '메일·SNS·은행 같은 중요한 계정에 2단계 인증을 켜 두었나요?',
    a: [['전부 켜 두었어요', 10], ['일부만 켰어요', 5], ['아니요 / 그게 뭔지 몰라요', 0]],
    tip: '중요한 계정부터 2단계 인증(인증 앱·문자)을 켜세요. 비밀번호가 새도 막아 줍니다.', src: ['cisa'] },
  { cat: '계정', q: '여러 사이트에서 같은 비밀번호를 쓰나요?',
    a: [['사이트마다 전부 달라요', 10], ['비슷하게 조금씩 바꿔 써요', 4], ['거의 다 같아요', 0]],
    tip: '한 곳이 털리면 전부 털립니다. 최소한 메일·금융 계정 비밀번호는 따로 쓰세요.', src: ['nist','cisa'] },
  { cat: '계정', q: '비밀번호 관리자(브라우저·전용 앱)를 쓰나요?',
    a: [['네, 거기에 저장해요', 10], ['가끔 써요', 5], ['머리로 외우거나 메모장에 적어요', 0]],
    tip: '비밀번호 관리자를 쓰면 사이트마다 긴 비밀번호를 외우지 않고도 쓸 수 있어요.', src: ['cisa'] },
  { cat: '기기', q: '휴대폰·PC에 업데이트 알림이 뜨면?',
    a: [['바로 설치해요', 10], ['며칠 미뤘다가 해요', 5], ['계속 "나중에"를 눌러요', 0]],
    tip: '보안 업데이트는 이미 알려진 구멍을 막는 일입니다. 자동 업데이트를 켜 두세요.', src: ['kisaPhone','cisa'] },
  { cat: '기기', q: '휴대폰 잠금은 어떻게 되어 있나요?',
    a: [['생체 인식 또는 6자리 이상', 10], ['4자리 숫자 또는 패턴', 5], ['잠금이 없어요', 0]],
    tip: '휴대폰 잠금을 6자리 이상 + 생체 인식으로 바꾸세요. 분실 시 첫 번째 방어선입니다.', src: ['kisaPhone'] },
  { cat: '기기', q: '출처를 모르는 앱·파일(APK, exe)을 설치한 적이 있나요?',
    a: [['없어요', 10], ['가끔 있어요', 4], ['자주 있어요', 0]],
    tip: '앱은 공식 스토어에서만 받으세요. 문자·메신저로 온 설치 파일은 열지 마세요.', src: ['kisaPhone'] },
  { cat: '습관', q: '문자 속 링크를 누르기 전에 어떻게 하나요?',
    a: [['주소를 확인하거나 공식 앱으로 직접 들어가요', 10], ['아는 번호면 그냥 눌러요', 4], ['일단 눌러 봐요', 0]],
    tip: '택배·결제·지원금 문자의 링크는 누르지 말고, 공식 앱이나 직접 검색으로 확인하세요.', src: ['kisaSmish'] },
  { cat: '습관', q: '카페 같은 공용 와이파이에서 로그인·금융 거래를 하나요?',
    a: [['안 해요 / 모바일 데이터로 해요', 10], ['가끔 해요', 4], ['자주 해요', 0]],
    tip: '공용 와이파이에서는 금융·로그인을 피하고 모바일 데이터를 쓰세요.', src: ['kisaPhone'] },
  { cat: '습관', q: '중요한 사진·파일은 백업하나요?',
    a: [['자동 백업이 켜져 있어요', 10], ['가끔 직접 옮겨요', 5], ['따로 안 해요', 0]],
    tip: '랜섬웨어·분실에 대비해 클라우드 자동 백업을 켜 두세요.', src: ['kisaRansom'] },
  { cat: '습관', q: 'SNS에 생일·학교·전화번호 같은 정보를 공개해 두었나요?',
    a: [['최소한만 공개해요', 10], ['일부 공개되어 있어요', 5], ['대부분 공개되어 있어요', 0]],
    tip: '생일·학교·반려동물 이름은 비밀번호 찾기 질문의 단골입니다. 공개 범위를 줄이세요.', src: ['pipc'] }
];

const GRADES = [
  { min: 90, lv: 3, name: '철벽 금고', nick: '금고 씨', face: '🛡️', line: '해커가 와도 문 앞에서 돌아갑니다.' },
  { min: 70, lv: 2, name: '튼튼한 자물쇠', nick: '자물쇠 군', face: '🔐', line: '꽤 단단해요. 빈틈 몇 개만 막으면 금고급.' },
  { min: 50, lv: 1, name: '삐걱대는 문', nick: '삐걱이', face: '🚪', line: '마음먹은 사람에겐 열릴 수도 있어요.' },
  { min: 0, lv: 0, name: '활짝 열린 대문', nick: '활짝이', face: '🏚️', line: '지금 바로 아래 할 일부터 시작해요.' }
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

/* 스미싱 퀴즈 12문제. 기관·회사 이름은 모두 지어낸 이름. mark = 해설 때 문자 안에 칠할 의심(가짜)·안심(진짜) 부분 */
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

const COMMON_PW = ['123456', '12345678', '123456789', '1234', '12345', '1234567890', 'password', 'qwerty', '111111', '000000',
  'abc123', 'iloveyou', '1q2w3e4r', '1q2w3e4r!', 'qwer1234', 'a123456', 'asdf1234', 'admin', 'welcome', 'letmein',
  'p@ssw0rd', 'password1', 'qwerty123', 'zxcvbnm', 'sunshine', 'dragon', 'monkey', 'football', 'iloveyou1', 'q1w2e3r4'];

const state = store.sget('sc-state', { answers: null, pw: null, quiz: null, quizN: null, pwned: null });
const save = () => store.sset('sc-state', state);

/* ---------- 랜딩 ---------- */
Router.on('/', root => {
  const wrap = h('<div class="split s73 center"></div>');
  root.append(wrap);
  wrap.append(h(`
    <section class="hero">
      <div class="lock">🔒</div>
      <h1>내 보안,<br>몇 점일까?</h1>
      <p class="muted">10문항, 30초면 끝. 해커 눈으로 본 내 빈틈을 알려 드려요.</p>
      <a class="btn primary big block" href="#/check">30초 보안 점수 받기</a>
      <p class="badge">입력한 내용은 이 기기 밖으로 나가지 않아요</p>
      <div class="feats"><span class="chip">🕵️ 비밀번호 유출 확인</span><span class="chip">📩 스미싱 퀴즈 12문제</span><span class="chip">📚 공식 근거 표시</span></div>
    </section>`));
  wrap.append(h(`
    <section class="tools">
      <a class="tool card" href="#/check"><b>🧭 보안 습관 진단</b><span class="muted">계정·기기·습관 10문항</span></a>
      <a class="tool card" href="#/password"><b>🔑 비밀번호 검사</b><span class="muted">뚫리는 데 걸리는 시간</span></a>
      <a class="tool card" href="#/phishing"><b>📩 스미싱 퀴즈</b><span class="muted">진짜 문자일까, 가짜일까?</span></a>
    </section>`));
  root.append(h(`
    <section class="chars card">
      <b>나는 어떤 자물쇠일까?</b>
      <div class="charrow">${GRADES.map(g => `<div class="charcell">${gradeChar(g.lv, 72)}<span class="small">${g.name}</span></div>`).join('')}</div>
    </section>`));
  root.append(h(`<p class="center small"><a href="#/about" class="muted">어떻게 처리되나요? · 근거 출처</a></p>`));
});

/* ---------- 진단 ---------- */
Router.on('/check', root => {
  const answers = [];
  let i = 0;
  const box = h('<section></section>');
  root.append(box);
  function render() {
    const q = QUESTIONS[i];
    box.innerHTML = `
      <div class="narrow"><div class="row"><span class="chip">${q.cat}</span><span class="grow"></span><span class="muted small">${i + 1} / ${QUESTIONS.length}</span></div>
      <div class="bar" style="margin:12px 0 20px"><i style="width:${(i / QUESTIONS.length) * 100}%"></i></div>
      <h2 class="q">${esc(q.q)}</h2>
      <div class="answers">${q.a.map((a, k) => `<button class="btn block answer" data-k="${k}">${esc(a[0])}</button>`).join('')}</div>
      ${i > 0 ? '<button class="btn ghost back">← 이전</button>' : ''}</div>`;
    $$('.answer', box).forEach(b => b.onclick = () => {
      answers[i] = Number(b.dataset.k);
      if (++i < QUESTIONS.length) render();
      else { state.answers = answers; save(); Router.go('/result'); }
    });
    const back = $('.back', box);
    if (back) back.onclick = () => { i--; render(); };
  }
  render();
});

/* ---------- 비밀번호 ---------- */
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

/* ---------- 유출 확인(Have I Been Pwned, k-익명) ----------
   비밀번호는 보내지 않습니다. 브라우저에서 SHA-1 해시를 만든 뒤 앞 5자리만 보내고,
   돌아온 수백 개의 뒷자리 목록과 내 해시 뒷자리를 이 기기 안에서 비교합니다. */
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
      <a class="btn block" href="#/result">결과 카드 보기</a>
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
    state.pw = r.level; state.pwned = pwned; save();
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

/* ---------- 스미싱 퀴즈 ---------- */
Router.on('/phishing', root => {
  let i = 0, correct = 0;
  const box = h('<section></section>');
  root.append(box);
  function render() {
    const item = QUIZ[i];
    box.innerHTML = `
      <div class="row"><b>스미싱 퀴즈</b><span class="grow"></span><span class="muted small">${i + 1} / ${QUIZ.length}</span></div>
      <div class="bar" style="margin:12px 0 20px"><i style="width:${(i / QUIZ.length) * 100}%"></i></div>
      <div class="split center"><div class="phone"><div class="sms">${markMsg(item, false)}</div></div>
      <div><div class="row judge"><button class="btn big grow" data-v="real">진짜 문자</button><button class="btn big grow" data-v="fake">가짜 문자</button></div>
      <div class="explain hidden"></div></div></div>`;
    $$('.judge button', box).forEach(b => b.onclick = () => {
      const saidFake = b.dataset.v === 'fake';
      const ok = saidFake === item.fake;
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
      $('.next', box).onclick = () => {
        if (++i < QUIZ.length) render();
        else { state.quiz = correct; state.quizN = QUIZ.length; save(); Router.go('/result'); }
      };
    });
  }
  render();
});

/* ---------- 결과 ---------- */
function habitScore() {
  if (!state.answers) return null;
  return state.answers.reduce((s, k, i) => s + QUESTIONS[i].a[k][1], 0);
}
Router.on('/result', root => {
  const habit = habitScore();
  if (habit == null) {
    root.append(h(`<section class="stack center"><h2>아직 진단을 안 했어요</h2><p class="muted">10문항만 답하면 점수가 나와요.</p><a class="btn primary block" href="#/check">진단 시작</a></section>`));
    return;
  }
  const parts = [{ name: '보안 습관', v: habit }];
  if (state.pw != null) parts.push({ name: '비밀번호', v: state.pwned > 0 ? 0 : [10, 35, 60, 85, 100][state.pw] });
  if (state.quiz != null) parts.push({ name: '스미싱 판별', v: Math.min(100, Math.round(state.quiz / (state.quizN || QUIZ.length) * 100)) });
  const total = Math.round(parts.reduce((s, p) => s + p.v, 0) / parts.length);
  const g = GRADES.find(x => total >= x.min);
  const cats = {};
  QUESTIONS.forEach((q, i) => { (cats[q.cat] = cats[q.cat] || []).push(q.a[state.answers[i]][1]); });
  const todo = state.answers.map((k, i) => ({ i, v: QUESTIONS[i].a[k][1] })).filter(x => x.v < 10).sort((a, b) => a.v - b.v).slice(0, 3);

  root.append(h(`
    <section class="split">
      <div class="sticky"><div class="result card" id="card">
        <div class="face">${gradeChar(g.lv)}</div>
        <div class="muted small">나의 보안 등급</div>
        <div class="grade" style="color:${GRADE_COLOR[g.lv]}">${g.name}</div>
        <div class="muted small">캐릭터 · ${g.nick}</div>
        <div class="score">${total}<small>점</small></div>
        <p>${g.line}</p>
        <div class="cats">
          ${Object.entries(cats).map(([c, arr]) => {
            const v = Math.round(arr.reduce((a, b) => a + b, 0) / (arr.length * 10) * 100);
            return `<div class="catrow"><span>${c}</span><div class="bar grow"><i style="width:${v}%"></i></div><b>${v}</b></div>`;
          }).join('')}
          ${parts.slice(1).map(p => `<div class="catrow"><span>${p.name}</span><div class="bar grow"><i style="width:${p.v}%"></i></div><b>${p.v}</b></div>`).join('')}
        </div>
        <div class="stamp">내 보안 몇 점?</div>
      </div></div>
      <div class="stack">
      ${state.pwned > 0 ? `<div class="leakres bad"><b>🚨 검사한 비밀번호가 유출 목록에 있어요</b><p>그 비밀번호를 쓰는 계정이 있다면 가장 먼저 바꾸세요.</p></div>` : ''}
      ${todo.length ? `<h2>지금 바로 할 일</h2><ol class="todo">${todo.map(t => `<li>${esc(QUESTIONS[t.i].tip)}<span class="src small">근거: ${esc(srcLine(QUESTIONS[t.i].src))}</span></li>`).join('')}</ol>` : '<p class="ok">할 일이 없어요. 완벽!</p>'}
      ${state.pw == null ? '<a class="btn block" href="#/password">🔑 비밀번호 검사하고 점수에 넣기</a>' : ''}
      ${state.quiz == null ? '<a class="btn block" href="#/phishing">📩 스미싱 퀴즈 풀고 점수에 넣기</a>' : ''}
      <div class="row"><button class="btn primary grow" id="save">결과 이미지 저장</button><button class="btn grow" id="share">공유하기</button></div>
      <button class="btn ghost block" id="again">처음부터 다시</button>
      </div>
    </section>`));
  $('#save').onclick = () => saveImage($('#card'), 'my-security-score.png');
  $('#share').onclick = () => shareText('내 보안 몇 점?', `내 보안 등급은 "${g.name}" (${total}점)! 너도 해 봐`, location.href.split('#')[0]);
  $('#again').onclick = () => { state.answers = state.pw = state.quiz = state.quizN = state.pwned = null; save(); Router.go('/check'); };
});

/* ---------- 처리 방식 ---------- */
Router.on('/about', root => {
  root.append(h(`
    <section class="stack">
      <h1>어떻게 처리되나요?</h1>
      <div class="card stack">
        <p><b>모든 계산은 내 브라우저 안에서만 해요.</b> 진단 답변, 비밀번호, 퀴즈 결과는 서버로 보내지 않고, 이 탭을 닫으면 사라져요.</p>
        <p><b>비밀번호 검사</b>는 글자 종류·길이·흔한 패턴을 보고 "추측 공격에 버티는 시간"을 추정해요. 실제 해킹 시도가 아니에요.</p>
        <p><b>유출 이력 확인</b>은 버튼을 눌렀을 때만 동작해요. 비밀번호로 SHA-1 해시를 만들고 <b>앞 5자리만</b> Have I Been Pwned의 Pwned Passwords 서버에 보내요(k-익명성). 서버는 그 5자리로 시작하는 수백 개의 해시 뒷자리를 돌려주고, 내 해시와 맞는지는 이 기기에서 비교해요. 서버는 내가 어떤 비밀번호를 넣었는지 알 수 없어요. 연결이 안 되면 확인만 건너뛰고 나머지는 그대로 돼요.</p>
        <p><b>스미싱 퀴즈</b>의 기관·회사 이름과 주소는 모두 지어낸 것이에요.</p>
      </div>
      <h2>근거 출처</h2>
      <p class="muted small">진단 문항의 할 일, 퀴즈 해설, 비밀번호 기준은 아래 기관의 공개 안내를 참고해 쉬운 말로 옮겼어요.</p>
      <ul class="srclist">${Object.values(SOURCES).map(x => `<li><b>${esc(x.org)}</b> 「${esc(x.name)}」${x.more ? ` — ${esc(x.more)}` : ''}<span class="muted small"> ${esc(x.url)}</span></li>`).join('')}</ul>
      <a class="btn primary block" href="#/check">진단하러 가기</a>
    </section>`));
});

Router.start($('#app'));
