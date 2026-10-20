/* =====================================================================
   Hương Chất Kids · theme "Lớn lên cùng bé" · rd-motion.js (rd2-b)
   Motion API (spec mục 7, 7.1, 11). Không phụ thuộc thư viện, không đụng logic bán hàng.
   - Chỉ thêm class / thuộc tính trình bày; không đổi ID, data-* cũ, form, sự kiện có sẵn.
   - Trạng thái ẩn chỉ có khi html.rd-motion (gắn ở đây). Giảm chuyển động: không gắn, mọi thứ hiện đủ.
   API: window.RD = { refresh, grow, icon, ... } – xem design/rd-components.md
   ===================================================================== */
(function () {
  'use strict';
  if (window.RD && window.RD.__v) return;

  var d = document, html = d.documentElement, w = window;
  var mq = function (q) { return w.matchMedia ? w.matchMedia(q) : { matches: false }; };
  var RMQ = mq('(prefers-reduced-motion: reduce)');
  var FINE = mq('(hover: hover) and (pointer: fine)');
  var reduced = !!RMQ.matches;
  var hasIO = 'IntersectionObserver' in w;
  var hasWA = !!(d.createElement('span').animate);

  if (!reduced && hasIO) html.classList.add('rd-motion');
  if (reduced) html.classList.add('rd-reduced');

  /* ---------- Đường dẫn ảnh (tính từ src của chính script) ---------- */
  var BASE = (function () {
    var s = d.currentScript && d.currentScript.src;
    if (!s) {
      var all = d.getElementsByTagName('script');
      for (var i = 0; i < all.length; i++) if (/rd-motion\.js/.test(all[i].src)) s = all[i].src;
    }
    return s ? s.replace(/js\/rd-motion\.js.*$/, '') : '';
  })();
  var ICON = BASE + 'img/rd/icons/';
  var DOODLE = BASE + 'img/rd/doodles/';

  /* ---------- Icon Fluent 3D ---------- */
  var SLUGS = ('baby child girl boy pregnant mom-feeding expert muscle giraffe teddy elephant bunny chick hatching-chick lion panda bear fox penguin ruler bone shield brain bulb bowl honey sprout herb pill sun-face leafy milk juice rice-ball apple carrot rice lotion droplet tooth heart-grow heart-sparkle heart-pink sparkles star star-glow cloud rainbow balloon moon sun kite footprints puzzle backpack basketball gift party ribbon truck package check chat phone house cart user search ticket flash fire clock stethoscope bottle hug love').split(' ');
  var SLUG_SET = {};
  SLUGS.forEach(function (s) { SLUG_SET[s] = 1; });
  // Khoá đã bỏ U+FE0F. Bảng spec mục 5 + emoji độ tuổi + emoji giao diện thường gặp.
  var EMO = {
    '🧃': 'juice', '🥛': 'milk', '🌿': 'herb', '💊': 'pill', '🍯': 'honey', '🍙': 'rice-ball', '🍎': 'apple', '🍱': 'rice',
    '💆‍♀': 'lotion', '💆': 'lotion', '🍼': 'bottle', '🥣': 'bowl', '🧸': 'teddy', '📏': 'ruler',
    '🎨': 'puzzle', '🧩': 'puzzle', '🎒': 'backpack', '⚽': 'basketball', '🏀': 'basketball',
    '🤰': 'pregnant', '👶': 'baby', '🧒': 'child', '👧': 'girl', '👦': 'boy', '🤱': 'mom-feeding', '👩‍⚕': 'expert', '💪': 'muscle',
    '🦒': 'giraffe', '🐘': 'elephant', '🐰': 'bunny', '🐇': 'bunny', '🐥': 'chick', '🐤': 'chick', '🐣': 'hatching-chick', '🦁': 'lion', '🐼': 'panda', '🐻': 'bear', '🦊': 'fox', '🐧': 'penguin',
    '🦴': 'bone', '🛡': 'shield', '🧠': 'brain', '💡': 'bulb', '🌱': 'sprout', '🌞': 'sun-face', '☀': 'sun', '🥬': 'leafy', '🥦': 'leafy', '🥕': 'carrot', '🍚': 'rice', '🧴': 'lotion', '💧': 'droplet', '🦷': 'tooth',
    '💗': 'heart-grow', '💖': 'heart-sparkle', '🩷': 'heart-pink', '💕': 'heart-pink', '❤': 'heart-pink', '✨': 'sparkles', '⭐': 'star', '🌟': 'star-glow', '☁': 'cloud', '🌈': 'rainbow', '🎈': 'balloon', '🌙': 'moon', '🪁': 'kite', '👣': 'footprints',
    '🎁': 'gift', '🎉': 'party', '🎊': 'party', '🎀': 'ribbon', '🚚': 'truck', '📦': 'package', '✅': 'check', '✔': 'check', '💬': 'chat', '📞': 'phone', '☎': 'phone', '🏠': 'house', '🛒': 'cart', '👤': 'user',
    '🔍': 'search', '🔎': 'search', '🎫': 'ticket', '🎟': 'ticket', '⚡': 'flash', '🔥': 'fire', '⏰': 'clock', '🩺': 'stethoscope', '🤗': 'hug', '🥰': 'love'
  };
  var SKIN = /[\uD83C][\uDFFB-\uDFFF]/g;

  function slugOf(e) {
    if (e == null) return null;
    var k = String(e).trim();
    if (!k) return null;
    if (SLUG_SET[k]) return k;
    k = k.replace(/️/g, '').replace(SKIN, '');
    return EMO[k] || EMO[k.split('‍')[0]] || null;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function iconSrc(slug) { return ICON + slug + '.webp'; }
  // icon(emojiHoặcSlug, {size, alt, cls, eager}) -> '<img class="rd-emo" ...>' ; emoji lạ trả nguyên.
  function icon(e, o) {
    var s = slugOf(e);
    if (!s) return e == null ? '' : e;
    o = o || {};
    var z = o.size || 48;
    return '<img class="rd-emo' + (o.cls ? ' ' + esc(o.cls) : '') + '" src="' + iconSrc(s) + '" alt="' + esc(o.alt || '') +
      '" width="' + z + '" height="' + z + '" loading="' + (o.eager ? 'eager' : 'lazy') + '" decoding="async">';
  }
  // doodle('giot-sua', 'wow', {size, cls, alt}) -> '<img class="rd-doodle" ...>'
  var DOODLES = ['giot-sua', 'khuc-xuong', 'mam-cay', 'may-con', 'ngoi-sao', 'trai-tim', 'hop-nuoc-ep', 'nam-com'];
  function doodle(name, mood, o) {
    o = o || {};
    if (DOODLES.indexOf(name) < 0) return '';
    var z = o.size || 72;
    return '<img class="rd-doodle' + (o.cls ? ' ' + esc(o.cls) : '') + '" src="' + DOODLE + name + '-' + (mood === 'wow' ? 'wow' : 'vui') +
      '.svg" alt="' + esc(o.alt || '') + '" width="' + z + '" height="' + z + '" loading="lazy" decoding="async">';
  }

  var NEED_ICON = {
    'tang-chieu-cao': 'ruler', 'canxi': 'bone', 'd3k2': 'sun-face', 'de-khang': 'shield', 'phuc-hoi': 'shield',
    'tang-can': 'honey', 'an-ngon': 'bowl', 'tri-nao': 'brain', 'tieu-hoa': 'leafy', 'vitamin-tong-hop': 'pill',
    'an-dam': 'rice-ball', 'organic': 'sprout', 'sua-cong-thuc': 'bottle', 'sua-tuoi': 'milk', 'cho-me': 'mom-feeding',
    'lam-dep': 'lotion', 'me-bau': 'pregnant', 'an-vat': 'apple'
  };
  var AGE_ICON = { 'me-bau': 'pregnant', '0-6m': 'baby', '6-12m': 'bowl', '1-3y': 'teddy', '3-6y': 'puzzle', '6-12y': 'backpack', '12-18y': 'basketball' };
  var CAT_NEED = { 'vitamin': 'tang-chieu-cao', 'sua': 'sua-tuoi', 'hong-sam': 'de-khang', 'tang-can': 'tang-can', 'cho-me': 'cho-me',
    'nuoc-ep': 'vitamin-tong-hop', 'rong-bien': 'an-dam', 'thuc-pham': 'organic', 'do-an': 'an-vat' };

  /* ---------- Tiện ích ---------- */
  function q(root, sel) {
    var out = [];
    if (!root) return out;
    if (root.nodeType === 1 && root.matches && root.matches(sel)) out.push(root);
    if (root.querySelectorAll) out.push.apply(out, root.querySelectorAll(sel));
    return out;
  }
  function vh() { return w.innerHeight || html.clientHeight || 800; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function mkSeen(k) { return typeof WeakSet === 'function' ? new WeakSet() : { has: function (e) { return e[k]; }, add: function (e) { e[k] = 1; } }; }
  var seen = mkSeen('__rdS1'), seenCount = mkSeen('__rdS2'), seenAmb = mkSeen('__rdS3'), seenMq = mkSeen('__rdS4');

  /* ---------- 1. Reveal / stagger / squiggle / count (một lần) ---------- */
  var pending = [];
  var ioOnce = hasIO ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var rb = en.rootBounds;
      if (en.intersectionRatio >= 0.15 || (rb && en.intersectionRect.height >= rb.height * 0.25)) {
        fire(en.target);
      }
    });
  }, { threshold: [0, 0.15] }) : null;

  var ioCount = hasIO ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting && en.intersectionRatio >= 0.15) { ioCount.unobserve(en.target); runCount(en.target); }
    });
  }, { threshold: [0, 0.15] }) : null;

  function fire(el) {
    if (ioOnce) ioOnce.unobserve(el);
    if (el.classList.contains('rd-in')) return;
    el.classList.add('rd-in');
    var delay = parseFloat(getComputedStyle(el).getPropertyValue('--rd-d')) || 0;
    var n = el.hasAttribute('data-rd-stagger') ? Math.min(el.children.length, 13) : 1;
    setTimeout(function () { el.classList.add('rd-done'); }, 600 + delay + (n - 1) * 70 + 120);
  }
  function reg(el, type) {
    var set = type === 'count' ? seenCount : seen;
    if (set.has(el)) return;
    set.add(el);
    if (type === 'count') el.__rdCount = 1; else el.__rdType = type;
    if (type === 'stagger') {
      for (var i = 0; i < el.children.length; i++) el.children[i].style.setProperty('--rd-i', Math.min(i, 12));
    }
    if (type === 'count') prepCount(el);
    if (!ioOnce || reduced) {
      if (type !== 'count') { el.classList.add('rd-in', 'rd-done'); }
      return;
    }
    pending.push({ el: el, count: type === 'count' });
    (type === 'count' ? ioCount : ioOnce).observe(el);
    armSafety();
  }
  // An toàn: sau 2,5s mọi phần tử đáng lẽ đã thấy (trong hoặc trên màn hình) đều hiện.
  var safetyT = 0;
  function armSafety() {
    clearTimeout(safetyT);
    safetyT = setTimeout(function () {
      var h = vh();
      pending = pending.filter(function (it) {
        var el = it.el;
        if (!el.isConnected) return false;
        if (it.count ? el.__rdCounted : el.classList.contains('rd-in')) return false;
        var r = el.getBoundingClientRect();
        if ((r.width || r.height) && r.top < h) {
          if (it.count) { ioCount.unobserve(el); runCount(el); } else fire(el);
          return false;
        }
        return true;
      });
    }, 2500);
  }
  function revealAll() {
    pending.forEach(function (it) {
      if (it.count) finishCount(it.el);
      else it.el.classList.add('rd-in', 'rd-done');
    });
    pending = [];
  }

  /* Đếm số: [data-rd-count] (giá trị = đích, hoặc để trống để lấy số trong chữ) */
  function parseVi(s) {
    var dec = 0, m = s.match(/,(\d{1,2})$/);
    if (m) dec = m[1].length;
    var n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
    return { n: isNaN(n) ? 0 : n, dec: dec };
  }
  function fmtVi(n, dec) {
    var p = n.toFixed(dec).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return p.join(',');
  }
  function prepCount(el) {
    var txt = el.textContent;
    var m = txt.match(/^([\s\S]*?)(\d[\d.,]*\d|\d)([\s\S]*)$/);
    var attr = el.getAttribute('data-rd-count');
    var pv = m ? parseVi(m[2]) : { n: 0, dec: 0 };
    var to = attr && !isNaN(parseFloat(attr)) ? parseFloat(attr) : pv.n;
    el.__rdC = { pre: m ? m[1] : '', post: m ? m[3] : '', to: to, dec: pv.dec, from: parseFloat(el.getAttribute('data-rd-from')) || 0,
      dur: parseFloat(el.getAttribute('data-rd-dur')) || 1200, final: m ? txt : String(to) };
    if (!reduced && ioOnce && m) el.textContent = el.__rdC.pre + fmtVi(el.__rdC.from, el.__rdC.dec) + el.__rdC.post;
  }
  function finishCount(el) { if (el.__rdC) el.textContent = el.__rdC.final; el.__rdCounted = 1; }
  function runCount(el) {
    var c = el.__rdC;
    if (!c || el.__rdCounted) return;
    el.__rdCounted = 1;
    if (reduced) return finishCount(el);
    var t0 = 0;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / c.dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = c.pre + fmtVi(c.from + (c.to - c.from) * e, c.dec) + c.post;
      if (p < 1) requestAnimationFrame(step); else el.textContent = c.final;
    }
    requestAnimationFrame(step);
  }

  /* Tự gắn reveal cho các khối phổ biến trong main#app (kể cả nội dung JS vẽ ra).
     Chỉ gắn cho phần tử đang nằm dưới màn hình, để không làm nháy nội dung đã thấy. */
  var AUTO = [
    ['.section-head', 'data-rd-reveal', 'up'],
    ['.grid', 'data-rd-stagger', 'up'],
    ['.row-scroll', 'data-rd-stagger', 'left'],
    ['.why__item', 'data-rd-reveal', 'up'],
    ['.review-card', 'data-rd-reveal', 'up'],
    ['.promo-tile', 'data-rd-reveal', 'pop']
  ];
  var NO_AUTO = 'form,[data-rd-noreveal],#sucKhoe,.modal,.drawer,#cartDrawer,#pdp,#cartPage,.hk-section,[data-rd-grow]';
  function autoTag(root) {
    var app = d.querySelector('main#app');
    if (!app || reduced || !ioOnce) return;
    var h = vh();
    AUTO.forEach(function (a) {
      q(root, a[0]).forEach(function (el) {
        if (!app.contains(el) || el.closest(NO_AUTO)) return;
        if (el.hasAttribute('data-rd-reveal') || el.hasAttribute('data-rd-stagger') || seen.has(el)) return;
        if (a[1] === 'data-rd-reveal' && el.closest('[data-rd-stagger],[data-rd-reveal]')) return;
        var r = el.getBoundingClientRect();
        if (!(r.width || r.height) || r.top < h) return;
        el.setAttribute(a[1], a[2]);
        el.setAttribute('data-rd-auto', '');
        reg(el, a[1] === 'data-rd-stagger' ? 'stagger' : 'reveal');
      });
    });
  }

  /* ---------- 2. Chuyển động nền: dừng khi ra khỏi màn hình ---------- */
  var ioAmb = hasIO ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      en.target.classList.toggle('rd-paused', !en.isIntersecting);
      var S = en.target.__rdGrow;
      if (S) stageVisible(S, en.isIntersecting && en.intersectionRatio >= 0.3);
    });
  }, { threshold: [0, 0.3, 0.6] }) : null;
  var AMB = { 'data-rd-float': [10, 16], 'data-rd-twinkle': [2.5, 4], 'data-rd-bob': [4.6, 5.4] };
  function ambient(el) {
    if (seenAmb.has(el)) return;
    seenAmb.add(el);
    for (var k in AMB) {
      if (!el.hasAttribute(k)) continue;
      var v = parseFloat(el.getAttribute(k));
      if (!el.style.getPropertyValue('--rd-dur-a')) el.style.setProperty('--rd-dur-a', (v > 0 ? v : rnd(AMB[k][0], AMB[k][1])).toFixed(2) + 's');
      if (!el.style.getPropertyValue('--rd-delay')) el.style.setProperty('--rd-delay', '-' + rnd(0, AMB[k][1]).toFixed(2) + 's');
      break;
    }
    if (ioAmb) ioAmb.observe(el);
  }
  function marquee(el) {
    if (seenMq.has(el)) return;
    var tr = el.querySelector('.rd-marquee__track');
    if (!tr || !tr.children.length) return;
    seenMq.add(el);
    if (!tr.hasAttribute('data-rd-cloned')) {
      tr.setAttribute('data-rd-cloned', '');
      var kids = Array.prototype.slice.call(tr.children);
      kids.forEach(function (k) {
        var c = k.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.removeAttribute('id');
        q(c, '[id]').forEach(function (x) { x.removeAttribute('id'); });
        q(c, 'a,button,input,[tabindex]').forEach(function (x) { x.setAttribute('tabindex', '-1'); });
        tr.appendChild(c);
      });
    }
    el.classList.add('rd-mq-ready');
    if (ioAmb) ioAmb.observe(el);
  }
  d.addEventListener('visibilitychange', function () { html.classList.toggle('rd-hidden', d.hidden); });

  /* ---------- 3. Pháo giấy + giỏ hàng ---------- */
  var COLORS = ['#F0537A', '#FFB020', '#17A398', '#B9A4FF', '#7CC4FF'];
  var CONF_ICONS = ['party', 'sparkles', 'star', 'heart-pink'];
  function layer() {
    var L = d.createElement('div');
    L.className = 'rd-fx-layer';
    L.setAttribute('aria-hidden', 'true');
    d.body.appendChild(L);
    return L;
  }
  function pointOf(o) {
    if (!o) return { x: w.innerWidth / 2, y: vh() / 2 };
    if (o.getBoundingClientRect) { var r = o.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    return { x: +o.x || 0, y: +o.y || 0 };
  }
  // confetti(elementHoặc{x,y}, {n}) – pháo giấy nhỏ bằng icon party/sparkles + chấm màu.
  function confetti(origin, opt) {
    if (reduced || !hasWA || !d.body) return;
    opt = opt || {};
    var p = pointOf(origin), L = layer(), n = opt.n || 12, longest = 0;
    for (var i = 0; i < n; i++) {
      var isIcon = i % 5 < 3, el;
      if (isIcon) {
        el = d.createElement('img');
        el.src = iconSrc(CONF_ICONS[i % CONF_ICONS.length]);
        el.alt = '';
      } else {
        el = d.createElement('span');
        el.style.background = COLORS[i % COLORS.length];
      }
      el.className = 'rd-confetti';
      L.appendChild(el);
      var a = (-90 + rnd(-75, 75)) * Math.PI / 180, dist = rnd(50, 110);
      var dx = Math.cos(a) * dist, dy = Math.sin(a) * dist, rot = rnd(-220, 220), s = isIcon ? rnd(.7, 1) : 1;
      var x0 = p.x - (isIcon ? 11 : 4), y0 = p.y - (isIcon ? 11 : 4), dur = rnd(850, 1150);
      longest = Math.max(longest, dur);
      el.animate([
        { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (x0 + dx * .7) + 'px,' + (y0 + dy) + 'px) scale(' + s + ') rotate(' + rot / 2 + 'deg)', opacity: 1, offset: .45 },
        { transform: 'translate(' + (x0 + dx) + 'px,' + (y0 + dy + 46) + 'px) scale(' + s * .9 + ') rotate(' + rot + 'deg)', opacity: 0 }
      ], { duration: dur, easing: 'cubic-bezier(.2,.6,.35,1)', fill: 'forwards' });
    }
    setTimeout(function () { L.remove(); }, longest + 80);
  }
  function restartClass(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    clearTimeout(el.__rdBumpT);
    el.__rdBumpT = setTimeout(function () { el.classList.remove(cls); }, 700);
  }
  var lastPress = { el: null, t: 0, type: 'mouse' };
  d.addEventListener('pointerdown', function (e) {
    lastPress.type = e.pointerType || 'mouse';
    var b = e.target.closest && e.target.closest('button,a,[role="button"]');
    if (b) { lastPress.el = b; lastPress.t = Date.now(); }
  }, { capture: true, passive: true });

  var counts = typeof WeakMap === 'function' ? new WeakMap() : null;
  function cartSeed(el) { if (counts && !counts.has(el)) counts.set(el, parseInt(el.textContent, 10) || 0); }
  function cartChanged(el) {
    if (!counts) return;
    var n = parseInt(el.textContent, 10) || 0;
    if (!counts.has(el)) { counts.set(el, n); return; }
    var prev = counts.get(el);
    counts.set(el, n);
    if (n === prev || reduced) return;
    var r = el.getBoundingClientRect();
    if (!(r.width && r.height) || el.offsetParent === null) {
      // số đang ẩn (ví dụ 0 -> 1 vừa bỏ .hide): dùng nút chứa nó
      var host = el.closest('[data-open-cart]') || el.parentElement;
      if (!host) return;
      r = host.getBoundingClientRect();
      if (!(r.width && r.height)) return;
    }
    restartClass(el, 'rd-bump');
    var btn = el.closest('[data-open-cart]');
    if (btn) restartClass(btn.querySelector('svg,img'), 'rd-bump');
    if (n > prev && d.body) {
      var L = layer(), s = d.createElement('span');
      s.className = 'rd-plus';
      s.textContent = '+' + (n - prev);
      s.style.left = (r.left + r.width / 2) + 'px';
      s.style.top = (r.top - 6) + 'px';
      L.appendChild(s);
      setTimeout(function () { L.remove(); }, 1000);
      // pháo giấy ở nút vừa bấm (nếu vừa bấm trong 1,5s và còn trên màn hình), không thì ở giỏ
      var o = (lastPress.el && Date.now() - lastPress.t < 1500 && lastPress.el.isConnected) ? lastPress.el : el;
      var orr = o.getBoundingClientRect();
      if (!(orr.width && orr.bottom > 0 && orr.top < vh())) o = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      confetti(o, { n: 10 });
    }
  }

  /* ---------- 4. Sân khấu "Bé lớn lên" (.rd-grow[data-rd-grow]) ---------- */
  var GROW = {
    grow:    { kid: 'girl', cm: true, bubble: 'Bé cao lên rồi nè!', props: [['b', 'bone', 'spin', 250]] },
    d3k2:    { kid: 'girl', cm: true, rays: true, bubble: 'Nắng sớm cho bé', props: [['b', 'bone', 'spin', 250], ['e', 'sun-face', 'rise']] },
    tangcan: { kid: 'child', kidfx: 'chubby', bubble: '+ ăn ngon', props: [['b', 'bowl', 'dip'], ['c', 'honey', 'pop', 280]] },
    dekhang: { kid: 'child', kidfx: 'hop', halo: true, bubble: 'Bé vui khỏe nè!', props: [['b', 'shield', 'pop', 150], ['d', 'sparkles', 'twinkle', 320], ['c', 'sparkles', 'twinkle', 520]] },
    phuchoi: { kid: 'child', kidfx: 'hop', halo: true, rays: true, bubble: 'Nắng lên rồi!', props: [['b', 'shield', 'pop', 150], ['e', 'sun-face', 'rise', 200], ['l', 'cloud', 'split-l'], ['r', 'cloud', 'split-r']] },
    trinao:  { kid: 'child', kidfx: 'tilt', bubble: 'Bé ham khám phá', props: [['d', 'bulb', 'pop', 120], ['a', 'star-glow', 'twinkle', 350], ['c', 'star', 'twinkle', 520]] },
    tieuhoa: { kid: 'child', kidfx: 'sway', bubble: 'Bụng bé vui ghê', props: [['b', 'leafy', 'pop'], ['c', 'heart-grow', 'pop', 220]] },
    vitamin: { kid: 'child', kidfx: 'hop', bubble: 'Đủ món ngon', orbit: ['pill', 'apple', 'carrot'] },
    andam:   { kid: 'baby', kidfx: 'hop', bubble: 'Bé tập ăn nè!', props: [['b', 'bowl', 'bounce'], ['c', 'rice-ball', 'bounce', 180]] },
    organic: { kid: 'child', bubble: 'Mầm xanh tự nhiên', props: [['b', 'sprout', 'sprout'], ['c', 'sprout', 'sprout', 260]] },
    sua:     { kid: 'baby', kidfx: 'hop', bubble: 'Ly sữa đầy ắp', props: [['b', 'milk', 'fill'], ['a', 'love', 'pop', 750]] },
    chome:   { kid: 'mom', bubble: 'Mẹ khỏe, bé vui', props: [['a', 'heart-sparkle', 'beat']] },
    lamdep:  { kid: 'mom', bubble: 'Mẹ xinh mỗi ngày', props: [['a', 'heart-sparkle', 'beat'], ['b', 'lotion', 'pop', 220]] },
    mebau:   { kid: 'pregnant', bubble: 'Mẹ bầu vui khỏe', props: [['a', 'heart-sparkle', 'beat']] },
    def:     { kid: 'child', kidfx: 'hop', bubble: 'Bé vui nè!', props: [['b', 'apple', 'pop'], ['d', 'sparkles', 'twinkle', 260]] }
  };
  var NEED_GROUP = {
    'tang-chieu-cao': 'grow', 'canxi': 'grow', 'd3k2': 'd3k2', 'tang-can': 'tangcan', 'an-ngon': 'tangcan',
    'de-khang': 'dekhang', 'phuc-hoi': 'phuchoi', 'tri-nao': 'trinao', 'tieu-hoa': 'tieuhoa', 'vitamin-tong-hop': 'vitamin',
    'an-dam': 'andam', 'organic': 'organic', 'sua-cong-thuc': 'sua', 'sua-tuoi': 'sua', 'cho-me': 'chome', 'lam-dep': 'lamdep',
    'me-bau': 'mebau', 'an-vat': 'def'
  };
  var DEFAULT_CYCLE = ['tang-chieu-cao', 'tang-can', 'de-khang', 'tri-nao', 'sua-tuoi', 'organic'];
  var RUN_MS = 1400;

  function img(slug, cls, z) {
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + iconSrc(slug) + '" alt="" width="' + (z || 96) + '" height="' + (z || 96) + '" loading="lazy" decoding="async">';
  }
  function kidImg(slug, cls) {
    return '<img class="' + cls + '" src="' + BASE + 'img/rd/kids/' + slug + '.webp" alt="" width="280" height="600" loading="lazy" decoding="async">';
  }
  function stageHTML() {
    return '<span class="rd-grow__floor"></span>' +
      '<span class="rd-grow__deco">' + img('cloud', 'rd-grow__cloud" data-rd-float="14', 64) + img('sparkles', 'rd-grow__star" data-rd-twinkle="', 48) + '</span>' +
      '<span class="rd-grow__ruler"><span class="rd-grow__ticks"></span><span class="rd-grow__lift"><span class="rd-grow__mark"><b data-rd-grow-cm>95</b>cm</span></span></span>' +
      '<span class="rd-grow__halo"></span><span class="rd-grow__rays"></span><span class="rd-grow__props"></span>' +
      '<span class="rd-grow__bob"><span class="rd-grow__kid">' +
        // nhân vật 3D cả người (img/rd/kids/, tạo bằng Higgsfield): em bé → bé chập chững → bé lớn; mẹ bế bé, mẹ bầu cùng bộ
        kidImg('em-be', 'rd-grow__k rd-grow__k--baby') + kidImg('chap-chung-gai', 'rd-grow__k rd-grow__k--child') + kidImg('be-gai', 'rd-grow__k rd-grow__k--girl') +
        kidImg('me-be', 'rd-grow__k rd-grow__k--mom') + kidImg('me-bau', 'rd-grow__k rd-grow__k--pregnant') +
      '</span></span><span class="rd-grow__bubble"></span>';
  }
  var liftOf = function (cm) { return -Math.max(0, Math.min(100, (cm - 50) / 80 * 100)); };

  function buildStage(st) {
    if (st.__rdGrow) return st.__rdGrow;
    if (!st.querySelector('.rd-grow__kid')) st.insertAdjacentHTML('afterbegin', stageHTML());
    if (!st.hasAttribute('aria-hidden') && !st.hasAttribute('role')) st.setAttribute('aria-hidden', 'true');
    if (!st.classList.contains('rd-grow')) st.classList.add('rd-grow');
    var S = {
      el: st, cmEl: st.querySelector('[data-rd-grow-cm]'), props: st.querySelector('.rd-grow__props'), bubble: st.querySelector('.rd-grow__bubble'),
      cm: parseFloat(st.getAttribute('data-rd-cm')) || 95, t: 0, raf: 0, auto: 0, idx: -1, stopped: st.getAttribute('data-rd-auto') === 'off', visible: false, started: false
    };
    st.__rdGrow = S;
    setCm(S, S.cm);
    if (!st.getAttribute('data-rd-kid')) st.setAttribute('data-rd-kid', 'child');
    st.classList.add('is-idle');
    q(st, '[data-rd-float],[data-rd-twinkle],[data-rd-bob]').forEach(ambient);
    if (ioAmb) ioAmb.observe(st); else stageVisible(S, true);
    return S;
  }
  function setCm(S, cm) {
    S.cm = cm;
    S.el.style.setProperty('--rd-lift', liftOf(cm).toFixed(2));
    if (S.cmEl) S.cmEl.textContent = Math.round(cm);
  }
  function countCm(S, a, b, c) {
    cancelAnimationFrame(S.raf);
    // khớp keyframes rd-g-lift: 0-6% a, 6-30% a->b, 30-46% b, 46-70% b->c, 70-100% c
    var t0 = 0, ease = function (p) { return 1 - Math.pow(1 - p, 3); };
    function val(p) {
      if (p < .06) return a;
      if (p < .30) return a + (b - a) * ease((p - .06) / .24);
      if (p < .46) return b;
      if (p < .70) return b + (c - b) * ease((p - .46) / .24);
      return c;
    }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / RUN_MS);
      if (S.cmEl) S.cmEl.textContent = Math.round(val(p));
      if (p < 1) S.raf = requestAnimationFrame(step);
    }
    S.raf = requestAnimationFrame(step);
  }
  function needLabel(key) {
    var list = w.NEEDS || [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].key === key) return list[i].label;
    return '';
  }
  function scopeOf(st) { return st.closest('[data-rd-grow-scope]'); }
  function chipsOf(st) {
    var sc = scopeOf(st);
    if (!sc) return [];
    return q(sc, '[data-rd-need]').filter(function (c) { return !c.querySelector('[data-rd-grow]') && stageFor(c) === st; });
  }

  // play(stage, need, {user, cm}) – một lượt ≤1,4s rồi đung đưa nhẹ.
  function play(st, need, o) {
    o = o || {};
    var S = buildStage(st);
    var g = NEED_GROUP[need] || 'def', cfg = GROW[g];
    if (o.user) stopAuto(S);
    S.need = need;
    st.setAttribute('data-rd-play', g);
    st.setAttribute('data-rd-need-now', need || '');
    st.setAttribute('data-rd-kid', cfg.kid);
    st.setAttribute('data-rd-kidfx', cfg.kidfx || '');
    st.toggleAttribute('data-rd-halo', !!cfg.halo);
    st.toggleAttribute('data-rd-rays', !!cfg.rays);
    var h = '';
    (cfg.props || []).forEach(function (p) {
      var inner = p[2] === 'fill'
        ? '<span class="rd-grow__fill">' + img(p[1]) + '<span class="rd-grow__mask">' + img(p[1]) + '</span></span>'
        : img(p[1]);
      h += '<span class="rd-grow__p rd-grow__p--' + p[0] + ' rd-fx-' + p[2] + '" style="--rd-pd:' + (p[3] || 0) + 'ms">' + inner + '</span>';
    });
    if (cfg.orbit) {
      h += '<span class="rd-grow__orbit">' + cfg.orbit.map(function (s, i) { return '<span class="rd-grow__o rd-grow__o--' + (i + 1) + '">' + img(s) + '</span>'; }).join('') + '</span>';
    }
    if (S.props) S.props.innerHTML = h;
    var bub = st.getAttribute('data-rd-bubble');
    if (S.bubble) S.bubble.textContent = bub != null ? bub : (o.bubble || cfg.bubble);
    // thước: nhu cầu lớn lên leo 60 -> giữa -> đích
    if (cfg.cm) {
      var target = o.cm || parseFloat(st.getAttribute('data-rd-cm-to')) || 120, from = 60, mid = Math.round(target === 120 ? 95 : (from + target) / 2);
      st.style.setProperty('--rd-l0', liftOf(from).toFixed(2));
      st.style.setProperty('--rd-l1', liftOf(mid).toFixed(2));
      st.style.setProperty('--rd-l2', liftOf(target).toFixed(2));
      setCm(S, target);
      if (!reduced) countCm(S, from, mid, target);
    }
    markChips(S, need);
    clearTimeout(S.t);
    st.classList.remove('is-run', 'is-idle');
    if (!reduced) {
      void st.offsetWidth;
      st.classList.add('is-run');
      S.t = setTimeout(function () { st.classList.remove('is-run'); st.classList.add('is-idle'); }, RUN_MS + 50);
    }
    try { st.dispatchEvent(new CustomEvent('rd:grow', { bubbles: true, detail: { need: need, group: g, user: !!o.user } })); } catch (e) { /* IE */ }
    return st;
  }
  function markChips(S, need) {
    var sc = scopeOf(S.el);
    chipsOf(S.el).forEach(function (c) { c.classList.toggle('rd-on', c.getAttribute('data-rd-need') === need); });
    if (!sc || !need) return;
    q(sc, '[data-rd-need-link]').forEach(function (a) {
      var tpl = a.getAttribute('data-rd-need-link') || '';
      a.setAttribute('href', tpl.indexOf('{need}') >= 0 ? tpl.replace('{need}', encodeURIComponent(need)) : 'collections.html?need=' + encodeURIComponent(need));
    });
    var lb = needLabel(need);
    if (lb) q(sc, '[data-rd-need-label]').forEach(function (x) { x.textContent = lb; });
  }

  /* Tự diễn lần lượt mỗi 4s khi sân khấu lộ ra; dừng ngay khi mẹ tương tác */
  function cycleOf(S) {
    var list = chipsOf(S.el).map(function (c) { return c.getAttribute('data-rd-need'); });
    var attr = S.el.getAttribute('data-rd-cycle');
    if (attr) list = attr.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    return list.length ? list : DEFAULT_CYCLE;
  }
  function stageVisible(S, vis) {
    S.visible = vis;
    if (vis && !S.started) {
      S.started = true;
      var intro = parseFloat(S.el.getAttribute('data-rd-intro'));
      if (intro) { play(S.el, 'tang-chieu-cao', { cm: intro }); }
      else if (reduced || S.el.classList.contains('rd-grow--mini')) {
        var first = S.el.getAttribute('data-rd-need-start') || (S.el.classList.contains('rd-grow--mini') ? null : cycleOf(S)[0]);
        if (first) play(S.el, first);
      }
    }
    if (reduced || S.stopped || S.el.classList.contains('rd-grow--mini')) return;
    if (vis && !S.auto) {
      var tick = function () {
        if (d.hidden || !S.visible) return;
        var list = cycleOf(S);
        S.idx = (S.idx + 1) % list.length;
        play(S.el, list[S.idx]);
      };
      if (!parseFloat(S.el.getAttribute('data-rd-intro'))) setTimeout(function () { if (S.visible && !S.stopped && S.idx < 0) tick(); }, 350);
      S.auto = setInterval(tick, 4000);
    } else if (!vis && S.auto) {
      clearInterval(S.auto);
      S.auto = 0;
    }
  }
  function stopAuto(S) {
    S.stopped = true;
    if (S.auto) { clearInterval(S.auto); S.auto = 0; }
  }

  /* Chip [data-rd-need]: rê chuột (pointer fine), focus bàn phím, chạm (touch) */
  function stageFor(chip) {
    var inner = chip.querySelector('[data-rd-grow]');
    if (inner) return inner;
    var t = chip.getAttribute('data-rd-target');
    if (t) { try { var x = d.querySelector(t); if (x) return x; } catch (e) { /* selector sai */ } }
    var sc = chip.closest('[data-rd-grow-scope]');
    return sc ? sc.querySelector('[data-rd-grow]') : null;
  }
  function trigger(chip) {
    var need = chip.getAttribute('data-rd-need');
    if (!need) return;
    var now = Date.now();
    if (chip.__rdLast && now - chip.__rdLast < 700) return;
    chip.__rdLast = now;
    var st = stageFor(chip);
    if (st) play(st, need, { user: true });
    if (!reduced && chip.querySelector('.rd-emo')) restartClass(chip, 'rd-need-pop');
  }
  function needOf(t) { return t && t.closest ? t.closest('[data-rd-need]') : null; }
  d.addEventListener('pointerover', function (e) {
    if ((e.pointerType && e.pointerType !== 'mouse') || !FINE.matches) return;
    var c = needOf(e.target);
    if (!c || (e.relatedTarget && c.contains(e.relatedTarget))) return;
    trigger(c);
  }, { passive: true });
  d.addEventListener('focusin', function (e) {
    var c = needOf(e.target);
    if (c && lastPress.type === 'mouse' && Date.now() - lastPress.t < 400) return; // focus do bấm chuột: hover đã diễn
    if (c) trigger(c);
  });
  d.addEventListener('click', function (e) {
    var c = needOf(e.target);
    if (!c) return;
    var touch = lastPress.type !== 'mouse';
    // Thẻ <a data-rd-tap-first>: chạm lần đầu chỉ diễn, chạm lần hai mới mở link.
    if (touch && c.tagName === 'A' && c.hasAttribute('data-rd-tap-first') && !c.classList.contains('rd-on')) {
      e.preventDefault();
      c.__rdLast = 0;
      trigger(c);
      c.classList.add('rd-on');
      return;
    }
    if (touch || c.tagName !== 'A') trigger(c);
  });
  // Mẹ chạm / gõ phím trong vùng sân khấu: dừng tự diễn
  ['pointerdown', 'keydown'].forEach(function (ev) {
    d.addEventListener(ev, function (e) {
      var sc = e.target.closest && e.target.closest('[data-rd-grow-scope],[data-rd-grow]');
      if (!sc) return;
      q(sc, '[data-rd-grow]').forEach(function (st) { if (st.__rdGrow) stopAuto(st.__rdGrow); });
      var up = sc.closest && sc.closest('[data-rd-grow-scope]');
      if (up && up !== sc) q(up, '[data-rd-grow]').forEach(function (st) { if (st.__rdGrow) stopAuto(st.__rdGrow); });
    }, { passive: true, capture: true });
  });

  /* ---------- 5. Quét DOM + theo dõi nội dung JS vẽ ra ---------- */
  function scan(root) {
    root = root || d;
    q(root, '[data-rd-reveal]').forEach(function (el) { reg(el, 'reveal'); });
    q(root, '[data-rd-stagger]').forEach(function (el) { reg(el, 'stagger'); });
    q(root, '.rd-squiggle,.section-head h2,[data-rd-draw]').forEach(function (el) { reg(el, 'draw'); });
    q(root, '[data-rd-count]').forEach(function (el) { reg(el, 'count'); });
    q(root, '[data-rd-float],[data-rd-twinkle],[data-rd-bob],.rd-doodle--wave,.rd-doodle--hop,.rd-doodle--bob').forEach(ambient);
    q(root, '[data-rd-marquee]').forEach(marquee);
    q(root, '[data-rd-grow]').forEach(buildStage);
    q(root, '[data-cart-count]').forEach(cartSeed);
    autoTag(root);
  }
  var queue = [], qT = 0;
  function flush() {
    qT = 0;
    var list = queue;
    queue = [];
    list.forEach(function (n) { if (n.isConnected) scan(n); });
  }
  function onMut(muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i], t = m.target;
      var el = t.nodeType === 1 ? t : t.parentElement;
      if (!el) continue;
      var cc = el.closest('[data-cart-count]');
      if (cc) { cartChanged(cc); continue; }
      if (m.type !== 'childList') continue;
      for (var j = 0; j < m.addedNodes.length; j++) {
        var a = m.addedNodes[j];
        if (a.nodeType !== 1 || a.classList.contains('rd-fx-layer') || (a.closest && a.closest('.rd-grow__props'))) continue;
        queue.push(a);
      }
    }
    if (queue.length && !qT) qT = setTimeout(flush, 40);
  }

  function init() {
    scan(d);
    if ('MutationObserver' in w && d.body) {
      new MutationObserver(onMut).observe(d.body, { childList: true, subtree: true, characterData: true });
    }
    armSafety();
  }

  /* Đổi cài đặt giảm chuyển động khi đang mở trang */
  function onRM() {
    reduced = !!RMQ.matches;
    html.classList.toggle('rd-reduced', reduced);
    if (reduced) {
      html.classList.remove('rd-motion');
      revealAll();
      q(d, '[data-rd-grow]').forEach(function (st) {
        var S = st.__rdGrow;
        if (!S) return;
        stopAuto(S);
        st.classList.remove('is-run');
        cancelAnimationFrame(S.raf);
        setCm(S, S.cm);
      });
    } else if (hasIO) html.classList.add('rd-motion');
  }
  if (RMQ.addEventListener) RMQ.addEventListener('change', onRM); else if (RMQ.addListener) RMQ.addListener(onRM);
  w.addEventListener('beforeprint', revealAll);

  /* ---------- API ---------- */
  w.RD = {
    __v: 'lc1',
    get reduced() { return reduced; },
    refresh: function (root) { scan(root || d); armSafety(); },
    grow: function (stageEl, needKey, opts) {
      if (!stageEl) return null;
      if (!needKey) { buildStage(stageEl); return stageEl; }
      return play(stageEl, needKey, opts);
    },
    stop: function (stageEl) { var S = stageEl && stageEl.__rdGrow; if (S) stopAuto(S); },
    icon: icon,
    slug: slugOf,
    iconSrc: iconSrc,
    needIcon: function (key, o) { return NEED_ICON[key] ? icon(NEED_ICON[key], o) : ''; },
    ageIcon: function (key, o) { return AGE_ICON[key] ? icon(AGE_ICON[key], o) : ''; },
    catNeed: function (catKey) { return CAT_NEED[catKey] || null; },
    doodle: doodle,
    confetti: confetti,
    reveal: function (el) { if (el) { reg(el, el.hasAttribute('data-rd-stagger') ? 'stagger' : 'reveal'); fire(el); } }
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})();
