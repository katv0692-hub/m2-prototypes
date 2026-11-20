(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var fmt = function (n) { return n.toLocaleString('ru-RU').replace(/\u00a0/g, '\u2009').replace(/\u2009/g, ' '); };

/* ---------- Данные (reco.md, разделы 1, 2, 6.2) ---------- */
var S = {
  express: { n: 'Экспресс-проверка', d: 'Отчёт за 10 минут', p: 490, from: false, when: 'now' },
  lawyer:  { n: 'Проверка юристом', d: 'Юрист изучит документы, историю квартиры и продавца', p: 14900, from: false, when: 'now' },
  consult: { n: 'Консультация юриста', d: 'Разбор документов с юристом', p: 3000, from: false, when: 'now' },
  zs:      { n: 'Защита сделки', d: 'Гарантия 3 года: защитим в суде или вернём 100 % стоимости', p: 29900, from: true, when: 'now' },
  er:      { n: 'Электронная регистрация', d: 'Подача документов в Росреестр в электронном виде, подпись, менеджер', p: 8000, from: true, when: 'deal', set: 1 },
  sbr:     { n: 'Безопасные расчёты и регистрация', d: 'Электронная регистрация и деньги на спецсчёте ВТБ до регистрации', p: 9900, from: true, when: 'deal', set: 2 },
  turnkey: { n: 'Сделка под ключ', d: 'Расчёты и регистрация, договор, проверка квартиры и продавца, Защита сделки', p: 30590, from: true, when: 'deal', set: 3 },
  dkp:     { n: 'Договор купли-продажи', d: 'Юристы М2 составят договор под вашу сделку', p: 3000, from: false, plus: true, when: 'now' },
  ipo:     { n: 'Заявка на ипотеку в ВТБ через М2', d: 'Анкета из Госуслуг, чат с банком и менеджером', p: 0, free: true, when: 'now' }
};
function isPartner() { return !!(state.auth && state.auth.role === 'pro'); }
var priceTxt = function (k) {
  var s = S[k];
  if (s.free) return 'бесплатно';
  if (isPartner()) return 'Партнёрская цена';
  return (s.plus ? 'плюс ' : s.from ? 'от ' : '') + fmt(s.p) + ' ₽';
};

var WHY = {
  check: { t: 'Проверка квартиры и продавца', a: 'Юрист изучит документы, историю квартиры и продавца', b: 'От продавца-мошенника и сделки, которую потом оспорят', c: 'Вы узнаете только то, что есть в открытых реестрах' },
  dkp:   { t: 'Договор купли-продажи', a: 'Юристы М2 составят договор под вашу сделку', b: 'От ошибок, из-за которых сделку оспаривают', c: 'Договор придётся писать самим или по шаблону' },
  sbr:   { t: 'Безопасные расчёты', a: 'Деньги хранятся в ВТБ до регистрации. Это не счёт М2 и не счёт продавца', b: 'Продавец не получит деньги, пока квартира не станет вашей', c: 'Расчёты стороны проводят сами' },
  er:    { t: 'Регистрация в Росреестре онлайн', a: 'Менеджер проверит документы и подаст их в Росреестр, электронная подпись — в наборе', b: 'От лишних поездок в МФЦ и ошибок в документах', c: 'Документы подаёте сами через МФЦ' },
  zs:    { t: 'Защита сделки, 3 года', a: 'Гарантия на квартиру после покупки', b: 'Если сделку оспорят — защитим в суде или вернём 100 % стоимости; суд без доплат', c: 'Судиться придётся самим. Компенсацию от государства дают только после суда и по особым условиям' },
  ipo:   { t: 'Ипотека ВТБ через М2', a: 'Заявка в ВТБ из кабинета М2, чат с банком и менеджером', b: 'От разрыва между одобрением и сделкой: ипотека и сделка в одном кабинете', c: 'Заявку, сделку и расчёты собираете по отдельности' }
};

var TERMS = {
  egrn: { t: 'Выписка ЕГРН', d: 'Документ из Росреестра: кто собственник квартиры и есть ли на ней обременения' },
  pravo: { t: 'Переход права', d: 'Момент, когда Росреестр записывает квартиру на вас. После него продавец получает деньги' },
  spec: { t: 'Спецсчёт (номинальный счёт)', d: 'Счёт в ВТБ, где деньги покупателя хранятся до регистрации. Это не счёт М2 и не счёт продавца' },
  ukep: { t: 'УКЭП', d: 'Электронная подпись для договора. Её выпускает сотрудник банка на сделке, либо вы оформляете Госключ' },
  dkp: { t: 'ДКП', d: 'Договор купли-продажи квартиры' },
  zs: { t: 'Гарантия после покупки', d: 'Защита права на квартиру после покупки. У М2 это Защита сделки на 3 года' }
};

var RIB_BUY = [
  { icon: 'search', t: 'Выбрали квартиру', risk: 'Дом может быть аварийным или под реновацией, продавец может оказаться банкротом', svc: 'Бесплатная проверка: 6 параметров из 20. Экспресс-проверка — 490 ₽, отчёт за 10 минут', why: 'check', add: 'express' },
  { icon: 'shield-mint', t: 'Проверка', risk: 'Продавец может оказаться мошенником, а в реестрах видно не всё', svc: 'Проверка юристом — 14 900 ₽. Проверка с гарантией — Защита сделки от 29 900 ₽, отчёт за 2 рабочих дня', why: 'check', add: 'lawyer' },
  { icon: 'doc', t: 'Договор', risk: 'Ошибка в договоре — частая причина, по которой сделку оспаривают', svc: 'Договор купли-продажи от юристов М2 — плюс 3 000 ₽, только со Сделкой или Защитой сделки', why: 'dkp', add: 'dkp' },
  { icon: 'cards', t: 'Деньги', risk: 'Деньги могут уйти продавцу раньше, чем квартира станет вашей', svc: 'Безопасные расчёты: деньги хранятся в ВТБ до регистрации и уходят продавцу после неё. Набор «Безопасные расчёты и регистрация» — от 9 900 ₽', why: 'sbr', add: 'sbr' },
  { icon: 'house', t: 'Регистрация', risk: 'Ошибка в документах — и Росреестр приостановит регистрацию', svc: 'Регистрация в Росреестре онлайн: менеджер проверит документы, подача без МФЦ — от 8 000 ₽', why: 'er', add: 'er' },
  { icon: 'shield-orange', t: 'Переезд', risk: 'Сделку могут оспорить и после переезда — например, родственники продавца', svc: 'Защита сделки — гарантия 3 года: защитим в суде или вернём 100 % стоимости, суд без доплат', why: 'zs', add: 'zs' }
];
var RIB_SELL = [
  { icon: 'doc', t: 'Договор', risk: 'Ошибка в договоре — повод оспорить сделку', svc: 'Договор купли-продажи от юристов М2 — плюс 3 000 ₽. «Пригласить покупателя» — ссылка, по ней покупатель присоединяется к сделке', add: 'dkp' },
  { icon: 'cards', t: 'Деньги покупателя', risk: 'Подпишете договор, а покупатель не заплатит', svc: 'Деньги покупателя хранятся в ВТБ ещё до регистрации' },
  { icon: 'house', t: 'Регистрация', risk: 'Ошибка в документах — регистрацию приостановят', svc: 'Регистрация в Росреестре онлайн, без МФЦ' },
  { icon: 'shield-mint', t: 'Деньги вам', risk: 'Непонятно, когда придут деньги', svc: 'До трёх рабочих дней после регистрации, срок зависит от банка-получателя. Набор «Безопасные расчёты и регистрация» — от 9 900 ₽', add: 'sbr' }
];

var STEPS = [
  { t: 'Проверить квартиру и продавца', p: 'Экспресс-проверка, Проверка юристом, Защита сделки', c: 'от 490 ₽; 14 900 ₽; входит в «Сделку под ключ»', add: [['express', 'Экспресс-проверка'], ['lawyer', 'Проверка юристом']] },
  { t: 'Получить ипотеку, если нужна', p: 'Ипотека ВТБ через М2', c: 'подача заявки — бесплатно', add: [['ipo', 'Заявка в ВТБ']] },
  { t: 'Подготовить договор', p: 'Договор купли-продажи от юристов М2', c: 'плюс 3 000 ₽, только со Сделкой или Защитой сделки', add: [['dkp', 'Договор']] },
  { t: 'Подписать договор', p: 'Электронная подпись: выпускают в банке в день сделки или оформляют дистанционно', c: 'в наборах с регистрацией', add: [] },
  { t: 'Передать деньги', p: 'Безопасные расчёты: деньги на спецсчёте ВТБ до регистрации', c: 'входит в набор Сделки', add: [['sbr', 'Набор с расчётами']] },
  { t: 'Зарегистрировать право', p: 'Электронная регистрация', c: 'входит в набор Сделки', add: [['er', 'Электронная регистрация']] },
  { t: 'Защитить покупку после сделки', p: 'Защита сделки: гарантия 3 года', c: 'от 29 900 ₽ или в «Сделке под ключ»', add: [['zs', 'Защита сделки']] }
];

var SETS = [
  { k: 'er', items: [['Подача документов в Росреестр в электронном виде', 'er'], ['Электронная подпись', null], ['Менеджер', null]] },
  { k: 'sbr', items: [['Электронная регистрация', 'er'], ['Безопасные расчёты: деньги на спецсчёте ВТБ до регистрации', 'sbr']], note: 'Договор — плюс 3 000 ₽' },
  { k: 'turnkey', items: [['Безопасные расчёты и регистрация', 'sbr'], ['Договор купли-продажи', 'dkp'], ['Проверка квартиры и продавца', 'check'], ['Защита сделки, гарантия 3 года', 'zs']], trust: true }
];

var PRICE_ROWS = ['express', 'lawyer', 'consult', 'zs', 'er', 'sbr', 'turnkey', 'dkp', 'ipo'];
var PRICE_NOTE = { dkp: 'со Сделкой или Защитой сделки', ipo: 'только подача заявки' };

var TASKS = [
  { t: 'Купить квартиру', go: 'buy' },
  { t: 'Продать квартиру', go: 'sell', path: '/sdelka/?role=seller' },
  { t: 'Проверить квартиру', path: '/services/checkup/', name: 'Проверка квартиры' },
  { t: 'Взять ипотеку в ВТБ', path: '/ipoteka/vtb/', name: 'Ипотека ВТБ через М2' },
  { t: 'Подготовить договор', path: '/services/dkp/', name: 'Договор купли-продажи' },
  { t: 'Меня пригласили в сделку', path: '/services/deal/join', name: 'Приглашение в сделку', note: 'По ссылке из приглашения; без ссылки — «Войти» и кабинет' },
  { t: 'Я риелтор: сделка клиента', go: 'pro', path: '/rieltoram/' },
  { t: 'Вернуться к своей заявке', login: true, path: '/login/', name: 'Вход', note: 'После входа — последняя заявка' }
];

/* Таблица «запрос → страница», reco.md раздел 3 */
var SEARCH = [
  { k: ['купить квартиру', 'купить вторичку', 'хочу купить', 'вторичк', 'купить'], q: 'Хочу купить квартиру', page: 'Купить квартиру с М2', path: '/kupit-kvartiru/', here: '#top', mode: 'buy', read: 'Хаб «Как безопасно купить вторичку»', work: 'План «проверка → проверка с гарантией → сделка» и кнопка «Собрать покупку»; план можно получить в MAX или SMS' },
  { k: ['пригласили', 'приглашение'], q: 'Пригласили в сделку', page: 'Приглашение в сделку', path: '/services/deal/join', read: 'Справка «Вас пригласили в сделку»', work: '«Войти по телефону и принять приглашение»' },
  { k: ['продать', 'продаю', 'продавец получит', 'деньги продавцу'], q: 'Хочу продать квартиру', page: 'Сделка для продавца', path: '/sdelka/?role=seller', here: '#dengi', mode: 'sell', read: 'Статья о деньгах при продаже', work: 'Блок «Деньги продавцу»' },
  { k: ['проверить', 'проверка', 'обременен', 'егрн', 'выписка'], q: 'Как проверить квартиру', page: 'Проверка квартиры', path: '/services/checkup/', read: '«Проверка квартиры», статья «Что покажет выписка ЕГРН»', work: 'Поле «адрес или ссылка на объявление»' },
  { k: ['договор', 'задаток', 'дкп'], q: 'Договор купли-продажи', page: 'Договор купли-продажи', path: '/services/dkp/', read: 'Страница «Договор купли-продажи»', work: '«Скачать образец» · «Юрист подготовит договор»' },
  { k: ['безопасная сделка', 'с гарантией', 'гарантия', 'защита сделки'], q: 'Безопасная сделка', page: 'Защита сделки', path: '/services/guaranteed-deal/', read: 'Статья «Сделка с гарантией: 4 способа»', work: 'Калькулятор Защиты сделки' },
  { k: ['аккредитив', 'сбр', 'передать деньги', 'расчёт', 'расчет'], q: 'Аккредитив или СБР', page: 'Аккредитив или СБР', path: '/sdelka/akkreditiv-ili-sbr/', read: 'Статья о способах расчётов', work: 'Набор услуг Сделки' },
  { k: ['электронная регистрация', 'без мфц', 'мфц', 'регистрац'], q: 'Электронная регистрация', page: 'Электронная регистрация', path: '/sdelka/elektronnaya-registraciya/', read: 'Справка об электронной регистрации', work: '«Электронная регистрация» от 8 000 ₽' },
  { k: ['доли', 'доля', 'с детьми', 'маткапитал', 'другого города', 'другом городе'], q: 'Доли, с детьми, из другого города', page: 'Страницы видов сделок', path: '/sdelka/dolya/, /sdelka/matkapital/, /rieltoram/online-sdelka/transregional/', read: 'Статьи по ситуации', work: '«Такие сделки мы проводим»' },
  { k: ['ипотек', 'документы для ипотеки', 'втб'], q: 'Ипотека ВТБ', page: 'Ипотека ВТБ через М2', path: '/ipoteka/vtb/', read: 'Статья об ипотеке ВТБ через М2', work: 'Анкета и список документов' },
  { k: ['новостройки для риелторов', 'комиссия', 'кв ', 'm2pro', 'агентство', 'клиент'], q: 'Новостройки для риелторов', page: 'Новостройки в M2Pro', path: '/rieltoram/m2pro-novostroyki/', mode: 'pro', read: 'Справка M2Pro', work: 'Условия для риелторов в вашем городе — после входа' },
  { k: ['войти', 'статус', 'мои сделки', 'заявк'], q: 'Статус заявки', page: 'Вход и кабинет', path: '/login/', read: '—', work: 'После входа — трекер «Мои покупки и сделки»', login: true },
  { k: ['сколько стоит', 'цена', 'стоимость', 'цены'], q: 'Сколько стоит сделка', page: 'Купить квартиру с М2, цены', path: '/kupit-kvartiru/#nabory', here: '#nabory', read: 'Статья о цене покупки', work: 'Наборы с ценами и переключателем «Покупаю · Продаю · Я риелтор»' },
  { k: ['что такое м2', 'м2 и втб', 'о компании', 'кто вы'], q: 'Что такое М2', page: 'О компании', path: '/about/', read: 'Страница /about/', work: '—' }
];
var PRO_WORDS = ['клиент', 'кв', 'агентств'];

var FAQ = [
  { q: 'Как безопасно передать деньги продавцу — аккредитив или ячейка?', a: 'С М2 деньги лежат в ВТБ на номинальном счёте — это не счёт М2 и не счёт продавца. Продавец получит их, только когда квартира станет вашей.' },
  { q: 'Сделку зарегистрировали, а деньги продавцу не пришли', a: 'Не нужно ходить между банком и М2: напишите своему менеджеру в MAX или ВКонтакте — он сам выясняет с банком.' },
  { q: 'Электронная регистрация сделки: надо ли ехать в МФЦ?', a: 'Нет. Менеджер проверит документы и подаст их в Росреестр. Электронную подпись выпускают в банке в день сделки или оформляют дистанционно.' },
  { q: 'Можно купить квартиру в другом городе дистанционно?', a: 'Да. Цены одинаковые в офисе банка и дистанционно.' },
  { q: 'Нужна ли страховка квартиры, если есть Защита сделки?', a: 'Защита сделки — не страховка. Сначала юрист проверяет квартиру и продавца, а если сделку оспорят, М2 защитит в суде без доплат. Платите один раз — на 3 года, продлевать не нужно.' },
  { q: 'Не дозвониться до менеджера', a: 'Телефон М2 работает круглосуточно: +7 495 136-28-18. Во ВКонтакте бот отвечает сразу.' },
  { q: 'После сделки звонят с рекламой', a: 'Подборки и новости по умолчанию выключены. Звонки менеджера — только по вашему заказу, их можно выключить в «Настройках связи».' }
];

/* ---------- Состояние ---------- */
var MEM = {};
var LS = { get: function (k, d) { return k in MEM ? JSON.parse(MEM[k]) : d; },
           set: function (k, v) { MEM[k] = JSON.stringify(v); } };
var state = {
  mode: 'buy', ipo: false, proOpen: false,
  cart: LS.get('m2_cart', []),
  auth: LS.get('m2_auth', null),
  flow: 'cart', phone: '', pick: { step: 0, a: {} }, booked: LS.get('m2_booked', null), paid: LS.get('m2_paid', false)
};
var save = function () { LS.set('m2_cart', state.cart); LS.set('m2_auth', state.auth); LS.set('m2_booked', state.booked); LS.set('m2_paid', state.paid); };

/* ---------- Тост ---------- */
var tt;
function toast(msg) { var t = $('#toast'); t.textContent = msg; t.hidden = false; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.hidden = true; }, 250); }, 2600); }

