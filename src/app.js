/* =====================================================================
   Personal Reflections — Dual-Domain Resilience Assessment (web)
   ---------------------------------------------------------------------
   Faithful web port of the attached workbook:
   - 25 Yes/No items (BPD "Core Intensity" items interleaved with
     professional "Executive Resilience" items)
   - Same scoring: Core Intensity (0-10), Executive Resilience (0-15)
   - Same thresholds, same Integrated Operational Profile, same
     Strategic Guidance Commentary, same DBT pillar strategy.
   The taker sees their OWN results; results email goes only to them.
   Crisis resources still surface if the self-harm item is "Yes".
   Multilingual: EN / AR (RTL) / FR / DE / ES — see i18n.js.
   ===================================================================== */

/* Items in DISPLAY ORDER. Text is resolved per-language from ITEM_TEXT
   (i18n.js) via qid.
   qid       = original item code (drives text + scoring)
   domain    = "core" (BPD/intensity) | "exec" (resilience)  [internal only]
   crisis    = self-harm item (Q17)  */
const ITEMS = [
  { qid:"Q24", domain:"exec" },
  { qid:"Q25", domain:"exec" },
  { qid:"Q01", domain:"core" },
  { qid:"Q02", domain:"exec" },
  { qid:"Q04", domain:"exec" },
  { qid:"Q03", domain:"core" },
  { qid:"Q06", domain:"exec" },
  { qid:"Q05", domain:"core" },
  { qid:"Q08", domain:"exec" },
  { qid:"Q07", domain:"core" },
  { qid:"Q10", domain:"exec" },
  { qid:"Q09", domain:"core" },
  { qid:"Q12", domain:"exec" },
  { qid:"Q11", domain:"core" },
  { qid:"Q14", domain:"exec" },
  { qid:"Q13", domain:"core" },
  { qid:"Q16", domain:"exec" },
  { qid:"Q15", domain:"core" },
  { qid:"Q18", domain:"exec" },
  { qid:"Q17", domain:"core", crisis:true },
  { qid:"Q20", domain:"exec" },
  { qid:"Q19", domain:"core" },
  { qid:"Q21", domain:"exec" },
  { qid:"Q22", domain:"exec" },
  { qid:"Q23", domain:"exec" },
];

/* ---- Language state ---- */
const DEFAULT_LANG = "en";
let lang = (localStorage.getItem("pr_lang") || navigator.language || DEFAULT_LANG).slice(0, 2);
if (!T[lang]) lang = DEFAULT_LANG;
const tr = () => T[lang];

function itemText(qid) { return (ITEM_TEXT[lang] || ITEM_TEXT.en)[qid]; }

/* ---- State ---- */
let idx = 0;
const answers = new Array(ITEMS.length).fill(null);

/* ---- Elements ---- */
const el = (id) => document.getElementById(id);
const intro = el("intro"), quiz = el("quiz"), results = el("results");
const form = el("quizForm");
const nextBtn = el("nextBtn"), backBtn = el("backBtn");
const progressBar = el("progressBar"), progressText = el("progressText");
const langSelect = el("langSelect");

/* ---- Populate language selector ---- */
LANGS.forEach(l => {
  const opt = document.createElement("option");
  opt.value = l.code;
  opt.textContent = l.native;
  langSelect.appendChild(opt);
});
langSelect.value = lang;
langSelect.onchange = () => {
  lang = langSelect.value;
  localStorage.setItem("pr_lang", lang);
  applyLang();
};

/* ---- Apply language to document + static strings ---- */
function applyLang() {
  const meta = LANGS.find(l => l.code === lang) || LANGS[0];
  document.documentElement.lang = lang;
  document.documentElement.dir = meta.dir;

  const t = tr();
  document.title = t.title;
  const md = el("metaDesc"); if (md) md.setAttribute("content", t.metaDesc);
  el("langLabel").textContent = t.langLabel;

  document.querySelectorAll("[data-i18n]").forEach(node => {
    const key = node.getAttribute("data-i18n");
    if (t[key] != null) node.innerHTML = t[key];
  });

  // Re-render dynamic views if visible
  if (!quiz.classList.contains("hidden")) render();
  if (!results.classList.contains("hidden")) el("resultBody").innerHTML = resultHTML();
}

