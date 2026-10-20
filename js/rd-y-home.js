/* =====================================================================
   Ý tưởng đã duyệt cho TRANG CHỦ (design/y-tuong/ideas.json): Y02, Y06, Y08, Y10, Y14, Y15, Y16.
   Lớp hiển thị bổ sung: chỉ ĐỌC dữ liệu có sẵn (SITE, PRODUCTS, NEEDS, AGES, BRANDS, HK_GROWTH.GIAI_DOAN,
   hồ sơ bé lưu trên máy mẹ 'hck_suckhoe') rồi chèn thêm giao diện. Không đổi cách các tính năng cũ chạy
   (công cụ đo chỉ số, giỏ hàng, chat, lớp lễ hội, thứ tự khối data-khoi do Quản trị sắp).
   CSS đi kèm: css/rd/y-home.css. Nạp bằng defer: chạy sau suc-khoe.js; phần cần nội dung của trang chủ
   (khối Hành trình lớn lên, Giới thiệu) chờ DOMContentLoaded để chạy sau đoạn script cuối index.html.
   Tắt một ý tưởng: đổi true → false trong BAT bên dưới.
   ===================================================================== */
(function () {
  'use strict';

  /* Y08 ("Bạn có biết?" theo chặng) đã gộp vào Y02: mỗi ngày 1 điều, bé trong hình diễn theo điều đó */
  const BAT = { Y02: true, Y06: true, Y08: false, Y10: true, Y14: true, Y15: true, Y16: true };

  /* Ảnh thật cho câu chuyện "Từ nhà sản xuất đến tay mẹ" (Y10), theo thứ tự 4 chương:
     nhà sản xuất · tem phụ, giấy công bố · kho Hương Chất Kids · giao hàng.
     Để trống thì chương dùng minh hoạ icon 3D. Khi shop gửi ảnh, điền đường dẫn (vd 'img/cau-chuyen/kho.jpg'). */
  const ANH_CHUONG = ['', '', '', ''];

  const main = document.querySelector('main#app.rd-home');
  if (!main) return;

  /* ---------------- Tiện ích chung ---------------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const MC = () => window.MC || {};
  const esc = (s) => (MC().esc ? MC().esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const fmt = (n) => (MC().fmt ? MC().fmt(n) : (Math.round(n) || 0).toLocaleString('vi-VN') + '₫');
  const ic = (slug, size, cls, alt) => (MC().rdIcon
    ? MC().rdIcon(slug, size || 28, alt || '', cls || '')
    : `<img class="rd-emo${cls ? ' ' + cls : ''}" src="img/rd/icons/${slug}.webp" alt="${esc(alt || '')}" width="${size || 28}" height="${size || 28}" loading="lazy" decoding="async">`);
  const giam = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const chuot = () => !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  const muiTen = () => ((MC().I && MC().I.arrowR) || '<span aria-hidden="true">→</span>');
  const so = (x) => Number(x).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  const thu = (ten, fn) => { try { fn(); } catch (err) { if (window.console) console.warn('[rd-y-home] ' + ten, err); } };

  /* Hồ sơ bé trên máy mẹ (cùng điều kiện với suc-khoe.js). Chỉ đọc. */
  function hoSo() {
    try {
      const d = MC().store && MC().store.get('hck_suckhoe');
      return d && d.dob && d.sex && Array.isArray(d.log) && d.log.length ? d : null;
    } catch (e) { return null; }
  }
  const tenBe = (hs) => String((hs && hs.name) || '').trim();
  function thangTuoi(dob) {
    const p = String(dob).split('-').map(Number);
    const a = new Date(p[0], (p[1] || 1) - 1, p[2] || 1), b = new Date();
    let m = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
    if (b.getDate() < a.getDate()) m--;
    return Math.max(0, m);
  }
  const giaiDoan = (m) => (m < 6 ? '0-6m' : m < 12 ? '6-12m' : m < 36 ? '1-3y' : m < 72 ? '3-6y' : m < 144 ? '6-12y' : '12-18y');
  const nhanTuoi = (k) => (((window.AGES || []).find((a) => a.key === k) || {}).label || k);

  /* Sản phẩm: còn hàng, không phải combo, không phải đồ cho mẹ */
  const dungDuoc = (p) => p && p.stock !== 0 && !p.isCombo && p.cat !== 'cho-me';
  /* Trả về { ds, theoTuoi }: có chặng tuổi thì chỉ lấy món hợp tuổi; không có món nào hợp tuổi mới lấy chung */
  function chonSP(o) {
    const needs = o.needs || [], tuoi = o.tuoi || '', n = o.n || 2;
    const goc = (window.PRODUCTS || []).filter(dungDuoc).filter((p) => !needs.length || needs.some((k) => (p.needs || []).includes(k)));
    const diem = (p) => needs.filter((k) => (p.needs || []).includes(k)).length;
    const xep = (a, b) => diem(b) - diem(a) || (b.sold || 0) - (a.sold || 0);
    const hopTuoi = tuoi ? goc.filter((p) => (p.ages || []).includes(tuoi)) : [];
    if (hopTuoi.length) return { ds: hopTuoi.sort(xep).slice(0, n), theoTuoi: true };
    return { ds: goc.slice().sort(xep).slice(0, n), theoTuoi: false };
  }
  /* Lần vẽ đầu có hiệu ứng vào; hero bị suc-khoe.js vẽ lại thì gắn .yh-yen để không diễn lại */
  const daVe = {};
  const yen = (k) => { const r = daVe[k] ? ' yh-yen' : ''; daVe[k] = true; return r; };
  const thumb = (p) => (MC().productThumb ? MC().productThumb(p) : (p.thumb || p.image || ''));
  const tenSP = (p) => (MC().shortName ? MC().shortName(p) : (p.short || p.name || ''));
  const spHang = (p) => `<a class="yh-sp" href="${MC().spUrl ? MC().spUrl(p) : 'product.html?id=' + encodeURIComponent(p.id)}">
      <img class="yh-sp__img" src="${esc(thumb(p))}" alt="" width="56" height="56" loading="lazy" decoding="async">
      <span class="yh-sp__txt"><b>${esc(tenSP(p))}</b><small>${fmt(p.price)}</small></span>
      <span class="yh-sp__go" aria-hidden="true">${(MC().I && MC().I.chevronR) || '›'}</span>
    </a>`;

  /* =====================================================================
     Y06 · Dải cam kết chạy ngang chậm dưới hero
     ===================================================================== */
  function y06() {
    const box = $('#sucKhoe > .container');
    if (!box || $('.yh-cam', box)) return;
    const S = window.SITE || {};
    const gio = String(S.workingHours || '').match(/(\d{1,2}[:h]\d{2})\s*[–-]\s*(\d{1,2}[:h]\d{2})/);
    const ds = [
      ['check', 'Chính hãng 100%, tem phụ tiếng Việt'],
      ['ribbon', 'Hoá đơn VAT theo yêu cầu'],
      ['expert', 'Chuyên gia dinh dưỡng tư vấn miễn phí' + (gio ? ` ${gio[1]}–${gio[2]}` : '')],
      ['package', 'Đổi trả miễn phí 7 ngày'],
      ['search', 'Kiểm tra hàng trước khi thanh toán'],
      S.freeshipFrom ? ['truck', 'Freeship đơn từ ' + fmt(S.freeshipFrom)] : null,
      ['clock', 'Hà Nội giao trong ngày'],
    ].filter(Boolean);
    const li = ds.map(([s, t]) => `<li class="yh-cam__item">${ic(s, 24)}<span>${esc(t)}</span></li>`).join('');
    const el = document.createElement('div');
    el.className = 'yh-cam';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Cam kết của Hương Chất Kids');
    el.innerHTML = `<div class="yh-cam__track"><ul class="yh-cam__list">${li}</ul><ul class="yh-cam__list" aria-hidden="true">${li}</ul></div>`;
    /* Đặt dưới hero (và dưới bảng kết quả khi mẹ mở ra), trên khối "Bé nhà mình đang cần gì?";
       nằm ngoài #hkCard nên không bị vẽ lại khi suc-khoe.js cập nhật hero. */
    const need = $('#hkNeed', box);
    if (need) box.insertBefore(el, need); else box.appendChild(el);

    /* Tốc độ đều ~28px/giây, không phụ thuộc độ dài chữ */
    const tocDo = () => { const w = $('.yh-cam__list', el).scrollWidth; if (w) el.style.setProperty('--yh-cam-dur', Math.max(30, Math.round(w / 28)) + 's'); };
    tocDo();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(tocDo);
    /* Chạm thì dừng, nhấc tay 1,8 giây sau chạy tiếp */
    let hen = 0;
    el.addEventListener('touchstart', () => { clearTimeout(hen); el.classList.add('is-held'); }, { passive: true });
    const tha = () => { clearTimeout(hen); hen = setTimeout(() => el.classList.remove('is-held'), 1800); };
    el.addEventListener('touchend', tha, { passive: true });
    el.addEventListener('touchcancel', tha, { passive: true });
    /* Ra khỏi màn hình thì dừng hẳn (đỡ tốn pin) */
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => el.classList.toggle('is-off', !e.isIntersecting))).observe(el);
  }

  /* =====================================================================
     Y16 · Lời chào theo giờ · Y15 · Dòng chữ đổi theo giai đoạn · Y14 · Chip kính mờ
     Hero nằm trong #hkCard và được suc-khoe.js vẽ lại khi mẹ đo / lưu / xem kết quả:
     apHero() chạy lại mỗi lần đó (MutationObserver), chỉ chèn khi thiếu, chỉ sửa khi nội dung đổi.
     ===================================================================== */
  const trangThaiHero = (hero) => (!hero.classList.contains('hk-hero--saved') ? 'chung' : $('[data-hk-luu]', hero) ? 'tam' : 'luu');

  function y16(hero, hs, tt) {
    const h = new Date().getHours();
    /* Hero đã lưu đã có tiêu đề "Chào mẹ của bé X": lời chào nhắc tên bé theo kiểu khác để không lặp lại tiêu đề.
       Hero chung (chưa lưu) và hero tra cứu tạm (có thể là bé khác) thì chào chung. */
    const ten = tt === 'luu' ? tenBe(hs) : '';
    const be = ten ? 'bé ' + ten : '';
    let ico, txt;
    if (h >= 5 && h < 10) { ico = 'sun'; txt = be ? `Buổi sáng vui vẻ cùng ${be} nhé mẹ!` : 'Chào buổi sáng mẹ!'; }
    else if (h >= 10 && h < 13) { ico = 'sun-face'; txt = be ? `Mẹ và ${be} ăn trưa chưa?` : 'Mẹ ăn trưa chưa?'; }
    else if (h >= 13 && h < 18) { ico = 'cloud'; txt = be ? `Buổi chiều vui vẻ cùng ${be} nhé mẹ!` : 'Buổi chiều vui vẻ mẹ nhé!'; }
    else if (h >= 18 && h < 22) { ico = 'moon'; txt = be ? `Buổi tối ấm áp bên ${be} nhé mẹ!` : 'Buổi tối ấm áp mẹ nhé!'; }
    else { ico = 'moon'; txt = be ? `Khuya rồi, ${be} ngủ ngon chưa mẹ?` : 'Khuya rồi, bé ngủ ngon chưa mẹ?'; }
    const sig = ico + '|' + txt;
    const cu = $('.yh-chao', hero);
    if (cu && cu.dataset.sig === sig) return;
    const big = $('.hk-hero__big', hero);
    if (!big) return;
    const el = cu || document.createElement('p');
    el.className = cu ? cu.className : 'yh-chao' + yen('Y16');
    el.dataset.sig = sig;
    el.innerHTML = `<span class="yh-chao__ic">${ic(ico, 26)}</span><span>${esc(txt)}</span>`;
    if (!cu) big.parentNode.insertBefore(el, big);
  }

  const CUM = ['mẹ bầu', 'bé sơ sinh', 'bé tập đi', 'bé đi học'];
  const CUM_GD = { '0-6m': 'bé sơ sinh', '6-12m': 'bé ăn dặm', '1-3y': 'bé tập đi', '3-6y': 'bé mầm non', '6-12y': 'bé đi học', '12-18y': 'tuổi teen' };
  function y15(hero, hs, tt) {
    /* Mẹ đã lưu bé: đứng yên ở đúng chặng của bé. Còn lại: đổi lần lượt 4 cụm mỗi 2,5 giây */
    const tinh = tt === 'luu' && hs ? CUM_GD[giaiDoan(thangTuoi(hs.dob))] : '';
    const ds = tinh ? [tinh] : CUM;
    const sig = ds.join('|');
    const cu = $('.yh-rot', hero);
    if (cu && cu.dataset.sig === sig) return;
    const big = $('.hk-hero__big', hero);
    if (!big) return;
    const el = cu || document.createElement('p');
    el.className = cu ? cu.className : 'yh-rot' + yen('Y15');
    el.dataset.sig = sig;
    const hl = ['#FFD3DF', '#FFE7A3', '#BDEDE5', '#D3E3FF']; // hồng, bơ, bạc hà, trời (chữ mực trên nền này > 10:1)
    el.innerHTML = `Dinh dưỡng chính hãng cho <span class="yh-rot__box"${ds.length > 1 ? ' data-xoay aria-hidden="true"' : ''}>${ds.map((w, i) => `<span class="yh-rot__w${i ? '' : ' is-on'}" style="--yh-hl:${hl[i % hl.length]}">${esc(w)}</span>`).join('')}</span>${ds.length > 1 ? `<span class="sr-only">${esc(CUM.slice(0, -1).join(', '))} và ${esc(CUM[CUM.length - 1])}</span>` : ''}`;
    if (!cu) big.parentNode.insertBefore(el, big.nextSibling);
  }
  let xoayHen = 0;
  function xoayCum() {
    if (xoayHen || giam()) return;
    xoayHen = setInterval(() => {
      if (document.hidden) return;
      const box = $('#hkCard .yh-rot__box[data-xoay]');
      if (!box) return;
      const r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const ws = $$('.yh-rot__w', box);
      const i = ws.findIndex((w) => w.classList.contains('is-on'));
      ws.forEach((w) => w.classList.remove('is-out'));
      if (i >= 0) { ws[i].classList.remove('is-on'); ws[i].classList.add('is-out'); }
      ws[(i + 1) % ws.length].classList.add('is-on');
    }, 2500);
  }

  function y14(hero, hs, tt) {
    const art = $('.hk-hero__art', hero);
    if (!art) return;
    let chip = null;
    if (tt === 'chung' || !hs) {
      chip = { vd: true, ten: 'Bé Na', so: '+1,2 cm', phu: 'so với lần trước' };
    } else if (tt === 'luu') {
      const log = hs.log, cuoi = log[log.length - 1], ten = tenBe(hs) ? 'Bé ' + tenBe(hs) : 'Bé';
      if (log.length >= 2) {
        const tr = log[log.length - 2], d = Math.round((Number(cuoi.h) - Number(tr.h)) * 10) / 10;
        chip = { ten, so: (d > 0 ? '+' : d < 0 ? '−' : '±') + so(Math.abs(d)) + ' cm', phu: 'so với lần trước' };
      } else {
        chip = { ten, so: so(cuoi.h) + ' cm', phu: 'lần đo gần nhất' };
      }
    } /* hero tra cứu tạm (bé khác, chưa lưu): không gắn chip để khỏi lẫn số */
    const sig = chip ? JSON.stringify(chip) : '';
    const cu = $('.yh-glass', art);
    if (cu && cu.dataset.sig === sig) return;
    if (cu) cu.remove();
    if (!chip) return;
    const el = document.createElement('div');
    el.className = 'yh-glass' + (chip.vd ? ' yh-glass--vd' : '');
    el.dataset.sig = sig;
    el.innerHTML = `<span class="yh-glass__chip">
        ${chip.vd ? '<span class="rd-sticker-text rd-sticker-text--sky yh-glass__vd">Ví dụ</span>' : ''}
        <span class="yh-glass__ic">${ic('ruler', 28)}</span>
        <span class="yh-glass__txt"><b>${esc(chip.ten)}</b><em>${esc(chip.so)}</em><small>${esc(chip.phu)}</small></span>
      </span>`;
    art.appendChild(el);
  }

  function apHero() {
    const hero = $('#hkCard .hk-hero');
    if (!hero) return;
    const hs = hoSo(), tt = trangThaiHero(hero);
    if (BAT.Y16) thu('Y16', () => y16(hero, hs, tt));
    if (BAT.Y15) thu('Y15', () => y15(hero, hs, tt));
    if (BAT.Y14) thu('Y14', () => y14(hero, hs, tt));
    if (BAT.Y02) thu('Y02 kid', () => y02Kid());
  }

  /* =====================================================================
     Y02 · Bản đồ cơ thể bé: chạm chấm sáng → đường kẻ tự vẽ tới thẻ dưỡng chất + món của shop
     ===================================================================== */
  /* Toạ độ chấm (% bề ngang, % chiều cao ảnh) cho từng nhân vật 3D trong img/rd/kids/ */
  const KID = {
    'em-be': { w: 303, h: 600, p: { 'tri-nao': [50, 8], 'tang-can': [79, 37], 'de-khang': [20, 52], 'tieu-hoa': [55, 68], canxi: [33, 89] } },
    'chap-chung-gai': { w: 258, h: 600, p: { 'tri-nao': [52, 9], 'tang-can': [80, 34], 'de-khang': [17, 50], 'tieu-hoa': [50, 60], canxi: [34, 85] } },
    'chap-chung-trai': { w: 235, h: 600, p: { 'tri-nao': [52, 8], 'tang-can': [82, 31], 'de-khang': [16, 48], 'tieu-hoa': [50, 59], canxi: [34, 86] } },
    'be-gai': { w: 296, h: 600, p: { 'tri-nao': [50, 8], 'tang-can': [75, 30], 'de-khang': [24, 44], 'tieu-hoa': [50, 55], canxi: [38, 84] } },
    'be-trai': { w: 212, h: 600, p: { 'tri-nao': [52, 8], 'tang-can': [82, 29], 'de-khang': [17, 44], 'tieu-hoa': [50, 57], canxi: [36, 82] } },
    'teen-gai': { w: 214, h: 600, p: { 'tri-nao': [55, 8], 'tang-can': [72, 21], 'de-khang': [20, 40], 'tieu-hoa': [52, 45], canxi: [40, 80] } },
    'teen-trai': { w: 205, h: 600, p: { 'tri-nao': [52, 8], 'tang-can': [70, 18], 'de-khang': [18, 36], 'tieu-hoa': [50, 44], canxi: [38, 80] } },
  };
  /* Nội dung trung tính, khớp phần dinh dưỡng của công cụ đo chỉ số; không viết công dụng chữa bệnh */
  const DIEM = [
    { k: 'tri-nao', ic: 'brain', bo: 'Đầu', ten: 'Trí não', chat: 'DHA · Sắt · Kẽm', needs: ['tri-nao'], link: 'tri-nao',
      note: 'DHA, sắt và kẽm góp phần hỗ trợ phát triển trí não, trí nhớ và khả năng tập trung của bé.' },
    { k: 'tang-can', ic: 'honey', bo: 'Miệng', ten: 'Ăn ngon miệng', chat: 'Kẽm · Đạm', needs: ['tang-can'], link: 'tang-can',
      note: 'Kẽm góp phần hỗ trợ vị giác, giúp bé ăn ngon miệng hơn. Đạm giúp tạo cơ khi bé lớn.' },
    { k: 'de-khang', ic: 'shield', bo: 'Cả cơ thể', ten: 'Sức đề kháng', chat: 'Vitamin C · Vitamin D · Kẽm', needs: ['de-khang'], link: 'de-khang',
      note: 'Vitamin C, vitamin D và kẽm góp phần hỗ trợ sức đề kháng, giúp bé khoẻ mạnh mỗi ngày.' },
    { k: 'tieu-hoa', ic: 'leafy', bo: 'Bụng', ten: 'Tiêu hoá', chat: 'Chất xơ · Lợi khuẩn', needs: ['tieu-hoa'], link: 'tieu-hoa',
      note: 'Chất xơ và lợi khuẩn (men vi sinh) góp phần hỗ trợ tiêu hoá, giúp bé ít táo bón.' },
    { k: 'canxi', ic: 'bone', bo: 'Xương và chân', ten: 'Xương chắc, cao lớn', chat: 'Canxi · Vitamin D3 · K2', needs: ['canxi', 'tang-chieu-cao'], link: 'tang-chieu-cao',
      note: 'Canxi, D3K2 góp phần hỗ trợ xương chắc khoẻ và phát triển chiều cao.' },
  ];
  /* ---------- "Bạn có biết?" mỗi ngày 1 điều ----------
     Nguồn: dữ liệu dinh dưỡng theo giai đoạn của công cụ đo chỉ số (HK_GROWTH.GIAI_DOAN, lượng theo IOM/NIH, DHA theo EFSA).
     Mỗi dưỡng chất gắn với 1 chấm trên người bé và 1 kiểu bé diễn (act). */
  const ACT = { 'tri-nao': ['sang', 'bulb'], 'tang-can': ['nhun', 'heart-grow'], 'de-khang': ['khien', 'shield'], 'tieu-hoa': ['lac', 'leafy'], canxi: ['cao', 'bone'] };
  function chatVao(ten, viSao) {
    const t = (ten + ' · ' + viSao).toLowerCase();
    if (/^sữa mẹ/.test(t)) return { k: 'de-khang' };
    if (/dha|epa/.test(t)) return { k: 'tri-nao' };
    if (/canxi|vitamin d|vitamin k/.test(t)) return { k: 'canxi' };
    if (/chất xơ|lợi khuẩn|men vi sinh/.test(t)) return { k: 'tieu-hoa' };
    if (/vitamin c|đề kháng|kháng thể/.test(t)) return { k: 'de-khang' };
    if (/đạm|protein/.test(t)) return { k: 'canxi', ic: 'muscle' };
    if (/sắt|kẽm|ăn ngon|vị giác/.test(t)) return { k: 'tang-can' };
    return { k: 'de-khang', ic: 'sparkles' };
  }
  function dsFact() {
    const GD = (window.HK_GROWTH && window.HK_GROWTH.GIAI_DOAN) || {};
    const hs = hoSo(), cuaBe = hs ? giaiDoan(thangTuoi(hs.dob)) : '';
    const keys = cuaBe && GD[cuaBe] ? [cuaBe] : Object.keys(GD);
    const out = [];
    keys.forEach((gd) => ((GD[gd] && GD[gd].chat) || []).forEach((c) => {
      if (!c || !c[0]) return;
      const v = chatVao(c[0], c[2] || '');
      /* Lượng có thể khác theo giới tính (VD sắt tuổi teen: { 1: trai, 2: gái }), giống cách suc-khoe.js hiển thị */
      const L = c[1] && typeof c[1] === 'object' ? (hs && c[1][hs.sex] ? c[1][hs.sex] : `bé trai ${c[1][1]}, bé gái ${c[1][2]}`) : (c[1] || '');
      out.push({ gd, ten: c[0], luong: String(L), viSao: c[2] || '', nguon: c[3] || '', k: v.k, ic: v.ic || ACT[v.k][1], act: ACT[v.k][0] });
    }));
    return out;
  }
  const ngaySo = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
  const thuong = (s) => { s = String(s || ''); return /^.[A-ZĐ]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); }; // "Canxi" → "canxi", giữ "DHA"
  function cauFact(f) {
    const tuoi = esc(nhanTuoi(f.gd));
    return /^\d/.test(f.luong)
      ? `Bé ${tuoi} cần khoảng <b>${esc(f.luong)} ${esc(thuong(f.ten))}</b> mỗi ngày.`
      : `<b>${esc(f.ten)}</b> cho bé ${tuoi}: ${esc(thuong(f.luong))}.`;
  }

  function kidCuaBe(hs) {
    if (!hs) return 'be-gai';
    const m = thangTuoi(hs.dob);
    if (m < 12) return 'em-be';
    if (m < 36) return hs.sex === 1 ? 'chap-chung-trai' : 'chap-chung-gai';
    if (m >= 144) return hs.sex === 1 ? 'teen-trai' : 'teen-gai';   // tuổi teen: bạn teen 3D
    return hs.sex === 1 ? 'be-trai' : 'be-gai';
  }
  let y02Ve = null; // hàm vẽ lại đường kẻ (dùng khi đổi nhân vật / đổi cỡ)

  /* Nhãn ngắn dưới sticker (hàng sticker dưới chân bé) */
  const NGAN = { 'tri-nao': 'Trí não', 'tang-can': 'Ăn ngon', 'de-khang': 'Đề kháng', 'tieu-hoa': 'Tiêu hoá', canxi: 'Cao lớn' };
  function y02() {
    const box = $('#sucKhoe > .container');
    if (!box || $('.yh-body', box)) return;
    const hs = hoSo(), kid = kidCuaBe(hs), K = KID[kid];
    const el = document.createElement('div');
    el.className = 'yh-body';
    el.innerHTML = `
      <div class="section-head yh-body__head"><div>
        <h2>Bạn có biết? Mỗi ngày một điều về bé</h2>
        <p>Mỗi ngày Hương kể mẹ nghe một điều về dinh dưỡng của bé, bé trong hình sẽ "diễn" theo. Mẹ chạm vào các sticker dưới chân bé để xem thêm.</p>
      </div></div>
      <div class="yh-fact" aria-live="polite"></div>
      <div class="yh-body__main">
        <div class="yh-body__stage">
          <span class="yh-body__glow" aria-hidden="true"></span>
          <span class="yh-body__floor" aria-hidden="true"></span>
          <div class="yh-body__kid" data-kid="${kid}" style="aspect-ratio:${K.w} / ${K.h}">
            <span class="yh-body__ring" aria-hidden="true"></span>
            <img class="yh-body__img" src="img/rd/kids/${kid}.webp" alt="" width="${K.w}" height="${K.h}" loading="lazy" decoding="async">
            <span class="yh-body__prop" aria-hidden="true"></span>
            ${DIEM.map((d) => `<span class="yh-body__spot" data-k="${d.k}" style="left:${K.p[d.k][0]}%;top:${K.p[d.k][1]}%" aria-hidden="true"></span>`).join('')}
          </div>
          <!-- Sticker từng bộ phận nằm dưới chân bé (không che bé), chạm để bé diễn và xem thẻ -->
          <div class="yh-body__tray" role="group" aria-label="Chạm để xem bé cần gì">
            ${DIEM.map((d) => `<button type="button" class="yh-body__dot" data-k="${d.k}" aria-expanded="false" aria-controls="yhBodyCard" aria-label="${esc(d.bo + ': ' + d.ten)}"><span class="yh-body__dot-in">${ic(d.ic, 34)}</span><span class="yh-body__dot-lbl">${esc(NGAN[d.k] || d.ten)}</span></button>`).join('')}
          </div>
        </div>
        <div class="yh-body__card" id="yhBodyCard" aria-live="polite"></div>
        <svg class="yh-body__wire" aria-hidden="true" focusable="false"><path class="yh-body__path" d=""/><circle class="yh-body__end" r="5" cx="-20" cy="-20"/></svg>
      </div>`;
    const need = $('#hkNeed', box);
    if (need && need.nextSibling) box.insertBefore(el, need.nextSibling); else box.appendChild(el);

    const mainEl = $('.yh-body__main', el), card = $('.yh-body__card', el), path = $('.yh-body__path', el), end = $('.yh-body__end', el), svg = $('.yh-body__wire', el);
    const factEl = $('.yh-fact', el);
    let dang = 'canxi', daHien = false;

    /* Bé diễn theo chấm / điều hôm nay: cao (xương), sang (trí não), nhun (ăn ngon), khien (đề kháng), lac (tiêu hoá) */
    function dien(k, icon) {
      const kidEl = $('.yh-body__kid', el), prop = $('.yh-body__prop', el);
      if (!kidEl || !prop) return;
      const a = ACT[k] || ACT.canxi, K2 = KID[kidEl.dataset.kid] || KID['be-gai'], p = K2.p[k] || [50, 50];
      prop.innerHTML = ic(icon || a[1], 48, 'rd-sticker');
      /* Đạo cụ đứng cạnh bé, ngang tầm bộ phận đang nói tới, không đè lên người bé */
      const benTrai = p[0] < 45 && k !== 'tri-nao';
      prop.style.left = benTrai ? '-30px' : 'calc(100% + 30px)';
      prop.style.top = Math.max(6, p[1]) + '%';
      kidEl.dataset.act = a[0];
      kidEl.classList.remove('is-act'); void kidEl.offsetWidth;
      if (!giam()) kidEl.classList.add('is-act');
      else kidEl.classList.add('is-act', 'is-tinh');
    }
    /* Điều hôm nay: chọn theo ngày (cùng ngày thấy cùng điều), có nút xem điều khác */
    let F = [], iF = -1;
    function veFact(chay) {
      if (!factEl) return;
      F = dsFact();
      if (!F.length) { factEl.hidden = true; return; }
      if (iF < 0) iF = ngaySo() % F.length;
      const f = F[iF % F.length], h3 = hoSo();
      const nd = new Date(), hom = String(nd.getDate()).padStart(2, '0') + '/' + String(nd.getMonth() + 1).padStart(2, '0');
      /* Chưa lưu bé: nhân vật đổi theo chặng tuổi của điều hôm nay (em bé, bé chập chững, bé lớn, bạn teen) */
      if (!h3) doiKid(f.gd === '0-6m' || f.gd === '6-12m' ? 'em-be' : f.gd === '1-3y' ? 'chap-chung-gai' : f.gd === '12-18y' ? 'teen-gai' : 'be-gai');
      factEl.innerHTML = `
        <img class="yh-fact__doodle rd-doodle" src="img/rd/doodles/ngoi-sao-wow.svg" alt="" width="56" height="56" loading="lazy">
        <div class="yh-fact__body">
          <p class="yh-fact__chips"><span class="yh-fact__chip yh-fact__chip--day">${ic('star-glow', 18)}Hôm nay · ${esc(hom)}</span><span class="yh-fact__chip">${ic(f.ic, 18)}${esc(f.ten)}</span>${h3 && tenBe(h3) ? `<span class="yh-fact__chip yh-fact__chip--be">Cho bé ${esc(tenBe(h3))}</span>` : ''}</p>
          <p class="yh-fact__txt">${cauFact(f)}</p>
          ${f.viSao ? `<p class="yh-fact__why">${esc(f.viSao)}.</p>` : ''}
          ${f.nguon ? `<p class="yh-fact__nguon"><b>Mẹ có thể bổ sung qua:</b> ${esc(f.nguon)}.</p>` : ''}
          <div class="yh-fact__foot">
            <button type="button" class="yh-fact__next">${ic('sparkles', 20)}Điều khác</button>
            <span class="yh-fact__src">Lượng khuyến nghị mỗi ngày theo IOM (NIH), DHA theo EFSA. Chỉ để mẹ tham khảo.</span>
          </div>
        </div>`;
      if (chay) { factEl.classList.remove('is-swap'); void factEl.offsetWidth; factEl.classList.add('is-swap'); }
      chon(f.k, !!chay, f.ic);
    }

    function veThe(k) {
      const d = DIEM.find((x) => x.k === k) || DIEM[0];
      const h2 = hoSo(), gd = h2 ? giaiDoan(thangTuoi(h2.dob)) : '';
      const kq = chonSP({ needs: d.needs, tuoi: gd, n: 2 }), sp = kq.ds;
      const nhan = ((window.NEEDS || []).find((n) => n.key === d.link) || {}).label || d.ten;
      card.innerHTML = `<div class="yh-body__in">
          <div class="yh-body__top">${ic(d.ic, 52, 'rd-sticker')}<div><p class="yh-body__part">${esc(d.bo)}</p><h3>${esc(d.ten)}</h3></div></div>
          <p class="yh-body__chat">${esc(d.chat)}</p>
          <p class="yh-body__note">${esc(d.note)}</p>
          <p class="yh-body__src">Theo thông tin nhà sản xuất. Không thay thế bữa ăn đa dạng.</p>
          ${sp.length ? `<p class="yh-body__lbl">${kq.theoTuoi ? `Món hợp tuổi ${tenBe(h2) ? 'bé ' + esc(tenBe(h2)) : 'của bé'}` : 'Món shop đang có'}</p><div class="yh-body__sp">${sp.map(spHang).join('')}</div>` : ''}
          <a class="yh-body__more" href="collections.html?need=${encodeURIComponent(d.link)}">Xem món ${esc(nhan.toLowerCase())} ${muiTen()}</a>
        </div>`;
    }
    /* Đường kẻ nối sticker đang chọn (dưới chân bé) lên chấm sáng ở bộ phận đó: đi lên dọc mép ngoài người bé rồi rẽ vào */
    function veDay(chay) {
      const dot = $(`.yh-body__dot[data-k="${dang}"] .yh-body__dot-in`, el), spot = $(`.yh-body__spot[data-k="${dang}"]`, el);
      if (!dot || !spot || !daHien) return;
      const m = mainEl.getBoundingClientRect(), a = spot.getBoundingClientRect(), b = dot.getBoundingClientRect(), k = $('.yh-body__kid', el).getBoundingClientRect();
      if (!m.width || !b.width) return;
      svg.setAttribute('viewBox', `0 0 ${Math.round(m.width)} ${Math.round(m.height)}`);
      svg.setAttribute('width', Math.round(m.width)); svg.setAttribute('height', Math.round(m.height));
      const dx = a.left + a.width / 2 - m.left, dy = a.top + a.height / 2 - m.top;      // chấm trên người bé
      const bx = b.left + b.width / 2 - m.left, by = b.top - m.top - 2;                   // đỉnh sticker
      const trai = dx < (k.left + k.width / 2 - m.left);
      const sx = trai ? Math.max(10, k.left - m.left - 14) : Math.min(m.width - 10, k.right - m.left + 14);
      const r = Math.max(4, Math.min(22, Math.abs(sx - dx) / 2, (by - dy) / 3));
      const ex = dx, ey = dy;
      const d = `M${bx.toFixed(1)},${by.toFixed(1)} C${bx.toFixed(1)},${(by - 26).toFixed(1)} ${sx.toFixed(1)},${(by - 10).toFixed(1)} ${sx.toFixed(1)},${(by - 40).toFixed(1)} L${sx.toFixed(1)},${(dy + r).toFixed(1)} Q${sx.toFixed(1)},${dy.toFixed(1)} ${(sx + (trai ? r : -r)).toFixed(1)},${dy.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`;
      path.setAttribute('d', d);
      end.setAttribute('cx', ex.toFixed(1)); end.setAttribute('cy', ey.toFixed(1));
      const len = path.getTotalLength ? path.getTotalLength() : 600;
      path.style.transition = 'none'; end.style.transition = 'none';
      path.style.strokeDasharray = len + ' ' + len;
      if (chay && !giam()) {
        path.style.strokeDashoffset = String(len); end.style.opacity = '0';
        void getComputedStyle(path).strokeDashoffset; void getComputedStyle(end).opacity; // chốt trạng thái đầu rồi mới chạy (không cần rAF)
        path.style.transition = ''; end.style.transition = '';
        path.style.strokeDashoffset = '0'; end.style.opacity = '1';
      } else { path.style.strokeDashoffset = '0'; end.style.opacity = '1'; }
    }
    function chon(k, chay, icon) {
      if (k === dang && card.firstChild && !chay) return;
      dang = k;
      $$('.yh-body__dot', el).forEach((b) => { const on = b.dataset.k === k; b.classList.toggle('is-on', on); b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
      $$('.yh-body__spot', el).forEach((s) => s.classList.toggle('is-on', s.dataset.k === k));
      veThe(k);
      card.classList.remove('is-swap'); void card.offsetWidth; card.classList.add('is-swap');
      veDay(true);
      if (daHien) dien(k, icon);
    }
    el.addEventListener('click', (e) => {
      if (e.target.closest('.yh-fact__next')) { iF = (iF + 1) % (F.length || 1); veFact(true); }
      else if (e.target.closest('.yh-body__kid') && !e.target.closest('.yh-body__dot')) dien(dang);
    });
    y02Ve = () => veDay(false);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.yh-body__dot'); if (!b) return;
      const cu = dang;
      chon(b.dataset.k, b.dataset.k !== dang);
      if (b.dataset.k === cu) dien(dang);   // bấm lại sticker đang chọn: bé diễn lại
      /* Sticker nảy + tim bay ra ở đúng bộ phận trên người bé (js/rd-vui.js) */
      const v = window.RD_VUI, s = $(`.yh-body__spot[data-k="${b.dataset.k}"]`, el);
      if (v && !giam()) { const r = s && s.getBoundingClientRect(); if (r && r.width) setTimeout(() => v.tim(r.left + r.width / 2, r.top + r.height / 2, 5), 260); }
      b.classList.remove('is-bam'); void b.offsetWidth; b.classList.add('is-bam');
    });
    el.addEventListener('focusin', (e) => { const b = e.target.closest('.yh-body__dot'); if (b && b.dataset.k !== dang) chon(b.dataset.k, true); });
    let treo = 0;
    el.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse' || !chuot()) return;
      const b = e.target.closest('.yh-body__dot'); if (!b || b.dataset.k === dang) return;
      clearTimeout(treo); treo = setTimeout(() => { if (b.dataset.k !== dang) chon(b.dataset.k, true); }, 90);
    });
    el.addEventListener('pointerout', (e) => { if (e.target.closest('.yh-body__dot')) clearTimeout(treo); });
    veFact(false);
    if (!card.firstChild) chon(dang, false);
    /* Lộ ra 35% thì vẽ đường kẻ lần đầu và bé diễn theo điều hôm nay */
    const batDau = () => { if (daHien) return; daHien = true; veDay(true); const f = F[iF % (F.length || 1)]; dien(dang, f && f.k === dang ? f.ic : null); };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); batDau(); } }), { threshold: 0.35 });
      io.observe(mainEl);
    } else batDau();
    if ('ResizeObserver' in window) new ResizeObserver(() => veDay(false)).observe(mainEl);
    else addEventListener('resize', () => veDay(false));
    const img = $('.yh-body__img', el);
    if (img) img.addEventListener('load', () => veDay(false));
  }
  /* Mẹ vừa lưu / đổi bé: đổi nhân vật cho hợp tuổi, giới tính của bé */
  function y02Kid() {
    const hs = hoSo();
    if (hs) doiKid(kidCuaBe(hs));
  }
  function doiKid(kid) {
    const kidEl = $('#sucKhoe .yh-body__kid');
    if (!kidEl || !KID[kid] || kidEl.dataset.kid === kid) return;
    const K = KID[kid];
    kidEl.dataset.kid = kid;
    kidEl.style.aspectRatio = `${K.w} / ${K.h}`;
    const img = $('.yh-body__img', kidEl);
    img.setAttribute('width', K.w); img.setAttribute('height', K.h); img.src = `img/rd/kids/${kid}.webp`;
    $$('.yh-body__spot', kidEl).forEach((b) => { const p = K.p[b.dataset.k]; if (p) { b.style.left = p[0] + '%'; b.style.top = p[1] + '%'; } });
    if (y02Ve) requestAnimationFrame(y02Ve);
  }

  /* =====================================================================
     Y08 · "Bạn có biết?" theo chặng tuổi (trong khối Hành trình lớn lên)
     ===================================================================== */
  const ART_GD = {
    '0-6m': ['bottle', 'Bú mẹ là chính'], '6-12m': ['bowl', 'Bắt đầu ăn dặm'], '1-3y': ['bone', 'Xương dài ra nhanh'],
    '3-6y': ['shield', 'Đi mẫu giáo, dễ ốm vặt'], '6-12y': ['brain', 'Học nhiều, cần tập trung'], '12-18y': ['ruler', 'Dậy thì, cao vọt'],
  };
  function y08() {
    const GD = window.HK_GROWTH && window.HK_GROWTH.GIAI_DOAN;
    const sec = $('section[data-khoi="do-tuoi"] > .container');
    if (!GD || !sec || $('.yh-know', sec)) return;
    const keys = Object.keys(GD).filter((k) => GD[k] && GD[k].trongTam);
    if (!keys.length) return;
    const hs = hoSo(), cuaBe = hs ? giaiDoan(thangTuoi(hs.dob)) : '';
    let dang = keys.includes(cuaBe) ? cuaBe : keys.includes('1-3y') ? '1-3y' : keys[0];
    const AI = (MC().RD_AGE_ICON) || {};
    const el = document.createElement('div');
    el.className = 'yh-know';
    el.setAttribute('data-rd-reveal', 'up');
    el.innerHTML = `
      <div class="yh-know__head">
        <img class="rd-doodle rd-doodle--sm yh-know__doodle" src="img/rd/doodles/ngoi-sao-wow.svg" alt="" width="48" height="48" loading="lazy" aria-hidden="true">
        <div><h3 class="yh-know__title">Bạn có biết?</h3><p>Mỗi chặng tuổi, cơ thể bé cần ưu tiên những dưỡng chất khác nhau. Mẹ chọn chặng của bé nhé.</p></div>
      </div>
      <div class="yh-know__tabs" role="tablist" aria-label="Chọn chặng tuổi của bé">
        ${keys.map((k) => `<button type="button" class="yh-know__tab" role="tab" id="yhKnowTab-${k}" data-k="${k}" aria-controls="yhKnowPanel" aria-selected="false" tabindex="-1">${AI[k] ? ic(AI[k], 24) : ''}<span>${esc(nhanTuoi(k))}</span>${k === cuaBe ? '<small>bé nhà mình</small>' : ''}</button>`).join('')}
      </div>
      <div class="yh-know__panel" id="yhKnowPanel" role="tabpanel" tabindex="0"></div>`;
    const journey = $('.journey', sec);
    if (journey && journey.nextSibling) sec.insertBefore(el, journey.nextSibling); else sec.appendChild(el);
    const panel = $('.yh-know__panel', el);

    function ve(k) {
      const g = GD[k], art = ART_GD[k] || ['sparkles', ''];
      const chat = (g.chat || []).slice(0, 3).map((c) => c[0]);
      const sp = chonSP({ tuoi: k, n: 3 }).ds.filter((p) => (p.ages || []).includes(k));
      panel.setAttribute('aria-labelledby', 'yhKnowTab-' + k);
      panel.innerHTML = `
        <div class="yh-know__art" aria-hidden="true">
          <span class="yh-know__halo"></span>
          <span class="yh-know__icon">${ic(art[0], 112, 'rd-sticker rd-sticker--flat')}</span>
          <span class="yh-know__cap rd-hand">${esc(art[1])}</span>
        </div>
        <div class="yh-know__card">
          <p class="yh-know__kicker">Giai đoạn ${esc(nhanTuoi(k))}, bé…</p>
          <p class="yh-know__focus">${esc(g.trongTam)}</p>
          ${chat.length ? `<p class="yh-know__lbl">Dưỡng chất cần chú ý</p><ul class="yh-know__chat">${chat.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
          ${sp.length ? `<p class="yh-know__lbl">Hợp với giai đoạn này</p><div class="yh-know__sp">${sp.map(spHang).join('')}</div>` : ''}
          <div class="yh-know__foot">
            <a class="yh-know__more" href="collections.html?age=${encodeURIComponent(k)}">Xem món cho bé ${esc(nhanTuoi(k))} ${muiTen()}</a>
            <p class="yh-know__src">Theo phần dinh dưỡng của công cụ <a href="#do-chi-so">Đo chỉ số cho bé</a>.</p>
          </div>
        </div>`;
      panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
    }
    function chon(k, focus) {
      dang = k;
      $$('.yh-know__tab', el).forEach((t) => {
        const on = t.dataset.k === k;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on) {
          if (focus) t.focus();
          /* Giữ pill đang chọn trong khung cuộn ngang (điện thoại), không cuộn cả trang */
          const bar = t.parentNode, l = t.offsetLeft - bar.offsetLeft, r = l + t.offsetWidth;
          if (l < bar.scrollLeft || r > bar.scrollLeft + bar.clientWidth) bar.scrollTo({ left: Math.max(0, l - 16), behavior: giam() ? 'auto' : 'smooth' });
        }
      });
      ve(k);
    }
    el.addEventListener('click', (e) => { const t = e.target.closest('.yh-know__tab'); if (t && t.dataset.k !== dang) chon(t.dataset.k, false); });
    $('.yh-know__tabs', el).addEventListener('keydown', (e) => {
      const i = keys.indexOf(dang);
      const j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? keys.length - 1 : null;
      if (j === null) return;
      e.preventDefault();
      chon(keys[(j + keys.length) % keys.length], true);
    });
    chon(dang, false);
  }

  /* =====================================================================
     Y10 · Câu chuyện "Từ nhà sản xuất đến tay mẹ" theo chương (cuối khối Giới thiệu)
     Mỗi chương có một sân khấu minh hoạ riêng dựng từ icon 3D + khối CSS (y10Canh): diễn 2,5–4 giây rồi
     chuyển động nhẹ lặp lại. Sân khấu vẽ trên khung 300×240, JS co giãn cho vừa khung (--yh-k).
     Hoạt cảnh chỉ chạy ở chương đang xem (.is-play, gỡ ra gắn lại để diễn lại từ đầu); chương khác đứng yên
     ở khung hình cuối, cũng là cái mẹ thấy khi máy bật giảm chuyển động.
     Khối lộ ra thì tự kể từng chương (Y10_LUOT ms) tới chương cuối; mẹ vuốt, bấm, gõ phím hoặc bấm Tạm dừng
     thì thôi tự kể. Ra khỏi màn hình hoặc đổi tab: dừng mọi vòng lặp và hẹn giờ.
     ===================================================================== */
  const Y10_LUOT = 4500;
  /* Sân khấu từng chương (trang trí, nằm trong khối aria-hidden). Toạ độ: css/rd/y-home.css mục Y10 */
  function y10Canh(i) {
    const s = (c, x) => `<span class="${c}">${x || ''}</span>`;
    const nhan = (c, t) => `<span class="yh-sc__chip ${c}">${t}</span>`;
    const dan = 'rd-sticker rd-sticker--flat', danMong = 'rd-sticker rd-sticker--thin rd-sticker--flat';
    if (i === 0) return `
      ${s('yh-sc__blob')}${s('yh-sc__ground')}
      ${s('yh-sc1-leg yh-sc1-leg--a')}${s('yh-sc1-leg yh-sc1-leg--b')}${s('yh-sc1-belt', '<i></i>')}
      ${['a', 'b'].map((k) => s('yh-sc1-box yh-sc1-box--' + k, `<b>${ic('package', 40, danMong)}</b><em></em>`)).join('')}
      ${['a', 'b', 'c'].map((k) => s('yh-sc1-puff yh-sc1-puff--' + k, ic('cloud', 26))).join('')}
      ${s('yh-sc1-fac', ic('factory', 112, dan))}
      ${s('yh-sc__ring yh-sc1-ring')}
      ${s('yh-sc1-stamp', `<i></i><b>${ic('check', 26)}</b>`)}
      ${s('yh-sc1-tag', 'Chính hãng')}${s('yh-sc1-spark', ic('sparkles', 22))}`;
    if (i === 1) {
      const d = 'M48 98C70 6 230 6 252 98';
      return `
      ${s('yh-sc__blob')}${s('yh-sc__ground')}
      ${s('yh-sc2-globe', ic('globe-asia', 84, dan))}
      <svg class="yh-sc2-route" viewBox="0 0 300 240" width="300" height="240" focusable="false"><defs><mask id="yh-sc2-m" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="240"><path class="yh-sc2-draw" d="${d}" pathLength="1"/></mask></defs><path class="yh-sc2-dots" d="${d}" mask="url(#yh-sc2-m)"/></svg>
      ${s('yh-sc2-pin yh-sc2-pin--a', '<i></i><b>Hàn Quốc</b>')}${s('yh-sc2-pin yh-sc2-pin--b', '<i></i><b>Việt Nam</b>')}
      ${s('yh-sc2-plane', ic('airplane', 36, danMong))}
      ${s('yh-sc2-rwrap', s('yh-sc2-rcp', ic('receipt', 56, danMong)))}${s('yh-sc2-printer')}
      ${s('yh-sc2-box', ic('package', 72, dan))}
      ${s('yh-sc__ring yh-sc2-ring')}${s('yh-sc2-tag', ic('label', 40, danMong))}
      ${nhan('yh-sc2-c1', 'Tem phụ tiếng Việt')}${nhan('yh-sc2-c2', 'Hoá đơn VAT')}`;
    }
    if (i === 2) return `
      ${s('yh-sc__ground')}${s('yh-sc3-shelf yh-sc3-shelf--a')}${s('yh-sc3-shelf yh-sc3-shelf--b')}
      ${[1, 2, 3, 4, 5, 6].map((k) => s('yh-sc3-sb yh-sc3-sb--' + k, ic('package', 30))).join('')}
      ${s('yh-sc3-roll', ic('bubbles', 36, dan))}${s('yh-sc3-watch', ic('stopwatch', 34, 'rd-sticker'))}
      <span class="yh-sc3-box"><i class="yh-sc3-in"></i>${[['bubbles', 34], ['heart-pink', 26], ['bubbles', 32], ['heart-sparkle', 26]].map((x, k) => s('yh-sc3-it yh-sc3-it--' + (k + 1), ic(x[0], x[1]))).join('')}<i class="yh-sc3-front"><span class="yh-sc3-mark">${ic('heart-pink', 18)}</span></i><i class="yh-sc3-fl yh-sc3-fl--l"></i><i class="yh-sc3-fl yh-sc3-fl--r"></i><i class="yh-sc3-tape"></i><i class="yh-sc3-tape2"></i></span>
      ${s('yh-sc3-luv yh-sc3-luv--a', ic('heart-pink', 20))}${s('yh-sc3-luv yh-sc3-luv--b', ic('heart-grow', 18))}
      ${s('yh-sc__ring yh-sc3-ring')}${s('yh-sc3-ok', ic('check', 36, 'rd-sticker'))}${s('yh-sc3-spark', ic('sparkles', 22))}
      ${s('yh-sc3-note', 'Đóng gói chống sốc')}`;
    return `
      ${s('yh-sc4-sun', ic('sun', 36))}${s('yh-sc4-cl yh-sc4-cl--a', ic('cloud', 44))}${s('yh-sc4-cl yh-sc4-cl--b', ic('cloud', 36))}
      ${s('yh-sc4-grass')}
      <span class="yh-sc4-world">${s('yh-sc4-house', ic('house-garden', 98, dan))}${s('yh-sc4-fence')}${s('yh-sc4-mom', '<img src="img/rd/kids/me-be.webp" alt="" width="39" height="104" loading="lazy" decoding="async">')}</span>
      ${s('yh-sc4-road', '<i></i>')}${s('yh-sc4-speed', '<i></i><i></i><i></i>')}${s('yh-sc4-puff', ic('cloud', 22))}
      <span class="yh-sc4-truck"><i><b>${ic('truck', 86, dan)}</b></i></span>
      ${s('yh-sc4-pkg', ic('package', 32, danMong))}
      ${s('yh-sc4-luv yh-sc4-luv--a', ic('heart-pink', 20))}${s('yh-sc4-luv yh-sc4-luv--b', ic('heart-sparkle', 18))}${s('yh-sc4-luv yh-sc4-luv--c', ic('love-letter', 24))}
      <span class="yh-sc4-say">${ic('check', 18)}<b>Đã nhận hàng</b></span>
      <span class="yh-sc4-note">${ic('check', 20)}<span>Kiểm tra hàng<br>trước khi thanh toán</span></span>`;
  }
  function y10() {
    const sec = $('section[data-khoi="gioi-thieu"] > .container');
    if (!sec || $('.yh-story', sec)) return;
    const brands = (window.BRANDS || []).slice(0, 4).map((b) => b.label).filter(Boolean);
    /* Chỉ dùng điều đã ghi trên web: khối Giới thiệu, Vì sao chọn shop, Thương hiệu, chính sách giao hàng / đổi trả */
    const CH = [
      { ic: 'factory', nen: 'sky', ngan: 'Nhà sản xuất', ten: 'Nhà sản xuất chính hãng', y: [
        brands.length ? `Nhãn hàng chính hãng, chủ yếu từ Hàn Quốc: ${brands.join(', ')}…` : 'Nhãn hàng chính hãng, chủ yếu từ Hàn Quốc',
        'Mỗi món đều được tuyển chọn kỹ, nguồn gốc rõ ràng',
        'Hàng chính hãng, thông tin minh bạch'] },
      { ic: 'airplane', nen: 'butter', ngan: 'Nhập khẩu', ten: 'Nhập khẩu chính ngạch', y: [
        'Đầy đủ tem phụ tiếng Việt và số công bố',
        'Tem phụ in rõ tên nhà nhập khẩu',
        'Hoá đơn VAT theo yêu cầu'] },
      { ic: 'package', nen: 'mint', ngan: 'Kho shop', ten: 'Kho Hương Chất Kids', y: [
        'Đóng gói chống sốc, gửi đi từ Hà Nội',
        'Bọc chống sốc; thùng nước ép, hồng sâm đóng carton riêng',
        'Dán niêm phong của Hương Chất Kids'] },
      { ic: 'truck', nen: 'blush', ngan: 'Tận tay mẹ', ten: 'Giao tận tay mẹ', y: [
        'Hà Nội giao trong ngày, tỉnh khác 1–3 ngày',
        'Mẹ kiểm tra hàng trước khi thanh toán',
        'Đổi trả miễn phí 7 ngày'] },
    ];
    const n = CH.length;
    const hs = hoSo(), walker = hs && hs.sex === 1 ? 'chap-chung-trai' : 'chap-chung-gai', WK = KID[walker];
    const el = document.createElement('div');
    el.className = 'yh-story';
    el.setAttribute('data-rd-reveal', 'up');
    el.innerHTML = `
      <div class="yh-story__head">
        <div><h3>Từ nhà sản xuất đến tay mẹ</h3><p>Mỗi món mẹ nhận được đều đi qua ${n} chặng này.</p></div>
        <button type="button" class="yh-story__play" aria-pressed="false" aria-label="Tạm dừng hoạt cảnh" title="Tạm dừng / chạy tiếp hoạt cảnh"><i aria-hidden="true"></i></button>
      </div>
      <div class="yh-story__steps">
        <span class="yh-story__line" aria-hidden="true"><i class="yh-story__fill"></i></span>
        <span class="yh-story__walker" aria-hidden="true"><span class="yh-story__face"><img src="img/rd/kids/${walker}.webp" alt="" width="${WK.w}" height="${WK.h}" loading="lazy" decoding="async"></span></span>
        <ol class="yh-story__nodes">
          ${CH.map((c, i) => `<li><button type="button" class="yh-story__node" data-i="${i}" aria-label="Chương ${i + 1}: ${esc(c.ten)}"><span class="yh-story__bub">${ic(c.ic, 30)}</span><span class="yh-story__lb">${esc(c.ngan)}</span></button></li>`).join('')}
        </ol>
      </div>
      <div class="yh-story__vp" tabindex="0" aria-label="Các chương, vuốt ngang để xem">
        ${CH.map((c, i) => `<article class="yh-story__ch yh-story__ch--${c.nen}" role="group" aria-roledescription="chương" aria-label="Chương ${i + 1} trên ${n}: ${esc(c.ten)}">
          <div class="yh-story__art${ANH_CHUONG[i] ? ' yh-story__art--anh' : ''}" aria-hidden="true">
            ${ANH_CHUONG[i] ? `<img class="yh-story__anh" src="${esc(ANH_CHUONG[i])}" alt="" loading="lazy" decoding="async"><span class="yh-story__num">${i + 1}</span>` : `<div class="yh-sc yh-sc--${i + 1}">${y10Canh(i)}</div>`}
          </div>
          <div class="yh-story__txt">
            <p class="yh-story__kicker">Chương ${i + 1}/${n}</p>
            <h4>${esc(c.ten)}</h4>
            <ul>${c.y.map((t) => `<li>${ic('check', 22)}<span>${esc(t)}</span></li>`).join('')}</ul>
          </div>
        </article>`).join('')}
      </div>
      <div class="yh-story__nav">
        <button type="button" class="yh-story__arrow" data-go="-1" aria-label="Chương trước">${(MC().I && MC().I.chevronL) || '‹'}</button>
        <div class="yh-story__dots">${CH.map((c, i) => `<button type="button" class="yh-story__dot" data-i="${i}" aria-label="Xem chương ${i + 1}"></button>`).join('')}</div>
        <button type="button" class="yh-story__arrow" data-go="1" aria-label="Chương sau">${(MC().I && MC().I.chevronR) || '›'}</button>
      </div>`;
    sec.appendChild(el);

    const vp = $('.yh-story__vp', el), chs = $$('.yh-story__ch', el), nodes = $$('.yh-story__node', el), dots = $$('.yh-story__dot', el);
    const wk = $('.yh-story__walker', el), face = $('.yh-story__face', el), fill = $('.yh-story__fill', el), bar = $('.yh-story__steps', el);
    const art0 = $('.yh-story__art', el), nutDung = $('.yh-story__play', el);
    let dang = -1, hen = 0;
    /* hien: khối đang trong màn hình · dungTay: mẹ bấm Tạm dừng · keXong: thôi tự kể
       khoa: đang cuộn do bấm / tự kể, tới muc (scrollLeft đích) thì mở */
    let hien = false, dungTay = false, keXong = giam(), tuKe = 0, khoa = 0, khoaHen = 0, muc = 0;
    /* Diễn (lại) hoạt cảnh chương i. Chỉ một chương chạy, khi khối đang trong màn hình và chưa tạm dừng */
    function choi(i) {
      chs.forEach((c, k) => { if (k !== i) c.classList.remove('is-play'); });
      const c = chs[i];
      if (!c) return;
      c.classList.remove('is-play');
      if (giam() || dungTay || !hien) return;
      void c.offsetWidth;
      c.classList.add('is-play');
    }
    function datBuoc(i, chay) {
      if (i === dang && !chay) return;
      const cu = dang; dang = i;
      nodes.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.classList.toggle('is-qua', k < i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      dots.forEach((b, k) => { b.classList.toggle('is-on', k === i); if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      $$('.yh-story__arrow', el).forEach((b) => { b.disabled = (b.dataset.go === '-1' && i === 0) || (b.dataset.go === '1' && i === n - 1); });
      chs.forEach((c, k) => c.classList.toggle('is-on', k === i));
      viTri(cu >= 0 && cu !== i && !giam(), cu > i);
      choi(i);
    }
    /* Tự kể: mỗi chương Y10_LUOT ms, dừng ở chương cuối hoặc khi mẹ tương tác */
    function thoiKe() { keXong = true; clearTimeout(tuKe); }
    function henKe() {
      clearTimeout(tuKe);
      if (keXong || dungTay || !hien || document.hidden || dang >= n - 1) return;
      tuKe = setTimeout(() => { toi(dang + 1); henKe(); }, Y10_LUOT);
    }
    /* Bé đi dọc thanh bước tới chương đang xem (chỉ dùng transform) */
    function viTri(di, lui) {
      const b = nodes[dang];
      if (!b) return;
      const br = bar.getBoundingClientRect(), r = $('.yh-story__bub', b).getBoundingClientRect();
      const x = r.left + r.width / 2 - br.left;
      const first = $('.yh-story__bub', nodes[0]).getBoundingClientRect(), last = $('.yh-story__bub', nodes[n - 1]).getBoundingClientRect();
      const tong = (last.left - first.left) || 1;
      fill.style.transform = `scaleX(${Math.max(0, Math.min(1, (r.left - first.left) / tong)).toFixed(3)})`;
      wk.style.transform = `translateX(${x.toFixed(1)}px)`;
      face.classList.toggle('is-lui', !!lui);
      if (di) { wk.classList.add('is-walk'); clearTimeout(hen); hen = setTimeout(() => { wk.classList.remove('is-walk'); face.classList.remove('is-lui'); }, 950); }
    }
    /* Cuộn tới chương i (lai: bấm lại chương đang xem thì diễn lại) */
    function toi(i, lai) {
      i = Math.max(0, Math.min(n - 1, i));
      const c = chs[i], pad = parseFloat(getComputedStyle(vp).scrollPaddingLeft) || 0;
      const left = vp.scrollLeft + c.getBoundingClientRect().left - vp.getBoundingClientRect().left - pad;
      /* Trong lúc cuộn mượt, bỏ qua sự kiện cuộn (thanh bước không nhảy qua lại, không tính là mẹ vuốt)
         cho tới khi: tới đích, scrollend, hoặc mẹ chạm / lăn chuột vào khung. Không có scrollend thì mở sau 3 s */
      muc = Math.max(0, Math.min(vp.scrollWidth - vp.clientWidth, left));
      if (Math.abs(muc - vp.scrollLeft) > 2) { khoa = 1; clearTimeout(khoaHen); if (!('onscrollend' in window)) khoaHen = setTimeout(moKhoa, 3000); }
      vp.scrollTo({ left, behavior: giam() ? 'auto' : 'smooth' });
      datBuoc(i, !!lai && i === dang);
    }
    let raf = 0;
    function capNhat() {
      const vr = vp.getBoundingClientRect();
      let best = 0, kc = Infinity;
      if (vp.scrollLeft >= vp.scrollWidth - vp.clientWidth - 2) best = n - 1;
      else chs.forEach((c, k) => { const d = Math.abs(c.getBoundingClientRect().left - vr.left); if (d < kc) { kc = d; best = k; } });
      datBuoc(best);
    }
    function moKhoa() { khoa = 0; clearTimeout(khoaHen); }
    vp.addEventListener('scroll', () => {
      if (khoa) { if (Math.abs(vp.scrollLeft - muc) <= 2) moKhoa(); return; }
      thoiKe();
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; capNhat(); });
    }, { passive: true });
    if ('onscrollend' in window) vp.addEventListener('scrollend', () => { if (khoa) moKhoa(); });
    ['touchstart', 'wheel', 'pointerdown'].forEach((ev) => vp.addEventListener(ev, () => { if (khoa) moKhoa(); }, { passive: true }));
    el.addEventListener('click', (e) => {
      const nd = e.target.closest('.yh-story__node, .yh-story__dot'); if (nd) { thoiKe(); toi(Number(nd.dataset.i), true); return; }
      const ar = e.target.closest('.yh-story__arrow'); if (ar) { thoiKe(); toi(dang + Number(ar.dataset.go)); }
    });
    vp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' && dang < n - 1) { e.preventDefault(); thoiKe(); toi(dang + 1); }
      else if (e.key === 'ArrowLeft' && dang > 0) { e.preventDefault(); thoiKe(); toi(dang - 1); }
    });
    nutDung.addEventListener('click', () => {
      dungTay = !dungTay;
      nutDung.setAttribute('aria-pressed', String(dungTay));
      thoiKe();
      choi(dang);
    });
    /* Co giãn sân khấu 300×240 cho vừa khung minh hoạ */
    function coGian() {
      const w = art0.clientWidth, h = art0.clientHeight;
      if (w && h) el.style.setProperty('--yh-k', Math.min(w / 300, h / 240).toFixed(4));
    }
    datBuoc(0, true);
    coGian();
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(() => { viTri(false); coGian(); }); ro.observe(bar); ro.observe(art0); }
    else addEventListener('resize', () => { viTri(false); coGian(); });
    /* Lộ ≥35%: diễn chương đang xem + tự kể; còn <20%: dừng vòng lặp (.is-off) và hẹn giờ */
    function thay(r) {
      if (r >= 0.35 && !hien) { hien = true; el.classList.remove('is-off'); choi(dang); henKe(); }
      else if (r < 0.2 && hien) { hien = false; el.classList.add('is-off'); clearTimeout(tuKe); }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => es.forEach((en) => thay(en.isIntersecting ? en.intersectionRatio : 0)), { threshold: [0, 0.2, 0.35, 0.6] }).observe(el);
      /* Ảnh sân khấu để lazy; khối sắp tới thì tải hết (chương nằm ngoài khung vuốt ngang không tự tải kịp) */
      const nap = new IntersectionObserver((es) => {
        if (!es.some((en) => en.isIntersecting)) return;
        $$('.yh-sc img[loading="lazy"]', el).forEach((im) => { im.loading = 'eager'; });
        nap.disconnect();
      }, { rootMargin: '600px 0px' });
      nap.observe(el);
    } else thay(1);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(tuKe); else henKe(); });
  }

  /* =====================================================================
     Khởi động
     ===================================================================== */
  function batDauHero() {
    if (BAT.Y06) thu('Y06', y06);
    if (BAT.Y02) thu('Y02', y02);
    thu('hero', apHero);
    if (BAT.Y15) thu('Y15 xoay', xoayCum);
    const card = document.getElementById('hkCard');
    if (card && 'MutationObserver' in window) {
      let cho = 0;
      new MutationObserver(() => {
        if (cho) return;
        cho = requestAnimationFrame(() => { cho = 0; thu('hero', apHero); });
      }).observe(card, { childList: true, subtree: true });
    }
    /* Đổi khung giờ (vd 9:59 → 10:00) thì đổi lời chào */
    if (BAT.Y16) setInterval(() => { if (!document.hidden) thu('Y16', apHero); }, 60000);
  }
  function batDauKhac() {
    if (BAT.Y08) thu('Y08', y08);
    if (BAT.Y10) thu('Y10', y10);
  }
  function chay() { batDauHero(); batDauKhac(); }
  /* Chờ DOMContentLoaded: đoạn script cuối index.html (đăng ký trước) vẽ xong các khối rồi mới tới đây */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay, { once: true });
  else chay();
})();