/* ---------- Слои ---------- */
var lastFocus = null;
function openLayer(id) {
  closeAllLayers(id);
  lastFocus = document.activeElement;
  var L = $('#' + id); L.hidden = false;
  requestAnimationFrame(function () { L.classList.add('open'); var f = $('button, input, a', $('.panel, .drawer', L)); if (f) f.focus({ preventScroll: true }); });
  document.documentElement.classList.add('locked');
}
function closeLayer(L) {
  if (!L || L.hidden) return; L.classList.remove('open');
  setTimeout(function () { L.hidden = true; }, 200);
  if (!$$('.layer.open').filter(function (x) { return x !== L; }).length) document.documentElement.classList.remove('locked');
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
function closeAllLayers(except) { $$('.layer').forEach(function (L) { if (L.id !== except && !L.hidden) { L.classList.remove('open'); L.hidden = true; } }); }
document.addEventListener('click', function (e) { var c = e.target.closest('[data-close]'); if (c) closeLayer(c.closest('.layer')); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { $$('.layer.open').forEach(closeLayer); closeTasks(); hideSuggest(); hideTip(); } });

/* ---------- Режимы ---------- */
function setMode(m, scroll) {
  state.mode = m; document.body.dataset.mode = m;
  $$('[data-mode-btn]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.modeBtn === m ? 'true' : 'false'); });
  $$('[data-show]').forEach(function (el) { el.hidden = el.dataset.show.split(' ').indexOf(m) < 0; });
  // В «Я риелтор» объяснение свёрнуто
  $$('[data-explain]').forEach(function (el) {
    var allowed = el.dataset.show ? el.dataset.show.split(' ').indexOf(m) >= 0 : true;
    el.hidden = !allowed || (m === 'pro' && !state.proOpen);
  });
  // «Деньги продавцу» в режиме «Продаю» — вторым блоком
  var money = $('#dengi'), ribbon = $('#etapy'), nab = $('#nabory');
  if (m === 'sell') ribbon.parentNode.insertBefore(money, ribbon);
  else nab.parentNode.insertBefore(money, nab);
  $('#proFold').setAttribute('aria-expanded', state.proOpen ? 'true' : 'false');
  $('#proFold').textContent = state.proOpen ? 'Как объяснить клиенту — скрыть' : 'Как объяснить клиенту — показать';
  renderRibbon(); renderSets(); renderCalc(); renderSticky();
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}
$$('[data-mode-btn]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.modeBtn); }); });
$('#proFold').addEventListener('click', function () { state.proOpen = !state.proOpen; setMode('pro'); if (state.proOpen) $('#etapy').scrollIntoView({ behavior: 'smooth' }); });

/* ---------- «Зачем это?» ---------- */
function whyHTML(k) {
  var w = WHY[k]; if (!w) return '';
  return '<dl class="why-box"><div><dt>Что это</dt><dd>' + w.a + '</dd></div><div><dt>От чего защищает</dt><dd>' + w.b + '</dd></div><div><dt>Что будет без этого</dt><dd>' + w.c + '</dd></div></dl>';
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-why]'); if (!b) return;
  var box = b.parentNode.querySelector('.why-slot[data-for="' + b.dataset.whyId + '"]') || b.nextElementSibling;
  var open = b.getAttribute('aria-expanded') === 'true';
  b.setAttribute('aria-expanded', open ? 'false' : 'true');
  if (open) { box.innerHTML = ''; box.hidden = true; } else { box.innerHTML = whyHTML(b.dataset.why); box.hidden = false; }
});
var wid = 0;
function whyBtn(k) { if (!WHY[k] || state.mode === 'sell') return ''; wid++; return '<button type="button" class="why" data-why="' + k + '" data-why-id="w' + wid + '" aria-expanded="false">Зачем это?</button><div class="why-slot" data-for="w' + wid + '" hidden></div>'; }

/* ---------- Лента ---------- */
function renderRibbon() {
  var data = state.mode === 'sell' ? RIB_SELL : RIB_BUY;
  $('#ribbon').className = 'ribbon ' + (state.mode === 'sell' ? 'r4' : 'r6');
  $('#ribbon').innerHTML = data.map(function (s, i) {
    return '<li class="stage">' +
      '<div class="stage-top"><span class="stage-n">' + (i + 1) + '</span><img src="assets/icons/' + s.icon + '.svg" alt="" width="40" height="40"><span class="stage-t">' + s.t + '</span><span class="stage-risk">' + s.risk + '</span></div>' +
      '<div class="stage-svc"><p>' + s.svc + '</p>' +
      '<div class="stage-act">' + (s.add ? '<button type="button" class="lnk" data-add="' + s.add + '">Добавить в покупку</button>' : '') + (s.why ? whyBtn(s.why) : '') + '</div></div></li>';
  }).join('');
}

/* ---------- Наборы ---------- */
var recommended = null;
function renderSets() {
  var m = state.mode, list = m === 'sell' ? SETS.filter(function (s) { return s.k === 'sbr'; }) : SETS;
  $('#sets').className = 'sets' + (m === 'sell' ? ' sets-one' : '');
  $('#sets').innerHTML = list.map(function (st) {
    var s = S[st.k], inCart = state.cart.indexOf(st.k) >= 0, rec = recommended === st.k;
    return '<article class="set' + (rec ? ' rec' : '') + '" id="set-' + st.k + '">' +
      (rec ? '<p class="set-flag">Подходит вам по ответам</p>' : '') +
      '<h3>' + s.n + '</h3>' +
      '<ul class="set-items">' + st.items.map(function (it) { return '<li><span>' + it[0] + '</span>' + (it[1] && m !== 'sell' ? whyBtn(it[1]) : '') + '</li>'; }).join('') + '</ul>' +
      (st.note && m !== 'pro' ? '<p class="set-note">' + st.note + '</p>' : '') +
      '<div class="set-foot">' +
      (m === 'pro' && !isPartner() ? '<p class="set-pp">Партнёрские цены — после входа</p>' : '') +
      ('<p class="set-price">' + priceTxt(st.k) + '</p><div class="set-btns"><button type="button" class="btn" data-order="' + st.k + '">Заказать</button>' +
          '<button type="button" class="btn btn-sec" data-add="' + st.k + '"' + (inCart ? ' disabled' : '') + '>' + (inCart ? 'В покупке' : 'Добавить в покупку') + '</button></div>') +
      '</div></article>';
  }).join('');
}

/* ---------- Подбор ---------- */
var Q = [
  { t: 'Покупаете в ипотеку?', o: ['Да', 'Нет', 'Ещё не решил'] },
  { t: 'Квартира на вторичке или в новостройке?', o: ['Вторичка', 'Новостройка', 'Не знаю'] },
  { t: 'Кто проверит квартиру и подготовит договор?', o: ['Нужен юрист М2', 'Мой риелтор или юрист', 'Не знаю'] }
];
var REASONS = {
  turnkey: ['Юрист проверит квартиру и продавца и подготовит договор', 'Деньги хранятся в ВТБ, пока квартира не станет вашей', 'Если сделку оспорят в течение 3 лет — защитим в суде или вернём 100 % стоимости'],
  sbr: ['Деньги хранятся в ВТБ, пока квартира не станет вашей', 'Документы уйдут в Росреестр без МФЦ', 'Договор подготовим за 3 000 ₽, если понадобится']
};
function renderPicker() {
  var p = state.pick, el = $('#picker');
  if (p.step < 3) {
    var q = Q[p.step];
    el.innerHTML = '<p class="pk-prog">' + (p.step + 1) + ' из 3</p><p class="pk-q">' + q.t + '</p><div class="pk-opts">' +
      q.o.map(function (o) { return '<button type="button" class="opt' + (p.a[p.step] === o ? ' on' : '') + '" data-opt="' + o + '">' + o + '</button>'; }).join('') + '</div>' +
      (p.step > 0 ? '<button type="button" class="lnk pk-back" data-pk-back>Назад</button>' : '');
    return;
  }
  var a = p.a, set = a[2] === 'Мой риелтор или юрист' ? 'sbr' : 'turnkey';
  recommended = set; renderSets();
  var extra = [];
  if (a[0] === 'Да' || a[0] === 'Ещё не решил') extra.push('Подать заявку в ВТБ через М2 — бесплатно');
  var note = a[1] === 'Новостройка' ? '<p class="pk-warn">Наборы этой страницы — для вторички.</p>' : '';
  var realtor = set === 'sbr' ? '<p class="pk-hint">Работаете с риелтором? Передайте ему ссылку — он оформит набор в своём кабинете.</p>' : '';
  el.innerHTML = '<div class="pk-res">' + note + '<p class="pk-res-n">' + S[set].n + '</p><p class="pk-res-p">' + priceTxt(set) + '</p>' +
    '<p class="pk-res-h">Почему вам это нужно</p><ul>' + REASONS[set].map(function (r) { return '<li>' + r + '</li>'; }).join('') +
    extra.map(function (r) { return '<li>' + r + ' <button type="button" class="lnk" data-add="ipo">Добавить</button></li>'; }).join('') + '</ul>' + realtor +
    '<button type="button" class="btn btn-l btn-block" data-add="' + set + '">Добавить в покупку</button>' +
    '<div class="pk-res-links"><a class="lnk" href="#sets" data-see-sets>Посмотреть другие наборы</a><button type="button" class="lnk" data-pk-reset>Пройти заново</button></div></div>';
}
$('#picker').addEventListener('click', function (e) {
  var o = e.target.closest('[data-opt]'), p = state.pick;
  if (o) { p.a[p.step] = o.dataset.opt; p.step++; renderPicker(); var f = $('#picker button'); if (f) f.focus({ preventScroll: true }); return; }
  if (e.target.closest('[data-pk-back]')) { p.step = Math.max(0, p.step - 1); renderPicker(); return; }
  if (e.target.closest('[data-pk-reset]')) { state.pick = { step: 0, a: {} }; recommended = null; renderSets(); renderPicker(); return; }
  if (e.target.closest('[data-see-sets]')) { e.preventDefault(); $('#sets').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});

/* ---------- Калькулятор ---------- */
var calcSel = 'turnkey';
function renderCalc() {
  var keys = state.mode === 'sell' ? ['sbr'] : ['er', 'sbr', 'turnkey'];
  var pp = $('#calcPP'); if (pp) pp.hidden = state.mode !== 'pro' || isPartner();
  if (keys.indexOf(calcSel) < 0) calcSel = keys[keys.length - 1];
  var rows = keys.map(function (k) {
    return '<label class="calc-row"><input type="radio" name="calcSet" value="' + k + '"' + (k === calcSel ? ' checked' : '') + '><span class="calc-r"></span><span class="calc-n">' + S[k].n + '</span><b>' + priceTxt(k) + '</b></label>';
  });
  if (state.mode === 'sell') rows.push('<p class="calc-row calc-x"><span class="calc-n">Договор купли-продажи</span><b>плюс 3 000 ₽</b></p>');
  if (state.ipo && state.mode === 'buy') rows.push('<p class="calc-row calc-x ipo-li"><span class="calc-n">Заявка на ипотеку в ВТБ через М2</span><b>бесплатно</b></p>');
  $('#calcList').innerHTML = rows.join('');
  var inCart = state.cart.indexOf(calcSel) >= 0, a = $('#calcAdd');
  a.disabled = inCart; a.textContent = inCart ? 'В покупке' : 'Добавить в покупку';
}
$('#calcList').addEventListener('change', function (e) { if (e.target.name === 'calcSet') { calcSel = e.target.value; renderCalc(); } });
$('#calcAdd').addEventListener('click', function () { var extra = state.ipo && state.mode === 'buy'; addToCart(calcSel, true); if (extra) addToCart('ipo', true); openCart('added'); });
$('#calcOrder').addEventListener('click', function () { if (state.ipo && state.mode === 'buy') addToCart('ipo', true); addToCart(calcSel, true); openCart(state.auth ? 'cart' : 'phone'); });
$('#ipoSw').addEventListener('change', function () { state.ipo = this.checked; renderCalc(); renderRibbon(); });
$('#flatPrice').addEventListener('input', function () {
  var d = this.value.replace(/\D/g, '').slice(0, 11); this.value = d ? fmt(+d) : '';
});

/* ---------- Словарь и подсказки ---------- */
var tip = null, tipEl = null, tipClick = false;
function showTip(el) {
  hideTip(); var k = el.dataset.term; if (!TERMS[k]) return; tipEl = el;
  tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip');
  tip.innerHTML = '<b>' + TERMS[k].t + '</b>' + TERMS[k].d; document.body.appendChild(tip);
  var r = el.getBoundingClientRect(), w = Math.min(300, window.innerWidth - 32);
  tip.style.width = w + 'px';
  var left = Math.max(16, Math.min(window.innerWidth - w - 16, r.left + r.width / 2 - w / 2));
  tip.style.left = left + 'px'; tip.style.top = (r.bottom + window.scrollY + 8) + 'px';
}
function hideTip() { if (tip) { tip.remove(); tip = null; } tipEl = null; tipClick = false; }
document.addEventListener('mouseover', function (e) { var t = e.target.closest('.term'); if (t && tipEl !== t) showTip(t); });
document.addEventListener('mouseout', function (e) { if (e.target.closest('.term') && !tipClick) hideTip(); });
document.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('.term'); if (t && tipEl !== t) showTip(t); });
document.addEventListener('focusout', function (e) { if (e.target.closest && e.target.closest('.term') && !tipClick) hideTip(); });
document.addEventListener('click', function (e) { var t = e.target.closest('.term'); if (t) { e.preventDefault(); if (tip && tipEl === t && tipClick) hideTip(); else { if (tipEl !== t) showTip(t); tipClick = true; } } else if (!e.target.closest('.tip')) hideTip(); }, true);
window.addEventListener('scroll', hideTip, { passive: true });

