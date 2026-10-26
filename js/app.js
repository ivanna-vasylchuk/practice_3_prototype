/* ============================================================
   Прототип Use-case 2 «Прийняття замовлення»
   Екрани — це <section data-screen="..."> в index.html.
   Тут: перемикання екранів, анімації, стан сценарію.
   ============================================================ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Назва застосунку: змініть тут, і вона оновиться в усіх сповіщеннях ---------- */
const APP_NAME = 'Сервіс виклику майстрів';

/* ---------- Дані для демо (однакові з use-case 1 і 3) ---------- */
const REQUESTS = {
  '1024': { title: 'Сантехніка', sub: 'Заміна змішувача', price: '400–700 грн', ago: 'Створена 25 жовтня, 23:35',
            desc: 'Тече змішувач на кухні, вода капає постійно. Змішувач старий, потрібна заміна.' },
  '1019': { title: 'Сантехніка', sub: 'Усунення протікання', price: '300–600 грн', ago: 'Створена 25 жовтня, 23:22',
            desc: 'Під мийкою мокро, звідкись підтікає труба. Фото додала.' }
};

const MASTERS = {
  oleg:   { name: 'Олег Литвиненко', short: 'Олег', initials: 'ОЛ', cls: 'av-o', rating: '4,8', reviews: 36, years: 7, jobs: 212,
            skills: ['Сантехніка', 'Заміна змішувачів', 'Бойлери'],
            feedback: [['Марина К.', 'Приїхав вчасно, замінив змішувач за годину. Після себе все прибрав.'],
                       ['Віктор П.', 'Підказав, який змішувач краще купити. Ціна в межах діапазону.']] },
  igor:   { name: 'Ігор Бондар', short: 'Ігор', initials: 'ІБ', cls: 'av-i', rating: '4,9', reviews: 52, years: 11, jobs: 340,
            when: 'Завтра, 10:00 · ~1 год', skills: ['Сантехніка', 'Опалення'],
            feedback: [['Олена Д.', 'Дуже акуратний, все пояснив.'], ['Сергій М.', 'Швидко знайшов причину протікання.']] },
  andrii: { name: 'Андрій Савчук', short: 'Андрій', initials: 'АС', cls: 'av-a', rating: '4,6', reviews: 18, years: 3, jobs: 64,
            when: 'Сьогодні, 19:00 · ~2 год', skills: ['Сантехніка', 'Дрібний ремонт'],
            feedback: [['Ірина Т.', 'Ввічливий, зробив усе в той самий день.']] }
};

/* ---------- Стан сценарію ---------- */
const S = {
  screen: null,
  req: '1024',
  removed: new Set(),
  dur: null, day: null, slot: null,
  chosen: null,
  profile: 'oleg',
  chatFrom: 'confirmed',
  chatRole: 'client',
  chat: [],
  chatReplied: 0,
  timers: []
};

const whenText = () => `${S.day || 'Сьогодні'}, ${S.slot || '16:00'}`;
const durText = () => S.dur || '~1 год';

/* ---------- Таймери автоматичних переходів ---------- */
function later(fn, ms) { S.timers.push(setTimeout(fn, ms)); }
function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }

/* ============================================================
   Перемикання екранів
   anim: 'right' (вперед), 'back' (назад), 'fade', 'none'
   ============================================================ */
function show(name, anim = 'right') {
  const next = $(`[data-screen="${name}"]`);
  const prev = S.screen ? $(`[data-screen="${S.screen}"]`) : null;
  if (!next || next === prev) { afterShow(name); return; }

  closeOverlays(true);
  const enter = { right: 'enter-right', back: 'enter-left', fade: 'enter-fade' }[anim];
  const leave = { right: 'leave-left', back: 'leave-right', fade: 'leave-fade' }[anim];

  $$('.screen').forEach(s => s.classList.remove('active', 'leaving', 'enter-right', 'enter-left', 'enter-fade', 'leave-left', 'leave-right', 'leave-fade'));
  next.classList.add('active');
  if (prev && enter) {
    // назад: старий екран їде праворуч поверх нового
    prev.classList.add('leaving', leave);
    next.classList.add(enter);
    if (anim === 'back') prev.style.zIndex = 3;
    setTimeout(() => { prev.classList.remove('leaving', leave); prev.style.zIndex = ''; next.classList.remove(enter); }, 380);
  }
  S.screen = name;
  afterShow(name);
}

