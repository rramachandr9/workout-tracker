/* ---------- Storage ---------- */
const LOGS_KEY = "wt_logs_v1";
const SETTINGS_KEY = "wt_settings_v1";

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY)) || [];
  } catch (e) {
    return [];
  }
}
function saveLogs(logs) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}
function loadSettings() {
  try {
    return Object.assign({ unit: "lb" }, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {});
  } catch (e) {
    return { unit: "lb" };
  }
}
function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

let LOGS = loadLogs();
let SETTINGS = loadSettings();

function addLog(entry) {
  LOGS.push(entry);
  saveLogs(LOGS);
}
function deleteLog(id) {
  LOGS = LOGS.filter((l) => l.id !== id);
  saveLogs(LOGS);
}
function getMeso(id) {
  return PROGRAM_DATA.mesos.find((m) => m.id === id);
}
function getLogsForMesoDay(mesoId, day) {
  return LOGS.filter((l) => l.mesoId === mesoId && l.day === day).sort((a, b) =>
    a.date < b.date ? 1 : -1
  );
}
function getLastLogForMesoDay(mesoId, day) {
  const list = getLogsForMesoDay(mesoId, day);
  return list.length ? list[0] : null;
}
function getLastSetValue(mesoId, day, exercise, setIndex) {
  const last = getLastLogForMesoDay(mesoId, day);
  if (!last) return null;
  const match = last.sets.find((s) => s.exercise === exercise && s.setIndex === setIndex);
  return match || null;
}
function allLogsSorted() {
  return [...LOGS].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
function uniqueLoggedExercises() {
  const names = new Set();
  LOGS.forEach((l) => l.sets.forEach((s) => {
    const hasData = s.weight !== "" || s.reps !== "";
    if (hasData) names.add(s.exercise);
  }));
  return Array.from(names).sort();
}
function exerciseHistory(name) {
  const points = [];
  allLogsSortedAsc().forEach((l) => {
    const setsForEx = l.sets.filter((s) => s.exercise === name && (s.weight !== "" || s.reps !== ""));
    if (!setsForEx.length) return;
    let topWeight = null;
    setsForEx.forEach((s) => {
      const w = parseFloat(s.weight);
      if (!isNaN(w) && (topWeight === null || w > topWeight)) topWeight = w;
    });
    points.push({ date: l.date, weight: topWeight, sets: setsForEx, mesoId: l.mesoId, day: l.day });
  });
  return points;
}
function allLogsSortedAsc() {
  return [...LOGS].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/* ---------- Utils ---------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}
function formatDateNice(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function unitLabel() {
  return SETTINGS.unit || "lb";
}
function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ---------- App State ---------- */
const state = {
  tab: "home",
  program: { view: "list", mesoId: null },
  log: { view: "list", mesoId: null, day: null },
  progress: { view: "history", exercise: null },
};

const titles = { home: "Workout Log", program: "Program", log: "Log a Session", progress: "Progress" };

function setTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.getElementById("topbarTitle").textContent = titles[tab];
  render();
  document.getElementById("app").scrollTo(0, 0);
  window.scrollTo(0, 0);
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  if (state.tab === "home") renderHome(app);
  else if (state.tab === "program") renderProgram(app);
  else if (state.tab === "log") renderLog(app);
  else if (state.tab === "progress") renderProgress(app);
}

/* ---------- HOME ---------- */
function renderHome(app) {
  const total = LOGS.length;
  const last = allLogsSorted()[0];
  const mesoIds = new Set(LOGS.map((l) => l.mesoId + "-" + l.day));
  const started = mesoIds.size;

  app.innerHTML = `
    <div class="stat-grid">
      <div class="stat-box"><div class="stat-num">${total}</div><div class="stat-label">Sessions logged</div></div>
      <div class="stat-box"><div class="stat-num">${started}/16</div><div class="stat-label">Day-slots started</div></div>
    </div>
    <div class="card">
      <div class="eyebrow">Last Session</div>
      ${
        last
          ? `<p style="font-weight:700;font-size:15px;margin-bottom:2px;">${escapeHtml(getMeso(last.mesoId).theme)} \u2014 ${escapeHtml(getMeso(last.mesoId).weekLabel)}, Day ${last.day}</p>
             <p class="muted">${formatDateNice(last.date)}</p>`
          : `<p class="muted">No sessions logged yet. Tap "Log a session" to get started.</p>`
      }
    </div>
    <button class="btn btn-primary" id="goLogBtn" style="margin-bottom:10px;">Log a session</button>
    <button class="btn btn-secondary" id="goProgramBtn">View program</button>

    <div class="section-header"><h2>Program at a glance</h2></div>
    <div id="homeMesoList"></div>
  `;
  document.getElementById("goLogBtn").onclick = () => setTab("log");
  document.getElementById("goProgramBtn").onclick = () => setTab("program");

  const list = document.getElementById("homeMesoList");
  let lastTheme = null;
  PROGRAM_DATA.mesos.forEach((m) => {
    if (m.theme !== lastTheme) {
      const h = document.createElement("div");
      h.className = "faint";
      h.style.margin = "14px 0 6px";
      h.textContent = m.theme.toUpperCase();
      list.appendChild(h);
      lastTheme = m.theme;
    }
    const l1 = getLastLogForMesoDay(m.id, 1);
    const l2 = getLastLogForMesoDay(m.id, 2);
    const card = document.createElement("div");
    card.className = "card";
    card.style.padding = "12px 14px";
    card.innerHTML = `
      <div class="card-row">
        <div>
          <div style="font-weight:700;font-size:13px;">${escapeHtml(m.weekLabel)} (orig. Week ${m.origWeekNum})</div>
          <div class="faint">Day 1: ${l1 ? formatDateNice(l1.date) : "not logged"} &nbsp;\u00b7&nbsp; Day 2: ${l2 ? formatDateNice(l2.date) : "not logged"}</div>
        </div>
      </div>`;
    list.appendChild(card);
  });
}

/* ---------- PROGRAM (read-only browser) ---------- */
function renderProgram(app) {
  if (state.program.view === "detail") {
    renderProgramDetail(app);
    return;
  }
  let html = "";
  let lastTheme = null;
  PROGRAM_DATA.mesos.forEach((m) => {
    if (m.theme !== lastTheme) {
      html += `<div class="section-header"><h2>${escapeHtml(m.theme)}</h2></div>`;
      lastTheme = m.theme;
    }
    html += `
      <div class="card card-tap meso-card" data-meso="${m.id}">
        <div class="meso-theme">Originally PDF Week ${m.origWeekNum}</div>
        <div class="meso-title">${escapeHtml(m.weekLabel)}</div>
        <div class="muted">Day 1: ${escapeHtml(m.day1.title)}</div>
        <div class="muted">Day 2: ${escapeHtml(m.day2.title)}</div>
      </div>`;
  });
  html += `<div class="section-header"><h2>Cooldown (every session)</h2></div><div class="card" id="cooldownRef"></div>`;
  app.innerHTML = html;
  app.querySelectorAll("[data-meso]").forEach((c) => {
    c.onclick = () => {
      state.program.mesoId = parseInt(c.dataset.meso, 10);
      state.program.view = "detail";
      render();
    };
  });
  const cd = document.getElementById("cooldownRef");
  cd.innerHTML = PROGRAM_DATA.cooldown
    .map(([item, dur]) => `<div class="check-row"><label>${escapeHtml(item)}</label><span class="faint">${escapeHtml(dur)}</span></div>`)
    .join("");
}

function renderProgramDetail(app) {
  const m = getMeso(state.program.mesoId);
  app.innerHTML = `<button class="back-link" id="backBtn">&larr; All weeks</button>`;
  const back = document.getElementById("backBtn");
  back.onclick = () => {
    state.program.view = "list";
    render();
  };
  [1, 2].forEach((dayNum) => {
    const d = dayNum === 1 ? m.day1 : m.day2;
    const wrap = document.createElement("div");
    wrap.className = "card";
    let inner = `<div class="eyebrow">Day ${dayNum}</div><h3>${escapeHtml(d.title)}</h3><p class="muted">${escapeHtml(d.date)}</p>`;
    if (d.icebreaker) inner += `<p class="faint">${escapeHtml(d.icebreaker)}</p>`;
    if (d.formatNote) inner += `<p class="faint">${escapeHtml(d.formatNote)}</p>`;
    inner += `<div class="eyebrow" style="margin-top:14px;">Warm-up</div>`;
    inner += d.warmup.map((w) => `<div class="faint" style="padding:3px 0;">\u2022 ${escapeHtml(w)}</div>`).join("");
    inner += `<div class="eyebrow" style="margin-top:14px;">Workout</div>`;
    let curCat = null;
    d.workout.forEach((ex) => {
      if (ex.category !== curCat) {
        inner += `<div class="category-tag">${escapeHtml(ex.category)}</div>`;
        curCat = ex.category;
      }
      inner += `<div class="exercise-group"><div class="exercise-name">${escapeHtml(ex.exercise)}</div><div class="exercise-meta">${escapeHtml(ex.target)} (${ex.sets} ${escapeHtml(ex.unit)}${ex.sets > 1 ? "s" : ""})</div></div>`;
    });
    wrap.innerHTML = inner;
    app.appendChild(wrap);
  });
}

/* ---------- LOG ---------- */
function renderLog(app) {
  if (state.log.view === "form") {
    renderLogForm(app);
    return;
  }
  let html = "";
  let lastTheme = null;
  PROGRAM_DATA.mesos.forEach((m) => {
    if (m.theme !== lastTheme) {
      html += `<div class="section-header"><h2>${escapeHtml(m.theme)}</h2></div>`;
      lastTheme = m.theme;
    }
    html += `<div class="card" style="padding:14px;">
      <div class="meso-theme">Originally PDF Week ${m.origWeekNum}</div>
      <div class="meso-title" style="margin-bottom:10px;">${escapeHtml(m.weekLabel)}</div>
      <button class="day-btn" data-meso="${m.id}" data-day="1">
        <div class="title">Day 1 \u2014 ${escapeHtml(m.day1.title)}</div>
        <div class="sub">${getLogsForMesoDay(m.id, 1).length} session(s) logged</div>
      </button>
      <button class="day-btn" data-meso="${m.id}" data-day="2">
        <div class="title">Day 2 \u2014 ${escapeHtml(m.day2.title)}</div>
        <div class="sub">${getLogsForMesoDay(m.id, 2).length} session(s) logged</div>
      </button>
    </div>`;
  });
  app.innerHTML = html;
  app.querySelectorAll(".day-btn").forEach((b) => {
    b.onclick = () => {
      state.log.mesoId = parseInt(b.dataset.meso, 10);
      state.log.day = parseInt(b.dataset.day, 10);
      state.log.view = "form";
      render();
    };
  });
}

function renderLogForm(app) {
  const m = getMeso(state.log.mesoId);
  const day = state.log.day;
  const d = day === 1 ? m.day1 : m.day2;

  app.innerHTML = `<button class="back-link" id="backBtn">&larr; Choose a different day</button>`;
  document.getElementById("backBtn").onclick = () => {
    state.log.view = "list";
    render();
  };

  const header = document.createElement("div");
  header.className = "card";
  header.innerHTML = `
    <div class="eyebrow">${escapeHtml(m.weekLabel)} \u00b7 Day ${day}</div>
    <h3>${escapeHtml(d.title)}</h3>
    <div class="field-row" style="margin-top:10px;">
      <label>Date</label>
      <input type="date" class="input" id="logDate" value="${todayISO()}" />
    </div>
  `;
  app.appendChild(header);

  // Warm-up
  const warmupCard = document.createElement("div");
  warmupCard.className = "card";
  warmupCard.innerHTML = `<div class="eyebrow">Warm-up</div>` +
    d.warmup.map((w, i) => `
      <div class="check-row">
        <input type="checkbox" id="wu_${i}" />
        <label for="wu_${i}">${escapeHtml(w)}</label>
      </div>`).join("");
  app.appendChild(warmupCard);

  // Workout
  const workoutCard = document.createElement("div");
  workoutCard.className = "card";
  let workoutHtml = `<div class="eyebrow">Workout</div>`;
  let curCat = null;
  d.workout.forEach((ex, exIdx) => {
    if (ex.category !== curCat) {
      workoutHtml += `<div class="category-tag" style="margin-top:10px;">${escapeHtml(ex.category)}</div>`;
      curCat = ex.category;
    }
    workoutHtml += `<div class="exercise-group">
      <div class="exercise-name">${escapeHtml(ex.exercise)}</div>
      <div class="exercise-meta">Target: ${escapeHtml(ex.target)}</div>`;
    for (let s = 1; s <= ex.sets; s++) {
      const last = getLastSetValue(m.id, day, ex.exercise, s);
      workoutHtml += `
        <div class="set-row">
          <div class="set-label">${escapeHtml(ex.unit)} ${s}</div>
          <div>
            <input class="input" type="number" inputmode="decimal" placeholder="${last && last.weight !== "" ? last.weight : unitLabel()}" id="w_${exIdx}_${s}" />
          </div>
          <div>
            <input class="input" type="number" inputmode="numeric" placeholder="${last && last.reps !== "" ? last.reps : "reps"}" id="r_${exIdx}_${s}" />
          </div>
          <div>
            <input class="input" type="text" placeholder="notes" value="${last ? escapeHtml(last.notes || "") : ""}" id="n_${exIdx}_${s}" />
          </div>
        </div>`;
    }
    workoutHtml += `</div>`;
  });
  workoutCard.innerHTML = workoutHtml;
  app.appendChild(workoutCard);

  // Cooldown
  const cdCard = document.createElement("div");
  cdCard.className = "card";
  cdCard.innerHTML = `<div class="eyebrow">Cooldown</div>` +
    PROGRAM_DATA.cooldown.map(([item, dur], i) => `
      <div class="check-row">
        <input type="checkbox" id="cd_${i}" />
        <label for="cd_${i}">${escapeHtml(item)} <span class="faint">(${escapeHtml(dur)})</span></label>
      </div>`).join("");
  app.appendChild(cdCard);

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-primary";
  saveBtn.textContent = "Save session";
  saveBtn.onclick = () => saveLogFromForm(m, day, d);
  app.appendChild(saveBtn);
}

function saveLogFromForm(m, day, d) {
  const date = document.getElementById("logDate").value || todayISO();
  const sets = [];
  d.workout.forEach((ex, exIdx) => {
    for (let s = 1; s <= ex.sets; s++) {
      const weight = document.getElementById(`w_${exIdx}_${s}`).value;
      const reps = document.getElementById(`r_${exIdx}_${s}`).value;
      const notes = document.getElementById(`n_${exIdx}_${s}`).value;
      sets.push({ category: ex.category, exercise: ex.exercise, target: ex.target, unit: ex.unit, setIndex: s, weight, reps, notes });
    }
  });
  const warmup = d.warmup.map((item, i) => ({ item, done: document.getElementById(`wu_${i}`).checked }));
  const cooldown = PROGRAM_DATA.cooldown.map(([item], i) => ({ item, done: document.getElementById(`cd_${i}`).checked }));

  const entry = { id: uid(), mesoId: m.id, day, date, savedAt: new Date().toISOString(), sets, warmup, cooldown };
  addLog(entry);
  toast("Session saved");
  state.log.view = "list";
  render();
}

/* ---------- PROGRESS ---------- */
function renderProgress(app) {
  app.innerHTML = `
    <div class="chip-row">
      <button class="chip ${state.progress.view === "history" ? "active" : ""}" id="chipHistory">History</button>
      <button class="chip ${state.progress.view === "exercise" ? "active" : ""}" id="chipExercise">By Exercise</button>
    </div>
    <div id="progressBody"></div>
  `;
  document.getElementById("chipHistory").onclick = () => {
    state.progress.view = "history";
    render();
  };
  document.getElementById("chipExercise").onclick = () => {
    state.progress.view = "exercise";
    render();
  };
  const body = document.getElementById("progressBody");
  if (state.progress.view === "history") renderProgressHistory(body);
  else renderProgressExercise(body);
}

function renderProgressHistory(body) {
  const logs = allLogsSorted();
  if (!logs.length) {
    body.innerHTML = `<div class="list-empty">No sessions logged yet.</div>`;
    return;
  }
  const card = document.createElement("div");
  card.className = "card";
  logs.forEach((l) => {
    const m = getMeso(l.mesoId);
    const row = document.createElement("div");
    row.className = "history-item";
    const setsLogged = l.sets.filter((s) => s.weight !== "" || s.reps !== "").length;
    row.innerHTML = `
      <div>
        <div class="hl">${escapeHtml(m.theme)} \u2014 ${escapeHtml(m.weekLabel)}, Day ${l.day}</div>
        <div class="hs">${formatDateNice(l.date)} \u00b7 ${setsLogged} set(s) logged</div>
      </div>
      <button class="btn btn-danger btn-sm" data-id="${l.id}">Delete</button>
    `;
    row.querySelector("button").onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this logged session? This can't be undone.")) {
        deleteLog(l.id);
        render();
      }
    };
    card.appendChild(row);
  });
  body.appendChild(card);
}

