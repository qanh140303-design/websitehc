/* Lịch vận động cùng bé – dùng chung cho tap-cung-be.html và phần kết quả "Đo chỉ số cho bé" (js/tap-o-do.js).
   Mỗi ngày: VAN_DONG.soKhoi bài khởi động + soChinh bài chính + soTha bài thả lỏng trong BAI_TAP (js/data.js) theo nhóm tuổi,
   xáo theo tuần (hạt giống = thứ Hai của tuần + nhóm tuổi + loại bài) → cả tuần mỗi ngày một bộ, mọi máy thấy cùng lịch. */
(function () {
  'use strict';
  var homNay = function () { return new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10); };
  var congNgay = function (ngay, n) { return new Date(Date.parse(ngay + 'T12:00:00+07:00') + n * 864e5 + 7 * 36e5).toISOString().slice(0, 10); };
  var thuTrongTuan = function (ngay) { return (new Date(ngay + 'T12:00:00+07:00').getUTCDay() + 6) % 7; };   // 0 = thứ Hai
  function hat(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function ngauNhien(seed) { return function () { seed = (seed + 0x6D2B79F5) >>> 0; var t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function xao(ds, seed) { var a = ds.slice(), r = ngauNhien(seed); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var cauHinh = function () { var c = window.VAN_DONG || {}; return { soKhoi: c.soKhoi || 1, soChinh: c.soChinh || 2, soTha: c.soTha || 1, nghiGiay: c.nghiGiay || 10 }; };
  var theoTuoi = function (k) { return (window.BAI_TAP || []).filter(function (b) { return (b.ages || []).indexOf(k) > -1; }); };
  function baiNgay(k, ngay) {
    var c = cauHinh(), thu = thuTrongTuan(ngay), tuan = congNgay(ngay, -thu), ds = theoTuoi(k), out = [];
    [['khoi', c.soKhoi], ['chinh', c.soChinh], ['tha', c.soTha]].forEach(function (x) {
      var nhom = xao(ds.filter(function (b) { return b.loai === x[0]; }), hat(tuan + ':' + k + ':' + x[0]));
      for (var i = 0; i < Math.min(x[1], nhom.length); i++) out.push(nhom[(thu * x[1] + i) % nhom.length]);
    });
    return out.length ? out : ds.slice(0, 4);
  }
  /* Nhân vật hình động theo nhóm tuổi (giống các bé 3D trong img/rd/kids) */
  var dangTuoi = function (k) { return k === '0-6m' || k === '6-12m' ? 'emBe' : k === '1-3y' ? 'chap' : k === '12-18y' ? 'teen' : 'be'; };
  window.TCB_LICH = { homNay: homNay, congNgay: congNgay, thuTrongTuan: thuTrongTuan, cauHinh: cauHinh, theoTuoi: theoTuoi, baiNgay: baiNgay, dangTuoi: dangTuoi };
})();
