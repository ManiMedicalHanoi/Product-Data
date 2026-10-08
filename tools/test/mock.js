/* Backend giả lập cho Product Data (Playwright). script.google.com bị chặn trong môi trường Claude.
   newPage(browser, {tk:true|false, user:{…}, lag:ms, failWrite:'update'|..., drop:{update:1}, stale:true})
   M.CALLS: mọi lệnh gọi (action, payload, tk). Mã đăng nhập đúng: 123456. */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FALLBACK = JSON.parse(SRC.match(/const FALLBACK=(\[.*?\]);\n/s)[1]);
const USERS = {
  'mmh.product': { pic: 'Giang', level: 'lead', admin: true, dept: 'Sales & Marketing VN', title: 'Team Leader', perms: {} },
  'marketing.mmh1': { pic: 'Duc Anh', level: 'pic', admin: false, dept: 'Sales & Marketing VN', title: '', perms: { pd: { e: 1 } } },
  'mmh.hanoi': { pic: 'Viet', level: 'lead', admin: false, dept: 'Sales & Marketing VN', title: 'Team Leader', perms: {} }
};
function pub(local) { const u = USERS[local]; return Object.assign({ email: local + '@manimedicalhanoi.com', local }, u); }

async function newPage(browser, o = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1360, height: 860 }, locale: 'vi-VN' }, o.ctx || {}));
  const page = await ctx.newPage();
  const M = page.M = { CALLS: [], DB: JSON.parse(JSON.stringify(FALLBACK)).map((p, i) => Object.assign(p, { _row: i + 4 })), drop: Object.assign({}, o.drop || {}) };
  const who = o.as || 'mmh.product';
  if (o.tk !== false) {
    await ctx.addInitScript(([u]) => {
      try { if (!localStorage.getItem('mmh_tk')) localStorage.setItem('mmh_tk', JSON.stringify({ tk: 'tk.' + u.local, exp: Date.now() + 864e5 * 20, user: u, at: Date.now() })); } catch (_) {}
    }, [pub(who)]);
  }
  if (o.hideUpd) await ctx.addInitScript(() => { try { localStorage.setItem('pd_upd_hide', JSON.stringify({ '2026-10-08-v2.0': 1 })); } catch (_) {} });
  if (o.time) await page.clock.setFixedTime(new Date(o.time));
  const img = o.img && fs.existsSync(o.img) ? fs.readFileSync(o.img) : null;
  await page.route(/googleusercontent\.com|drive\.google\.com\/thumbnail|docs\.google\.com|drive\.google\.com\/file|youtube\.com/, r => {
    if (img && r.request().resourceType() === 'image') return r.fulfill({ status: 200, contentType: 'image/jpeg', body: img });
    return r.fulfill({ status: 200, contentType: 'text/html', body: '<html><head><meta charset="utf-8"></head><body style="margin:0;background:#F4F7FB;font:14px Aptos,Segoe UI;color:#7A8999;display:grid;place-items:center;height:100vh">Xem trước tài liệu (giả lập)</body></html>' });
  });
  await page.route(/script\.google\.com/, async route => {
    const req = route.request();
    if (req.resourceType() === 'script' && o.noScriptTag) return route.fulfill({ status: 404, body: '' });
    const u = new URL(req.url()); const q = Object.fromEntries(u.searchParams);
    let body = {}; if (req.method() === 'POST') body = Object.fromEntries(new URLSearchParams(req.postData() || ''));
    const a = q.action || body.action, cb = q.callback;
    let pl = {}; try { pl = JSON.parse(q.payload || body.payload || '{}'); } catch (_) {}
    M.CALLS.push({ a, pl, tk: q.tk || '', t: Date.now() });
    let res;
    const tkUser = (q.tk || '').replace(/^tk\./, '');
    if (a === 'rhAuthStart') res = USERS[(q.email || '').split('@')[0]] ? { ok: true, gap: 45 } : { ok: false, error: 'Email chưa có trong danh sách người dùng.' };
    else if (a === 'rhAuthVerify') res = q.code === '123456' ? { ok: true, token: 'tk.' + q.email.split('@')[0], exp: Date.now() + 864e5 * 30, user: pub(q.email.split('@')[0]) } : { ok: false, error: 'Mã chưa đúng.' };
    else if (a === 'rhAuthMe') res = o.revoked ? { ok: false, code: 'AUTH', error: 'Phiên đăng nhập đã bị thu hồi.' } : (USERS[tkUser] ? { ok: true, user: pub(tkUser) } : { ok: false, code: 'AUTH', error: 'Phiên không hợp lệ.' });
    else if (a === 'list') res = { ok: true, data: o.stale && M.CALLS.filter(c => c.a === 'list').length > 1 ? JSON.parse(JSON.stringify(M.STALE || M.DB)) : JSON.parse(JSON.stringify(M.DB)) };
    else if (a === 'upload') res = { ok: true, url: 'https://drive.google.com/file/d/UP' + Date.now().toString(36) + '/view' };
    else if (a === 'move') res = { ok: true, url: pl.url };
    else if (a === 'remove_link') res = { ok: true };
    else if (a === 'update' || a === 'create') {
      if (o.failWrite === a) res = { ok: false, error: 'Không có quyền ghi Sheet (giả lập).' };
      else if (M.drop[a] > 0) { M.drop[a]--; if (a === 'create') M.DB.push(Object.assign({}, pl.data, { _row: M.DB.length + 4 })); return route.abort(); }
      else if (a === 'update') { const p = M.DB.find(x => x._row === pl._row); if (!p) res = { ok: false, error: 'Không thấy dòng' }; else { Object.assign(p, pl.data); res = { ok: true }; } }
      else { M.DB.push(Object.assign({}, pl.data, { _row: M.DB.length + 4 })); res = { ok: true, row: M.DB.length + 3 }; }
    } else res = { ok: false, error: 'Unknown action ' + a };
    if (o.lag) await new Promise(r => setTimeout(r, o.lag));
    const txt = cb ? cb + '(' + JSON.stringify(res) + ')' : JSON.stringify(res);
    return route.fulfill({ status: 200, contentType: cb ? 'application/javascript' : 'application/json', headers: { 'access-control-allow-origin': '*' }, body: txt });
  });
  return page;
}
module.exports = { newPage, FALLBACK, USERS, ROOT };
