// Browser behaviour: filters, booking mode, trip dialogs, price calculator, enquiry form, hero guilloche.
// Everything else is rendered at build time from src/content/trips.
import type { AccessLevel, Lang } from '../lib/constants';
import { formatDates, formatRupiah as fmt } from '../lib/format';

type Mode = 'private' | 'group';
interface ClientTrip {
  id: string;
  title: string;
  days: number;
  price: Record<Mode, number>;
  departures: string[];
  level: AccessLevel;
}
interface ClientData {
  lang: Lang;
  locale: string;
  alts: string;
  trips: ClientTrip[];
  t: Record<string, string>;
}

const data = JSON.parse(document.getElementById('kelana-data')!.textContent!) as ClientData;
const t = (key: string, vars: Record<string, string | number> = {}) =>
  Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), data.t[key] ?? key);
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));
const byId = (id: string) => data.trips.find((j) => j.id === id);
const noteClass = (lv: AccessLevel) => (lv === 'not-suitable' ? 'warn' : lv === 'step-free' ? 'ok' : '');
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const input = (sel: string) => $<HTMLInputElement>(sel);
const select = (sel: string) => $<HTMLSelectElement>(sel);

/* ---------- State ---------- */
const filters = { type: 'all', season: 'all', wc: false };
const st = {
  jid: data.trips[0]?.id ?? '',
  mode: 'private' as Mode,
  n: 2,
  cabin: 'b',
  stay: 's',
  stop: false,
  photo: false,
  chef: false,
  wc: false,
};

/* ---------- Filters ---------- */
const cards = $$('.j-card');
function applyFilter() {
  let shown = 0;
  for (const card of cards) {
    const { type, seasons = '', access } = card.dataset;
    const ok =
      (filters.type === 'all' || type === filters.type) &&
      (filters.season === 'all' || seasons.split(' ').includes(filters.season)) &&
      (!filters.wc || access !== 'not-suitable');
    card.hidden = !ok;
    if (ok) shown++;
  }
  $('#j-empty').hidden = shown > 0;
  for (const group of $$('[data-filter]')) {
    const key = group.dataset.filter as 'type' | 'season';
    for (const chip of $$('.chip', group)) chip.setAttribute('aria-pressed', String(chip.dataset.v === filters[key]));
  }
  $('#f-wc').setAttribute('aria-pressed', String(filters.wc));
}
for (const group of $$('[data-filter]')) {
  group.addEventListener('click', (e) => {
    const chip = (e.target as Element).closest<HTMLElement>('.chip');
    if (!chip) return;
    filters[group.dataset.filter as 'type' | 'season'] = chip.dataset.v!;
    applyFilter();
  });
}
$('#f-wc').addEventListener('click', () => {
  filters.wc = !filters.wc;
  applyFilter();
});

/* ---------- Booking mode (prices for both modes are in the HTML; CSS shows one) ---------- */
function setMode(m: string) {
  st.mode = m === 'group' ? 'group' : 'private';
  document.documentElement.dataset.mode = st.mode;
  for (const b of $$('.modes button')) b.setAttribute('aria-pressed', String(b.dataset.mode === st.mode));
  input('#mode-p').checked = st.mode === 'private';
  input('#mode-g').checked = st.mode === 'group';
  renderReceipt();
}
$('.modes').addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('button');
  if (b) setMode(b.dataset.mode!);
});

/* ---------- Trip dialogs ---------- */
const scrollToForm = (sectionId: string) => {
  $(sectionId).scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#eq-name').focus({ preventScroll: true }), 500);
};
$('#j-grid').addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('.j-open');
  if (!b) return;
  const dlg = document.getElementById(`jd-${b.dataset.id}`) as HTMLDialogElement | null;
  if (!dlg) return;
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
});
for (const dlg of $$<HTMLDialogElement>('dialog.jd')) {
  const close = () => (dlg.close ? dlg.close() : dlg.removeAttribute('open'));
  dlg.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (target === dlg || target.closest('.jd-close')) return close();
    const act = target.closest<HTMLElement>('[data-act]');
    if (!act) return;
    const id = dlg.dataset.id!;
    close();
    if (act.dataset.act === 'price') {
      select('#calc-journey').value = id;
      st.jid = id;
      renderReceipt();
      $('#pricing').scrollIntoView({ behavior: 'smooth' });
    } else {
      select('#eq-journey').value = id;
      select('#eq-mode').value = st.mode;
      scrollToForm('#enquire');
    }
  });
}