function afterShow(name) {
  const el = $(`[data-screen="${name}"]`);
  // колір статус-бару
  $('#statusbar').classList.toggle('on-light', el.dataset.theme === 'light');
  // плашка «Телефон майстра / клієнта»
  let role = el.dataset.role;
  if (name === 'chat') role = S.chatRole;
  if (role) setRole(role);
  // підсвітка в лівій панелі
  markCurrent(name);
  // скрол контенту вгору
  $$('.content', el).forEach(c => c.scrollTop = 0);
  // дії при вході на екран
  if (name === 'clientPush') {
    $('#clientPushBanner').classList.remove('show');
    later(() => $('#clientPushBanner').classList.add('show'), 450);
  }
  if (name === 'chosen') {
    $('#chosenPush').classList.remove('show');
    later(() => $('#chosenPush').classList.add('show'), 400);
    later(() => $('#chosenPush').classList.remove('show'), 4200);
  }
}

function setRole(role) {
  const chip = $('#roleChip');
  chip.classList.toggle('client', role === 'client');
  $('span', chip).textContent = role === 'client' ? 'Телефон клієнта' : 'Телефон майстра';
}

function markCurrent(name) {
  $$('.screens li').forEach(li => li.classList.toggle('current', li.dataset.go === name));
}

/* ---------- Оверлеї: нижня панель і модальне вікно ---------- */
function openSheet() {
  const o = $('#timeSheet');
  o.hidden = false;
  $('.sheet', o).classList.remove('closing');
  markCurrent('time');
  updateSheet();
}
function closeSheet(instant) {
  const o = $('#timeSheet');
  if (o.hidden) return;
  if (instant) { o.hidden = true; return; }
  $('.sheet', o).classList.add('closing');
  setTimeout(() => { o.hidden = true; markCurrent(S.screen); }, 200);
}
function openUnavailable() { $('#unavailableModal').hidden = false; markCurrent('unavailable'); }
function closeOverlays(instant) { closeSheet(instant); $('#unavailableModal').hidden = true; }

/* ============================================================
   Екран 2: список заявок
   ============================================================ */
function refreshList() {
  $$('#cards .req-card').forEach(c => c.hidden = S.removed.has(c.dataset.req));
  const left = Object.keys(REQUESTS).filter(id => !S.removed.has(id)).length;
  $('#newCount').textContent = left;
  $('#emptyInline').hidden = left > 0;
}

function removeCard(id) {
  S.removed.add(id);
  const card = $(`#cards [data-req="${id}"]`);
  if (!card) return refreshList();
  card.classList.add('removing');
  setTimeout(() => { card.classList.remove('removing'); refreshList(); }, 280);
}

/* ============================================================
   Екран 3: деталі заявки
   ============================================================ */
function openDetails(id, anim = 'right') {
  S.req = id;
  const r = REQUESTS[id];
  $('#detTitle').textContent = `Заявка №${id}`;
  $('#detSub').textContent = r.sub;
  $('#detDesc').textContent = r.desc;
  $('#detPrice').textContent = r.price;
  $('#detTimeAgo').textContent = r.ago;
  $('#gallery').scrollLeft = 0;
  updateDots();
  show('details', anim);
}

function updateDots() {
  const g = $('#gallery');
  const i = Math.round(g.scrollLeft / (g.clientWidth + 10));
  $$('#dots i').forEach((d, k) => d.classList.toggle('on', k === i));
}

/* ============================================================
   Екран 4: орієнтовний час (нижня панель)
   ============================================================ */
function updateSheet() {
  $$('.chips').forEach(group => {
    const key = group.dataset.group;
    $$('.chip-select', group).forEach(b => b.classList.toggle('on', b.dataset.val === S[key]));
  });
  const ready = S.dur && S.day && S.slot;
  $('#confirmTime').disabled = !ready;
  const hint = $('#sheetHint');
  hint.classList.toggle('ok', !!ready);
  hint.lastChild.textContent = ready
    ? `Клієнт побачить: ${whenText()} · ${durText()}`
    : 'Оберіть тривалість, день і час — без цього клієнт не зможе вас порівняти';
}

