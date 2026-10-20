/* =====================================================================
   SO SÁNH BÉ VỚI CHUẨN WHO + GỢI Ý MUA (theme "Lớn lên cùng bé")
   Chỉ là lớp hiển thị cho công cụ Theo dõi sức khỏe con:
   - suc-khoe.js phát sự kiện 'hk:ketqua' { hs, k, chon, lyDo } sau khi vẽ kết quả;
   - số chuẩn lấy từ chính kết quả công cụ (k.chiSo: tb = trung bình WHO, thap/cao = −2SD/+2SD)
     và window.HK_GROWTH (cùng công thức), không tính lại theo cách khác, không lưu gì thêm.
   Bố cục: trái = lần đo trước (nếu có), giữa = bé hôm nay, phải = bạn chuẩn WHO cùng tuổi, cùng giới.
   ===================================================================== */
(function () {
  'use strict';
  if (window.RDSoSanh || typeof document === 'undefined') return;
  const MC = window.MC;
  if (!MC) return;

  const ICON = 'img/rd/icons/';
  const giam = () => (window.RD && window.RD.reduced) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const so = (x, d = 1) => Number(x).toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });
  const ngay = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  const soNgay = (a, b) => Math.round((ngay(b) - ngay(a)) / 864e5);
  const hienNgay = (s) => ngay(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const thangTuoi = (dob, d) => soNgay(dob, d) / ((window.HK_GROWTH && window.HK_GROWTH.NGAY_MOI_THANG) || 30.4375);
  const tuoiChu = (m) => {
    m = Math.floor(m);
    if (m < 1) return 'dưới 1 tháng';
    if (m < 24) return m + ' tháng';
    const y = Math.floor(m / 12), r = m % 12;
    return y + ' tuổi' + (r ? ' ' + r + ' tháng' : '');
  };
  /* Nhân vật 3D cả người (tạo bằng Higgsfield, img/rd/kids/) theo tuổi lúc đo và giới tính.
     Số kèm theo = tỉ lệ rộng/cao của ảnh, để cả người đứng vừa đúng chiều cao trên thước. */
  const KIDS = 'img/rd/kids/';
  const TILE = { 'em-be': 0.51, 'chap-chung-gai': 0.43, 'chap-chung-trai': 0.39, 'be-gai': 0.49, 'be-trai': 0.35, 'teen-gai': 0.36, 'teen-trai': 0.34 };
  // dưới 1 tuổi: em bé · 1–4 tuổi: chập chững · 4–12 tuổi: bé lớn · từ 12 tuổi (144 tháng): tuổi teen
  const hinh = (thang, sex) => (thang < 12 ? 'em-be'
    : thang < 48 ? (sex === 1 ? 'chap-chung-trai' : 'chap-chung-gai')
      : thang < 144 ? (sex === 1 ? 'be-trai' : 'be-gai')
        : sex === 1 ? 'teen-trai' : 'teen-gai');
  const tenBe = (hs) => (hs && hs.name ? 'bé ' + MC.esc(hs.name) : 'bé');
  const hoaDau = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const dau = (x, d = 1) => (x > 0 ? '+' : x < 0 ? '−' : '±') + so(Math.abs(x), d);

  let lanCuoi = null; // { hs, k } để bong bóng ăn mừng gọi đúng tên bé

  /* ---------------- Thước: phóng to quanh các số đo để mẹ thấy rõ chênh lệch ---------------- */
  function thuoc(vals) {
    const min = Math.min(...vals), max = Math.max(...vals);
    const hi = Math.ceil((max + 3) / 2) * 2;
    const lo = Math.floor(min - (hi - min) * 0.65);
    const span = hi - lo;
    const buoc = span <= 24 ? 2 : span <= 50 ? 5 : 10;
    const vach = [];
    for (let v = Math.ceil(lo / buoc) * buoc; v <= hi; v += buoc) vach.push(v);
    return { lo, hi, vach, y: (cm) => Math.max(0, Math.min(100, ((cm - lo) / span) * 100)) };
  }

  function veBe(cls, slug, cm, y, nhan, phu, ariaTen, them) {
    // Mỗi bé đứng trên sàn, đỉnh đầu chạm đúng vạch cm của mình. Bấm / Enter / Space: bé nhảy và nói một câu.
    const ar = TILE[slug] || 0.45;
    const dong = [].concat(phu).filter(Boolean);
    return `<figure class="rd-ss__kid rd-ss__kid--${cls}" style="--y:${y.toFixed(2)};--ar:${ar}" data-ss-vai="${cls}"${them || ''} tabindex="0" role="button"
        aria-label="${ariaTen}${dong.length ? ', ' + dong.join(', ') : ''}. Bấm để bé chào mẹ">
      <span class="rd-ss__mark"><b data-ss-cm="${cm.toFixed(1)}">${so(cm, cm % 1 ? 1 : 0)}</b> cm</span>
      <div class="rd-ss__fig">
        ${cls === 'who'
          ? `<span class="rd-ss__body rd-ss__ghost" style="--src:url('${new URL(KIDS + slug + '.webp', document.baseURI).href}')"></span>`
          : `<img class="rd-ss__body" src="${KIDS}${slug}.webp" alt="" width="${Math.round(600 * ar)}" height="600" decoding="async" draggable="false">`}
      </div>
      <figcaption class="rd-ss__cap"><b>${nhan}</b>${dong.map((t) => `<small>${t}</small>`).join('')}</figcaption>
    </figure>`;
  }

  function veKhoi(hs, k, chon, lyDo) {
    const hfa = k && k.chiSo && k.chiSo.hfa;
    if (!hs || !hs.log || !hs.log.length || !hfa) return '';
    const wfa = k.chiSo.wfa;
    const lan = hs.log[hs.log.length - 1];
    const truoc = hs.log.length > 1 ? hs.log[hs.log.length - 2] : null;
    const tNay = thangTuoi(hs.dob, lan.d);
    const tTruoc = truoc ? thangTuoi(hs.dob, truoc.d) : null;
    const T = thuoc([lan.h, hfa.tb, hfa.thap, hfa.cao].concat(truoc ? [truoc.h] : []));

    const kids = [];
    if (truoc) kids.push(veBe('truoc', hinh(tTruoc, hs.sex), truoc.h, T.y(truoc.h), 'Lần trước',
      [hienNgay(truoc.d), tuoiChu(tTruoc), truoc.w ? so(truoc.w) + ' kg' : ''], `Lần đo trước: ${so(truoc.h)} cm`));
    kids.push(veBe('nay', hinh(tNay, hs.sex), lan.h, T.y(lan.h), hoaDau(tenBe(hs)) + ' hôm nay',
      [tuoiChu(tNay), lan.w ? so(lan.w) + ' kg' : ''], `Bé hôm nay: ${so(lan.h)} cm`,
      truoc && lan.h > truoc.h ? ' data-ss-tang="1"' : ''));
    kids.push(veBe('who', hinh(tNay, hs.sex), hfa.tb, T.y(hfa.tb), 'Chuẩn WHO',
      [`cùng tuổi, ${hs.sex === 1 ? 'bé trai' : 'bé gái'}`, wfa ? so(wfa.tb) + ' kg' : ''], `Chiều cao trung bình chuẩn WHO: ${so(hfa.tb)} cm`));

    const ghi = [];
    if (truoc) {
      const dh = lan.h - truoc.h, n = soNgay(truoc.d, lan.d);
      ghi.push(`<li class="rd-ss__note rd-ss__note--${dh >= 0 ? 'up' : 'flat'}"><img src="${ICON}ruler.webp" alt="" width="28" height="28">
        <span>So với lần trước (${n} ngày): chiều cao <b>${dau(dh)} cm</b>${truoc.w && lan.w ? `, cân nặng <b>${dau(lan.w - truoc.w)} kg</b>` : ''}.</span></li>`);
    }
    const dWho = lan.h - hfa.tb;
    ghi.push(`<li class="rd-ss__note rd-ss__note--${hfa.tone}"><img src="${ICON}${hfa.tone === 'good' ? 'check' : 'bulb'}.webp" alt="" width="28" height="28">
      <span>Chiều cao: <b>${MC.esc(hfa.label)}</b>. ${Math.abs(dWho) < 0.05 ? 'Bằng' : dWho > 0 ? 'Cao hơn' : 'Thấp hơn'} mức trung bình WHO${Math.abs(dWho) < 0.05 ? '' : ` <b>${so(Math.abs(dWho))} cm</b>`}. Vùng chuẩn: ${so(hfa.thap)}–${so(hfa.cao)} cm.</span></li>`);
    if (wfa && lan.w) {
      ghi.push(`<li class="rd-ss__note rd-ss__note--${wfa.tone}"><img src="${ICON}honey.webp" alt="" width="28" height="28">
        <span>Cân nặng: <b>${MC.esc(wfa.label)}</b> (${so(lan.w)} kg, trung bình WHO ${so(wfa.tb)} kg).</span></li>`);
    }

    const ds = (chon || []).slice(0, 3);
    const goiY = ds.length ? `<aside class="rd-ss__picks" aria-label="Gợi ý cho ${tenBe(hs)}">
      <h4 class="rd-ss__ptitle"><img src="${ICON}gift.webp" alt="" width="32" height="32"> Gợi ý cho ${tenBe(hs)}</h4>
      <p class="rd-ss__psub">Chọn theo tuổi và kết quả đo của bé, từ sản phẩm của shop.</p>
      <ul class="rd-ss__plist">${ds.map((p) => {
        const het = p.stock !== undefined && p.stock <= 0;
        const why = typeof lyDo === 'function' ? lyDo(p) : [];
        return `<li class="rd-ss__pick">
          <a class="rd-ss__pimg" href="${MC.spUrl ? MC.spUrl(p) : 'product.html?id=' + p.id}"><img src="${MC.productThumb(p)}" alt="${MC.esc(MC.shortName(p))}" width="88" height="88" loading="lazy"></a>
          <div class="rd-ss__pbody">
            <a class="rd-ss__pname" href="${MC.spUrl ? MC.spUrl(p) : 'product.html?id=' + p.id}">${MC.esc(MC.shortName(p))}</a>
            ${why && why.length ? `<div class="rd-ss__why">${why.map((t) => `<span>${MC.esc(t)}</span>`).join('')}</div>` : ''}
          </div>
            <div class="rd-ss__prow">
              <b class="rd-ss__price">${p.variants && p.variants.length > 1 ? '<small>từ</small> ' : ''}${MC.fmt(p.price)}</b>
              <span class="rd-ss__acts">
                <button class="btn btn--primary rd-ss__add" type="button" data-add="${p.id}" ${het ? 'disabled' : ''}>Thêm vào giỏ</button>
                <button class="btn btn--outline rd-ss__buy" type="button" data-buy="${p.id}" ${het ? 'disabled' : ''}>Mua ngay</button>
              </span>
            </div>
        </li>`;
      }).join('')}</ul>
    </aside>` : '';

    return `<section class="rd-ss" aria-label="So sánh chiều cao của ${tenBe(hs)} với chuẩn WHO">
      <div class="rd-ss__main">
        <div class="rd-ss__head">
          <h3 class="rd-ss__title">${hoaDau(tenBe(hs))} so với bạn chuẩn WHO</h3>
          <p class="rd-ss__sub">${truoc ? 'Trái: lần đo trước · Giữa: bé hôm nay · Phải: chuẩn WHO cùng tuổi, cùng giới.' : 'Trái: bé hôm nay · Phải: chuẩn WHO cùng tuổi, cùng giới.'}</p>
        </div>
        <div class="rd-ss__stage rd-ss__stage--${kids.length}" data-ss-lo="${T.lo}">
          <div class="rd-ss__band" style="--b0:${T.y(hfa.thap).toFixed(2)};--b1:${T.y(hfa.cao).toFixed(2)}"><span>Vùng chuẩn WHO</span></div>
          <div class="rd-ss__ticks" aria-hidden="true">${T.vach.map((v) => `<i style="--t:${T.y(v).toFixed(2)}"><em>${v}</em></i>`).join('')}</div>
          <div class="rd-ss__avg" style="--t:${T.y(hfa.tb).toFixed(2)}" aria-hidden="true"></div>
          <div class="rd-ss__kids">${kids.join('')}</div>
        </div>
        <p class="rd-ss__hint">Thước được phóng to quanh các số đo để mẹ dễ thấy chênh lệch. Kết quả chỉ để tham khảo, không thay cho thăm khám của bác sĩ.</p>
        <p class="sr-only" aria-live="polite" data-ss-loa></p>
        <ul class="rd-ss__notes">${ghi.join('')}</ul>
      </div>
      ${goiY}
    </section>`;
  }

  /* ---------------- Hạt trang trí (sao, tim, chấm): span + CSS keyframes, tự xoá sau khi bay xong ---------------- */
  const MAU_HAT = ['#F0537A', '#FFB020', '#17A398', '#8B6CEF', '#4B9BFF', '#FF8FB1'];
  const SVG_HAT = {
    sao: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6-2.6 7.9-2.6-7.9L1.5 12l7.9-2.6z"/></svg>',
    tim: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2s-8.3-5-10-10.4C.8 6.9 3.4 3.6 6.9 3.6c2.2 0 3.9 1.2 5.1 3 1.2-1.8 2.9-3 5.1-3 3.5 0 6.1 3.3 4.9 7.2-1.7 5.4-10 10.4-10 10.4z"/></svg>',
  };
  function banHat(cha, { n = 5, xa = [24, 38], hinhHat = ['sao', 'cham'], goc = [0, 360], deu = false, mau = MAU_HAT } = {}) {
    if (!cha || giam()) return;
    const ds = [];
    for (let i = 0; i < n; i++) {
      const h = hinhHat[i % hinhHat.length];
      const a = (deu ? goc[0] + ((goc[1] - goc[0]) * (i + 0.5)) / n : goc[0] + Math.random() * (goc[1] - goc[0])) * (Math.PI / 180);
      const r = xa[0] + Math.random() * (xa[1] - xa[0]);
      const el = document.createElement('i');
      el.className = 'rd-ss-hat rd-ss-hat--' + h;
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = `--dx:${(Math.cos(a) * r).toFixed(1)}px;--dy:${(Math.sin(a) * r).toFixed(1)}px;--r:${Math.round(Math.random() * 160 - 80)}deg;`
        + `--c:${mau[(Math.random() * mau.length) | 0]};--s:${(0.75 + Math.random() * 0.5).toFixed(2)};animation-delay:${Math.round(Math.random() * 70)}ms`;
      el.innerHTML = SVG_HAT[h] || '';
      cha.appendChild(el);
      ds.push(el);
    }
    setTimeout(() => ds.forEach((el) => el.remove()), 1100);
  }
  // Chạy lại một animation CSS bằng class (xoá → reflow → gắn lại), tự gỡ class khi xong
  function phat(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    clearTimeout(el['_t_' + cls]);
    el['_t_' + cls] = setTimeout(() => el.classList.remove(cls), ms);
  }

  /* ---------------- Animation sân khấu: các bé "lớn lên" từ sàn, nhãn cm leo theo thước và đếm số ---------------- */
  const MOC = 750; // thời gian lớn lên = thời gian nhãn leo + đếm số (ms), khớp với CSS
  function demSo(el, tu, toi, ms) {
    const t0 = performance.now(), d = toi % 1 ? 1 : 0;
    tu = Math.min(tu, toi);
    el.textContent = so(tu, d);
    const buoc = (t) => {
      const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3); // ease-out cubic, giống CSS
      el.textContent = so(tu + (toi - tu) * e, d);
      if (p < 1) requestAnimationFrame(buoc);
    };
    requestAnimationFrame(buoc);
  }
  // "Ting": vòng sáng + sao nhỏ bung ra ở nhãn cm của bé hôm nay khi bé lớn tới nơi
  function ting(kid) {
    if (giam()) return;
    const mk = kid.querySelector('.rd-ss__mark');
    if (mk) mk.classList.add('is-ting');
    const o = document.createElement('span');
    o.className = 'rd-ss__ting';
    o.setAttribute('aria-hidden', 'true');
    o.innerHTML = '<i class="rd-ss__ring"></i>';
    kid.appendChild(o);
    banHat(o, { n: 8, xa: [30, 46], hinhHat: ['sao', 'cham'], deu: true, mau: ['#FFB020', '#F0537A', '#FFC94D', '#8B6CEF'] });
    setTimeout(() => o.remove(), 1200);
  }
  function dien(khoi) {
    const kids = [...khoi.querySelectorAll('.rd-ss__kid')];
    if (giam()) { khoi.classList.add('is-shown'); return; }
    const san = khoi.querySelector('.rd-ss__stage');
    const lo = parseFloat(san && san.dataset.ssLo) || 0;
    // đo trước khi ẩn: nhãn cm bắt đầu từ sàn (đáy thước) rồi leo lên đúng vạch
    kids.forEach((kid, i) => { kid.style.setProperty('--rise', kid.offsetHeight + 'px'); kid.style.setProperty('--k', i); });
    khoi.classList.add('is-anim');
    kids.forEach((kid, i) => {
      setTimeout(() => {
        kid.classList.add('is-in');
        const b = kid.querySelector('[data-ss-cm]');
        if (b) demSo(b, lo, parseFloat(b.dataset.ssCm), MOC);
        if (kid.classList.contains('rd-ss__kid--nay')) setTimeout(() => ting(kid), MOC - 40);
        setTimeout(() => kid.classList.add('is-idle'), 1150); // sau khi lớn xong mới "thở" nhẹ
      }, 200 + i * 320);
    });
    setTimeout(() => {
      khoi.classList.add('is-shown');
      const nay = khoi.querySelector('.rd-ss__kid--nay');
      // bé hôm nay nhảy một cái và rủ mẹ chạm vào, để mẹ biết các bé bấm được
      if (nay) { phat(nay, 'is-hop', 950); noi(nay, 'Mẹ chạm vào con nha!', true); }
    }, 200 + kids.length * 320 + 900);
  }

  /* ---------------- Chạm vào bé: nhún bật (squash & stretch), tim/sao bay, bong bóng nói ---------------- */
  const CAU = {
    nay: ['Mẹ đo cho con nữa nha!', 'Con ăn ngoan lắm!'],
    who: ['Mình là bạn chuẩn WHO nè!'],
    truoc: ['Đây là con lần trước đó!'],
  };
  const MAU_VAI = {
    nay: ['#F0537A', '#FF8FB1', '#FFB020', '#CA4666'],
    who: ['#17A398', '#4B9BFF', '#7FD6CF', '#FFB020'],
    truoc: ['#8B6CEF', '#FF8FB1', '#FFB020', '#B9A6F5'],
  };
  function cauNoi(kid) {
    const vai = kid.dataset.ssVai;
    let ds = CAU[vai] || CAU.nay;
    if (vai === 'nay' && kid.dataset.ssTang) ds = ['Con cao thêm rồi nè!'].concat(ds); // chỉ nói khi bé cao hơn lần đo trước
    const i = +(kid.dataset.ssLan || 0);
    kid.dataset.ssLan = i + 1;
    return ds[i % ds.length];
  }
  function noi(kid, chu, imLang) {
    const khoi = kid.closest('.rd-ss');
    if (!khoi) return;
    khoi.querySelectorAll('.rd-ss__say').forEach((x) => x.remove());
    const say = document.createElement('span');
    say.className = 'rd-ss__say';
    say.setAttribute('aria-hidden', 'true');
    say.textContent = chu;
    kid.appendChild(say);
    // giữ bong bóng trong khung so sánh và trong màn hình (điện thoại 390px): dời ngang, đuôi vẫn chỉ vào bé
    const r = kid.getBoundingClientRect(), k = khoi.getBoundingClientRect(), w = say.offsetWidth;
    const min = Math.max(8, k.left + 6), max = Math.min(document.documentElement.clientWidth - 8, k.right - 6);
    const trai = r.left + r.width / 2 - w / 2;
    const dx = trai < min ? min - trai : trai + w > max ? max - (trai + w) : 0;
    say.style.setProperty('--dx', Math.round(dx) + 'px');
    clearTimeout(kid._tSay);
    kid._tSay = setTimeout(() => say.remove(), 2600);
    // đọc cho trình đọc màn hình (bong bóng chỉ để nhìn)
    const loa = !imLang && khoi.querySelector('[data-ss-loa]');
    if (loa) { loa.textContent = ''; setTimeout(() => { loa.textContent = chu; }, 60); }
  }
  function choiBe(kid) {
    if (!kid) return;
    noi(kid, cauNoi(kid));
    if (giam()) return; // giảm chuyển động: chỉ hiện câu nói, không nhảy, không hạt
    phat(kid, 'is-boing', 820);
    const o = document.createElement('span');
    o.className = 'rd-ss__burst';
    o.setAttribute('aria-hidden', 'true');
    kid.appendChild(o);
    banHat(o, { n: 6, xa: [34, 60], hinhHat: ['tim', 'sao', 'tim', 'cham'], goc: [205, 335], mau: MAU_VAI[kid.dataset.ssVai] || MAU_HAT });
    setTimeout(() => o.remove(), 1200);
  }
  document.addEventListener('click', (e) => {
    const kid = e.target.closest('.rd-ss__kid');
    if (kid) choiBe(kid);
  });
  document.addEventListener('keydown', (e) => {
    const kid = e.target.closest && e.target.closest('.rd-ss__kid');
    if (!kid || kid !== e.target || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault(); // Space không cuộn trang
    if (!e.repeat) choiBe(kid);
  });

  /* ---------------- Gom phần phân tích dài thành các mục nhỏ: bấm mục nào mở mục đó ----------------
     Chỉ di chuyển các khối có sẵn vào khung thu gọn (công cụ tìm phần tử theo id nên vẫn chạy như cũ). */
  const IND_TEN = { wfa: 'Cân nặng', hfa: 'Chiều cao', bfa: 'BMI' };
  const gonChu = (s, n = 110) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : s; };
  /* Sticker cho từng mục: ưu tiên sticker 3D dễ thương (img/rd/stickers/), mục nào không hợp thì giữ icon Fluent.
     Khoá = class của khối (suc-khoe.js) hoặc tên icon Fluent ở tiêu đề khối. */
  const STK = 'img/rd/stickers/';
  const STICKER = {
    'hk-nutri': 'vitamin', apple: 'vitamin', // "Bé … cần gì mỗi ngày?"
    'hk-an': 'rong-bien', rice: 'rong-bien', // "Chế độ ăn cho bé …"
    gift: 'sua', // "Gợi ý cho bé …" (sản phẩm)
    teddy: 'do-an', // "Các bạn cùng tuổi đang dùng"
    sparkles: 'cho-me', // "Gợi ý thêm cho mẹ"
  };
  // Màu nền ô sticker theo từng mục (pastel của theme), mục kề nhau khác màu
  const TONE = { check: 'mint', stethoscope: 'sky', ruler: 'butter', vitamin: 'blush', 'rong-bien': 'oat', basketball: 'lilac', sua: 'butter', 'do-an': 'blush', 'cho-me': 'mint' };
  const TONE_VONG = ['blush', 'mint', 'butter', 'sky', 'lilac', 'oat'];
  const LOAI = ['hk-eval', 'hk-chart', 'hk-nutri', 'hk-an', 'hk-vd'];
  let soAcc = 0;
  function gom(kq, detail) {
    if (!kq || kq.querySelector('.rd-acc')) return;
    const muc = [];
    const metrics = kq.querySelector(':scope > .hk-metrics');
    if (metrics) {
      const c = (detail && detail.k && detail.k.chiSo) || {};
      const tom = ['wfa', 'hfa', 'bfa'].filter((i) => c[i]).map((i) => `${IND_TEN[i]}: ${c[i].label}`).join(' · ');
      const nodes = [metrics];
      const note = kq.querySelector(':scope > .hk-note');
      if (note) nodes.push(note);
      muc.push({ nodes, ten: 'Chỉ số của bé theo chuẩn WHO', tom, icon: ICON + 'check.webp', khoa: 'check' });
    }
    kq.querySelectorAll(':scope > .hk-block').forEach((b) => {
      const h3 = b.querySelector('.hk-block__head h3');
      const ten = h3 ? h3.textContent.trim() : 'Chi tiết';
      const anh = h3 && h3.querySelector('img');
      const tenIc = anh ? ((anh.getAttribute('src') || '').match(/([\w-]+)\.webp/) || [])[1] || '' : '';
      const loai = LOAI.find((c) => b.classList.contains(c));
      const stk = STICKER[loai] || STICKER[tenIc];
      let tom = '', goc = null;
      const p = b.querySelector('.hk-eval__tong, .hk-nutri__focus, .hk-block__head p, .hk-tv__txt');
      if (b.classList.contains('hk-chart')) tom = 'Đường lớn lên của bé so với vùng chuẩn WHO' + (detail && detail.hs && detail.hs.log.length > 1 ? `, ${detail.hs.log.length} lần đo` : '') + '.';
      else if (p) { tom = p.textContent; if (p.matches('.hk-block__head p')) goc = p; }
      else if (b.querySelector('.pcard')) tom = `${b.querySelectorAll('.pcard').length} sản phẩm hợp tuổi của bé.`;
      const gon = gonChu(tom);
      // Dòng phụ dưới tiêu đề khối đã hiện đủ trên nút thì không lặp lại trong phần mở ra
      const trung = !!goc && gon === gonChu(tom, 1e4);
      if (trung) goc.classList.add('rd-acc__trung');
      muc.push({ nodes: [b], ten, tom: gon, trung, icon: stk ? STK + stk + '.webp' : anh ? anh.getAttribute('src') : ICON + 'sparkles.webp', stk: !!stk, khoa: stk || tenIc });
    });
    if (!muc.length) return;
    const acc = document.createElement('div');
    acc.className = 'rd-acc';
    acc.innerHTML = `<div class="rd-acc__top"><p>Mẹ bấm vào từng mục để xem chi tiết.</p><button class="rd-acc__all" type="button" aria-expanded="false">Mở tất cả</button></div>`;
    muc.forEach((m, i) => {
      const id = 'rdAcc' + (++soAcc);
      const item = document.createElement('section');
      item.className = 'rd-acc__item' + (m.trung ? ' rd-acc__item--du' : '');
      item.dataset.tone = TONE[m.khoa] || TONE_VONG[i % TONE_VONG.length];
      item.innerHTML = `<h3 class="rd-acc__h"><button class="rd-acc__btn" type="button" aria-expanded="false" aria-controls="${id}" id="${id}b">
          <span class="rd-acc__st" aria-hidden="true"><img class="rd-acc__ic${m.stk ? ' rd-acc__ic--stk' : ''}" src="${m.icon}" alt="" width="48" height="48" loading="lazy" decoding="async" draggable="false"></span>
          <span class="rd-acc__txt"><b>${MC.esc(m.ten)}</b>${m.tom ? `<small>${MC.esc(m.tom)}</small>` : ''}</span>
          <span class="rd-acc__chev" aria-hidden="true"></span>
        </button></h3>
        <div class="rd-acc__panel" id="${id}" role="region" aria-labelledby="${id}b"><div class="rd-acc__in"></div></div>`;
      const vao = item.querySelector('.rd-acc__in');
      m.nodes.forEach((n) => vao.appendChild(n));
      acc.appendChild(item);
    });
    const sau = kq.querySelector(':scope > .hk-verdict') || kq.querySelector(':scope > .rd-ss') || kq.querySelector(':scope > .hk-res__head');
    if (sau) sau.after(acc); else kq.prepend(acc);
  }
  /* Mở / đóng một mục. kieu: 'bam' = mẹ bấm (sticker nhún + bắn sao), 'nhe' = mở tất cả (chỉ nhún) */
  function moMuc(item, mo, kieu) {
    const doi = item.classList.contains('is-open') !== mo;
    item.classList.toggle('is-open', mo);
    item.querySelector('.rd-acc__btn').setAttribute('aria-expanded', String(mo));
    if (!doi || !kieu || giam()) return;
    const st = item.querySelector('.rd-acc__st');
    if (!mo) { phat(st, 'is-nhun', 450); return; }
    phat(st, 'is-pop', 700);
    if (kieu === 'bam') banHat(st, { n: 6, xa: [30, 44], hinhHat: ['sao', 'cham', 'tim'], deu: true });
  }
  // Nút "Mở tất cả" theo đúng trạng thái: mục nào cũng mở thì thành "Thu gọn tất cả"
  function dongBoNutAll(acc) {
    const all = acc && acc.querySelector('.rd-acc__all');
    if (!all) return;
    const mo = [...acc.querySelectorAll('.rd-acc__item')].every((it) => it.classList.contains('is-open'));
    all.setAttribute('aria-expanded', String(mo));
    all.textContent = mo ? 'Thu gọn tất cả' : 'Mở tất cả';
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.rd-acc__btn');
    if (btn) {
      const it = btn.closest('.rd-acc__item');
      moMuc(it, !it.classList.contains('is-open'), 'bam');
      dongBoNutAll(it.closest('.rd-acc'));
      return;
    }
    const all = e.target.closest('.rd-acc__all');
    if (all) {
      const mo = all.getAttribute('aria-expanded') !== 'true';
      all.closest('.rd-acc').querySelectorAll('.rd-acc__item').forEach((it, i) => {
        if (mo && !giam()) setTimeout(() => moMuc(it, true, 'nhe'), i * 45); // các sticker nhún lần lượt
        else moMuc(it, mo, 'nhe');
      });
      all.setAttribute('aria-expanded', String(mo));
      all.textContent = mo ? 'Thu gọn tất cả' : 'Mở tất cả';
    }
  });

  // Tạm dừng các vòng lặp nhẹ (bé thở, bóng WHO lấp lánh) khi sân khấu ra khỏi màn hình
  let ioNhin = null;
  function theoDoiNhin(khoi) {
    if (ioNhin) ioNhin.disconnect();
    if (!('IntersectionObserver' in window)) return;
    ioNhin = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting)));
    ioNhin.observe(khoi);
  }

  function chen(detail) {
    const kq = document.getElementById('hkResult');
    if (!kq || !detail) return;
    lanCuoi = detail;
    const cu = kq.querySelector('.rd-ss');
    if (cu) cu.remove();
    gom(kq, detail);
    const html = veKhoi(detail.hs, detail.k, detail.chon, detail.lyDo);
    if (!html) return;
    const dauKq = kq.querySelector('.hk-res__head');
    if (dauKq) dauKq.insertAdjacentHTML('afterend', html);
    else kq.insertAdjacentHTML('afterbegin', html);
    const khoi = kq.querySelector('.rd-ss');
    theoDoiNhin(khoi);
    if (!('IntersectionObserver' in window)) { dien(khoi); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); dien(khoi); }
    }, { threshold: 0.25 });
    io.observe(khoi);
  }
  document.addEventListener('hk:ketqua', (e) => chen(e.detail));

  /* ---------------- Ăn mừng khi mẹ thêm sản phẩm gợi ý vào giỏ ---------------- */
  function gioHienTai() {
    const ds = [...document.querySelectorAll('[data-open-cart]')];
    return ds.find((el) => { const r = el.getBoundingClientRect(); return r.width && r.height && r.bottom > 0 && r.top < innerHeight; }) || null;
  }
  function bayVaoGio(nut) {
    const anh = nut.closest('.rd-ss__pick, .pcard');
    const src = anh && anh.querySelector('img');
    const gio = gioHienTai();
    if (!src || !gio) return;
    const a = src.getBoundingClientRect(), b = gio.getBoundingClientRect();
    const bay = src.cloneNode();
    bay.className = 'rd-ss-fly';
    Object.assign(bay.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(bay);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = bay.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 70}px) scale(.7) rotate(-12deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.18) rotate(8deg)`, opacity: 0.2 },
    ], { duration: 820, easing: 'cubic-bezier(.4,.1,.3,1)' });
    anim.onfinish = () => bay.remove();
  }
  function beVui(nut) {
    // bé ở sân khấu nhảy cẫng (nếu đang thấy trên màn hình)
    const nay = document.querySelector('.rd-ss .rd-ss__kid--nay');
    const hinhBe = nay && nay.querySelector('img.rd-ss__body');
    if (nay) {
      const r = nay.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) { nay.classList.remove('is-yay'); void nay.offsetWidth; nay.classList.add('is-yay'); }
    }
    // bong bóng bay lên ngay từ nút vừa bấm, nên trên điện thoại mẹ luôn thấy
    const b = nut.getBoundingClientRect();
    const bong = document.createElement('div');
    bong.className = 'rd-ss-cheer';
    bong.setAttribute('role', 'status');
    bong.innerHTML = `<img src="${hinhBe ? hinhBe.getAttribute('src') : ICON + 'love.webp'}" alt="" width="44" height="44"><span>Đã thêm vào giỏ cho ${tenBe(lanCuoi && lanCuoi.hs)} rồi nè!</span>`;
    bong.style.left = Math.max(12, Math.min(innerWidth - 12, b.left + b.width / 2)) + 'px';
    bong.style.top = Math.max(70, b.top - 10) + 'px';
    document.body.appendChild(bong);
    setTimeout(() => bong.remove(), 2700);
  }
  document.addEventListener('click', (e) => {
    const nut = e.target.closest('#hkResult [data-add]');
    if (!nut || nut.disabled || giam()) return;
    // app.js đã xử lý thêm vào giỏ trước (đăng ký sớm hơn); ở đây chỉ thêm phần trang trí
    setTimeout(() => { bayVaoGio(nut); beVui(nut); }, 30);
  });

  window.RDSoSanh = { chen, veKhoi };
})();