/* ---------- FAQ ---------- */
function renderFaq() {
  $('#faqList').innerHTML = FAQ.map(function (f, i) {
    return '<div class="fq"><button type="button" class="fq-q" aria-expanded="false" aria-controls="fq' + i + '">' + f.q + '</button><p class="fq-a" id="fq' + i + '" hidden>' + f.a + '</p></div>';
  }).join('');
}
$('#faqList').addEventListener('click', function (e) {
  var b = e.target.closest('.fq-q'); if (!b) return; var o = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', o); b.nextElementSibling.hidden = !o;
});

/* ---------- Корзина: логика ---------- */
var SETKEYS = ['er', 'sbr', 'turnkey'];
var hasDeal = function (c) { return c.some(function (k) { return SETKEYS.indexOf(k) >= 0 || k === 'zs'; }); };
function addToCart(k, silent) {
  var c = state.cart, msg = '';
  if (c.indexOf(k) >= 0) { if (!silent) toast('Уже в покупке: ' + S[k].n); return false; }
  if (k === 'dkp' && c.indexOf('turnkey') >= 0) { toast('Договор уже входит в «Сделку под ключ»'); return false; }
  if (k === 'zs' && c.indexOf('turnkey') >= 0) { toast('Защита сделки уже входит в «Сделку под ключ»'); return false; }
  if (SETKEYS.indexOf(k) >= 0) {
    var prev = c.filter(function (x) { return SETKEYS.indexOf(x) >= 0; });
    if (prev.length) msg = '«' + S[prev[0]].n + '» заменён на «' + S[k].n + '»';
    c = c.filter(function (x) { return SETKEYS.indexOf(x) < 0; });
    if (k === 'turnkey') c = c.filter(function (x) { return x !== 'zs' && x !== 'dkp' && x !== 'lawyer'; });
  }
  c.push(k); state.cart = c; state.paid = false; save(); refreshCart();
  return msg || true;
}
function removeFromCart(k) { state.cart = state.cart.filter(function (x) { return x !== k; }); save(); refreshCart(); }
function total(keys) { return keys.reduce(function (s, k) { return s + S[k].p; }, 0); }
function anyFrom(keys) { return keys.some(function (k) { return S[k].from; }); }
function plural(n) { var m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? 'услуга' : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? 'услуги' : 'услуг'; }
function sumTxt(keys) { if (isPartner() && total(keys) > 0) return 'по партнёрским условиям'; var t = total(keys); return (anyFrom(keys) ? 'от ' : '') + fmt(t) + ' ₽'; }
function suggestTurnkey(c) {
  if (c.indexOf('turnkey') >= 0) return false;
  var parts = ['sbr', 'er', 'dkp', 'lawyer', 'zs', 'express'];
  return c.filter(function (k) { return parts.indexOf(k) >= 0; }).length >= 2 && c.some(function (k) { return k === 'sbr' || k === 'er'; });
}

