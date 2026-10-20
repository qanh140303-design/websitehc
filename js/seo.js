/* =====================================================================
   SEO – Hương Chất Kids (redesign "Lớn lên cùng bé", 19/10/2026)
   Chỉ thêm thẻ vào <head>: dữ liệu cấu trúc JSON-LD, canonical, mô tả riêng
   cho từng sản phẩm / bài viết / danh mục. Không gọi mạng, không đổi giao diện,
   không đụng giỏ hàng, giá, voucher hay bất kỳ tính năng nào.
   - Mọi trang: Organization (OnlineStore) + WebSite, lấy từ window.SITE.
   - product.html?id=…: Product + Offer (giá số, VND, còn/hết hàng theo tồn kho)
     + BreadcrumbList; KHÔNG có aggregateRating (điểm Shopee là của bên thứ ba).
   - blog.html?id=…: BlogPosting + BreadcrumbList.
   - Ô "Tiêu đề SEO" / "Mô tả SEO" trong Quản trị (p.seoTitle, p.seoDesc) được ưu tiên nếu có.
   Lưu ý: Google chạy JS nên đọc được các thẻ này; Facebook/Zalo KHÔNG chạy JS,
   ô xem trước link chỉ đọc HTML gốc.
   Nạp: <script src="js/seo.js?v=lc1" defer></script> trong <head>.
   ===================================================================== */