/* ---------- Price calculator ---------- */
function calcTotal() {
  const j = byId(st.jid) ?? data.trips[0];
  const pp = j.price[st.mode] * 1e6;
  const n = st.n;
  const lines: [string, number][] = [[`${j.title} · ${t('m.' + st.mode)} × ${n}`, pp * n]];
  if (st.cabin === 'f') lines.push([`${t('r_first')} × ${n}`, 95e6 * n]);
  if (st.stay === 'u') lines.push([`${t('r_suite')} × ${n}`, Math.round(pp * 0.18) * n]);
  if (st.stop) lines.push([`${t('r_stop')} × ${n}`, 11e6 * n]);
  if (n === 1) lines.push([t('r_single'), Math.round(pp * 0.35)]);
  if (st.photo) lines.push([t('r_photo'), 14e6]);
  if (st.chef) lines.push([t('r_chef'), 9.5e6]);
  if (st.wc) lines.push([t('r_wc'), 0]);
  return { j, lines, total: lines.reduce((s, l) => s + l[1], 0) };
}
function renderReceipt() {
  const { j, lines, total } = calcTotal();
  $('#calc-n').textContent = String(st.n);
  $<HTMLButtonElement>('#n-minus').disabled = st.n <= 1;
  $<HTMLButtonElement>('#n-plus').disabled = st.n >= 8;
  const wcNote = st.wc
    ? `<p class="note-box ${noteClass(j.level)}">${esc(t('warn.' + j.level, { name: j.title, alts: data.alts }))}</p>`
    : '';
  $('#receipt').innerHTML = `<p class="eyebrow">${t('r_title')}</p>
    <ul class="r-lines">${lines.map(([a, b]) => `<li><span>${esc(a)}</span><span>${b ? fmt(b) : t('r_incl')}</span></li>`).join('')}</ul>
    ${st.mode === 'group' ? `<p class="r-dep">${t('deps')}: ${formatDates(j.departures, data.lang)}</p>` : ''}
    ${wcNote}
    <div class="r-total"><span class="j-meta">${t('r_total')}</span><span class="big">${fmt(total)}</span></div>
    <div class="r-sub"><span>${t('r_pp')}</span><span>${fmt(total / st.n)}</span></div>
    <div class="r-sub"><span>${t('r_inst')}</span><span>${fmt(total / 12)}</span></div>
    <p class="r-note">${t('r_note')}</p>`;
}
const calc = $<HTMLFormElement>('#calc');
calc.addEventListener('change', (e) => {
  st.jid = select('#calc-journey').value;
  st.cabin = input('#cabin-f').checked ? 'f' : 'b';
  st.stay = input('#stay-u').checked ? 'u' : 's';
  st.stop = input('#add-stop').checked;
  st.photo = input('#add-photo').checked;
  st.chef = input('#add-chef').checked;
  st.wc = input('#calc-wc').checked;
  if ((e.target as HTMLInputElement).name === 'mode') return setMode(input('#mode-g').checked ? 'group' : 'private');
  renderReceipt();
});
calc.addEventListener('submit', (e) => e.preventDefault());
$('#n-minus').addEventListener('click', () => {
  if (st.n > 1) { st.n--; renderReceipt(); }
});
$('#n-plus').addEventListener('click', () => {
  if (st.n < 8) { st.n++; renderReceipt(); }
});
$('#r-send').addEventListener('click', () => {
  const { total } = calcTotal();
  select('#eq-journey').value = st.jid;
  select('#eq-trav').value = String(st.n);
  select('#eq-mode').value = st.mode;
  input('#eq-wc').checked = st.wc;
  $<HTMLTextAreaElement>('#eq-notes').value = t('est', {
    total: fmt(total),
    n: st.n,
    t: st.n > 1 ? t('travN') : t('trav1'),
    mode: t('m.' + st.mode).toLowerCase(),
  });
  scrollToForm('#enquire');
});