function renderProgressExercise(body) {
  const names = uniqueLoggedExercises();
  if (!names.length) {
    body.innerHTML = `<div class="list-empty">Log some sessions to see progress by exercise.</div>`;
    return;
  }
  if (!state.progress.exercise || !names.includes(state.progress.exercise)) {
    state.progress.exercise = names[0];
  }
  const chipWrap = document.createElement("div");
  chipWrap.className = "chip-row";
  names.forEach((n) => {
    const c = document.createElement("button");
    c.className = "chip" + (n === state.progress.exercise ? " active" : "");
    c.textContent = n;
    c.onclick = () => {
      state.progress.exercise = n;
      render();
    };
    chipWrap.appendChild(c);
  });
  body.appendChild(chipWrap);

  const points = exerciseHistory(state.progress.exercise);
  const chartCard = document.createElement("div");
  chartCard.className = "card";
  chartCard.innerHTML = `<div class="eyebrow">Top weight per session (${escapeHtml(unitLabel())})</div><canvas class="chart" id="progChart"></canvas>`;
  body.appendChild(chartCard);

  const tableCard = document.createElement("div");
  tableCard.className = "card";
  let tableHtml = `<div class="eyebrow">Session history</div>`;
  points.slice().reverse().forEach((p) => {
    tableHtml += `<div class="history-item"><div>
      <div class="hl">${p.weight !== null ? p.weight + " " + escapeHtml(unitLabel()) : "\u2014"}</div>
      <div class="hs">${formatDateNice(p.date)} \u00b7 ${p.sets.length} set(s)</div>
    </div></div>`;
  });
  tableCard.innerHTML = tableHtml;
  body.appendChild(tableCard);

  requestAnimationFrame(() => drawLineChart(document.getElementById("progChart"), points));
}

