/* Popup chào ở trang chủ (index.html): mỗi ngày hiện 1 lần, trước khi mẹ xem trang chủ.
   1. Đo sức khỏe cho bé: mở đúng form "Thông tin của bé" của js/suc-khoe.js. Máy đã lưu bé thì bỏ qua bước này.
   2. Bé so với chuẩn WHO + sản phẩm gợi ý: vẽ bằng chính js/rd-so-sanh.js (veKhoi, dien).
   3. Tập thể dục cùng bé hôm nay (js/tap-lich.js, mẫu thẻ hk-vd__o) + giữ chuỗi: nút nhỏ Đăng nhập / Đăng ký để tập mỗi ngày và nhận điểm.
   4. Mỗi ngày một điều về bé theo tuổi + món hỗ trợ điều đó: cùng dữ liệu khối "Bạn có biết?" (js/rd-y-home.js, RD_FACT).
   Chỉ là lớp hiển thị: số liệu lấy từ HK_GROWTH (cùng cách tính với phần kết quả), chỉ lưu ngày đã hiện popup.
   Chuyển động dùng bộ chung của web (css/rd/motion.css: rd-rv-*, --rd-ease, --rd-spring; rd-vui.js chạm bé là bé nhảy).
   Luôn có nút "Để sau" để vào thẳng trang chủ. ?chao=1: luôn hiện (để xem thử) · ?chao=0: không hiện. */