el("startBtn").onclick = () => { intro.classList.add("hidden"); quiz.classList.remove("hidden"); render(); };
el("restartBtn").onclick = () => location.reload();
nextBtn.onclick = next;
backBtn.onclick = back;

function render() {
  const item = ITEMS[idx];
  const t = tr();
  progressBar.style.width = ((idx) / ITEMS.length * 100) + "%";
  progressText.textContent = t.questionOf(idx + 1, ITEMS.length);
  backBtn.classList.toggle("hidden", idx === 0);
  nextBtn.textContent = idx === ITEMS.length - 1 ? t.seeResults : t.next;
  backBtn.textContent = t.back;

  const yesno = [{ v:"Yes", label:t.yes }, { v:"No", label:t.no }];
  form.innerHTML = `<p class="q-text">${itemText(item.qid)}</p>
    <div class="options">
      ${yesno.map(s => `
        <label class="opt ${answers[idx] === s.v ? "selected" : ""}">
          <input type="radio" name="ans" value="${s.v}" ${answers[idx] === s.v ? "checked" : ""}/>
          <span>${s.label}</span>
        </label>`).join("")}
    </div>`;

  form.querySelectorAll("input[name=ans]").forEach(inp => {
    inp.onchange = () => {
      answers[idx] = inp.value;
      form.querySelectorAll(".opt").forEach(o => o.classList.remove("selected"));
      inp.closest(".opt").classList.add("selected");
      nextBtn.disabled = false;
    };
  });
  nextBtn.disabled = answers[idx] === null;
}

function next() {
  if (answers[idx] === null) return;
  if (idx === ITEMS.length - 1) return finish();
  idx++; render();
}
function back() { if (idx > 0) { idx--; render(); } }

/* ---- Scoring engine — mirrors the workbook exactly ---- */
function score() {
  const t = tr();
  let core = 0, exec = 0;
  ITEMS.forEach((it, i) => {
    if (answers[i] === "Yes") {
      if (it.domain === "core") core++;
      else exec++;
    }
  });

  // Integrated Operational Profile (Dashboard!C8 logic)
  const intensityLabel = core >= 5 ? t.intensityHigh : t.intensityLow;
  let resilienceLabel;
  if (exec >= 11) resilienceLabel = t.resStrong;
  else if (exec >= 6) resilienceLabel = t.resModerate;
  else resilienceLabel = t.resDeveloping;
  const profile = intensityLabel + resilienceLabel;

  // Strategic Guidance Commentary (Dashboard!C9 logic)
  const commentary = core >= 5 ? t.commentaryHigh : t.commentaryLow;

  // Crisis flag: self-harm item answered "Yes"
  const crisisFlag = ITEMS.some((it, i) => it.crisis && answers[i] === "Yes");

  return { core, exec, profile, commentary, crisisFlag, highIntensity: core >= 5 };
}

function crisisBlock() {
  const t = tr();
  const lines = (CRISIS_LINES[lang] || CRISIS_LINES.en)
    .map(([country, info]) => `      <li><b>${country}:</b> ${info}</li>`).join("\n");
  return `
  <div class="crisis">
    <h3>${t.crisisTitle}</h3>
    <p>${t.crisisIntro}</p>
    <ul>
${lines}
      <li><b>${t.crisisElsewhere}</b> ${t.crisisFindHelpline}
        <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a></li>
    </ul>
    <p style="margin-bottom:0">${t.crisisImmediate}</p>
  </div>`;
}