/* ---------- Chart ---------- */
function drawLineChart(canvas, points) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
  const cssH = 180;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.height = cssH + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const valid = points.filter((p) => p.weight !== null);
  if (valid.length < 1) {
    ctx.fillStyle = "#6f6f6f";
    ctx.font = "13px sans-serif";
    ctx.fillText("Not enough data yet", 10, cssH / 2);
    return;
  }
  const padL = 34, padR = 10, padT = 14, padB = 20;
  const w = cssW - padL - padR;
  const h = cssH - padT - padB;
  const weights = valid.map((p) => p.weight);
  let min = Math.min(...weights), max = Math.max(...weights);
  if (min === max) { min -= 5; max += 5; }
  const pad = (max - min) * 0.1;
  min -= pad; max += pad;

  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + h);
  ctx.lineTo(padL + w, padT + h);
  ctx.stroke();

  ctx.fillStyle = "#6f6f6f";
  ctx.font = "10px sans-serif";
  ctx.fillText(Math.round(max).toString(), 2, padT + 8);
  ctx.fillText(Math.round(min).toString(), 2, padT + h);

  const n = valid.length;
  const stepX = n > 1 ? w / (n - 1) : 0;
  ctx.strokeStyle = "#c00000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  valid.forEach((p, i) => {
    const x = padL + (n > 1 ? i * stepX : w / 2);
    const y = padT + h - ((p.weight - min) / (max - min)) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "#e8b54d";
  valid.forEach((p, i) => {
    const x = padL + (n > 1 ? i * stepX : w / 2);
    const y = padT + h - ((p.weight - min) / (max - min)) * h;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ---------- Settings sheet ---------- */
function openSheet() {
  document.getElementById("unitSelect").value = SETTINGS.unit;
  document.getElementById("sheetBackdrop").classList.add("show");
  document.getElementById("settingsSheet").classList.add("show");
}
function closeSheet() {
  document.getElementById("sheetBackdrop").classList.remove("show");
  document.getElementById("settingsSheet").classList.remove("show");
}

function wireSettings() {
  document.getElementById("settingsBtn").onclick = openSheet;
  document.getElementById("sheetBackdrop").onclick = closeSheet;
  document.getElementById("closeSheetBtn").onclick = closeSheet;
  document.getElementById("unitSelect").onchange = (e) => {
    SETTINGS.unit = e.target.value;
    saveSettings(SETTINGS);
  };
  document.getElementById("exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify({ logs: LOGS, settings: SETTINGS }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workout-log-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  document.getElementById("importBtn").onclick = () => document.getElementById("importFile").click();
  document.getElementById("importFile").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data.logs)) {
          LOGS = data.logs;
          saveLogs(LOGS);
        }
        if (data.settings) {
          SETTINGS = Object.assign(SETTINGS, data.settings);
          saveSettings(SETTINGS);
        }
        toast("Data imported");
        closeSheet();
        render();
      } catch (err) {
        alert("Couldn't read that file. Make sure it's a backup exported from this app.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  document.getElementById("clearBtn").onclick = () => {
    if (confirm("This deletes all logged sessions on this device. This can't be undone. Continue?")) {
      LOGS = [];
      saveLogs(LOGS);
      toast("All data cleared");
      closeSheet();
      render();
    }
  };
}

/* ---------- Init ---------- */
function init() {
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.onclick = () => setTab(b.dataset.tab);
  });
  wireSettings();
  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
}

init();
