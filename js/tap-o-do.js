/* "Bài tập hôm nay cho bé" trong kết quả Đo chỉ số cho bé (index.html, js/suc-khoe.js).
   suc-khoe.js vẽ xong kết quả thì báo sự kiện 'hk:ketqua' { hs, k } → chèn 1 khối .hk-block ngay sau khối "Vận động cho bé",
   dựng bằng đúng mẫu có sẵn của khối vận động (hk-vd__ds / hk-vd__o + sticker 3D) để đồng bộ giao diện.
   Nghe ở pha capture để chạy TRƯỚC js/rd-so-sanh.js → khối được gom vào danh sách mục gập mở như các khối khác.
   Bấm "Tập cùng bé" mở tap-cung-be.html đúng độ tuổi. Không đổi cách tính của suc-khoe.js.
   Thêm: thẻ "Vận động hôm nay của bé …" trong hero trang chủ khi mẹ đã lưu bé (ganHero), chưa lưu bé thì thẻ giới thiệu "Vận động cùng bé mỗi ngày" (ganHeroMoi). */
(function () {
  'use strict';
  var LOAI = { khoi: 'Khởi động', chinh: 'Bài chính', tha: 'Thả lỏng' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  document.addEventListener('hk:ketqua', function (e) {
    var L = window.TCB_LICH, MC = window.MC, d = e.detail || {}, hs = d.hs || {}, k = d.k || {};
    var kq = document.getElementById('hkResult');
    if (!L || !MC || !kq || !k.giaiDoan) return;
    var ds = L.baiNgay(k.giaiDoan, L.homNay());
    if (!ds.length) return;
    var cu = kq.querySelector('.hk-tap'); if (cu) cu.remove();
    var ten = String(hs.name || '').trim() || 'bé', link = 'tap-cung-be.html?tuoi=' + encodeURIComponent(k.giaiDoan) + '&gioi=' + (Number(hs.sex) === 1 ? 'trai' : 'gai');
    var giay = ds.reduce(function (t, b) { return t + (b.giay || 40); }, 0) + (ds.length - 1) * L.cauHinh().nghiGiay;
    var o = document.createElement('div');
    o.className = 'hk-block hk-tap';
    o.innerHTML = '<div class="hk-block__head"><h3>' + MC.rdIcon('muscle', 32) + 'Bài tập hôm nay cho ' + esc(ten) + '</h3>' +
      '<p>' + ds.length + ' động tác, khoảng ' + Math.max(1, Math.round(giay / 60)) + ' phút, mỗi ngày một bộ mới theo tuổi của bé</p></div>' +
      '<div class="hk-vd__ds">' + ds.map(function (b) {
        return '<div class="hk-vd__o"><span class="hk-vd__ic" aria-hidden="true">' + MC.rdIcon(b.icon || 'star', 32) + '</span>' +
          '<div><b>' + esc(b.ten) + '</b><p>' + (LOAI[b.loai] || '') + ' · ' + b.giay + ' giây. ' + esc((b.buoc || [])[0] || '') + '</p></div></div>';
      }).join('') + '</div>' +
      '<p class="hk-vd__luu">Màn tập có hình động, đồng hồ đếm và hướng dẫn từng bước. Luôn có người lớn bên cạnh khi bé tập.</p>' +
      '<p><a class="btn btn--primary" href="' + link + '">Tập cùng ' + esc(ten) + ' ngay</a></p>' +
      '<a class="link hk-all" href="' + link + '#lich">Xem lịch tập cả tuần ' + ((MC.I && MC.I.arrowR) || '') + '</a>';
    var sau = kq.querySelector(':scope > .hk-vd') || kq.querySelector(':scope > .hk-an') || kq.querySelector(':scope > .hk-nutri');
    if (sau) sau.after(o); else kq.appendChild(o);
  }, true);

  /* Hero "Chào mẹ của bé …" (bé ĐÃ LƯU, không phải tra cứu tạm): thêm 1 thẻ "Vận động hôm nay" dưới các nút,
     dựng bằng mẫu thẻ có sẵn hk-vd__o. suc-khoe.js vẽ lại hero bất cứ lúc nào → theo dõi #hkCard để gắn lại. */
  var giaiDoan = function (m) { return m < 6 ? '0-6m' : m < 12 ? '6-12m' : m < 36 ? '1-3y' : m < 72 ? '3-6y' : m < 144 ? '6-12y' : '12-18y'; };
  function thangTuoi(dob) {
    var p = String(dob).split('-').map(Number), a = new Date(p[0], (p[1] || 1) - 1, p[2] || 1), b = new Date();
    var m = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth(); if (b.getDate() < a.getDate()) m--;
    return Math.max(0, m);
  }
  function ganHero() {
    var L = window.TCB_LICH, MC = window.MC, the = document.getElementById('hkCard');
    if (!L || !MC || !the) return;
    if (the.querySelector('.hk-tap-hero') || the.querySelector('.hk-tam')) return;   // .hk-tam = kết quả tra cứu chưa lưu
    var cta = the.querySelector('.hk-hero--saved .hk-hero__cta--saved');
    if (!cta) { ganHeroMoi(the, MC); return; }
    var hs = MC.store.get('hck_suckhoe', null);
    if (!hs || !hs.dob) return;
    var m = thangTuoi(hs.dob); if (m >= 228) return;
    var k = giaiDoan(m), ds = L.baiNgay(k, L.homNay()); if (!ds.length) return;
    var ten = String(hs.name || '').trim() || 'bé', giay = ds.reduce(function (t, b) { return t + (b.giay || 40); }, 0) + (ds.length - 1) * L.cauHinh().nghiGiay;
    var a = document.createElement('a');
    a.className = 'hk-vd__o hk-tap-hero';
    a.href = 'tap-cung-be.html?tuoi=' + encodeURIComponent(k) + '&gioi=' + (Number(hs.sex) === 1 ? 'trai' : 'gai');
    a.style.cssText = 'grid-column:1/-1;flex:1 1 100%;order:5;color:inherit;text-decoration:none';   // nằm trong cụm nút, dòng riêng, sau các nút
    a.innerHTML = '<span class="hk-vd__ic" aria-hidden="true">' + MC.rdIcon('muscle', 32) + '</span>' +
      '<div><b>Vận động hôm nay của ' + esc(ten.toLowerCase() === 'bé' ? 'bé' : 'bé ' + ten) + '</b>' +
      '<p>' + ds.length + ' bài, khoảng ' + Math.max(1, Math.round(giay / 60)) + ' phút: ' + esc(ds.map(function (b) { return b.ten; }).join(', ')) + '. Bấm để tập cùng bé.</p></div>';
    cta.insertBefore(a, cta.lastElementChild);   // giữ nút cũ là phần tử cuối (CSS của hero dựa vào :last-child); order:5 đưa thẻ xuống dưới các nút
  }
  /* Hero khi CHƯA lưu bé ("Lớn lên cùng bé"): cùng mẫu thẻ, giới thiệu tính năng, mở trang tập (chọn tuổi ở đó) */
  function ganHeroMoi(the, MC) {
    var cta = the.querySelector('.hk-hero .hk-hero__cta');
    if (!cta || cta.classList.contains('hk-hero__cta--saved')) return;
    var a = document.createElement('a');
    a.className = 'hk-vd__o hk-tap-hero';
    a.href = 'tap-cung-be.html';
    a.style.cssText = 'flex:1 1 100%;color:inherit;text-decoration:none';   // dòng riêng dưới nút "Đo chỉ số cho bé"
    a.innerHTML = '<span class="hk-vd__ic" aria-hidden="true">' + MC.rdIcon('muscle', 32) + '</span>' +
      '<div><b>Vận động cùng bé mỗi ngày</b><p>Vài động tác ngắn theo tuổi của bé, có hình động và đồng hồ đếm. Tập trọn bài mỗi ngày được cộng điểm thưởng. Bấm để tập cùng bé.</p></div>';
    cta.appendChild(a);
  }
  document.addEventListener('DOMContentLoaded', function () {
    var the = document.getElementById('hkCard');
    if (!the) return;
    ganHero();
    if ('MutationObserver' in window) new MutationObserver(ganHero).observe(the, { childList: true, subtree: true });
  });
})();
