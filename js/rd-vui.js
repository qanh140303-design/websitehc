/* =====================================================================
   "Chạm là vui" – lớp tương tác chạm cho sticker và nhân vật bé (rd-vui.js + css/rd/vui.css).

   Chỉ THÊM phần nhìn, không đổi giỏ, link, bộ lọc hay sự kiện có sẵn (không preventDefault, không chặn cuộn):
   1. Chạm sticker (icon 3D, sticker danh mục, doodle, bong bóng danh mục, mốc Hành trình…) → nhún – vươn – đứng lại
      + vài tim / sao / chấm nhỏ bay ra.
   2. Chạm nhân vật bé / mẹ cả người (img/rd/kids/) → bé nhảy lên (neo ở chân), tim bay, bong bóng nói 1,8s.
      Chạm mặt bé tròn (.rdbe-ava) → lắc đầu + 3 tim.
   3. Bấm "Thêm vào giỏ" / "Mua ngay" → mặt bé trên header hoặc thanh dưới nhảy lên, nói "Bé thích lắm!"
      (máy tính mở ngăn giỏ che header → bé trên thanh freeship trong ngăn giỏ; chưa có mặt bé → tim bay từ nút giỏ).
   Bỏ qua phần so sánh WHO (.rd-ss), danh sách mục kết quả (.rd-acc) và bản đồ cơ thể (.yh-body) vì đã có phản ứng riêng.
   Mẹ bật "giảm chuyển động" → chỉ nháy mờ rất nhanh, không tim, không bong bóng.
   Hạt / bong bóng: aria-hidden, pointer-events: none, chỉ transform + opacity, tối đa 7 hạt mỗi lần và 30 cùng lúc.
   API: window.RD_VUI = { nay(el), noi(el, chu[, {ben:true}]), tim(x, y[, n]), bam(el) }
   ===================================================================== */