function confirmTime() {
  closeSheet();
  $('#loadingText').textContent = 'Надсилаємо відповідь клієнту…';
  $('#accWhen').textContent = `${whenText()} · ${durText()}`;
  show('loading', 'fade');
  later(() => show('accepted', 'fade'), 1500);
  later(() => goClient(), 1500 + 3200);
}

/* ---------- Перемикання між телефонами ---------- */
function roleSwitch(text, then) {
  $('#switchText').textContent = text;
  show('switch', 'fade');
  later(then, 1600);
}
function goClient() { roleSwitch('на телефоні клієнта', () => show('clientPush', 'fade')); }
function goMaster() {
  if (!S.chosen) S.chosen = 'oleg';
  $('#chosenWhen').textContent = whenText();
  roleSwitch('на телефоні майстра', () => show(S.chosen === 'oleg' ? 'chosen' : 'notChosen', 'fade'));
}

/* ============================================================
   Екрани 8–9: кандидати, профіль, підтвердження (клієнт)
   ============================================================ */
function stars() { return '<svg class="ic"><use href="#i-star"/></svg>'; }

function renderCandidates() {
  const oleg = { ...MASTERS.oleg, when: `${whenText()} · ${durText()}` };
  const list = [['oleg', oleg], ['igor', MASTERS.igor], ['andrii', MASTERS.andrii]];
  $('#candList').innerHTML = list.map(([id, m]) => `
    <article class="card cand" data-profile="${id}">
      <div class="cand-top">
        <i class="av ${m.cls}">${m.initials}</i>
        <div>
          <p class="cand-name">${m.name} <svg class="ic"><use href="#i-shield"/></svg></p>
          <span class="rating">${stars()}${m.rating} <span class="muted">· ${m.reviews} відгуків</span></span>
          ${id === 'oleg' ? '<span class="tag-you">щойно</span>' : ''}
        </div>
      </div>
      <div class="cand-meta">
        <span class="cand-time"><svg class="ic"><use href="#i-clock"/></svg>${m.when}</span>
        <button class="btn-choose" data-choose="${id}">Обрати</button>
      </div>
    </article>`).join('');
}

function renderProfile(id) {
  S.profile = id;
  const m = MASTERS[id];
  $('#profileBody').innerHTML = `
    <div class="prof-hero">
      <i class="av ${m.cls}">${m.initials}</i>
      <p class="prof-name">${m.name}</p>
      <span class="verified"><svg class="ic"><use href="#i-shield"/></svg>Верифікований майстер</span>
    </div>
    <div class="card stats">
      <div class="stat"><b>${m.rating}</b><span>рейтинг</span></div>
      <div class="stat"><b>${m.jobs}</b><span>заявок</span></div>
      <div class="stat"><b>${m.years} р.</b><span>досвіду</span></div>
    </div>
    <p class="label">Навички</p>
    <div class="skills">${m.skills.map(s => `<span class="chip chip-light">${s}</span>`).join('')}</div>
    <p class="label">Відгуки · ${m.reviews}</p>
    <div class="card">
      ${m.feedback.map(([who, text]) => `
        <div class="review">
          <div class="review-head"><span>${who}</span><span class="rating">${stars()}5</span></div>
          <p>${text}</p>
        </div>`).join('')}
    </div>`;
  $('#profileChoose').textContent = `Обрати: ${m.short}`;
}

function choose(id) {
  S.chosen = id;
  const m = MASTERS[id];
  const when = id === 'oleg' ? whenText() : m.when.split(' · ')[0];
  const dur = id === 'oleg' ? durText() : m.when.split(' · ')[1];
  $('#confMaster').innerHTML = `
    <i class="av ${m.cls}">${m.initials}</i>
    <div>
      <p class="cand-name">${m.name} <svg class="ic"><use href="#i-shield"/></svg></p>
      <span class="rating">${stars()}${m.rating} <span class="muted">· ${m.reviews} відгуків</span></span>
    </div>`;
  $('#confWhen').textContent = when;
  $('#confDur').textContent = dur;
  resetChat();
  show('confirmed', 'right');
}

/* ============================================================
   Екран 10: чат
   ============================================================ */
