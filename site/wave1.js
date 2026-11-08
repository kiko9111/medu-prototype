// Medu on-site edition, wave 1 (kareem's "go", 7 Nov 2026):
//   #6  visit planner card   #17 prayer-aware show   #5 anonymous pilot counter   #37 "I stood here" card
// Kept in its own file so other threads can work on index.html. It wraps the page's global functions
// (openStop, finishStop, renderWalk, planSheet, settingsSheet) instead of editing them.
// Everything marked [VERIFY] must be checked on site or against a source before launch.
'use strict';
(() => {
// ================================================================ config [VERIFY all]
const CAIRO_TZ = 'Africa/Cairo';
const OPEN = { from: '08:00', to: '17:00' };     // [VERIFY] commonly listed hours; last entry may be earlier
const PRAYER_HOLD = { before: 5, after: 25 };    // [VERIFY] minutes inside stops pause around each adhan
const FRIDAY_HOLD = { before: 75, after: 60 };   // [VERIFY] Friday: closed to visitors around the midday prayer
const INSIDE = (n) => n >= 5 && n <= 11;          // stops 5 to 11 are inside the mosque
const PILOT_ENDPOINT = (document.querySelector('meta[name="medu-pilot"]') || {}).content || ''; // empty = count on this phone only

// a fake clock for previews: ?now=2026-11-06T11:50 (Cairo time)
const NOW_Q = new URLSearchParams(location.search).get('now');
let nowOff = 0;
if (NOW_Q) { const t = cairoToDate(NOW_Q.slice(0, 10), NOW_Q.slice(11, 16) || '09:00'); if (t) nowOff = t - Date.now(); }
const now = () => new Date(Date.now() + nowOff);

// ================================================================ time helpers (Cairo wall clock)
function cairoParts(d) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: CAIRO_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false });
  const o = {}; for (const p of f.formatToParts(d)) o[p.type] = p.value; if (o.hour === '24') o.hour = '00';
  return o;
}
function cairoOffsetMin(d) { const p = cairoParts(d); const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute); return Math.round((asUTC - Math.floor(d.getTime() / 60000) * 60000) / 60000); }
function cairoToDate(ymd, hm) {
  const [y, m, d] = ymd.split('-').map(Number), [H, M] = hm.split(':').map(Number); if (!y || !m || !d) return null;
  const guess = new Date(Date.UTC(y, m - 1, d, H, M)); const off = cairoOffsetMin(guess);
  return new Date(guess.getTime() - off * 60000);
}
const hm = (d) => { const p = cairoParts(d); return p.hour + ':' + p.minute; };
const ymdOf = (d) => { const p = cairoParts(d); return p.year + '-' + p.month + '-' + p.day; };
const addMin = (d, m) => new Date(d.getTime() + m * 60000);
const dayName = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: CAIRO_TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(d);
const isFriday = (d) => cairoParts(d).weekday === 'Fri';