document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-add]');
  if (a) {
    var r = addToCart(a.dataset.add);
    if (r) { openCart('added', typeof r === 'string' ? r : ''); }
    return;
  }
  var o = e.target.closest('[data-order]');
  if (o) { addToCart(o.dataset.order, true); openCart(state.auth ? 'cart' : 'phone'); return; }
  if (e.target.closest('[data-open-cart]')) { openCart('cart'); return; }
  if (e.target.closest('[data-login]')) { if (state.auth) { openCart('account'); } else openCart('phone', '', true); return; }
  if (e.target.closest('[data-pro-login]')) { setMode('pro'); if (state.auth) openCart('cart'); else openCart('phone', '', true, 'pro'); return; }
});

function refreshCart() {
  var n = state.cart.length;
  $$('[data-cart-count]').forEach(function (x) { x.textContent = n; x.classList.toggle('has', n > 0); });
  $('.cart-btn').setAttribute('aria-label', 'Моя покупка, услуг: ' + n);
  renderSets(); renderCalc(); renderSticky();
  if (!$('#cart').hidden) renderDrawer();
}

/* ---------- Корзина: блок на странице ---------- */
function cartListHTML(editable) {
  var c = state.cart, now = c.filter(function (k) { return S[k].when === 'now'; }), deal = c.filter(function (k) { return S[k].when === 'deal'; });
  var row = function (k) {
    var bad = k === 'dkp' && !hasDeal(c);
    return '<li class="ci' + (bad ? ' ci-bad' : '') + '"><div class="ci-t"><b>' + S[k].n + '</b><span>' + (bad ? 'Договор готовим в Сделке или Защите сделки — добавьте одну из них' : S[k].d) + '</span>' +
      (bad ? '<button type="button" class="lnk" data-add="sbr">Добавить Сделку</button>' : '') + '</div><div class="ci-p">' + priceTxt(k) + '</div>' +
      (editable ? '<button type="button" class="ci-x" data-rm="' + k + '" aria-label="Убрать: ' + S[k].n + '">Убрать</button>' : '') + '</li>';
  };
  var h = '';
  if (now.length) h += '<div class="cgrp"><p class="cgrp-h">Оплатить сейчас <span>' + sumTxt(now) + '</span></p><ul class="clist">' + now.map(row).join('') + '</ul></div>';
  if (deal.length) h += '<div class="cgrp"><p class="cgrp-h">Оплатить на сделке <span>' + sumTxt(deal) + '</span></p><ul class="clist">' + deal.map(row).join('') + '</ul>' +
    '<p class="cgrp-n">Сервис безопасных расчётов и электронная регистрация оплачиваются на сделке. Договор купли-продажи оплачивается до сделки.</p></div>';
  if (suggestTurnkey(c)) h += '<div class="c-sug"><p>Эти услуги входят в «Сделку под ключ»' + (isPartner() ? '' : ' — от 30 590 ₽') + '. Заменить?</p><button type="button" class="btn btn-sm btn-sec" data-add="turnkey">Заменить</button></div>';
  if (c.indexOf('express') >= 0 || c.indexOf('lawyer') >= 0) h += '<p class="c-tip">Если проверка найдёт риск, юрист объяснит, что делать.</p>';
  if (isPartner()) h += '<p class="c-tip">Пример: цены после входа меняются на партнёрские.</p>';
  h += '<div class="c-total"><span>Итого</span><b>' + sumTxt(c) + '</b></div>';
  return h;
}
function emptyHTML() {
  return '<div class="c-empty"><p class="c-empty-t">В покупке пока ничего нет. С чего начать?</p><div class="c-empty-b">' +
    '<button type="button" class="btn btn-sec" data-add="express">Проверить квартиру' + (isPartner() ? '' : ' — от 490 ₽') + '</button>' +
    '<a class="btn btn-sec" href="#nabory" data-close>Выбрать набор для сделки</a>' +
    '<a class="btn btn-sec" href="#etapy" data-close>Посмотреть весь путь покупки</a></div></div>';
}
document.addEventListener('click', function (e) {
  var r = e.target.closest('[data-rm]'); if (r) { removeFromCart(r.dataset.rm); return; }
  if (e.target.closest('[data-checkout]')) { openCart(state.auth ? 'pay' : 'phone'); }
});