function resetChat() {
  const m = MASTERS[S.chosen || 'oleg'];
  const when = (S.chosen || 'oleg') === 'oleg' ? whenText() : m.when.split(' · ')[0];
  S.chat = [
    { from: 'system', text: `Олексій обрав виконавцем: ${m.short}. Візит: ${when}` },
    { from: 'master', text: `Добрий день! Це ${m.short}, майстер. Буду ${when.toLowerCase().replace(',', ' о')}, вам зручно?`, t: '9:41' }
  ];
  S.chatReplied = 0;
}

function openChat(role, from) {
  S.chatRole = role;
  S.chatFrom = from;
  if (!S.chat.length) resetChat();
  const m = MASTERS[S.chosen || 'oleg'];
  if (role === 'client') {
    $('#chatAv').textContent = m.initials; $('#chatAv').className = `av ${m.cls}`;
    $('#chatName').textContent = m.name; $('#chatRoleTxt').textContent = 'майстер · онлайн';
  } else {
    $('#chatAv').textContent = 'ОК'; $('#chatAv').className = 'av av-client';
    $('#chatName').textContent = 'Олексій Коваленко'; $('#chatRoleTxt').textContent = 'клієнт · онлайн';
  }
  const quick = role === 'client'
    ? ['Так, підходить', 'А можна раніше?', 'Під\'їзд 2, код 45К']
    : ['Вже виїжджаю', 'Буду за 10 хв', 'Змішувач привезти свій?'];
  $('#quick').innerHTML = quick.map(q => `<button type="button">${q}</button>`).join('');
  renderChat();
  show('chat', 'right');
}