/* ---------- Enquiry (demo: nothing is sent) ---------- */
$('#eq').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = input('#eq-name').value.trim();
  const wa = input('#eq-wa').value.replace(/[^\d]/g, '').replace(/^0+/, '');
  const err = $('#eq-err');
  const done = $('#eq-done');
  done.hidden = true;
  const msg = !name ? t('e_name') : wa.length < 8 || wa.length > 13 ? t('e_wa') : '';
  if (msg) {
    err.textContent = msg;
    err.hidden = false;
    (name ? input('#eq-wa') : input('#eq-name')).focus();
    return;
  }
  err.hidden = true;
  const j = byId(select('#eq-journey').value);
  const mv = select('#eq-mode').value;
  let out = t('thanks', {
    name,
    journey: j ? j.title : t('unsure').toLowerCase(),
    wa,
    mode: mv === 'unsure' ? '' : t('m.' + mv).toLowerCase(),
  }).replace('  ', ' ');
  if (input('#eq-wc').checked) out += j?.level === 'not-suitable' ? t('thanks_wcno') : t('thanks_wc');
  done.textContent = out;
  done.hidden = false;
});

renderReceipt();

/* ---------- Guilloche hero ---------- */
const cv = $<HTMLCanvasElement>('#rosette');
const ctx = cv.getContext('2d')!;
const hero = $('.hero');
const pass = $('.pass');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
let W = 0, H = 0, cx = 0, cy = 0, R = 0, phase = 0, running = false, raf = 0, last = 0;
const col: Record<string, string> = {};
function readCols() {
  const cs = getComputedStyle(document.documentElement);
  for (const k of ['teal', 'rose', 'line']) col[k] = cs.getPropertyValue('--' + k).trim() || '#888';
}
function size() {
  const r = hero.getBoundingClientRect();
  const p = pass.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = r.width; H = r.height;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx = p.left - r.left + p.width / 2;
  cy = p.top - r.top + p.height / 2;
  R = Math.min(Math.max(p.width, p.height) * 0.8, 440);
}
function ring(rad: number, lobes: number, ph: number, amp: number, color: string, alpha: number) {
  ctx.beginPath(); ctx.strokeStyle = color; ctx.globalAlpha = alpha;
  const steps = 720;
  for (let s = 0; s <= steps; s++) {
    const a = (s / steps) * Math.PI * 2;
    const r = rad * (1 + amp * Math.sin(lobes * a + ph) + amp * 0.45 * Math.sin(lobes * 2.5 * a - ph * 1.7));
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
}
function draw() {
  ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1;
  ctx.strokeStyle = col.line; ctx.globalAlpha = 0.75;
  for (let k = 0; k < 12; k++) {
    ctx.beginPath();
    const base = H * 0.08 + k * ((H * 0.84) / 11);
    for (let x = 0; x <= W + 6; x += 6) {
      const y = base + Math.sin(x * 0.009 + k * 0.42 + phase * 0.8) * 9 + Math.sin(x * 0.021 - k * 0.3) * 4;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 20; i++) {
    const rose = i % 4 === 0;
    ring(R * (0.78 + (i % 2) * 0.05), 12, i * 0.16 + phase, 0.11, rose ? col.rose : col.teal, rose ? 0.4 : 0.38);
  }
  for (let i = 0; i < 10; i++) ring(R * 1.08, 18, i * 0.2 - phase * 0.6, 0.04, col.teal, 0.22);
  ctx.globalAlpha = 1;
}
function loop(ts: number) {
  if (!running) return;
  if (ts - last > 40) { phase += 0.006; draw(); last = ts; }
  raf = requestAnimationFrame(loop);
}
function start() {
  if (running || reduce.matches) return;
  running = true; raf = requestAnimationFrame(loop);
}
function stop() { running = false; cancelAnimationFrame(raf); }
function refresh() { readCols(); size(); draw(); }
refresh();
if ('IntersectionObserver' in window) new IntersectionObserver((es) => (es[0].isIntersecting ? start() : stop())).observe(hero);
else start();
if ('ResizeObserver' in window) new ResizeObserver(() => { size(); draw(); }).observe(hero);
else window.addEventListener('resize', refresh);
document.fonts?.ready.then(refresh);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', refresh);
new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
reduce.addEventListener?.('change', () => { reduce.matches ? stop() : start(); draw(); });