/* ---------- Корзина: шторка ---------- */
var flowCtx = { note: '', loginOnly: false, role: null, code: '' };
function openCart(flow, note, loginOnly, role) {
  state.flow = flow || 'cart'; flowCtx.note = note || ''; flowCtx.loginOnly = !!loginOnly; flowCtx.roleHint = role || null;
  renderDrawer(); openLayer('cart');
}
function setFlow(f) { state.flow = f; renderDrawer(); var b = $('#drBody'); b.scrollTop = 0; var i = $('input, button', b); if (i) i.focus({ preventScroll: true }); }

function renderDrawer() {
  var b = $('#drBody'), c = state.cart, f = state.flow, h = '';
  var summary = c.length ? '<p class="dr-sum">' + c.length + ' ' + plural(c.length) + ' · ' + sumTxt(c) + '</p>' : '';
  if (f === 'added' || f === 'cart') {
    if (f === 'added') h += '<div class="dr-added"><b>Добавлено.</b> Моя покупка: ' + c.length + ' ' + plural(c.length) + ' · ' + sumTxt(c) + (flowCtx.note ? '<br><span>' + flowCtx.note + '</span>' : '') + '</div>';
    if (!c.length) { h += emptyHTML(); }
    else {
      h += cartListHTML(true);
      h += '<div class="dr-add"><p class="dr-add-h">Добавить к покупке</p><div class="chips">' +
        ['express', 'lawyer', 'zs', 'dkp', 'consult', 'ipo'].filter(function (k) { return c.indexOf(k) < 0 && !(c.indexOf('turnkey') >= 0 && (k === 'zs' || k === 'dkp' || k === 'lawyer')); })
          .map(function (k) { return '<button type="button" class="chip" data-add="' + k + '">' + S[k].n + '</button>'; }).join('') + '</div></div>';
      if (state.auth) {
        h += '<div class="dr-cta"><p class="dr-who">Ваша покупка · ' + c.length + ' ' + plural(c.length) + ' · ' + sumTxt(c) + '</p>' +
          '<button type="button" class="btn btn-l btn-block" data-go="pay">Оплатить сейчас</button>' +
          (c.some(function (k) { return S[k].when === 'deal'; }) ? '<button type="button" class="btn btn-l btn-sec btn-block" data-go="book">Забронировать дату — без оплаты</button>' : '') +
          '<button type="button" class="lnk" data-go="manager">Сначала поговорить с менеджером</button></div>';
      } else {
        h += '<div class="dr-cta"><p class="dr-guest">Войдите по телефону, чтобы сохранить покупку и вернуться к ней с любого устройства.</p>' +
          '<button type="button" class="btn btn-l btn-block" data-go="phone">Войти и оформить</button>' +
          (f === 'added' ? '<button type="button" class="lnk" data-close>Продолжить выбор</button>' : '') + '</div>';
      }
      if (state.booked) h += '<p class="dr-booked">Дата сделки забронирована: ' + state.booked + '. <button type="button" class="lnk" data-unbook>Снять бронь</button></p>';
    }
  }
  else if (f === 'phone') {
    var pro = flowCtx.roleHint === 'pro';
    h += (c.length && !flowCtx.loginOnly ? summary : '') +
      '<h3 class="dr-h">' + (pro ? 'Вход для риелтора' : 'Вход по телефону') + '</h3>' +
      '<p class="dr-p">' + (c.length ? 'Покупка не потеряется: после входа она будет в кабинете.' : 'Окна выбора роли нет: один номер — одна роль.') + (pro ? ' Риелторам после входа цены в покупке меняются на партнёрские.' : '') + '</p>' +
      '<form class="dr-form" data-form="phone"><label class="fld"><span>Телефон</span><input type="tel" inputmode="tel" id="ph" placeholder="+7 900 000-00-00" value="' + (state.phone || '+7 ') + '" aria-describedby="phHelp" required></label>' +
      '<p class="dr-err" id="phErr" hidden>Введите номер полностью: 10 цифр после +7</p>' +
      '<button class="btn btn-l btn-block" type="submit">Получить код</button></form>' +
      '<button type="button" class="btn btn-l btn-sec btn-block" data-go="vtbid">Войти через ВТБ ID</button>' +
      '<p class="dr-small" id="phHelp">Не получается войти? Напишите в <button type="button" class="lnk" data-ch="max">MAX</button> или <button type="button" class="lnk" data-ch="vk">ВКонтакте</button></p>' +
      (c.length && !flowCtx.loginOnly ? '<button type="button" class="lnk dr-back" data-go="cart">Назад к покупке</button>' : '');
  }
  else if (f === 'code') {
    h += '<h3 class="dr-h">Код из SMS</h3><p class="dr-p">Отправили на ' + state.phone + '. Код подставится сам.</p>' +
      '<form class="dr-form" data-form="code"><label class="fld"><span>Код</span><input type="text" inputmode="numeric" id="code" maxlength="4" autocomplete="one-time-code" value=""></label>' +
      '<button class="btn btn-l btn-block" type="submit">Войти</button></form>' +
      '<button type="button" class="lnk dr-back" data-go="phone">Изменить номер</button>';
    setTimeout(function () { var i = $('#code'); if (i && !i.value) { i.value = '4821'; i.dispatchEvent(new Event('input', { bubbles: true })); } }, 900);
  }
  else if (f === 'role') {
    h += '<h3 class="dr-h">Что будете делать на М2?</h3><p class="dr-p">Номер новый — выберите один раз. Покупка сохранится.</p>' +
      '<div class="roles">' +
      [['buy', 'Покупаю квартиру'], ['sell', 'Продаю квартиру'], ['pro', 'Я риелтор']].map(function (r) {
        return '<button type="button" class="role' + (flowCtx.roleHint === r[0] ? ' on' : '') + '" data-role="' + r[0] + '">' + r[1] + '</button>';
      }).join('') + '</div>' +
      '<label class="fld"><span>Как к вам обращаться</span><input type="text" id="fio" placeholder="Имя и фамилия"></label>' +
      '<label class="chk"><input type="checkbox" id="pd" checked><span>Согласен на обработку персональных данных</span></label>' +
      '<button type="button" class="btn btn-l btn-block" data-go="channels" id="roleNext"' + (flowCtx.roleHint ? '' : ' disabled') + '>Дальше</button>';
  }
  else if (f === 'channels') {
    var ch = (state.auth && state.auth.ch) || 'max';
    h += '<h3 class="dr-h">Как с вами связываться</h3>' +
      '<div class="cset"><p class="cset-h">Статусы заказа</p><div class="seg" role="radiogroup" aria-label="Канал для статусов заказа">' +
      [['max', 'MAX'], ['vk', 'ВКонтакте'], ['sms', 'SMS'], ['mail', 'почта']].map(function (x) {
        return '<label class="seg-o"><input type="radio" name="stch" value="' + x[0] + '"' + (ch === x[0] ? ' checked' : '') + '><span>' + x[1] + '</span></label>';
      }).join('') + '</div></div>' +
      '<label class="tgl"><input type="checkbox" id="callsOk" checked><span class="sw-t" aria-hidden="true"></span><span class="tgl-t">Звонки менеджера по моему заказу</span></label>' +
      '<label class="tgl"><input type="checkbox" id="newsOk"><span class="sw-t" aria-hidden="true"></span><span class="tgl-t">Подборки и новости</span></label>' +
      '<p class="dr-small">Изменить можно в кабинете, в «Настройках связи».</p>' +
      '<button type="button" class="btn btn-l btn-block" data-save-ch>Сохранить</button>';
  }
  else if (f === 'pay') {
    var now = c.filter(function (k) { return S[k].when === 'now'; }), deal = c.filter(function (k) { return S[k].when === 'deal'; });
    h += '<h3 class="dr-h">Оплата</h3>' +
      (now.length ? '<div class="pay-blk"><p class="pay-h">Сейчас</p><p class="pay-l">' + now.map(function (k) { return S[k].n; }).join(', ') + '</p><p class="pay-s">' + sumTxt(now) + '</p></div>' : '') +
      (deal.length ? '<div class="pay-blk pay-later"><p class="pay-h">На сделке</p><p class="pay-l">' + deal.map(function (k) { return S[k].n; }).join(', ') + '</p><p class="pay-s">' + sumTxt(deal) + '</p></div>' : '') +
      (now.length ? '<p class="cset-h">Способ оплаты</p><div class="seg seg-2" role="radiogroup" aria-label="Способ оплаты">' +
        ['СБП', 'SberPay', 'Mir Pay', 'Карта'].map(function (x, i) { return '<label class="seg-o"><input type="radio" name="pm"' + (i === 0 ? ' checked' : '') + '><span>' + x + '</span></label>'; }).join('') + '</div>' +
        '<button type="button" class="btn btn-l btn-block" data-pay>Оплатить ' + sumTxt(now).replace(/^от /, '') + '</button>' +
        '<button type="button" class="lnk" data-go="payfail">Так выглядит ошибка оплаты</button>'
        : '<p class="dr-p">Сейчас платить ничего не нужно: услуги этой покупки оплачиваются на сделке.</p>') +
      (deal.length ? '<button type="button" class="btn btn-l btn-sec btn-block" data-go="book">Забронировать дату — без оплаты</button>' : '') +
      '<button type="button" class="lnk dr-back" data-go="cart">Назад к покупке</button>';
  }
  else if (f === 'payfail') {
    h += '<div class="dr-fail"><h3 class="dr-h">Оплата не прошла</h3><p class="dr-p">Покупка сохранена — попробуйте ещё раз или выберите другой способ.</p></div>' + summary +
      '<button type="button" class="btn btn-l btn-block" data-go="pay">Повторить</button><button type="button" class="btn btn-l btn-sec btn-block" data-go="pay">Другой способ</button>' +
      '<button type="button" class="lnk" data-ch="mail">Написать в поддержку</button>';
  }
  else if (f === 'book') {
    var days = [], d = new Date(); d.setDate(d.getDate() + 2);
    for (var i = 0; i < 6; i++) { var x = new Date(d); x.setDate(d.getDate() + i); days.push(x); }
    h += '<h3 class="dr-h">Забронировать дату сделки</h3><p class="dr-p">Без оплаты. Менеджер позвонит и подтвердит время.</p>' +
      '<div class="days" role="radiogroup" aria-label="Дата сделки">' + days.map(function (x, i) {
        var t = x.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' });
        return '<label class="seg-o day"><input type="radio" name="day" value="' + t + '"' + (i === 0 ? ' checked' : '') + '><span>' + t + '</span></label>';
      }).join('') + '</div>' +
      '<p class="dr-small">Даты в прототипе — пример.</p>' +
      '<button type="button" class="btn btn-l btn-block" data-book>Забронировать</button><button type="button" class="lnk dr-back" data-go="cart">Назад к покупке</button>';
  }
  else if (f === 'done') {
    h += '<div class="dr-ok"><h3 class="dr-h">' + (state.paid ? 'Заказ принят' : 'Дата забронирована') + '</h3>' +
      (state.booked && !state.paid ? '<p class="dr-p">' + state.booked + '. Оплата услуг — на сделке.</p>' : '') +
      '<p class="cset-h">Что дальше</p><ol class="next"><li>Менеджер свяжется с вами.</li><li>Загрузите паспорт — фото с камеры.</li><li>Пригласите продавца по ссылке.</li></ol>' +
      '<p class="dr-small">Статусы придут в ' + ({ max: 'MAX', vk: 'ВКонтакте', sms: 'SMS', mail: 'почту' }[(state.auth && state.auth.ch) || 'max']) + '. <button type="button" class="lnk" data-go="channels">Изменить</button></p>' +
      '<div class="mx-statuses"><p class="cset-h">Какие статусы придут</p><ul><li>Заказ принят. Ваш менеджер — имя менеджера</li><li>Деньги поступили на номинальный счёт в ВТБ</li><li>Документы отправлены в Росреестр</li><li>Право зарегистрировано</li><li>Деньги переведены продавцу</li></ul></div>' +
      '<button type="button" class="btn btn-l btn-block" data-close>Готово</button></div>';
  }
  else if (f === 'manager') {
    h += '<h3 class="dr-h">Сначала поговорить с менеджером</h3><p class="dr-p">Покупка сохранена. Куда прислать ответ:</p>' +
      '<div class="help-ch">' + ['max|Написать в MAX', 'vk|Написать во ВКонтакте', 'call|Перезвоните мне', 'mail|Прислать на почту'].map(function (x) { var p = x.split('|'); return '<button type="button" class="ch-row" data-ch="' + p[0] + '"><b>' + p[1] + '</b></button>'; }).join('') + '</div>' +
      '<button type="button" class="lnk dr-back" data-go="cart">Назад к покупке</button>';
  }
  else if (f === 'account') {
    var a = state.auth;
    h += '<h3 class="dr-h">Вы вошли</h3><p class="dr-p">' + a.phone + ' · ' + ({ buy: 'Покупаю квартиру', sell: 'Продаю квартиру', pro: 'Риелтор' }[a.role]) + '</p>' +
      (a.role === 'pro' ? '<label class="fld"><span>Промокод партнёра</span><input type="text" placeholder="Введите промокод"></label>' : '') +
      '<button type="button" class="btn btn-l btn-sec btn-block" data-go="channels">Настройки связи</button>' +
      '<button type="button" class="btn btn-l btn-sec btn-block" data-go="cart">Моя покупка</button>' +
      '<button type="button" class="lnk" data-logout>Выйти</button>';
  }
  b.innerHTML = h;
  $('[data-cart-count]').textContent = c.length;
}

