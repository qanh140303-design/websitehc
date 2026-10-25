/* Hình động bài tập (tap-cung-be.html): nhân vật vẽ bằng SVG theo đúng các bé 3D của web (img/rd/kids: em bé, chập chững,
   bé trai / bé gái, teen) – có khớp vai, khuỷu, hông, gối + bảng tư thế cho từng động tác.
   API: window.TCB_HINH.tao(phanTu, tenDong, { tuoi: 'emBe'|'chap'|'be'|'teen', gai: true|false, chay: true|false, khung: số }) → { dung(), tiep(), huy() }
   - Góc tay chân tính theo hướng trên màn hình: 0 = chỉ xuống, 90 = sang trái, -90 = sang phải, 180 = lên trên.
   - Thân (T): 0 = đứng thẳng, 90 = nằm ngang đầu bên phải, -90 = nằm ngang đầu bên trái. h = nghiêng đầu so với thân.
   - Tư thế tự chạm đất (điểm thấp nhất nằm trên mặt sàn); bay = nhấc khỏi sàn. tren: true = nhìn từ trên xuống (bé nằm trên thảm).
   - neo: điểm giữ cố định khi đổi tư thế (chan, chanR, chanL, tay, giua) để chân không trượt.
   - Đồ vật (qua): bong, sao (đồ chơi), tayMe (tay mẹ), bongBong. px/py: vị trí (quaGoc 'san' = tính từ giữa sàn, 'hong' = tính từ hông);
     cam: 0 → 1 = đồ vật chuyển dần vào tay phải. nen: đồ vật đứng yên phía sau (ghế, gối).
   - Chỉ chạy khi hình đang hiện trên màn hình; máy bật "giảm chuyển động" thì đứng yên ở tư thế chính (tinh). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', DAT = 196, GIUA_TREN = 118;
  var MAC = { T: 0, h: 0, aR: 20, cR: 12, aL: -20, cL: -12, lR: 3, sR: 3, lL: -3, sL: -3, bay: 0, dx: 0, px: 0, py: 0, cam: 0, day: 0 };
  var rad = function (d) { return d * Math.PI / 180; };
  var huong = function (a) { return [-Math.sin(rad(a)), Math.cos(rad(a))]; };      // hướng tay / chân
  var huongThan = function (t) { return [Math.sin(rad(t)), -Math.cos(rad(t))]; };  // hướng thân (hông → cổ)
  var cong = function (p, v, k) { return [p[0] + v[0] * k, p[1] + v[1] * k]; };
  var gop = function () { var o = {}; for (var i = 0; i < arguments.length; i++) for (var k in arguments[i]) o[k] = arguments[i][k]; return o; };

  /* Tư thế hay dùng */
  var TAY_HONG = { aR: 45, cR: -40, aL: -45, cL: 40 };                 // chống hông (nhìn thẳng)
  var VO_TAY = { aR: -25, cR: -175, aL: 25, cL: 175 };                // hai bàn tay chạm nhau trước ngực
  var MO_TAY = { aR: 45, cR: 120, aL: -45, cL: -120 };
  var GIO_CAO = { aR: 148, cR: 160, aL: -148, cL: -160 };   // giơ chéo lên để đầu không che tay
  var DANG_NGANG = { aR: 88, cR: 90, aL: -88, cL: -90 };
  var XUOI = { aR: 2, cR: 2, aL: 2, cL: 2 };                           // tay buông (nhìn nghiêng)
  var GIO_NGHIENG = { aR: 138, cR: 150, aL: 132, cL: 145 };           // giơ tay lên (nhìn nghiêng, không bị đầu che)
  var NGOI_XOM = { lR: -78, sR: 22, lL: -78, sL: 22, T: 30 };
  var NGOI_DAT = { lR: 75, sR: 85, lL: -75, sL: -85 };                 // ngồi dạng chân (nhìn thẳng)
  var NGOI_DUOI = { lR: -90, sR: -90, lL: -88, sL: -88 };              // ngồi duỗi chân (nhìn nghiêng)
  var VAN_CAO = { T: 64, lR: 64, sR: 64, lL: 64, sL: 64, aR: 0, cR: 0, aL: 0, cL: 0 };   // chống thẳng tay
  var NAM_NGUA_NGHIENG = { T: -90, aR: 150, cR: 165, aL: 140, cL: 155 };
  var NAM_SAP = { T: -90, h: 0, aR: 20, cR: 80, aL: 25, cL: 85, lR: -90, sR: -92, lL: -88, sL: -90 };
  var NAM_TREN = { T: -90, aR: 25, cR: 20, aL: 155, cL: 160, lR: -80, sR: -82, lL: -100, sL: -98 };
  var BO_A = { T: 70, h: -20, aR: -15, cR: -10, aL: 8, cL: 8, lR: -8, sR: 85, lL: 12, sL: 95 };
  var BO_B = { T: 70, h: -20, aR: 8, cR: 8, aL: -15, cL: -10, lR: 12, sR: 95, lL: -8, sL: 85 };

  /* Bảng động tác. khung: các tư thế lần lượt; d = thời gian chuyển sang tư thế kế (ms), giu = dừng ở tư thế này (ms) */
  var DONG = {
    /* ---- Đứng, nhìn thẳng ---- */
    'nhay-sao': { huong: 'thang', neo: 'giua', tinh: 2, khung: [
      { d: 260, giu: 60 },
      { aR: 20, cR: 14, aL: -20, cL: -14, lR: 14, sR: -10, lL: -14, sL: 10, d: 200 },
      gop(GIO_CAO, { lR: 28, sR: 28, lL: -28, sL: -28, bay: 16, d: 280, giu: 90 }),
      { aR: 150, cR: 156, aL: -150, cL: -156, lR: 32, sR: 18, lL: -32, sL: -18, d: 260 }] },
    'nhay-tho': { huong: 'thang', neo: 'giua', tinh: 1, khung: [
      { aR: 150, cR: -175, aL: -150, cL: 175, lR: 30, sR: -18, lL: -30, sL: 18, d: 230, giu: 90 },
      { aR: 150, cR: -175, aL: -150, cL: 175, lR: 5, sR: 4, lL: -5, sL: -4, bay: 15, d: 260, giu: 40 }] },
    /* Đứng một chân: dang tay, co chân trái lên áp vào gối chân trụ */
    'dung-mot-chan': { huong: 'thang', neo: 'chanR', tinh: 1, khung: [
      gop(DANG_NGANG, { d: 500, giu: 200 }),
      gop(DANG_NGANG, { lR: 0, sR: 0, lL: -66, sL: 55, T: -2, aR: 84, d: 600, giu: 700 }),
      gop(DANG_NGANG, { lR: 0, sR: 0, lL: -66, sL: 55, T: 2, aL: -94, d: 600, giu: 700 })] },
    'nhay-lo-co': { huong: 'thang', neo: 'chanR', tinh: 1, khung: [
      { aR: 45, cR: 20, aL: -45, cL: -20, lR: 6, sR: -6, lL: -60, sL: 30, d: 220, giu: 60 },
      { aR: 52, cR: 30, aL: -52, cL: -30, lR: 0, sR: 0, lL: -64, sL: 34, bay: 12, d: 240, giu: 30 }] },
    'vuon-cao': { huong: 'thang', neo: 'chan', tinh: 1, khung: [
      { d: 800, giu: 300 },
      gop(GIO_CAO, { aR: 152, cR: 168, aL: -152, cL: -168, bay: 5, d: 800, giu: 700 })] },
    'tho': { huong: 'thang', neo: 'chan', tinh: 1, khung: [
      { aR: 22, cR: 14, aL: -22, cL: -14, d: 2400, giu: 300 },
      gop(GIO_CAO, { d: 2600, giu: 500 })] },
    'xoay-tay': { huong: 'thang', neo: 'chan', tinh: 1, lap: 'nhay', khung: [
      { aR: 18, cR: 18, aL: -18, cL: -18, d: 300 },
      { aR: 95, cR: 95, aL: -95, cL: -95, d: 300 },
      { aR: 180, cR: 180, aL: -180, cL: -180, d: 300 },
      { aR: 270, cR: 270, aL: -270, cL: -270, d: 300 },
      { aR: 378, cR: 378, aL: -378, cL: -378, d: 0 }] },
    'nghieng-luon': { huong: 'thang', neo: 'chan', tinh: 0, khung: [
      { T: -16, aR: 45, cR: -40, aL: 172, cL: 128, d: 800, giu: 900 },
      { T: 16, aL: -45, cL: 40, aR: -172, cR: -128, d: 800, giu: 900 }] },
    /* Cây đu đưa: hai tay giơ cao, nghiêng cả người sang hai bên */
    'cay-dua': { huong: 'thang', neo: 'chan', tinh: 0, khung: [
      { T: -15, aR: 160, cR: 150, aL: -175, cL: 165, d: 900, giu: 700 },
      { T: 15, aR: 175, cR: -165, aL: -160, cL: -150, d: 900, giu: 700 }] },
    'xoay-hong': { huong: 'thang', neo: 'chan', tinh: 1, khung: [
      gop(TAY_HONG, { lR: 9, sR: 9, lL: 3, sL: 3, T: -7, d: 450 }),
      gop(TAY_HONG, { lR: 3, sR: 3, lL: -3, sL: -3, bay: 2, d: 450 }),
      gop(TAY_HONG, { lR: -3, sR: -3, lL: -9, sL: -9, T: 7, d: 450 }),
      gop(TAY_HONG, { lR: 3, sR: 3, lL: -3, sL: -3, d: 450 })] },
    'vo-tay-dam-chan': { huong: 'thang', neo: 'giua', tinh: 0, khung: [
      gop(VO_TAY, { lR: 26, sR: -26, d: 260 }),
      gop(MO_TAY, { d: 260 }),
      gop(VO_TAY, { lL: -26, sL: 26, d: 260 }),
      gop(MO_TAY, { d: 260 })] },
    'di-lach-bach': { huong: 'thang', neo: 'giua', tinh: 0, khung: [
      { aR: 24, cR: 38, aL: -24, cL: -38, T: -7, lR: 5, sR: 5, lL: -1, sL: -1, dx: -4, d: 380 },
      { aR: 24, cR: 38, aL: -24, cL: -38, T: 7, lR: 1, sR: 1, lL: -5, sL: -5, dx: 4, d: 380 }] },
    /* Voi vẫy vòi: chân rộng, hai tay chắp lại buông thõng, vẫy qua trái qua phải */
    'voi-vay': { huong: 'thang', neo: 'chan', tinh: 0, khung: [
      { T: -6, h: 8, aR: 14, cR: 14, aL: 36, cL: 36, lR: 16, sR: 16, lL: -16, sL: -16, d: 650 },
      { T: 6, h: -8, aR: -36, cR: -36, aL: -14, cL: -14, lR: 16, sR: 16, lL: -16, sL: -16, d: 650 }] },
    'nhay-day': { huong: 'thang', neo: 'giua', tinh: 1, day: true, khung: [
      { aR: 22, cR: -20, aL: -22, cL: 20, lR: 9, sR: -8, lL: -9, sL: 8, day: -1, d: 230 },
      { aR: 26, cR: 5, aL: -26, cL: -5, lR: 3, sR: 3, lL: -3, sL: -3, bay: 12, day: 1, d: 230 }] },
    /* Vịn ghế bước ngang (ghế phía sau, tay vịn mép ghế) */
    'di-ngang': { huong: 'thang', neo: 'giua', tinh: 0, nen: [{ loai: 'ghe', x: 10, y: DAT - 62, w: 180, h: 62 }], khung: [
      { aR: 62, cR: 15, aL: -62, cL: -15, lR: 16, sR: 16, lL: -16, sL: -16, d: 600, giu: 150 },
      { aR: 58, cR: 10, aL: -58, cL: -10, lR: 3, sR: 3, lL: -3, sL: -3, T: 4, d: 600, giu: 150 }] },

    /* ---- Đứng, nhìn nghiêng (mặt quay sang phải) ---- */
    'chay-tai-cho': { huong: 'nghieng', neo: 'giua', tinh: 0, khung: [
      { T: 5, lR: -65, sR: 15, lL: 18, sL: 35, aR: 45, cR: -60, aL: -45, cL: -140, bay: 4, d: 240 },
      { T: 5, lR: 18, sR: 35, lL: -65, sL: 15, aR: -45, cR: -140, aL: 45, cL: -60, bay: 4, d: 240 }] },
    /* Đuổi bong bóng: chạy, hai tay với lên vỗ bong bóng */
    'duoi-bong': { huong: 'nghieng', neo: 'giua', tinh: 1, qua: 'bongBong', quaGoc: 'hong', khung: [
      { T: 8, lR: -60, sR: 20, lL: 18, sL: 35, aR: -150, cR: -160, aL: -130, cL: -150, bay: 4, px: 48, py: -98, d: 260 },
      { T: 8, lR: 18, sR: 35, lL: -60, sL: 20, aR: -165, cR: -175, aL: -155, cL: -170, bay: 4, px: 44, py: -108, d: 260 }] },
    'ngoi-xom': { huong: 'nghieng', neo: 'chan', tinh: 1, khung: [
      gop(XUOI, { lR: 0, sR: 0, lL: 0, sL: 0, d: 650, giu: 300 }),
      gop(NGOI_XOM, { aR: -85, cR: -88, aL: -85, cL: -88, d: 650, giu: 450 })] },
    /* Ngồi xổm nhặt đồ chơi: hạ người, tay chạm đồ chơi dưới sàn, đứng lên cầm đồ chơi */
    'ngoi-nhat': { huong: 'nghieng', neo: 'chan', tinh: 1, qua: 'sao', quaGoc: 'san', khung: [
      gop(XUOI, { lR: 0, sR: 0, lL: 0, sL: 0, px: 22, py: 2, cam: 0, d: 650, giu: 250 }),
      gop(NGOI_XOM, { T: 45, aR: -15, cR: -10, aL: -5, cL: 0, px: 22, py: 2, cam: 0, d: 400, giu: 350 }),
      gop(NGOI_XOM, { T: 45, aR: -15, cR: -10, aL: -5, cL: 0, px: 22, py: 2, cam: 1, d: 650, giu: 0 }),
      { aR: -60, cR: -120, aL: 2, cL: 2, lR: 0, sR: 0, lL: 0, sL: 0, px: 22, py: 2, cam: 1, d: 300, giu: 600 }] },
    /* Vịn ghế đứng lên ngồi xuống (ghế bên phải) */
    'vin-dung': { huong: 'nghieng', neo: 'chan', tinh: 0, nen: [{ loai: 'ghe', x: 138, y: DAT - 78, w: 58, h: 78 }], khung: [
      { aR: -70, cR: -82, aL: -66, cL: -80, lR: 0, sR: 0, lL: 0, sL: 0, d: 900, giu: 500 },
      { aR: -40, cR: -60, aL: -36, cL: -58, lR: -85, sR: 40, lL: -85, sL: 40, T: 15, d: 900, giu: 500 }] },
    'ngoi-bat': { huong: 'nghieng', neo: 'chan', tinh: 0, khung: [
      gop(NGOI_XOM, { aR: 40, cR: 40, aL: 40, cL: 40, d: 260, giu: 300 }),
      gop(GIO_NGHIENG, { lR: 2, sR: 2, lL: 2, sL: 2, T: 0, bay: 26, d: 320, giu: 90 })] },
    'nhay-ech': { huong: 'nghieng', neo: 'giua', tinh: 0, khung: [
      { T: 60, lR: -85, sR: 30, lL: -85, sL: 30, aR: 0, cR: 0, aL: 0, cL: 0, d: 260, giu: 350 },
      { T: 25, lR: 25, sR: 25, lL: 30, sL: 30, aR: -150, cR: -160, aL: -150, cL: -160, bay: 22, d: 320, giu: 80 }] },
    'chung-chan': { huong: 'nghieng', neo: 'chanR', tinh: 1, khung: [
      { aR: 25, cR: -60, aL: 25, cL: -60, lR: 0, sR: 0, lL: 0, sL: 0, d: 800, giu: 300 },
      { aR: 25, cR: -60, aL: 25, cL: -60, lR: -80, sR: 0, lL: 45, sL: 80, d: 800, giu: 450 }] },
    'cui-cham-chan': { huong: 'nghieng', neo: 'chan', tinh: 1, khung: [
      gop(GIO_NGHIENG, { lR: 0, sR: 0, lL: 0, sL: 0, d: 1000, giu: 300 }),
      { T: 125, h: -10, aR: 40, cR: 40, aL: 40, cL: 40, lR: 5, sR: -3, lL: 5, sL: -3, d: 1200, giu: 900 }] },
    'di-kieng': { huong: 'nghieng', neo: 'giua', tinh: 0, khung: [
      { aR: 140, cR: 150, aL: 134, cL: 146, lR: -18, sR: -8, lL: 12, sL: 22, bay: 5, d: 380 },
      { aR: 134, cR: 146, aL: 140, cL: 150, lR: 12, sR: 22, lL: -18, sL: -8, bay: 5, d: 380 }] },
    'da-bong': { huong: 'nghieng', neo: 'chanL', tinh: 1, qua: 'bong', quaGoc: 'san', khung: [
      { T: -5, lR: 45, sR: 75, lL: 0, sL: 0, aR: -35, cR: -60, aL: 40, cL: 20, px: 30, py: 0, d: 380, giu: 150 },
      { T: -8, lR: -65, sR: -55, lL: 0, sL: 0, aR: 30, cR: 20, aL: -40, cL: -80, px: 75, py: 28, d: 220, giu: 250 }] },
    /* Ném bóng: bóng trong tay ra sau đầu, ném ra trước bay về phía rổ */
    'nem-bong': { huong: 'nghieng', neo: 'chan', tinh: 0, qua: 'bong', quaGoc: 'san', nen: [{ loai: 'ro', x: 160, y: DAT - 30, w: 34, h: 30 }], khung: [
      { T: -10, aR: 155, cR: 120, aL: -70, cL: -80, lR: -15, sR: -15, lL: 15, sL: 15, px: 77, py: 30, cam: 1, d: 500, giu: 250 },
      { T: 12, aR: -110, cR: -100, aL: 20, cL: 10, lR: -15, sR: -15, lL: 15, sL: 15, px: 77, py: 30, cam: 1, d: 140 },
      { T: 12, aR: -110, cR: -100, aL: 20, cL: 10, lR: -15, sR: -15, lL: 15, sL: 15, px: 77, py: 30, cam: 0, d: 400, giu: 400 }] },

    /* ---- Bò, chống tay ---- */
    'bo': { huong: 'nghieng', neo: 'giua', tinh: 0, khung: [gop(BO_A, { d: 420 }), gop(BO_B, { d: 420 })] },
    'bo-qua-goi': { huong: 'nghieng', neo: 'giua', tinh: 0, nen: [{ loai: 'goi', x: 140, y: DAT - 18, w: 56, h: 20 }], khung: [gop(BO_A, { d: 420 }), gop(BO_B, { d: 420 })] },
    'bo-gau': { huong: 'nghieng', neo: 'giua', tinh: 0, khung: [
      { T: 110, h: -45, aR: -18, cR: -18, aL: 12, cL: 12, lR: 10, sR: 10, lL: -14, sL: -14, d: 330 },
      { T: 110, h: -45, aR: 12, cR: 12, aL: -18, cL: -18, lR: -14, sR: -14, lL: 10, sL: 10, d: 330 }] },
    'tam-van': { huong: 'nghieng', neo: 'giua', tinh: 0, khung: [
      { T: 76, h: -10, lR: 76, sR: 76, lL: 76, sL: 76, aR: 0, cR: -90, aL: 0, cL: -90, d: 1200 },
      { T: 75, h: -10, lR: 75, sR: 75, lL: 75, sL: 75, aR: 0, cR: -90, aL: 0, cL: -90, d: 1200 }] },
    'chong-day': { huong: 'nghieng', neo: 'giua', tinh: 0, khung: [
      gop(VAN_CAO, { h: -10, d: 700, giu: 150 }),
      { T: 77, h: -10, lR: 77, sR: 77, lL: 77, sL: 77, aR: 55, cR: -55, aL: 55, cL: -55, d: 700, giu: 150 }] },
    'leo-nui': { huong: 'nghieng', neo: 'giua', tinh: 0, khung: [
      gop(VAN_CAO, { h: -10, lR: -70, sR: 60, d: 260 }),
      gop(VAN_CAO, { h: -10, lL: -70, sL: 60, d: 260 })] },
    'cau-mong': { huong: 'nghieng', neo: 'giua', tinh: 1, khung: [
      { T: -90, lR: -135, sR: -21, lL: -135, sL: -21, aR: -90, cR: -90, aL: -90, cL: -90, d: 800, giu: 300 },
      { T: -115, h: 25, lR: -82, sR: 10, lL: -82, sL: 10, aR: -65, cR: -65, aL: -65, cL: -65, d: 800, giu: 500 }] },

    /* ---- Ngồi ---- */
    'ngoi-vo-tay': { huong: 'thang', neo: 'giua', tinh: 0, khung: [
      gop(NGOI_DAT, VO_TAY, { d: 300 }), gop(NGOI_DAT, MO_TAY, { d: 300 })] },
    'ngoi-lac-lu': { huong: 'thang', neo: 'giua', tinh: 0, khung: [
      gop(NGOI_DAT, { T: -10, aR: 150, cR: 165, aL: -140, cL: -150, d: 700 }),
      gop(NGOI_DAT, { T: 0, aR: 30, cR: 20, aL: -30, cL: -20, d: 700 }),
      gop(NGOI_DAT, { T: 10, aR: 140, cR: 150, aL: -150, cL: -165, d: 700 }),
      gop(NGOI_DAT, { T: 0, aR: 30, cR: 20, aL: -30, cL: -20, d: 700 })] },
    'ngoi-voi': { huong: 'nghieng', neo: 'giua', tinh: 1, qua: 'sao', quaGoc: 'hong', khung: [
      gop(NGOI_DUOI, { T: 5, aR: 20, cR: 10, aL: 20, cL: 10, px: 78, py: -4, d: 800, giu: 300 }),
      gop(NGOI_DUOI, { T: 35, aR: -75, cR: -80, aL: -70, cL: -75, px: 78, py: -4, d: 800, giu: 500 })] },
    'ngoi-day-bong': { huong: 'nghieng', neo: 'giua', tinh: 1, qua: 'bong', quaGoc: 'hong', khung: [
      gop(NGOI_DUOI, { T: 5, aR: -40, cR: -150, aL: -40, cL: -150, px: 70, py: 2, cam: 1, d: 500, giu: 200 }),
      gop(NGOI_DUOI, { T: 15, aR: -85, cR: -85, aL: -85, cL: -85, px: 70, py: 2, cam: 1, d: 200 }),
      gop(NGOI_DUOI, { T: 15, aR: -85, cR: -85, aL: -85, cL: -85, px: 95, py: 4, cam: 0, d: 400, giu: 400 })] },

    /* ---- Em bé nằm (nhìn nghiêng, đầu bên trái) ---- */
    'be-dap-xe': { huong: 'nghieng', neo: 'giua', tinh: 0, khung: [
      gop(NAM_NGUA_NGHIENG, { lR: -150, sR: -40, lL: -100, sL: -100, d: 450 }),
      gop(NAM_NGUA_NGHIENG, { lR: -100, sR: -100, lL: -150, sL: -40, d: 450 })] },
    'be-voi-tay': { huong: 'nghieng', neo: 'giua', tinh: 0, qua: 'sao', quaGoc: 'hong', khung: [
      gop(NAM_NGUA_NGHIENG, { aR: 178, cR: 178, aL: 160, cL: 150, lR: -120, sR: -70, lL: -110, sL: -60, px: -26, py: -58, d: 500, giu: 200 }),
      gop(NAM_NGUA_NGHIENG, { aR: 155, cR: 145, aL: 182, cL: 186, lR: -120, sR: -70, lL: -110, sL: -60, px: -26, py: -58, d: 500, giu: 200 })] },
    'be-da-chan': { huong: 'nghieng', neo: 'giua', tinh: 1, qua: 'bong', quaGoc: 'san', khung: [
      gop(NAM_NGUA_NGHIENG, { lR: -150, sR: -40, lL: -145, sL: -35, px: 50, py: 30, d: 400, giu: 200 }),
      gop(NAM_NGUA_NGHIENG, { lR: -110, sR: -110, lL: -105, sL: -105, px: 68, py: 36, d: 260, giu: 250 })] },
    'be-nam-sap': { huong: 'nghieng', neo: 'giua', tinh: 1, qua: 'sao', quaGoc: 'hong', khung: [
      gop(NAM_SAP, { px: -88, py: 8, d: 900, giu: 500 }),
      gop(NAM_SAP, { T: -80, h: 40, aR: 0, cR: 88, aL: 4, cL: 90, px: -88, py: 8, d: 900, giu: 900 })] },
    /* Nằm sấp chống thẳng tay, ngực nhấc cao */
    'be-chong-tay': { huong: 'nghieng', neo: 'giua', tinh: 1, qua: 'sao', quaGoc: 'hong', khung: [
      gop(NAM_SAP, { px: -92, py: -6, d: 900, giu: 400 }),
      gop(NAM_SAP, { T: -68, h: 30, aR: -10, cR: -12, aL: -6, cL: -8, px: -92, py: -6, d: 900, giu: 900 })] },
    /* Vuốt lưng: bé nằm sấp thư giãn, tay mẹ vuốt từ gáy xuống mông */
    'be-vuot-lung': { huong: 'nghieng', neo: 'giua', tinh: 0, qua: 'tayMe', quaGoc: 'hong', khung: [
      gop(NAM_SAP, { aR: 30, cR: 70, h: -5, px: -30, py: -18, d: 1400, giu: 100 }),
      gop(NAM_SAP, { aR: 30, cR: 70, h: -5, px: 4, py: -16, d: 300, giu: 100 })] },

    /* ---- Em bé nằm trên thảm (nhìn từ trên xuống) ---- */
    /* Xoa bóp: tay mẹ vuốt dọc chân bé */
    'be-xoa': { huong: 'thang', tren: true, neo: 'giua', tinh: 0, qua: 'tayMe', quaGoc: 'hong', khung: [
      gop(NAM_TREN, { px: 8, py: 26, d: 1300, giu: 150 }),
      gop(NAM_TREN, { aR: 35, cR: 30, aL: 145, cL: 150, px: 48, py: 30, d: 500, giu: 150 })] },
    'be-dang-tay': { huong: 'thang', tren: true, neo: 'giua', tinh: 0, khung: [
      gop(NAM_TREN, { aR: 0, cR: 0, aL: 180, cL: 180, d: 900, giu: 400 }),
      gop(NAM_TREN, { aR: -100, cR: -175, aL: -80, cL: -5, d: 900, giu: 500 })] },
    'be-quay-dau': { huong: 'thang', tren: true, neo: 'giua', tinh: 0, qua: 'sao', quaGoc: 'hong', khung: [
      gop(NAM_TREN, { h: 28, px: -60, py: -52, d: 1100, giu: 400 }),
      gop(NAM_TREN, { h: -28, px: -60, py: 52, d: 1100, giu: 400 })] },
    'be-lat': { huong: 'thang', tren: true, neo: 'giua', tinh: 1, qua: 'sao', quaGoc: 'hong', khung: [
      gop(NAM_TREN, { px: 10, py: -62, d: 900, giu: 300 }),
      gop(NAM_TREN, { T: -78, h: 25, aR: 175, cR: 160, lR: -125, sR: -100, px: 10, py: -62, d: 900, giu: 700 })] },
    'be-ru': { huong: 'thang', tren: true, neo: 'giua', tinh: 0, khung: [
      gop(NAM_TREN, { T: -94, h: -4, d: 1600 }), gop(NAM_TREN, { T: -86, h: 4, d: 1600 })] },
    'nam-thu-gian': { huong: 'thang', tren: true, neo: 'giua', tinh: 0, khung: [
      { T: -90, aR: 40, cR: 40, aL: 140, cL: 140, lR: -50, sR: -50, lL: -130, sL: -130, d: 2000 },
      { T: -90, aR: 44, cR: 44, aL: 136, cL: 136, lR: -53, sR: -53, lL: -127, sL: -127, d: 2000 }] }
  };

  /* Nhân vật theo đúng các bé 3D trong img/rd/kids. Độ dài xương: B thân, U cánh tay, F cẳng tay, DUI đùi, CANG cẳng chân */
  var DA = '#F8D3BE', DA_TOI = '#EDBBA2', TOC = '#231C1C', TRANG = '#FFFFFF', GIAY = '#F5F4F2';
  var XANH = '#A8C8AE', XANH_TOI = '#93B79A', HONG = '#F4B0BF', HONG_TOI = '#E696A8', BE = '#D9C9AD', KEM = '#EDE3CF', JEAN = '#B4CCE6';
  var NV = {
    emBe:     { B: 36, U: 17, F: 15, DUI: 19, CANG: 18, r: 28, W: 33, tay: 11, chan: 13, ty: 1.08, toc: 'chom',
                ao: '#B7D3BF', aoToi: '#A1C2AB', tayAo: 1, quan: '#B7D3BF', chanAo: 1, giay: '#B7D3BF', yem: true },
    chapTrai: { B: 38, U: 19, F: 17, DUI: 22, CANG: 21, r: 27, W: 30, tay: 10, chan: 12, ty: 1.12, toc: 'xu',
                ao: XANH, aoToi: XANH_TOI, tayAo: 0.36, quan: KEM, chanAo: 0.62, giay: '#F4E3DC', yemQuan: true },
    chapGai:  { B: 38, U: 19, F: 17, DUI: 22, CANG: 21, r: 27, W: 30, tay: 10, chan: 12, ty: 1.12, toc: 'bob',
                ao: HONG, aoToi: HONG_TOI, tayAo: 0.36, quan: KEM, chanAo: 0.62, giay: '#F4E3DC', yemQuan: true },
    beTrai:   { B: 44, U: 23, F: 21, DUI: 28, CANG: 28, r: 25, W: 27, tay: 9, chan: 11, ty: 1.08, toc: 'xu',
                ao: XANH, aoToi: XANH_TOI, tayAo: 0.38, quan: BE, chanAo: 0.46, vo: true, giay: GIAY, tui: true },
    beGai:    { B: 44, U: 23, F: 21, DUI: 28, CANG: 28, r: 25, W: 27, tay: 9, chan: 11, ty: 1.08, toc: 'bim',
                ao: HONG, aoToi: HONG_TOI, tayAo: 0.3, phong: true, vay: true, coAo: true, vo: true, giay: GIAY },
    teenTrai: { B: 48, U: 26, F: 24, DUI: 34, CANG: 34, r: 21, W: 25, tay: 8.5, chan: 10.5, ty: 1.02, toc: 'xu',
                ao: XANH, aoToi: XANH_TOI, tayAo: 0.38, quan: BE, chanAo: 0.97, giay: GIAY, tui: true },
    teenGai:  { B: 48, U: 26, F: 24, DUI: 34, CANG: 34, r: 21, W: 25, tay: 8.5, chan: 10.5, ty: 1.02, toc: 'duoi',
                ao: HONG, aoToi: HONG_TOI, tayAo: 0.95, quan: JEAN, chanAo: 0.97, giay: GIAY, hoodie: true }
  };
  function khoaNV(o) {
    var t = o.tuoi, g = !!o.gai;
    if (t === 'emBe') return 'emBe';
    if (t === 'chap') return g ? 'chapGai' : 'chapTrai';
    if (t === 'teen') return g ? 'teenGai' : 'teenTrai';
    return g ? 'beGai' : 'beTrai';
  }
  var chonNV = function (o) { return NV[khoaNV(o)]; };

  /* Ảnh 3D (img/rd/tap/<mã bài>-<nhân vật>-<0|1>.webp, tạo bằng AI từ chính các bé trong img/rd/kids), đủ cho mọi bài
     và mọi nhân vật theo độ tuổi của bài: 0 = tư thế chuẩn bị, 1 = tư thế động tác. Ảnh lỗi thì dùng hình vẽ SVG ở trên.
     Chuyển động theo claude-motion: hàm của thời gian (requestAnimationFrame), đường cong easeOut / easeIn / easeInOut, lò xo tắt dần.
     Nhịp mỗi bài: bat = lấy đà, bật sang tư thế 1, tiếp đất có lò xo · giu = chuyển mềm, giữ lâu, lắc nhẹ giữ thăng bằng
     luan = 2 tư thế luân phiên đều, nảy nhẹ mỗi bước · lap = lên xuống đều theo lần (ngồi xổm, chống đẩy) · tho = chậm như hít thở */
  var ANH3D = {
    'xoa-bop': 'tho', 'dang-tay-om': 'tho', 'nam-sap': 'giu', 'dap-xe': 'luan', 'nhin-theo': 'luan', 'lat-nghieng': 'giu',
    'voi-do-choi': 'luan', 'da-chan-bong': 'bat', 'om-ru': 'tho', 'vuot-lung': 'tho', 'vo-tay-nhac': 'luan', 'lac-lu': 'luan',
    'ngoi-voi': 'giu', 'bo-toi-me': 'luan', 'bo-qua-goi': 'luan', 'vin-dung': 'giu', 'vin-buoc-ngang': 'luan', 'lan-bong': 'bat',
    'nam-sap-chong': 'giu', 'vo-tay-dam-chan': 'luan', 'coi-xay-gio': 'luan', 'tho-nhay': 'bat', 'chim-canh-cut': 'luan',
    'huou-vuon': 'tho', 'gau-bo': 'luan', 'duoi-bong-bong': 'bat', 'da-bong': 'bat', 'nem-bong': 'bat', 'di-kieng': 'luan',
    'tho-bong-bay': 'tho', 'sao-bien': 'tho', 'chay-tai-cho': 'luan', 'nhay-ech': 'bat', 'hac-dung': 'giu', 'ngoi-sao': 'bat',
    'voi-vay-voi': 'luan', 'lo-co': 'bat', 'nhat-do-choi': 'lap', 'cay-du-dua': 'tho', 'xoay-khop-vai': 'luan', 'xoay-hong': 'luan',
    'nhay-day': 'bat', 'ngoi-xom': 'lap', 'tam-van': 'giu', 'nghieng-luon': 'luan', 'leo-nui': 'luan', 'cau-mong': 'lap',
    'gian-co': 'tho', 'tho-sau': 'tho', 'chong-day': 'lap', 'chung-chan': 'lap', 'ngoi-bat-nhay': 'bat'
  };
  var tuoiCua = function (a) { return a === '0-6m' || a === '6-12m' ? 'emBe' : a === '1-3y' ? 'chap' : a === '12-18y' ? 'teen' : 'be'; };
  function coAnh(bai, nv) {
    var b = ANH3D[bai] && (window.BAI_TAP || []).filter(function (x) { return x.id === bai; })[0];
    return !!b && b.ages.some(function (a) { var t = tuoiCua(a); return t === 'emBe' ? nv === t : nv.indexOf(t) === 0 && nv !== 'emBe'; });
  }

  var bez = function (p1x, p1y, p2x, p2y) {   // cubic-bezier giống CSS
    return function (t) {
      var x = t, cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx, cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
      for (var i = 0; i < 6; i++) { var f = ((ax * x + bx) * x + cx) * x - t, g = (3 * ax * x + 2 * bx) * x + cx; if (Math.abs(f) < 1e-4 || !g) break; x -= f / g; }
      return ((ay * x + by) * x + cy) * x;
    };
  };
  var ra = bez(0.16, 1, 0.3, 1), vao = bez(0.6, 0, 0.9, 0.35), deu = bez(0.65, 0, 0.35, 1);
  var doan = function (t, a, b, e) { var x = Math.min(1, Math.max(0, (t - a) / (b - a))); return e ? e(x) : x; };
  function loXo(t) { if (t <= 0) return 0; var w = Math.sqrt(210 / 0.7), z = 10 / (2 * Math.sqrt(210 * 0.7)); return Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t); }
  /* Mỗi nhịp trả về { b: độ hiện tư thế 1 (0..1), y: phần chiều cao (âm = lên), sx, sy, r: độ } tại giây t */
  var NHIP = {
    bat: function (t) {
      var c = t % 1.35, r = { b: 0, y: 0, sx: 1, sy: 1, r: 0 };
      if (c < 0.24) { var n = doan(c, 0, 0.24, deu); r.sy = 1 - 0.08 * n; r.sx = 1 + 0.05 * n; }
      else if (c < 0.94) { r.b = 1; r.y = -0.12 * (doan(c, 0.24, 0.54, ra) - doan(c, 0.64, 0.94, vao)); }
      else { var s = loXo(c - 0.94); r.sy = 1 - 0.08 * s; r.sx = 1 + 0.05 * s; }
      return r;
    },
    giu: function (t) { var c = t % 4.2, b = doan(c, 0.9, 1.25, deu) - doan(c, 3.5, 3.85, deu); return { b: b, y: 0, sx: 1, sy: 1 + 0.01 * Math.sin(t * 3), r: 1.4 * b * Math.sin(t * 2.2) }; },
    luan: function (t) { var c = t % 1.2, b = doan(c, 0.45, 0.6, deu) - doan(c, 1.05, 1.2, deu), nay = Math.abs(Math.sin(t * Math.PI / 0.6)); return { b: b, y: -0.025 * nay, sx: 1, sy: 1, r: 0 }; },
    lap: function (t) { var c = t % 2.2, b = doan(c, 0.35, 0.8, deu) - doan(c, 1.4, 1.85, deu); return { b: b, y: 0, sx: 1, sy: 1 + 0.008 * Math.sin(t * 2.9), r: 0 }; },
    tho: function (t) { var c = t % 5, b = doan(c, 0.6, 2.1, deu) - doan(c, 3.1, 4.6, deu), p = 0.02 * Math.sin(t * 1.25); return { b: b, y: 0, sx: 1 + p, sy: 1 + p, r: 0 }; }
  };
  /* Một vòng requestAnimationFrame chung cho mọi ảnh đang chạy và đang hiện trên màn hình */
  var dangChay = [], rafAnh = 0, truocAnh = 0;
  function vongAnh(now) {
    rafAnh = 0;
    var dt = truocAnh ? Math.min(100, now - truocAnh) / 1000 : 0; truocAnh = now;
    dangChay.forEach(function (a) { a.t += dt; a.ve(); });
    if (dangChay.length) rafAnh = requestAnimationFrame(vongAnh); else truocAnh = 0;
  }
  function chayAnh(a, co) {
    var i = dangChay.indexOf(a);
    if (co && i < 0) { dangChay.push(a); if (!rafAnh) { truocAnh = 0; rafAnh = requestAnimationFrame(vongAnh); } }
    else if (!co && i > -1) dangChay.splice(i, 1);
  }
  function taoAnh(goc, bai, nv, opt, duPhong) {
    var src = function (i) { return 'img/rd/tap/' + bai + '-' + nv + '-' + i + '.webp'; };
    goc.innerHTML = '<span class="tcb-anh"><span class="tcb-anh__bong"></span><span class="tcb-anh__vat"><img src="' + src(0) + '" alt="" decoding="async"><img src="' + src(1) + '" alt="" decoding="async"></span></span>';
    var vat = goc.querySelector('.tcb-anh__vat'), bong = goc.querySelector('.tcb-anh__bong'), im = vat.querySelectorAll('img');
    var f = NHIP[ANH3D[bai]] || NHIP.luan, dung = false, hien = true, thay = null;
    var chay = opt.chay !== false && !GIAM && opt.khung == null;
    var a = { t: 0, ve: function () {
      var p = f(a.t), h = vat.offsetHeight;
      im[1].style.opacity = p.b.toFixed(3); im[0].style.opacity = (1 - p.b).toFixed(3);
      vat.style.transform = 'translateY(' + (p.y * h).toFixed(1) + 'px) rotate(' + p.r.toFixed(2) + 'deg) scale(' + p.sx.toFixed(3) + ',' + p.sy.toFixed(3) + ')';
      bong.style.transform = 'scale(' + Math.max(0.5, 1 + p.y * 3).toFixed(3) + ')';
    } };
    var tinh = opt.khung != null ? opt.khung % 2 : 1;   // đứng yên (giảm chuyển động / duyệt từng tư thế): hiện tư thế động tác
    im[1].style.opacity = tinh; im[0].style.opacity = 1 - tinh;
    var dongBo = function () { chayAnh(a, chay && !dung && hien && !thay); };
    im[0].onerror = im[1].onerror = function () {   // thiếu ảnh: chuyển sang hình vẽ
      if (thay) return;
      thay = true; dongBo(); if (nhin) nhin.unobserve(goc);
      thay = duPhong(); if (dung) thay.dung();
    };
    goc.__tcbHinh = { thay: function (x) { hien = x; dongBo(); } };
    if (chay) { if (nhin) nhin.observe(goc); a.ve(); dongBo(); }
    return {
      dung: function () { dung = true; dongBo(); if (thay) thay.dung(); },
      tiep: function () { dung = false; dongBo(); if (thay) thay.tiep(); },
      huy: function () { dung = true; chayAnh(a, false); if (thay) thay.huy(); if (nhin) nhin.unobserve(goc); goc.__tcbHinh = null; }
    };
  }

  function tao_(ten, thuocTinh, cha) {
    var e = document.createElementNS(NS, ten);
    for (var k in thuocTinh) e.setAttribute(k, thuocTinh[k]);
    if (cha) cha.appendChild(e);
    return e;
  }
  var so = function (n) { return Math.round(n * 10) / 10; };

  /* Tính toạ độ các khớp (gốc = hông) */
  function tinhXuong(p, m, d) {
    var td = huongThan(p.T), ngang = [Math.cos(rad(p.T)), Math.sin(rad(p.T))];
    var nghieng = m.huong === 'nghieng', oV = nghieng ? 1.5 : d.W / 2 - 2, oH = nghieng ? 1.5 : d.W / 4.5;
    var H = [0, 0], vai = cong(H, td, d.B - 6), co = cong(H, td, d.B);
    var x = { H: H, co: co, vaiR: cong(vai, ngang, -oV), vaiL: cong(vai, ngang, oV), hongR: cong(H, ngang, -oH), hongL: cong(H, ngang, oH) };
    x.khuyuR = cong(x.vaiR, huong(p.aR), d.U); x.tayR = cong(x.khuyuR, huong(p.cR), d.F);
    x.khuyuL = cong(x.vaiL, huong(p.aL), d.U); x.tayL = cong(x.khuyuL, huong(p.cL), d.F);
    x.goiR = cong(x.hongR, huong(p.lR), d.DUI); x.chanR = cong(x.goiR, huong(p.sR), d.CANG);
    x.goiL = cong(x.hongL, huong(p.lL), d.DUI); x.chanL = cong(x.goiL, huong(p.sL), d.CANG);
    x.dau = cong(co, huongThan(p.T + p.h), d.r - 4);
    return x;
  }
  /* Đặt người lên sàn: điểm thấp nhất chạm sàn; neo giữ x */
  function datNguoi(x, p, m, d) {
    var diem = [[x.H, d.W / 2 + (d.vay ? 6 : 0)], [cong(x.H, huongThan(p.T), d.B / 2), d.W / 2], [x.co, d.W / 2], [x.dau, d.r],
      [x.tayR, 4.6], [x.tayL, 4.6], [x.khuyuR, d.tay / 2], [x.khuyuL, d.tay / 2],
      [x.chanR, 5], [x.chanL, 5], [x.goiR, d.chan / 2], [x.goiL, d.chan / 2]];
    var maxY = -1e9, minX = 1e9, maxX = -1e9;
    diem.forEach(function (q) { maxY = Math.max(maxY, q[0][1] + q[1]); minX = Math.min(minX, q[0][0] - q[1]); maxX = Math.max(maxX, q[0][0] + q[1]); });
    var neoX = m.neo === 'chan' ? (x.chanR[0] + x.chanL[0]) / 2 : m.neo === 'chanR' ? x.chanR[0] : m.neo === 'chanL' ? x.chanL[0]
      : m.neo === 'tay' ? (x.tayR[0] + x.tayL[0]) / 2 : (minX + maxX) / 2;
    if (m.tren) return [100 - (minX + maxX) / 2 + p.dx, GIUA_TREN];
    return [100 - neoX + p.dx, DAT - maxY - p.bay];
  }

  /* ---------- Vẽ đầu (gốc = tâm đầu, mặt nhìn thẳng, phía trên = -y) ---------- */
  function veDau(g, d) {
    var r = d.r, f = function (n) { return so(n * r); };
    /* Tóc phía sau mặt */
    if (d.toc === 'bim') {
      tao_('ellipse', { cx: f(-1.12), cy: f(0.25), rx: f(0.3), ry: f(0.52), fill: TOC, transform: 'rotate(18 ' + f(-1.12) + ' ' + f(0.25) + ')' }, g);
      tao_('ellipse', { cx: f(1.12), cy: f(0.25), rx: f(0.3), ry: f(0.52), fill: TOC, transform: 'rotate(-18 ' + f(1.12) + ' ' + f(0.25) + ')' }, g);
    }
    if (d.toc === 'bob') tao_('path', { d: 'M ' + f(-1.08) + ' ' + f(0.1) + ' Q ' + f(-1.15) + ' ' + f(0.75) + ' ' + f(-0.75) + ' ' + f(0.72) + ' L ' + f(0.75) + ' ' + f(0.72) + ' Q ' + f(1.15) + ' ' + f(0.75) + ' ' + f(1.08) + ' ' + f(0.1) + ' Z', fill: TOC }, g);
    if (d.toc === 'duoi') tao_('path', { d: 'M ' + f(0.55) + ' ' + f(-0.75) + ' Q ' + f(1.6) + ' ' + f(-0.4) + ' ' + f(1.25) + ' ' + f(1.1) + ' Q ' + f(1.05) + ' ' + f(0.35) + ' ' + f(0.8) + ' ' + f(-0.2) + ' Z', fill: TOC }, g);
    /* Tai + mặt */
    tao_('circle', { cx: f(-0.98), cy: f(0.12), r: f(0.2), fill: DA_TOI }, g);
    tao_('circle', { cx: f(0.98), cy: f(0.12), r: f(0.2), fill: DA_TOI }, g);
    tao_('ellipse', { rx: f(1), ry: f(0.96), fill: DA }, g);
    tao_('ellipse', { cx: 0, cy: f(0.55), rx: f(0.7), ry: f(0.3), fill: DA_TOI, opacity: 0.25 }, g);   // bóng cằm (2 tông)
    /* Má, mắt to (có điểm sáng), lông mày, mũi, miệng cười */
    [-1, 1].forEach(function (s) {
      tao_('ellipse', { cx: f(0.56 * s), cy: f(0.34), rx: f(0.21), ry: f(0.15), fill: '#F69AA6', opacity: 0.45 }, g);
      tao_('ellipse', { cx: f(0.37 * s), cy: f(0.08), rx: f(0.19), ry: f(0.23), fill: '#3A2318' }, g);
      tao_('ellipse', { cx: f(0.37 * s), cy: f(0.12), rx: f(0.12), ry: f(0.15), fill: '#5E3A24' }, g);
      tao_('circle', { cx: f(0.37 * s - 0.06), cy: f(0.01), r: f(0.065), fill: TRANG }, g);
      tao_('circle', { cx: f(0.37 * s + 0.06), cy: f(0.17), r: f(0.03), fill: TRANG }, g);
      tao_('path', { d: 'M ' + f(0.24 * s) + ' ' + f(-0.2) + ' Q ' + f(0.38 * s) + ' ' + f(-0.27) + ' ' + f(0.52 * s) + ' ' + f(-0.19), fill: 'none', stroke: '#3A2A22', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
    });
    tao_('ellipse', { cx: 0, cy: f(0.24), rx: f(0.07), ry: f(0.05), fill: DA_TOI }, g);
    tao_('path', { d: 'M ' + f(-0.22) + ' ' + f(0.36) + ' Q 0 ' + f(0.64) + ' ' + f(0.22) + ' ' + f(0.36) + ' Q 0 ' + f(0.43) + ' ' + f(-0.22) + ' ' + f(0.36) + ' Z', fill: '#B8404F' }, g);
    tao_('path', { d: 'M ' + f(-0.15) + ' ' + f(0.38) + ' Q 0 ' + f(0.44) + ' ' + f(0.15) + ' ' + f(0.38) + ' L ' + f(0.13) + ' ' + f(0.43) + ' Q 0 ' + f(0.47) + ' ' + f(-0.13) + ' ' + f(0.43) + ' Z', fill: TRANG }, g);
    /* Tóc phía trước */
    var vom = 'M ' + f(-1.06) + ' ' + f(0.08) + ' C ' + f(-1.12) + ' ' + f(-1.25) + ' ' + f(1.12) + ' ' + f(-1.25) + ' ' + f(1.06) + ' ' + f(0.08);
    if (d.toc === 'xu') {
      tao_('path', { d: vom + ' L ' + f(0.92) + ' ' + f(-0.2) + ' L ' + f(0.72) + ' ' + f(-0.36) + ' L ' + f(0.55) + ' ' + f(-0.22) + ' L ' + f(0.32) + ' ' + f(-0.44) + ' L ' + f(0.1) + ' ' + f(-0.28) + ' L ' + f(-0.14) + ' ' + f(-0.46) + ' L ' + f(-0.38) + ' ' + f(-0.3) + ' L ' + f(-0.62) + ' ' + f(-0.42) + ' L ' + f(-0.8) + ' ' + f(-0.2) + ' L ' + f(-0.95) + ' ' + f(-0.08) + ' Z', fill: TOC }, g);
    } else if (d.toc === 'chom') {
      tao_('path', { d: 'M ' + f(-0.62) + ' ' + f(-0.72) + ' Q 0 ' + f(-1.22) + ' ' + f(0.62) + ' ' + f(-0.7) + ' Q ' + f(0.25) + ' ' + f(-0.86) + ' 0 ' + f(-0.66) + ' Q ' + f(-0.28) + ' ' + f(-0.86) + ' ' + f(-0.62) + ' ' + f(-0.72) + ' Z', fill: TOC }, g);
      tao_('path', { d: 'M ' + f(0.02) + ' ' + f(-1.02) + ' q ' + f(0.08) + ' ' + f(-0.32) + ' ' + f(0.3) + ' ' + f(-0.24), fill: 'none', stroke: TOC, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
    } else {
      /* Tóc mái thẳng (bé gái, chập chững gái, teen gái) */
      tao_('path', { d: vom + ' L ' + f(0.9) + ' ' + f(-0.25) + ' Q ' + f(0.5) + ' ' + f(-0.2) + ' ' + f(0.25) + ' ' + f(-0.42) + ' Q 0 ' + f(-0.22) + ' ' + f(-0.3) + ' ' + f(-0.4) + ' Q ' + f(-0.62) + ' ' + f(-0.22) + ' ' + f(-0.9) + ' ' + f(-0.28) + ' Z', fill: TOC }, g);
      if (d.toc === 'bim') [-1, 1].forEach(function (s) {   // nơ hồng hai bên
        var cx = f(0.95 * s), cy = f(-0.62);
        tao_('path', { d: 'M ' + cx + ' ' + cy + ' l ' + f(-0.3) + ' ' + f(-0.18) + ' l 0 ' + f(0.36) + ' Z M ' + cx + ' ' + cy + ' l ' + f(0.3) + ' ' + f(-0.18) + ' l 0 ' + f(0.36) + ' Z', fill: '#F08CA3' }, g);
        tao_('circle', { cx: cx, cy: cy, r: f(0.09), fill: '#E2728C' }, g);
      });
      if (d.toc === 'bob') { tao_('circle', { cx: 0, cy: f(-1.12), r: f(0.28), fill: TOC }, g); tao_('ellipse', { cx: 0, cy: f(-0.88), rx: f(0.14), ry: f(0.06), fill: '#F08CA3' }, g); }
      if (d.toc === 'duoi') tao_('ellipse', { cx: f(0.75), cy: f(-0.72), rx: f(0.14), ry: f(0.1), fill: '#F08CA3' }, g);
    }
  }

  /* ---------- Vẽ thân (gốc = hông, phía cổ = -y) ---------- */
  function veThan(g, d) {
    var W = d.W, B = d.B, h = W / 2;
    tao_('rect', { x: -h, y: -(B + 2), width: W, height: B + 8, rx: so(W * 0.42), fill: d.ao }, g);
    tao_('rect', { x: so(h * 0.35), y: -(B - 2), width: so(h * 0.65), height: B + 2, rx: so(W * 0.3), fill: d.aoToi, opacity: 0.45 }, g);   // mặt tối
    if (d.yem) {   // yếm trắng có gấu nhỏ (em bé)
      tao_('ellipse', { cx: 0, cy: -(B - 11), rx: so(W * 0.36), ry: 10, fill: TRANG }, g);
      tao_('circle', { cx: -3.2, cy: -(B - 9.5), r: 1.6, fill: '#C9A27E' }, g); tao_('circle', { cx: 3.2, cy: -(B - 9.5), r: 1.6, fill: '#C9A27E' }, g);
      tao_('circle', { cx: 0, cy: -(B - 12), r: 3.4, fill: '#C9A27E' }, g);
    }
    if (d.yemQuan) {   // quần yếm kem, có quai và nút
      tao_('rect', { x: -h + 1, y: so(-B * 0.6), width: W - 2, height: so(B * 0.6 + 9), rx: 6, fill: d.quan }, g);
      [-1, 1].forEach(function (s) {
        tao_('line', { x1: so(s * W * 0.3), y1: so(-B * 0.58), x2: so(s * W * 0.33), y2: -(B - 1), stroke: d.quan, 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
        tao_('circle', { cx: so(s * W * 0.3), cy: so(-B * 0.56), r: 2.3, fill: '#C69A6A' }, g);
      });
      tao_('rect', { x: -6, y: so(-B * 0.5), width: 12, height: 8, rx: 2, fill: 'none', stroke: '#D6C8AC', 'stroke-width': 1.2 }, g);
    } else if (d.quan && !d.hoodie && !d.vay && d.quan !== d.ao) {
      tao_('rect', { x: -h - 0.5, y: -9, width: W + 1, height: 18, rx: 6, fill: d.quan }, g);   // quần short / quần dài
    }
    if (d.tui) tao_('rect', { x: so(h * 0.12), y: -(B - 12), width: 7, height: 7, rx: 1.5, fill: 'none', stroke: d.aoToi, 'stroke-width': 1.3 }, g);
    if (d.coAo) { tao_('ellipse', { cx: so(-W * 0.18), cy: -(B - 2), rx: so(W * 0.22), ry: 4.5, fill: TRANG }, g); tao_('ellipse', { cx: so(W * 0.18), cy: -(B - 2), rx: so(W * 0.22), ry: 4.5, fill: TRANG }, g);
      tao_('circle', { cx: 0, cy: -(B - 11), r: 1.6, fill: TRANG }, g); tao_('circle', { cx: 0, cy: -(B - 18), r: 1.6, fill: TRANG }, g); }
    if (d.hoodie) {
      tao_('rect', { x: -h - 0.5, y: 0, width: W + 1, height: 9, rx: 4, fill: d.quan }, g);
      tao_('rect', { x: -h, y: -5, width: W, height: 6, rx: 3, fill: d.aoToi }, g);
      tao_('rect', { x: so(-W * 0.32), y: -17, width: so(W * 0.64), height: 9, rx: 4, fill: d.aoToi, opacity: 0.6 }, g);
      tao_('line', { x1: -3, y1: -(B - 2), x2: -3.5, y2: -(B - 13), stroke: TRANG, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g);
      tao_('line', { x1: 3, y1: -(B - 2), x2: 3.5, y2: -(B - 13), stroke: TRANG, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g);
    }
  }
  function veVay(g, d) {   // váy xoè (vẽ sau chân để che đùi)
    var h = d.W / 2;
    tao_('path', { d: 'M ' + (-h) + ' -14 L ' + h + ' -14 L ' + (h + 11) + ' 13 Q 0 18 ' + (-h - 11) + ' 13 Z', fill: d.ao }, g);
    tao_('path', { d: 'M ' + (h * 0.3) + ' -14 L ' + h + ' -14 L ' + (h + 11) + ' 13 Q ' + (h * 0.6) + ' 15.5 ' + (h * 0.4) + ' 16 Z', fill: d.aoToi, opacity: 0.5 }, g);
  }

  /* ---------- Đồ vật ---------- */
  function veQua(loai) {
    var g = tao_('g');
    if (loai === 'bong') { tao_('circle', { r: 8, fill: '#FF8A5B' }, g); tao_('path', { d: 'M -8 0 Q 0 -5 8 0', fill: 'none', stroke: TRANG, 'stroke-width': 2 }, g); }
    if (loai === 'sao') tao_('path', { d: 'M0 -10 L2.9 -3.1 10 -3.1 4.3 1.3 6.5 8.5 0 4.3 -6.5 8.5 -4.3 1.3 -10 -3.1 -2.9 -3.1 Z', fill: '#FFB020', stroke: TRANG, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g);
    if (loai === 'tayMe') {   // bàn tay mẹ (tay áo hồng) đặt từ trên xuống
      tao_('rect', { x: -7, y: -46, width: 14, height: 30, rx: 6, fill: HONG }, g);
      tao_('rect', { x: -6, y: -20, width: 12, height: 14, rx: 5, fill: DA_TOI }, g);
      tao_('ellipse', { cx: 0, cy: -3, rx: 9, ry: 7, fill: DA }, g);
    }
    if (loai === 'bongBong') [[0, 0, 9], [18, 12, 6], [-14, 16, 5]].forEach(function (b) {
      tao_('circle', { cx: b[0], cy: b[1], r: b[2], fill: 'rgba(190,225,245,.45)', stroke: '#8CC7E8', 'stroke-width': 1.4 }, g);
      tao_('circle', { cx: b[0] - b[2] * 0.35, cy: b[1] - b[2] * 0.35, r: b[2] * 0.22, fill: TRANG }, g);
    });
    return g;
  }
  function veNen(cha, ds) {
    (ds || []).forEach(function (n) {
      if (n.loai === 'ghe') { tao_('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 14, fill: '#F6D3DF' }, cha); tao_('rect', { x: n.x, y: n.y, width: n.w, height: 12, rx: 6, fill: '#EFB9CB' }, cha); }
      if (n.loai === 'goi') { tao_('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 10, fill: '#CFE3F5' }, cha); tao_('rect', { x: n.x + 6, y: n.y + 4, width: n.w - 12, height: 4, rx: 2, fill: TRANG, opacity: 0.6 }, cha); }
      if (n.loai === 'ro') { tao_('path', { d: 'M ' + n.x + ' ' + n.y + ' h ' + n.w + ' l -4 ' + n.h + ' h ' + (-n.w + 8) + ' Z', fill: '#E8B97A' }, cha); tao_('rect', { x: n.x - 2, y: n.y - 3, width: n.w + 4, height: 5, rx: 2.5, fill: '#C98F4A' }, cha); }
    });
  }

  function ve(goc, m, d) {
    var svg = tao_('svg', { viewBox: '0 0 200 210', 'class': 'tcb-svg', 'aria-hidden': 'true', focusable: 'false' });
    var tamY = m.tren ? GIUA_TREN : DAT;
    var tong = tao_('g', { transform: 'translate(100 ' + tamY + ') scale(' + d.ty + ') translate(-100 -' + tamY + ')' }, svg);
    var e = {};
    if (m.tren) tao_('rect', { x: 4, y: 40, width: 192, height: 156, rx: 30, fill: '#FCE4EC' }, tong);
    else e.bong_ = tao_('ellipse', { cx: 100, cy: DAT + 3, rx: 34, ry: 5, fill: 'rgba(120,70,90,.14)' }, tong);
    veNen(tong, m.nen);
    var chi = function (ten, xa) {
      var g = tao_('g', xa ? { style: 'filter:brightness(.9)' } : {});
      var laChan = ten.charAt(0) === 'c', o = { g: g };
      o.da = tao_('path', { fill: 'none', stroke: DA, 'stroke-width': laChan ? d.chan : d.tay, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      if (laChan) {
        if (d.chanAo) o.ao = tao_('path', { fill: 'none', stroke: d.quan, 'stroke-width': d.chan + 3, 'stroke-linecap': d.chanAo >= 0.9 ? 'round' : 'butt', 'stroke-linejoin': 'round' }, g);
        if (d.vo) o.vo = tao_('path', { fill: 'none', stroke: TRANG, 'stroke-width': d.chan + 1, 'stroke-linecap': 'butt' }, g);
        o.giay = tao_('ellipse', { rx: so(d.chan * 0.75), ry: so(d.chan * 0.48), fill: d.giay, stroke: d.giay === GIAY ? '#CFCFCA' : 'none', 'stroke-width': 1.4 }, g);
      } else {
        o.ao = tao_('path', { fill: 'none', stroke: d.ao, 'stroke-width': d.tay + (d.phong ? 6 : 3), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        o.tay = tao_('circle', { r: so(d.tay * 0.55), fill: DA }, g);
      }
      e[ten] = o;
      return g;
    };
    var than = tao_('g'); veThan(than, d); e.than = than;
    var vay = null; if (d.vay) { vay = tao_('g'); veVay(vay, d); e.vay = vay; }
    var dau = tao_('g'); veDau(dau, d); e.dau = dau;
    if (m.qua) e.qua = veQua(m.qua);
    if (m.day) e.day = tao_('path', { fill: 'none', stroke: '#C84766', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    /* Thứ tự vẽ: nhìn nghiêng thì tay/chân trái ở xa (vẽ trước, tối hơn) */
    var thuTu = m.huong === 'nghieng' ? [chi('tL', true), chi('cL', true), than, chi('cR'), vay, chi('tR'), dau]
      : [chi('cL'), chi('cR'), than, vay, chi('tL'), chi('tR'), dau];
    if (e.day) tong.appendChild(e.day);
    thuTu.forEach(function (g) { if (g) tong.appendChild(g); });
    if (e.qua) tong.appendChild(e.qua);
    goc.innerHTML = ''; goc.appendChild(svg);
    return e;
  }

  /* Đoạn từ đầu chi tới tỉ lệ k (0..1) theo chiều dài 2 đốt */
  function doan(a, b, c, k) {
    var l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]), t = k * (l1 + l2);
    if (t <= l1) return [a, [a[0] + (b[0] - a[0]) * t / l1, a[1] + (b[1] - a[1]) * t / l1]];
    var u = Math.min(1, (t - l1) / l2); return [a, b, [b[0] + (c[0] - b[0]) * u, b[1] + (c[1] - b[1]) * u]];
  }
  function capNhat(e, p, m, d) {
    var x = tinhXuong(p, m, d), goc = datNguoi(x, p, m, d), ox = goc[0], oy = goc[1];
    var P = function (q) { return so(q[0] + ox) + ' ' + so(q[1] + oy); };
    var duong = function (ds) { return 'M ' + ds.map(P).join(' L '); };
    ['R', 'L'].forEach(function (b) {
      var t = e['t' + b], c = e['c' + b], vai = x['vai' + b], khuyu = x['khuyu' + b], tay = x['tay' + b], hong = x['hong' + b], goi = x['goi' + b], chan = x['chan' + b];
      t.da.setAttribute('d', duong([vai, khuyu, tay]));
      t.ao.setAttribute('d', duong(doan(vai, khuyu, tay, d.tayAo)));
      t.tay.setAttribute('cx', so(tay[0] + ox)); t.tay.setAttribute('cy', so(tay[1] + oy));
      c.da.setAttribute('d', duong([hong, goi, chan]));
      if (c.ao) c.ao.setAttribute('d', duong(doan(hong, goi, chan, d.chanAo)));
      if (c.vo) { var v = doan(goi, chan, chan, 0.62); c.vo.setAttribute('d', 'M ' + P(v[v.length - 1]) + ' L ' + P(chan)); }
      c.giay.setAttribute('cx', so(chan[0] + ox)); c.giay.setAttribute('cy', so(chan[1] + oy));
    });
    var bien = 'translate(' + so(ox) + ' ' + so(oy) + ') rotate(' + so(p.T) + ')';
    e.than.setAttribute('transform', bien);
    if (e.vay) e.vay.setAttribute('transform', 'translate(' + so(ox) + ' ' + so(oy) + ') rotate(' + so(Math.abs(p.T) > 60 ? p.T : p.T * 0.35) + ')');
    e.dau.setAttribute('transform', 'translate(' + P(x.dau) + ') rotate(' + so(p.T + p.h) + ')');
    if (e.bong_) { var bay = Math.min(1, p.bay / 26); e.bong_.setAttribute('cx', so(ox + (x.chanR[0] + x.chanL[0]) / 2)); e.bong_.setAttribute('rx', so(34 - 14 * bay)); }
    if (e.qua) {
      var qx = m.quaGoc === 'san' ? 100 + p.px : ox + p.px, qy = m.quaGoc === 'san' ? DAT - 8 - p.py : oy + p.py;
      var hx = x.tayR[0] + ox, hy = x.tayR[1] + oy - 2;   // đồ vật trong tay phải
      qx += (hx - qx) * p.cam; qy += (hy - qy) * p.cam;
      e.qua.setAttribute('transform', 'translate(' + so(qx) + ' ' + so(qy) + ')');
    }
    if (e.day) {
      var duoi = Math.max(x.chanR[1], x.chanL[1]) + 10, tren = x.dau[1] - d.r - 12, k = (p.day + 1) / 2, cy = tren + (duoi - tren) * k;
      e.day.setAttribute('d', 'M ' + P(x.tayR) + ' Q ' + so(ox) + ' ' + so(cy + oy + (k > 0.5 ? 10 : -10)) + ' ' + P(x.tayL));
    }
  }

  var muot = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function tron(a, b, t) { var o = {}; for (var k in MAC) o[k] = a[k] + (b[k] - a[k]) * t; return o; }
  function day_(k) { var o = {}; for (var i in MAC) o[i] = k[i] != null ? k[i] : MAC[i]; o.d = k.d != null ? k.d : 400; o.giu = k.giu || 0; return o; }

  var GIAM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nhin = 'IntersectionObserver' in window ? new IntersectionObserver(function (ds) {
    ds.forEach(function (x) { var c = x.target.__tcbHinh; if (c) c.thay(x.isIntersecting); });
  }) : null;

  /* opt.bai: mã bài (có ảnh 3D thì dùng ảnh) · opt.ve: bắt buộc dùng hình vẽ */
  function tao(goc, ten, opt) {
    opt = opt || {};
    var nv = khoaNV(opt);
    if (opt.bai && !opt.ve && coAnh(opt.bai, nv)) return taoAnh(goc, opt.bai, nv, opt, function () { return taoVe(goc, ten, opt); });
    return taoVe(goc, ten, opt);
  }
  function taoVe(goc, ten, opt) {
    var m = DONG[ten] || DONG['tho'], d = chonNV(opt);
    var khung = m.khung.map(day_), e = ve(goc, m, d);
    var tong = khung.reduce(function (t, k) { return t + k.giu + k.d; }, 0);
    capNhat(e, khung[opt.khung != null ? opt.khung % khung.length : (m.tinh || 0)], m, d);   // opt.khung: vẽ đúng 1 tư thế (để duyệt)
    var c = { t: 0, truoc: 0, raf: 0, dung_: false, hien: true };
    var chay = opt.chay !== false && !GIAM && khung.length > 1;
    function buoc(now) {
      c.raf = 0;
      if (!c.truoc) c.truoc = now;
      c.t = (c.t + now - c.truoc) % tong; c.truoc = now;
      var t = c.t;
      for (var i = 0; i < khung.length; i++) {
        var k = khung[i];
        if (t < k.giu) { capNhat(e, k, m, d); break; }
        t -= k.giu;
        if (t < k.d) { var sau = khung[(i + 1) % khung.length]; capNhat(e, (m.lap === 'nhay' && i === khung.length - 1) ? khung[0] : tron(k, sau, m.lap === 'nhay' ? t / k.d : muot(t / k.d)), m, d); break; }
        t -= k.d;
      }
      lich();
    }
    function lich() { if (chay && !c.dung_ && c.hien && !c.raf) { c.raf = requestAnimationFrame(buoc); } }
    c.thay = function (hien) { c.hien = hien; if (hien) { c.truoc = 0; lich(); } else if (c.raf) { cancelAnimationFrame(c.raf); c.raf = 0; } };
    goc.__tcbHinh = c;
    if (chay) { if (nhin) nhin.observe(goc); lich(); }
    return {
      dung: function () { c.dung_ = true; if (c.raf) { cancelAnimationFrame(c.raf); c.raf = 0; } },
      tiep: function () { c.dung_ = false; c.truoc = 0; lich(); },
      huy: function () { this.dung(); if (nhin) nhin.unobserve(goc); goc.__tcbHinh = null; }
    };
  }

  window.TCB_HINH = { tao: tao, co: function (ten) { return !!DONG[ten]; }, anh3d: ANH3D, coAnh: coAnh, ds: Object.keys(DONG), soKhung: function (ten) { return DONG[ten] ? DONG[ten].khung.length : 0; } };
})();
