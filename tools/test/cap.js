/* Ảnh cho thông báo: NODE_PATH=$(npm root -g) node tools/test/cap.js  → updates/v2.0/*.jpg (dữ liệu giả lập) */
const { chromium } = require('playwright'); const { newPage } = require('./mock');
const URL0 = 'http://127.0.0.1:8767/index.html', OUT = 'updates/v2.0/'; const wait = ms => new Promise(r => setTimeout(r, ms));
const IMG = process.env.IMG || '/tmp/claude-0/prod.jpg';
async function mark(p, list) { // số chú thích màu cam
  await p.evaluate(list => { list.forEach(([sel, n]) => { const e = document.querySelector(sel); if (!e) return; const r = e.getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'mk-n'; d.textContent = n;
    d.style.cssText = `position:fixed;z-index:99999;left:${r.left - 12}px;top:${r.top - 12}px;width:24px;height:24px;border-radius:50%;background:#E07B39;color:#fff;font:700 13px Aptos,Segoe UI;display:grid;place-items:center;box-shadow:0 0 0 2px #fff`;
    const f = document.createElement('div'); f.className = 'mk-n'; f.style.cssText = `position:fixed;z-index:99998;left:${r.left - 4}px;top:${r.top - 4}px;width:${r.width + 8}px;height:${r.height + 8}px;border:2px solid #E07B39;border-radius:10px;pointer-events:none`;
    document.body.append(f, d); }); }, list);
}
(async () => {
  const b = await chromium.launch();
  // đăng nhập
  let p = await newPage(b, { tk: false, img: IMG, ctx: { viewport: { width: 1100, height: 700 } } });
  await p.goto(URL0); await wait(400); await p.fill('#au-email', 'ten.nhanvien@manimedicalhanoi.com');
  await p.screenshot({ path: '/tmp/claude-0/l1.png' });
  await p.route(/script\.google\.com/, r => { const u = new URL(r.request().url()); if (u.searchParams.get('action') === 'rhAuthStart') return r.fulfill({ contentType: 'application/javascript', body: u.searchParams.get('callback') + '({"ok":true,"gap":45})' }); r.fallback(); });
  await p.click('.au-btn'); await p.waitForSelector('#au-code'); await p.fill('#au-code', '12'); await p.screenshot({ path: '/tmp/claude-0/l2.png' });
  await p.context().close();
  // quyền: chip tên + quyền, nút Thêm (Admin) / người chỉ xem
  for (const [as, f] of [['mmh.hanoi', 'r1'], ['mmh.product', 'r2']]) {
    p = await newPage(b, { as, img: IMG, hideUpd: true, ctx: { viewport: { width: 1280, height: 760 } } }); await p.goto(URL0); await wait(1200);
    await mark(p, f === 'r2' ? [['#pd-me', 1], ['.nav-btn.solid', 2]] : [['#pd-me', 1]]);
    await p.screenshot({ path: `/tmp/claude-0/${f}.png`, clip: { x: 560, y: 0, width: 720, height: 120 } }); await p.context().close();
  }
  // đang lưu
  p = await newPage(b, { img: IMG, hideUpd: true, lag: 8000, ctx: { viewport: { width: 1280, height: 760 } } }); await p.goto(URL0); await p.waitForSelector('.pcard'); await wait(9000);
  await p.locator('.pcard').nth(2).click(); await wait(400); await p.click('.modal-edit'); await p.fill('#f_tagline', 'Cắt nhanh, an toàn — thiết kế cho ca khó'); await p.click('#saveBtn'); await wait(300);
  await mark(p, [['#pd-q', 1]]);
  await p.screenshot({ path: '/tmp/claude-0/s1.png' }); await p.context().close();
  await b.close();
})();