$('#drBody').addEventListener('click', function (e) {
  var g = e.target.closest('[data-go]');
  if (g) {
    var to = g.dataset.go;
    if (to === 'vtbid') { toast('ВТБ ID в прототипе ведёт к тому же входу по коду'); to = 'phone'; return; }
    if ((to === 'pay' || to === 'book') && !state.auth) { setFlow('phone'); return; }
    setFlow(to); return;
  }
  var r = e.target.closest('[data-role]');
  if (r) { $$('.role', $('#drBody')).forEach(function (x) { x.classList.toggle('on', x === r); }); flowCtx.roleHint = r.dataset.role; $('#roleNext').disabled = false; return; }
  if (e.target.closest('[data-save-ch]')) {
    var v = ($('input[name="stch"]:checked') || {}).value || 'max';
    state.auth.ch = v; state.auth.calls = $('#callsOk').checked; state.auth.news = $('#newsOk').checked; save(); updLogin();
    toast('Настройки связи сохранены');
    if (flowCtx.loginOnly && !state.cart.length) { setFlow('account'); return; }
    setFlow('cart'); return;
  }
  if (e.target.closest('[data-pay]')) { state.paid = true; save(); setFlow('done'); return; }
  if (e.target.closest('[data-book]')) { var d = $('input[name="day"]:checked'); state.booked = d ? d.value : ''; save(); setFlow('done'); return; }
  if (e.target.closest('[data-unbook]')) { state.booked = null; save(); toast('Бронь снята'); renderDrawer(); return; }
  if (e.target.closest('[data-logout]')) { state.auth = null; save(); updLogin(); refreshCart(); setFlow('cart'); return; }
});
$('#drBody').addEventListener('submit', function (e) {
  e.preventDefault(); var f = e.target.dataset.form;
  if (f === 'phone') {
    var v = $('#ph').value, d = v.replace(/\D/g, '');
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    if (d.length !== 10) { $('#phErr').hidden = false; $('#ph').setAttribute('aria-invalid', 'true'); return; }
    state.phone = '+7 ' + d.slice(0, 3) + ' ' + d.slice(3, 6) + '-' + d.slice(6, 8) + '-' + d.slice(8); setFlow('code');
  }
  if (f === 'code') {
    var c = $('#code').value.replace(/\D/g, ''); if (c.length < 4) { toast('Введите 4 цифры кода'); return; }
    state.auth = { phone: state.phone, role: null, ch: 'max' }; save(); setFlow('role');
  }
});
$('#drBody').addEventListener('input', function (e) {
  if (e.target.id === 'ph') { var d = e.target.value.replace(/[^\d+ \-()]/g, ''); e.target.value = d; $('#phErr').hidden = true; }
  if (e.target.id === 'code' && e.target.value.replace(/\D/g, '').length === 4) { setTimeout(function () { var fm = $('[data-form="code"]'); if (fm) fm.requestSubmit(); }, 300); }
});
document.addEventListener('click', function (e) {
  if (e.target.id === 'roleNext' || e.target.closest('#roleNext')) {
    state.auth.role = flowCtx.roleHint; state.auth.name = ($('#fio') || {}).value || ''; save();
    if (state.auth.role !== state.mode) setMode(state.auth.role); else refreshCart();
  }
}, true);

