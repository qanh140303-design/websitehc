/* Vận động cùng bé (tap-cung-be.html)
   - Lịch cả tuần: mỗi ngày 1 bài khởi động + 2 bài chính + 1 bài thả lỏng (VAN_DONG, BAI_TAP trong js/data.js) theo nhóm tuổi,
     xếp lại mỗi tuần, cố định trong tuần (giờ Việt Nam) → cả nhà, mọi máy thấy cùng lịch.
   - Hình động: js/tap-hinh.js (nhân vật SVG có khớp, đúng từng động tác).
   - Màn tập toàn màn hình: đếm ngược, bíp 3-2-1, nghỉ giữa bài, giữ màn hình sáng.
   - Tập xong bài HÔM NAY → MC.VD.hoanThanh (máy chủ cộng điểm 1 lần / ngày). Chưa đăng nhập: giữ tạm trên máy, đăng nhập trong ngày thì nhận.
   - Bài của ngày khác và "Tập thêm" chỉ để tập, không cộng điểm.
   - ?xem=dong-tac: xem tất cả hình động (để shop duyệt). */
document.addEventListener('DOMContentLoaded', () => {
  const { $, esc, toast, store, Session, openLogin, VD, rdIcon, rdAgeIcon, productThumb, shortName, spUrl, hetHang } = MC;
  const goc = $('#tcb'); if (!goc) return;
  const DS = window.BAI_TAP || [], L = window.TCB_LICH, CFG = L.cauHinh();
  const AGES = window.AGES || [], HINH = window.TCB_HINH;
  const K_TUOI = 'mc_vd_tuoi', K_CHO = 'mc_vd_cho', K_TIENG = 'mc_vd_tieng', K_GIOI = 'mc_vd_gioi';
  const { homNay, congNgay, thuTrongTuan, theoTuoi, baiNgay, dangTuoi } = L;   // lịch tuần: js/tap-lich.js
  const TEN_THU = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const LOAI = { khoi: 'Khởi động', chinh: 'Bài chính', tha: 'Thả lỏng' };
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Độ tuổi: tài khoản → công cụ đo chỉ số → mẹ chọn ---------- */
  function thangTuoi(dob) {
    const p = String(dob).split('-').map(Number); if (!p[0]) return -1;
    const a = new Date(p[0], (p[1] || 1) - 1, p[2] || 1), b = new Date();
    let m = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
    if (b.getDate() < a.getDate()) m--;
    return Math.max(0, m);
  }
  const giaiDoan = (m) => (m < 6 ? '0-6m' : m < 12 ? '6-12m' : m < 36 ? '1-3y' : m < 72 ? '3-6y' : m < 144 ? '6-12y' : '12-18y');
  const hoSoDo = () => { const d = store.get('hck_suckhoe', null); return d && d.dob ? d : null; };
  function tuoiTuDong() {
    const kh = Session.kh() || {}, hs = hoSoDo();
    const dob = kh.ngaySinhBe || (hs && hs.dob) || '';
    const m = dob ? thangTuoi(dob) : -1;
    return m >= 0 && m < 216 ? giaiDoan(m) : '';
  }
  const tenBe = () => String((Session.kh() || {}).tenBe || (hoSoDo() || {}).name || '').trim();
  /* Bé trai / bé gái: link từ kết quả đo, popup (?gioi=, kể cả tra cứu chưa lưu) → bé đã lưu → mẹ chọn lần trước → bé gái */
  const qGioi = new URLSearchParams(location.search).get('gioi');
  const GIOI_OK = (g) => g === 'trai' || g === 'gai';
  if (GIOI_OK(qGioi)) store.set(K_GIOI, qGioi);
  let gioi = GIOI_OK(qGioi) ? qGioi : hoSoDo() ? (Number(hoSoDo().sex) === 1 ? 'trai' : 'gai') : (GIOI_OK(store.get(K_GIOI, '')) ? store.get(K_GIOI, '') : 'gai');
  const laGai = () => gioi !== 'trai';
  const qTuoi = new URLSearchParams(location.search).get('tuoi');   // từ kết quả Đo chỉ số (js/tap-o-do.js)
  if (qTuoi && AGES.some((a) => a.key === qTuoi)) store.set(K_TUOI, qTuoi);
  let nhom = store.get(K_TUOI, '') || tuoiTuDong();
  if (!AGES.some((a) => a.key === nhom)) nhom = '';

  /* Ảnh nhân vật ở đầu trang và màn hoàn thành (img/rd/kids) */
  function nhanVat(k) {
    const g = laGai() ? 'gai' : 'trai';
    if (k === '0-6m' || k === '6-12m') return 'img/rd/kids/em-be.webp';
    if (k === '1-3y') return `img/rd/kids/chap-chung-${g}.webp`;
    if (k === '12-18y') return `img/rd/kids/teen-${g}.webp`;
    return `img/rd/kids/be-${g}.webp`;
  }
  const oHinh = (b, cls = '') => `<span class="tcb-hinh${cls ? ' ' + cls : ''}" data-hinh="${esc(b.dong)}" data-bai="${esc(b.id)}" role="img" aria-label="Hình động tác ${esc(b.ten)}"></span>`;
  function veHinh(root, chay) {
    if (!HINH) return;
    root.querySelectorAll('[data-hinh]').forEach((el) => { if (!el.__xong) { el.__xong = 1; HINH.tao(el, el.dataset.hinh, { bai: el.dataset.bai, tuoi: dangTuoi(nhom), gai: laGai(), chay: !!chay }); } });
  }

  const tongGiay = (ds) => ds.reduce((t, b) => t + (b.giay || 40), 0) + Math.max(0, ds.length - 1) * CFG.nghiGiay;
  const phut = (s) => Math.max(1, Math.round(s / 60));
  const tien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const so = (n) => Number(n || 0).toLocaleString('vi-VN');

  /* ---------- Dữ liệu máy chủ ---------- */
  let cfg = { bat: false }, tq = null;
  function taiTongQuan() {
    if (!Session.get()) { tq = null; ve(); return; }
    const cu = VD.tongQuanCu(); if (cu) { tq = cu; ve(); }
    VD.tongQuan().then((r) => {
      if (r && r.loi === 'token') { Session.clear(); tq = null; ve(); return; }
      if (r && r.ok) { tq = r; cfg = { ...cfg, ...r.cauHinh }; ve(); }
    }).catch(() => {});
  }

  /* ---------- Màn chính ---------- */
  function chipTuoi() {
    const emBe = nhom === '0-6m' || nhom === '6-12m';   // em bé dùng chung một hình, không cần chọn
    return `<div class="tcb-tuoi" role="group" aria-label="Chọn độ tuổi của bé">${AGES.map((a) => `<button type="button" class="tcb-tuoi__chip${a.key === nhom ? ' is-on' : ''}" data-tcb-tuoi="${a.key}" aria-pressed="${a.key === nhom}">${rdAgeIcon(a.key, 22) || a.emoji}<span>${esc(a.label)}</span></button>`).join('')}</div>
      ${emBe ? '' : `<div class="tcb-tuoi tcb-gioi" role="group" aria-label="Bé trai hay bé gái">${[['trai', 'boy', 'Bé trai'], ['gai', 'girl', 'Bé gái']].map(([g, ic, ten]) => `<button type="button" class="tcb-tuoi__chip${gioi === g ? ' is-on' : ''}" data-tcb-gioi="${g}" aria-pressed="${gioi === g}">${rdIcon(ic, 22)}<span>${ten}</span></button>`).join('')}</div>`}`;
  }
  function tuanNay() {
    const da = new Set((tq && tq.ngayTap) || []), hn = homNay(), out = [];
    for (let i = 6; i >= 0; i--) {
      const k = congNgay(hn, -i), thu = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(k + 'T12:00:00+07:00').getUTCDay()];
      out.push(`<li class="${da.has(k) ? 'is-da' : ''}${k === hn ? ' is-nay' : ''}"><span>${da.has(k) ? '✓' : ''}</span><small>${k === hn ? 'Nay' : thu}</small></li>`);
    }
    return `<ol class="tcb-tuan" aria-label="7 ngày gần nhất">${out.join('')}</ol>`;
  }
  function theChuoi() {
    if (!Session.get()) {
      return `<div class="tcb-chuoi tcb-chuoi--khach"><div>${rdIcon('fire', 40)}</div><div><b>Giữ chuỗi ngày, nhận điểm thưởng</b>
        <p>Đăng nhập hoặc đăng ký tài khoản để mỗi ngày tập xong được cộng ${cfg.diemNgay ? '<b>' + so(cfg.diemNgay) + ' điểm</b>' : 'điểm'} và nhận voucher khi tập đều.</p>
        <span class="tcb-chuoi__nut"><button type="button" class="btn btn--outline btn--sm" data-tcb-login>Đăng nhập</button><a class="btn btn--teal btn--sm" href="account.html#dang-ky">Đăng ký tài khoản</a></span></div></div>`;
    }
    const c = (tq && tq.chuoi) || 0, moc = ((tq && tq.moc) || (cfg.moc || []).map((m) => ({ ...m, conLai: m.moc - c }))).find((m) => !m.daNhan && m.conLai > 0);
    return `<div class="tcb-chuoi"><div class="tcb-chuoi__so">${rdIcon('fire', 40)}<b>${c}</b><small>ngày liên tiếp</small></div>
      <div class="tcb-chuoi__ben">${tuanNay()}
      ${moc ? `<p class="tcb-chuoi__moc">Tập thêm <b>${moc.conLai} ngày</b> nữa để nhận voucher <b>${tien(moc.giaTri)}</b></p>` : c ? '<p class="tcb-chuoi__moc">Mẹ và bé đã nhận hết voucher chuỗi tháng này, giỏi quá!</p>' : ''}</div></div>`;
  }
  /* Nhắc đo chỉ số: chưa có số đo, hoặc lần đo gần nhất đã quá 30 ngày → mở form Đo chỉ số ở trang chủ (index.html#do-chi-so) */
  function theDo() {
    const hs = hoSoDo(), lan = hs && Array.isArray(hs.log) && hs.log.length ? hs.log[hs.log.length - 1] : null;
    const ngay = lan ? Math.floor((Date.parse(homNay()) - Date.parse(lan.d)) / 864e5) : null;
    if (ngay != null && ngay <= 30) return '';
    const ten = tenBe();
    return `<div class="tcb-chuoi tcb-chuoi--khach tcb-do"><div>${rdIcon('ruler', 40)}</div><div>
      <b>${lan ? `Đã ${ngay} ngày từ lần đo trước của ${ten ? 'bé ' + esc(ten) : 'bé'}` : 'Đo chiều cao, cân nặng cho bé'}</b>
      <p>${lan ? 'Mẹ đo lại để theo dõi bé lớn lên thế nào so với chuẩn WHO.' : 'So với chuẩn WHO, xem bé cần ăn gì, vận động ra sao. Miễn phí, số đo chỉ lưu trên máy của mẹ.'}</p>
      <a class="btn btn--outline btn--sm" href="index.html#do-chi-so">${lan ? 'Đo lần mới' : 'Đo chỉ số cho bé'}</a></div></div>`;
  }
  function chiTiet(b) {
    return `<ol class="tcb-buoc">${(b.buoc || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      ${b.loiIch ? `<p class="tcb-loi-ich"><b>Lợi ích:</b> ${esc(b.loiIch)}</p>` : ''}
      ${b.luuY ? `<p class="tcb-luu-y tcb-luu-y--nho">${rdIcon('shield', 18)} ${esc(b.luuY)}</p>` : ''}`;
  }
  /* Một dòng gọn như bản đầu; bấm vào mới hiện cách tập */
  function dongBai(b, i) {
    return `<li><details class="tcb-bai"><summary><span class="tcb-bai__so">${i + 1}</span>${rdIcon(b.icon || 'star', 40)}
      <div><b>${esc(b.ten)}</b><small>${LOAI[b.loai] ? LOAI[b.loai] + ' · ' : ''}${b.giay} giây${b.lan ? ' · khoảng ' + b.lan + ' lần' : ''}${b.boMe ? ' · bố mẹ tập cho bé' : ''}</small></div>
      <span class="tcb-bai__mo" aria-hidden="true"></span></summary>
      <div class="tcb-bai__ct">${chiTiet(b)}</div></details></li>`;
  }
  function lichTuan() {
    const hn = homNay(), thuNay = thuTrongTuan(hn), dau = congNgay(hn, -thuNay);
    return `<details class="tcb-lich" id="lich"${location.hash === '#lich' ? ' open' : ''}><summary><h2>Lịch tập cả tuần</h2><span class="tcb-lich__mo" aria-hidden="true"></span></summary>
      <p>Mỗi ngày một bộ khác nhau, xếp lại vào thứ Hai hằng tuần. Chỉ bài của hôm nay được tính điểm.</p>
      <ol class="tcb-lich__ds">${TEN_THU.map((t, i) => {
        const ngay = congNgay(dau, i), ds = baiNgay(nhom, ngay), la = ngay === hn;
        return `<li class="tcb-lich__ngay${la ? ' is-nay' : ''}${ngay < hn ? ' is-qua' : ''}"><div class="tcb-lich__thu"><b>${t}</b><small>${ngay.slice(8, 10)}/${ngay.slice(5, 7)}</small></div>
          <div class="tcb-lich__bai">${ds.map((b) => `<span>${esc(b.ten)}</span>`).join('')}</div>
          ${la ? '<span class="badge badge--hot">Hôm nay</span>' : `<button type="button" class="btn btn--outline btn--sm" data-tcb-ngay="${ngay}">Tập thử</button>`}</li>`;
      }).join('')}</ol></details>`;
  }
  function ve() {
    if (!nhom) {
      goc.innerHTML = `<section class="tcb-dau"><div class="tcb-dau__txt"><p class="tcb-kicker">Vận động cùng bé mỗi ngày</p>
        <h1>Mỗi ngày vài phút vận động cùng con</h1><p>Mẹ chọn độ tuổi của bé, Hương xếp lịch tập vừa sức cho cả tuần nhé.</p>${chipTuoi()}</div>
        <img class="tcb-dau__be" src="img/rd/kids/be-gai.webp" alt="" width="220" height="220"></section>`;
      return;
    }
    const ds = baiNgay(nhom, homNay()), daTap = !!(tq && tq.daTapHomNay), dangDung = new Set(ds);
    const them = theoTuoi(nhom).filter((b) => !dangDung.has(b)), ten = tenBe();
    goc.innerHTML = `
      <section class="tcb-dau"><div class="tcb-dau__txt"><p class="tcb-kicker">Vận động cùng bé mỗi ngày</p>
        <h1>${ten ? 'Chào bé ' + esc(ten) + '!' : 'Chào mẹ và bé!'} Hôm nay mình cùng vận động nhé</h1>${chipTuoi()}</div>
        <img class="tcb-dau__be tcb-dt--thang" src="${nhanVat(nhom)}" alt="" width="220" height="220"></section>
      ${theChuoi()}
      <section class="tcb-nay card">
        <div class="tcb-nay__dau"><div><h2>Bài hôm nay · ${TEN_THU[thuTrongTuan(homNay())]}</h2><p>${ds.length} động tác · khoảng ${phut(tongGiay(ds))} phút${cfg.diemNgay ? ` · <b>+${so(cfg.diemNgay)} điểm</b>` : ''}</p></div>
          ${daTap ? '<span class="badge badge--teal">Đã tập hôm nay ✓</span>' : ''}</div>
        <ol class="tcb-ds">${ds.map(dongBai).join('')}</ol>
        <button type="button" class="btn btn--primary btn--lg btn--block tcb-batdau" data-tcb-batdau>${daTap ? 'Tập lại bài hôm nay' : 'Bắt đầu tập'}</button>
        ${ds.some((b) => b.boMe) ? '<p class="tcb-nho">Bé còn nhỏ nên bố mẹ tập cho bé, nhẹ nhàng và luôn ở cạnh bé.</p>' : ''}
      </section>
      ${theDo()}
      ${them.length ? `<section class="tcb-them"><h2>Tập thêm cho vui</h2><p>Không tính điểm, chơi bao nhiêu cũng được.</p>
        <div class="tcb-them__ds">${them.map((b) => `<button type="button" class="tcb-the" data-tcb-mot="${esc(b.id)}">${rdIcon(b.icon || 'star', 44)}<b>${esc(b.ten)}</b><small>${b.giay} giây</small></button>`).join('')}</div></section>` : ''}
      <p class="tcb-luu-y">${rdIcon('shield', 22)} Tập trên nền phẳng, chỗ thoáng, luôn có người lớn bên cạnh. Bé mệt, đau hoặc không thích thì dừng lại, mai tập tiếp. Bé đang ốm hoặc có bệnh cần theo dõi thì hỏi ý kiến bác sĩ trước khi tập.</p>
      ${lichTuan()}`;
  }

  /* Xem tất cả hình động (để shop duyệt): tap-cung-be.html?xem=dong-tac */
  function veTatCa() {
    goc.innerHTML = `<section class="tcb-xem"><h1>Tất cả động tác (${DS.length})</h1><p>Trang để duyệt hình động, khách không thấy link này.</p>${chipTuoi()}
      <div class="tcb-xem__ds">${DS.filter((b) => !nhom || b.ages.includes(nhom)).map((b) => `<div class="tcb-xem__o">${oHinh(b)}<b>${esc(b.ten)}</b><small>${esc(b.ages.join(', '))} · ${esc(b.dong)}</small></div>`).join('')}</div></section>`;
    veHinh(goc, true);
  }
  const XEM_TAT_CA = new URLSearchParams(location.search).get('xem') === 'dong-tac';

  goc.addEventListener('click', (e) => {
    const gb = e.target.closest('[data-tcb-gioi]');
    if (gb) { gioi = gb.dataset.tcbGioi; store.set(K_GIOI, gioi); (XEM_TAT_CA ? veTatCa : ve)(); return; }
    const t = e.target.closest('[data-tcb-tuoi]');
    if (t) { nhom = t.dataset.tcbTuoi; store.set(K_TUOI, nhom); (XEM_TAT_CA ? veTatCa : ve)(); return; }
    if (e.target.closest('[data-tcb-login]')) { openLogin().then((s) => { if (s) { guiCho(); taiTongQuan(); } }); return; }
    if (e.target.closest('[data-tcb-batdau]')) { moTap(baiNgay(nhom, homNay()), true); return; }
    const n = e.target.closest('[data-tcb-ngay]');
    if (n) { moTap(baiNgay(nhom, n.dataset.tcbNgay), false); return; }
    const m = e.target.closest('[data-tcb-mot]');
    if (m) { const b = DS.find((x) => x.id === m.dataset.tcbMot); if (b) moTap([b], false); }
  });

  /* ---------- Âm thanh + giữ màn hình sáng ---------- */
  let ac = null, tieng = store.get(K_TIENG, 1) !== 0, khoaMH = null;
  function bip(f = 880, ms = 120) {
    if (!tieng) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime;
      o.frequency.value = f; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
      o.start(t0); o.stop(t0 + ms / 1000 + 0.05);
    } catch { /* máy không hỗ trợ âm thanh */ }
  }
  async function giuSang() { try { if ('wakeLock' in navigator && !khoaMH) { khoaMH = await navigator.wakeLock.request('screen'); khoaMH.addEventListener('release', () => { khoaMH = null; }); } } catch { /* trình duyệt từ chối */ } }
  function thaSang() { try { if (khoaMH) khoaMH.release(); } catch { /* bỏ qua */ } khoaMH = null; }

  /* ---------- Màn tập ---------- */
  const VONG = 2 * Math.PI * 54;
  let P = null;   // { ds, laHomNay, i, pha: 'san'|'tap'|'nghi'|'xong', con, tong, dung, giayTap, moc, hen, hinh }
  const lop = document.createElement('div');
  lop.className = 'tcb-lop'; lop.hidden = true;
  lop.setAttribute('role', 'dialog'); lop.setAttribute('aria-modal', 'true'); lop.setAttribute('aria-label', 'Tập cùng bé');
  document.body.appendChild(lop);

  function moTap(ds, laHomNay) {
    if (!ds.length) return;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch { /* không có âm thanh */ }
    P = { ds, laHomNay, i: 0, pha: 'san', con: 3, tong: 3, dung: false, giayTap: 0, moc: performance.now(), hinh: null };
    lop.hidden = false; document.documentElement.classList.add('tcb-khoa');
    giuSang(); veTap(); chay();
  }
  function boHinh() { if (P && P.hinh) { P.hinh.huy(); P.hinh = null; } }
  function dongTap() {
    clearInterval(P && P.hen); boHinh(); P = null; lop.hidden = true; lop.innerHTML = '';
    document.documentElement.classList.remove('tcb-khoa'); thaSang(); ve();
  }
  function chay() { clearInterval(P.hen); P.moc = performance.now(); P.hen = setInterval(nhip, 200); }
  function nhip() {
    if (!P || P.dung) return;
    const now = performance.now(), dt = (now - P.moc) / 1000; P.moc = now;
    const truoc = Math.ceil(P.con);
    P.con -= dt; if (P.pha === 'tap') P.giayTap += dt;
    const sau = Math.ceil(P.con);
    if (sau !== truoc && sau > 0 && sau <= 3) bip(P.pha === 'nghi' || P.pha === 'san' ? 660 : 880);
    if (P.con <= 0) return sangPha();
    capNhatDong();
  }
  function sangPha() {
    if (P.pha === 'san' || P.pha === 'nghi') { P.pha = 'tap'; P.con = P.tong = P.ds[P.i].giay || 40; bip(1175, 260); veTap(); return; }
    if (P.pha === 'tap') {
      if (P.i < P.ds.length - 1) { P.i++; P.pha = 'nghi'; P.con = P.tong = CFG.nghiGiay; bip(523, 300); veTap(); return; }
      clearInterval(P.hen); P.pha = 'xong'; bip(1047, 180); setTimeout(() => bip(1319, 320), 200); veXong();
    }
  }
  function capNhatDong() {
    const s = Math.max(0, Math.ceil(P.con)), vong = lop.querySelector('.tcb-vong__chay'), soO = lop.querySelector('.tcb-vong__so');
    if (soO) soO.textContent = s;
    if (vong) vong.style.strokeDashoffset = String(VONG * (1 - Math.max(0, P.con) / P.tong));
  }
  function chamTienDo() { return `<ol class="tcb-cham" aria-label="Tiến độ">${P.ds.map((b, i) => `<li class="${i < P.i || (i === P.i && P.pha === 'xong') ? 'is-da' : i === P.i ? 'is-nay' : ''}"></li>`).join('')}</ol>`; }
  function vongDem(nhan) {
    return `<div class="tcb-vong" aria-live="off"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="tcb-vong__nen" cx="60" cy="60" r="54"/><circle class="tcb-vong__chay" cx="60" cy="60" r="54" stroke-dasharray="${VONG}" stroke-dashoffset="0"/></svg>
      <div><b class="tcb-vong__so">${Math.ceil(P.con)}</b><small>${nhan}</small></div></div>`;
  }
  function veTap() {
    const b = P.ds[P.i], dauTien = P.pha === 'san';
    boHinh();
    const tren = `<div class="tcb-lop__tren"><button type="button" class="tcb-nut-tron" data-tcb-dong aria-label="Thoát">✕</button>${chamTienDo()}
      <button type="button" class="tcb-nut-tron" data-tcb-tieng aria-label="${tieng ? 'Tắt tiếng' : 'Bật tiếng'}" aria-pressed="${tieng}">${tieng ? '🔊' : '🔇'}</button></div>`;
    if (P.pha === 'san' || P.pha === 'nghi') {
      lop.innerHTML = `<div class="tcb-lop__khung tcb-lop--nghi">${tren}
        <p class="tcb-lop__nhan">${dauTien ? 'Sẵn sàng nào!' : 'Nghỉ một chút, uống ngụm nước nhé'}</p>
        ${vongDem(dauTien ? 'chuẩn bị' : 'giây nghỉ')}
        <div class="tcb-sau"><small>${dauTien ? 'Động tác đầu tiên' : 'Tiếp theo'} · ${LOAI[b.loai] || ''}</small>${rdIcon(b.icon || 'star', 48)}<b>${esc(b.ten)}</b>
          <ol class="tcb-buoc tcb-buoc--gon">${(b.buoc || []).slice(0, 2).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
        <div class="tcb-lop__nut"><button type="button" class="btn btn--primary btn--lg" data-tcb-qua>${dauTien ? 'Bắt đầu luôn' : 'Tập luôn'}</button></div></div>`;
    } else {
      lop.innerHTML = `<div class="tcb-lop__khung">${tren}
        <p class="tcb-lop__nhan">${LOAI[b.loai] || 'Động tác'} · ${P.i + 1}/${P.ds.length}</p>
        <div class="tcb-san" data-hinh-lon role="img" aria-label="Hình động tác ${esc(b.ten)}"></div>
        <h2 class="tcb-lop__ten">${esc(b.ten)}</h2>
        ${b.lan ? `<p class="tcb-lan">Mục tiêu: khoảng <b>${b.lan} lần</b></p>` : ''}
        <div class="tcb-lop__giua">${vongDem('giây')}
          <details class="tcb-lop__ct" open><summary>Cách tập và lợi ích</summary>${chiTiet(b)}</details></div>
        <p class="tcb-lop__ghi">Hết giờ sẽ tự sang ${P.i < P.ds.length - 1 ? 'động tác tiếp theo' : 'phần kết thúc'}. Tập trọn cả bài mới được cộng điểm và giữ chuỗi lửa.</p>
        <div class="tcb-lop__nut"><button type="button" class="btn btn--outline btn--lg" data-tcb-dung>${P.dung ? 'Tập tiếp' : 'Tạm dừng'}</button></div></div>`;
      const san = lop.querySelector('[data-hinh-lon]');
      if (HINH && san) { P.hinh = HINH.tao(san, b.dong, { bai: b.id, tuoi: dangTuoi(nhom), gai: laGai(), chay: !giam }); if (P.dung) P.hinh.dung(); }
    }
    lop.scrollTop = 0; capNhatDong();
  }

  /* ---------- Hoàn thành ---------- */
  function goiY() {
    const ds = (window.PRODUCTS || []).filter((p) => (p.ages || []).includes(nhom) && !p.isCombo && p.cat !== 'cho-me' && !(hetHang && hetHang(p)))
      .sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 3);
    return ds.length ? `<div class="tcb-goi-y"><h3>Tập xong rồi, bổ sung năng lượng cho bé nhé</h3><ul>${ds.map((p) => `<li><a href="${spUrl(p.id)}">
      <img src="${esc(productThumb(p))}" alt="" width="56" height="56" loading="lazy"><span>${esc(shortName(p))}</span><b>Xem</b></a></li>`).join('')}</ul></div>` : '';
  }
  function veXong(kq) {
    boHinh();
    const phutTap = Math.max(1, Math.round(P.giayTap / 60));
    let thuong = '';
    const itQua = P.giayTap < (Number(cfg.giayToiThieu) || 90);
    if (P.laHomNay && itQua) thuong = '<p class="tcb-xong__thuong">Lần này bé tập hơi ít. Mẹ cùng bé tập trọn bài hôm nay để nhận điểm nhé.</p>';
    else if (P.laHomNay) {
      if (!kq) thuong = Session.get() ? '<p class="tcb-xong__thuong"><span class="tcb-spin"></span> Đang cộng điểm…</p>'
        : `<div class="tcb-xong__thuong"><p>Đăng nhập để nhận <b>${cfg.diemNgay ? so(cfg.diemNgay) + ' điểm' : 'điểm thưởng'}</b> cho buổi tập hôm nay.</p><span class="tcb-chuoi__nut"><button type="button" class="btn btn--primary" data-tcb-nhan>Đăng nhập nhận điểm</button><a class="btn btn--outline" href="account.html#dang-ky">Chưa có tài khoản? Đăng ký</a></span></div>`;
      else if (kq.ok && kq.moi) thuong = `<p class="tcb-xong__thuong"><b>+${so(kq.diem)} điểm</b> đã vào ví · chuỗi <b>${kq.chuoi} ngày</b>${(kq.voucher || []).map((v) => `<br>🎟️ Nhận voucher <b>${tien(v.giaTri)}</b> (${esc(v.ten)})`).join('')}</p>`;
      else if (kq.ok) thuong = `<p class="tcb-xong__thuong">Hôm nay mẹ đã nhận điểm rồi, mai cùng bé tập tiếp nhé. Chuỗi hiện tại: <b>${kq.chuoi} ngày</b>.</p>`;
      else thuong = `<div class="tcb-xong__thuong"><p>${esc(kq.msg || 'Chưa ghi nhận được điểm, mẹ thử lại sau ít phút nhé')}</p>${kq.code === 'TOO_SHORT' ? '' : '<button type="button" class="btn btn--outline btn--sm" data-tcb-gui-lai>Thử lại</button>'}</div>`;
    } else thuong = '<p class="tcb-xong__thuong">Bài tập thêm không tính điểm. Bài hôm nay mới được cộng điểm nhé.</p>';
    lop.innerHTML = `<div class="tcb-lop__khung tcb-lop--xong"><div class="tcb-lop__tren"><span></span>${chamTienDo()}<button type="button" class="tcb-nut-tron" data-tcb-dong aria-label="Đóng">✕</button></div>
      <img class="tcb-xong__be${giam ? '' : ' tcb-dt--nhay'}" src="${nhanVat(nhom)}" alt="" width="200" height="200">
      <h2>Giỏi quá! Mẹ và bé đã tập xong</h2><p>${P.ds.length} động tác · khoảng ${phutTap} phút vận động cùng nhau</p>
      <div class="tcb-xong__kq" aria-live="polite">${thuong}</div>
      ${goiY()}
      <div class="tcb-lop__nut"><button type="button" class="btn btn--primary btn--lg" data-tcb-dong>Về trang vận động</button></div></div>`;
    lop.scrollTop = 0;
    if (!P.phao) { P.phao = 1; try { window.RD && window.RD.confetti(lop.querySelector('h2'), { n: 16 }); } catch { /* bỏ qua */ } }
    if (!kq && P.laHomNay && !itQua) {
      store.set(K_CHO, { ngay: homNay(), nhom, soBai: P.ds.length, giay: Math.round(P.giayTap) });
      if (Session.get()) guiCho();
    }
  }
  /* Gửi buổi tập đang chờ (chỉ của hôm nay) lên máy chủ */
  function guiCho() {
    const c = store.get(K_CHO, null);
    if (!c || c.ngay !== homNay()) { store.set(K_CHO, null); return Promise.resolve(null); }
    if (!Session.get()) return Promise.resolve(null);
    return VD.hoanThanh({ nhom: c.nhom, soBai: c.soBai, giay: c.giay }).then((r) => {
      if (r && r.loi === 'token') { Session.clear(); r = { ok: false, msg: 'Phiên đăng nhập đã hết hạn, mẹ đăng nhập lại để nhận điểm nhé' }; }
      if (r && (r.ok || r.code === 'TOO_SHORT')) store.set(K_CHO, null);
      if (P && P.pha === 'xong') veXong(r || { ok: false });
      else if (r && r.ok && r.moi) toast(`🤸 Buổi tập hôm nay: +${so(r.diem)} điểm`, { type: 'ok' });
      if (r && r.ok) taiTongQuan();
      return r;
    }).catch((e) => { if (P && P.pha === 'xong') veXong({ ok: false, msg: e.message }); return null; });
  }

  lop.addEventListener('click', (e) => {
    if (!P) return;
    if (e.target.closest('[data-tcb-dong]')) {
      if (P.pha === 'tap' || P.pha === 'nghi') { if (!confirm('Dừng buổi tập? Bài hôm nay chưa được tính.')) return; }
      dongTap(); return;
    }
    if (e.target.closest('[data-tcb-tieng]')) { tieng = !tieng; store.set(K_TIENG, tieng ? 1 : 0); const nut = e.target.closest('[data-tcb-tieng]'); nut.textContent = tieng ? '🔊' : '🔇'; nut.setAttribute('aria-pressed', tieng); return; }
    if (e.target.closest('[data-tcb-dung]')) {
      P.dung = !P.dung; P.moc = performance.now();
      e.target.closest('[data-tcb-dung]').textContent = P.dung ? 'Tập tiếp' : 'Tạm dừng';
      if (P.hinh) { if (P.dung) P.hinh.dung(); else P.hinh.tiep(); }
      return;
    }
    if (e.target.closest('[data-tcb-qua]') && P.pha !== 'tap') { P.con = 0; sangPha(); return; }   // chỉ bỏ qua đếm chuẩn bị / nghỉ, động tác phải tập hết giờ
    if (e.target.closest('[data-tcb-nhan]')) { openLogin().then((s) => { if (s) { veXong(); taiTongQuan(); } }); return; }
    if (e.target.closest('[data-tcb-gui-lai]')) { veXong(); return; }
  });
  document.addEventListener('keydown', (e) => { if (P && e.key === 'Escape') lop.querySelector('[data-tcb-dong]')?.click(); });
  document.addEventListener('visibilitychange', () => { if (P && document.visibilityState === 'visible' && P.pha !== 'xong') giuSang(); });   // khoá màn hình tự nhả khi ẩn tab → xin lại

  if (XEM_TAT_CA) { veTatCa(); return; }
  VD.cauHinh().then((c) => { cfg = { ...cfg, ...c }; ve(); });
  ve(); taiTongQuan(); guiCho();
});
