/* rd-y-shop.js – các ý tưởng giao diện đã được duyệt cho trang mua sắm + khung chung (theme "Lớn lên cùng bé").
   Chỉ thêm phần nhìn trên DOM có sẵn (progressive enhancement). Không đổi cách chạy của tìm kiếm, giỏ hàng,
   mua nhanh, thanh toán, giá, điểm, voucher. Giữ nguyên mọi ID / class / data-* mà JS cũ dùng.
   Mỗi ý tưởng là một hàm riêng, bọc try/catch; tắt từng ý bằng bảng BAT bên dưới. */
(function () {
  'use strict';
  const BAT = { Y01: true, Y03: true, Y05: true, Y07: true, Y09: true, Y11: true, Y13: true, Y17: true };

  const d = document, w = window, html = d.documentElement;
  if (w.__rdYShop) return; w.__rdYShop = true;
  const RMQ = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const reduced = () => !!RMQ.matches;
  const $ = (s, r) => (r || d).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || d).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ICON = (slug) => 'img/rd/icons/' + slug + '.webp';
  const KID = (k) => 'img/rd/kids/' + k + '.webp';
  const KID_W = { 'em-be': 303, 'chap-chung-gai': 258, 'chap-chung-trai': 235, 'be-gai': 296, 'be-trai': 212, 'teen-gai': 214, 'teen-trai': 205 };   // ảnh cao 600px
  const kidImg = (k, h, cls) => `<img class="${cls || ''}" src="${KID(k)}" alt="" width="${Math.round(KID_W[k] / 600 * h)}" height="${h}" loading="lazy" decoding="async">`;
  const icon = (slug, size, cls, alt) => `<img class="rd-emo${cls ? ' ' + cls : ''}" src="${ICON(slug)}" alt="${esc(alt || '')}" width="${size}" height="${size}" loading="lazy" decoding="async">`;
  const byId = (id) => (w.MC && w.MC.byId ? w.MC.byId(id) : (w.PRODUCTS || []).find((p) => String(p.id) === String(id)));
  const fmtN = (n) => Number(n).toLocaleString('vi-VN');
  const warn = (k, e) => { try { console.warn('[rd-y-shop] ' + k, e); } catch (_) { /* không có console */ } };
  const run = (k, fn) => function () { try { return fn.apply(this, arguments); } catch (e) { warn(k, e); } };
  /* true nếu node đã xử lý (idempotent) */
  const done = (el, tag) => { const key = '__ys' + (tag || ''); if (el[key]) return true; el[key] = 1; return false; };
  /* Ảnh trang trí: tick tròn màu pastel */
  const TICK = '<svg class="ys-tick" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle class="ys-tick__bg" cx="8" cy="8" r="8"/><path class="ys-tick__ck" d="M4.6 8.4l2.2 2.2 4.6-4.8" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- Bộ theo dõi DOM chung: nội dung do JS vẽ ra hoặc vẽ lại ---------- */
  const hooks = [];
  function onAdded(sel, fn) { hooks.push({ sel: sel, fn: fn }); try { $$(sel).forEach(fn); } catch (e) { warn(sel, e); } }
  function scan(root) {
    for (let i = 0; i < hooks.length; i++) {
      const h = hooks[i];
      try {
        if (root.matches && root.matches(h.sel)) h.fn(root);
        if (root.querySelectorAll && root.firstElementChild) root.querySelectorAll(h.sel).forEach(h.fn);
      } catch (e) { warn(h.sel, e); }
    }
  }
  if ('MutationObserver' in w && d.body) {
    new MutationObserver((muts) => {
      for (let i = 0; i < muts.length; i++) {
        const a = muts[i].addedNodes;
        for (let j = 0; j < a.length; j++) if (a[j].nodeType === 1 && a[j].isConnected) scan(a[j]);
      }
    }).observe(d.body, { childList: true, subtree: true });
  }
  const pageId = () => { try { return new URLSearchParams(location.search).get('id'); } catch (_) { return null; } };

  /* ======================================================================
     Y01 · Ô tìm kiếm tự gõ "câu hỏi của mẹ" + hàng chip "Mẹ hay hỏi"
     ====================================================================== */
  function Y01() {
    const QS = ['bé 2 tuổi biếng ăn nên dùng gì?', 'bé thấp còi cần bổ sung gì?', 'bé hay ốm vặt nên dùng gì?', 'mẹ bầu cần bổ sung gì?'];
    const needOk = (k) => (w.NEEDS || []).some((n) => n.key === k);
    const catOk = (k) => (w.CATEGORIES || []).some((c) => c.key === k);
    const ASK = [
      { t: 'Bé biếng ăn', ic: 'honey', href: 'collections.html?need=tang-can', ok: () => needOk('tang-can') },
      { t: 'Bé thấp còi', ic: 'ruler', href: 'collections.html?need=tang-chieu-cao', ok: () => needOk('tang-chieu-cao') },
      { t: 'Bé hay ốm vặt', ic: 'shield', href: 'collections.html?need=de-khang', ok: () => needOk('de-khang') },
      { t: 'Mẹ bầu cần gì?', ic: 'pregnant', href: 'collections.html?cat=cho-me', ok: () => catOk('cho-me') },
    ];

    /* Chữ gợi ý tự gõ rồi xoá (chỉ khi ô đang hiện, chưa focus, chưa có chữ) */
    onAdded('#searchInput', run('Y01 input', (input) => {
      if (done(input)) return;
      const base = input.getAttribute('placeholder') || '';
      if (reduced()) return;   // giảm chuyển động: giữ chữ gợi ý tĩnh như cũ
      let qi = 0, ci = 0, dir = 1, t = 0, on = false, laps = 0;   // chạy 2 vòng (8 câu) rồi đứng yên, chạy lại khi mẹ rời ô
      const visible = () => input.offsetWidth > 0 && input.offsetHeight > 0 && !d.hidden;
      const busy = () => d.activeElement === input || input.value !== '';
      const setPh = (s) => { if (input.getAttribute('placeholder') !== s) input.setAttribute('placeholder', s); };
      function stop() { clearTimeout(t); t = 0; on = false; setPh(base); }
      function tick() {
        t = 0;
        if (busy()) { stop(); return; }
        if (!visible()) { setPh(base); t = setTimeout(tick, 2000); return; }
        const q = QS[qi]; let wait;
        if (dir > 0) { ci++; wait = 55 + Math.random() * 50; if (ci >= q.length) { ci = q.length; dir = -1; wait = 2000; } }
        else { ci -= 2; wait = 26; if (ci <= 0) { ci = 0; dir = 1; qi = (qi + 1) % QS.length; wait = 500; if (++laps >= QS.length * 2) { stop(); return; } } }
        setPh(ci ? 'Mẹ hỏi: ' + q.slice(0, ci) : 'Mẹ hỏi: ');
        t = setTimeout(tick, wait);
      }
      function start(delay) { if (on || busy()) return; on = true; ci = 0; dir = 1; laps = 0; t = setTimeout(tick, delay || 700); }
      input.addEventListener('focus', stop);
      input.addEventListener('input', () => { if (input.value) stop(); });
      input.addEventListener('blur', () => { if (!input.value) start(1500); });
      d.addEventListener('visibilitychange', () => { if (d.hidden) stop(); else start(900); });
      start(1600);
    }));

    const chipsHTML = (list) => list.map((a) => `<a class="ys-ask__chip" href="${a.href}">${icon(a.ic, 24)}<span>${esc(a.t)}</span></a>`).join('');
    /* Hộp gợi ý ở trạng thái trống ("Tìm kiếm phổ biến") → thêm hàng "Mẹ hay hỏi" phía trên */
    onAdded('#searchSuggest > .search__hint', run('Y01 chips', (hint) => {
      if (hint.classList.contains('ys-ask')) return;
      const box = hint.parentElement; if (!box || box.querySelector('.ys-ask')) return;
      if (!hint.querySelector('.chips a[href*="collections.html?q="]')) return;   // chỉ trạng thái ô trống
      const list = ASK.filter((a) => a.ok());
      if (!list.length) return;
      hint.insertAdjacentHTML('beforebegin', `<div class="search__hint ys-ask"><span class="ys-ask__h">${icon('chat', 22, 'ys-ask__hic')}Mẹ hay hỏi</span><div class="ys-ask__list">${chipsHTML(list)}</div></div>`);
    }));

    /* Mẹ gõ câu hỏi (ô tìm kiếm chỉ khớp theo từ khoá, câu hỏi dài thường ra kết quả "gần đúng"):
       nếu câu có nỗi lo quen thuộc thì thêm một hàng chip tới đúng trang lọc nhu cầu, phía trên kết quả. Không đổi kết quả tìm. */
    const INTENT = [
      { re: /bieng an|chan an|luoi an|tang can|nhe can|suy dinh duong|an ngon|an kem/, need: 'tang-can', ic: 'honey' },
      { re: /thap coi|thap be|chieu cao|cao lon|tang cao|cham cao/, need: 'tang-chieu-cao', ic: 'ruler' },
      { re: /om vat|hay om|de khang|mien dich|hay benh|sau om/, need: 'de-khang', ic: 'shield' },
      { re: /me bau|mang thai|co thai|bau bi|sau sinh|cho con bu/, cat: 'cho-me', ic: 'pregnant' },
      { re: /tao bon|tieu hoa|day bung|dau bung|di ngoai/, need: 'tieu-hoa', ic: 'leafy' },
      { re: /canxi|coi xuong/, need: 'canxi', ic: 'bone' },
      { re: /tri nao|thong minh|tap trung/, need: 'tri-nao', ic: 'brain' },
      { re: /an dam/, need: 'an-dam', ic: 'bowl' },
    ];
    const plain = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ');
    onAdded('#searchSuggest > *', run('Y01 intent', (node) => {
      if (node.classList.contains('ys-ask')) return;
      const box = node.parentElement, input = $('#searchInput');
      if (!box || !input || !input.value.trim() || box.querySelector('.ys-ask')) return;
      const q = plain(input.value);
      const list = INTENT.filter((it) => it.re.test(q)).map((it) => {
        const lb = it.need ? ((w.NEEDS || []).find((n) => n.key === it.need) || {}).label : ((w.CATEGORIES || []).find((c) => c.key === it.cat) || {}).label;
        return lb ? { t: 'Xem món ' + lb.charAt(0).toLowerCase() + lb.slice(1), ic: it.ic, href: 'collections.html?' + (it.need ? 'need=' + it.need : 'cat=' + it.cat) } : null;
      }).filter(Boolean).slice(0, 2);
      if (!list.length) return;
      box.insertAdjacentHTML('afterbegin', `<div class="search__hint ys-ask ys-ask--match"><span class="ys-ask__h">${icon('sparkles', 22, 'ys-ask__hic')}Gợi ý theo nỗi lo của mẹ</span><div class="ys-ask__list">${chipsHTML(list)}</div></div>`);
    }));
  }

  /* ======================================================================
     Y05 · Pill "tuổi + quy cách" trên thẻ sản phẩm; chip tuổi có bé 3D lớn dần ở trang danh mục
     ====================================================================== */
  function Y05() {
    onAdded('.pcard[data-id]', run('Y05 card', (card) => {
      if (done(card, 'pk')) return;
      const row = card.querySelector('.pcard__age'); if (!row || row.querySelector('.ys-pack')) return;
      const p = byId(card.getAttribute('data-id')); if (!p) return;
      const wt = String(p.weight || '').replace(/\s+/g, ' ').trim();
      if (!wt) return;   // "Gói", "Thùng"… không có số vẫn hiện để hàng pill các thẻ đều nhau
      row.classList.add('ys-pills');
      row.insertAdjacentHTML('beforeend', `<span class="ys-pack" title="Quy cách: ${esc(wt)}">${icon('package', 20, 'ys-pack__ic')}<span class="ys-pack__t"><span class="ys-sr">Quy cách: </span>${esc(wt)}</span></span>`);
    }));

    /* Trang danh mục: hàng chip tuổi có sẵn (#ageChips, vẽ lại mỗi lần lọc) → bé 3D lớn dần theo tuổi */
    const AGE_KID = { '0-6m': ['em-be', 28], '6-12m': ['em-be', 32], '1-3y': ['chap-chung-gai', 36], '3-6y': ['chap-chung-trai', 40], '6-12y': ['be-gai', 45], '12-18y': ['teen-trai', 54] };
    onAdded('#ageChips > .chip', run('Y05 age', (chip) => {
      const row = chip.parentElement; if (row && !row.classList.contains('ys-agerow')) row.classList.add('ys-agerow');
      if (chip.querySelector('.ys-kid')) return;
      const k = chip.getAttribute('data-age');
      if (!k) { chip.classList.add('ys-agechip', 'ys-agechip--all'); return; }
      const def = AGE_KID[k]; if (!def) return;
      chip.classList.add('ys-agechip');
      chip.style.setProperty('--ys-kh', def[1] + 'px');
      chip.insertAdjacentHTML('afterbegin', kidImg(def[0], def[1], 'ys-kid'));
    }));
  }

  /* ======================================================================
     Trang sản phẩm: Y03 (1 hộp dùng bao lâu), Y07 (dòng trấn an), Y09 (các bước dùng), Y13 (pill điểm)
     ====================================================================== */
  function pdp() {
    onAdded('#pdp .pdp__info', (info) => {
      if (done(info, 'pdp')) return;
      const p = byId(pageId()); if (!p) return;
      if (BAT.Y13) run('Y13', Y13)(p, info);
      if (BAT.Y03) run('Y03', Y03)(p, info);
      if (BAT.Y07) run('Y07 pdp', Y07pdp)(info);
      if (BAT.Y09) run('Y09', Y09)(p);
    });
  }

  /* ---- Y03 ---- */
  /* Liều/ngày: chỉ nhận khi câu cách dùng có đúng 1 số "N gói" và số đó đi kèm "/ngày" (hoặc "mỗi ngày N gói").
     Có khoảng (1–2 gói), phân số (1/2 gói), "gói nhỏ/lớn" hay nhiều mức liều → không hiện. */
  function parseDose(u) {
    u = String(u || '');
    if (/\d\s*[–—\-\/]\s*\d+\s*gói/i.test(u)) return 0;
    const all = u.match(/\d+(?:[.,]\d+)?\s*gói/gi) || [];
    if (all.length !== 1) return 0;
    let n = 0;
    let m = u.match(/(^|[^\d.,])(\d+)\s*gói(?!\s*(?:nhỏ|lớn))\s*(?:\([^)]{0,20}\))?\s*(?:\/|mỗi|một)\s*ngày/i);
    if (m) n = Number(m[2]);
    else { m = u.match(/mỗi\s+ngày\s*(?:uống|dùng|ăn)?\s*(\d+)\s*gói(?!\s*(?:nhỏ|lớn))/i); if (m) n = Number(m[1]); }
    return n >= 1 && n <= 10 ? n : 0;
  }
  /* Số gói của lựa chọn đang chọn: lấy từ nhãn phân loại ("1 hộp 90 gói"); sản phẩm không có phân loại thì lấy quy cách */
  function parsePacks(p, vi) {
    if (/gói\s*(?:nhỏ|lớn)/i.test(p.weight || '')) return 0;
    let src;
    if (p.variants && p.variants.length) { if (vi == null || !p.variants[vi]) return 0; src = String(p.variants[vi].label || ''); }
    else src = String(p.weight || '');
    if (/\+|tặng|kèm|gói\s*(?:nhỏ|lớn)/i.test(src)) return 0;
    const all = src.match(/(\d+)\s*gói/gi) || [];
    if (all.length !== 1) return 0;
    const n = Number(all[0].match(/\d+/)[0]);
    return n >= 1 && n <= 2000 ? n : 0;
  }
  function currentVariant(p) {
    if (!p.variants || !p.variants.length) return null;
    const sel = $('#variantSel'); if (sel) return Number(sel.value);
    const chip = $('#variants .chip.is-active[data-variant]'); if (chip) return Number(chip.getAttribute('data-variant'));
    const v2 = $('#variants2');
    if (v2 && p.chon2) {
      const pick = [0, 1].map((k) => { const c = v2.querySelector(`[data-tang="${k}"] .chip.is-active`); return c ? c.getAttribute('data-gt') : null; });
      if (pick[0] != null && pick[1] != null) {
        const i = p.variants.findIndex((v) => String(v.label) === pick[0] + ' · ' + pick[1]);
        if (i >= 0) return i;
      }
    }
    return null;
  }
  function countTo(el, to) {
    const from = Number(el.textContent.replace(/\D/g, '')) || 0;
    cancelAnimationFrame(el.__ysRaf);
    if (reduced() || d.hidden || from === to) { el.textContent = fmtN(to); return; }
    const t0 = performance.now(), dur = 520;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmtN(Math.round(from + (to - from) * e));
      if (k < 1) el.__ysRaf = requestAnimationFrame(step);
    };
    el.__ysRaf = requestAnimationFrame(step);
    setTimeout(() => { el.textContent = fmtN(to); }, dur + 80);   // tab nền: vẫn ra đúng số cuối
  }
  function Y03(p) {
    const qIn = $('#qInput'); if (!qIn || p.isCombo) return;
    const opt = qIn.closest('.pdp__opt'); if (!opt) return;
    const dose = parseDose(p.usage); if (!dose) return;
    const forKid = (p.ages || []).length > 0 && !p.cosmetic;
    const box = d.createElement('div');
    box.className = 'ys-days'; box.hidden = true;
    box.innerHTML = `${icon('clock', 34, 'ys-days__ic')}<div class="ys-days__txt"><span class="ys-days__main" aria-hidden="true">Đủ ${forKid ? 'cho bé ' : ''}dùng khoảng <b><span class="ys-days__n">0</span> ngày</b></span><small class="ys-days__sub"></small><span class="ys-sr" aria-live="polite"></span></div>`;
    opt.insertAdjacentElement('afterend', box);
    const nEl = box.querySelector('.ys-days__n'), sub = box.querySelector('.ys-days__sub'), live = box.querySelector('.ys-sr');
    let last = -1;
    const upd = run('Y03 upd', () => {
      const packs = parsePacks(p, currentVariant(p));
      const qty = Math.max(1, Math.min(99, Math.floor(Number(qIn.value) || 1)));
      const n = packs ? Math.floor(packs * qty / dose) : 0;
      if (!n) { box.hidden = true; last = -1; return; }
      box.hidden = false;
      sub.textContent = `${fmtN(packs)} gói × ${qty} · ${forKid ? 'bé dùng ' : ''}${dose} gói/ngày (theo liều trên bao bì)`;
      if (n !== last) { countTo(nEl, n); live.textContent = `Đủ ${forKid ? 'cho bé ' : ''}dùng khoảng ${fmtN(n)} ngày`; last = n; }
    });
    let q = 0;
    const later = () => { if (!q) q = setTimeout(() => { q = 0; upd(); }, 30); };
    const info = qIn.closest('.pdp__info') || d;
    info.addEventListener('click', later); info.addEventListener('change', later); info.addEventListener('input', later);
    const bt = $('#buyTotal'); if (bt && 'MutationObserver' in w) new MutationObserver(later).observe(bt, { childList: true, characterData: true, subtree: true });
    upd();
  }

  /* ---- Y07 ---- */
  const ASSURE = ['Chính hãng, tem phụ tiếng Việt', 'Kiểm tra hàng trước khi thanh toán', 'Đổi trả miễn phí 7 ngày'];
  const assureHTML = (items, cls) => `<ul class="ys-assure${cls ? ' ' + cls : ''}" aria-label="Cam kết của shop">${items.map((t) => `<li>${TICK}<span>${esc(t)}</span></li>`).join('')}</ul>`;
  function Y07pdp(info) {
    const add = $('#btnAdd', info) || $('#btnBuy', info); if (!add || info.querySelector('.ys-assure')) return;
    // Trang sản phẩm: bỏ "Kiểm tra hàng…" vì dòng nhỏ trong nút Mua ngay đã có câu này
    add.insertAdjacentHTML('afterend', assureHTML(ASSURE.filter((t) => !/^Kiểm tra hàng/.test(t)), 'ys-assure--pdp'));
  }
  function Y07co() {
    onAdded('#coSubmit', run('Y07 co', (btn) => {
      if (done(btn, 'co')) return;
      const nx = btn.nextElementSibling; if (nx && nx.classList.contains('ys-assure')) return;
      const keepSafe = nx && nx.classList.contains('qb__trust') && /Bảo mật/i.test(nx.textContent);
      btn.insertAdjacentHTML('afterend', assureHTML(keepSafe ? ASSURE.concat('Bảo mật thông tin') : ASSURE, 'ys-assure--co'));
    }));
  }

  /* ---- Y09 ---- */
  const STEP_IC = [
    [/nhỏ\s*(trực tiếp|giọt|vào)|giọt/i, 'droplet'], [/pha|muỗng/i, 'milk'], [/thoa|massage|đắp|xịt|bôi|chải/i, 'lotion'],
    [/gội|xả|rửa/i, 'droplet'], [/rắc|trộn|cơm|cháo/i, 'rice-ball'], [/bác sĩ|chuyên gia|ý kiến/i, 'expert'],
    [/bao bì|hướng dẫn|trên hộp/i, 'check'], [/bảo quản|đậy kín|khô ráo|để mát|để lạnh|tủ lạnh/i, 'package'],
    [/buổi tối/i, 'moon'], [/buổi sáng/i, 'sun'], [/uống/i, 'juice'], [/ăn|bữa/i, 'bowl'],
  ];
  const WARN_RE = /không dùng|không phải|tránh|ngưng|hỏi ý kiến|lưu ý|dị ứng|có thai|cho con bú/i;
  const TONES = ['blush', 'mint', 'butter', 'sky', 'oat'];
  const AGE_KID1 = { '0-6m': 'em-be', '6-12m': 'em-be', '1-3y': 'chap-chung-gai', '3-6y': 'chap-chung-trai', '6-12y': 'be-gai', '12-18y': 'teen-trai' };
  function splitSteps(u) {
    let parts = String(u || '').replace(/\s+/g, ' ').trim()
      .replace(/([.!?;])\s+(?=[\p{Lu}\d])/gu, '$1\n').split('\n').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 5) parts = parts.slice(0, 4).concat(parts.slice(4).join(' '));
    return parts;
  }
  function Y09(p) {
    const tabs = $('#pdp .pdp__tabs'); if (!tabs || $('#pdp .ys-steps')) return;
    const steps = splitSteps(p.usage); if (!steps.length) return;
    const forKid = (p.ages || []).length > 0 && !p.cosmetic;
    const n = steps.length;
    const kid = forKid && AGE_KID1[p.ages[0]];
    const card = (s, i) => {
      const ic = (STEP_IC.find((r) => r[0].test(s)) || [0, 'sparkles'])[1];
      const art = i === 0 && kid
        ? `<span class="ys-step__art ys-step__art--kid">${kidImg(kid, 76, 'ys-step__kid')}${icon(ic, 34, 'ys-step__badge rd-sticker rd-sticker--thin')}</span>`
        : `<span class="ys-step__art">${icon(ic, 52, 'rd-sticker')}</span>`;
      const warnTag = WARN_RE.test(s) ? '<span class="rd-sticker-text rd-sticker-text--pink ys-step__warn">Lưu ý</span>' : '';
      return `<li class="ys-step" data-tone="${TONES[i % TONES.length]}">${warnTag}${art}<span class="ys-step__lbl">${n > 1 ? `Bước ${i + 1}/${n}` : 'Mẹ nhớ nhé'}</span><p class="ys-step__txt">${esc(s)}</p></li>`;
    };
    const hasLabel = /bao bì|trên hộp|hướng dẫn in/i.test(p.usage || '');
    const sec = d.createElement('section');
    sec.className = 'ys-steps' + (n === 1 ? ' ys-steps--one' : '');
    sec.setAttribute('aria-labelledby', 'ysStepsH');
    sec.style.setProperty('--ys-n', n);
    sec.innerHTML = `<div class="ys-steps__head">${icon(forKid ? 'heart-grow' : 'sparkles', 40, 'rd-sticker rd-sticker--thin')}<div><h2 id="ysStepsH">${forKid ? 'Cách dùng cho bé' : 'Cách dùng'}</h2><p>Tóm tắt từ hướng dẫn sử dụng của sản phẩm.${n > 1 ? '<span class="ys-steps__swipe"> Vuốt ngang để xem từng bước.</span>' : ''}</p></div></div>
      <ol class="ys-steps__list"${n > 1 ? ' tabindex="0" aria-label="Các bước dùng, vuốt ngang để xem"' : ''}>${steps.map(card).join('')}</ol>
      ${n > 1 ? `<div class="ys-steps__seg" aria-hidden="true">${steps.map((_, i) => `<i${i === 0 ? ' class="is-on"' : ''}></i>`).join('')}</div>` : ''}
      <p class="ys-steps__note">${TICK}<span>${forKid
        ? (hasLabel ? 'Liều dùng luôn theo hướng dẫn trên bao bì.' : 'Mẹ cho bé dùng theo hướng dẫn trên bao bì nhé.') + ' Cần tư vấn liều hợp tuổi bé, chuyên gia dinh dưỡng của shop gọi lại miễn phí.'
        : (hasLabel ? 'Dùng theo hướng dẫn trên bao bì.' : 'Mẹ dùng theo hướng dẫn trên bao bì nhé.') + ' Cần tư vấn thêm, chuyên gia của shop gọi lại miễn phí.'}</span></p>`;
    tabs.parentNode.insertBefore(sec, tabs);
    /* Thanh tiến trình chia đoạn theo thẻ đang xem (điện thoại) */
    const list = sec.querySelector('.ys-steps__list'), segs = $$('.ys-steps__seg i', sec);
    if (n > 1 && 'IntersectionObserver' in w) {
      const items = $$('.ys-step', list);
      const io = new IntersectionObserver((ents) => {
        ents.forEach((en) => { if (en.isIntersecting) { const i = items.indexOf(en.target); segs.forEach((s, j) => s.classList.toggle('is-on', j <= i)); } });
      }, { root: list, threshold: 0.6 });
      items.forEach((it) => io.observe(it));
    }
  }

  /* ---- Y13 ---- */
  /* Front-end có quy tắc DÙNG điểm (1 điểm = giaTriDiem đ, mỗi đơn tối đa diemToiDaPhanTram %, mặc định 10% – app.js qbKhoan, checkout.html)
     nhưng không có quy tắc TÍCH điểm theo đơn → không ghi "+N điểm". Số % chỉ hiện khi đã có cấu hình máy chủ lưu trên máy. */
  function Y13(p, info) {
    const box = $('.pdp__price', info); if (!box || box.querySelector('.ys-pts')) return;
    let pct = null;
    try {
      const c = JSON.parse(localStorage.getItem('mc_gt_cfg') || 'null');
      if (c && c.luc) { const v = c.diemToiDaPhanTram != null ? Number(c.diemToiDaPhanTram) : 10; if (v > 0 && v <= 100) pct = v; }
    } catch (_) { /* không đọc được bộ nhớ */ }
    const txt = pct ? `Dùng điểm thưởng giảm đến ${pct}% đơn` : 'Dùng điểm thưởng trừ tiền khi mua';
    box.insertAdjacentHTML('beforeend', `<a class="ys-pts" href="account.html#diem">${icon('star-glow', 22)}<span>${txt}</span></a>`);
  }

  /* ======================================================================
     Y11 · Thanh freeship sinh động (ngăn giỏ + trang giỏ): bé 3D đi xe chạy theo tổng giỏ
     ====================================================================== */
  let fsLast = null;
  const WAGON = '<svg class="ys-fs__wagon" viewBox="0 0 34 15" aria-hidden="true" focusable="false"><path d="M2.5 3.2h24.5l-2.6 6.6H5.2z" fill="#FFD3DF" stroke="#2B2533" stroke-width="1.7" stroke-linejoin="round"/><path d="M27 3.2l4.6-2" fill="none" stroke="#2B2533" stroke-width="1.7" stroke-linecap="round"/><g class="ys-wh"><circle cx="9" cy="11.6" r="2.7" fill="#fff" stroke="#2B2533" stroke-width="1.6"/><path d="M9 9.6v4" stroke="#2B2533" stroke-width="1.2"/></g><g class="ys-wh"><circle cx="22" cy="11.6" r="2.7" fill="#fff" stroke="#2B2533" stroke-width="1.6"/><path d="M22 9.6v4" stroke="#2B2533" stroke-width="1.2"/></g></svg>';
  function Y11() {
    onAdded('.freeship-bar', run('Y11', (fb) => {
      if (fb.classList.contains('ys-fs')) return;
      const bar = fb.querySelector('.bar'), fill = bar && bar.querySelector('i'); if (!fill) return;
      const pct = Math.max(0, Math.min(100, parseFloat(fill.style.width) || 0));
      const full = pct >= 100;
      const host = fb.querySelector('.freeship-bar__txt') || fb;
      /* gom phần chữ (trước thanh) vào một dòng */
      const msg = d.createElement('div'); msg.className = 'ys-fs__msg';
      Array.prototype.slice.call(host.childNodes).forEach((nd) => { if (nd !== bar && !(nd.nodeType === 1 && nd.classList.contains('freeship-bar__ico'))) msg.appendChild(nd); });
      if (full) msg.innerHTML = `${icon('party', 26, 'ys-fs__party')}<span>Đơn của mẹ được <b>freeship</b> rồi!</span>`;
      const track = d.createElement('div'); track.className = 'ys-fs__track'; track.setAttribute('aria-hidden', 'true');
      host.insertBefore(msg, bar); host.insertBefore(track, bar); track.appendChild(bar);
      track.insertAdjacentHTML('beforeend', `<span class="ys-fs__run"><span class="ys-fs__ride">${kidImg('chap-chung-gai', 38, 'ys-fs__kid')}${WAGON}</span></span>${icon(full ? 'gift' : 'truck', 30, 'ys-fs__goal')}`);
      fb.classList.add('ys-fs'); if (full) fb.classList.add('is-full');
      const runEl = track.querySelector('.ys-fs__run');
      const from = fsLast == null ? 0 : fsLast;
      const moving = !reduced() && Math.abs(from - pct) > 0.5;
      if (moving) {
        runEl.style.setProperty('--p', from);
        if (pct > 0) fill.style.transform = `scaleX(${Math.max(0, Math.min(1, from / pct))})`;
        void runEl.offsetWidth;
        fb.classList.add('is-moving');
        runEl.style.setProperty('--p', pct); fill.style.transform = '';
        setTimeout(() => fb.classList.remove('is-moving'), 950);
      } else runEl.style.setProperty('--p', pct);
      if (full && fsLast != null && fsLast < 100 && w.RD && typeof w.RD.confetti === 'function' && !reduced()) {
        setTimeout(() => { try { if (fb.isConnected) w.RD.confetti(track.querySelector('.ys-fs__ride') || fb, { n: 14 }); } catch (e) { warn('Y11 confetti', e); } }, moving ? 820 : 60);
      }
      fsLast = pct;
    }));
  }

  /* ======================================================================
     Y17 · Header thu gọn khi cuộn + icon giỏ thành xe đẩy em bé
     ====================================================================== */
  const STROLLER = '<svg class="ys-stroller" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path class="ys-stroller__hood" d="M11 3.2A7.8 7.8 0 0 0 3.2 11H11z"/><path d="M3.2 11h15.6a6 6 0 0 1-6 5.8H9.2a6 6 0 0 1-6-5.8z"/><path d="M18.8 11V7.2a2 2 0 0 1 2-2h.9"/><circle cx="7.6" cy="20.2" r="1.7"/><circle cx="15.6" cy="20.2" r="1.7"/></svg>';
  function Y17() {
    onAdded('#header', run('Y17', (hdr) => {
      if (done(hdr, 'hd')) return;
      /* Icon giỏ → xe đẩy (giữ nguyên nút, [data-cart-count] và mọi sự kiện) */
      $$('[data-open-cart]', hdr).forEach((btn) => {
        const old = btn.querySelector('svg'); if (!old || old.classList.contains('ys-stroller')) return;
        const tmp = d.createElement('span'); tmp.innerHTML = STROLLER;
        old.replaceWith(tmp.firstElementChild); btn.classList.add('ys-cartbtn');
      });
      /* Header thu gọn: chỉ dùng transform nên trang không bị nhảy */
      let on = false, tk = 0;
      const upd = () => {
        tk = 0;
        if (html.classList.contains('no-sticky')) { if (on) { on = false; html.classList.remove('ys-shrink'); } return; }
        const y = w.scrollY || html.scrollTop || 0;
        const want = on ? y > 48 : y > 80;
        if (want !== on) { on = want; html.classList.toggle('ys-shrink', on); }
      };
      w.addEventListener('scroll', () => { if (!tk) tk = w.requestAnimationFrame ? w.requestAnimationFrame(upd) : setTimeout(upd, 16); }, { passive: true });
      upd();
      const setH = () => { const h = hdr.offsetHeight; if (h) html.style.setProperty('--ys-hdr', h + 'px'); };
      setH(); w.addEventListener('resize', setH, { passive: true }); w.addEventListener('load', setH);
    }));
  }

  /* ---------- Khởi động ---------- */
  const IDEAS = { Y01: Y01, Y05: Y05, Y11: Y11, Y17: Y17 };
  Object.keys(IDEAS).forEach((k) => { if (BAT[k]) run(k, IDEAS[k])(); });
  if (BAT.Y03 || BAT.Y07 || BAT.Y09 || BAT.Y13) run('pdp', pdp)();
  if (BAT.Y07) run('Y07', Y07co)();
  /* Trang vẽ nội dung ở DOMContentLoaded (sau script defer này): MutationObserver đã bắt. Quét lại một lần cho chắc. */
  const rescan = () => { if (d.body) scan(d.body); };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', () => setTimeout(rescan, 0));
  else setTimeout(rescan, 0);
  w.addEventListener('load', rescan);
})();
