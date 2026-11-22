/* 내 보안 몇 점? — 보안 습관 진단 · 비밀번호 검사 · 스미싱 퀴즈
   모든 입력은 브라우저 안에서만 처리하고 네트워크로 보내지 않습니다. */
'use strict';

const QUESTIONS = [
  { cat: '계정', q: '메일·SNS·은행 같은 중요한 계정에 2단계 인증을 켜 두었나요?',
    a: [['전부 켜 두었어요', 10], ['일부만 켰어요', 5], ['아니요 / 그게 뭔지 몰라요', 0]],
    tip: '중요한 계정부터 2단계 인증(인증 앱·문자)을 켜세요. 비밀번호가 새도 막아 줍니다.' },
  { cat: '계정', q: '여러 사이트에서 같은 비밀번호를 쓰나요?',
    a: [['사이트마다 전부 달라요', 10], ['비슷하게 조금씩 바꿔 써요', 4], ['거의 다 같아요', 0]],
    tip: '한 곳이 털리면 전부 털립니다. 최소한 메일·금융 계정 비밀번호는 따로 쓰세요.' },
  { cat: '계정', q: '비밀번호 관리자(브라우저·전용 앱)를 쓰나요?',
    a: [['네, 거기에 저장해요', 10], ['가끔 써요', 5], ['머리로 외우거나 메모장에 적어요', 0]],
    tip: '비밀번호 관리자를 쓰면 사이트마다 긴 비밀번호를 외우지 않고도 쓸 수 있어요.' },
  { cat: '기기', q: '휴대폰·PC에 업데이트 알림이 뜨면?',
    a: [['바로 설치해요', 10], ['며칠 미뤘다가 해요', 5], ['계속 "나중에"를 눌러요', 0]],
    tip: '보안 업데이트는 이미 알려진 구멍을 막는 일입니다. 자동 업데이트를 켜 두세요.' },
  { cat: '기기', q: '휴대폰 잠금은 어떻게 되어 있나요?',
    a: [['생체 인식 또는 6자리 이상', 10], ['4자리 숫자 또는 패턴', 5], ['잠금이 없어요', 0]],
    tip: '휴대폰 잠금을 6자리 이상 + 생체 인식으로 바꾸세요. 분실 시 첫 번째 방어선입니다.' },
  { cat: '기기', q: '출처를 모르는 앱·파일(APK, exe)을 설치한 적이 있나요?',
    a: [['없어요', 10], ['가끔 있어요', 4], ['자주 있어요', 0]],
    tip: '앱은 공식 스토어에서만 받으세요. 문자·메신저로 온 설치 파일은 열지 마세요.' },
  { cat: '습관', q: '문자 속 링크를 누르기 전에 어떻게 하나요?',
    a: [['주소를 확인하거나 공식 앱으로 직접 들어가요', 10], ['아는 번호면 그냥 눌러요', 4], ['일단 눌러 봐요', 0]],
    tip: '택배·결제·지원금 문자의 링크는 누르지 말고, 공식 앱이나 직접 검색으로 확인하세요.' },
  { cat: '습관', q: '카페 같은 공용 와이파이에서 로그인·금융 거래를 하나요?',
    a: [['안 해요 / 모바일 데이터로 해요', 10], ['가끔 해요', 4], ['자주 해요', 0]],
    tip: '공용 와이파이에서는 금융·로그인을 피하고 모바일 데이터를 쓰세요.' },
  { cat: '습관', q: '중요한 사진·파일은 백업하나요?',
    a: [['자동 백업이 켜져 있어요', 10], ['가끔 직접 옮겨요', 5], ['따로 안 해요', 0]],
    tip: '랜섬웨어·분실에 대비해 클라우드 자동 백업을 켜 두세요.' },
  { cat: '습관', q: 'SNS에 생일·학교·전화번호 같은 정보를 공개해 두었나요?',
    a: [['최소한만 공개해요', 10], ['일부 공개되어 있어요', 5], ['대부분 공개되어 있어요', 0]],
    tip: '생일·학교·반려동물 이름은 비밀번호 찾기 질문의 단골입니다. 공개 범위를 줄이세요.' }
];