function updLogin() { $('[data-login-lbl]').textContent = state.auth ? 'Кабинет' : 'Войти'; }

/* ---------- Липкая кнопка (телефон) ---------- */
function renderSticky() {
  var b = $('#stickyBtn'), c = state.cart;
  if (c.length) { b.textContent = 'Моя покупка · ' + sumTxt(c); b.dataset.act = 'cart'; }
  else { b.textContent = state.mode === 'sell' ? 'Создать сделку продажи' : 'Выбрать набор'; b.dataset.act = state.mode === 'sell' ? 'sell' : 'sets'; }
}
$('#stickyBtn').addEventListener('click', function () {
  var a = this.dataset.act;
  if (a === 'cart') openCart('cart');
  else if (a === 'sell') { addToCart('sbr', true); openCart('added'); }
  else $('#nabory').scrollIntoView({ behavior: 'smooth' });
});
var heroEl = $('.hero');
function stickyVis() { var r = heroEl.getBoundingClientRect(); document.body.classList.toggle('past-hero', r.bottom < 80); }
window.addEventListener('scroll', stickyVis, { passive: true });

/* ---------- Каналы связи ---------- */
var CH = {
  max: 'MAX — частным лицам. Откроется чат М2 в MAX',
  'max-pro': 'MAX — риелторам: max.ru/m2rieltor',
  vk: 'ВКонтакте: vk.ru/metr_kvadratnyy — бот ответит сразу',
  mail: 'Почта поддержки: support@team-m2.ru',
  call: '+7 495 136-28-18 — круглосуточно',
  chat: 'Откроется чат на сайте',
  tg: 'Telegram: t.me/metrkvadratny — новости и разборы. Вопросы задавайте в MAX или ВКонтакте'
};
document.addEventListener('click', function (e) {
  var c = e.target.closest('[data-ch]'); if (!c) return; e.preventDefault();
  var inHelp = c.closest('#help');
  if (inHelp) { var n = $('#helpNote'); n.textContent = 'Тема: ' + $('#helpTopics .on').textContent + '. ' + CH[c.dataset.ch] + '.'; n.hidden = false; return; }
  toast(CH[c.dataset.ch]);
});
document.addEventListener('click', function (e) { if (e.target.closest('[data-open-help]')) { $('#helpNote').hidden = true; openLayer('help'); } });
$('#helpTopics').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; $$('#helpTopics .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); });

/* ---------- Внешние страницы сайта ---------- */
document.addEventListener('click', function (e) {
  var x = e.target.closest('[data-ext]'); if (!x) return; e.preventDefault();
  showAnswer({ ext: true, page: x.textContent.trim(), path: x.dataset.ext });
});

/* ---------- Меню «Что вы хотите сделать?» ---------- */
function taskHTML() { return TASKS.map(function (t, i) { return '<button type="button" role="menuitem" class="task" data-task="' + i + '">' + t.t + '</button>'; }).join(''); }
$('#tasksMenu').innerHTML = taskHTML(); $('#mmenuTasks').innerHTML = taskHTML();
function closeTasks() { $('#tasksMenu').hidden = true; $('#tasksBtn').setAttribute('aria-expanded', 'false'); }
$('#tasksBtn').addEventListener('click', function (e) { e.stopPropagation(); var o = $('#tasksMenu').hidden; $('#tasksMenu').hidden = !o; this.setAttribute('aria-expanded', o); if (o) $('#tasksMenu .task').focus(); });
document.addEventListener('click', function (e) { if (!e.target.closest('.tasks')) closeTasks(); if (!e.target.closest('.search')) hideSuggest(); });
$('#tasksMenu').addEventListener('keydown', function (e) {
  var items = $$('.task', this), i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
});
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-task]'); if (!t) return;
  var task = TASKS[+t.dataset.task]; closeTasks(); closeMenu();
  if (task.go) { setMode(task.go, true); toast(task.go === 'buy' ? 'Вы на странице «Купить квартиру с М2»' : task.go === 'sell' ? 'Режим «Продаю». Полная страница для продавца — ' + task.path : 'Режим «Я риелтор». Страница для риелторов — ' + task.path); return; }
  if (task.login) { if (state.auth) openCart('account'); else openCart('phone', '', true); return; }
  showAnswer({ ext: true, page: task.name, path: task.path, note: task.note });
});