(function () {
  'use strict';
  const K_NGAY = 'hck_chao_ngay';
  const LOAI = { khoi: 'Khởi động', chinh: 'Bài chính', tha: 'Thả lỏng' };

  function batDau() {
    const MC = window.MC, HK = window.HK_GROWTH, L = window.TCB_LICH;
    if (!MC || !HK || !HK.ketQuaBe || !document.getElementById('sucKhoe')) return;
    const q = new URLSearchParams(location.search).get('chao');
    if (q === '0') return;
    const homNay = L ? L.homNay() : new Date().toISOString().slice(0, 10);
    if (q !== '1') {
      if (window.top !== window || document.documentElement.classList.contains('is-preview')) return;   // khung xem trước của quản trị
      if (location.hash) return;   // vào từ link "Đo chỉ số" / "Theo dõi sức khỏe": mở thẳng phần đó
      if (MC.store.get(K_NGAY) === homNay) return;
    }
    MC.store.set(K_NGAY, homNay);

    const { esc, rdIcon: ic, Session } = MC;
    const giam = () => (window.RD && window.RD.reduced) || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tenBe = (hs) => (hs && String(hs.name || '').trim() ? 'bé ' + String(hs.name).trim() : 'bé');
    const hoaDau = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const so = (x) => Number(x).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
    const hienNgay = (s) => String(s).split('-').reverse().join('/');
    const IND = { wfa: 'Cân nặng', hfa: 'Chiều cao', bfa: 'BMI' };

    const daLuu = HK.hoSo();
    const BUOC = daLuu ? ['who', 'tap', 'fact'] : ['do', 'who', 'tap', 'fact'];
    let i = 0, kq = null, choKq = !daLuu, truocDo = document.activeElement;

    const lop = document.createElement('div');
    lop.className = 'chao';
    lop.setAttribute('role', 'dialog'); lop.setAttribute('aria-modal', 'true'); lop.setAttribute('aria-labelledby', 'chaoTieuDe');
    lop.innerHTML = `<div class="chao__nen" aria-hidden="true"></div>
      <div class="chao__khung">
        <div class="chao__tren"><ol class="chao__cham" aria-label="Các bước"></ol>
          <button type="button" class="chao__sau" data-chao-dong>Để sau, vào trang chủ <span aria-hidden="true">✕</span></button></div>
        <div class="chao__noi" tabindex="-1"></div>
        <div class="chao__duoi"></div>
      </div>`;
    document.body.appendChild(lop);
    document.documentElement.classList.add('chao-mo');
    const noi = lop.querySelector('.chao__noi'), duoi = lop.querySelector('.chao__duoi'), cham = lop.querySelector('.chao__cham');
    requestAnimationFrame(() => lop.classList.add('is-vao'));

    /* ---------- Từng bước ---------- */
    function veDo() {
      const kids = ['em-be', 'chap-chung-gai', 'be-trai', 'teen-gai'];
      return `<p class="chao__mat">Chào mẹ!</p>
        <h2 id="chaoTieuDe" class="chao__tieu">Bé nhà mình đang lớn thế nào?</h2>
        <p class="chao__phu">Mẹ nhập chiều cao, cân nặng của bé. Hương Chất Kids so ngay với chuẩn WHO và gợi ý cho bé mỗi ngày.</p>
        <div class="chao__kids">${kids.map((k, n) => `<img src="img/rd/kids/${k}.webp" alt="" style="--n:${n}" decoding="async">`).join('')}</div>
        <ul class="chao__ds">
          <li>${ic('ruler', 32)}<span><b>So với chuẩn WHO</b>Chiều cao, cân nặng của bé so với bạn cùng tuổi, cùng giới</span></li>
          <li>${ic('gift', 32)}<span><b>Sản phẩm hợp với bé</b>Chọn theo tuổi và kết quả đo của bé</span></li>
          <li>${ic('muscle', 32)}<span><b>Tập thể dục cùng bé</b>Mỗi ngày vài động tác ngắn theo tuổi, tập trọn bài được cộng điểm</span></li>
          <li>${ic('star-glow', 32)}<span><b>Mỗi ngày một điều về bé</b>Bé tuổi này cần gì, bổ sung qua đâu</span></li>
        </ul>
        <div class="chao__nut-chinh"><span class="hk-hero__main"><button class="btn btn--primary btn--lg" type="button" data-chao-do>${ic('ruler', 28)}Đo sức khỏe cho bé</button>
          <span class="rd-sticker-text hk-hero__free" aria-hidden="true">Miễn phí</span></span></div>
        <p class="chao__ghi">${(MC.I && MC.I.shield) || ''}Số đo chỉ lưu trên máy của mẹ khi mẹ chọn lưu, không gửi đi đâu.</p>`;
    }
    const choKqHtml = () => `<p class="chao__cho"><span class="chao__xoay" aria-hidden="true"></span>Đang xem chỉ số của bé…</p>`;
    function veWho() {
      if (!kq) return choKqHtml();
      const { hs, k } = kq, lan = hs.log[hs.log.length - 1], c = k.chiSo, ten = tenBe(hs);
      const khoi = window.RDSoSanh ? window.RDSoSanh.veKhoi(hs, k, kq.chon, kq.lyDo) : '';
      return `<p class="chao__mat">${daLuu && hs === daLuu ? 'Chào mẹ của ' + esc(ten) + '!' : 'Kết quả của ' + esc(ten)}</p>
        <h2 id="chaoTieuDe" class="chao__tieu">${esc(hoaDau(ten))} so với chuẩn WHO</h2>
        <p class="chao__phu">Lần đo ngày ${hienNgay(lan.d)}: <b>${so(lan.h)} cm</b>, <b>${so(lan.w)} kg</b>.</p>
        <div class="hk-pills">${['wfa', 'hfa', 'bfa'].filter((x) => c[x]).map((x) => `<span class="hk-pill hk-tone--${c[x].tone}">${IND[x]}: ${esc(c[x].label)}</span>`).join('')}</div>
        ${daLuu ? '<button type="button" class="chao__do-lai" data-chao-do>' + ic('ruler', 22) + 'Đo lần mới</button>' : ''}
        ${khoi}`;
    }
    function veTap() {
      if (!kq) return choKqHtml();
      const { hs, k } = kq, ten = tenBe(hs), s = Session && Session.get();
      const ds = L ? L.baiNgay(k.giaiDoan, L.homNay()) : [];
      const giay = ds.reduce((t, b) => t + (b.giay || 40), 0) + Math.max(0, ds.length - 1) * (L ? L.cauHinh().nghiGiay : 10);
      const tk = s
        ? `<div class="chao__tk chao__tk--co">${ic('fire', 28)}<p><b>Đang giữ chuỗi tập cùng bé</b>Mẹ đã đăng nhập${s.kh && s.kh.ten ? ' (' + esc(s.kh.ten) + ')' : ''}. Tập trọn bài mỗi ngày là điểm tự cộng vào ví và chuỗi lửa dài thêm.</p></div>`
        : `<div class="chao__tk">${ic('fire', 28)}<p><b>Giữ chuỗi ngày tập, nhận điểm thưởng</b>Mẹ đăng nhập hoặc đăng ký tài khoản để mỗi ngày tập xong được cộng điểm vào ví và nhận voucher khi tập đều.</p>
            <span class="chao__tk-nut"><button type="button" class="btn btn--outline btn--sm" data-chao-login>Đăng nhập</button><a class="btn btn--teal btn--sm" href="account.html#dang-ky">Đăng ký tài khoản</a></span></div>`;
      return `<p class="chao__mat">Mỗi ngày một chút</p>
        <h2 id="chaoTieuDe" class="chao__tieu">Tập thể dục cùng ${esc(ten)}</h2>
        <p class="chao__phu">${ds.length} động tác hôm nay, khoảng ${Math.max(1, Math.round(giay / 60))} phút, theo tuổi của bé. Có hình động, đồng hồ đếm và hướng dẫn từng bước.</p>
        <div class="hk-vd__ds">${ds.map((b) => `<div class="hk-vd__o"><span class="hk-vd__ic" aria-hidden="true">${ic(b.icon || 'star', 32)}</span>
          <div><b>${esc(b.ten)}</b><p>${LOAI[b.loai] || ''} · ${b.giay} giây</p></div></div>`).join('')}</div>
        ${tk}
        <a class="btn btn--primary btn--block chao__tap" href="tap-cung-be.html?tuoi=${encodeURIComponent(k.giaiDoan)}&amp;gioi=${Number(hs.sex) === 1 ? 'trai' : 'gai'}">${ic('muscle', 24)}Tập cùng ${esc(ten)} ngay</a>`;
    }
    function veFact() {
      if (!kq) return choKqHtml();
      const r = window.RD_FACT ? window.RD_FACT.homNay(kq.k.giaiDoan, kq.hs) : null;
      if (!r) return `<h2 id="chaoTieuDe" class="chao__tieu">Mỗi ngày một điều về bé</h2><p class="chao__phu">Mẹ xem thêm ở trang chủ nhé.</p>`;
      const { f, d } = r, nd = new Date(), hom = String(nd.getDate()).padStart(2, '0') + '/' + String(nd.getMonth() + 1).padStart(2, '0');
      return `<p class="chao__mat">Bạn có biết?</p>
        <h2 id="chaoTieuDe" class="chao__tieu">Mỗi ngày một điều về bé</h2>
        <div class="yh-fact chao__fact">
          <img class="yh-fact__doodle rd-doodle" src="img/rd/doodles/ngoi-sao-wow.svg" alt="" width="56" height="56">
          <div class="yh-fact__body">
            <p class="yh-fact__chips"><span class="yh-fact__chip yh-fact__chip--day">${ic('star-glow', 18)}Hôm nay · ${hom}</span><span class="yh-fact__chip">${r.icon}${esc(f.ten)}</span>${kq.hs.name ? `<span class="yh-fact__chip yh-fact__chip--be">Cho ${esc(tenBe(kq.hs))}</span>` : ''}</p>
            <p class="yh-fact__txt">${r.cau}</p>
            ${f.viSao ? `<p class="yh-fact__why">${esc(f.viSao)}.</p>` : ''}
            ${f.nguon ? `<p class="yh-fact__nguon"><b>Mẹ có thể bổ sung qua:</b> ${esc(f.nguon)}.</p>` : ''}
          </div>
        </div>
        ${r.sp.length ? `<h3 class="chao__h3">${ic(d.ic, 28)}Món hỗ trợ ${esc(d.ten.toLowerCase())}${r.theoTuoi ? ' hợp tuổi ' + esc(tenBe(kq.hs)) : ''}</h3>
          <p class="chao__ghi">${esc(d.note)}</p>
          <div class="chao__sp">${r.spHtml}</div>` : ''}
        <p class="chao__ghi">Lượng khuyến nghị mỗi ngày theo IOM (NIH), DHA theo EFSA. Sản phẩm theo thông tin nhà sản xuất, không thay thế bữa ăn đa dạng.</p>`;
    }
    const VE = { do: veDo, who: veWho, tap: veTap, fact: veFact };

    function ve(huong) {
      const b = BUOC[i], cuoi = i === BUOC.length - 1;
      cham.innerHTML = BUOC.map((_, n) => `<li class="${n < i ? 'is-da' : n === i ? 'is-nay' : ''}"></li>`).join('');
      noi.innerHTML = `<div class="chao__buoc chao__buoc--${b}${huong && !giam() ? ' is-' + huong : ''}">${VE[b]()}</div>`;
      noi.scrollTop = 0;
      duoi.innerHTML = b === 'do' ? '' : `${i > 0 && BUOC[i - 1] !== 'do' ? '<button type="button" class="btn btn--outline" data-chao-lui>Quay lại</button>' : '<span></span>'}
        ${cuoi ? '<button type="button" class="btn btn--primary btn--lg" data-chao-dong>Vào trang chủ</button>'
          : `<button type="button" class="btn btn--primary btn--lg" data-chao-tiep${kq ? '' : ' disabled'}>Tiếp theo</button>`}`;
      const khoi = noi.querySelector('.rd-ss');
      if (khoi && window.RDSoSanh && window.RDSoSanh.dien) setTimeout(() => window.RDSoSanh.dien(khoi), giam() ? 0 : 250);
      noi.focus({ preventScroll: true });
    }
    function dong() {
      lop.classList.remove('is-vao'); lop.classList.add('is-ra');
      document.removeEventListener('hk:ketqua', nhanKq);
      document.removeEventListener('keydown', phim);
      setTimeout(() => { lop.remove(); document.documentElement.classList.remove('chao-mo'); }, giam() ? 0 : 260);
      if (truocDo && truocDo.focus) truocDo.focus({ preventScroll: true });
    }
    /* Mẹ đo xong ở form của suc-khoe.js → nhận đúng kết quả công cụ vừa tính */
    function nhanKq(e) {
      if (!choKq || !e.detail || !e.detail.k) return;
      choKq = false; kq = e.detail;
      i = BUOC.indexOf('who'); ve('tiep');
    }
    function phim(e) {
      if (e.key !== 'Escape' || document.querySelector('.modal.is-open')) return;   // Esc đang ở form đo / đăng nhập thì để form tự đóng
      dong();
    }
    document.addEventListener('hk:ketqua', nhanKq);
    document.addEventListener('keydown', phim);
    lop.addEventListener('click', (e) => {
      if (e.target.closest('[data-chao-dong]')) { dong(); return; }
      if (e.target.closest('[data-chao-do]')) { choKq = true; HK.moFormDo(); return; }
      if (e.target.closest('[data-chao-login]')) {
        MC.openLogin({ title: 'Đăng nhập để tập cùng bé nhận điểm' }).then((s) => { if (s && BUOC[i] === 'tap') ve(); });
        return;
      }
      if (e.target.closest('[data-chao-tiep]') && i < BUOC.length - 1) { i++; ve('tiep'); return; }
      if (e.target.closest('[data-chao-lui]') && i > 0) { i--; ve('lui'); return; }
      if (e.target.closest('.chao__noi a[href]')) dong();   // sang trang khác (tập cùng bé, tạo tài khoản, xem sản phẩm)
    });

    ve();
    if (daLuu) HK.ketQuaBe(daLuu).then((r) => { if (!choKq && !kq) { kq = r; ve(); } }, () => {
      const o = noi.querySelector('.chao__cho'); if (o) o.textContent = 'Chưa tải được bảng chuẩn WHO, mẹ kiểm tra mạng rồi thử lại nhé.';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', batDau, { once: true });
  else batDau();
})();