const GRADES = [
  { min: 90, name: '철벽 금고', face: '🛡️', line: '해커가 와도 문 앞에서 돌아갑니다.' },
  { min: 70, name: '튼튼한 자물쇠', face: '🔐', line: '꽤 단단해요. 빈틈 몇 개만 막으면 금고급.' },
  { min: 50, name: '삐걱대는 문', face: '🚪', line: '마음먹은 사람에겐 열릴 수도 있어요.' },
  { min: 0, name: '활짝 열린 대문', face: '🏚️', line: '지금 바로 아래 할 일부터 시작해요.' }
];

const QUIZ = [
  { msg: '[국외발신]\n고객님 해외결제 980,000원 승인완료.\n본인 아닐 시 즉시 문의 070-1234-5678', fake: true,
    why: ['"국외발신" + 큰 금액으로 겁을 줘서 전화를 걸게 만드는 전형적인 수법', '카드사는 문의 번호로 070 번호를 쓰지 않아요', '카드사 앱에서 결제 내역을 직접 확인하세요'] },
  { msg: '[한빛택배] 주소지 불일치로 배송이 보류되었습니다. 주소 수정: http://bit.ly/3xYz9q', fake: true,
    why: ['단축 주소(bit.ly 등)로 진짜 목적지를 숨김', '택배사는 주소 수정을 문자 링크로 요구하지 않아요', '배송 조회는 택배사 공식 앱에서'] },
  { msg: '엄마 나 폰 액정 깨져서 임시폰이야ㅠ\n급한데 문화상품권 좀 사서 번호 보내줄 수 있어?', fake: true,
    why: ['가족 사칭 + "임시폰" + 상품권 요구는 메신저 피싱의 3종 세트', '반드시 원래 번호로 전화해서 확인하세요'] },
  { msg: '[하늘카드] 11월 이용대금 명세서가 발송되었습니다. 자세한 내용은 하늘카드 앱에서 확인하세요.', fake: false,
    why: ['링크 없이 공식 앱 확인만 안내', '금액·개인정보 입력을 요구하지 않음', '그래도 의심되면 앱을 직접 열어 보세요'] },
  { msg: '[별빛은행] 인증번호 [482913]\n타인에게 절대 알려주지 마세요.', fake: false,
    why: ['링크가 없는 일반적인 인증번호 문자', '단, 내가 요청하지 않았는데 왔다면 누군가 내 계정으로 시도 중일 수 있어요 → 비밀번호 변경'] },
  { msg: '[Web발신]\n귀하의 개인정보가 유출되어 계정이 24시간 내 정지됩니다.\n즉시 본인인증: http://safe-check.kr-auth.top', fake: true,
    why: ['"24시간 내 정지"처럼 시간 압박을 주는 문구', '.top 같은 낯선 도메인', '공식 기관은 문자 링크로 본인인증을 요구하지 않아요'] },
  { msg: '모바일 청첩장 보내드립니다♡\n꼭 와주세요!\nhttp://wedding-card.app/invite.apk', fake: true,
    why: ['.apk = 앱 설치 파일. 청첩장은 설치 파일일 이유가 없어요', '설치하면 문자·연락처가 털리는 악성 앱일 수 있음'] },
  { msg: '[동네약국] 처방약 조제가 완료되었습니다. 방문 시 신분증을 지참해 주세요.', fake: false,
    why: ['링크·전화 유도·금전 요구가 없는 단순 안내', '이런 문자는 대체로 안전해요'] }
];

const COMMON_PW = ['123456', '12345678', '123456789', '1234', '12345', '1234567890', 'password', 'qwerty', '111111', '000000',
  'abc123', 'iloveyou', '1q2w3e4r', '1q2w3e4r!', 'qwer1234', 'a123456', 'asdf1234', 'admin', 'welcome', 'letmein',
  'p@ssw0rd', 'password1', 'qwerty123', 'zxcvbnm', 'sunshine', 'dragon', 'monkey', 'football', 'iloveyou1', 'q1w2e3r4'];

const state = store.sget('sc-state', { answers: null, pw: null, quiz: null });
const save = () => store.sset('sc-state', state);