// ================================================================ #17 prayer times (Egyptian General Authority of Survey)
// Fajr 19.5°, Isha 17.5°, Asr Shafi'i (shadow 1), Maghrib = sunset. Standard solar formulas (PrayTimes.org method).
const MOSQUE_LL = { lat: 30.0322, lon: 31.2565 }; // [VERIFY] same point as the on-site gate
const rad = (x) => x * Math.PI / 180, deg = (x) => x * 180 / Math.PI;
const fixA = (a) => { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; };
const fixH = (h) => { h = h - 24 * Math.floor(h / 24); return h < 0 ? h + 24 : h; };
function sunPos(jd) {
  const D = jd - 2451545.0, g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D);
  const L = fixA(q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g))), e = 23.439 - 0.00000036 * D;
  const RA = fixH(deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15);
  return { decl: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L)))), eqt: q / 15 - RA };
}
function prayerTimes(ymd) {
  const [y, m, d] = ymd.split('-').map(Number), lat = MOSQUE_LL.lat, lon = MOSQUE_LL.lon;
  let Y = y, M = m; if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  const jd0 = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5 - lon / (15 * 24);
  const mid = (t) => fixH(12 - sunPos(jd0 + t).eqt);
  const ang = (a, t, ccw) => { const s = sunPos(jd0 + t); const v = deg(Math.acos((-Math.sin(rad(a)) - Math.sin(rad(s.decl)) * Math.sin(rad(lat))) / (Math.cos(rad(s.decl)) * Math.cos(rad(lat))))) / 15; return mid(t) + (ccw ? -v : v); };
  const asr = (t) => { const s = sunPos(jd0 + t); const a = -deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - s.decl)))))); return ang(a, t, false); };
  let T = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
  for (let i = 0; i < 2; i++) T = { fajr: ang(19.5, T.fajr / 24, true), sunrise: ang(0.833, T.sunrise / 24, true), dhuhr: mid(T.dhuhr / 24), asr: asr(T.asr / 24), sunset: ang(0.833, T.sunset / 24, false), isha: ang(17.5, T.isha / 24, false) };
  // hours are local mean solar time at lon; convert to UTC
  const toDate = (h) => { const u = h - lon / 15; return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) + Math.round(u * 60) * 60000); };
  const out = {}; for (const k in T) out[k] = toDate(T[k]);
  out.dhuhr = addMin(out.dhuhr, 1); out.maghrib = out.sunset;
  return out;
}
// windows when inside stops pause, for one Cairo day
function holds(ymd) {
  const P = prayerTimes(ymd), fri = isFriday(cairoToDate(ymd, '12:00')), out = [];
  for (const k of ['dhuhr', 'asr', 'maghrib']) {
    if (k === 'dhuhr' && fri) out.push({ k: 'friday', name: 'Friday prayer', adhan: P.dhuhr, from: addMin(P.dhuhr, -FRIDAY_HOLD.before), to: addMin(P.dhuhr, FRIDAY_HOLD.after) });
    else out.push({ k, name: { dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib' }[k] + ' prayer', adhan: P[k], from: addMin(P[k], -PRAYER_HOLD.before), to: addMin(P[k], PRAYER_HOLD.after) });
  }
  return out;
}
const holdAt = (d) => holds(ymdOf(d)).find((h) => d >= h.from && d < h.to) || null;
const nextHold = (d) => holds(ymdOf(d)).find((h) => h.from > d) || null;

// ================================================================ walk timeline + best start (#6)
function stopsTimeline(start) {
  if (!PLAYJ) return [];
  let t = start; const out = [];
  for (const c of PLAYJ.chapters) {
    if (c.n > 1) t = addMin(t, c.walk || 1);
    const end = addMin(t, (c.siteS || 120) / 60 + 1); // +1 min to settle at the mark
    out.push({ n: c.n, from: t, to: end }); t = end;
  }
  return out;
}
function insideSpan(tl) { const ins = tl.filter((x) => INSIDE(x.n)); return ins.length ? { from: ins[0].from, to: ins[ins.length - 1].to } : null; }
function bestStarts(ymd) {
  const open = cairoToDate(ymd, OPEN.from), close = cairoToDate(ymd, OPEN.to), H = holds(ymd), ok = [];
  for (let s = open; s < close; s = addMin(s, 15)) {
    const tl = stopsTimeline(s); if (!tl.length) break;
    const span = insideSpan(tl), end = tl[tl.length - 1].to;
    if (end > close) break;
    if (H.some((h) => span.from < h.to && span.to > h.from)) continue;
    ok.push({ start: s, end });
  }
  return ok;
}
// group good start times into ranges like "08:00 to 10:30"
function startRanges(list) {
  const r = []; for (const x of list) { const last = r[r.length - 1]; if (last && x.start - last.to <= 15 * 60000) last.to = x.start; else r.push({ from: x.start, to: x.start }); }
  return r;
}
function totalWalkMin() { if (!PLAYJ) return 60; const tl = stopsTimeline(new Date(0)); return Math.round((tl[tl.length - 1].to - tl[0].from) / 60000); }

// ================================================================ #6 visit planner card
let planDay = null;
const planDays = () => { const t = now(); return [0, 1, 2, 3, 4, 5, 6].map((i) => ymdOf(addMin(t, i * 1440))); };
window.planSheet = function () {
  if (!planDay || !planDays().includes(planDay)) planDay = ymdOf(now());
  const d = cairoToDate(planDay, '12:00'), P = prayerTimes(planDay), H = holds(planDay), fri = isFriday(d);
  const starts = bestStarts(planDay), ranges = startRanges(starts);
  const today = planDay === ymdOf(now());
  const futureRanges = today ? ranges.filter((r) => r.to >= addMin(now(), -5)) : ranges;
  const best = futureRanges.length ? futureRanges[0] : null;
  const chips = planDays().map((x, i) => { const dd = cairoToDate(x, '12:00'); const lab = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Intl.DateTimeFormat('en-GB', { timeZone: CAIRO_TZ, weekday: 'short' }).format(dd); return `<button class="w1chip${x === planDay ? ' on' : ''}" data-w1day="${x}">${lab}${isFriday(dd) ? ' ·' : ''}</button>`; }).join('');
  const pr = [['Fajr', P.fajr], ['Sunrise', P.sunrise], ['Dhuhr', P.dhuhr], ['Asr', P.asr], ['Maghrib', P.maghrib], ['Isha', P.isha]].map(([k, v]) => `<div><span>${k}${k === 'Dhuhr' && fri ? ' · Friday' : ''}</span><b>${hm(v)}</b></div>`).join('');
  sheet(`<h2>Plan your visit</h2>
  <div class="w1chips">${chips}</div>
  <div class="w1day">${esc(dayName(d))}${fri ? ' · Friday' : ''}</div>
  <div class="w1best">
    <div class="k">Best time to start</div>
    ${best ? `<b>${hm(best.from)}${best.to - best.from >= 15 * 60000 ? ' to ' + hm(best.to) : ''}</b><p>The walk takes about ${totalWalkMin()} minutes. Starting then, the inside stops (5 to 11) miss every prayer and you finish before closing.</p>`
           : `<b>No clean slot${today ? ' left today' : ''}</b><p>Prayer times break up the inside stops. Pick another day, or start anyway: the app pauses inside stops for prayer and sends you to an outside stop.</p>`}
    <div class="verify">Calculated from prayer times and estimated walking times. Hours and pause lengths not yet checked on site.</div>
  </div>
  <h3>Prayer times at the mosque</h3>
  <div class="w1pt">${pr}</div>
  <p class="small">${fri ? `Friday: the mosque closes to visitors around the midday prayer, about ${hm(H[0].from)} to ${hm(H[0].to)}.` : `Inside stops pause for about ${PRAYER_HOLD.before + PRAYER_HOLD.after} minutes at each prayer while people pray. Outside stops carry on.`} <span class="verify">Not yet verified.</span> Calculated by the Egyptian General Authority of Survey method.</p>
  <h3>Hours and ticket</h3>
  <p>Commonly listed as open ${OPEN.from} to ${OPEN.to}, every day. One ticket covers Sultan Hassan and Al-Rifa'i across the lane. Buy it at the ticket window by the lane between the two. <span class="verify">Hours, last entry, price and where the window is: not yet verified.</span></p>
  <h3>What to wear</h3>
  <ul><li>Shoulders and knees covered. Women: bring a scarf for your hair.</li><li>Shoes come off where the floor is carpet or matting, so wear ones that slip off easily.</li><li>Speak softly inside. Don't photograph people who are praying.</li></ul>
  <h3>Best light</h3>
  <p>Sunrise ${hm(P.sunrise)}, sunset ${hm(P.sunset)}. Morning sun lights the domed tomb end, which faces the Citadel and the square, so stops 1 and 2 look best before about 10:30. The courtyard is brightest late morning to early afternoon. <span class="verify">Directions of the light not yet checked on site.</span></p>
  <h3>Bring</h3>
  <ul><li>Headphones. The voices do the directing.</li><li>The play downloaded (about 40 MB). Signal is weak inside the walls.</li><li>Water and some change for the shoe keeper.</li></ul>
  <h3>Getting there</h3>
  <p>Salah al-Din Square (Midan al-Qal'a), below the Citadel. Taxis and ride apps know "Sultan Hassan Mosque".</p>
  <div class="btns">
    <a class="pill gold" href="https://www.google.com/maps/search/?api=1&query=Mosque-Madrasa+of+Sultan+Hassan+Cairo" target="_blank" rel="noopener" style="text-decoration:none;color:var(--night)">Directions to the mosque</a>
    ${S.dl ? '' : '<button class="pill ghost" data-act="dl">Download the play now</button>'}
    <button class="pill quiet" data-act="close">Close</button>
  </div>`);
};
document.getElementById('sheetIn').addEventListener('click', (e) => { const b = e.target.closest('[data-w1day]'); if (b) { planDay = b.dataset.w1day; planSheet(); } });

// ================================================================ #17 prayer-aware show (during the visit)
function prayerStrip() {
  const el = document.getElementById('w1strip'); if (!el) return;
  const t = now(), h = holdAt(t), nx = nextHold(t);
  const open = cairoToDate(ymdOf(t), OPEN.from), close = cairoToDate(ymdOf(t), OPEN.to);
  if (h) { el.innerHTML = `<b>${esc(h.name)}</b> · inside stops pause until about ${hm(h.to)}. Outside stops carry on. <span class="verify">[VERIFY]</span>`; el.className = 'w1strip hold'; }
  else if (nx && nx.from < close && nx.from - t < 3 * 3600e3) { el.innerHTML = `Next: <b>${esc(nx.name)}</b> at ${hm(nx.adhan)} · inside stops pause ${hm(nx.from)} to ${hm(nx.to)}`; el.className = 'w1strip'; }
  else if (t < open || t > close) { el.innerHTML = `The mosque is usually open ${OPEN.from} to ${OPEN.to}. <span class="verify">[VERIFY]</span>`; el.className = 'w1strip'; }
  else { el.innerHTML = 'No prayer pause before closing.'; el.className = 'w1strip'; }
}
function outsideStopToDo() {
  const done = new Set(S.done);
  return PLAYJ.chapters.find((c) => !INSIDE(c.n) && !done.has(c.n)) || null;
}
function holdCard(h, n, playing) {
  const out = outsideStopToDo();
  sheet(`<div class="w1call"><svg width="34" height="40" viewBox="0 0 24 28"><use href="#arch"/></svg></div>
    <h2>${h ? esc(h.name) : 'Prayer time'}</h2>
    <p>${h && h.k === 'friday' ? 'On Friday the mosque is closed to visitors during the midday prayer.' : 'People are coming in to pray. The play is paused for the inside stops until about ' + hm(h.to) + '.'}</p>
    <p class="w1quiet">If you hear the call to prayer, take your headphones off and listen. It has carried across this square for more than six hundred years, and for once it is the building that speaks. <span class="verify">[VERIFY wording]</span></p>
    <div class="btns">
      ${out ? `<button class="pill gold" data-w1go="${out.n}">Do an outside stop now: ${out.n} · ${esc(out.title)}</button>` : ''}
      <button class="pill ghost" data-act="close">Wait here${n ? ', then play stop ' + n : ''}</button>
      <button class="pill quiet" data-w1override="${n || ''}">We're allowed in, play anyway</button>
    </div>`);
}
document.getElementById('sheetIn').addEventListener('click', (e) => {
  const g = e.target.closest('[data-w1go]'); if (g) { closeSheet(); openStop(+g.dataset.w1go); return; }
  const o = e.target.closest('[data-w1override]'); if (o) { overrideUntil = Date.now() + 40 * 60000; closeSheet(); if (o.dataset.w1override && (!CUR || CUR.meta.n !== +o.dataset.w1override || !document.getElementById('stage').classList.contains('on'))) openStop(+o.dataset.w1override); else if (CUR && document.getElementById('stage').classList.contains('on')) au.play().catch(() => {}); }
});
let overrideUntil = 0, warned = {};
const origOpen = window.openStop;
window.openStop = async function (n, skipStand) {
  const t = now(), h = holdAt(t);
  if (INSIDE(n) && h && Date.now() > overrideUntil) { holdCard(h, n); return; }
  // about to start an inside stop that would run into a prayer pause
  if (INSIDE(n) && Date.now() > overrideUntil) {
    const nx = nextHold(t), c = PLAYJ.chapters.find((x) => x.n === n);
    if (nx && addMin(t, (c.siteS || 120) / 60) > nx.from && !warned[nx.k + n]) {
      warned[nx.k + n] = 1;
      const out = outsideStopToDo();
      sheet(`<h2>${esc(nx.name)} at ${hm(nx.adhan)}</h2><p>This stop runs ${fmt(c.siteS || 0)}, so the prayer pause (${hm(nx.from)} to ${hm(nx.to)}) would stop it halfway.</p>
        <div class="btns">${out ? `<button class="pill gold" data-w1go="${out.n}">Do an outside stop first: ${out.n} · ${esc(out.title)}</button>` : ''}<button class="pill ghost" data-w1override="${n}">Play stop ${n} now anyway</button><button class="pill quiet" data-act="close">Back</button></div>`);
      return;
    }
  }
  track('stop_start', n);
  return origOpen(n, skipStand);
};
// pause an inside stop when a prayer pause begins
setInterval(() => {
  prayerStrip();
  if (!CUR || au.paused || !INSIDE(CUR.meta.n) || Date.now() < overrideUntil) return;
  const h = holdAt(now()); if (h) { au.pause(); holdCard(h, CUR.meta.n, true); }
}, 15000);

// ================================================================ #5 anonymous pilot counter
// A visitor who opens the app with ?p=CODE (a hotel or guide) keeps that code. Events carry no name, no location,
// no device details: a random id for this phone, the code, the event and the stop number.
const Q2 = new URLSearchParams(location.search);
const code = (Q2.get('p') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);
if (code) { S.pilot = code; save(); }
if (!S.anon) { S.anon = Math.random().toString(36).slice(2, 10); save(); }
const LOGK = 'medu.pilot';
const readLog = () => { try { return JSON.parse(localStorage.getItem(LOGK) || '[]'); } catch (e) { return []; } };
const writeLog = (l) => { try { localStorage.setItem(LOGK, JSON.stringify(l.slice(-400))); } catch (e) {} };
function track(ev, n) {
  const row = { t: new Date().toISOString(), id: S.anon, p: S.pilot || '', ev, n: n || 0 };
  const log = readLog(); log.push(Object.assign({ sent: 0 }, row)); writeLog(log); flush();
}
function flush() {
  if (!PILOT_ENDPOINT || !navigator.onLine) return;
  const log = readLog(), todo = log.filter((r) => !r.sent); if (!todo.length) return;
  const body = JSON.stringify(todo.map(({ sent, ...r }) => r));
  let ok = false; try { ok = navigator.sendBeacon(PILOT_ENDPOINT, new Blob([body], { type: 'text/plain' })); } catch (e) {}
  if (ok) { for (const r of todo) r.sent = 1; writeLog(log); }
}
window.addEventListener('online', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
au.addEventListener('ended', () => { if (CUR) track('stop_end', CUR.meta.n); });
const origFinish = window.finishStop;
window.finishStop = function () { const r = origFinish.apply(this, arguments); if (CUR && CUR.meta.n === PLAYJ.chapters.length) track('finish', CUR.meta.n); return r; };
if (!sessionStorage.getItem('medu.opened')) { try { sessionStorage.setItem('medu.opened', '1'); } catch (e) {} track('open', 0); }
const origWalk = window.openWalk;
window.openWalk = function () { if (!S.walkStarted) { S.walkStarted = Date.now(); save(); track('walk', 0); } return origWalk.apply(this, arguments); };

// ================================================================ #37 "I stood here" card (the photo never leaves the phone)
const fileIn = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' });
fileIn.setAttribute('capture', 'environment'); fileIn.style.display = 'none'; document.body.appendChild(fileIn);
let cardBlob = null;
function arch(ctx, x, y, w, h) { // keel arch: straight sides, two curves meeting in a raised point
  const r = w / 2, sh = h * 0.42; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + sh);
  ctx.bezierCurveTo(x, y + sh * 0.35, x + r * 0.55, y + sh * 0.12, x + r, y);
  ctx.bezierCurveTo(x + r * 1.45, y + sh * 0.12, x + w, y + sh * 0.35, x + w, y + sh); ctx.lineTo(x + w, y + h); ctx.closePath();
}
async function makeCard(img) {
  try { await Promise.all([document.fonts.load('600 80px "Cormorant Garamond"'), document.fonts.load('600 30px Inter'), document.fonts.load('700 50px Amiri')]); } catch (e) {}
  const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#0B0A08'; x.fillRect(0, 0, W, H);
  const ax = 110, ay = 250, aw = W - 220, ah = 1180;
  x.save(); arch(x, ax, ay, aw, ah); x.clip();
  const s = Math.max(aw / img.width, ah / img.height), iw = img.width * s, ih = img.height * s;
  x.drawImage(img, ax + (aw - iw) / 2, ay + (ah - ih) / 2, iw, ih);
  const g = x.createLinearGradient(0, ay + ah - 260, 0, ay + ah); g.addColorStop(0, 'rgba(11,10,8,0)'); g.addColorStop(1, 'rgba(11,10,8,.55)'); x.fillStyle = g; x.fillRect(ax, ay, aw, ah);
  x.restore();
  x.strokeStyle = '#D4B062'; x.lineWidth = 6; arch(x, ax, ay, aw, ah); x.stroke();
  x.lineWidth = 2; arch(x, ax - 22, ay - 30, aw + 44, ah + 30); x.stroke();
  // top lockup
  x.fillStyle = '#D4B062'; x.textAlign = 'center'; x.font = '600 44px "Cormorant Garamond", Georgia, serif';
  x.letterSpacing = '14px'; x.fillText('MEDU', W / 2 + 7, 150); x.letterSpacing = '0px';
  // words
  x.fillStyle = '#EFE7D8'; x.font = '600 96px "Cormorant Garamond", Georgia, serif'; x.fillText('I stood here.', W / 2, 1560);
  x.fillStyle = '#D4B062'; x.font = '700 52px Amiri, serif'; x.fillText('مدرسة السلطان حسن', W / 2, 1650);
  x.fillStyle = '#ECDEC0'; x.font = '400 34px Inter, system-ui, sans-serif'; x.fillText('Sultan Hassan, Cairo · ' + new Intl.DateTimeFormat('en-GB', { timeZone: CAIRO_TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(now()), W / 2, 1720);
  x.fillStyle = '#9A958B'; x.font = '600 30px Inter, system-ui, sans-serif'; x.letterSpacing = '4px'; x.fillText('ONLY PLAYS AT THE MOSQUE · COME AND STAND HERE', W / 2, 1830); x.letterSpacing = '0px';
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9));
}
function standCardSheet() {
  sheet(`<h2>I stood here</h2>
    <p>Take one photo at the last mark, or pick one you took today. It goes into the arch frame for your story. The photo stays on this phone: nothing is uploaded.</p>
    <div class="w1prev" id="w1prev"><div class="small">Your card appears here.</div></div>
    <div class="btns">
      <button class="pill gold" id="w1shoot">Take or choose a photo</button>
      <button class="pill ghost" id="w1share" disabled>Share the card</button>
      <a class="pill quiet" id="w1save" style="display:none;text-decoration:none">Save to this phone</a>
      <button class="pill quiet" data-act="close">Close</button>
    </div>`);
  document.getElementById('w1shoot').onclick = () => fileIn.click();
  document.getElementById('w1share').onclick = shareCard;
}
fileIn.addEventListener('change', async () => {
  const f = fileIn.files && fileIn.files[0]; if (!f) return;
  const u = URL.createObjectURL(f), img = new Image();
  img.onload = async () => {
    cardBlob = await makeCard(img); URL.revokeObjectURL(u); fileIn.value = '';
    const cu = URL.createObjectURL(cardBlob), pv = document.getElementById('w1prev');
    if (pv) pv.innerHTML = `<img alt="Your I stood here card" src="${cu}">`;
    const sh = document.getElementById('w1share'); if (sh) sh.disabled = false;
    const sv = document.getElementById('w1save'); if (sv) { sv.href = cu; sv.download = 'medu-i-stood-here.jpg'; sv.style.display = ''; }
    track('card', 0);
  };
  img.onerror = () => toast('That photo could not be opened. Try another.');
  img.src = u;
});
async function shareCard() {
  if (!cardBlob) return;
  const file = new File([cardBlob], 'medu-i-stood-here.jpg', { type: 'image/jpeg' });
  const text = 'I stood here. A play staged inside Sultan Hassan, Cairo. It only plays at the mosque.';
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; } } catch (e) { return; }
  toast('Sharing pictures isn\'t available here. Use "Save to this phone".');
}


// ================================================================ the way to the next stop (3D guide walk mode, from the 3D thread)
// The next-stop card offers "Show me the way": the 3D guide opens at #walk-chNN (gold route, arrows, ring at the mark,
// "Follow me" with GPS + compass, "I'm on the mark"). When the guide reports arrival (mode back to "stand", or its hash
// turns to #chNN), the overlay closes and the next chapter's stand card opens. Routes are [VERIFY ON SITE].
const wv = document.createElement('div'); wv.id = 'w1way';
wv.innerHTML = '<iframe title="The way to the next stop" allow="geolocation; accelerometer; gyroscope; magnetometer"></iframe><div class="w1waytop"><button class="x" aria-label="Close the map"><svg width="20" height="20"><use href="#close"/></svg></button><span class="w1wayhint">Needs a signal the first time; then it is stored.</span></div>';
document.getElementById('stage').appendChild(wv);
let wayTimer = 0, wayTarget = 0;
function wayClose() { clearInterval(wayTimer); wv.classList.remove('on'); const f = wv.querySelector('iframe'); f.src = 'about:blank'; if (typeof wa !== 'undefined') { wa.classList.remove('on'); wb.style.display = 'none'; } }
wv.querySelector('button').onclick = () => { const arrived = wayArrived, n = wayTarget; wayClose(); if (arrived && n) openStop(n); };   // after arrival the close button leads to the stop's stand card
function wayOpen(n) {
  wayTarget = n; wayArrived = false; wa.innerHTML = ''; wa.classList.remove('on'); wb.style.display = 'none'; const id = 'ch' + String(n).padStart(2, '0'); const f = wv.querySelector('iframe');
  f.src = 'guide3d/index.html#walk-' + id; wv.classList.add('on'); track('way', n);
  let walked = false; clearInterval(wayTimer);
  wayTimer = setInterval(() => {
    let mode = '', hash = '', arrived = false, holdsMark = false;
    try { const w = f.contentWindow; hash = w.location.hash; mode = w.__r && w.__r.state ? w.__r.state().mode : ''; const wk = w.__r && w.__r.__walk ? w.__r.__walk() : null; arrived = !!(wk && wk.arrived); holdsMark = parseFloat((w.__r && w.__r.version) || '0') >= 11.3; } catch (e) { return; }
    if (mode === 'walk' || hash.startsWith('#walk-')) walked = true;
    // Arrival moment. Guide v11.3+ holds it itself: on arrival it lands on a "You are here" view (#mark-chNN) with one button,
    // "Look from the mark", which opens the chapter view (#chNN / mode stand). The card then sits over that view, so the
    // visitor sees the mark, and the play starts on the card's one tap. Older guides have no mark view: the card comes at once.
    if (walked && (mode === 'stand' || hash === '#' + id || (arrived && !holdsMark))) { clearInterval(wayTimer); wayArrived = true; arrivalCard(wayTarget); return; }
    if (holdsMark && hash.startsWith('#mark-')) {   // safety net: if the guide's own "Look from the mark" button is off-screen (seen at 412 px wide, 8 Nov), offer "Begin stop N" here
      let reach = true; try { const en = f.contentWindow.document.getElementById('enter'); const r = en && en.getBoundingClientRect(); reach = !!(r && r.width > 40 && r.left >= 0 && r.right <= f.contentWindow.innerWidth + 1 && r.bottom <= f.contentWindow.innerHeight + 1 && getComputedStyle(en).display !== 'none'); } catch (e) {}
      wb.textContent = 'Begin stop ' + wayTarget; wb.style.display = reach ? 'none' : '';
    }
  }, 400);
}
// Arrival moment (kareem, 8 Nov): when the guide reports arrival, the map stays in its stand view and a card over it
// shows the stop, the stand photo and where to stand. The play starts only when the visitor taps. Before this the
// overlay closed itself 1.9 s after arrival, so the stop's location was gone before it could be seen.
let wayArrived = false;
const wa = document.createElement('div'); wa.className = 'w1arrive'; wv.appendChild(wa);
const wb = document.createElement('button'); wb.className = 'pill gold w1begin'; wb.style.display = 'none'; wv.appendChild(wb);
function arrivalCard(n) {
  const m = PLAYJ.chapters.find((c) => c.n === n); if (!m) { wayClose(); openStop(n); return; }
  const st = (m.stand || '').replace(/^./, (x) => x.toUpperCase()).replace(/UNVERIFIED:.*$/s, '').trim();
  wa.innerHTML = `<div class="w1arrow"><div class="w1arph"></div><div class="w1artxt"><div class="k">You are at the mark</div><h2>${n} · ${esc(m.title)}</h2><p>${esc(st)}</p><div class="meta">${fmt(m.siteS || 0)} of play · headphones on, then lower your phone.</div></div></div><div class="btns"><button class="pill gold" data-w1arr="begin">I'm standing here · begin</button><button class="pill quiet" data-w1arr="map">Let me look at the map first</button></div>`;
  wb.textContent = 'Begin stop ' + n; wb.style.display = 'none'; wa.classList.add('on'); wa.scrollTop = 0;
  buzz([40, 60, 40]);
  loadCh(n).then((ch) => { const p = standPhoto(ch), el = wa.querySelector('.w1arph'); if (p && el && wayTarget === n) el.style.backgroundImage = `url('${p}')`; }).catch(() => {});   // the stand photo joins when loaded
}
wa.addEventListener('click', (e) => {
  const b = e.target.closest('[data-w1arr]'); if (!b) return; const n = wayTarget;
  if (b.dataset.w1arr === 'begin') { try { track('way', n); } catch (e) {} wa.classList.remove('on'); wayClose(); openStop(n, true).then(() => au.play().catch(() => {})); }   // the existing 'way' event, as the on-site thread asked
  else { wa.classList.remove('on'); wb.style.display = ''; }   // the map stays in its stand view; "Begin stop N" waits at the bottom
});
wb.onclick = () => { clearInterval(wayTimer); wayArrived = true; arrivalCard(wayTarget); };
const origFinish2 = window.finishStop;
window.finishStop = function () {
  const r = origFinish2.apply(this, arguments);
  const card = document.getElementById('nextCard'), btns = card && card.querySelector('.btns');
  if (btns && card.classList.contains('on') && S.cur) {
    let b = document.getElementById('w1wayBtn');
    if (!b) { b = document.createElement('button'); b.id = 'w1wayBtn'; b.className = 'pill ghost'; btns.insertBefore(b, btns.children[1]); }
    b.textContent = 'Show me the way'; b.onclick = () => wayOpen(S.cur);
  }
  return r;
};

// ================================================================ UI: styles + hooks into the existing screens
const css = document.createElement('style');
css.textContent = `
.w1chips{display:flex;gap:8px;overflow-x:auto;padding:4px 0 10px;scrollbar-width:none}
.w1chip{flex:none;padding:8px 14px;border-radius:999px;border:1px solid rgba(239,231,216,.22);font-size:14px;color:#D9D1C1}
.w1chip.on{background:var(--gold);color:var(--night);border-color:var(--gold);font-weight:600}
.w1day{font-size:13px;color:var(--dust);margin-bottom:12px}
.w1best{background:var(--night3);border-radius:16px;padding:16px 18px}
.w1best .k{font:600 11px/1 var(--sans);letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
.w1best b{display:block;font:600 34px/1.1 var(--serif);color:var(--ivory);margin-bottom:6px;font-variant-numeric:tabular-nums}
.w1best p{font-size:14px;margin:0 0 8px}
.w1pt{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.w1pt div{background:var(--night3);border-radius:12px;padding:10px 12px}
.w1pt span{display:block;font-size:12px;color:var(--dust)}
.w1pt b{font:600 20px/1.2 var(--serif);font-variant-numeric:tabular-nums}
.w1strip{font-size:13px;color:#D9D1C1;background:var(--night3);border-radius:12px;padding:10px 14px;margin:0 0 14px}
.w1strip.hold{background:#3a2c14;color:var(--paper)}
.w1strip b{color:var(--ivory)}
.w1call{color:var(--gold);margin-top:8px}
.w1quiet{font:500 19px/1.4 var(--serif);color:var(--paper)}
.w1prev{border-radius:14px;background:var(--night3);min-height:120px;display:grid;place-items:center;overflow:hidden;margin-top:6px}
#w1way{position:absolute;inset:0;z-index:20;background:#0B0A08;display:none}
#w1way.on{display:block}
#w1way iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.w1waytop{position:absolute;top:calc(var(--top) + 10px);left:12px;right:12px;display:flex;align-items:center;gap:10px;pointer-events:none}
.w1waytop .x{pointer-events:auto;background:rgba(11,10,8,.7)}
.w1wayhint{font-size:11px;color:var(--dust);background:rgba(11,10,8,.6);padding:4px 8px;border-radius:8px}
.w1arrive{position:absolute;left:0;right:0;bottom:0;z-index:2;display:none;max-height:62%;overflow:auto;background:linear-gradient(180deg,rgba(11,10,8,0) 0%,rgba(11,10,8,.94) 40px,#0B0A08 100%);padding:40px 18px calc(env(safe-area-inset-bottom) + 16px)}
.w1arrive.on{display:block}
.w1arrow{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px}
.w1arph{flex:0 0 92px;height:92px;border-radius:12px;background:#1a1712 center/cover no-repeat;border:1px solid rgba(212,176,98,.3)}
.w1artxt{min-width:0}
.w1arrive .k{font:600 11px/1 var(--sans);letter-spacing:.22em;color:var(--gold);text-transform:uppercase;margin-bottom:6px}
.w1arrive h2{font:500 24px/1.15 var(--serif);color:var(--ivory);margin:0 0 6px}
.w1arrive p{font:400 15px/1.35 var(--serif);color:var(--ivory);margin:0 0 6px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.w1arrive .meta{font-size:12px;color:var(--dust)}
.w1arrive .btns{display:flex;flex-direction:column;gap:10px}
.w1begin{position:absolute;left:20px;right:20px;width:auto;bottom:calc(env(safe-area-inset-bottom) + 18px);z-index:2}
.w1prev img{display:block;width:100%;max-width:280px;margin:12px auto;border-radius:8px}
`;
document.head.appendChild(css);

// prayer strip at the top of the walk
const sub = document.getElementById('wkSub');
if (sub) { const s = document.createElement('div'); s.id = 'w1strip'; s.className = 'w1strip'; sub.insertAdjacentElement('afterend', s); }
const origRender = window.renderWalk;
window.renderWalk = function () { const r = origRender.apply(this, arguments); prayerStrip(); return r; };
// home: the planner button now shows today's best start
const planBtn = document.getElementById('btnPlan');
function planLabel() {
  if (!planBtn || !PLAYJ) return; const t = now(), ymd = ymdOf(t);
  const r = startRanges(bestStarts(ymd)).filter((x) => x.to >= addMin(t, -5));
  planBtn.textContent = r.length ? 'Plan your visit · best start today ' + hm(r[0].from) : 'Plan your visit · times, dress, Friday';
}
// finale: the "I stood here" card
const fb = document.querySelector('#finale .btns');
if (fb) { const b = document.createElement('button'); b.className = 'pill gold'; b.textContent = 'Make your "I stood here" card'; b.onclick = standCardSheet; fb.insertBefore(b, fb.firstChild); const sh = document.getElementById('fnShare'); if (sh) sh.className = 'pill ghost'; }
// settings: the card and the pilot summary
const origSettings = window.settingsSheet;
window.settingsSheet = function () {
  origSettings.apply(this, arguments);
  const log = readLog(), starts = new Set(log.filter((r) => r.ev === 'stop_start').map((r) => r.n)), ends = new Set(log.filter((r) => r.ev === 'stop_end').map((r) => r.n));
  const row = document.createElement('div'); row.className = 'row';
  row.innerHTML = `<div>"I stood here" card<div class="small">Your photo in the arch frame. It stays on this phone.</div></div><button class="pill ghost" style="width:auto;padding:0 18px;min-height:40px">Make</button>`;
  row.querySelector('button').onclick = standCardSheet;
  const p = document.createElement('p'); p.className = 'small';
  p.textContent = `Anonymous visit counter${S.pilot ? ' · code ' + S.pilot : ''}: ${starts.size} stops started, ${ends.size} finished on this phone. No names, places or photos are counted.${PILOT_ENDPOINT ? '' : ' Not sent anywhere yet.'}`;
  const btns = document.querySelector('#sheetIn .btns'); if (btns) { btns.parentNode.insertBefore(row, btns.previousElementSibling); btns.parentNode.insertBefore(p, btns); }
};
// expose for tests and the pilot page
window.MEDU_W1 = { prayerTimes, holds, bestStarts, startRanges, stopsTimeline, readLog, makeCard, now, hm, ymdOf };

// these buttons were wired to the original functions; point them at the wrapped ones
document.getElementById('btnPlan').onclick = () => planSheet();
document.getElementById('wkInfo').onclick = () => settingsSheet();

const ready = setInterval(() => { if (PLAYJ) { clearInterval(ready); planLabel(); prayerStrip(); } }, 300);
})();
