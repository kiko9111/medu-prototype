# Medu On-site Edition: build plan (v1)

kareem's pick, 5 Nov 2026: "On-site play PWA (private link)".
North star: get visitors to physically visit Sultan Hassan; the site is the stage. On-site only; at home = trailer.

## What v1 is
A phone web app (installable PWA) that a visitor opens at the mosque. It plays the 12-stop dialogue play
already built by the play thread, but as a product, not a review player:

1. **At home**: a short trailer (the play's opening, ending on "come and stand here"), visit info
   (hours, Friday prayer, dress, tickets: all [VERIFY]) and a **Download for the visit** button.
2. **Offline**: one tap stores the whole on-site play (about 39 MB) on the phone, so it runs with no signal.
3. **On-site gate**: the play opens only near the mosque (GPS, within ~350 m). If GPS fails, the visitor can
   say "I'm at the mosque" (no payment or unlock logic in the client, per CLAUDE.md).
4. **The walk**: 12 stops in order, where to stand, walking time, ticks for stops done, resume where you stopped.
5. **Stage player** (ears first): the screen stays dark; it shows only the speaker + caption, the "look" cues during
   look pauses, portraits on a character's first line, the ghost-minaret clip, then/now wipes, and a buzz on dark beats.
   Lock-screen controls, screen kept awake while playing, reduced-motion path.
6. **Credits** per stop (sources, licences, Dramatised / Unverified tags) from the chapter files.
7. **Finale**: "You walked Sultan Hassan" + Al-Rifa'i coming next.

## How it is built
- New folder `site/` in kiko9111/medu-prototype. It reads the play build in `play/` at runtime
  (play.json, chNN/chapter.json, lines.json, on-site mixes), so every play update reaches the app with no copy step.
  The play thread keeps owning `play/`; this thread never edits it.
- Own service worker scoped to `site/` caches the app shell and, on "Download", every on-site file.
- Private review copy as a claude.ai Artifact. Offline/install only work fully on the real web address,
  which goes live only with kareem's OK (push to main = public).

## Not in v1 (next)
GPS per outdoor stop, 3D key plan "stand here" marks (3D thread), souvenir card, Arabic UI, analytics, paid unlock (server-side only).

## [VERIFY] before launch
Mosque coordinates and gate radius, opening hours, Friday closure time, ticket price, walking times.