/* ---------- 랜딩 ---------- */
Router.on('/', root => {
  root.append(h(`
    <section class="hero">
      <div class="lock">🔒</div>
      <h1>내 보안,<br>몇 점일까?</h1>
      <p class="muted">10문항, 30초면 끝. 해커 눈으로 본 내 빈틈을 알려 드려요.</p>
      <a class="btn primary big block" href="#/check">30초 보안 점수 받기</a>
      <p class="badge">입력한 내용은 이 기기 밖으로 나가지 않아요</p>
    </section>`));
  root.append(h(`
    <section class="tools">
      <a class="tool card" href="#/check"><b>🧭 보안 습관 진단</b><span class="muted">계정·기기·습관 10문항</span></a>
      <a class="tool card" href="#/password"><b>🔑 비밀번호 검사</b><span class="muted">뚫리는 데 걸리는 시간</span></a>
      <a class="tool card" href="#/phishing"><b>📩 스미싱 퀴즈</b><span class="muted">진짜 문자일까, 가짜일까?</span></a>
    </section>`));
  root.append(h(`<p class="center small"><a href="#/about" class="muted">어떻게 처리되나요?</a></p>`));
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
      <div class="row"><span class="chip">${q.cat}</span><span class="grow"></span><span class="muted small">${i + 1} / ${QUESTIONS.length}</span></div>
      <div class="bar" style="margin:12px 0 20px"><i style="width:${(i / QUESTIONS.length) * 100}%"></i></div>
      <h2 class="q">${esc(q.q)}</h2>
      <div class="answers">${q.a.map((a, k) => `<button class="btn block answer" data-k="${k}">${esc(a[0])}</button>`).join('')}</div>
      ${i > 0 ? '<button class="btn ghost back">← 이전</button>' : ''}`;
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
  if (pool <= 36) issues.push('대문자·특수문자를 섞어 보세요');
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

Router.on('/password', root => {
  root.append(h(`
    <section class="stack">
      <h1>비밀번호 검사</h1>
      <p class="muted">실제 비밀번호 대신 비슷한 형태로 넣어 봐도 돼요.</p>
      <div class="pwbox">
        <input id="pw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="비밀번호를 입력해 보세요">
        <button class="btn ghost" id="eye" aria-label="보기">보기</button>
      </div>
      <p class="badge">🔒 이 칸의 내용은 어디에도 전송·저장되지 않아요</p>
      <div class="card" id="out"><p class="muted">입력하면 바로 분석해요.</p></div>
      <a class="btn block" href="#/result">결과 카드 보기</a>
    </section>`));
  const pw = $('#pw'), out = $('#out');
  $('#eye').onclick = () => { pw.type = pw.type === 'password' ? 'text' : 'password'; $('#eye').textContent = pw.type === 'password' ? '보기' : '숨기기'; };
  pw.oninput = () => {
    const r = analyzePassword(pw.value);
    if (!r) { out.innerHTML = '<p class="muted">입력하면 바로 분석해요.</p>'; return; }
    state.pw = r.level; save();
    out.innerHTML = `
      <div class="row"><b style="color:${PW_COLOR[r.level]}">${PW_LABEL[r.level]}</b><span class="grow"></span><span class="muted small">${pw.value.length}자</span></div>
      <div class="segs">${[0, 1, 2, 3, 4].map(k => `<i style="background:${k <= r.level ? PW_COLOR[r.level] : 'var(--line)'}"></i>`).join('')}</div>
      <p>해커 PC가 뚫는 데 걸리는 시간: <b>${humanTime(r.seconds)}</b></p>
      ${r.issues.length ? `<ul class="issues">${r.issues.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="ok">좋아요! 눈에 띄는 약점이 없어요.</p>'}
      <p class="muted small">초당 100억 번 대입하는 공격을 가정한 추정치예요.</p>`;
  };
  return () => { pw.value = ''; };
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
      <div class="phone"><div class="sms">${esc(item.msg).replace(/\n/g, '<br>')}</div></div>
      <div class="row judge"><button class="btn big grow" data-v="real">진짜 문자</button><button class="btn big grow" data-v="fake">가짜 문자</button></div>
      <div class="explain hidden"></div>`;
    $$('.judge button', box).forEach(b => b.onclick = () => {
      const saidFake = b.dataset.v === 'fake';
      const ok = saidFake === item.fake;
      if (ok) correct++;
      vibrate(ok ? 20 : [30, 40, 30]);
      $$('.judge button', box).forEach(x => x.disabled = true);
      const ex = $('.explain', box);
      ex.classList.remove('hidden');
      ex.innerHTML = `
        <div class="card ${ok ? 'right' : 'wrong'}">
          <b>${ok ? '정답!' : '아쉬워요!'} 이 문자는 ${item.fake ? '가짜(스미싱)' : '진짜'}예요.</b>
          <ul>${item.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
        </div>
        <button class="btn primary block next">${i + 1 < QUIZ.length ? '다음 문자' : '결과 보기'}</button>`;
      $('.next', box).onclick = () => {
        if (++i < QUIZ.length) render();
        else { state.quiz = correct; save(); Router.go('/result'); }
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
  if (state.pw != null) parts.push({ name: '비밀번호', v: [10, 35, 60, 85, 100][state.pw] });
  if (state.quiz != null) parts.push({ name: '스미싱 판별', v: Math.round(state.quiz / QUIZ.length * 100) });
  const total = Math.round(parts.reduce((s, p) => s + p.v, 0) / parts.length);
  const g = GRADES.find(x => total >= x.min);
  const cats = {};
  QUESTIONS.forEach((q, i) => { (cats[q.cat] = cats[q.cat] || []).push(q.a[state.answers[i]][1]); });
  const todo = state.answers.map((k, i) => ({ i, v: QUESTIONS[i].a[k][1] })).filter(x => x.v < 10).sort((a, b) => a.v - b.v).slice(0, 3);

  root.append(h(`
    <section class="stack">
      <div class="result card" id="card">
        <div class="face">${g.face}</div>
        <div class="muted small">나의 보안 등급</div>
        <div class="grade">${g.name}</div>
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
      </div>
      ${todo.length ? `<h2>지금 바로 할 일</h2><ol class="todo">${todo.map(t => `<li>${esc(QUESTIONS[t.i].tip)}</li>`).join('')}</ol>` : '<p class="ok">할 일이 없어요. 완벽!</p>'}
      ${state.pw == null ? '<a class="btn block" href="#/password">🔑 비밀번호 검사하고 점수에 넣기</a>' : ''}
      ${state.quiz == null ? '<a class="btn block" href="#/phishing">📩 스미싱 퀴즈 풀고 점수에 넣기</a>' : ''}
      <div class="row"><button class="btn primary grow" id="save">결과 이미지 저장</button><button class="btn grow" id="share">공유하기</button></div>
      <button class="btn ghost block" id="again">처음부터 다시</button>
    </section>`));
  $('#save').onclick = () => saveImage($('#card'), 'my-security-score.png');
  $('#share').onclick = () => shareText('내 보안 몇 점?', `내 보안 등급은 "${g.name}" (${total}점)! 너도 해 봐`, location.href.split('#')[0]);
  $('#again').onclick = () => { state.answers = state.pw = state.quiz = null; save(); Router.go('/check'); };
});

/* ---------- 처리 방식 ---------- */
Router.on('/about', root => {
  root.append(h(`
    <section class="stack">
      <h1>어떻게 처리되나요?</h1>
      <div class="card stack">
        <p><b>모든 계산은 내 브라우저 안에서만 해요.</b> 진단 답변, 비밀번호, 퀴즈 결과는 서버로 보내지 않고, 이 탭을 닫으면 사라져요.</p>
        <p><b>비밀번호 검사</b>는 글자 종류·길이·흔한 패턴을 보고 "추측 공격에 버티는 시간"을 추정해요. 실제 해킹 시도가 아니에요.</p>
        <p><b>스미싱 퀴즈</b>의 기관·회사 이름은 모두 지어낸 이름이에요.</p>
        <p class="muted small">다음 버전에서는 비밀번호 유출 이력 확인(k-익명성 방식: 비밀번호 해시의 앞 5자리만 보내 비교)을 추가할 예정이에요.</p>
      </div>
      <a class="btn primary block" href="#/check">진단하러 가기</a>
    </section>`));
});

Router.start($('#app'));
