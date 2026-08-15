# Resistance Training Tracker (PWA)

A mobile web app version of your workout log: browse the program, log sets/weight/reps/notes
each session, and track progress over time — all stored locally on your phone, fully offline
after the first load.

## What's inside
- `index.html`, `style.css`, `app.js` — the app
- `data.js` — the full 8-week program (auto-generated from your plan)
- `manifest.json`, `service-worker.js` — what makes it installable + offline-capable
- `icons/` — app icon

## Install it on your Android phone

A PWA needs to be served over **HTTPS** for Chrome to offer the "install" / offline features
(opening the file directly from your Downloads folder will *work*, but skips installability
and offline caching). The easiest free options:

### Option A — GitHub Pages (recommended, free)
1. Create a new GitHub repo (e.g. `workout-tracker`).
2. Upload all the files in this folder (keep the folder structure, especially `icons/`).
3. Go to the repo's **Settings → Pages**, set Source to your main branch, save.
4. GitHub gives you a URL like `https://yourname.github.io/workout-tracker/`.
5. Open that URL in Chrome on your Android phone.
6. Tap the **⋮** menu → **Add to Home screen** (or Chrome may prompt you automatically).
7. Open it from your home screen — it launches full-screen, like an app.

### Option B — Netlify Drop (no account needed)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop) on your computer.
2. Drag this whole folder onto the page.
3. Netlify gives you a live HTTPS URL instantly — open it on your phone and install as above.

### Option C — quick local test (no install, no offline)
Open `index.html` directly on your phone (e.g. AirDrop/email it to yourself, or use a file
manager app). It'll run and log data fine, but skip the "Add to Home Screen" step for the
full app-like experience.

## Your data
Everything you log stays in your phone's browser storage (`localStorage`) — nothing is sent
anywhere. Use **Settings → Export data** occasionally to save a backup JSON file (handy if
you switch phones, clear browser data, or reinstall). **Import data** restores from that file.

## Updating the program later
If you edit the spreadsheet again and want the app to match, the exercise list lives in
`data.js` as a plain JS object (`PROGRAM_DATA`) — send me the updated sheet and I can
regenerate it.
