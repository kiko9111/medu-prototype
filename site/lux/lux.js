/* Medu · the luxury layer ("the folio and the thread"), behaviour.
   Loaded after wave1.js. Like wave1.js it wraps the page's own functions and never replaces the play's logic:
   the door check, the download, resume, prayer pauses, the lock-screen controls and the 3D way all stay as they are.

   What it adds
   - House lights: ink on paper outdoors while the sun is up (scenes I to IV and XII), gold on night indoors and after sunset.
   - Sense of place on every screen: scene and place in words, a dot on the little plan, twelve ticks for the play.
   - The programme: Coste's plan of 1839 with the twelve marks on one gold thread.
   - The mark: the scene's view as an engraved plate; when the curtain rises it turns to stone and sun.
   - The quiet stage: one phrase at a time, controls only on touch.
   - Three notes: at the mark, at the curtain, at the end.
   Everything moving has a still path: "Cinematic effects" off, or the phone's reduced-motion setting. */
(() => {
'use strict';
const D = document, root = D.documentElement;
const q = (s, p) => (p || D).querySelector(s);
const el = (tag, cls, html) => { const n = D.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
root.classList.add('lux'); if (!root.classList.contains('lx-paper')) root.classList.add('lx-night');

const PREVIEW = ((q('meta[name="medu-preview"]') || {}).content || '') === '1';   // a review copy: the door check is off
const RN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
const rn = (n) => RN[n] || String(n);
const fixName = (t) => (typeof t === 'string' ? t.replace(/\bHasan\b/g, 'Hassan') : t);        // one spelling everywhere
const still = () => S.fx === false || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const stage = q('#stage'), standEl = q('#standCard'), nextEl = q('#nextCard');
const IMG = 'lux/img/';

// ---------------------------------------------------------------- the plan (Coste, 1839) and the thread
// Positions are pixels on the key plan; P2S turns them onto the sheet (the square at the foot). 959 units = 50 m.
const SHEET = { w: 2380, h: 4695, img: 3295 };
const P2S = ([cx, cy]) => [cy - 16, 3078 - cx];
const LEGS = {
  '1-2': [[-1434, 1096], [-219, 1526]],
  '2-3': [[-219, 1526], [120, 1830], [500, 1885], [839, 1889]],
  '3-4': [[839, 1889], [1380, 1935], [1950, 1956], [2200, 2010], [2439, 2180]],
  '4-5': [[2439, 2180], [2700, 2150], [2740, 2060], [2660, 2000], [2590, 1930], [2562, 1862], [2608, 1778]],
  '5-6': [[2608, 1778], [2633, 1735], [2530, 1680], [2440, 1640], [2440, 1560], [2440, 1520]],
  '6-7': [[2440, 1520], [2437, 1345], [2250, 1332], [2060, 1332], [2060, 1180], [2119, 1131]],
  '7-8': [[2119, 1131], [1732, 1424]],
  '8-9': [[1732, 1424], [1570, 1395], [1522, 1440], [1510, 1487], [1260, 1487], [1150, 1540], [1120, 1600]],
  '9-10': [[1120, 1600], [1150, 1540], [1260, 1487], [1510, 1487], [1522, 1440], [1560, 1385], [1470, 1275], [1102, 1266]],
  '10-11': [[1102, 1266], [900, 1247], [800, 1247], [770, 1180], [770, 1107]],
  '11-12': [[770, 1107], [770, 1180], [800, 1247], [900, 1247], [1470, 1275], [2060, 1332], [2250, 1332], [2437, 1345], [2440, 1560], [2440, 1640], [2530, 1680], [2633, 1735], [2562, 1862], [2590, 1930], [2660, 2000], [2740, 2060], [2700, 2150], [2439, 2180], [2200, 2010], [1950, 1956], [1596, 1953]],
};
const MARKS = [[-1434, 1096], [-219, 1526], [839, 1889], [2439, 2180], [2608, 1778], [2440, 1520], [2119, 1131], [1732, 1424], [1120, 1600], [1102, 1266], [770, 1107], [1596, 1953]];
const PLACES = ['In the square', 'In the square', 'In the lane', 'At the door', 'Inside the door', 'Towards the court', 'In the court', 'In the court', 'Off the court', 'Facing Mecca', 'Behind the prayer wall', 'Outside again'];
const LABELS = [   // [text, x, y, rotate]
  ['The court', 788, 1178, 0], ['Great', 1034, 2060, 0], ['hall', 1034, 2140, 0], ['The tomb', 1084, 2608, 0], ['The portal', 1960, 268, 0], ['The lane', 1889, 1838, -90], ['The square', 1500, 4420, 0],
];
const dPath = (pts) => pts.map(P2S).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(0) + ' ' + p[1].toFixed(0)).join(' ');
const legsPts = (a, b) => { let out = []; for (let i = a; i < b; i++) { const seg = LEGS[i + '-' + (i + 1)]; out = out.concat(out.length ? seg.slice(1) : seg); } return out; };
const INK = '#3A281A', NIGHT = '#0B0A08';

// one drawing for the programme, the walk between scenes and the little plan. u = sheet units per screen pixel.
function planSVG(o) {
  const u = o.u, n2 = (v) => (v * u).toFixed(1), night = !!o.night, id = o.id, done = o.done || new Set(), cur = o.cur || 0;
  let s = `<svg class="lx-plan${o.draw ? ' draw' : ''}" viewBox="${o.vb.map((v) => Math.round(v)).join(' ')}" preserveAspectRatio="xMidYMid ${o.slice ? 'slice' : 'meet'}" role="img" aria-label="${o.label || 'Plan of the mosque with the twelve marks'}">`;
  s += `<defs><linearGradient id="${id}leaf" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="2380" y2="1700" spreadMethod="reflect"><stop offset="0" stop-color="#a8822f"/><stop offset=".18" stop-color="#d9b760"/><stop offset=".36" stop-color="#f6e6ae"/><stop offset=".52" stop-color="#d4b062"/><stop offset=".7" stop-color="#a37c30"/><stop offset=".86" stop-color="#e2c477"/><stop offset="1" stop-color="#b28a3a"/></linearGradient>`;
  s += `<radialGradient id="${id}disc" cx="34%" cy="28%" r="80%"><stop offset="0" stop-color="#fbeebd"/><stop offset=".42" stop-color="#dcbb69"/><stop offset="1" stop-color="#a8822f"/></radialGradient>`;
  s += `<filter id="${id}gold" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .83  0 0 0 0 .69  0 0 0 0 .38  0 0 0 .5 0"/></filter>`;
  s += `<filter id="${id}glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n2(5)}"/></filter></defs>`;
  s += `<image class="ink" href="${IMG}plan-ink.webp" x="0" y="0" width="${SHEET.w}" height="${SHEET.img}"${night ? ` filter="url(#${id}gold)"` : ''}/>`;
  const line = (d, w, col, extra) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n2(w)}" stroke-linejoin="round" stroke-linecap="round" ${extra || ''}/>`;
  const main = dPath(legsPts(1, 11)), out = dPath(LEGS['11-12']), dots = `stroke-dasharray="${n2(.1)} ${n2(6.5)}"`;
  if (night) {
    s += line(out, 1.6, 'rgba(212,176,98,.42)', dots);
    s += line(main, 2.2, 'rgba(212,176,98,.62)', 'class="thread" pathLength="1"');
  } else {
    s += line(out, 3.4, 'rgba(58,40,26,.75)', dots) + line(out, 1.7, '#d9b760', dots);
    s += line(main, 5.2, INK, 'class="thread" pathLength="1"') + line(main, 3.2, `url(#${id}leaf)`, 'class="thread" pathLength="1"');
  }
  if (o.leg) {   // the walk ahead, bright
    const d = dPath(LEGS[o.leg[0] + '-' + o.leg[1]] || [MARKS[o.leg[0] - 1], MARKS[o.leg[1] - 1]]);
    if (night) s += line(d, 9, 'rgba(240,210,130,.5)', `filter="url(#${id}glow)"`) + line(d, 3, '#f3dfa0');
    else s += line(d, 8.4, INK) + line(d, 5.6, `url(#${id}leaf)`);
  }
  for (const [t, x, y, rot] of (o.labels ? LABELS : [])) s += `<text class="lbl" x="${x}" y="${y}" text-anchor="middle" font-size="${n2(8.5)}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}>${t}</text>`;
  MARKS.forEach((m, i) => {
    const n = i + 1, [x, y] = P2S(m), isDone = done.has(n), isCur = n === cur, from = o.leg && o.leg[0] === n;
    const r = isCur ? 13.5 : (o.r || 10.2);
    s += `<g transform="translate(${x} ${y})" data-n="${n}">`;
    if (isCur) s += `<circle class="pulse" r="${n2(19.5)}" fill="none" stroke="${night ? 'rgba(243,223,160,.7)' : INK}" stroke-width="${n2(night ? 1 : .8)}"/>`;
    let fill, stroke = 'none', tcol;
    if (night) { if (isCur) { fill = `url(#${id}disc)`; tcol = '#17120a'; } else if (isDone || from) { fill = 'rgba(212,176,98,.92)'; tcol = '#17120a'; } else { fill = NIGHT; stroke = 'rgba(212,176,98,.8)'; tcol = '#d4b062'; } }
    else { if (isCur) { fill = `url(#${id}disc)`; stroke = INK; tcol = '#2b1d12'; } else if (isDone || from) { fill = INK; tcol = '#ECDEC0'; } else { fill = '#ECDEC0'; stroke = INK; tcol = '#2b1d12'; } }
    s += `<circle r="${n2(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${n2(1.1)}"/>`;
    if (!o.plain) s += `<text text-anchor="middle" y="${n2(isCur ? 5 : 4.1)}" font-size="${n2(isCur ? 16 : 12.6)}" fill="${tcol}">${n}</text>`;
    if (o.hit) s += `<circle class="hit" r="${n2(22)}"><title>Scene ${rn(n)}</title></circle>`;
    s += '</g>';
  });
  return s + '</svg>';
}

// ---------------------------------------------------------------- house lights
const DEFAULT_LIGHTS = PREVIEW ? 'day' : 'auto';
const indoors = (n) => n >= 5 && n <= 11;
function sunUp() {
  const mode = S.lights || DEFAULT_LIGHTS;
  if (mode === 'day') return true; if (mode === 'night') return false;
  try { const W = window.MEDU_W1, t = W.now(), P = W.prayerTimes(W.ymdOf(t)); return t >= P.sunrise && t < P.sunset; }
  catch (e) { const h = new Date().getHours(); return h >= 6 && h < 18; }
}
const themeFor = (n) => (!indoors(n) && sunUp() ? 'paper' : 'night');
let theme = 'night', scene = 0;
const lights = el('div', 'lx-lights'); lights.setAttribute('aria-hidden', 'true'); D.body.appendChild(lights);
function setTheme(t, announce) {
  if (t === theme) return;
  const apply = () => {
    theme = t; root.classList.toggle('lx-paper', t === 'paper'); root.classList.toggle('lx-night', t !== 'paper');
    if (q('#walk').classList.contains('on')) renderPlan();
    if (nextEl.classList.contains('on') && legNow) drawLeg(legNow[0], legNow[1]);
  };
  if (!announce || still()) { apply(); return; }
  lights.textContent = t === 'night' ? 'House lights down' : 'House lights up';
  lights.className = 'lx-lights on ' + (t === 'night' ? 'down' : 'up');
  setTimeout(apply, 470); setTimeout(() => lights.classList.remove('on'), 1400);
}
const nextUnheard = () => { const d = new Set(S.done); const c = PLAYJ && PLAYJ.chapters.find((x) => !d.has(x.n)); return (S.cur && !d.has(S.cur)) ? S.cur : (c ? c.n : 12); };
setInterval(() => {   // the sun sets during a visit: follow it on the programme and between scenes, never in the middle of a scene
  if (D.visibilityState !== 'visible' || !PLAYJ) return;
  if (q('#walk').classList.contains('on')) setTheme(themeFor(nextUnheard()), true);
}, 60000);

// ---------------------------------------------------------------- three notes (mark, curtain, end)
const Notes = (() => {
  let ctx = null; const buf = {}, urls = { mark: 'lux/audio/mark.mp3', curtain: 'lux/audio/curtain.mp3', finale: 'lux/audio/finale.mp3' };
  const load = (k) => buf[k] || (buf[k] = fetch(urls[k]).then((r) => r.arrayBuffer()).then((a) => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).catch((e) => { buf[k] = null; throw e; }));
  function unlock() {
    try {
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; ctx = new C(); for (const k in urls) load(k).catch(() => {}); }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }
  function play(k, gain) {
    if (S.fx === false) return; unlock(); if (!ctx) return;
    load(k).then((b) => { const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; g.gain.value = gain || 0.7; s.connect(g); g.connect(ctx.destination); s.start(); }).catch(() => {});
  }
  D.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  return { play, unlock };
})();

// ---------------------------------------------------------------- one spelling, theatre words
function fixPlay() { for (const c of PLAYJ.chapters) { c.title = fixName(c.title); c.stand = fixName(c.stand); } if (PLAYJ.door) PLAYJ.door.title = fixName(PLAYJ.door.title); }
const origLoadCh = window.loadCh;
window.loadCh = async function () {
  const ch = await origLoadCh.apply(this, arguments);
  if (ch && !ch._lx) {
    ch._lx = 1; const c = ch.c;
    for (const k of ['title', 'next', 'place']) c[k] = fixName(c[k]);
    if (c.onsite) c.onsite.stand = fixName(c.onsite.stand);
    for (const k in (c.speakers || {})) c.speakers[k] = fixName(c.speakers[k]);
    for (const l of ch.lines) { l.cap = fixName(l.cap); l.say = fixName(l.say); if (l.w) for (const w of l.w) w[0] = fixName(w[0]); }
    for (const x of ch.ins) { x.cue = fixName(x.cue); x.element = fixName(x.element); }
    for (const r of ch.reveals) for (const k of ['cue', 'label', 'thenCap', 'how', 'howSub']) if (r[k]) r[k] = fixName(r[k]);
    for (const l of (ch.looks || [])) if (l) { l.label = fixName(l.label); for (const g of (l.tags || [])) g.t = fixName(g.t); }
  }
  return ch;
};

// ---------------------------------------------------------------- the quiet stage: one phrase at a time
function phrases(line) {
  if (line._ph !== undefined) return line._ph;
  const W = line.w && line.w.length ? line.w : null; if (!W) return (line._ph = null);
  const out = []; let cur = [];
  for (let i = 0; i < W.length; i++) {
    cur.push(W[i]);
    const w = W[i][0], left = W.length - 1 - i;
    const end = /[.!?…]["”’')\]]*$/.test(w), soft = /[,;:—]["”’')\]]*$/.test(w);
    if (!left) break;
    if ((end && cur.length >= 3 && left >= 2) || (soft && cur.length >= 8 && left >= 4) || (cur.length >= 17 && left >= 4)) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return (line._ph = out);
}
window.renderLine = function (elc, arEl, whoEl, ch, line, t) {
  const onStage = arEl.id === 'stAr';
  if (!line) { whoEl.textContent = ''; arEl.textContent = ''; arEl.style.display = 'none'; elc.innerHTML = ''; elc._ln = null; elc._k = -1; elc._spans = null; if (onStage) stage.classList.remove('lx-ar'); return; }
  const ph = phrases(line); let k = 0;
  if (ph) for (let i = 0; i < ph.length; i++) if (ph[i][0][1] <= t + 0.2) k = i;
  if (elc._ln !== line || elc._k !== k) {
    if (elc._ln !== line) {
      whoEl.textContent = (ch.c.speakers && ch.c.speakers[line.who]) || (line.who === 'narrator' ? 'Narrator' : line.who);
      const ar = line.ar || (hasAr(line.say) ? line.say : '');
      arEl.textContent = ar; arEl.style.display = ar ? '' : 'none';
      if (onStage) stage.classList.toggle('lx-ar', !!ar);   // an Arabic line takes the stage: the picture steps back while it is spoken
    }
    elc._ln = line; elc._k = k;
    elc.innerHTML = ph ? ph[k].map((w) => '<span class="w" data-t="' + w[1] + '">' + esc(w[0]) + '</span>').join(' ') : esc(line.cap || line.say);
    elc._spans = ph ? [...elc.querySelectorAll('.w')] : null;
    elc.classList.remove('lx-in'); if (!still()) { void elc.offsetWidth; elc.classList.add('lx-in'); }
  }
  if (elc._spans) for (const s of elc._spans) s.classList.toggle('on', +s.dataset.t <= t + 0.05);
};

// ---------------------------------------------------------------- sense of place: the locator and the twelve ticks
const top = q('.top', stage);
const loc = el('button', 'lx-loc', '<span class="lx-glyph" aria-hidden="true"><i class="g"></i><span class="dd"><i class="d"></i></span></span><span class="t"><b></b><span></span><em></em></span>');
loc.setAttribute('aria-label', 'Open the programme'); top.insertBefore(loc, top.firstChild);
loc.onclick = () => q('#stList').click();
const locK = q('.t b', loc), locT = q('.t span', loc), locP = q('.t em', loc), dot = q('.d', loc);
const ticks = el('div', 'lx-ticks', '<i></i>'.repeat(12)); ticks.setAttribute('aria-hidden', 'true'); top.insertAdjacentElement('afterend', ticks);
let curTick = null;
function setLoc(n, kind) {
  const total = PLAYJ.chapters.length, m = PLAYJ.chapters.find((c) => c.n === n) || {};
  // three short lines, one job each: where in the play, the scene's name, where in the building
  if (kind === 'door') { locK.textContent = 'Before the first scene'; locT.textContent = 'The house rules'; locP.textContent = (CUR && CUR.c && CUR.c.title) || 'At the door'; }
  else { locK.textContent = (kind === 'walk' ? 'The walk to scene ' : 'Scene ') + rn(n) + ' of ' + rn(total); locT.textContent = m.title || ''; locP.textContent = PLACES[n - 1] || ''; }
  locT.classList.toggle('long', locT.textContent.length > 24);
  const [x, y] = P2S(MARKS[n - 1] || MARKS[0]); dot.style.left = (x / SHEET.w * 100).toFixed(1) + '%'; dot.style.top = (y / SHEET.h * 100).toFixed(1) + '%';
  const done = new Set(S.done); curTick = null;
  [...ticks.children].forEach((t, i) => { const k = i + 1; t.className = done.has(k) && !(k === n && kind === 'scene') ? 'done' : (k === n && kind !== 'walk' ? 'now' : ''); if (k === n && kind !== 'walk') { curTick = t; t.style.setProperty('--p', 0); } });
  measureHead();
}
// the header is one, two or three lines tall: what sits under it (pictures, the walk's map) starts where it really ends
function measureHead() {
  const sr = stage.getBoundingClientRect(); if (!sr.height) return;
  const b = Math.round(ticks.getBoundingClientRect().bottom - sr.top);
  if (b > 0) stage.style.setProperty('--lx-head', b + 'px');
}

// ---------------------------------------------------------------- the scene's picture: plate on the mark, stone when the curtain rises
// Scene IV is the corrected 3D model of the portal; the others are the archive view matched to each mark.
const AR = { 0: 860 / 1147, 1: 860 / 596, 2: 860 / 1171, 3: 860 / 642, 4: 792 / 1372, 5: 542 / 678, 6: 860 / 1257, 7: 860 / 704, 8: 860 / 906, 9: 860 / 1153, 10: 860 / 662, 11: 860 / 1259, 12: 860 / 1090 };
const CAPS = {
  0: 'The portal. Model after Herz, 1899, and Bonfils, 1867–99',
  1: 'The square. Photogravure, 19th century. New York Public Library',
  2: 'Dome and minarets. Bonfils, 1870s. Library of Congress',
  3: 'The east corner and the long wall. Max Herz, 1899',
  4: 'The portal. Model after Herz, 1899, and Bonfils, 1867–99',
  5: 'The entrance niche. Photogravure. New York Public Library',
  6: 'The vestibule dome. K. A. C. Creswell, 1916–21. Victoria and Albert Museum',
  7: 'The courtyard. Pascal Coste, 1839. New York Public Library',
  8: 'The ablution fountain, 1870s–90s. New York Public Library',
  9: 'The Hanafi college court. K. A. C. Creswell, 1916–21. Victoria and Albert Museum',
  10: 'The great hall. Photochrom, about 1875. New York Public Library',
  11: 'The tomb chamber. Section by Pascal Coste, 1839. New York Public Library',
  12: 'The portal and the north-west wall. Max Herz, 1899',
};
const NOTES = { 0: 'Model not yet checked by the validator.', 4: 'Model not yet checked by the validator.', 6: 'Prototype only: rights to clear before launch.', 9: 'Prototype only: rights to clear before launch.' };
const artSrc = (n, look) => IMG + 'scene/' + (n ? 'ch' + String(n).padStart(2, '0') : 'ch04-whole') + '-' + look + '.webp';
const art = el('div', 'lx-art', '<div class="fr"><img class="pl" alt=""><img class="st" alt=""></div><p class="cap"></p>');
stage.insertBefore(art, q('.mid', stage));
const fr = q('.fr', art), artPl = q('.pl', art), artSt = q('.st', art), artCap = q('.cap', art);
// a copy may come without a scene's picture (two are held back until their rights are cleared): the scene then plays without one
for (const im of [artPl, artSt]) im.addEventListener('error', () => art.classList.add('lx-noart'));
function setArt(n) {
  art.dataset.n = n; art.classList.remove('lx-noart'); art.classList.toggle('cut', n === 4 || n === 0);
  artPl.src = artSrc(n, 'plate'); artSt.src = artSrc(n, 'stone');
  artPl.alt = (CAPS[n] || '').split('.')[0];
  artCap.innerHTML = esc(CAPS[n] || '') + (NOTES[n] ? ' <span class="verify">' + esc(NOTES[n]) + '</span>' : '');
}
function layoutArt() {
  const sr = stage.getBoundingClientRect(); if (!sr.height) return;
  measureHead();
  const tb = ticks.getBoundingClientRect(), topY = Math.max(64, tb.bottom - sr.top + 16);
  let bottom = topY + Math.round(sr.height * 0.42);
  if (standEl.classList.contains('on')) { const b = q('.body', standEl).getBoundingClientRect(); if (b.height) bottom = b.top - sr.top - 2; }
  const H = Math.max(120, bottom - topY), W = sr.width - 44, capH = 30, ar = AR[+art.dataset.n || 0] || 1;
  let h = H - capH, w = h * ar; if (w > W) { w = W; h = w / ar; }
  art.style.top = topY + 'px'; art.style.height = H + 'px'; fr.style.width = Math.round(w) + 'px'; fr.style.height = Math.round(h) + 'px';
}
addEventListener('resize', layoutArt);
if (D.fonts && D.fonts.ready) D.fonts.ready.then(layoutArt);
const preload = (n) => { if (n >= 1 && n <= 12) for (const k of ['plate', 'stone']) { const i = new Image(); i.src = artSrc(n, k); } };

// ---------------------------------------------------------------- the stage states
// lx-atmark: the mark card with the plate. lx-rising: the curtain. lx-playing: the quiet stage. lx-interval: the walk to the next mark.
let ctlT = 0;
function showCtl(ms) { stage.classList.add('lx-ctl'); clearTimeout(ctlT); ctlT = setTimeout(() => stage.classList.remove('lx-ctl'), ms || 3400); }
const hintEl = el('div', 'lx-hint', 'Touch the screen for the controls'); stage.appendChild(hintEl);
stage.addEventListener('click', (e) => {
  if (e.target.closest('.ctl')) { showCtl(); return; }
  if (e.target.closest('button,a,.card,#w1way')) return;
  if (stage.classList.contains('lx-ctl')) { stage.classList.remove('lx-ctl'); clearTimeout(ctlT); } else showCtl();
  hintEl.classList.remove('show');
});
q('#stBar').addEventListener('pointerdown', () => showCtl(6000));

D.addEventListener('medu:stopstart', (e) => {
  const d = e.detail || {}; scene = d.door ? 0 : d.n;
  stage.classList.remove('lx-atmark', 'lx-rising', 'lx-interval', 'lx-ctl'); stage.classList.add('lx-playing', 'lx-paused');
  setTheme(themeFor(scene || 1), true);
  setLoc(scene || 1, d.door ? 'door' : 'scene'); setArt(scene); layoutArt(); preload(scene + 1);
});
const origStand = window.standCard;
window.standCard = function () {
  const r = origStand.apply(this, arguments);
  // what is still to be checked on site is a review note: it shows with "Review notes" on (Settings), not on the visitor's card
  const sp = q('#standP'), VER = ' The exact spot is still to be checked on site.';
  if (sp && sp.textContent.endsWith(VER)) sp.innerHTML = esc(sp.textContent.slice(0, -VER.length)) + ' <span class="verify">' + VER.trim() + '</span>';
  stage.classList.remove('lx-playing', 'lx-rising', 'lx-interval'); stage.classList.add('lx-atmark');
  layoutArt(); requestAnimationFrame(layoutArt);
  Notes.play('mark', 0.6);
  return r;
};
// the curtain: the note sounds, the plate turns to stone, then the voices begin
q('#standGo').onclick = () => {
  Notes.unlock();
  const begin = () => { fresh = true; standEl.classList.remove('on'); stage.classList.remove('lx-atmark', 'lx-rising'); stage.classList.add('lx-playing'); au.muted = false; au.play().catch(() => toast('Tap play to start the sound.')); };
  if (still()) { begin(); return; }
  let started = false;
  // start the play inside this tap so the phone allows it, hold it silent while the note sounds
  try { au.muted = true; const p = au.play(); if (p && p.then) p.then(() => { if (!started) au.pause(); }).catch(() => {}); } catch (e) {}
  Notes.play('curtain', 0.75);
  stage.classList.add('lx-rising');
  setTimeout(() => { started = true; try { if (au.currentTime < 2) au.currentTime = 0; } catch (e) {} begin(); }, 1500);
};
let fresh = false;   // the curtain has just risen: the stage stays quiet, the controls come on touch
au.addEventListener('play', () => { if (au.muted) return; stage.classList.remove('lx-paused'); if (!stage.classList.contains('lx-atmark')) stage.classList.add('lx-playing'); if (fresh) fresh = false; else showCtl(2600); if (!S.hinted && !still()) { S.hinted = 1; save(); setTimeout(() => { hintEl.classList.add('show'); setTimeout(() => hintEl.classList.remove('show'), 5200); }, 3200); } });
au.addEventListener('pause', () => { if (au.muted) return; stage.classList.add('lx-paused'); });
au.addEventListener('timeupdate', () => { if (curTick && au.duration) curTick.style.setProperty('--p', Math.min(1, au.currentTime / au.duration).toFixed(3)); });

// after a scene: the walk to the next mark, drawn on the plan
let legNow = null;
function drawLeg(a, b) {
  legNow = [a, b];
  let box = q('#lxLeg'); if (!box) { box = el('div', 'lx-leg'); box.id = 'lxLeg'; nextEl.insertBefore(box, nextEl.firstChild); }
  const paint = () => {
    const W = box.clientWidth || stage.clientWidth || 390, H = box.clientHeight || 220;
    const pts = (LEGS[a + '-' + b] || [MARKS[a - 1], MARKS[b - 1]]).map(P2S);
    let x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
    const pad = Math.max(260, 0.3 * Math.max(x1 - x0, y1 - y0)); x0 -= pad; x1 += pad; y0 -= pad; y1 += pad * 1.15;
    let w = Math.max(x1 - x0, 1050), h = y1 - y0; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ar = W / H;
    if (w / h < ar) w = h * ar; else h = w / ar;
    box.innerHTML = planSVG({ id: 'lg', vb: [cx - w / 2, cy - h / 2, w, h], u: w / W, night: theme === 'night', done: new Set(S.done), cur: b, leg: [a, b], labels: true, r: 9, slice: true, label: 'The walk from scene ' + rn(a) + ' to scene ' + rn(b) });
  };
  paint(); requestAnimationFrame(paint);
}
const origFinish = window.finishStop;
window.finishStop = function () {
  const was = CUR && !CUR.door ? CUR.meta.n : 0;
  const r = origFinish.apply(this, arguments);
  stage.classList.remove('lx-playing', 'lx-ctl', 'lx-atmark', 'lx-rising');
  if (was && nextEl.classList.contains('on') && S.cur) { stage.classList.add('lx-interval'); setLoc(S.cur, 'walk'); drawLeg(was, S.cur); preload(S.cur); }
  return r;
};
const origShow = window.show;
window.show = function (id) {
  const r = origShow.apply(this, arguments);
  if (id === 'finale') {
    setTheme(themeFor(12), false); Notes.play('finale', 0.75);
    // the whole thread, drawn once more: twelve marks, all walked
    const fin = q('#finale'); let fp = q('#lxFin');
    if (!fp) { fp = el('div', 'lx-fin'); fp.id = 'lxFin'; fin.insertBefore(fp, fin.firstChild); }
    if (PLAYJ) fp.innerHTML = planSVG({ id: 'fn', vb: [0, 0, SHEET.w, SHEET.h], u: SHEET.w / (fp.clientWidth || 124), night: theme === 'night', done: new Set(PLAYJ.chapters.map((c) => c.n)), r: 3.4, plain: true, draw: !still(), label: 'The whole walk on the plan' });
  }
  return r;
};

// what the play shows fits the room that is left under the header, and fits again when its words change
// (a gold-line card opens as "Look for it" and then takes the cue, which may run to two lines)
const revEl = q('#rev');
const origFit = window.fitTrace;
window.fitTrace = function () {
  const tb = q('.tbox', revEl); if (!tb) return;
  const m = tb.parentElement; revEl.classList.add('lx-tr'); m.style.flex = '';
  origFit.apply(this, arguments);
  m.style.flex = '0 0 ' + Math.ceil(tb.offsetHeight) + 'px';   // the box closes on the picture: cue, picture and label read as one card
};
function fitRev() {
  const media = q('.media', revEl); if (!media) return;
  if (media.classList.contains('trace')) { window.fitTrace(); return; }
  if (media.classList.contains('then1')) {
    const cue = q('.cuebig', revEl), lbl = q('.lbl', revEl);
    const room = revEl.clientHeight - parseFloat(getComputedStyle(revEl).paddingTop) - (cue ? cue.offsetHeight : 0) - (lbl ? lbl.offsetHeight : 0);
    revEl.style.setProperty('--lx-room', Math.max(110, Math.floor(room)) + 'px');
  }
}
let revKey = '';
new MutationObserver(() => {
  const media = q('.media', revEl); if (!media) { revKey = ''; return; }
  const k = media.className + '|' + ((q('.cuebig', revEl) || {}).textContent || '') + '|' + ((q('.lbl', revEl) || {}).textContent || '');
  if (k !== revKey) { revKey = k; fitRev(); }
}).observe(revEl, { childList: true, characterData: true, subtree: true });
addEventListener('resize', () => { measureHead(); fitRev(); });

// ---------------------------------------------------------------- the programme: the plan, the thread, the scenes
const wrap = q('#walk .wrap'), h2 = q('#walk h2'), sub = q('#wkSub');
const sheetEl = el('div', 'lx-sheet', `<div id="lxPlan"></div><div class="tb"><p class="lx-eyebrow">The programme</p></div>
<div class="scale" aria-hidden="true"><div><span>0</span><span>25 m</span></div><i></i></div>
<svg class="rose" viewBox="-33 -34 66 76" aria-hidden="true"><circle r="25" fill="none" stroke="currentColor" stroke-width=".7" opacity=".7"/><circle r="29.5" fill="none" stroke="currentColor" stroke-width=".35" opacity=".5"/>
<g transform="rotate(50)"><path d="M0-25 3.6 0 0 5-3.6 0Z" fill="currentColor"/><path d="M0 25 3.6 0 0-5-3.6 0Z" fill="none" stroke="currentColor" stroke-width=".7"/><text y="-28.5" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="7" fill="currentColor" transform="rotate(-50 0 -31)">N</text></g>
<g transform="rotate(180)"><path d="M0-25V-11" stroke="#b28a3a" stroke-width="1.2"/><path d="M0-25l-3.2 6h6.4Z" fill="#b28a3a" stroke="currentColor" stroke-width=".5"/></g>
<text y="38" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="5.6" letter-spacing="1.4" fill="#b28a3a">MECCA</text></svg>
<div class="cred">Plan by Pascal Coste<br>Published 1839<br>New York Public Library</div>`);
(q('#w1strip') || sub).insertAdjacentElement('afterend', sheetEl);
const tb = q('.tb', sheetEl); if (h2) tb.appendChild(h2);
if (sub) { sub.classList.add('lx-subcap'); sheetEl.insertAdjacentElement('afterend', sub); }   // the plate's caption, under the sheet
const listK = el('p', 'lx-eyebrow lx-listk', 'The scenes'); q('#stops').insertAdjacentElement('beforebegin', listK);
// the way on: one button under the programme, never over it
const resume = q('#wkResume'); if (resume) { const foot = el('div', 'lx-foot'); q('#walk').appendChild(foot); foot.appendChild(resume); }
let planDrawn = false;
function renderPlan() {
  const box = q('#lxPlan'); if (!box || !PLAYJ) return;
  const W = sheetEl.clientWidth || 390, draw = !planDrawn && !still() && q('#walk').classList.contains('on');
  if (draw) planDrawn = true;
  box.innerHTML = planSVG({ id: 'pg', vb: [0, 0, SHEET.w, SHEET.h], u: SHEET.w / W, night: theme === 'night', done: new Set(S.done), cur: nextUnheard(), labels: true, hit: true, draw });
}
sheetEl.addEventListener('click', (e) => { const g = e.target.closest('g[data-n]'); if (g) openStop(+g.dataset.n); });
function decorateRows() {
  D.querySelectorAll('#stops .stop').forEach((b) => {
    const n = +b.dataset.n; if (!n || q('.th', b)) return;
    const i = new Image(); i.className = 'th'; i.alt = ''; i.loading = 'lazy'; i.onerror = () => i.remove(); i.src = artSrc(n, 'thumb'); b.appendChild(i);
  });
}
const origRender = window.renderWalk;
window.renderWalk = function () { const r = origRender.apply(this, arguments); if (PLAYJ) { renderPlan(); decorateRows(); } return r; };
const origWalk = window.openWalk;
window.openWalk = function () { if (PLAYJ) setTheme(themeFor(nextUnheard()), false); const r = origWalk.apply(this, arguments); stage.classList.remove('lx-playing', 'lx-atmark', 'lx-rising', 'lx-interval'); return r; };
addEventListener('resize', () => { if (q('#walk').classList.contains('on')) renderPlan(); });

// ---------------------------------------------------------------- settings: house lights, review notes
root.classList.toggle('lx-review', !!S.review);
const origSettings = window.settingsSheet;
window.settingsSheet = function () {
  origSettings.apply(this, arguments);
  const first = q('#sheetIn .row'); if (!first) return;
  const cur = S.lights || DEFAULT_LIGHTS, names = { auto: 'Sun', day: 'Day', night: 'Night' };
  const a = el('div', 'row', `<div>House lights<div class="small">Paper outdoors while the sun is up, night indoors and after sunset.</div></div><div class="lx-seg" role="group" aria-label="House lights">${Object.keys(names).map((k) => `<button data-lx-lights="${k}" aria-pressed="${cur === k}">${names[k]}</button>`).join('')}</div>`);
  const b = el('div', 'row', `<div>Review notes<div class="small">Show what is still to be checked on site.</div></div><button class="switch" role="switch" aria-checked="${!!S.review}" data-lx-review aria-label="Review notes"></button>`);
  first.parentNode.insertBefore(a, first); first.parentNode.insertBefore(b, first.nextSibling ? first.nextSibling.nextSibling : null);
};
q('#sheetIn').addEventListener('click', (e) => {
  const l = e.target.closest('[data-lx-lights]'), r = e.target.closest('[data-lx-review]');
  if (l) { S.lights = l.dataset.lxLights; save(); l.parentNode.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === l)); setTheme(themeFor(q('#stage').classList.contains('on') ? (scene || 1) : nextUnheard()), false); }
  if (r) { S.review = !S.review; save(); r.setAttribute('aria-checked', !!S.review); root.classList.toggle('lx-review', !!S.review); }
});

// ---------------------------------------------------------------- the download also carries this layer's pictures and notes
const LUX_FILES = ['lux/img/cover.jpg', 'lux/img/plan-ink.webp', 'lux/img/plan-glyph.png', 'lux/audio/mark.mp3', 'lux/audio/curtain.mp3', 'lux/audio/finale.mp3', artSrc(0, 'plate'), artSrc(0, 'stone')];
for (let n = 1; n <= 12; n++) for (const k of ['plate', 'stone', 'thumb']) LUX_FILES.push(artSrc(n, k));
const origAll = window.allFiles;
window.allFiles = async function () {
  const out = await origAll.apply(this, arguments);
  // a picture this copy does not hold is left out, so the download can still finish; anything unclear stays on the list
  const there = await Promise.all(LUX_FILES.map((u) => fetch(u, { method: 'HEAD', cache: 'no-store' }).then((r) => r.status !== 404 && r.status !== 410, () => true)));
  return [...new Set([...out, ...LUX_FILES.filter((u, i) => there[i])])];
};

// ---------------------------------------------------------------- the review copy, and the first paint once the play has loaded
if (PREVIEW) {
  window.onsite = () => true;
  const foot = q('#home .cv-foot'), cr = q('#home .cv-credit');
  if (foot && cr) { const p = el('p', 'cv-note rehearsal', 'Rehearsal copy: the door check is off, so the play opens anywhere.'); foot.insertBefore(p, cr); }
  // a rehearsal page may not be allowed to store files on the phone: say so plainly instead of failing
  const origDl = window.download;
  window.download = async function () {
    try { await caches.open('medu-probe'); await caches.delete('medu-probe'); }
    catch (e) { toast('This rehearsal copy plays over the network. The download works in the installed app.', 4600); return; }
    return origDl.apply(this, arguments);
  };
  const dlb = q('#dl'); if (dlb) dlb.onclick = () => window.download();
  // nothing leaves a rehearsal page: its address is private, so sharing says what it will do in the installed app
  window.share = async function () { toast('Rehearsal copy: nothing is sent from here. In the installed app this shares the play\u2019s address.', 4600); };
}
const ready = setInterval(() => {
  if (!PLAYJ) return; clearInterval(ready);
  fixPlay();
  const bl = q('#beginLbl'); if (bl && onsite()) bl.textContent = S.done.length ? 'Continue the play' : 'Begin the play';
  if (q('#walk').classList.contains('on')) { setTheme(themeFor(nextUnheard()), false); renderWalk(); }
}, 120);
window.MEDU_LUX = { planSVG, themeFor, setTheme, phrases, PREVIEW };
})();