(function () {
  'use strict';
  try {
    var BASE = 'https://huongchatkids.vn/';
    var ORG_ID = BASE + '#organization';
    var SITE_ID = BASE + '#website';
    var W = window, D = document, S = W.SITE || {};
    var ten = S.name || 'Hương Chất Kids';
    var qs = new URLSearchParams(location.search || '');
    var file = (location.pathname || '').split('/').pop() || 'index.html';

    /* Bản xem thử (Quản trị ?preview=1, link ?xem=) là dữ liệu nháp: không gắn gì */
    if (qs.get('preview') === '1' || qs.has('xem')) return;

    /* ---------- tiện ích ---------- */
    var abs = function (u) {
      if (!u) return '';
      try { return new URL(String(u), BASE).href; } catch (e) { return ''; }
    };
    var tron = function (s) {   // chữ thường: bỏ thẻ HTML, markdown, khoảng trắng thừa
      return String(s == null ? '' : s)
        .replace(/<[^>]*>/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[\[[^\]]*\]\]/g, ' ')
        .replace(/[*_`#>]+/g, ' ')
        .replace(/\s+/g, ' ').trim();
    };
    var cat = function (s, n) {  // cắt ở chỗ hết một từ, không vượt n ký tự
      s = tron(s);
      if (s.length <= n) return s;
      var t = s.slice(0, n - 1);
      var k = t.lastIndexOf(' ');
      if (k > n * 0.6) t = t.slice(0, k);
      return t.replace(/[\s,;:–-]+$/, '') + '…';
    };
    var tien = function (n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'; };
    var ngayISO = function (s) {  // "18/10/2026" → "2026-10-18"
      var m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (!m) return '';
      return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    };
    var head = D.head || D.getElementsByTagName('head')[0];
    var the = function (tag, attr, val) {  // tìm hoặc tạo thẻ trong <head>
      var el = head.querySelector(tag + '[' + attr + '="' + val + '"]');
      if (!el) { el = D.createElement(tag); el.setAttribute(attr, val); head.appendChild(el); }
      return el;
    };
    var meta = function (name, content) { if (content) the('meta', 'name', name).setAttribute('content', content); };
    var og = function (prop, content) { if (content) the('meta', 'property', prop).setAttribute('content', content); };
    var canonical = function (url, epGhi) {  // epGhi = false: chỉ thêm khi trang chưa có canonical tĩnh
      var el = head.querySelector('link[rel="canonical"]');
      if (el && epGhi === false) return el.getAttribute('href');
      if (!el) { el = D.createElement('link'); el.setAttribute('rel', 'canonical'); head.appendChild(el); }
      el.setAttribute('href', url);
      og('og:url', url);
      return url;
    };
    var ld = function (key, data) {
      var el = head.querySelector('script[data-seo="' + key + '"]');
      if (!el) { el = D.createElement('script'); el.setAttribute('type', 'application/ld+json'); el.setAttribute('data-seo', key); head.appendChild(el); }
      el.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    };
    var crumbs = function (ds) {
      return {
        '@type': 'BreadcrumbList',
        itemListElement: ds.map(function (x, i) {
          var o = { '@type': 'ListItem', position: i + 1, name: x[0] };
          if (x[1]) o.item = x[1];
          return o;
        }),
      };
    };
    var datTieuDe = function (t) {  // chạy sau script của trang (trang tự đặt title lúc DOMContentLoaded)
      if (!t) return;
      var dat = function () { D.title = t; };
      D.addEventListener('DOMContentLoaded', dat);
      W.addEventListener('load', dat);
    };

    /* ---------- Organization + WebSite (mọi trang) ---------- */
    var dc = String(S.address || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    var org = { '@type': 'OnlineStore', '@id': ORG_ID, name: ten, url: BASE };
    if (S.logo) { org.logo = { '@type': 'ImageObject', url: abs(S.logo) }; org.image = abs(S.logo); }
    if (S.slogan) org.slogan = S.slogan;
    if (S.email) org.email = S.email;
    if (S.hotlineTel) {
      org.telephone = S.hotlineTel;
      org.contactPoint = [{ '@type': 'ContactPoint', telephone: S.hotlineTel, contactType: 'customer service', areaServed: 'VN', availableLanguage: ['vi'] }];
    }
    if (dc.length) {
      org.address = dc.length >= 3
        ? { '@type': 'PostalAddress', streetAddress: dc.slice(0, dc.length - 2).join(', '), addressLocality: dc[dc.length - 2], addressRegion: dc[dc.length - 1], addressCountry: 'VN' }
        : { '@type': 'PostalAddress', streetAddress: dc.join(', '), addressCountry: 'VN' };
    }
    if (S.company && /công ty|cty|hộ kinh doanh|doanh nghiệp/i.test(S.company)) org.legalName = S.company;
    if (S.taxCode) org.taxID = String(S.taxCode);
    var same = [S.shopee, S.facebook, S.instagram, S.youtube, S.tiktok]
      .filter(function (u) { return typeof u === 'string' && /^https?:\/\//.test(u.trim()); })
      .map(function (u) { return u.trim(); });
    if (same.length) org.sameAs = same;

    var web = {
      '@type': 'WebSite', '@id': SITE_ID, url: BASE, name: ten, inLanguage: 'vi-VN', publisher: { '@id': ORG_ID },
      /* collections.html?q= là trang kết quả tìm kiếm thật (ô tìm kiếm ở header dẫn về đây) */
      potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: BASE + 'collections.html?q={search_term_string}' }, 'query-input': 'required name=search_term_string' },
    };
    /* Trang chủ trên VPS: máy chủ đã chèn sẵn OnlineStore + WebSite (tools/may-chu-vps/src/trang-web.js) → không gắn bản thứ hai */
    var coSan = [].slice.call(head.querySelectorAll('script[type="application/ld+json"]:not([data-seo])')).some(function (s) { return /"OnlineStore"/.test(s.textContent || ''); });
    if (!coSan) ld('hck-site', { '@context': 'https://schema.org', '@graph': [org, web] });

    var CATS = W.CATEGORIES || [], PRODUCTS = W.PRODUCTS || [], POSTS = W.POSTS || [];
    var BRANDS = W.BRANDS || [], AGES = W.AGES || [], NEEDS = W.NEEDS || [];
    var tim = function (ds, k) { for (var i = 0; i < ds.length; i++) if (ds[i] && ds[i].key === k) return ds[i]; return null; };

    /* ---------- Trang sản phẩm ----------
       Trên VPS (nhánh main từ 19/10/2026) máy chủ đã chèn sẵn title, mô tả, canonical, OG và
       schema Product (#ldSP) vào HTML trang sản phẩm /<slug>. Khi đó file này KHÔNG gắn thêm gì
       cho sản phẩm (tránh 2 canonical, 2 Product). Phần dưới chỉ chạy khi trang không có bản do
       máy chủ chèn: máy thử local, đường lùi GitHub Pages. */
    var SLUG = W.SP_SLUG || {}, THEO_SLUG = W.SP_THEO_SLUG || {};
    var slugTrang = '';
    try { slugTrang = decodeURIComponent(file); } catch (e) { slugTrang = file; }
    if (file === 'product.html' || THEO_SLUG[slugTrang] != null) {
      if (head.querySelector('script[id="ldSP"]') || head.querySelector('link[rel="canonical"]')) return;
      var id = qs.get('id') || (THEO_SLUG[slugTrang] != null ? String(THEO_SLUG[slugTrang]) : '');
      var p = null;
      for (var i = 0; i < PRODUCTS.length; i++) if (String(PRODUCTS[i].id) === id) { p = PRODUCTS[i]; break; }
      if (!p) {
        if (id) meta('robots', 'noindex, follow');   // "Không tìm thấy sản phẩm" không nên lên Google
        else canonical(BASE + 'collections.html');
        return;
      }
      /* Link chính: /<slug> nếu data.js có bảng SP_SLUG (giống máy chủ), nếu không thì product.html?id= */
      var url = canonical(SLUG[p.id] ? BASE + SLUG[p.id] : BASE + 'product.html?id=' + encodeURIComponent(p.id));
      var tenNgan = p.short || p.name;
      var catObj = tim(CATS, p.cat) || {};
      var brand = p.brand && p.brand !== 'khac' ? tim(BRANDS, p.brand) : null;

      var veSP = function () {
        var vs = Array.isArray(p.variants) && p.variants.length ? p.variants : null;
        var chon = vs ? Math.max(0, vs.findIndex(function (v) { return !v.oos; })) : -1;   // giống trang: phân loại còn hàng đầu tiên
        var gia = vs ? vs[chon].price : p.price;
        var het = !(p.stock > 0) || (vs && vs.every(function (v) { return v.oos; }));
        var anh = [];
        [p.image].concat(p.images || []).forEach(function (u) { var a = abs(u); if (a && anh.indexOf(a) < 0) anh.push(a); });
        var sp = {
          '@context': 'https://schema.org', '@type': 'Product', '@id': url + '#product',
          name: tenNgan, url: url, sku: String(p.id), image: anh,   // tên ngắn = đúng H1 đang hiện (tên Shopee dài có cụm công dụng)
          description: cat(p.desc || p.name, 4900),
          offers: {
            '@type': 'Offer', url: url, priceCurrency: 'VND', price: Number(gia) || 0,
            availability: het ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition', seller: { '@id': ORG_ID },
          },
        };
        if (brand) sp.brand = { '@type': 'Brand', name: brand.label };
        if (catObj.label) sp.category = catObj.label;
        ld('hck-page', sp);
      };
      veSP();
      D.addEventListener('stock:change', function () { try { veSP(); } catch (e) { /* bỏ qua */ } });   // tồn kho realtime đổi → cập nhật còn/hết

      ld('hck-crumb', Object.assign({ '@context': 'https://schema.org', '@id': url + '#breadcrumb' }, crumbs([
        ['Trang chủ', BASE],
        [catObj.label || 'Sản phẩm', p.cat ? BASE + 'collections.html?cat=' + encodeURIComponent(p.cat) : BASE + 'collections.html'],
        [tenNgan, url],
      ])));

      /* Mô tả: ô "Mô tả SEO" trong Quản trị, nếu trống thì ghép từ tên, quy cách, xuất xứ, giá – không nêu công dụng */
      var gias = (p.variants || []).map(function (v) { return Number(v.price) || 0; }).filter(Boolean);
      var giaMin = gias.length ? Math.min.apply(null, gias) : p.price;
      var tuGia = gias.length && Math.max.apply(null, gias) !== giaMin ? 'giá từ ' : 'giá ';
      var moTa = p.seoDesc ? cat(p.seoDesc, 160) : (function () {
        var m = tron(tenNgan + (p.weight && tenNgan.toLowerCase().indexOf(String(p.weight).toLowerCase()) < 0 ? ' (' + p.weight + ')' : '') + ': hàng ' + (p.origin || 'nhập khẩu') + ' chính hãng, ' + tuGia + tien(giaMin) + ' tại ' + ten + '.');
        if (m.length > 160) return cat(m, 160);
        [' Mua nhanh không cần tài khoản.', ' Tư vấn miễn phí.'].forEach(function (x) { if ((m + x).length <= 160) m += x; });
        return m;
      })();
      meta('description', moTa);
      og('og:type', 'product');
      og('og:title', p.seoTitle || tenNgan + ' – ' + ten);
      og('og:description', moTa);
      og('og:image', abs(p.image));
      if (p.seoTitle) datTieuDe(cat(p.seoTitle, 70));
      return;
    }

    /* ---------- Cẩm nang: bài viết ---------- */
    if (file === 'blog.html') {
      var pid = qs.get('id') || '';
      var post = null;
      for (var j = 0; j < POSTS.length; j++) if (POSTS[j].id === pid) { post = POSTS[j]; break; }   // POSTS đã bỏ bài nháp / hẹn giờ (app.js)
      if (!post) { canonical(BASE + 'blog.html'); return; }
      var purl = canonical(BASE + 'blog.html?id=' + encodeURIComponent(post.id));
      var bai = {
        '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': purl + '#article',
        headline: cat(post.title, 110), url: purl, mainEntityOfPage: purl, inLanguage: 'vi-VN',
        description: cat(post.seoDesc || post.excerpt || post.title, 300),
        author: { '@type': 'Organization', name: ten, url: BASE + 'gioi-thieu.html' },
        publisher: { '@id': ORG_ID },
      };
      if (post.image) bai.image = [abs(post.image)];
      var nd = ngayISO(post.date);
      if (nd) bai.datePublished = nd;
      if (post.cat) bai.articleSection = post.cat;
      ld('hck-page', bai);
      ld('hck-crumb', Object.assign({ '@context': 'https://schema.org', '@id': purl + '#breadcrumb' }, crumbs([
        ['Trang chủ', BASE], ['Cẩm nang chăm con', BASE + 'blog.html'], [cat(post.title, 110), purl],
      ])));
      var moTaBai = cat(post.seoDesc || post.excerpt || post.title, 158);
      meta('description', moTaBai);
      og('og:type', 'article');
      og('og:title', post.seoTitle || post.title);
      og('og:description', moTaBai);
      og('og:image', abs(post.image));
      /* Title gọn: "Tên bài – Hương Chất Kids" (khớp khung xem trước Google trong Quản trị) */
      datTieuDe(post.seoTitle ? cat(post.seoTitle, 70) : post.title + ' – ' + ten);
      return;
    }

    /* ---------- Danh sách sản phẩm / danh mục ---------- */
    if (file === 'collections.html') {
      var loc = [];   // các bộ lọc chính hợp lệ có trong địa chỉ
      [['cat', CATS], ['need', NEEDS], ['age', AGES], ['brand', BRANDS]].forEach(function (k) {
        qs.getAll(k[0]).forEach(function (v) {
          String(v).split(',').forEach(function (x) { var o = tim(k[1], x); if (o) loc.push([k[0], o]); });
        });
      });
      var phu = qs.get('price') || qs.get('tag') || qs.get('km') === '1';
      if (qs.get('q')) meta('robots', 'noindex, follow');   // trang kết quả tìm kiếm không cần lên Google
      if (loc.length === 1 && !phu && !qs.get('q')) {
        var k1 = loc[0][0], o1 = loc[0][1];
        canonical(BASE + 'collections.html?' + k1 + '=' + encodeURIComponent(o1.key));
        var nhan = o1.label || '';
        var mt = {
          cat: nhan + ' chính hãng tại ' + ten + (o1.desc ? ': ' + o1.desc : '') + '. Lọc theo độ tuổi, nhu cầu; mua nhanh không cần tài khoản.',
          need: 'Nhóm sản phẩm "' + nhan + '" chính hãng tại ' + ten + ', thông tin theo nhà sản xuất. Lọc theo độ tuổi, thương hiệu; chuyên gia tư vấn miễn phí.',
          age: 'Sản phẩm dinh dưỡng chính hãng cho bé ' + nhan + ' tại ' + ten + '. Lọc theo nhu cầu, thương hiệu; mua nhanh không cần tài khoản, tư vấn miễn phí.',
          brand: nhan + (o1.origin ? ' (' + o1.origin + ')' : '') + ' chính hãng tại ' + ten + '. Xem giá, phân loại và mua nhanh không cần tài khoản, tư vấn miễn phí.',
        }[k1];
        meta('description', cat(mt, 160));
      } else {
        canonical(BASE + 'collections.html');
      }
      return;
    }

    /* ---------- Trung tâm hỗ trợ: mỗi mục policy.html?p=… là một trang riêng ---------- */
    if (file === 'policy.html') {
      var pk = qs.get('p') || '';
      var pol = null;
      (W.POLICIES || []).forEach(function (x) { if (x && x.key === pk) pol = x; });
      if (pol) {
        canonical(BASE + 'policy.html?p=' + encodeURIComponent(pol.key));
        if (pol.title) meta('description', cat(pol.title + (pol.summary ? ': ' + pol.summary : '') + ' – ' + ten + '. Hỗ trợ ' + (S.workingHours || '8:00 – 22:00') + '.', 160));
      } else {
        canonical(BASE + 'policy.html');
      }
      return;
    }

    /* ---------- Trang tĩnh: chỉ thêm canonical khi HTML chưa có ---------- */
    var TINH = { 'index.html': BASE, 'gioi-thieu.html': BASE + 'gioi-thieu.html', 'doi-tac.html': BASE + 'doi-tac.html' };
    if (TINH[file]) canonical(TINH[file], false);
  } catch (e) {
    /* SEO là lớp phụ: lỗi ở đây không được làm hỏng trang */
  }
})();
