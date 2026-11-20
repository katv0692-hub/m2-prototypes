/* M2 prototypes — zone commenting layer
 * Adds a "comments" mode: toggle it, click any block (section/card/blockquote…),
 * leave a comment pinned to that zone. Comments stored in Supabase.
 * Load AFTER the page's app.js. No framework, ~zero deps.
 */
(() => {
  if (window.__m2Comments) return;
  const SUPABASE_URL = 'https://ljcczzlbjzoouwcxxary.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqY2N6emxianpvb3V3Y3h4YXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTUzOTMsImV4cCI6MjEwMzMzMTM5M30.y23JF2uevZvk4WlOhAqwCQnt_zgUdd_zIyW3d_jmvQ4';
  const sb = {
    async req(path, opts = {}) {
      const r = await fetch(SUPABASE_URL + path, {
        ...opts,
        headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) }
      });
      if (!r.ok) throw new Error('Supabase ' + r.status);
      if (r.status === 204) return null;
      const text = await r.text();
      return text ? JSON.parse(text) : null;
    },
    list: (page, zone) => sb.req('/rest/v1/comments?select=id,author,zone_id,body,created_at,page_id&order=created_at.asc&page_id=eq.' + encodeURIComponent(page) + (zone ? '&zone_id=eq.' + encodeURIComponent(zone) : '')),
    post: (c) => sb.req('/rest/v1/comments', { method: 'POST', body: JSON.stringify(c) }),
    del: (id) => sb.req('/rest/v1/comments?id=eq.' + id, { method: 'DELETE' })
  };

  const state = { on: false, comments: [], author: localStorage.getItem('m2c_author') || '' };
  let ui = {};

  const pageId = (location.pathname.replace(/\/index\.html$/, '').replace(/^\/|\/$/g, '') || 'index').replace(/\//g, '-');

  /* ---------- UI ---------- */
  function buildUI() {
    if (document.getElementById('m2c-toggle')) return;
    const css = document.createElement('style');
    css.textContent = `
#m2c-toggle{position:fixed;right:18px;bottom:18px;z-index:2147483000;background:#6d28d9;color:#fff;border:none;border-radius:999px;padding:12px 20px;font:500 14px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}
#m2c-toggle.on{background:#10b981}
#m2c-count{background:rgba(255,255,255,.25);border-radius:999px;padding:2px 8px;margin-left:8px;font-size:12px}
#m2c-panel{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:2147483001;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.3);padding:14px;width:min(420px,90vw);display:none;font:14px/1.4 system-ui,sans-serif;color:#111}
#m2c-panel.open{display:block}
#m2c-panel h4{margin:0 0 8px;font-size:14px;font-weight:600}
#m2c-zone-label{font-size:12px;color:#6b7280;margin-bottom:8px;max-height:60px;overflow:hidden}
#m2c-author,#m2c-text{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:8px 10px;font:14px system-ui,sans-serif;margin-bottom:8px}
#m2c-text{min-height:64px;resize:vertical}
#m2c-send{background:#6d28d9;color:#fff;border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font:500 14px system-ui,sans-serif}
#m2c-cancel{background:#f3f4f6;border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font:14px system-ui,sans-serif;margin-left:8px}
#m2c-list{max-height:200px;overflow:auto;border-top:1px solid #eee;margin-top:10px;padding-top:8px}
.m2c-item{display:flex;gap:8px;margin-bottom:8px;font-size:13px}
.m2c-item .m2c-del{color:#9ca3af;cursor:pointer;background:none;border:none;padding:0 2px}
.m2c-item b{color:#6d28d9}
.m2c-zone-on [data-m2c-zone].m2c-hl{outline:2px dashed #6d28d9;outline-offset:-2px;cursor:pointer}
.m2c-zone-on [data-m2c-zone]:hover{outline:2px solid #10b981;outline-offset:-2px;cursor:pointer}
#m2c-badge{position:absolute;top:-10px;right:-10px;background:#ef4444;color:#fff;border-radius:999px;min-width:20px;height:20px;font:600 11px/20px system-ui,sans-serif;text-align:center;padding:0 4px;pointer-events:none}
`;
    document.head.appendChild(css);

    const btn = document.createElement('button');
    btn.id = 'm2c-toggle';
    btn.innerHTML = '💬 Комментарии<span id="m2c-count">0</span>';
    btn.onclick = toggleMode;
    document.body.appendChild(btn);

    const p = document.createElement('div');
    p.id = 'm2c-panel';
    p.innerHTML = `
<h4 id="m2c-title">Комментарий к зоне</h4>
<div id="m2c-zone-label"></div>
<input id="m2c-author" placeholder="Ваше имя" value="${state.author.replace(/"/g, '&quot;')}">
<textarea id="m2c-text" placeholder="Что уточнить / не так / предложить?"></textarea>
<button id="m2c-send">Отправить</button><button id="m2c-cancel">Отмена</button>
<div id="m2c-list"></div>`;
    document.body.appendChild(p);
    p.querySelector('#m2c-send').onclick = send;
    p.querySelector('#m2c-cancel').onclick = closePanel;
    p.querySelector('#m2c-author').oninput = (e) => { state.author = e.target.value; localStorage.setItem('m2c_author', state.author); };
    ui = { btn, panel: p };
  }

  /* ---------- Zones ---------- */
  function zoneLabel(el) {
    const h = el.querySelector('h1,h2,h3,h4');
    const t = (h ? h.innerText : el.innerText).trim().replace(/\s+/g, ' ');
    return t.length > 90 ? t.slice(0, 90) + '…' : t;
  }
  function zoneId(el) {
    if (el.dataset.m2cZone) return el.dataset.m2cZone;
    let id = el.id || el.tagName.toLowerCase() + '-' + Math.random().toString(36).slice(2, 8);
    // ids may collide across pages — fine, page_id separates them
    el.dataset.m2cZone = id;
    return id;
  }

  function toggleMode() {
    state.on = !state.on;
    ui.btn.classList.toggle('on', state.on);
    document.body.classList.toggle('m2c-zone-on', state.on);
    if (state.on) { markZones(); loadAll().then(renderBadges); }
    else closePanel();
  }

  function markZones() {
    // candidate blocks: sections and direct children of main + footer blocks
    document.querySelectorAll('section, main > div, main > article, footer > div, .card, blockquote, table, form').forEach(el => {
      if (!el.dataset.m2cZone) zoneId(el);
      el.classList.add('m2c-hl');
    });
  }

  function onClick(e) {
    if (!state.on) return;
    if (e.target.closest('#m2c-panel') || e.target.closest('#m2c-toggle')) return;
    const zone = e.target.closest('[data-m2c-zone]');
    if (!zone) return;
    e.preventDefault(); e.stopPropagation();
    openPanel(zone);
  }

  function openPanel(zone) {
    ui.currentZone = zone;
    ui.panel.querySelector('#m2c-zone-label').textContent = 'Зона: «' + zoneLabel(zone) + '»';
    ui.panel.classList.add('open');
    renderList(zoneId(zone));
    const t = ui.panel.querySelector('#m2c-text'); t.value = ''; t.focus();
  }
  function closePanel() { ui.panel.classList.remove('open'); ui.currentZone = null; }

  async function send() {
    const text = ui.panel.querySelector('#m2c-text').value.trim();
    if (!text) return;
    const author = state.author || 'Аноним';
    try {
      await sb.post({ page_id: pageId, zone_id: zoneId(ui.currentZone), zone_label: zoneLabel(ui.currentZone), author, body: text });
      ui.panel.querySelector('#m2c-text').value = '';
      await loadAll(); renderList(zoneId(ui.currentZone)); renderBadges();
    } catch (err) {
      ui.panel.querySelector('#m2c-title').textContent = 'Ошибка отправки: ' + err.message;
    }
  }

  async function loadAll() {
    try { state.comments = await sb.list(pageId); } catch { state.comments = []; }
    const n = state.comments.length;
    const c = document.getElementById('m2c-count'); if (c) c.textContent = n;
  }

  function renderList(zid) {
    const list = ui.panel.querySelector('#m2c-list');
    const items = state.comments.filter(c => c.zone_id === zid);
    list.innerHTML = items.length
      ? items.map(c => `<div class="m2c-item"><b>${esc(c.author)}</b><span>${esc(c.body)}</span><button class="m2c-del" data-id="${c.id}">✕</button></div>`).join('')
      : '<div style="color:#9ca3af;font-size:12px">Пока нет комментариев к этой зоне</div>';
    list.querySelectorAll('.m2c-del').forEach(b => b.onclick = async () => {
      try { await sb.del(b.dataset.id); await loadAll(); renderList(zid); renderBadges(); } catch {}
    });
  }

  function renderBadges() {
    document.querySelectorAll('#m2c-badge,[data-m2c-badge]').forEach(b => b.remove());
    document.querySelectorAll('[data-m2c-zone]').forEach(el => {
      const n = state.comments.filter(c => c.zone_id === el.dataset.m2cZone).length;
      if (!n || !state.on) return;
      const b = document.createElement('span');
      b.id = 'm2c-badge'; b.textContent = n; b.dataset.m2cBadge = '1';
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(b);
    });
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function init() {
    buildUI();
    document.addEventListener('click', onClick, true);
    loadAll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.__m2Comments = true;
})();