function resultHTML() {
  const t = tr();
  const r = score();
  const badgeClass = r.highIntensity ? "badge-high" : "badge-low";
  const badgeText = r.highIntensity ? t.badgeHigh : t.badgeLow;

  let html = "";
  if (r.crisisFlag) html += crisisBlock();

  html += `
    <span class="result-badge ${badgeClass}">${badgeText}</span>
    <h2>${t.resultsHeading}</h2>

    <div class="result-section">
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-value">${r.core}<span class="metric-max">/10</span></div>
          <div class="metric-label">${t.coreLabel}</div>
        </div>
        <div class="metric">
          <div class="metric-value">${r.exec}<span class="metric-max">/15</span></div>
          <div class="metric-label">${t.execLabel}</div>
        </div>
      </div>
    </div>

    <div class="result-section">
      <h3>${t.profileHeading}</h3>
      <p class="profile-line">${r.profile}</p>
    </div>

    <div class="result-section">
      <h3>${t.guidanceHeading}</h3>
      <p>${r.commentary}</p>
    </div>`;

  const pillars = DBT_TEXT[lang] || DBT_TEXT.en;
  html += `
    <div class="result-section">
      <h3>${t.dbtHeading}</h3>
      <p>${r.highIntensity ? t.dbtIntroHigh : t.dbtIntroLow}</p>
      <table class="dbt-table">
        <thead><tr><th>${t.dbtColPillar}</th><th>${t.dbtColFocus}</th></tr></thead>
        <tbody>
          ${pillars.map(([p, d]) => `<tr><td><b>${p}</b></td><td>${d}</td></tr>`).join("")}
        </tbody>
      </table>`;

  if (r.highIntensity) {
    html += `
      <div class="callout">
        <b>${t.calloutTitle}</b> ${t.calloutBody}
      </div>`;
  }

  html += `
      <p class="muted" style="margin-top:18px">${t.disclaimer}</p>
    </div>`;

  return html;
}

/* ---- Session record (saved server-side, one file per completed assessment) ---- */
function buildRecordText(r) {
  const t = tr();
  const meta = LANGS.find(l => l.code === lang) || LANGS[0];
  const now = new Date();
  const lines = [
    t.recordTitle,
    `${t.recordDate}: ${now.toISOString().slice(0, 10)}`,
    `${t.recordTime}: ${now.toISOString().slice(11, 19)} UTC`,
    `${t.recordLanguage}: ${meta.native} (${lang})`,
    "",
  ];

  ITEMS.forEach((item, i) => {
    const tag = item.domain === "core" ? ` [${t.recordCoreTag}]` : "";
    lines.push(`Q${i + 1}${tag}: ${itemText(item.qid)}`);
    lines.push(`A${i + 1}: ${answers[i] === "Yes" ? t.yes : t.no}`);
    lines.push("");
  });

  lines.push("----------------------------------------");
  lines.push(t.resultsHeading);
  lines.push("----------------------------------------");
  lines.push(`${t.coreLabel}: ${r.core}/10`);
  lines.push(`${t.execLabel}: ${r.exec}/15`);
  lines.push(`${t.profileHeading}: ${r.profile}`);
  lines.push(`${t.guidanceHeading}: ${r.commentary}`);
  lines.push(`${t.recordCrisisFlag}: ${r.crisisFlag ? t.yes : t.no}`);

  return lines.join("\n");
}

function saveRecord(r) {
  fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: buildRecordText(r), language: lang }),
    keepalive: true,
  }).catch(() => { /* best-effort save; never block the results screen on this */ });
}

/* ---- Finish ---- */
let lastResult = null;
function finish() {
  progressBar.style.width = "100%";
  lastResult = score();
  el("resultBody").innerHTML = resultHTML();
  quiz.classList.add("hidden");
  results.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  saveRecord(lastResult);
}

/* ---- Save / print ---- */
el("printBtn").onclick = () => window.print();

/* ---- Init ---- */
applyLang();
