// משותף לשני הדפים: איתור השרת, קריאה ושליחה
const REPO = 'ea649/rebbe-wedding-table';
export const BRANCHES = ['גדרה', 'יקנעם', 'קרית גת', 'אביטל תע״ך', 'אשקלון', 'באר שבע', 'ביאליק', 'רמת ישי', 'מגדל', 'גני תקווה', 'ראשל״צ', 'חולון', 'נתניה', 'חיפה', 'מזכרת בתיה', 'אור עקיבא', 'באר יעקב', 'ירושלים'];
export const CAT_NAMES = { general: 'מתנה', kippah: 'כיפה', tzniut: 'פנינים של צניעות', staff: 'זר של צוות מאוחד', pedagogy: 'עשייה פדגוגית', tefila: 'סידור', torah: 'חומש', shabbat: 'נרות שבת', tzedaka: 'קופת צדקה', light: 'מנורה מאירה', parents: 'בית חם', ahava: 'לב של אהבת ישראל', students: 'שתיל צומח', mivtzaim: 'מזוזה' };

let api = location.hostname === 'localhost' ? 'http://127.0.0.1:3078' : null; // בדיקה מקומית
async function resolveApi() {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/config.json?ref=main&t=${Date.now()}`, { headers: { Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' });
    if (r.ok) { const j = await r.json(); if (j.api) return (api = j.api); }
  } catch {}
  try {
    const r = await fetch('config.json?t=' + Date.now(), { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); if (j.api) return (api = j.api); }
  } catch {}
  return null;
}

async function call(path, opts = {}, retry = true) {
  if (!api) await resolveApi();
  if (!api) throw new Error('offline');
  try {
    const r = await fetch(api + path, { ...opts, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (r.status >= 500 || (r.status >= 400 && !j.error)) throw new Error('offline');
    return { ok: r.ok, status: r.status, ...j };
  } catch (e) {
    if (retry) { api = null; return call(path, opts, false); }
    throw new Error('offline');
  }
}

export async function getState() {
  try { const s = await call('/api/state'); if (s.ok) return { ...s, live: true }; } catch {}
  try { const r = await fetch('state.json?t=' + Date.now(), { cache: 'no-store' }); if (r.ok) return { ...(await r.json()), live: false }; } catch {}
  return { seats: 20, taken: {}, gifts: [], live: false };
}
export const post = (path, data) => call(path, { method: 'POST', body: JSON.stringify(data) });

export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function fillBranches(sel) {
  sel.innerHTML = '<option value="">בחרי סניף</option>' + BRANCHES.map((b) => `<option>${b}</option>`).join('') + '<option value="אחר">אחר</option>';
}
