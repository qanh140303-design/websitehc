/* =====================================================================
   "Theo bé" – cá nhân hoá phần nhìn theo bé mẹ đã lưu ở công cụ Đo chỉ số
   (localStorage 'hck_suckhoe' = { name, sex 1 trai / 2 gái, dob, log }, chỉ trên máy mẹ).

   Chỉ ĐỌC hồ sơ và chỉ THÊM phần nhìn: nhân vật 3D đúng giới tính & chặng tuổi,
   chip bé trên header, nhãn "Hợp tuổi bé" trên thẻ / giỏ, ghim "Bé ở đây" trên Hành trình lớn lên,
   hàng "Dành riêng cho bé" ở trang chủ, gợi ý lọc theo tuổi bé ở trang danh mục.
   Không đổi giá, giỏ, bộ lọc, đặt hàng hay cách công cụ sức khỏe tính toán.
   Chưa lưu hồ sơ (hoặc mẹ xoá) → trang y như cũ. Muốn tắt phần nào: đổi BAT bên dưới thành false.
   ===================================================================== */
(function () {
  'use strict';
  if (window.RD_BE) return;

  const BAT = {
    dau: true,        // chip bé trên header, menu mobile, nút giữa thanh dưới
    nhanVat: true,    // nhân vật 3D đổi theo giới tính / chặng tuổi của bé
    the: true,        // nhãn "Hợp tuổi bé …" trên thẻ sản phẩm
    hanhTrinh: true,  // ghim "Bé … ở đây" trên Hành trình lớn lên (trang chủ)
    hangNha: true,    // hàng "Dành riêng cho bé …" ở trang chủ
    danhMuc: true,    // chip tuổi của bé + nút lọc nhanh ở trang danh mục
    gio: true,        // nhãn hợp tuổi trong giỏ hàng
    sp: true,         // mặt bé trên dòng "Phù hợp độ tuổi của bé" ở trang sản phẩm
  };

  const KHOA = 'hck_suckhoe';
  const KIDS = 'img/rd/kids/';
  const KID_W = { 'em-be': 303, 'chap-chung-gai': 258, 'chap-chung-trai': 235, 'be-gai': 296, 'be-trai': 212, 'teen-gai': 214, 'teen-trai': 205 };   // ảnh cao 600px
  const MC = () => window.MC || {};
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const thu = (ten, fn) => { try { fn(); } catch (err) { if (window.console) console.warn('[rd-be] ' + ten, err); } };
  const icon = (slug, size) => (MC().rdIcon ? MC().rdIcon(slug, size) : '');
  const muiTen = () => ((MC().I && MC().I.arrowR) || '<span aria-hidden="true">→</span>');
  const GD = { '0-6m': 'bé sơ sinh', '6-12m': 'bé ăn dặm', '1-3y': 'bé tập đi', '3-6y': 'bé mầm non', '6-12y': 'bé đi học', '12-18y': 'tuổi teen' };

  /* ---------- Hồ sơ bé (cùng điều kiện với suc-khoe.js / account.html) ---------- */
  function docBe() {
    let d = null;
    try { d = MC().store ? MC().store.get(KHOA) : JSON.parse(localStorage.getItem(KHOA) || 'null'); } catch (e) { return null; }
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d.dob || '') || !(d.sex === 1 || d.sex === 2) || !Array.isArray(d.log) || !d.log.length) return null;
    const [y, m, n] = d.dob.split('-').map(Number), nay = new Date();
    let thang = (nay.getFullYear() - y) * 12 + nay.getMonth() - (m - 1);
    if (nay.getDate() < n) thang--;
    if (!(thang >= 0 && thang <= 228)) return null;
    const trai = d.sex === 1;
    const nhom = thang < 6 ? '0-6m' : thang < 12 ? '6-12m' : thang < 36 ? '1-3y' : thang < 72 ? '3-6y' : thang < 144 ? '6-12y' : '12-18y';
    const ten = String(d.name || '').trim().replace(/^bé\s+/i, '').slice(0, 24);
    const tuoi = thang < 1 ? 'dưới 1 tháng' : thang < 24 ? thang + ' tháng' : Math.floor(thang / 12) + ' tuổi';
    const tuoiDu = thang < 24 ? tuoi : Math.floor(thang / 12) + ' tuổi' + (thang % 12 ? ' ' + (thang % 12) + ' tháng' : '');
    /* Cách gọi bé: có tên thì "bé Na"; không tên thì theo giới tính */
    const goi = ten ? 'bé ' + ten : (trai ? 'bé trai nhà mình' : 'bé gái nhà mình');
    const ngan = ten ? 'bé ' + ten : 'bé';
    const kid = thang < 12 ? 'em-be' : thang < 36 ? (trai ? 'chap-chung-trai' : 'chap-chung-gai') : thang < 144 ? (trai ? 'be-trai' : 'be-gai') : (trai ? 'teen-trai' : 'teen-gai');
    return { trai, thang, nhom, ten, tuoi, tuoiDu, goi, Goi: goi.charAt(0).toUpperCase() + goi.slice(1), ngan, kid, gd: GD[nhom] || '', sig: [ten, d.sex, d.dob].join('|') };
  }

  const mat = (be, size, cls) => `<img class="rdbe-ava${cls ? ' ' + cls : ''}" src="${KIDS}mat-${be.kid}.webp" alt="" width="${size}" height="${size}" decoding="async">`;
  const sanPham = (id) => (MC().byId ? MC().byId(id) : (window.PRODUCTS || []).find((p) => String(p.id) === String(id)));
  const hopTuoi = (be, p) => !!(be && p && (p.ages || []).includes(be.nhom));

  /* ---------- Gỡ mọi thứ đã thêm (khi mẹ xoá hồ sơ hoặc đổi bé) ---------- */
  const goc = new WeakMap();   // phần tử → { html, aria } để trả lại y như cũ
  const gocSrc = new WeakMap(); // ảnh nhân vật → { src, w }
  function goHet() {
    $$('.rdbe-fit, .rdbe-tag, .rdbe-pin, .rdbe-row, .rdbe-hint, .rdbe-chip__tag').forEach((el) => el.remove());
    $$('.rdbe-here').forEach((el) => el.classList.remove('rdbe-here'));
    $$('.rdbe-chip').forEach((el) => el.classList.remove('rdbe-chip'));
    $$('[data-rdbe]').forEach((el) => {
      const g = goc.get(el);
      if (g) { el.innerHTML = g.html; if (g.aria == null) el.removeAttribute('aria-label'); else el.setAttribute('aria-label', g.aria); goc.delete(el); }
      el.removeAttribute('data-rdbe');
    });
    $$('img[data-rdbe-kid]').forEach((img) => {
      const g = gocSrc.get(img);
      if (g) { img.src = g.src; if (g.w) img.setAttribute('width', g.w); gocSrc.delete(img); }
      img.removeAttribute('data-rdbe-kid');
    });
    const h = document.documentElement;
    h.removeAttribute('data-be'); h.removeAttribute('data-be-nhom');
  }

  /* ---------- 1. Header: nút "Đo chỉ số cho bé" thành chip của bé ---------- */
  function thay(el, html, aria) {
    if (el.getAttribute('data-rdbe') === BE.sig) return;
    if (!goc.has(el)) goc.set(el, { html: el.innerHTML, aria: el.getAttribute('aria-label') });
    el.innerHTML = html;
    if (aria) el.setAttribute('aria-label', aria);
    el.setAttribute('data-rdbe', BE.sig);
  }
  function dau(be) {
    const aria = `Đo chỉ số cho ${be.goi} (${be.tuoi})`;
    $$('.hact--suckhoe').forEach((a) => thay(a,
      `<span class="hact__emoji rdbe-face">${mat(be, 34)}<span class="rdbe-face__do">${icon('ruler', 16)}</span></span><span class="lbl rdbe-lbl"><b>${esc(be.Goi)}</b><small>${esc(be.tuoi)} · đo lại</small></span>`, aria));
    $$('.mmenu__link--do').forEach((a) => thay(a,
      `<span class="rdbe-face rdbe-face--menu">${mat(be, 40)}</span><span><b>Đo chỉ số cho ${esc(be.goi)}</b><small>${esc(be.tuoiDu)} · chuẩn WHO · miễn phí</small></span>`, aria));
    $$('.bn-do .circle').forEach((c) => thay(c, `${mat(be, 40, 'rdbe-ava--bn')}`, null));
  }

  /* ---------- 2. Nhân vật 3D theo bé ---------- */
  function doiAnh(img, slug) {
    if (!img || !KID_W[slug]) return;
    if (img.getAttribute('data-rdbe-kid') === slug) return;
    if (!gocSrc.has(img)) gocSrc.set(img, { src: img.getAttribute('src'), w: img.getAttribute('width') });
    const h = Number(img.getAttribute('height')) || 0;
    /* Ảnh có width/height đúng tỉ lệ thì tính lại width để khỏi méo (sân khấu rd-grow dùng khung cố định, giữ nguyên) */
    if (h && !img.classList.contains('rd-grow__k')) img.setAttribute('width', Math.round(KID_W[slug] / 600 * h));
    img.src = KIDS + slug + '.webp';
    img.setAttribute('data-rdbe-kid', slug);
  }
  function nhanVat(be) {
    /* Sân khấu "Bé nhà mình đang cần gì?" (rê canxi → bé cao lên): em bé → bé chập chững → bé lớn, đúng giới tính.
       Hero của công cụ sức khoẻ tự đổi theo bé đang tra (suc-khoe.js + health.css) nên bỏ qua. */
    $$('.rd-grow__k--child').forEach((img) => { if (!img.closest('.hk-hero__art')) doiAnh(img, be.trai ? 'chap-chung-trai' : 'chap-chung-gai'); });
    const lon = be.thang >= 144 ? (be.trai ? 'teen-trai' : 'teen-gai') : (be.trai ? 'be-trai' : 'be-gai');   // bé teen: chuỗi lớn lên kết thúc ở bạn teen
    $$('.rd-grow__k--girl').forEach((img) => { if (!img.closest('.hk-hero__art')) doiAnh(img, lon); });
    /* Thanh freeship: bé ngồi xe kéo là bé nhà mình */
    $$('.ys-fs__kid').forEach((img) => doiAnh(img, be.kid));
    /* Hành trình lớn lên: các bé 3D cạnh từng chặng mang đúng giới tính của bé (em bé giữ nguyên) */
    $$('.journey__kid').forEach((img) => {
      const goc0 = (gocSrc.get(img) || {}).src || img.getAttribute('src') || '';
      const m = goc0.match(/(chap-chung|be|teen)-(gai|trai)\.webp/);
      if (m) doiAnh(img, m[1] + (be.trai ? '-trai' : '-gai'));
    });
  }

  /* ---------- 3. Thẻ sản phẩm: "Hợp tuổi bé Na" ---------- */
  function the(be) {
    $$('.pcard[data-id]').forEach((c) => {
      const cu = c.querySelector('.rdbe-fit');
      if (cu && cu.getAttribute('data-sig') === be.sig) return;
      if (cu) cu.remove();
      if (c.closest('.rdbe-row')) return;   // hàng "Dành riêng cho bé" đã nói rõ rồi
      if (!hopTuoi(be, sanPham(c.getAttribute('data-id')))) return;
      const media = c.querySelector('.pcard__media'); if (!media) return;
      media.insertAdjacentHTML('beforeend', `<span class="rdbe-fit" data-sig="${esc(be.sig)}" title="Hợp độ tuổi của ${esc(be.goi)} (${esc(be.tuoiDu)})">${mat(be, 22)}<span>Hợp tuổi ${esc(be.ngan)}</span></span>`);
    });
  }

  /* ---------- 4. Trang chủ: ghim "Bé Na ở đây" trên Hành trình lớn lên ---------- */
  let daCuon = false;
  function hanhTrinh(be) {
    const track = document.getElementById('ageGrid'); if (!track) return;
    const stops = $$('.journey__stop', track), ages = window.AGES || [];
    if (stops.length !== ages.length + 1) return;   // trạm đầu là Mẹ bầu, sau đó từng chặng tuổi
    const i = ages.findIndex((a) => a.key === be.nhom); if (i < 0) return;
    const stop = stops[i + 1];
    stops.forEach((s) => { if (s !== stop) { s.classList.remove('rdbe-here'); const p = s.querySelector('.rdbe-pin'); if (p) p.remove(); } });
    const cu = stop.querySelector('.rdbe-pin');
    if (cu && cu.getAttribute('data-sig') === be.sig) return;
    if (cu) cu.remove();
    stop.classList.add('rdbe-here');
    stop.insertAdjacentHTML('afterbegin', `<span class="rdbe-pin" data-sig="${esc(be.sig)}">${mat(be, 26)}<span>${esc(be.ten ? 'Bé ' + be.ten : 'Bé')} ở đây</span></span>`);
    /* Dải trượt ngang (mobile): khi mẹ cuộn tới, dải tự lướt tới chặng của bé. Chỉ cuộn ngang trong dải, không kéo cả trang */
    if (!daCuon && 'IntersectionObserver' in window) {
      daCuon = true;
      const io = new IntersectionObserver((es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const s = track.querySelector('.journey__stop.rdbe-here'); if (!s || track.scrollWidth <= track.clientWidth + 4) return;
        const r = s.getBoundingClientRect(), t = track.getBoundingClientRect();
        if (r.left >= t.left && r.right <= t.right) return;
        const giam = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(() => track.scrollTo({ left: track.scrollLeft + (r.left - t.left) - (track.clientWidth - r.width) / 2, behavior: giam ? 'auto' : 'smooth' }), giam ? 0 : 450);
      }, { threshold: 0.6 });
      io.observe(track);
    }
  }

  /* ---------- 5. Trang chủ: hàng "Dành riêng cho bé Na" (đầu khối Mẹ tin dùng nhất) ---------- */
  function hangNha(be) {
    const khoi = document.querySelector('[data-khoi="noi-bat"] .container'); if (!khoi || !MC().productCard) return;
    const cu = khoi.querySelector('.rdbe-row');
    if (cu && cu.getAttribute('data-sig') === be.sig) return;
    if (cu) cu.remove();
    const ds = (window.PRODUCTS || [])
      .filter((p) => (p.ages || []).includes(be.nhom) && !(p.stock <= 0) && !p.isCombo)
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 8);
    if (ds.length < 2) return;
    khoi.insertAdjacentHTML('afterbegin', `<div class="rdbe-row" data-sig="${esc(be.sig)}">
      <div class="rdbe-row__head">
        <span class="rdbe-row__ava">${mat(be, 64)}</span>
        <div class="rdbe-row__txt"><h2>Dành riêng cho ${esc(be.goi)}</h2><p>${esc(be.Goi)} ${esc(be.tuoiDu)}${be.gd ? ', đang ở chặng ' + esc(be.gd) : ''}. Món hợp tuổi, mẹ mua nhiều nhất xếp trước.</p></div>
        <a class="link rdbe-row__all" href="collections.html?age=${encodeURIComponent(be.nhom)}">Xem tất cả ${muiTen()}</a>
      </div>
      <div class="row-scroll rdbe-row__list">${ds.map((p) => MC().productCard(p)).join('')}</div>
    </div>`);
  }

  /* ---------- 6. Trang danh mục: chip tuổi của bé + nút lọc nhanh ---------- */
  function danhMuc(be) {
    const row = document.getElementById('ageChips'); if (!row) return;
    const chip = row.querySelector(`.chip[data-age="${be.nhom}"]`); if (!chip) return;
    if (!chip.classList.contains('rdbe-chip')) chip.classList.add('rdbe-chip');
    const tag = chip.querySelector('.rdbe-chip__tag');
    if (!tag || tag.getAttribute('data-sig') !== be.sig) {
      if (tag) tag.remove();
      chip.insertAdjacentHTML('beforeend', `<span class="rdbe-chip__tag" data-sig="${esc(be.sig)}">${esc(be.ngan)}</span>`);
    }
    doiAnh(chip.querySelector('.ys-kid'), be.kid);
    /* Nút "Chỉ xem món hợp tuổi bé": bấm = bấm chip tuổi có sẵn (giữ nguyên các bộ lọc khác) */
    let goiY = row.parentElement && row.parentElement.querySelector(':scope > .rdbe-hint');
    const dangLoc = chip.classList.contains('is-active');
    if (dangLoc) { if (goiY) goiY.remove(); return; }
    if (goiY && goiY.getAttribute('data-sig') === be.sig) return;
    if (goiY) goiY.remove();
    row.insertAdjacentHTML('afterend', `<button class="rdbe-hint" type="button" data-sig="${esc(be.sig)}">${mat(be, 32)}<span>Chỉ xem món hợp tuổi <b>${esc(be.ngan)}</b> (${esc(be.tuoiDu)})</span>${muiTen()}</button>`);
    goiY = row.nextElementSibling;
    goiY.addEventListener('click', () => { const c = document.querySelector(`#ageChips .chip[data-age="${be.nhom}"]`); if (c) c.click(); });
  }

  /* ---------- 7. Giỏ hàng: nhãn hợp tuổi dưới tên món ---------- */
  function gio(be) {
    $$('.cart-item').forEach((it) => {
      const cu = it.querySelector('.rdbe-tag');
      if (cu && cu.getAttribute('data-sig') === be.sig) return;
      if (cu) cu.remove();
      const a = it.querySelector('a.name'); if (!a) return;
      /* mã sản phẩm: nút số lượng (data-qty-minus); link cũ ?id= làm dự phòng (web thật dùng link có từ khoá) */
      const nut = it.querySelector('[data-qty-minus],[data-qty-input]');
      const id = (nut && (nut.getAttribute('data-qty-minus') || nut.getAttribute('data-qty-input'))) || new URL(a.getAttribute('href'), location.href).searchParams.get('id');
      if (!hopTuoi(be, sanPham(id))) return;
      a.insertAdjacentHTML('afterend', `<span class="rdbe-tag" data-sig="${esc(be.sig)}">${mat(be, 20)}Hợp tuổi ${esc(be.ngan)}</span>`);
    });
  }

  /* ---------- 8. Trang sản phẩm: dòng "Phù hợp độ tuổi của bé" mang mặt bé ---------- */
  function sp(be) {
    $$('.pdp__kid--ok').forEach((el) => {
      if (el.getAttribute('data-rdbe') === be.sig) return;
      const ic = el.querySelector('img.rd-emo');
      if (ic) { if (!goc.has(el)) goc.set(el, { html: el.innerHTML, aria: el.getAttribute('aria-label') }); ic.outerHTML = mat(be, 40, 'rdbe-ava--pdp'); el.setAttribute('data-rdbe', be.sig); }
    });
  }

  /* ---------- Chạy ---------- */
  let BE = null, raw = null;
  function apDung() {
    if (!BE) return;
    const h = document.documentElement;
    if (h.getAttribute('data-be') !== (BE.trai ? 'trai' : 'gai')) h.setAttribute('data-be', BE.trai ? 'trai' : 'gai');
    if (h.getAttribute('data-be-nhom') !== BE.nhom) h.setAttribute('data-be-nhom', BE.nhom);
    if (BAT.dau) thu('dau', () => dau(BE));
    if (BAT.nhanVat) thu('nhanVat', () => nhanVat(BE));
    if (BAT.the) thu('the', () => the(BE));
    if (BAT.hanhTrinh) thu('hanhTrinh', () => hanhTrinh(BE));
    if (BAT.hangNha) thu('hangNha', () => hangNha(BE));
    if (BAT.danhMuc) thu('danhMuc', () => danhMuc(BE));
    if (BAT.gio) thu('gio', () => gio(BE));
    if (BAT.sp) thu('sp', () => sp(BE));
  }
  /* Hồ sơ đổi (đo xong, lưu bé khác, xoá ở trang Tài khoản, tab khác) → gỡ rồi vẽ lại */
  function kiemTra() {
    let r = null; try { r = localStorage.getItem(KHOA); } catch (e) { r = null; }
    if (r === raw) return;
    raw = r;
    const moi = docBe();
    if ((moi && moi.sig) === (BE && BE.sig)) { BE = moi; return; }
    goHet(); daCuon = false;
    BE = moi;
    apDung();
  }

  const SEL = '.pcard, .cart-item, #ageChips .chip, .ys-kid, .journey__stop, .journey__kid, #ageGrid, .hact--suckhoe, .mmenu__link--do, .bn-do, .ys-fs__kid, .rd-grow__k, .pdp__kid, [data-khoi="noi-bat"]';
  let hen = 0;
  const henVe = () => { if (hen) return; hen = requestAnimationFrame(() => { hen = 0; apDung(); }); };
  function batDau() {
    kiemTra();
    new MutationObserver((ms) => {
      if (!BE) return;
      for (const m of ms) for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.matches(SEL) || n.querySelector(SEL))) { henVe(); return; }
      }
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('storage', (e) => { if (!e.key || e.key === KHOA) kiemTra(); });
    document.addEventListener('hk:ketqua', () => { setTimeout(kiemTra, 0); setTimeout(kiemTra, 600); });
    let t = 0;
    document.addEventListener('click', () => { clearTimeout(t); t = setTimeout(kiemTra, 400); }, true);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) kiemTra(); });
  }

  window.RD_BE = { BAT, docBe, lamMoi: () => { raw = undefined; kiemTra(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', batDau, { once: true });
  else batDau();
})();
