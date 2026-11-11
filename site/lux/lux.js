/* Medu · the luxury layer ("the folio and the thread"), behaviour.
   Loaded after wave1.js. Like wave1.js it wraps the page's own functions and never replaces the play's logic:
   the door check, the download, resume, prayer pauses, the lock-screen controls and the 3D way all stay as they are.

   What it adds
   - House lights: ink on paper outdoors while the sun is up (scenes I to IV and XII), gold on night indoors and after sunset.
   - Sense of place on every screen: scene and place in words, a dot on the little plan, twelve ticks for the play.
   - The programme: Coste's plan of 1839 with the twelve marks on one gold thread.
   - The stop: one way into every scene. The 3D guide leads to the mark, the old picture rises, the visitor draws it
     across and the scene begins on the same picture. Without the guide the layer has its own stop on the plan.
   - The picture area: the scene's old picture; gold drawings on measured plates and old photographs when the voices
     point at something. No present-day photograph is ever shown.
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
// one name for one thing: the app says "hall"; the play's notes gloss it as "(iwan)" or call it so
const halls = (t) => (typeof t === 'string' ? t.replace(/\s*\((?:the )?(?:qibla )?iwans?\)/gi, '').replace(/\bIwan(s?)\b/g, 'Hall$1').replace(/\biwan(s?)\b/g, 'hall$1') : t);
const still = () => S.fx === false || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const stage = q('#stage'), standEl = q('#standCard'), nextEl = q('#nextCard');
const IMG = 'lux/img/';

// ---------------------------------------------------------------- the plan (Coste, 1839) and the thread
// Positions are pixels on the key plan; P2S turns them onto the sheet (the square at the foot). 959 units = 50 m.
const SHEET = { w: 2380, h: 4695, img: 3295 };
const P2S = ([cx, cy]) => [cy - 16, 3078 - cx];
const LEGS = {
  '1-2': [[-1434, 1096], [-219, 1526]],
  '2-3': [[-219, 1526], [154, 1796], [839, 1889]],
  '3-4': [[839, 1889], [2118, 1906], [2386, 2127]],
  '4-5': [[2386, 2127], [2778, 2160], [2786, 2112], [2530, 1980], [2588, 1868], [2594, 1788]],
  '5-6': [[2594, 1788], [2518, 1684], [2446, 1646], [2440, 1520]],
  '6-7': [[2440, 1520], [2448, 1339], [2062, 1339], [1916, 1172]],
  '7-8': [[1916, 1172], [1732, 1401]],
  '8-9': [[1732, 1401], [1524, 1384], [1524, 1488], [1222, 1488], [1202, 1606], [1110, 1612]],
  '9-10': [[1110, 1612], [1202, 1606], [1222, 1488], [1524, 1488], [1524, 1384], [1414, 1272], [1102, 1266]],
  '10-11': [[1102, 1266], [898, 1247], [786, 1247], [770, 1107]],
  '11-12': [[770, 1107], [786, 1247], [898, 1247], [1414, 1272], [2062, 1339], [2448, 1339], [2440, 1520], [2446, 1646], [2518, 1684], [2594, 1788], [2588, 1868], [2530, 1980], [2786, 2112], [2778, 2160], [2386, 2127], [2118, 1906], [1596, 1953]],
};
const MARKS = [[-1434, 1096], [-219, 1526], [839, 1889], [2386, 2127], [2594, 1788], [2440, 1520], [1916, 1172], [1732, 1401], [1110, 1612], [1102, 1266], [770, 1107], [1596, 1953]];
const PLACES = ['In the square', 'In the square', 'In the lane', 'At the door', 'Inside the door', 'Towards the court', 'In the court', 'In the court', 'Off the court', 'Facing Mecca', 'Behind the prayer wall', 'Outside again'];
const LABELS = [   // [text, x, y, rotate]
  ['The court', 788, 1178, 0], ['Great', 1034, 2060, 0], ['hall', 1034, 2140, 0], ['The tomb', 1084, 2608, 0], ['The portal', 2040, 212, 0], ['The lane', 1836, 1838, -90], ['The square', 1500, 4420, 0],
];
const dPath = (pts) => pts.map(P2S).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(0) + ' ' + p[1].toFixed(0)).join(' ');
const legsPts = (a, b) => { let out = []; for (let i = a; i < b; i++) { const seg = LEGS[i + '-' + (i + 1)]; out = out.concat(out.length ? seg.slice(1) : seg); } return out; };
const INK = '#3A281A', NIGHT = '#0B0A08';

// On a walk card the plan is cut close and its scale changes from leg to leg. A label is drawn there only where it reads
// cleanly at that scale: whole inside the card, clear of every mark and of the thread (the tables are not touched).
function labelFree(L, o) {
  const [t, x, y, rot] = L, u = o.u, fs = 8.5 * u, w = t.length * fs * 0.95, pad = 5 * u, vb = o.vb;   // capitals, spaced .24em
  let x0 = x - w / 2, x1 = x + w / 2, y0 = y - fs * 0.85, y1 = y + fs * 0.2;
  if (rot) { x0 = x - fs * 0.85; x1 = x + fs * 0.2; y0 = y - w / 2; y1 = y + w / 2; }
  x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
  if (x0 < vb[0] || y0 < vb[1] || x1 > vb[0] + vb[2] || y1 > vb[1] + vb[3] - (o.foot || 0) * u) return false;   // foot: the card fades out there
  for (let i = 0; i < MARKS.length; i++) {
    const [mx, my] = P2S(MARKS[i]), r = (i + 1 === o.cur ? 19.5 : (o.r || 10.2)) * u;
    const dx = Math.max(x0 - mx, 0, mx - x1), dy = Math.max(y0 - my, 0, my - y1); if (dx * dx + dy * dy < r * r) return false;
  }
  const g = 4 * u, X0 = x0 - g, X1 = x1 + g, Y0 = y0 - g, Y1 = y1 + g;   // the thread has a width
  const cut = (a, b) => {   // does the stretch a-b enter the box? (Liang and Barsky)
    let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1];
    for (const [pp, qq] of [[-dx, a[0] - X0], [dx, X1 - a[0]], [-dy, a[1] - Y0], [dy, Y1 - a[1]]]) {
      if (pp === 0) { if (qq < 0) return false; } else { const r = qq / pp; if (pp < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } }
    }
    return true;
  };
  for (const line of [legsPts(1, 11), LEGS['11-12']]) { const pts = line.map(P2S); for (let i = 1; i < pts.length; i++) if (cut(pts[i - 1], pts[i])) return false; }
  return true;
}
function planLabels(o) {
  if (!o.labels) return [];
  if (!o.cull) {   // the programme: every label, kept whole inside the sheet on a narrow phone
    return LABELS.map((L) => { if (L[3]) return L; const half = L[0].length * 8.5 * o.u * 0.95 / 2 + 2 * o.u; return [L[0], Math.max(o.vb[0] + half, Math.min(o.vb[0] + o.vb[2] - half, L[1])), L[2], L[3]]; });
  }
  const out = [];   // two lines of one name ("Great" over "hall") stay or go together
  for (let i = 0; i < LABELS.length;) {
    let j = i + 1; while (j < LABELS.length && LABELS[j][1] === LABELS[i][1] && LABELS[j][3] === LABELS[i][3] && Math.abs(LABELS[j][2] - LABELS[j - 1][2]) <= 120) j++;
    const grp = LABELS.slice(i, j); if (grp.every((L) => labelFree(L, o))) out.push(...grp);
    i = j;
  }
  return out;
}
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
  for (const [t, x, y, rot] of planLabels(o)) s += `<text class="lbl" x="${x}" y="${y}" text-anchor="middle" font-size="${n2(8.5)}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}>${t}</text>`;
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
function fixPlay() { for (const c of PLAYJ.chapters) { c.title = halls(fixName(c.title)); c.stand = halls(fixName(c.stand)); } if (PLAYJ.door) PLAYJ.door.title = fixName(PLAYJ.door.title); }
const origLoadCh = window.loadCh;
window.loadCh = async function () {
  const ch = await origLoadCh.apply(this, arguments);
  if (ch && !ch._lx) {
    ch._lx = 1; const c = ch.c;
    for (const k of ['title', 'next', 'place']) c[k] = halls(fixName(c[k]));
    if (c.onsite) c.onsite.stand = halls(fixName(c.onsite.stand));
    for (const k in (c.speakers || {})) c.speakers[k] = fixName(c.speakers[k]);
    for (const l of ch.lines) { l.cap = fixName(l.cap); l.say = fixName(l.say); if (l.w) for (const w of l.w) w[0] = fixName(w[0]); }
    let off = 0;   // each pause's own time on the on-site mix; and one name for one thing: the app says halls
    for (const x of ch.ins) { x.cue = halls(fixName(x.cue)); x.element = halls(fixName(x.element || '')); x._s0 = x.at + off; x._s1 = x._s0 + x.dur; off += x.dur; }
    const plain = (t) => (typeof t === 'string' ? t.replace(/\s*\[VERIFY[^\]]*\]/g, '').replace(/\s*UNVERIFIED:?[\s\S]*$/, '').trim() : t);   // the play's working notes stay off the screen
    c.place = plain(c.place); if (c.onsite) c.onsite.stand = plain(c.onsite.stand); for (const k in (c.lineTags || {})) c.lineTags[k] = plain(c.lineTags[k]);
    for (const r of ch.reveals) for (const k of ['cue', 'label', 'thenCap', 'how', 'howSub']) if (r[k]) r[k] = halls(fixName(r[k]));
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
    if (onStage) fitWords();
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

// ---------------------------------------------------------------- the picture area: the scene's old picture, and the gold drawings
// One old picture per scene (public-domain records only). The guide's "Then" window shows the same pictures, same crops,
// so the hand-over from the guide to the stage is exact. rect = the 9:16 part a living opening starts on (x0, y0, x1, y1).
const THEN = {
  1: { f: 'ch01.webp', w: 1600, h: 1398, cap: 'The square', credit: 'Photograph, 19th century. New York Public Library', rect: [0.1157, 0, 0.6069, 1] },
  2: { f: 'ch02.webp', w: 881, h: 1200, cap: 'The dome and the two minarets', credit: 'Bonfils, 1870s. Library of Congress' },
  3: { f: 'ch03.webp', w: 1600, h: 1194, cap: 'The east corner and the long wall', credit: 'Max Herz, 1899' },
  4: { f: 'ch04.webp', w: 1196, h: 1600, cap: 'The portal', credit: 'Photograph, 19th century. Wellcome Collection', rect: [0.1321, 0, 0.8848, 1] },
  5: { f: 'ch05.webp', w: 1012, h: 1242, cap: 'The back wall of the entrance hall', credit: 'Max Herz, 1899' },
  6: { f: 'ch06.webp', w: 1551, h: 1540, cap: 'The way in, on the plan', credit: 'Pascal Coste, 1839. New York Public Library' },
  7: { f: 'ch07.webp', w: 1181, h: 1600, cap: 'The court and the great hall', credit: 'Max Herz, 1899', rect: [0.1616, 0, 0.9235, 1] },
  8: { f: 'ch08.webp', w: 1226, h: 1600, cap: 'The court: a side hall and a corner doorway', credit: 'Photograph, 1870s–90s. New York Public Library' },
  9: { f: 'ch09.webp', w: 1335, h: 727, cap: 'A college, on the plan', credit: 'Pascal Coste, 1839. New York Public Library' },
  10: { f: 'ch10.webp', w: 1600, h: 1198, cap: 'The great hall', credit: 'Photochrom, about 1875. New York Public Library', rect: [0.0465, 0, 0.4676, 1] },
  11: { f: 'ch11.webp', w: 1330, h: 1600, cap: 'The prayer niche of the tomb chamber', credit: 'Max Herz, 1899' },
  12: { f: 'ch12.webp', w: 1262, h: 1600, cap: 'The portal and the north-west wall', credit: 'Max Herz, 1899' },
};
const pad2 = (n) => String(n).padStart(2, '0');
const thenOf = (n) => THEN[n] || (n === 0 ? THEN[4] : null);   // the house rules are spoken at the door: the portal
const thenSrc = (n) => { const t = thenOf(n); return t ? IMG + 'then/' + t.f : ''; };
const thenThumb = (n) => IMG + 'then/ch' + pad2(n) + '-thumb.webp';
const thenCap = (n) => { const t = thenOf(n); return t ? t.cap + '. ' + t.credit : ''; };

// one thing in the picture area at a time: the cue (only in a Look pause), the picture or the drawing, its label and credit
const art = el('div', 'lx-art', '<p class="cue" aria-live="polite"></p><div class="fr"><div class="pic"><img class="th" alt=""></div><div class="dr"></div></div><p class="cap"><b></b><span></span></p>');
stage.insertBefore(art, q('.mid', stage));
const fr = q('.fr', art), pic = q('.pic', art), artTh = q('.th', art), drEl = q('.dr', art), artCue = q('.cue', art), capB = q('.cap b', art), capS = q('.cap span', art);
artTh.addEventListener('error', () => art.classList.add('lx-noart'));   // a copy without the picture: the scene plays without one
const setCap = (label, small) => { capB.textContent = label || ''; capS.textContent = small || ''; };
function setArt(n) {
  const t = thenOf(n); art.dataset.n = n; art.classList.toggle('lx-noart', !t);
  if (t) { if (artTh.getAttribute('src') !== thenSrc(n)) artTh.src = thenSrc(n); artTh.alt = t.cap; }
  artCue.textContent = ''; setCap('', thenCap(n));
}
function layoutArt() {
  const sr = stage.getBoundingClientRect(); if (!sr.height) return;
  measureHead();
  const tb = ticks.getBoundingClientRect(), topY = Math.max(64, tb.bottom - sr.top + 12);
  // the room between the header and the spoken phrase (the phrase keeps its three lines and the speaker's name)
  const mid = q('.mid', stage), mr = mid.getBoundingClientRect(), capEl = q('#stCap');
  const words = (parseFloat(getComputedStyle(capEl).minHeight) || 108) + 26 + (parseFloat(getComputedStyle(mid).paddingBottom) || 40);
  let bottom = mr.bottom - sr.top - words - 10;
  if (standEl.classList.contains('on')) { const b = q('.body', standEl).getBoundingClientRect(); if (b.height) bottom = b.top - sr.top - 2; }
  // the words come first: a phrase of four lines, or an Arabic line spoken over a drawing, takes its room from the picture area
  // (an Arabic line over the old picture does not: there the picture steps back and the line stands on it)
  if (!stage.classList.contains('lx-ar') || stage.classList.contains('lx-drawar')) { const w = q('#stWho').getBoundingClientRect(); if (w.height) bottom = Math.min(bottom, w.top - sr.top - 12); }
  art.style.top = topY + 'px'; art.style.height = Math.max(150, bottom - topY) + 'px';
  const t = thenOf(+art.dataset.n || 0), box = fr.getBoundingClientRect();
  if (t && box.height) { let h = box.height, w = h * t.w / t.h; if (w > box.width) { w = box.width; h = w * t.h / t.w; } pic.style.width = Math.round(w) + 'px'; pic.style.height = Math.round(h) + 'px'; }
}
let wordsTop = 0;
function fitWords() {   // called when the phrase changes: has the block of words grown or shrunk?
  const w = q('#stWho').getBoundingClientRect(), top = w.height ? Math.round(w.top) : 0;
  if (top !== wordsTop) { wordsTop = top; if (top && stage.classList.contains('lx-playing')) { layoutArt(); drawFit(); } }
}
addEventListener('resize', () => { layoutArt(); drawFit(); });
if (D.fonts && D.fonts.ready) D.fonts.ready.then(layoutArt);
const preload = (n) => { if (THEN[n]) { const i = new Image(); i.src = thenSrc(n); } };

// The gold drawings: lux/draw/chNN.json, fetched once per scene (a scene without a file simply has none).
// carriers: the measured plates (gold line on clear ground) and old photographs the lines are drawn on;
// moments: when (seconds on the on-site mix) and what to frame (box) and to lift (polys), as fractions of the carrier.
const DRAWDIR = 'lux/draw/', DRAW = {}, DRAWP = {};
const carSrc = (c) => { const o = []; for (const p of (DRAWDIR + c.file).split('/')) { if (p === '..') o.pop(); else if (p && p !== '.') o.push(p); } return o.join('/'); };   // a carrier may be the scene's own old picture ('../img/then/…'): one address for one file
const carCredit = (c) => [[c.credit, c.plate].filter(Boolean).join(', '), c.note].filter(Boolean).join(' · ');
function normDraw(d) {
  if (!d || typeof d !== 'object' || !d.carriers || !Array.isArray(d.moments)) return null;
  const ok = (m) => m && d.carriers[m.carrier] && d.carriers[m.carrier].file && +m.t1 > +m.t0 && (m.kind === 'look' || m.kind === 'line');
  const out = { carriers: d.carriers, moments: d.moments.filter(ok).sort((a, b) => a.t0 - b.t0) };
  for (const k in out.carriers) {   // a moment is shown only when its picture has come (a file that is not there leaves the old picture)
    const c = out.carriers[k]; c.w = +c.w || 1000; c.h = +c.h || 1000; c._ok = false;
    if (c.file) { const i = new Image(); i.onload = () => { c._ok = true; lpKey = ''; }; i.src = carSrc(c); }
  }
  return out.moments.length ? out : null;
}
function loadDraw(n) {
  if (!THEN[n]) return Promise.resolve(null);
  return DRAWP[n] || (DRAWP[n] = fetch(DRAWDIR + 'ch' + pad2(n) + '.json').then((r) => (r.ok ? r.json() : null)).then(normDraw).catch(() => null).then((d) => { DRAW[n] = d; lpKey = ''; return d; }));
}
let dCur = null, dCar = null, dVB = null, dRaf = 0, dSeq = 0;
function vbFor(m, c) {   // the box, widened to the shape of the picture area: the box is never cropped, the plate fills its ground
  const b = Array.isArray(m.box) && m.box.length === 4 ? m.box : [0, 0, 1, 1];
  let x = b[0] * c.w, y = b[1] * c.h, w = (b[2] - b[0]) * c.w, h = (b[3] - b[1]) * c.h;
  if (!(w > 0 && h > 0)) { x = 0; y = 0; w = c.w; h = c.h; }
  const r = drEl.getBoundingClientRect(), ar = r.width > 0 && r.height > 0 ? r.width / r.height : w / h;
  if (w / h < ar) { const nw = h * ar; x -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y -= (nh - h) / 2; h = nh; }
  const keep = (p, s, S) => (s >= S ? (S - s) / 2 : Math.max(0, Math.min(S - s, p)));   // the room that was added shows more of the picture, not an empty margin
  return [keep(x, w, c.w), keep(y, h, c.h), w, h];
}
const polyD = (m, c) => (Array.isArray(m.polys) ? m.polys : []).filter((p) => Array.isArray(p) && p.length > 2).map((p) => 'M' + p.map((v) => (v[0] * c.w).toFixed(1) + ' ' + (v[1] * c.h).toFixed(1)).join('L') + 'Z').join('');
function setVB(svg, vb, c) {
  dVB = vb; let v = vb, pxw = drEl.clientWidth || 360;
  if (c && c.kind === 'photo') {   // a photograph is never set between black bars: its frame takes the shape of the part that is shown
    const x0 = Math.max(vb[0], 0), y0 = Math.max(vb[1], 0), x1 = Math.min(vb[0] + vb[2], c.w), y1 = Math.min(vb[1] + vb[3], c.h), W = drEl.clientWidth, H = drEl.clientHeight;
    if (x1 > x0 && y1 > y0 && W && H) {
      v = [x0, y0, x1 - x0, y1 - y0];
      let w = W, h = w * v[3] / v[2]; if (h > H) { h = H; w = h * v[2] / v[3]; }
      place(svg.parentNode, (W - w) / 2, (H - h) / 2, w, h); pxw = w;
    }
  }
  svg.setAttribute('viewBox', v.map((k) => k.toFixed(1)).join(' '));
  const g = q('feGaussianBlur', svg); if (g) g.setAttribute('stdDeviation', (2.6 * v[2] / pxw).toFixed(2));   // a 2.6 px glow at any framing
}
function drawSVG(m, c, vb) {
  const id = 'lxd' + (++dSeq), d = polyD(m, c), plate = c.kind !== 'photo';
  const im = `<image href="${esc(carSrc(c))}" x="0" y="0" width="${c.w}" height="${c.h}" preserveAspectRatio="none"`;
  let s = `<svg class="${plate ? 'plate' : 'photo'}" viewBox="0 0 ${c.w} ${c.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(m.label || 'Drawing')}"><defs><clipPath id="${id}c" clipPathUnits="userSpaceOnUse"><path d="${d || 'M0 0'}"/></clipPath><filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="4"/></filter></defs>`;
  if (plate) s += im + ' opacity=".4"/>' + (d ? im + ` clip-path="url(#${id}c)"/>` : '');   // the whole plate dim, the element at full strength
  else s += im + '/>' + (d ? `<path class="sh" fill-rule="evenodd" d="M0 0H${c.w}V${c.h}H0Z${d}"/>` : '');   // the photograph whole, darker outside the element
  if (d) s += `<path class="gl" d="${d}" filter="url(#${id}g)"/><path class="ol" d="${d}"/>`;
  return s + '</svg>';
}
function drawShow(m, d) {
  if (dCur === m) return; const c = d.carriers[m.carrier];
  const to = vbFor(m, c), glide = !!(dCur && dCar === c && dVB && !still()), from = glide ? dVB.slice() : to, old = [...drEl.children];
  const ly = el('div', 'ly', drawSVG(m, c, from)), svg = ly.firstChild; drEl.appendChild(ly); setVB(svg, from, c);
  dCur = m; dCar = c; art.classList.add('lx-draw');
  void ly.offsetWidth; ly.classList.add('in');
  setTimeout(() => old.forEach((o) => o.remove()), still() ? 0 : 440);
  cancelAnimationFrame(dRaf);
  if (glide) {   // the framing travels to the next element in about 900 ms
    const t0 = performance.now(), ease = (k) => 1 - Math.pow(1 - k, 3);
    const step = (t) => { const k = Math.min(1, (t - t0) / 900), e = ease(k); if (!svg.isConnected) return; setVB(svg, from.map((v, i) => v + (to[i] - v) * e), c); if (k < 1) dRaf = requestAnimationFrame(step); };
    dRaf = requestAnimationFrame(step);
  }
}
function drawHide(now) {
  if (!dCur && !drEl.firstChild) return;
  dCur = null; dCar = null; dVB = null; cancelAnimationFrame(dRaf); art.classList.remove('lx-draw');
  if (now || still()) drEl.innerHTML = ''; else setTimeout(() => { if (!dCur) drEl.innerHTML = ''; }, 440);
}
function drawFit() { if (!dCur || !dCar) return; const svg = q('.ly:last-child svg', drEl); if (svg) { cancelAnimationFrame(dRaf); setVB(svg, vbFor(dCur, dCar), dCar); } }

// What the picture area shows now. Priority: a Look pause (its drawing, else the old picture), a line drawing, a portrait
// (the play's own card), the old picture. Called after every paint of the play.
let lpKey = '';
function luxPaint() {
  if (!CUR || CUR.door || !stage.classList.contains('on')) return;
  const n = CUR.meta.n, d = DRAW[n] || null, ms = d ? d.moments.filter((x) => d.carriers[x.carrier]._ok) : [], s = au.currentTime, b = siteToBase(CUR, s);
  let m = null; for (const x of ms) if (s >= x.t0 && s < x.t1) { m = x; break; }
  let show = null, cue = '', label = '';
  if (b.ins) {
    const x = b.ins; cue = x.cue || 'Look.';
    show = (m && m.kind === 'look' ? m : null) || ms.find((y) => y.kind === 'look' && y.t0 < x._s1 && y.t1 > x._s0) || null;
    if (!show) label = x.element || '';
  } else if (m) {
    show = m;
    if (m.kind === 'look') { const x = CUR.ins.find((y) => y._s0 < m.t1 && y._s1 > m.t0); if (x && s < x._s0) cue = 'Look for it'; }
  }
  const ar = !!show && stage.classList.contains('lx-ar');   // an Arabic line takes the stage and the old picture steps back; a drawing does not
  const key = n + '|' + (show ? ms.indexOf(show) : -1) + '|' + cue + '|' + label + '|' + ar;
  if (key === lpKey) return; lpKey = key;
  stage.classList.toggle('lx-over', !!(show || b.ins));   // a pause or a drawing comes before a portrait
  const arCh = stage.classList.contains('lx-drawar') !== ar; stage.classList.toggle('lx-drawar', ar);
  const cueCh = artCue.textContent !== cue || arCh; artCue.textContent = cue;
  if (cueCh) layoutArt();
  if (show) { const c = d.carriers[show.carrier], same = dCur === show; drawShow(show, d); if (same && cueCh) drawFit(); art.classList.toggle('lx-plate', c.kind !== 'photo'); setCap(show.label || '', carCredit(c)); }
  else { drawHide(); setCap(label, thenCap(n)); }
}

// ---------------------------------------------------------------- the stage states
// lx-playing: the quiet stage. lx-interval: the walk to the next mark. lx-atmark / lx-rising: the door scene's card and its curtain.
let ctlT = 0;
function showCtl(ms) { stage.classList.add('lx-ctl'); clearTimeout(ctlT); ctlT = setTimeout(() => stage.classList.remove('lx-ctl'), ms || 3400); }
const hintEl = el('div', 'lx-hint', 'Touch the screen for the controls'); stage.appendChild(hintEl);
stage.addEventListener('click', (e) => {
  if (e.target.closest('#lxStop')) return;
  if (liveOn()) { if (!e.target.closest('button,a')) liveEnd(); return; }   // a touch ends a living opening
  if (e.target.closest('.ctl')) { showCtl(); return; }
  if (e.target.closest('button,a,.card,#w1way')) return;
  if (stage.classList.contains('lx-ctl')) { stage.classList.remove('lx-ctl'); clearTimeout(ctlT); } else showCtl();
  hintEl.classList.remove('show');
});
q('#stBar').addEventListener('pointerdown', () => showCtl(6000));

let stopPending = false;   // a scene is being opened through the stop: the house lights change without their announcement
D.addEventListener('medu:stopstart', (e) => {
  const d = e.detail || {}; scene = d.door ? 0 : d.n;
  stage.classList.remove('lx-atmark', 'lx-rising', 'lx-interval', 'lx-ctl', 'lx-over', 'lx-drawar'); stage.classList.add('lx-playing', 'lx-paused');
  setTheme(themeFor(scene || 1), !stopPending);
  liveEnd(true); drawHide(true); lpKey = '';
  setLoc(scene || 1, d.door ? 'door' : 'scene'); setArt(scene); layoutArt(); preload(scene + 1);
  if (scene) loadDraw(scene);
});
// With the layer on, the play's own mark card is only used by the door scene (the house rules). Every scene is entered
// through the stop (below): the guide, the old picture, one gesture.
const origStand = window.standCard;
window.standCard = function () {
  if (CUR && !CUR.door) { standEl.classList.remove('on'); stopOpen(CUR.meta.n); return; }
  const r = origStand.apply(this, arguments);
  stage.classList.remove('lx-playing', 'lx-rising', 'lx-interval'); stage.classList.add('lx-atmark');
  layoutArt(); requestAnimationFrame(layoutArt);
  Notes.play('mark', 0.6);
  return r;
};
// the door scene's curtain: the note sounds, then the voice begins
q('#standGo').onclick = () => {
  Notes.unlock();
  const begin = () => { fresh = true; standEl.classList.remove('on'); stage.classList.remove('lx-atmark', 'lx-rising'); stage.classList.add('lx-playing'); layoutArt(); au.muted = false; au.play().catch(() => toast('Tap play to start the sound.')); };
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
    box.innerHTML = planSVG({ id: 'lg', vb: [cx - w / 2, cy - h / 2, w, h], u: w / W, night: theme === 'night', done: new Set(S.done), cur: b, leg: [a, b], labels: true, cull: true, foot: 56, r: 9, slice: true, label: 'The walk from scene ' + rn(a) + ' to scene ' + rn(b) });
  };
  paint(); requestAnimationFrame(paint);
}
const origFinish = window.finishStop;
window.finishStop = function () {
  const was = CUR && !CUR.door ? CUR.meta.n : 0;
  const r = origFinish.apply(this, arguments);
  stage.classList.remove('lx-playing', 'lx-ctl', 'lx-atmark', 'lx-rising', 'lx-over', 'lx-drawar'); liveEnd(true); drawHide(true); lpKey = '';
  if (was && nextEl.classList.contains('on') && S.cur) { stage.classList.add('lx-interval'); setLoc(S.cur, 'walk'); drawLeg(was, S.cur); preload(S.cur); }
  const wb = q('#w1wayBtn'); if (wb) wb.onclick = () => { wayMode = 'walk'; openStop(S.cur); };   // the guide's walk, then the same stop as every other way in
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

// What the play itself may put on the stage. With the layer on, no present-day photograph is ever shown: no "then and
// now" compare, no traced photograph, no Look card. For their time the picture area keeps the old picture (or its drawing).
// Portraits (drawn, not photographs) and the blackouts stay as the play has them.
const revEl = q('#rev');
const quietRev = () => { revEl.className = ''; revEl.innerHTML = ''; stage.classList.remove('dark'); };
const origReveal = window.showReveal;
window.showReveal = function (r) { if (!r || r.kind === 'wipe' || r.kind === 'trace') { quietRev(); return; } return origReveal.apply(this, arguments); };
window.showLook = function () { quietRev(); };
const origPaint = window.paint;
window.paint = function () { const r = origPaint.apply(this, arguments); try { luxPaint(); } catch (e) {} return r; };
addEventListener('resize', measureHead);

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
    const i = new Image(); i.className = 'th'; i.alt = ''; i.loading = 'lazy'; i.onerror = () => i.remove(); i.src = thenThumb(n); b.appendChild(i);
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
  b.insertAdjacentElement('afterend', el('div', 'row', '<div>The trailer<div class="small">Thirty seconds of film, shown once before the play.</div></div><button class="pill ghost" style="width:auto;padding:0 18px;min-height:40px" data-lx-film>Watch</button>'));
};
q('#sheetIn').addEventListener('click', (e) => {
  const l = e.target.closest('[data-lx-lights]'), r = e.target.closest('[data-lx-review]');
  if (e.target.closest('[data-lx-film]')) { closeSheet(); window.trailer(); return; }
  if (l) { S.lights = l.dataset.lxLights; save(); l.parentNode.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === l)); setTheme(themeFor(q('#stage').classList.contains('on') ? (scene || 1) : nextUnheard()), false); }
  if (r) { S.review = !S.review; save(); r.setAttribute('aria-checked', !!S.review); root.classList.toggle('lx-review', !!S.review); }
});

// ---------------------------------------------------------------- the download also carries this layer's pictures and notes
const LUX_FILES = ['lux/img/cover.jpg', 'lux/img/plan-ink.webp', 'lux/img/plan-glyph.png', 'lux/audio/mark.mp3', 'lux/audio/curtain.mp3', 'lux/audio/finale.mp3'];
for (let n = 1; n <= 12; n++) LUX_FILES.push(thenSrc(n), thenThumb(n));
const origAll = window.allFiles;
window.allFiles = async function () {
  const out = await origAll.apply(this, arguments);
  // a picture this copy does not hold is left out, so the download can still finish; anything unclear stays on the list.
  // The living openings and the trailer are films: they stream and are never on this list.
  // each scene's drawings and the pictures they are drawn on, where the scene has them
  const lux = LUX_FILES.slice();
  for (let n = 1; n <= 12; n++) { const d = await loadDraw(n); if (d) { lux.push(DRAWDIR + 'ch' + pad2(n) + '.json'); for (const k in d.carriers) if (d.carriers[k].file) lux.push(carSrc(d.carriers[k])); } }
  const there = await Promise.all(lux.map((u) => fetch(u, { method: 'HEAD', cache: 'no-store' }).then((r) => r.status !== 404 && r.status !== 410, () => true)));
  return [...new Set([...out, ...lux.filter((u, i) => there[i])])];
};

// ---------------------------------------------------------------- the stop: one way into every scene
// The way in (the 3D guide: the walk, or straight to the mark) -> the camera comes to rest and the old picture rises ->
// the visitor draws the old picture across -> the scene begins on the same picture. No card, no button in between.
//
// The contract with the guide (its v13):
//   we open   guide3d/index.html?embed=lux&bottom=<px>#walk-chNN | #mark-chNN
//   we post   {type:'medu:embed', mode:'lux', bottom:<px>, title:'Scene IV · The portal'}   on load and on resize
//             {type:'medu:go', ch:'ch04', mode:'stand'}                                       on "I am there"
//   it posts  {type:'medu:settled', ch:'ch04', then:true|false}    the stand camera is at rest, its old picture is up
//             {type:'medu:ready', ch:'ch04'}                       the visitor has drawn the picture all the way across
//   the same two events as hashes on the guide's own address: #settled-ch04, #ready-ch04.
// A message counts only from the guide's own window and for the scene being opened; each event acts once per stop.
const GUIDE = 'guide3d/index.html', HINT = 'Draw the old picture across to begin';
let NOQ = false;   // this host did not serve the guide with a query string: open it plain, embed mode goes by message
const guideSrc = (mode, ch) => GUIDE + (NOQ ? '' : '?embed=lux&bottom=' + bandPx()) + '#' + mode + '-' + ch;
const stopEl = el('div', 'lx-stop', `<iframe class="g" title="The way to the mark" allow="geolocation; accelerometer; gyroscope; magnetometer"></iframe>
<div class="own" hidden><div class="pl"></div><div class="op"><img alt="" draggable="false"></div><input type="range" min="0" max="100" step="2" value="8" aria-label="Draw the old picture across the plan"><div class="kn" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>
<button class="x cl" aria-label="Close and return to the programme"><svg width="20" height="20"><use href="#close"/></svg></button>
<div class="band"><p class="ey"></p><p class="st"></p><div class="act"><span class="hint"></span><button class="tb" data-a="there">I am there</button><button class="tb" data-a="begin">Begin</button></div></div>`);
stopEl.id = 'lxStop'; stage.appendChild(stopEl);
const frame = q('iframe', stopEl), ownEl = q('.own', stopEl), ownPic = q('.op', stopEl), rng = q('input', stopEl), knob = q('.kn', stopEl), bandEl = q('.band', stopEl);
let ST = null, wayMode = '';   // ST: the stop that is open. wayMode 'walk': the next card's "Show me the way"
const standLine = (m) => {
  let t = String((m && m.stand) || '').split(/UNVERIFIED|\[VERIFY|\(3D guide/)[0].trim().replace(/[\s:;,(]+$/, '');
  if (t && !/[.!?]$/.test(t)) t += '.';
  return t.replace(/^./, (x) => x.toUpperCase());
};
const hasGL = () => { try { const c = D.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } };
const bandPx = () => Math.round(bandEl.getBoundingClientRect().height) || 132;
const postGuide = (msg) => { try { frame.contentWindow.postMessage(msg, '*'); } catch (e) {} };
const sayEmbed = () => { if (ST && !ST.own) postGuide({ type: 'medu:embed', mode: 'lux', bottom: bandPx(), title: ST.title }); };
// The play's sound must be allowed to start when the guide says "ready" (a message, not a touch): the visitor's own
// touch in this page (the one that opened the scene, or "I am there") starts the audio element silently and stops it.
function prime() {
  try {
    if (!au.paused) return; au.muted = true; const p = au.play();
    const back = () => { if (!au.muted) return; try { au.pause(); } catch (e) {} au.muted = false; if (au.currentTime < 2) { try { au.currentTime = 0; } catch (e) {} if (CUR && !CUR.door && S.pos[CUR.meta.n] < 2) { delete S.pos[CUR.meta.n]; save(); } } };
    if (p && p.then) p.then(back, () => { au.muted = false; }); else back();
  } catch (e) { au.muted = false; }
}
function stopCurtain(n) {   // the ground and the band are up at once, before the scene's files have answered
  const m = (PLAYJ.chapters.find((c) => c.n === n) || {});
  q('.ey', stopEl).textContent = 'Scene ' + rn(n) + ' · ' + (m.title || ''); q('.st', stopEl).textContent = standLine(m); q('.hint', stopEl).textContent = '';
  stopEl.className = 'lx-stop on pre';
}
function stopClear() {
  if (ST) { clearInterval(ST.poll); clearTimeout(ST.t6); clearTimeout(ST.t20); clearTimeout(ST.tGo); }
  ST = null; stopEl.className = 'lx-stop'; ownEl.hidden = true; q('.pl', stopEl).innerHTML = '';
  if (frame.getAttribute('src') && frame.getAttribute('src') !== 'about:blank') frame.src = 'about:blank';
}
function stopOpen(n) {   // the scene's files are loaded and the stage is set underneath; called in place of the play's mark card
  const m = PLAYJ.chapters.find((c) => c.n === n) || {}, ch = 'ch' + pad2(n), mode = wayMode === 'walk' ? 'walk' : 'mark'; wayMode = '';
  if (ST) { clearInterval(ST.poll); clearTimeout(ST.t6); clearTimeout(ST.t20); clearTimeout(ST.tGo); }
  stopCurtain(n);
  ST = { n, ch, mode, title: 'Scene ' + rn(n) + ' · ' + (m.title || ''), settled: false, done: false, own: false, answered: false, then: true, bn: 0, gone: 0, loaded: false, goQ: false, tGo: 0 };
  stopEl.className = 'lx-stop on walking'; preload(n);
  if (!hasGL()) { stopOwn(); return; }
  frame.src = guideSrc(mode, ch);
  ST.poll = setInterval(stopPoll, 250);
  ST.t6 = setTimeout(noGuide, 6000, n);   // the guide has not come: our own stop
}
const guideCanvas = () => { try { return !!frame.contentWindow.document.querySelector('canvas'); } catch (e) { return false; } };
const noGuide = (n) => { if (ST && ST.n === n && !ST.own && !ST.answered && !guideCanvas()) stopOwn(); };
frame.addEventListener('load', () => {
  const src = frame.getAttribute('src') || '';
  if (ST && !ST.own && !NOQ && src.indexOf('?') > 0 && !guideCanvas()) {   // what came back is not the guide (the query was refused): ask once more, plain
    NOQ = true; clearTimeout(ST.t6); ST.t6 = setTimeout(noGuide, 6000, ST.n); frame.src = guideSrc(ST.mode, ST.ch); return;
  }
  sayEmbed();
});
addEventListener('resize', () => { if (!ST) return; sayEmbed(); if (ST.own) ownLayout(); });
addEventListener('message', (e) => {
  if (!ST || ST.own || e.source !== frame.contentWindow) return;
  const d = e.data; if (!d || typeof d !== 'object' || typeof d.type !== 'string' || d.type.indexOf('medu:') !== 0) return;
  ST.answered = true; guideLoaded();   // the guide speaks: it can hear us too
  if (d.ch !== ST.ch) return;
  if (d.type === 'medu:settled') stopSettled(d.then !== false); else if (d.type === 'medu:ready') stopReady(false);
});
function stopPoll() {
  if (!ST || ST.own || ST.done) return; let w, h = '';
  try { w = frame.contentWindow; h = String(w.location.hash || ''); } catch (e) { return; }
  if (!ST.loaded) { try { const doc = w.document; if (doc && doc.readyState === 'complete' && doc.querySelector('canvas') && !doc.getElementById('load')) guideLoaded(); } catch (e) {} }   // a guide that never says "loaded": its own loading screen is gone
  if (h === '#settled-' + ST.ch) stopSettled(true); else if (h === '#ready-' + ST.ch) stopReady(false);
  if (ST && !ST.done) watch(w);
}
// The guide's own "Then" window is also watched from here (same origin, read only): settled = the window is up in the
// stand view, ready = its knob has travelled to within 6 % of the far side. Messages, hashes and this watch feed the same
// two handlers; whichever comes first wins. (Guide v13.0 asks for the last 8 px, which its own knob cannot reach on a
// screen wider than 400 px; this watch covers it.) If the visitor puts the old picture away, "Begin" comes at once.
// The guide's own small close button for that window is hidden: there is one close control on screen, ours.
// ---- bridge: the parts marked v12 can go when no v12 guide is left (v12 does not speak the contract at all).
function watch(w) {
  try {
    const R = w.__r, doc = w.document; if (!R || !R.state || !doc) return;
    const v12 = parseFloat(R.version || '0') < 13;
    if (!doc.getElementById('lxEmbed')) { const s = doc.createElement('style'); s.id = 'lxEmbed'; s.textContent = '#thenx{display:none!important}' + (v12 ? '.band{visibility:hidden!important;pointer-events:none!important}.band *{pointer-events:none!important}#cue,#thenhead{display:none!important}' : ''); (doc.head || doc.documentElement).appendChild(s); }
    const st = R.state(); if (st.cur !== ST.ch || st.mode !== 'stand') { ST.bn = 0; return; }
    const wrap = doc.getElementById('thenwrap'), up = !!wrap && w.getComputedStyle(wrap).display !== 'none';
    if (!ST.settled) { if (up) stopSettled(true); else if (v12 && ++ST.bn > 14) stopSettled(false); return; }   // v12: 3.5 s at the stand and no old picture: none here
    if (!up) { if (++ST.gone > 4) showBegin(); return; }
    ST.gone = 0; if (!ST.then) { ST.then = true; q('.hint', stopEl).textContent = HINT; }
    const bar = doc.getElementById('thenbar').getBoundingClientRect(), im = doc.getElementById('thenimg').getBoundingClientRect();
    const x0 = Math.max(0, im.left), x1 = Math.min(w.innerWidth, im.right), x = bar.left + bar.width / 2;
    if (x1 > x0 && x >= x1 - 0.06 * (x1 - x0)) stopReady(false);
  } catch (e) {}
}
function bridgeGo() { try { const R = frame.contentWindow.__r; if (R && R.go && parseFloat(R.version || '0') < 13) R.go(ST.ch); } catch (e) {} }   // v12
// ---- end of the bridge
const showBegin = () => { if (ST && !ST.done) stopEl.classList.add('canbegin'); };
// The guide installs its message listener only when its model is in, and says so with {type:'medu:loaded'}. A "go" sent
// before that is lost, so "I am there" is held until then (or until its loading screen is gone, or six seconds at most).
const sayGo = () => { if (ST) postGuide({ type: 'medu:go', ch: ST.ch, mode: 'stand' }); };
function guideLoaded() { if (!ST || ST.loaded) return; ST.loaded = true; sayEmbed(); if (ST.goQ) { ST.goQ = false; clearTimeout(ST.tGo); sayGo(); } }   // it listens now: embed mode by message too (a query may have been dropped on the way)
function stopSettled(then) {
  if (!ST || ST.settled || ST.done) return;
  ST.settled = true; ST.then = !!then; ST.answered = true;
  stopEl.classList.remove('walking', 'pre', 'canbegin'); stopEl.classList.add('settled');   // a "Begin" that came up while the guide was slow steps back: the picture is there to be drawn
  q('.hint', stopEl).textContent = then ? HINT : '';
  clearTimeout(ST.t20);
  if (then) ST.t20 = setTimeout(showBegin, 20000); else showBegin();   // "Begin" only where there is no picture to draw, or after twenty seconds
  Notes.play('mark', 0.6); livePrep(ST.n);
}
function stopReady(tap) {   // the picture has been drawn across (or "Begin"): the curtain note, the voices, the stage
  if (!ST || ST.done) return;
  const st = ST, n = st.n; st.done = true; st.goQ = false; clearTimeout(st.t20); clearTimeout(st.t6); clearTimeout(st.tGo); clearInterval(st.poll);
  Notes.play('curtain', 0.75);
  let p = null, went = false;
  const go = () => { if (went || ST !== st) return; went = true; stopRise(n); };
  const refused = () => { if (went || ST !== st) return; if (tap) { go(); return; } st.done = false; st.poll = setInterval(stopPoll, 250); stopEl.classList.add('canbegin'); };   // the phone wants a touch: "Begin" at once
  try { au.muted = false; if (au.currentTime < 2) au.currentTime = 0; fresh = true; p = au.play(); } catch (e) { refused(); return; }
  if (p && p.then) { p.then(go, refused); setTimeout(go, 700); } else go();
}
function stopRise(n) {   // the guide fades, the stage is up on the same old picture
  stage.classList.remove('lx-atmark', 'lx-rising'); stage.classList.add('lx-playing');
  layoutArt(); liveStart(n);
  stopEl.classList.add('out');
  const st = ST; setTimeout(() => { if (ST === st) stopClear(); }, still() ? 0 : 520);
}
bandEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]'); if (!b || !ST) return;
  if (b.dataset.a === 'begin') { Notes.unlock(); stopReady(true); return; }
  // "I am there": the guide flies to the stand and raises the old picture
  prime(); bridgeGo();
  if (ST.loaded) sayGo(); else if (!ST.goQ) { const st = ST; st.goQ = true; st.tGo = setTimeout(() => { if (ST === st && st.goQ) sayGo(); }, 6000); }   // at six seconds it is sent on trust, and once more when the guide does say it is loaded
  if (!ST.settled) { clearTimeout(ST.t20); ST.t20 = setTimeout(showBegin, 20000); }   // a guide that never answers still lets the play begin
});
q('.cl', stopEl).onclick = () => { stopClear(); liveEnd(true); stopAudio(); openWalk(); };

// Without the guide (no WebGL, or it has not come within six seconds): our own stop, the same gesture.
// Coste's plan, close on the mark; the old picture is drawn across it with the knob.
let ownV = 8;
function ownSet(v, fromInput) {
  ownV = Math.max(0, Math.min(100, v));
  q('img', ownPic).style.clipPath = 'inset(0 ' + (100 - ownV).toFixed(1) + '% 0 0)';
  knob.style.left = (ownPic.offsetLeft + ownPic.offsetWidth * ownV / 100) + 'px'; knob.style.top = (ownPic.offsetTop + ownPic.offsetHeight / 2) + 'px';
  if (!fromInput) rng.value = Math.round(ownV);
  rng.setAttribute('aria-valuetext', Math.round(ownV) + ' percent across');
}
function ownLayout() {
  if (!ST || !ST.own) return;
  ownEl.style.bottom = bandPx() + 'px';
  const t = THEN[ST.n], W = ownEl.clientWidth, H = ownEl.clientHeight, top = 66, mw = W - 32, mh = H - top - 18;
  let h = mh, w = h * t.w / t.h; if (w > mw) { w = mw; h = w * t.h / t.w; }
  Object.assign(ownPic.style, { width: Math.round(w) + 'px', height: Math.round(h) + 'px', left: Math.round((W - w) / 2) + 'px', top: Math.round(top + (mh - h) / 2) + 'px' });
  Object.assign(rng.style, { left: ownPic.style.left, width: ownPic.style.width, top: Math.round(top + mh / 2 - 23) + 'px' });
  const [x, y] = P2S(MARKS[ST.n - 1]), pw = 1500, ph = pw * H / Math.max(1, W);
  q('.pl', stopEl).innerHTML = planSVG({ id: 'so', vb: [x - pw / 2, y - ph / 2, pw, ph], u: pw / Math.max(1, W), night: true, done: new Set(S.done), cur: ST.n, labels: true, cull: true, r: 9, slice: true, label: 'The mark of scene ' + rn(ST.n) + ' on the plan' });
  knob.style.setProperty('--h', (ownPic.offsetHeight / 2) + 'px'); ownSet(ownV);
}
function stopOwn() {
  if (!ST || ST.own) return;
  ST.own = true; ST.goQ = false; clearInterval(ST.poll); clearTimeout(ST.t6); clearTimeout(ST.tGo);
  if (frame.getAttribute('src') && frame.getAttribute('src') !== 'about:blank') frame.src = 'about:blank';
  stopEl.classList.remove('pre'); stopEl.classList.add('ownon'); ownEl.hidden = false;
  const im = q('img', ownPic); im.src = thenSrc(ST.n); im.alt = THEN[ST.n].cap;
  ownV = 8; ownLayout(); stopSettled(true);
}
(() => {   // the knob: a drag anywhere on the picture area moves it by the distance travelled; the slider is for keys and screen readers
  let d = null;
  ownEl.addEventListener('pointerdown', (e) => { if (!ST || !ST.own || ST.done) return; d = { x: e.clientX, v: ownV }; try { ownEl.setPointerCapture(e.pointerId); } catch (err) {} ownEl.classList.add('drag'); });
  ownEl.addEventListener('pointermove', (e) => { if (!d) return; ownSet(d.v + (e.clientX - d.x) / Math.max(1, ownPic.offsetWidth) * 100); });
  const up = () => { if (!d) return; d = null; ownEl.classList.remove('drag'); if (ownV >= 94) { ownSet(100); stopReady(true); } };
  ownEl.addEventListener('pointerup', up); ownEl.addEventListener('pointercancel', () => { d = null; ownEl.classList.remove('drag'); });
  ownEl.addEventListener('dragstart', (e) => e.preventDefault());   // a mouse must not pick the picture up
  rng.addEventListener('input', () => { ownSet(+rng.value, true); if (ownV >= 94) { ownSet(100); stopReady(true); } });
})();

// every way into a scene goes through the stop; a scene that is picked up where it was left, or heard again, does not
const prevOpen = window.openStop;
window.openStop = async function (n, skipStand) {
  const door = n === 1 && PLAYJ && PLAYJ.door && !S.door && !skipStand && !S.pos[1] && !S.done.length;
  const via = !!PLAYJ && THEN[n] && !skipStand && !S.pos[n] && !door;
  if (via) { prime(); stopPending = true; stopCurtain(n); } else { wayMode = ''; if (ST) stopClear(); }
  try { return await prevOpen.call(this, n, skipStand); }
  finally { stopPending = false; if (!ST) { if (via) stopClear(); au.muted = false; } }
};

// ---------------------------------------------------------------- the living opening (scenes I, IV, VII, X)
// At "ready" the old picture grows from where it stands until its 9:16 part covers the screen; a five-second film, laid
// exactly over it, plays once without sound behind the header and the spoken phrase, then gives way to the quiet stage.
// The films stream (never downloaded, never precached). The curtain note and the voices never wait for them.
const ANIM = {};
for (const n of [1, 4, 7, 10]) ANIM[n] = { src: 'lux/media/anim/ch' + pad2(n) + '.mp4', poster: 'lux/media/anim/ch' + pad2(n) + '.jpg', rect: THEN[n].rect };
const liveEl = el('div', 'lx-live', '<img class="p" alt=""><video muted playsinline preload="auto" disablepictureinpicture></video>'); liveEl.setAttribute('aria-hidden', 'true');
stage.insertBefore(liveEl, q('.mid', stage));
const liveV = q('video', liveEl), liveP = q('.p', liveEl);
let LV = null;   // { n, ok: the film can play, bad: it cannot, state: '' | 'grow' | 'roll' | 'out' }
const liveOn = () => !!(LV && (LV.state === 'grow' || LV.state === 'roll'));
function liveDrop() { if (LV) { clearTimeout(LV.t1); clearTimeout(LV.t2); clearTimeout(LV.t3); } LV = null; liveV.oncanplay = liveV.onerror = liveV.onended = null; try { liveV.pause(); } catch (e) {} if (liveV.getAttribute('src')) { liveV.removeAttribute('src'); try { liveV.load(); } catch (e) {} } liveEl.className = 'lx-live'; stage.classList.remove('lx-liveon'); }
function livePrep(n) {   // the stop has settled: start loading the film
  const a = ANIM[n]; if (!a || still()) return; if (LV && LV.n === n) return;
  liveDrop(); const lv = LV = { n, ok: false, bad: false, state: '' };
  liveV.muted = true; liveV.defaultMuted = true; liveV.loop = false;
  liveV.oncanplay = () => { lv.ok = true; }; liveV.onerror = () => { lv.bad = true; if (LV === lv && liveOn()) liveEnd(); };
  liveV.src = a.src; try { liveV.load(); } catch (e) { lv.bad = true; }
}
const place = (e, x, y, w, h) => Object.assign(e.style, { left: x.toFixed(1) + 'px', top: y.toFixed(1) + 'px', width: w.toFixed(1) + 'px', height: h.toFixed(1) + 'px' });
function liveStart(n) {   // at "ready". False: no film, the stage opens the plain way
  const a = ANIM[n], t = THEN[n], lv = LV;
  if (!a || !lv || lv.n !== n || lv.bad || !lv.ok || still() || D.visibilityState !== 'visible') { liveDrop(); return false; }   // not ready to play at "ready": no film
  const sr = stage.getBoundingClientRect(), pr = pic.getBoundingClientRect(), W = sr.width, H = sr.height;
  if (!pr.width || !W) { liveDrop(); return false; }
  liveP.src = thenSrc(n); liveEl.className = 'lx-live on'; place(liveP, pr.left - sr.left, pr.top - sr.top, pr.width, pr.height);   // the old picture, exactly where it stands
  lv.state = 'grow'; stage.classList.add('lx-liveon');
  const rw = a.rect[2] - a.rect[0], rh = a.rect[3] - a.rect[1], k = Math.max(W / (rw * t.w), H / (rh * t.h));   // cover: on a tall phone the sides are cut evenly
  void liveP.offsetWidth; liveEl.classList.add('grow');
  place(liveP, W / 2 - (a.rect[0] + rw / 2) * t.w * k, H / 2 - (a.rect[1] + rh / 2) * t.h * k, t.w * k, t.h * k);
  lv.t1 = setTimeout(() => {   // the film, laid over the picture: 300 ms in, once, no sound
    if (LV !== lv || lv.state !== 'grow') return;
    let p = null; try { liveV.currentTime = 0; p = liveV.play(); } catch (e) { liveEnd(); return; }
    lv.state = 'roll'; liveV.onended = () => { if (LV === lv) liveEnd(); };
    const on = () => { if (LV === lv && lv.state === 'roll') liveEl.classList.add('roll'); };
    if (p && p.then) p.then(on, () => { if (LV === lv) liveEnd(); }); else on();
    lv.t3 = setTimeout(() => { if (LV === lv) liveEnd(); }, 9000);   // a film that stalls does not hold the stage
  }, 900);
  return true;
}
function liveEnd(now) {   // the film ends, or a touch: 600 ms to the quiet stage, the old picture back in its place
  const lv = LV; if (!lv) return; if (lv.state === 'out' && !now) return; if (!liveOn() || now) { liveDrop(); return; }
  clearTimeout(lv.t1); clearTimeout(lv.t3); lv.state = 'out'; liveEl.classList.add('out');
  setTimeout(() => stage.classList.remove('lx-liveon'), 300);
  lv.t2 = setTimeout(() => { if (LV === lv) liveDrop(); }, 620);
}
D.addEventListener('visibilitychange', () => {   // a film never plays to a hidden page
  if (!LV || LV.state !== 'roll') return;
  if (D.visibilityState !== 'visible') { try { liveV.pause(); } catch (e) {} } else { const lv = LV; try { const p = liveV.play(); if (p && p.catch) p.catch(() => { if (LV === lv) liveEnd(); }); } catch (e) { liveEnd(); } }
});

// ---------------------------------------------------------------- the trailer, before the play
// The first time the visitor begins the play (the cover's "Begin"), the thirty-second film plays full screen with its
// own sound, then the programme opens with scene I ready. Once only; afterwards it is one tap away on the cover and in
// the settings. Far from the mosque the same film is the trailer. The film streams: it is never downloaded or precached.
const FILM = { src: 'lux/media/trailer-30s.mp4', poster: 'lux/media/trailer-30s.jpg' };
const filmEl = el('div', 'lx-film', '<video playsinline preload="auto" disablepictureinpicture></video><div class="ps"><button class="pill gold" data-f="play">Play the trailer</button></div><button class="sk" data-f="skip">Skip</button>');
filmEl.id = 'lxFilm'; filmEl.setAttribute('role', 'dialog'); filmEl.setAttribute('aria-label', 'The trailer'); D.body.appendChild(filmEl);
const filmV = q('video', filmEl);
let FM = null;   // { auto: before the play (once) | false: asked for, armed, shown, started, bad, quiet: poster and a button, done(), fail() }
function filmDrop() {
  if (FM) clearTimeout(FM.tw); FM = null;
  filmV.onplaying = filmV.onended = filmV.onerror = null; try { filmV.pause(); } catch (e) {}
  if (filmV.getAttribute('src')) { filmV.removeAttribute('src'); filmV.removeAttribute('poster'); try { filmV.load(); } catch (e) {} }
  filmEl.className = 'lx-film';
}
function filmWire(fm) {
  filmV.muted = false; filmV.loop = false; filmV.volume = 1;
  filmV.onplaying = () => { if (FM !== fm) return; fm.started = true; clearTimeout(fm.tw); if (fm.auto && fm.shown && !S.film) { S.film = Date.now(); save(); } try { if (!tr.paused && !tr.getAttribute('src')) tr.pause(); } catch (e) {} };
  filmV.onended = () => { if (FM === fm) filmDone(fm); };
  filmV.onerror = () => { fm.bad = true; if (FM === fm && fm.shown) filmFail(fm); };
  if (fm.quiet) { filmV.preload = 'metadata'; filmV.poster = FILM.poster; } else { filmV.preload = 'auto'; filmV.removeAttribute('poster'); }
  filmV.src = FILM.src;
}
function filmPlay(fm) {
  let p = null; try { p = filmV.play(); } catch (e) { fm.bad = true; if (fm.shown) filmFail(fm); return; }
  if (p && p.then) p.then(() => { if (FM === fm && !fm.shown) { try { filmV.pause(); } catch (e) {} } }, (e) => { if (FM !== fm || (e && e.name === 'AbortError' && !fm.shown)) return; fm.bad = true; if (fm.shown) filmFail(fm); });
}
function filmArm() {   // inside the tap on "Begin": the film is allowed its sound; it is shown when the door check has passed
  filmDrop(); const fm = FM = { auto: true, armed: true, shown: false, started: false, bad: false, quiet: still(), done: null, fail: null };
  filmWire(fm); if (!fm.quiet) filmPlay(fm);
}
function filmShow(done) {
  const fm = FM; fm.shown = true; fm.armed = false; fm.done = done || null;
  if (fm.bad) { filmFail(fm); return; }   // the file is missing or cannot play: on with the play, silently
  filmEl.className = 'lx-film on' + (fm.quiet ? ' poster' : ''); q('.sk', filmEl).textContent = fm.auto ? 'Skip' : 'Close';
  if (!fm.quiet) { if (filmV.paused) { try { filmV.currentTime = 0; } catch (e) {} filmPlay(fm); } fm.tw = setTimeout(() => { if (FM === fm && !fm.started) filmFail(fm); }, 8000); }   // a film that never starts does not hold the play
}
function filmDone(fm) { const done = fm.done; if (fm.auto && !S.film) { S.film = Date.now(); save(); } filmDrop(); if (done) done(); }   // the end, or "Skip"
let filmGone = false;   // the film could not be had on this visit: it is not asked for again before every scene
function filmFail(fm) { const next = fm.auto ? fm.done : fm.fail; if (fm.auto) filmGone = true; filmDrop(); if (next) next(); }
function filmOpen(o) {   // asked for: "Watch the trailer"
  filmDrop(); const fm = FM = { auto: false, armed: false, shown: false, started: false, bad: false, quiet: false, done: null, fail: (o && o.fail) || null };
  filmWire(fm); filmPlay(fm); filmShow(null);
}
filmEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]'), fm = FM; if (!b || !fm) return;
  if (b.dataset.f === 'skip') { filmDone(fm); return; }
  fm.quiet = false; filmEl.classList.remove('poster'); if (fm.auto && !S.film) { S.film = Date.now(); save(); }
  filmPlay(fm); fm.tw = setTimeout(() => { if (FM === fm && !fm.started) filmFail(fm); }, 8000);
});
D.addEventListener('keydown', (e) => { if (e.key === 'Escape' && FM && FM.shown) filmDone(FM); });
D.addEventListener('visibilitychange', () => {   // never plays to a hidden page; when the page is back and the phone wants a touch, the button
  const fm = FM; if (!fm || !fm.shown || fm.quiet) return;
  if (D.visibilityState !== 'visible') { try { filmV.pause(); } catch (e) {} return; }
  try { const p = filmV.play(); if (p && p.catch) p.catch(() => { if (FM === fm) { fm.quiet = true; filmEl.classList.add('poster'); } }); } catch (e) {}
});
// the cover's "Begin": the first time, the film comes before the programme
const origBegin = window.begin;
q('#btnBegin').onclick = () => { if (PLAYJ && !S.film && !filmGone) filmArm(); else if (FM && FM.armed) filmDrop(); origBegin(); };
const walkLux = window.openWalk;
window.openWalk = function () {
  if (FM && FM.armed && !FM.shown) { filmShow(() => walkLux.call(window)); return; }
  return walkLux.apply(this, arguments);
};
// A visitor can reach the programme without the cover's "Begin" (a saved visit, a rehearsal page). The film has still
// not been seen: the first tap that starts the play from the programme ("Begin: scene I", a row, a mark on the plan) shows
// it first, inside that tap (so it has its sound), and then goes where the tap was going. The screen stays dark between
// the film and the scene.
const stopLux = window.openStop;
window.openStop = function (n, skipStand) {
  if (!PLAYJ || S.film || filmGone || FM || !q('#walk').classList.contains('on')) return stopLux.apply(this, arguments);
  return new Promise((res) => {
    filmArm();
    filmShow(() => {
      filmEl.className = 'lx-film on hold';
      const fin = () => { if (!FM) filmEl.className = 'lx-film'; res(); };
      let p = null; try { p = stopLux.call(window, n, skipStand); } catch (e) {}
      Promise.resolve(p).then(fin, fin);
    });
  });
};
// "Watch the trailer": the cover, the settings, and the sheet shown far from the mosque. If the film cannot be had, the
// play's own audio trailer takes its place.
const origTrailer = window.trailer;
window.trailer = function () {
  try { if (tr.paused && !tr.getAttribute('src')) { const p = tr.play(); if (p && p.catch) p.catch(() => {}); } } catch (e) {}   // inside the tap, so the audio trailer may still start if the film cannot
  filmOpen({ fail: () => origTrailer() });
};
const tb0 = q('#btnTrailer'); if (tb0) { tb0.textContent = 'Watch the trailer'; tb0.onclick = () => window.trailer(); }
const origGate = window.gateSheet;
window.gateSheet = function () { const r = origGate.apply(this, arguments); const b = q('#sheetIn [data-act="trailer"]'); if (b) b.textContent = 'Watch the trailer'; return r; };

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
window.MEDU_LUX = { planSVG, themeFor, setTheme, phrases, PREVIEW, THEN, stop: () => ST && { n: ST.n, ch: ST.ch, mode: ST.mode, settled: ST.settled, own: ST.own, done: ST.done }, draw: (n) => DRAW[n] };
})();
