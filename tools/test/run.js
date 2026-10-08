/* Kiểm thử v2.0: NODE_PATH=$(npm root -g) node tools/test/run.js  (cần python3 -m http.server 8767 ở thư mục repo) */
const { chromium } = require('playwright');
const { newPage } = require('./mock');
const URL0 = 'http://127.0.0.1:8767/index.html';
let fail = 0; const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) fail++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const IMG = '/tmp/claude-0/prod.jpg';
  // 1. màn đăng nhập
  let p = await newPage(b, { tk: false, img: IMG });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL0); await wait(500);
  ok(await p.isVisible('#pd-gate'), 'chưa đăng nhập ⇒ màn đăng nhập');
  ok(!(await p.M.CALLS.some(c => c.a === 'list')), 'chưa đăng nhập ⇒ không tải dữ liệu');
  await p.fill('#au-email', 'mmh.product'); await p.click('.au-btn'); await p.waitForSelector('#au-code');
  await p.fill('#au-code', '123456'); await wait(1200);
  ok(!(await p.isVisible('#pd-gate')), 'đăng nhập mã đúng ⇒ vào app');
  ok(await p.locator('.pcard').count() === 26, '26 sản phẩm hiện ra');
  ok(await p.evaluate(() => !window.gsap && !window.Swiper && !window.ScrollTrigger), 'không còn GSAP / Swiper');
  ok(p.M.CALLS.filter(c => c.a === 'list').every(c => c.tk === 'tk.mmh.product'), 'lệnh list gắn tk');
  ok(await p.isVisible('#pd-upd'), 'thông báo cập nhật v2.0 hiện khi đăng nhập');
  await p.click('#pd-upd .ft button');
  ok(errs.length === 0, 'không lỗi JS ' + errs.join(' | '));
  await p.context().close();

  // 2. mở tức thì từ dữ liệu lưu
  p = await newPage(b, { img: IMG, hideUpd: true });
  await p.goto(URL0); await wait(900);
  await p.route(/script\.google\.com/, async r => { await wait(4000); r.fallback(); });
  const t0 = Date.now(); await p.reload(); await p.waitForSelector('.pcard'); const dt = Date.now() - t0;
  ok(dt < 1500 && await p.locator('.pcard').count() === 26, 'mở lại: hiện 26 thẻ từ bộ nhớ sau ' + dt + ' ms (backend chậm 4 s)');
  ok(/lưu trên máy/.test(await p.textContent('#connText')), 'thanh trạng thái báo đang dùng dữ liệu lưu trên máy');
  await p.context().close();

  // 3. quyền
  for (const [as, e, d] of [['mmh.hanoi', 0, 0], ['marketing.mmh1', 1, 0], ['mmh.product', 1, 1]]) {
    p = await newPage(b, { as, img: IMG, hideUpd: true }); await p.goto(URL0); await wait(900);
    await p.locator('.pcard').first().click(); await wait(400);
    const edit = await p.isVisible('.modal-edit'), add = await p.isVisible('.nav-btn.solid');
    const del = await p.locator('.mbtn.del').first().isVisible().catch(() => false);
    ok(edit === !!e && add === !!e, as + ': nút Sửa / Thêm ' + (e ? 'hiện' : 'ẩn'));
    if (await p.locator('.mbtn.del').count()) ok(await p.evaluate(()=>!document.body.classList.contains("pd-nodel")) === !!d, as + ': nút Xoá ' + (d ? 'hiện' : 'ẩn'));
    if (!e) { await p.evaluate(() => openEdit(null)); ok(!(await p.isVisible('#editOverlay.open')), as + ': gọi openEdit bị chặn'); }
    await p.context().close();
  }

  // 4. sửa: hiện ngay, ghi ngầm (backend chậm 1.5 s)
  p = await newPage(b, { img: IMG, hideUpd: true, lag: 1500 }); await p.goto(URL0); await p.waitForSelector('.pcard'); await wait(1800);
  await p.locator('.pcard').first().click(); await wait(300);
  await p.click('.modal-edit'); await p.fill('#f_tagline', 'Tagline mới (test)');
  const t1 = Date.now(); const js = await p.evaluate(() => { const t = performance.now(); document.getElementById('saveBtn').click(); return Math.round(performance.now() - t); });
  await p.waitForFunction(() => /Tagline mới/.test(document.querySelector('#detailModal').textContent)); const dt1 = Date.now() - t1;
  ok(js < 300, 'lưu sửa: màn hình cập nhật xong trong ' + js + ' ms (không chờ máy chủ)');
  ok(/Đang lưu/.test(await p.textContent('#pd-q')), 'chip "Đang lưu…"');
  await wait(2500);
  ok(p.M.DB[0].tagline === 'Tagline mới (test)', 'Sheet (giả lập) đã nhận thay đổi');
  ok(/Đã lưu/.test(await p.textContent('#pd-q')), 'chip "Đã lưu vào Sheet"');
  const upd = p.M.CALLS.filter(c => c.a === 'update').pop();
  ok(upd && Object.keys(upd.pl.data).join() === 'tagline', 'chỉ gửi ô đã đổi: ' + (upd && Object.keys(upd.pl.data)));
  // xoá tài liệu (admin)
  const nDel = await p.locator('#tab-mkt .mbtn.del, #detailModal .mbtn.del').count();
  if (nDel) {
    await p.evaluate(() => { const t = [...document.querySelectorAll('#detailModal .tab')].find(x => /Marketing/.test(x.textContent)); t && t.click(); });
    const col = await p.evaluate(() => { const b = document.querySelector('#detailModal .pane.active .docpane.active .mbtn.del'); return b && b.getAttribute('onclick'); });
    if (col) {
      const before = await p.evaluate(() => document.querySelectorAll('#detailModal .pane.active .docpane.active .mcard').length);
      await p.evaluate(c => eval(c), col); await p.click('.cf-btn.danger'); await wait(200);
      const after = await p.evaluate(() => document.querySelectorAll('#detailModal .pane.active .docpane.active .mcard').length);
      ok(after === before - 1, 'xoá tài liệu: biến mất ngay (' + before + '→' + after + ')');
      await wait(3800); ok(p.M.CALLS.some(c => c.a === 'remove_link'), 'đã gửi remove_link + update');
    }
  }
  await p.context().close();

  // 5. thêm mới, mất phản hồi ⇒ kiểm tra trước khi gửi lại, không tạo trùng
  p = await newPage(b, { img: IMG, hideUpd: true, drop: { create: 1 } }); await p.goto(URL0); await p.waitForSelector('.pcard'); await wait(800);
  await p.evaluate(() => openEdit(null)); await p.fill('#f_name', 'SP Test 001'); await p.fill('#f_group', 'Nhóm test');
  await p.click('#saveBtn'); await wait(200);
  ok(await p.locator('.pcard').count() === 27, 'thêm mới: thẻ hiện ngay');
  await wait(4500);
  ok(p.M.DB.filter(x => x.name === 'SP Test 001').length === 1, 'mất phản hồi lần đầu ⇒ không tạo trùng (DB có 1 dòng)');
  ok(p.M.CALLS.filter(c => c.a === 'create').length === 1, 'không gửi lại create vì đã thấy trên Sheet');
  await wait(1000);
  ok(await p.locator('.pcard').count() === 27, 'sau đồng bộ vẫn 27 thẻ');
  await p.context().close();

  // 6. lỗi thật ⇒ chip đỏ + Thử lại / Bỏ; thao tác còn sau khi tải lại trang
  p = await newPage(b, { img: IMG, hideUpd: true, failWrite: 'update' }); await p.goto(URL0); await p.waitForSelector('.pcard'); await wait(800);
  await p.locator('.pcard').nth(1).click(); await p.click('.modal-edit'); await p.fill('#f_type', 'Loại test'); await p.click('#saveBtn'); await wait(800);
  ok(await p.isVisible('#pd-q.err'), 'lỗi ghi ⇒ chip đỏ');
  ok(await p.locator('#pd-q button').count() === 2, 'có nút Thử lại / Bỏ');
  const q = await p.evaluate(() => JSON.parse(localStorage.getItem('pd_outbox_v1') || '[]').length);
  ok(q === 1, 'lệnh lỗi được giữ trong hàng đợi');
  await p.context().close();

  // 7. dữ liệu cũ từ máy chủ không làm mất thao tác đang chờ
  p = await newPage(b, { img: IMG, hideUpd: true, lag: 2500 }); await p.goto(URL0); await p.waitForSelector('.pcard'); await wait(3000);
  await p.locator('.pcard').first().click(); await p.click('.modal-edit'); await p.fill('#f_tagline', 'Giữ nguyên khi đồng bộ'); await p.click('#saveBtn');
  await p.evaluate(() => loadData(false)); await wait(300);
  ok(/Giữ nguyên khi đồng bộ/.test(await p.textContent('#detailModal')), 'đồng bộ giữa chừng vẫn giữ thay đổi trên màn hình');
  await wait(6000);
  ok(p.M.DB[0].tagline === 'Giữ nguyên khi đồng bộ', 'sau đó lưu đúng lên Sheet');
  await p.context().close();

  // 8. phiên bị thu hồi
  p = await newPage(b, { img: IMG, hideUpd: true, revoked: true }); await p.goto(URL0); await wait(3500);
  ok(await p.isVisible('#pd-gate'), 'phiên bị thu hồi ⇒ về màn đăng nhập');
  await p.context().close();

  // 9. điện thoại
  p = await newPage(b, { img: IMG, hideUpd: true, ctx: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }); await p.goto(URL0); await wait(1000);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 392, 'điện thoại: không cuộn ngang (' + sw + ')');
  await p.context().close();
  await b.close();
  console.log(fail ? `\n${fail} lỗi` : '\nTất cả đạt'); process.exit(fail ? 1 : 0);
})();