/* ---------- Мобильное меню ---------- */
function closeMenu() { $('#mmenu').hidden = true; $('#burger').setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('mlocked'); }
$('#burger').addEventListener('click', function () { var o = $('#mmenu').hidden; $('#mmenu').hidden = !o; this.setAttribute('aria-expanded', o); document.documentElement.classList.toggle('mlocked', o); });
$('#mmenu').addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });

/* ---------- Умный поиск ---------- */
function match(q) {
  q = q.toLowerCase().trim(); if (!q) return [];
  var qq = ' ' + q + ' ';
  return SEARCH.map(function (s) { var score = 0; s.k.forEach(function (k) { if (qq.indexOf(k) >= 0 || (k.length > 4 && q.indexOf(k.slice(0, -1)) >= 0)) score += k.length; }); return { s: s, score: score }; })
    .filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; }).map(function (x) { return x.s; });
}
function isPro(q) { q = ' ' + q.toLowerCase() + ' '; return /клиент|агентств|\sкв\s/.test(q); }
function hideSuggest() { $$('.suggest').forEach(function (s) { s.hidden = true; }); }
function suggestFor(inp, s) {
  var r = match(inp.value).slice(0, 5);
  var base = r.length ? r : (inp.value.trim() ? [] : SEARCH.slice(0, 5));
  s.innerHTML = (base.length ? base.map(function (x) { return '<button type="button" class="sg" data-sq="' + SEARCH.indexOf(x) + '">' + x.q + '<span>' + x.page + '</span></button>'; }).join('') : '<p class="sg-none">Нажмите Enter — покажем лучший ответ</p>');
  s.hidden = false;
}
[['#q', '#suggest'], ['#qm', '#suggestM']].forEach(function (p) {
  var i = $(p[0]), s = $(p[1]);
  i.addEventListener('input', function () { suggestFor(i, s); });
  i.addEventListener('focus', function () { suggestFor(i, s); });
  s.addEventListener('click', function (e) { var b = e.target.closest('[data-sq]'); if (!b) return; hideSuggest(); closeMenu(); runSearch(SEARCH[+b.dataset.sq].q, SEARCH[+b.dataset.sq]); });
});
function runSearch(q, forced) {
  var r = forced ? [forced] : match(q), pro = isPro(q);
  if (pro && state.mode !== 'pro') setMode('pro');
  showAnswer({ q: q, hit: r[0], pro: pro });
}
$('#searchForm').addEventListener('submit', function (e) { e.preventDefault(); hideSuggest(); runSearch($('#q').value); });
$('#searchFormM').addEventListener('submit', function (e) { e.preventDefault(); hideSuggest(); closeMenu(); runSearch($('#qm').value); });

function showAnswer(o) {
  var h = '';
  if (o.ext) {
    h = '<p class="ans-k">Страница сайта m2.ru</p><h2 id="ansH">' + o.page + '</h2><p class="ans-path">m2.ru' + o.path + '</p>' +
      (o.note ? '<p class="dr-p">' + o.note + '</p>' : '') +
      '<p class="dr-p">Это отдельная страница сайта, в прототип она не входит. Всё для покупки квартиры собрано здесь.</p>' +
      '<div class="ans-btns"><a class="btn" href="#nabory" data-close>Выбрать набор</a><button type="button" class="btn btn-sec" data-close>Остаться на странице</button></div>';
  } else if (!o.hit) {
    h = '<p class="ans-k">Ответ на запрос</p><h2 id="ansH">«' + esc(o.q) + '»</h2><p class="dr-p">Точного ответа не нашли. Попробуйте одну из задач или спросите нас.</p>' +
      '<div class="ans-tasks">' + taskHTML() + '</div><button type="button" class="btn btn-sec" data-open-help>Есть вопрос?</button>';
  } else {
    var s = o.hit, here = !!s.here;
    h = '<p class="ans-k">Ответ на запрос «' + esc(o.q || s.q) + '»</p><h2 id="ansH">' + s.page + '</h2><p class="ans-path">m2.ru' + s.path + '</p>' +
      (o.pro ? '<p class="ans-pro">Похоже, вы риелтор — включили режим «Я риелтор».</p>' : '') +
      '<dl class="ans-dl"><div><dt>Покажем сразу</dt><dd>' + s.work + '</dd></div>' + (s.read && s.read !== '—' ? '<div><dt>Почитать</dt><dd>' + s.read + '</dd></div>' : '') + '</dl>' +
      '<div class="ans-btns">' + (here ? '<a class="btn" href="' + s.here + '" data-close data-mode-go="' + (s.mode || '') + '">Показать на этой странице</a>' :
        s.login ? '<button type="button" class="btn" data-login data-close>Войти</button>' :
        '<button type="button" class="btn" data-close data-tst="m2.ru' + s.path + ' — отдельная страница сайта, в прототип не входит">Открыть страницу</button>') +
      '<button type="button" class="btn btn-sec" data-close>Закрыть</button></div>';
  }
  $('#ansBody').innerHTML = h; openLayer('answer');
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
document.addEventListener('click', function (e) {
  var m = e.target.closest('[data-mode-go]'); if (m && m.dataset.modeGo) setMode(m.dataset.modeGo);
  var t = e.target.closest('[data-tst]'); if (t) toast(t.dataset.tst);
});

/* ---------- Прочее ---------- */
function copy(txt, msg) { try { navigator.clipboard.writeText(txt).then(function () { toast(msg); }, function () { toast(msg); }); } catch (e) { toast(msg); } }
$('#inviteBtn').addEventListener('click', function () { copy('https://m2.ru/services/deal/join', 'Ссылка-приглашение скопирована. Отправьте её покупателю'); });
$('#shareRealtor').addEventListener('click', function () { copy('https://m2.ru/kupit-kvartiru/', 'Ссылка скопирована. Отправьте её риелтору'); });
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href^="#"]'); if (!a || a.dataset.ext !== undefined) return;
  var id = a.getAttribute('href'); if (id.length < 2) return; var t = $(id); if (!t) return;
  e.preventDefault(); closeMenu(); var top = t.getBoundingClientRect().top + window.scrollY - 72; window.scrollTo({ top: top, behavior: 'smooth' });
});

/* ---------- Появление ---------- */
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('rv');
  var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
  $$('.sec-head, .ribbon, .steps, .money-grid, .sets-layout, .prices, .pk-in, .gloss, .trust-row, .real-in, .faq, .contact-row, .self-in, .ipo-in').forEach(function (el) { io.observe(el); });
}

/* ---------- Старт ---------- */
var params = new URLSearchParams(location.search);
if (params.get('ipoteka') === '1') { state.ipo = true; $('#ipoSw').checked = true; }
renderFaq(); renderPicker(); updLogin();
setMode(params.get('mode') || 'buy'); refreshCart(); stickyVis();
})();