function renderChat() {
  const box = $('#chatBody');
  box.innerHTML = '<span class="day">Сьогодні</span>' + S.chat.map(msg => {
    if (msg.from === 'system') return `<div class="msg system">${msg.text}</div>`;
    const mine = msg.from === S.chatRole;
    return `<div class="msg ${mine ? 'me' : 'them'}">${msg.text}<small>${msg.t || '9:42'}</small></div>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
}

function sendMessage(text) {
  text = text.trim();
  if (!text) return;
  S.chat.push({ from: S.chatRole, text, t: '9:42' });
  renderChat();
  const other = S.chatRole === 'client' ? 'master' : 'client';
  const replies = other === 'master'
    ? ['Домовились! Якщо щось зміниться — напишу тут.', 'Добре, зрозумів.']
    : ['Чудово, чекаю!', 'Дякую, зрозуміло.'];
  const reply = replies[Math.min(S.chatReplied, replies.length - 1)];
  S.chatReplied++;
  later(() => { S.chat.push({ from: other, text: reply, t: '9:42' }); renderChat(); }, 1100);
}

/* ============================================================
   Тости-підказки
   ============================================================ */
let toastTimer;
function toast(text) {
  const t = $('#toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.hidden = true, 1800);
}

/* ============================================================
   Перехід із лівої панелі
   ============================================================ */
function goFromPanel(name) {
  clearTimers();
  closeOverlays(true);
  switch (name) {
    case 'details': openDetails('1024', 'fade'); break;
    case 'time': openDetails('1024', 'fade'); setTimeout(openSheet, 150); break;
    case 'unavailable': S.removed.delete('1019'); refreshList(); openDetails('1019', 'fade'); setTimeout(openUnavailable, 150); break;
    case 'accepted': $('#accWhen').textContent = `${whenText()} · ${durText()}`; show('accepted', 'fade'); break;
    case 'candidates': renderCandidates(); show('candidates', 'fade'); break;
    case 'profile': renderProfile(S.profile || 'oleg'); show('profile', 'fade'); break;
    case 'confirmed': choose(S.chosen || 'oleg'); break;
    case 'chat': if (!S.chosen) { S.chosen = 'oleg'; } if (!S.chat.length) resetChat(); openChat('client', 'confirmed'); break;
    case 'chosen': S.chosen = 'oleg'; $('#chosenWhen').textContent = whenText(); show('chosen', 'fade'); break;
    case 'notChosen': show('notChosen', 'fade'); break;
    case 'list': refreshList(); show('list', 'fade'); break;
    default: show(name, 'fade');
  }
}

/* «Далі за сценарієм» — основний шлях для показу на захисті */
function nextStep() {
  clearTimers();
  const sheetOpen = !$('#timeSheet').hidden;
  const modalOpen = !$('#unavailableModal').hidden;
  if (modalOpen) { closeUnavailable(); return; }
  switch (S.screen) {
    case 'lock': refreshList(); show('list', 'fade'); break;
    case 'list': case 'empty': S.removed.delete('1024'); refreshList(); openDetails('1024'); break;
    case 'details':
      if (!sheetOpen) { openSheet(); break; }
      S.dur = S.dur || '~1 год'; S.day = S.day || 'Сьогодні'; S.slot = S.slot || '16:00';
      updateSheet(); setTimeout(confirmTime, 350); break;
    case 'loading': case 'accepted': goClient(); break;
    case 'switch': show($('#switchText').textContent.includes('клієнта') ? 'clientPush' : (S.chosen === 'oleg' ? 'chosen' : 'notChosen'), 'fade'); break;
    case 'clientPush': renderCandidates(); show('candidates'); break;
    case 'candidates': choose('oleg'); break;
    case 'profile': choose(S.profile); break;
    case 'confirmed': case 'chat': goMaster(); break;
    case 'chosen': case 'notChosen': toast('Це кінець сценарію. «Почати спочатку» — щоб показати ще раз'); break;
  }
}

function closeUnavailable() {
  $('#unavailableModal').hidden = true;
  removeCard('1019');
  show('list', 'back');
}

function restart() {
  clearTimers();
  Object.assign(S, { req: '1024', dur: null, day: null, slot: null, chosen: null, profile: 'oleg', chat: [], chatReplied: 0 });
  S.removed.clear();
  refreshList();
  updateSheet();
  closeOverlays(true);
  show('lock', 'fade');
}

/* ============================================================
   Обробка кліків
   ============================================================ */
document.addEventListener('click', e => {
  const t = e.target;

  // ліва панель
  const li = t.closest('.screens li');
  if (li) return goFromPanel(li.dataset.go);

  // картка заявки у списку
  const card = t.closest('#cards .req-card');
  if (card) { clearTimers(); return openDetails(card.dataset.req); }

  // кандидати: «Обрати» або відкрити профіль
  const ch = t.closest('[data-choose]');
  if (ch) { clearTimers(); return choose(ch.dataset.choose); }
  const prof = t.closest('[data-profile]');
  if (prof) { renderProfile(prof.dataset.profile); return show('profile'); }

  // вибір чіпсів у нижній панелі
  const chip = t.closest('.chip-select');
  if (chip) { S[chip.parentElement.dataset.group] = chip.dataset.val; return updateSheet(); }

  // швидкі відповіді в чаті
  if (t.closest('#quick button')) return sendMessage(t.closest('#quick button').textContent);

  // підказки
  const tst = t.closest('[data-toast]');
  if (tst) return toast(tst.dataset.toast);

  // переходи data-go
  const go = t.closest('[data-go]');
  if (go) {
    clearTimers();
    const name = go.dataset.go;
    if (name === 'list') refreshList();
    if (name === 'candidates') renderCandidates();
    return show(name, go.dataset.anim || 'right');
  }

  // інші дії
  const act = t.closest('[data-action]');
  if (!act) return;
  switch (act.dataset.action) {
    case 'openFromPush': openDetails('1024', 'fade'); break;
    case 'accept': S.req === '1019' ? openUnavailable() : openSheet(); break;
    case 'ignore': { const id = S.req; show('list', 'back'); setTimeout(() => removeCard(id), 340); break; }
    case 'closeSheet': closeSheet(); break;
    case 'closeUnavailable': closeUnavailable(); break;
    case 'chatClient': openChat('client', 'confirmed'); break;
    case 'chatMaster': openChat('master', 'chosen'); break;
    case 'hidePush': act.classList.remove('show'); break;
  }
});

$('#confirmTime').addEventListener('click', confirmTime);
$('#profileChoose').addEventListener('click', () => choose(S.profile));
$('#chatBack').addEventListener('click', () => show(S.chatFrom, 'back'));
$('#chatForm').addEventListener('submit', e => { e.preventDefault(); sendMessage($('#chatText').value); $('#chatText').value = ''; });
$('#gallery').addEventListener('scroll', updateDots, { passive: true });
$('#nextStep').addEventListener('click', nextStep);
$('#restart').addEventListener('click', restart);

/* старт */
document.querySelectorAll('.app-name').forEach(el => el.textContent = APP_NAME);
refreshList();
show('lock', 'none');