(function () {
  'use strict';
  if (window.RD_VUI) return;

  const d = document, w = window;
  const RMQ = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const giam = () => !!RMQ.matches;
  const coAnim = !!(d.documentElement && d.documentElement.animate);
  /* composite 'add': chuyển động cộng thêm lên transform / animation CSS sẵn có (sticker nghiêng, mẹ đung đưa…) */
  const CONG = (() => { try { return 'composite' in new KeyframeEffect(null, [], {}); } catch (e) { return false; } })();
  const thu = (ten, fn) => { try { return fn(); } catch (err) { if (w.console) console.warn('[rd-vui] ' + ten, err); return null; } };
  const ngauNhien = (a, b) => a + Math.random() * (b - a);
  const kep = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Mục tiêu ---------- */
  const BO_QUA = '.rd-ss, .rd-acc, .yh-body';                                   // đã có phản ứng riêng
  const KHUNG = '.cat-bubble__disc, .rd-mile, .why__item .icon';        // cả vòng tròn nhún (thắng ảnh bên trong)
  const STICKER = 'img.rd-sticker, .rd-sticker img, img.rd-emo, img.rd-doodle, img.rd-stk, img[src*="img/rd/stickers/"], .mom__art img';
  const MAT = 'img.rdbe-ava';
  const KID_RE = /img\/rd\/kids\/(em-be|chap-chung-gai|chap-chung-trai|be-gai|be-trai|teen-gai|teen-trai|me-bau|me-be)\.webp/;
  const ME_RE = /img\/rd\/kids\/me-(bau|be)\.webp/;
  const laKid = (el) => el && el.tagName === 'IMG' && KID_RE.test(el.getAttribute('src') || '');

  const CAU_BE = ['Mẹ ơi, con đây!', 'Con lớn thêm rồi nè!', 'Ôm con một cái nha!', 'Hôm nay con ăn ngoan lắm!', 'Con thích món này!'];
  const CAU_ME = ['Mẹ khỏe, bé khỏe!', 'Chăm mẹ cũng là chăm bé!'];
  let cauCu = '';
  const chonCau = (ds) => { let c = ds[Math.floor(Math.random() * ds.length)]; if (c === cauCu && ds.length > 1) c = ds[(ds.indexOf(c) + 1) % ds.length]; cauCu = c; return c; };

  /* Tìm thứ được chạm: { loai: 'sticker' | 'kid' | 'mat', el, me } */
  function timMuc(t) {
    if (!t || t.nodeType !== 1 || !t.closest || t.closest(BO_QUA)) return null;
    const khung = t.closest(KHUNG);
    if (khung) return { loai: 'sticker', el: khung };
    const img = t.closest('img');
    if (laKid(img)) {
      /* Sân khấu "Bé lớn lên" (rd-motion): 3 ảnh chồng nhau, nhảy cả cụm để thấy đúng bé đang hiện */
      const cum = img.closest('.rd-grow__kid');
      return { loai: 'kid', el: cum || img, me: ME_RE.test(img.getAttribute('src') || '') };
    }
    const mat = t.closest(MAT);
    if (mat) return { loai: 'mat', el: mat };
    const st = t.closest(STICKER);
    if (st) return { loai: 'sticker', el: st };
    return null;
  }
  /* Bàn phím: phần tử đang focus chứa sticker / bé */
  function timTrong(el) {
    if (!el || el.closest(BO_QUA)) return null;
    const m = timMuc(el);
    if (m) return m;
    const ung = [KHUNG, 'img[src*="img/rd/kids/"]', MAT, STICKER];
    for (const s of ung) {
      for (const x of el.querySelectorAll(s)) {
        if (x.closest(BO_QUA) || !hien(x)) continue;
        const k = timMuc(x);
        if (k) return k;
      }
    }
    return null;
  }

  const hien = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const tam = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };

  /* ---------- Chạy transform bằng Web Animations (chặn chạm lặp khi đang chạy) ---------- */
  const dangChay = new WeakSet();
  function chay(el, khung, ms, ease) {
    if (!coAnim || !el || dangChay.has(el)) return null;
    let goc = '';
    if (!CONG) { const tr = getComputedStyle(el).transform; if (tr && tr !== 'none') goc = tr + ' '; }
    const kf = khung.map((k) => ({ offset: k[0], transform: goc + k[1], easing: ease || 'cubic-bezier(.33,.9,.45,1)' }));
    const a = thu('animate', () => el.animate(kf, CONG ? { duration: ms, composite: 'add' } : { duration: ms }));
    if (!a) return null;
    dangChay.add(el);
    const xong = () => dangChay.delete(el);
    a.onfinish = xong; a.oncancel = xong;
    setTimeout(xong, ms + 80);
    return a;
  }
  const tf = (x, y, sx, sy, r) => `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${sx}, ${sy}) rotate(${r.toFixed(2)}deg)`;

  /* 1. Sticker: nhún → vươn → đứng lại, nghiêng ngẫu nhiên ±8° */
  function nhun(el) {
    const n = Math.random() < 0.5 ? -1 : 1, g = ngauNhien(4, 8) * n;
    const h = el.offsetHeight || 40, len = -Math.min(10, h * 0.12);
    return chay(el, [
      [0, tf(0, 0, 1, 1, 0)],
      [0.18, tf(0, h * 0.04, 1.16, 0.82, g * 0.3)],
      [0.42, tf(0, len, 0.9, 1.12, g)],
      [0.62, tf(0, 0, 1.06, 0.95, -g * 0.45)],
      [0.8, tf(0, len * 0.15, 0.98, 1.03, g * 0.15)],
      [1, tf(0, 0, 1, 1, 0)]
    ], 550);
  }

  /* 2. Bé nhảy: co – bật lên – chạm đất – nảy nhẹ, neo ở chân (giữ đáy ảnh đứng yên dù transform-origin là gì) */
  function nay(el, opt) {
    if (!el || giam()) return null;
    opt = opt || {};
    const h = el.offsetHeight || 0, wd = el.offsetWidth || 0;
    if (!h) return null;
    const o = (getComputedStyle(el).transformOrigin || '').split(' ').map(parseFloat);
    const ox = isFinite(o[0]) ? o[0] : wd / 2, oy = isFinite(o[1]) ? o[1] : h / 2;
    const bx = wd / 2 - ox, by = h - oy;   // chân (giữa đáy) so với tâm biến hình
    const cao = opt.cao != null ? opt.cao : Math.min(26, Math.max(8, h * 0.1));
    const n = Math.random() < 0.5 ? -1 : 1, g = ngauNhien(2, 4) * n;
    const buoc = (sx, sy, len, r) => {
      const a = r * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const tx = bx - sx * (bx * c - by * s), ty = by - len - sy * (bx * s + by * c);
      return tf(tx, ty, sx, sy, r);
    };
    return chay(el, [
      [0, buoc(1, 1, 0, 0)],
      [0.14, buoc(1.08, 0.9, 0, 0)],
      [0.38, buoc(0.94, 1.08, cao, g)],
      [0.6, buoc(1.1, 0.88, 0, -g * 0.3)],
      [0.78, buoc(0.97, 1.04, cao * 0.15, g * 0.15)],
      [1, buoc(1, 1, 0, 0)]
    ], opt.ms || 700);
  }

  /* Mặt bé tròn: lắc đầu */
  function lac(el) {
    return chay(el, [
      [0, tf(0, 0, 1, 1, 0)],
      [0.15, tf(0, -2, 1.1, 1.1, -14)],
      [0.35, tf(0, 0, 1.08, 1.08, 11)],
      [0.55, tf(0, 0, 1.04, 1.04, -7)],
      [0.75, tf(0, 0, 1.02, 1.02, 4)],
      [1, tf(0, 0, 1, 1, 0)]
    ], 600, 'ease-in-out');
  }

  /* Mặt bé nhảy cẫng khi thêm giỏ (lò xo) */
  function nhayCang(el) {
    return chay(el, [
      [0, tf(0, 0, 1, 1, 0)],
      [0.12, tf(0, 2, 1.12, 0.86, 0)],
      [0.36, tf(0, -14, 0.92, 1.1, -6)],
      [0.58, tf(0, 0, 1.1, 0.9, 4)],
      [0.74, tf(0, -4, 0.97, 1.03, -2)],
      [0.88, tf(0, 0, 1.02, 0.98, 0)],
      [1, tf(0, 0, 1, 1, 0)]
    ], 760);
  }

  /* Giảm chuyển động: nháy mờ tức thì, không di chuyển */
  function nhay(el) {
    if (!coAnim || !el || dangChay.has(el)) return;
    dangChay.add(el);
    thu('nhay', () => el.animate([{ opacity: 0.6 }, { opacity: 0.6 }], { duration: 120 }));
    setTimeout(() => dangChay.delete(el), 160);
  }

  /* ---------- Hạt: tim, sao, chấm (tối đa 7 mỗi lần, 30 cùng lúc) ---------- */
  const MAU = ['#F0537A', '#17A398', '#FFC94D', '#7FB5F0', '#B79CF2'];
  const SVG_TIM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.6s-7.4-4.5-9.3-9.1C1.3 8.1 3.3 4.4 6.9 4.4c2 0 3.5 1.1 4.3 2.5.8-1.4 2.3-2.5 4.3-2.5 3.6 0 5.6 3.7 4.2 7.1-1.9 4.6-7.7 9.1-7.7 9.1z"/></svg>';
  const SVG_SAO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/></svg>';
  const TOI_DA = 30;
  let song = 0;

  function lop() {
    const L = d.createElement('div');
    L.className = 'rd-fx-layer rdv-lop';   // rd-fx-layer: rd-motion bỏ qua khi quét DOM
    L.setAttribute('aria-hidden', 'true');
    d.body.appendChild(L);
    return L;
  }
  function hat(loai, mau, co) {
    const s = d.createElement('span');
    s.className = 'rdv-p rdv-p--' + loai;
    s.style.color = mau;
    s.style.width = s.style.height = co + 'px';
    if (loai === 'tim') s.innerHTML = SVG_TIM;
    else if (loai === 'sao') s.innerHTML = SVG_SAO;
    return s;
  }
  /* Nổ hạt quanh điểm chạm (sticker); `to` = cỡ sticker để hạt bay ra ngoài mép */
  function no(x, y, n, to) {
    if (giam() || !coAnim || !d.body) return;
    n = Math.min(n || 5, 7, TOI_DA - song);
    if (n <= 0) return;
    const L = lop(), loai = ['tim', 'sao', 'cham'], gan = kep((to || 40) * 0.4, 26, 50), xa0 = kep((to || 40) * 0.7, 46, 84);
    const lech = Math.floor(Math.random() * MAU.length);
    for (let i = 0; i < n; i++) {
      const k = loai[i % 3], co = k === 'cham' ? ngauNhien(7, 10) : ngauNhien(14, 20);
      const s = hat(k, MAU[(i + lech) % MAU.length], co);
      L.appendChild(s);
      const a = (i / n) * Math.PI * 2 + ngauNhien(-0.4, 0.4) - Math.PI / 2, xa = ngauNhien(gan, xa0);
      const x0 = x - co / 2, y0 = y - co / 2, dx = Math.cos(a) * xa, dy = Math.sin(a) * xa - 10, r = ngauNhien(-60, 60);
      s.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(.3) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${x0 + dx * 0.6}px, ${y0 + dy * 0.6}px) scale(1.1) rotate(${r / 2}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${x0 + dx}px, ${y0 + dy + 8}px) scale(.6) rotate(${r}deg)`, opacity: 0 }
      ], { duration: ngauNhien(520, 660), easing: 'cubic-bezier(.2,.7,.35,1)', fill: 'forwards' });
    }
    xoaSau(L, n, 700);
  }
  /* Tim bay lên từ một điểm, toả sang hai bên. ngang: bay ngang nhiều hơn (quanh đầu bé, chừa chỗ cho bong bóng) */
  function tim(x, y, n, ngang) {
    if (giam() || !coAnim || !d.body) return;
    n = Math.min(n || 5, 7, TOI_DA - song);
    if (n <= 0) return;
    const L = lop(), xuong = y < 100;   // sát mép trên (nút giỏ trên header) → tim rơi xuống cho khỏi khuất
    for (let i = 0; i < n; i++) {
      const co = ngauNhien(14, 20), s = hat('tim', MAU[i % 2 ? 0 : (i / 2 + 1) % MAU.length], co), ben = i % 2 ? 1 : -1;
      L.appendChild(s);
      const x0 = x - co / 2 + ngauNhien(-8, 8), y0 = y - co / 2, r = ben * ngauNhien(6, 22);
      const dx = ben * (ngang ? ngauNhien(30, 66) : ngauNhien(14, 46));
      const dy = xuong ? ngauNhien(34, 64) : ngang ? -ngauNhien(6, 36) : -ngauNhien(40, 78);
      s.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(.3) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${x0 + dx * 0.3}px, ${y0 + dy * 0.35}px) scale(1.1) rotate(${-r / 2}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${x0 + dx * 0.7}px, ${y0 + dy * 0.75}px) scale(1) rotate(${r / 2}deg)`, opacity: 0.9, offset: 0.7 },
        { transform: `translate(${x0 + dx}px, ${y0 + dy}px) scale(.7) rotate(${r}deg)`, opacity: 0 }
      ], { duration: ngauNhien(560, 680), delay: i * 30, easing: 'cubic-bezier(.25,.6,.4,1)', fill: 'both' });
    }
    xoaSau(L, n, 720 + n * 30);
  }
  function xoaSau(L, n, ms) {
    song += n;
    setTimeout(() => { L.remove(); song = Math.max(0, song - n); }, ms);
  }

  /* ---------- Bong bóng nói (chỉ 1 cái, 1,8s, không nhận chạm) ---------- */
  const NOI_MS = 1800;
  let bong = null, bongT = 0, bongY = 0;
  function xoaBong() {
    clearTimeout(bongT);
    if (bong) { bong.remove(); bong = null; }
    w.removeEventListener('scroll', khiCuon);
  }
  function khiCuon() { if (Math.abs(w.scrollY - bongY) > 24) xoaBong(); }   // trang cuộn đi → bong bóng không lơ lửng sai chỗ
  /* o.ben: đặt cạnh bên (mặt bé ở thanh dưới: phía trên là chỗ thông báo "Đã thêm vào giỏ") */
  function noi(el, chu, o) {
    if (giam() || !el || !d.body || !chu) return null;
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return null;
    xoaBong();
    const L = lop();
    L.classList.add('rdv-lop--noi');
    const b = d.createElement('div');
    b.className = 'rdv-noi';
    b.textContent = chu;
    L.appendChild(b);
    const vw = d.documentElement.clientWidth || w.innerWidth, vh = w.innerHeight;
    const bw = b.offsetWidth, bh = b.offsetHeight, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let left = kep(cx - bw / 2, 8, Math.max(8, vw - bw - 8));
    let top = r.top - bh - 12, duoi = 'duoi';                  // đuôi ở dưới, bong bóng phía trên
    if (o && o.ben) {
      const phai = r.right + 12 + bw <= vw - 8;
      left = kep(phai ? r.right + 12 : r.left - 12 - bw, 8, Math.max(8, vw - bw - 8));
      top = cy - bh / 2;
      duoi = phai ? 'trai' : 'phai';                           // đuôi chỉ sang mặt bé
    } else if (top < 8) {
      if (r.bottom + 12 + bh <= vh - 8) { top = r.bottom + 12; duoi = 'tren'; }   // sát mép trên (header) → đặt bên dưới
      else { top = 8; duoi = ''; }
    }
    top = kep(top, 8, Math.max(8, vh - bh - 8));
    b.style.left = left + 'px';
    b.style.top = top + 'px';
    b.style.setProperty('--rdv-duoi', kep(cx - left, 16, bw - 16) + 'px');
    b.style.setProperty('--rdv-duoi-y', kep(cy - top, 12, bh - 12) + 'px');
    if (duoi) b.classList.add('rdv-noi--' + duoi);
    const lech = duoi === 'tren' ? 'translateY(-6px)' : duoi === 'trai' ? 'translateX(-8px)' : duoi === 'phai' ? 'translateX(8px)' : 'translateY(6px)';
    const nguoc = lech.replace(/\((-?)/, (m, am) => '(' + (am ? '' : '-'));
    if (coAnim) b.animate([
      { transform: `${lech} scale(.5)`, opacity: 0 },
      { transform: 'translate(0, 0) scale(1.06)', opacity: 1, offset: 0.1 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.16 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0.88 },
      { transform: `${nguoc} scale(.92)`, opacity: 0 }
    ], { duration: NOI_MS, easing: 'cubic-bezier(.3,.8,.4,1)', fill: 'forwards' });
    else b.style.opacity = '1';
    bong = L;
    bongY = w.scrollY;
    bongT = setTimeout(xoaBong, NOI_MS);
    w.addEventListener('scroll', khiCuon, { passive: true });
    return b;
  }

  /* ---------- Phản ứng khi chạm ---------- */
  function phanUng(m, o) {
    o = o || {};
    if (giam()) { nhay(m.el); return; }
    if (dangChay.has(m.el)) return;
    const c = tam(m.el), x = o.x != null ? o.x : c.x, y = o.y != null ? o.y : c.y;
    if (m.loai === 'kid') {
      /* Bé: nhảy + tim + bong bóng (trên cảm ứng đợi chắc là chạm chứ không phải cuộn) */
      hen(o, () => {
        if (!m.el.isConnected || !nay(m.el)) return;
        const r = m.el.getBoundingClientRect();
        tim(r.left + r.width / 2, Math.max(16, r.top + Math.min(r.height * (r.height < 80 ? 0.5 : 0.22), 48)), 5, true);
        noi(m.el, chonCau(m.me ? CAU_ME : CAU_BE));   // bong bóng sau cùng để nằm trên tim, chữ luôn đọc được
      });
      return;
    }
    if (m.loai === 'mat') {
      if (!lac(m.el)) return;
      hen(o, () => { const r = m.el.getBoundingClientRect(); tim(r.left + r.width / 2, r.top + 4, 3); });
      return;
    }
    if (!nhun(m.el)) return;
    hen(o, () => no(x, y, 4 + Math.floor(Math.random() * 4), Math.max(c.r.width, c.r.height)));
  }
  /* Cảm ứng: hạt / bong bóng chờ ~110ms, nếu ngón tay chuyển sang cuộn (pointercancel) thì thôi */
  let cho = null;
  function hen(o, fn) {
    if (!o.tre) { thu('hieu-ung', fn); return; }
    if (cho) clearTimeout(cho.t);
    const c = { id: o.id, t: 0 };
    c.t = setTimeout(() => { if (cho === c) cho = null; thu('hieu-ung', fn); }, o.tre);
    cho = c;
  }

  d.addEventListener('pointerdown', (e) => {
    if (e.isPrimary === false || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const m = timMuc(e.target);
    if (!m) return;
    thu('cham', () => phanUng(m, { x: e.clientX, y: e.clientY, tre: e.pointerType === 'touch' ? 110 : 0, id: e.pointerId }));
  }, { capture: true, passive: true });
  d.addEventListener('pointercancel', (e) => {
    if (cho && cho.id === e.pointerId) { clearTimeout(cho.t); cho = null; }
  }, { capture: true, passive: true });

  /* Bàn phím: Enter / Space trên link / nút đang chứa sticker hoặc bé */
  d.addEventListener('keydown', (e) => {
    if ((e.key !== 'Enter' && e.key !== ' ') || e.repeat) return;
    const t = e.target;
    if (!t || !t.matches || !t.matches('a[href], button, summary, [role="button"], [tabindex]:not([tabindex="-1"])')) return;
    const m = thu('timTrong', () => timTrong(t));
    if (m) thu('phim', () => phanUng(m, {}));
  }, { capture: true, passive: true });

  /* ---------- 3. Thêm vào giỏ → bé vui ---------- */
  let gioT = 0;
  /* Thấy được thật: có kích thước, trong màn hình, không nằm dưới khung Mua nhanh / ngăn giỏ (nền mờ thì vẫn tính là thấy) */
  function loRa(el) {
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0) || r.bottom <= 0 || r.top >= w.innerHeight) return false;
    const h = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const vo = el.closest('a, button') || el;
    return !!h && (vo === h || vo.contains(h) || !!(h.matches && h.matches('.drawer__backdrop, .modal__backdrop, .mmenu__backdrop')));
  }
  function beVui(lan) {
    if (giam()) return;
    const mat = Array.from(d.querySelectorAll('.hact--suckhoe .rdbe-ava, .bn-do .rdbe-ava')).find((el) => !el.closest(BO_QUA) && loRa(el));
    if (mat) {
      nhayCang(mat);   // đang lắc dở thì thôi nhảy, vẫn có tim + bong bóng
      const r = mat.getBoundingClientRect();
      tim(r.left + r.width / 2, r.top + r.height / 3, 4, true);
      noi(mat, 'Bé thích lắm!', { ben: !!mat.closest('.bn-do') });
      return;
    }
    /* Máy tính: ngăn giỏ mở ra che header → bé ngồi xe trên thanh freeship trong ngăn giỏ nhảy lên */
    const ngan = d.querySelector('.drawer.is-open .drawer__panel');
    if (ngan) {
      if (!lan) { setTimeout(() => thu('beVui', () => beVui(1)), 150); return; }   // chờ ngăn trượt vào xong
      const be = Array.from(ngan.querySelectorAll('.ys-fs__kid, img[src*="img/rd/kids/"]')).find((el) => {   // ảnh trang trí (pointer-events: none) → xét theo khung
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < w.innerHeight;
      });
      if (be) {
        nay(be);
        const r = be.getBoundingClientRect();
        tim(r.left + r.width / 2, r.top + r.height / 4, 4, true);
        noi(be, 'Bé thích lắm!', { ben: true });
        return;
      }
      const icon = ngan.querySelector('.drawer__head img, .drawer__head svg');
      if (icon && loRa(icon)) { const c = tam(icon); tim(c.x, c.y, 5); }
      return;
    }
    const gio = Array.from(d.querySelectorAll('#header [data-open-cart], header [data-open-cart], [data-open-cart]')).find(loRa);
    if (gio) { const c = tam(gio); tim(c.x, c.y, 5); }
  }
  d.addEventListener('click', (e) => {
    const b = e.target && e.target.closest && e.target.closest('[data-add], [data-buy]');
    if (!b || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
    clearTimeout(gioT);
    gioT = setTimeout(() => thu('beVui', () => beVui(0)), 250);
  }, { capture: true, passive: true });

  /* ---------- API cho module khác ---------- */
  w.RD_VUI = {
    nay: (el) => thu('nay', () => nay(el)),
    noi: (el, chu, o) => thu('noi', () => noi(el, chu, o)),
    tim: (x, y, n) => thu('tim', () => tim(+x || 0, +y || 0, n)),
    bam: (el) => { const m = el && thu('timMuc', () => timMuc(el)); if (m) thu('bam', () => phanUng(m, {})); }
  };
})();
