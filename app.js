/* ResumeForge — client-side resume & cover letter builder.
 * No backend. Data lives in localStorage and never leaves the browser
 * (except AI calls, which go directly from the browser to the provider you pick). */

const STORE_KEY = "resumeforge.v2";
const OLD_KEY = "resumeforge.v1";

/* ---------------- helpers ---------------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const uid = () => "p" + Math.random().toString(36).slice(2, 9);

function t(key) {
  const L = window.I18N;
  return (L[store.lang] && L[store.lang][key]) || L.en[key] || key;
}

/* ---------------- data model ---------------- */
const defaultData = () => ({
  template: "modern",
  accent: "#2563eb",
  personal: { name: "", title: "", email: "", phone: "", location: "", website: "", photo: "" },
  summary: "",
  experience: [],
  education: [],
  skills: "",
  cover: { company: "", role: "", manager: "", highlights: "", body: "" },
  ai: { provider: "openai" },
  view: "resume",
});

const defaultStore = () => {
  const id = uid();
  return { activeId: id, lang: "en", profiles: [{ id, name: window.I18N.en["profile.default"], data: defaultData() }] };
};

let store = loadStore();
let state = activeData();          // shortcut to the active profile's data

function activeData() {
  const p = store.profiles.find((x) => x.id === store.activeId) || store.profiles[0];
  store.activeId = p.id;
  return p.data;
}

function normalize(s) {
  const def = defaultStore();
  s = Object.assign({}, def, s);
  if (!Array.isArray(s.profiles) || !s.profiles.length) return def;
  s.profiles = s.profiles.map((p) => ({ id: p.id || uid(), name: p.name || "Resume", data: Object.assign(defaultData(), p.data || {}) }));
  if (!s.profiles.find((p) => p.id === s.activeId)) s.activeId = s.profiles[0].id;
  if (!window.I18N[s.lang]) s.lang = "en";
  return s;
}

function loadStore() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) {}
  try {
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const d = Object.assign(defaultData(), JSON.parse(old));
      const id = uid();
      return { activeId: id, lang: "en", profiles: [{ id, name: window.I18N.en["profile.default"], data: d }] };
    }
  } catch (e) {}
  return defaultStore();
}

function save() {
  const copy = JSON.parse(JSON.stringify(store));
  copy.profiles.forEach((p) => { if (p.data.ai) delete p.data.ai.key; });
  localStorage.setItem(STORE_KEY, JSON.stringify(copy));
}

/* ---------------- i18n application ---------------- */
function applyI18n() {
  document.documentElement.lang = store.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}

/* ---------------- profiles UI ---------------- */
function renderProfiles() {
  const sel = $("profile-select");
  sel.innerHTML = store.profiles.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
  sel.value = store.activeId;
}

function switchProfile(id) {
  store.activeId = id;
  state = activeData();
  save();
  hydrate();
  applyI18n();
  setView(state.view || "resume");
}

function newProfile() {
  const name = prompt(t("prompt.newname"), t("profile.default"));
  if (name === null) return;
  const id = uid();
  store.profiles.push({ id, name: name.trim() || t("profile.default"), data: defaultData() });
  store.activeId = id;
  state = activeData();
  save(); renderProfiles(); hydrate(); applyI18n(); setView("resume");
}

function renameProfile() {
  const p = store.profiles.find((x) => x.id === store.activeId);
  const name = prompt(t("prompt.rename"), p.name);
  if (name === null) return;
  p.name = name.trim() || p.name;
  save(); renderProfiles();
}

function deleteProfile() {
  if (store.profiles.length <= 1) { alert(t("alert.deletelast")); return; }
  if (!confirm(t("alert.confirmdelete"))) return;
  store.profiles = store.profiles.filter((x) => x.id !== store.activeId);
  store.activeId = store.profiles[0].id;
  state = activeData();
  save(); renderProfiles(); hydrate(); applyI18n(); setView(state.view || "resume");
}

/* ---------------- entry rows ---------------- */
function entryTemplate(kind, idx, data) {
  if (kind === "experience") {
    return `<div class="entry" data-kind="experience" data-idx="${idx}">
      <button class="remove" title="Remove">×</button>
      <input data-k="title" placeholder="${t("ph.jobtitle")}" value="${esc(data.title)}" />
      <input data-k="org" placeholder="${t("ph.company")}" value="${esc(data.org)}" />
      <input data-k="when" placeholder="${t("ph.dates")}" value="${esc(data.when)}" />
      <textarea data-k="desc" rows="3" placeholder="${t("ph.expdesc")}">${esc(data.desc)}</textarea>
    </div>`;
  }
  return `<div class="entry" data-kind="education" data-idx="${idx}">
    <button class="remove" title="Remove">×</button>
    <input data-k="title" placeholder="${t("ph.degree")}" value="${esc(data.title)}" />
    <input data-k="org" placeholder="${t("ph.school")}" value="${esc(data.org)}" />
    <input data-k="when" placeholder="${t("ph.edudates")}" value="${esc(data.when)}" />
  </div>`;
}

function renderEntries() {
  $("experience-list").innerHTML = state.experience.map((d, i) => entryTemplate("experience", i, d)).join("");
  $("education-list").innerHTML = state.education.map((d, i) => entryTemplate("education", i, d)).join("");
}

/* ---------------- form -> state ---------------- */
function bindInputs() {
  const map = {
    "f-name": ["personal", "name"], "f-title": ["personal", "title"],
    "f-email": ["personal", "email"], "f-phone": ["personal", "phone"],
    "f-location": ["personal", "location"], "f-website": ["personal", "website"],
    "f-summary": ["summary"], "f-skills": ["skills"],
    "c-company": ["cover", "company"], "c-role": ["cover", "role"],
    "c-manager": ["cover", "manager"], "c-highlights": ["cover", "highlights"],
    "c-body": ["cover", "body"],
  };
  for (const [id, path] of Object.entries(map)) {
    const el = $(id);
    if (!el) continue;
    el.addEventListener("input", () => {
      if (path.length === 1) state[path[0]] = el.value;
      else state[path[0]][path[1]] = el.value;
      save(); renderPreview();
    });
  }

  $("template-select").addEventListener("change", (e) => { state.template = e.target.value; save(); renderPreview(); });
  $("accent-color").addEventListener("input", (e) => {
    state.accent = e.target.value;
    document.documentElement.style.setProperty("--accent", state.accent);
    save(); renderPreview();
  });
  $("ai-provider").addEventListener("change", (e) => { state.ai.provider = e.target.value; save(); });

  // Photo upload
  $("f-photo").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { state.personal.photo = reader.result; save(); hydratePhoto(); renderPreview(); };
    reader.readAsDataURL(file);
  });
  $("f-photo-clear").addEventListener("click", () => {
    state.personal.photo = ""; $("f-photo").value = ""; save(); hydratePhoto(); renderPreview();
  });

  document.querySelectorAll(".add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.add;
      state[kind].push(kind === "experience" ? { title: "", org: "", when: "", desc: "" } : { title: "", org: "", when: "" });
      save(); renderEntries(); renderPreview();
    });
  });

  $("editor").addEventListener("input", (e) => {
    const entry = e.target.closest(".entry");
    if (!entry) return;
    const kind = entry.dataset.kind, idx = +entry.dataset.idx, k = e.target.dataset.k;
    if (k) { state[kind][idx][k] = e.target.value; save(); renderPreview(); }
  });
  $("editor").addEventListener("click", (e) => {
    if (!e.target.classList.contains("remove")) return;
    const entry = e.target.closest(".entry");
    state[entry.dataset.kind].splice(+entry.dataset.idx, 1); save(); renderEntries(); renderPreview();
  });
}

/* ---------------- hydrate form from state ---------------- */
function hydratePhoto() {
  $("f-photo-clear").hidden = !state.personal.photo;
}
function hydrate() {
  $("f-name").value = state.personal.name;
  $("f-title").value = state.personal.title;
  $("f-email").value = state.personal.email;
  $("f-phone").value = state.personal.phone;
  $("f-location").value = state.personal.location;
  $("f-website").value = state.personal.website;
  $("f-summary").value = state.summary;
  $("f-skills").value = state.skills;
  $("c-company").value = state.cover.company;
  $("c-role").value = state.cover.role;
  $("c-manager").value = state.cover.manager;
  $("c-highlights").value = state.cover.highlights;
  $("c-body").value = state.cover.body;
  $("template-select").value = state.template;
  $("accent-color").value = state.accent;
  $("ai-provider").value = state.ai.provider;
  $("lang-select").value = store.lang;
  document.documentElement.style.setProperty("--accent", state.accent);
  hydratePhoto();
  renderEntries();
}

/* ---------------- section builders ---------------- */
function contactHTML() {
  const p = state.personal;
  return [p.email, p.phone, p.location, p.website].filter(Boolean).map((c) => `<span>${esc(c)}</span>`).join("");
}
function skillList() { return state.skills.split(",").map((s) => s.trim()).filter(Boolean); }
function skillsHTML() { return skillList().map((s) => `<span class="skill">${esc(s)}</span>`).join(""); }

function summarySection() {
  return state.summary ? `<div class="section"><h2>${t("sec.summary")}</h2><p>${esc(state.summary)}</p></div>` : "";
}
function experienceSection() {
  const items = state.experience.map((x) => `
    <div class="item">
      <div class="head"><span class="title">${esc(x.title)}</span><span class="when">${esc(x.when)}</span></div>
      <div class="sub">${esc(x.org)}</div>
      ${x.desc ? `<p>${esc(x.desc)}</p>` : ""}
    </div>`).join("");
  return items ? `<div class="section"><h2>${t("sec.experience")}</h2>${items}</div>` : "";
}
function educationSection() {
  const items = state.education.map((x) => `
    <div class="item">
      <div class="head"><span class="title">${esc(x.title)}</span><span class="when">${esc(x.when)}</span></div>
      <div class="sub">${esc(x.org)}</div>
    </div>`).join("");
  return items ? `<div class="section"><h2>${t("sec.education")}</h2>${items}</div>` : "";
}
function skillsSection() {
  return skillsHTML() ? `<div class="section"><h2>${t("sec.skills")}</h2><div class="skills">${skillsHTML()}</div></div>` : "";
}
function contactSection() {
  return contactHTML() ? `<div class="section"><h2>${t("sec.contact")}</h2><div class="contact">${contactHTML()}</div></div>` : "";
}
function photoImg() {
  return state.personal.photo ? `<img src="${state.personal.photo}" alt="" />` : "";
}

/* ---------------- resume rendering ---------------- */
function renderResume() {
  const name = esc(state.personal.name) || "Your Name";
  const role = `<div class="role">${esc(state.personal.title)}</div>`;

  if (state.template === "two-column") {
    return `
      <h1>${name}</h1>${role}
      <div class="body">
        <div class="sidebar">
          ${state.personal.photo ? `<div class="header-photo">${photoImg()}</div>` : ""}
          ${contactSection()}
          ${skillsSection()}
          ${educationSection()}
        </div>
        <div class="main">
          ${summarySection()}
          ${experienceSection()}
        </div>
      </div>`;
  }

  if (state.template === "photo") {
    return `
      <div class="header-photo">
        ${photoImg()}
        <div><h1>${name}</h1>${role}<div class="contact">${contactHTML()}</div></div>
      </div>
      ${summarySection()}${experienceSection()}${educationSection()}${skillsSection()}`;
  }

  // modern / classic / compact
  return `
    <h1>${name}</h1>${role}
    <div class="contact">${contactHTML()}</div>
    ${summarySection()}${experienceSection()}${educationSection()}${skillsSection()}`;
}

function renderCover() {
  const p = state.personal, c = state.cover;
  const date = new Date().toLocaleDateString(window.LOCALES[store.lang] || "en-US", { year: "numeric", month: "long", day: "numeric" });
  const paras = (c.body || "").split(/\n{2,}/).filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join("");
  return `
    <h1>${esc(p.name) || "Your Name"}</h1>
    <div class="contact">${[p.email, p.phone, p.location].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("")}</div>
    <div class="cover">
      <p>${esc(date)}</p>
      ${c.company ? `<p>${esc(c.company)}</p>` : ""}
      <p>${t("cover.dear")} ${esc(c.manager) || t("cover.manager")},</p>
      ${paras || `<p class="sub">${t("cover.placeholder")}</p>`}
    </div>`;
}

function renderPreview() {
  const pv = $("preview");
  const view = state.view === "cover" ? "cover" : "resume"; // ATS still previews the resume
  pv.className = "page " + state.template;
  pv.innerHTML = view === "cover" ? renderCover() : renderResume();
}

/* ---------------- view switching ---------------- */
function setView(view) {
  state.view = view; save();
  $("panel-resume").hidden = view !== "resume";
  $("panel-cover").hidden = view !== "cover";
  $("panel-ats").hidden = view !== "ats";
  $("tab-resume").classList.toggle("active", view === "resume");
  $("tab-cover").classList.toggle("active", view === "cover");
  $("tab-ats").classList.toggle("active", view === "ats");
  renderPreview();
}

/* ---------------- import / export JSON ---------------- */
function exportJSON() {
  const copy = JSON.parse(JSON.stringify(store));
  copy.profiles.forEach((p) => { if (p.data.ai) delete p.data.ai.key; });
  download(JSON.stringify(copy, null, 2), "application/json",
    (activeProfileName() || "resumeforge").replace(/\s+/g, "_").toLowerCase() + ".resumeforge.json");
}
function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      // Accept either a full store (v2) or a single profile's data (v1-style)
      store = parsed.profiles ? normalize(parsed)
        : normalize({ activeId: "x", lang: store.lang, profiles: [{ id: uid(), name: t("profile.default"), data: parsed }] });
      state = activeData();
      save(); renderProfiles(); hydrate(); applyI18n(); setView(state.view || "resume");
    } catch (e) { alert("Could not read that file — is it a valid ResumeForge export?"); }
  };
  reader.readAsText(file);
}
function activeProfileName() {
  const p = store.profiles.find((x) => x.id === store.activeId);
  return p ? p.name : "";
}

/* ---------------- download helpers ---------------- */
function download(content, type, filename) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function baseFilename() {
  return (state.personal.name || activeProfileName() || "resume").replace(/\s+/g, "_").toLowerCase();
}

/* Markdown export */
function toMarkdown() {
  const p = state.personal;
  const L = [];
  L.push(`# ${p.name || "Your Name"}`);
  if (p.title) L.push(`**${p.title}**`);
  const contact = [p.email, p.phone, p.location, p.website].filter(Boolean).join(" · ");
  if (contact) L.push(contact);
  if (state.summary) { L.push(`\n## ${t("sec.summary")}\n`); L.push(state.summary); }
  if (state.experience.length) {
    L.push(`\n## ${t("sec.experience")}\n`);
    state.experience.forEach((x) => {
      L.push(`### ${x.title}${x.org ? " — " + x.org : ""}${x.when ? ` (${x.when})` : ""}`);
      (x.desc || "").split("\n").filter(Boolean).forEach((d) => L.push(`- ${d}`));
    });
  }
  if (state.education.length) {
    L.push(`\n## ${t("sec.education")}\n`);
    state.education.forEach((x) => L.push(`### ${x.title}${x.org ? " — " + x.org : ""}${x.when ? ` (${x.when})` : ""}`));
  }
  if (skillList().length) { L.push(`\n## ${t("sec.skills")}\n`); L.push(skillList().join(", ")); }
  return L.join("\n");
}

/* Word (.doc) export — Word opens HTML documents reliably */
function toWordHTML() {
  const accent = state.accent;
  const styles = `
    body{font-family:Calibri,Arial,sans-serif;color:#111827;font-size:11pt;line-height:1.4;}
    h1{font-size:22pt;margin:0;}
    .role{color:${accent};font-weight:bold;font-size:13pt;margin:2px 0 6px;}
    .contact{color:#6b7280;font-size:9pt;margin-bottom:10px;}
    h2{font-size:11pt;text-transform:uppercase;letter-spacing:1px;color:${accent};border-bottom:2px solid ${accent};padding-bottom:3px;margin:16px 0 8px;}
    .item{margin-bottom:10px;}
    .title{font-weight:bold;}
    .sub{color:#6b7280;}
    .when{color:#6b7280;font-size:9pt;}
    p{margin:3px 0;}
  `;
  // Always single-column for Word compatibility.
  const prev = state.template;
  state.template = "modern";
  const body = renderResume();
  state.template = prev;
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><style>${styles}</style></head><body>${body}</body></html>`;
}

function handleDownload(kind) {
  if (kind === "pdf") { window.print(); return; }
  if (kind === "md") { download(toMarkdown(), "text/markdown", baseFilename() + ".md"); return; }
  if (kind === "word") { download(toWordHTML(), "application/msword", baseFilename() + ".doc"); return; }
}

/* ---------------- ATS keyword checker ---------------- */
const STOPWORDS = new Set(("a an the and or but if then else for to of in on at by with from as is are was were be been being this that these those you your our we us they their it its will shall can may might must should would could have has had do does did not no nyes than into over under about above below up down out off again further once here there all any both each few more most other some such only own same so too very who whom which what when where why how able across after among around because before between during into per via within without etc inc co ltd team teams work working works role roles position positions job jobs company companies candidate candidates experience experiences year years using use used new strong excellent good great ability responsibilities responsible required requirements preferred plus including include includes well also able looking join help build building make making support various across able").split(/\s+/));

function tokenize(text) {
  return (text.toLowerCase().replace(/[^a-z0-9+#.\s\-]/g, " ").match(/[a-z0-9][a-z0-9+#.\-]*[a-z0-9+#]|[a-z0-9]/g) || [])
    .map((w) => w.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter((w) => w.length >= 2 && !/^\d+$/.test(w) && !STOPWORDS.has(w));
}

function extractKeywords(jd) {
  const toksRaw = (jd.toLowerCase().replace(/[^a-z0-9+#.\s\-]/g, " ").match(/[a-z0-9][a-z0-9+#.\-]*[a-z0-9+#]|[a-z0-9]/g) || []);
  const toks = tokenize(jd);
  const freq = {};
  toks.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });

  // notable bigrams: two consecutive non-stopword tokens
  const bigrams = {};
  for (let i = 0; i < toksRaw.length - 1; i++) {
    const a = toksRaw[i], b = toksRaw[i + 1];
    if (STOPWORDS.has(a) || STOPWORDS.has(b) || a.length < 3 || b.length < 3 || /^\d+$/.test(a) || /^\d+$/.test(b)) continue;
    const g = a + " " + b;
    bigrams[g] = (bigrams[g] || 0) + 1;
  }

  const scored = [];
  Object.entries(bigrams).forEach(([g, n]) => { if (n >= 2) scored.push({ kw: g, score: n * 2 + 3 }); });
  Object.entries(freq).forEach(([w, n]) => { scored.push({ kw: w, score: n }); });

  // dedupe (skip unigrams already covered by a chosen bigram), rank, top 24
  scored.sort((a, b) => b.score - a.score);
  const chosen = [], seen = new Set();
  for (const s of scored) {
    if (seen.has(s.kw)) continue;
    chosen.push(s.kw); seen.add(s.kw);
    if (chosen.length >= 24) break;
  }
  return chosen;
}

function resumeText() {
  const parts = [state.summary, state.skills,
    ...state.experience.map((x) => `${x.title} ${x.org} ${x.desc}`),
    ...state.education.map((x) => `${x.title} ${x.org}`)];
  return parts.join(" ").toLowerCase();
}

function analyzeATS() {
  const jd = $("ats-jd").value.trim();
  state.atsJD = jd; save();
  const box = $("ats-results");
  if (!jd) { box.innerHTML = `<p class="hint">${t("ats.empty")}</p>`; return; }
  const keywords = extractKeywords(jd);
  if (!keywords.length) { box.innerHTML = `<p class="hint">${t("ats.nokeywords")}</p>`; return; }
  const rt = resumeText();
  const hit = [], miss = [];
  keywords.forEach((kw) => {
    const present = kw.includes(" ")
      ? rt.includes(kw)
      : new RegExp("\\b" + kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(rt);
    (present ? hit : miss).push(kw);
  });
  const pct = Math.round((hit.length / keywords.length) * 100);
  box.innerHTML = `
    <div class="ats-score">
      <div class="ring" style="--pct:${pct}"><span>${pct}%</span></div>
      <div class="label">${t("ats.score")} · ${hit.length}/${keywords.length}</div>
    </div>
    <div class="kw-group"><h4>${t("ats.matched")} (${hit.length})</h4>
      ${hit.map((k) => `<span class="kw hit">${esc(k)}</span>`).join("") || `<span class="hint">—</span>`}</div>
    <div class="kw-group"><h4>${t("ats.missing")} (${miss.length})</h4>
      ${miss.map((k) => `<span class="kw miss">${esc(k)}</span>`).join("") || `<span class="hint">—</span>`}</div>
    <p class="hint">${t("ats.hint")}</p>`;
}

/* ---------------- AI cover letter ---------------- */
function buildPrompt() {
  const p = state.personal, c = state.cover;
  const exp = state.experience.map((x) => `- ${x.title} at ${x.org} (${x.when}): ${x.desc}`).join("\n");
  const langName = { en: "English", id: "Indonesian", es: "Spanish" }[store.lang] || "English";
  return `Write a concise, confident, professional cover letter in ${langName} (3-4 short paragraphs, no fluff, no clichés like "I am writing to apply").
Applicant: ${p.name || "the applicant"}${p.title ? `, ${p.title}` : ""}.
Target company: ${c.company || "the company"}.
Target role: ${c.role || "the role"}.
Hiring manager: ${c.manager || "unknown"}.
Points to highlight: ${c.highlights || "none specified"}.
Relevant experience:\n${exp || "(not provided)"}\n
Skills: ${state.skills || "(not provided)"}.
Return ONLY the body paragraphs (no date, no address block, no greeting, no sign-off).`;
}

async function generateCover() {
  const key = $("ai-key").value.trim();
  const status = $("ai-status");
  if (!key) { status.textContent = "Enter an API key first."; return; }
  status.textContent = "Generating…";
  $("btn-generate").disabled = true;
  try {
    const text = state.ai.provider === "anthropic"
      ? await callAnthropic(key, buildPrompt())
      : await callOpenAI(key, buildPrompt());
    state.cover.body = text.trim();
    $("c-body").value = state.cover.body;
    save(); renderPreview();
    status.textContent = "Done — review and edit as needed.";
  } catch (e) {
    status.textContent = "Error: " + (e.message || e);
  } finally {
    $("btn-generate").disabled = false;
  }
}

async function callOpenAI(key, prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.7 }),
  });
  if (!res.ok) throw new Error("OpenAI " + res.status + " — " + (await res.text()).slice(0, 200));
  return (await res.json()).choices[0].message.content;
}

async function callAnthropic(key, prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", "x-api-key": key,
      "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-3-5-haiku-latest", max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error("Anthropic " + res.status + " — " + (await res.text()).slice(0, 200));
  return (await res.json()).content[0].text;
}

/* ---------------- wire up ---------------- */
function init() {
  bindInputs();
  renderProfiles();
  hydrate();
  applyI18n();
  if (state.atsJD) $("ats-jd").value = state.atsJD;
  setView(state.view || "resume");

  $("profile-select").addEventListener("change", (e) => switchProfile(e.target.value));
  $("btn-new-profile").addEventListener("click", newProfile);
  $("btn-rename-profile").addEventListener("click", renameProfile);
  $("btn-delete-profile").addEventListener("click", deleteProfile);

  $("lang-select").addEventListener("change", (e) => {
    store.lang = e.target.value; save(); applyI18n(); renderEntries(); renderPreview();
  });

  $("tab-resume").addEventListener("click", () => setView("resume"));
  $("tab-cover").addEventListener("click", () => setView("cover"));
  $("tab-ats").addEventListener("click", () => setView("ats"));

  $("btn-import").addEventListener("click", () => $("file-import").click());
  $("file-import").addEventListener("change", (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); });
  $("btn-export-json").addEventListener("click", exportJSON);

  // download dropdown
  const menu = $("download-menu");
  $("btn-download").addEventListener("click", (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; });
  menu.addEventListener("click", (e) => { const k = e.target.dataset.dl; if (k) { menu.hidden = true; handleDownload(k); } });
  document.addEventListener("click", () => { menu.hidden = true; });

  $("btn-analyze").addEventListener("click", analyzeATS);
  $("btn-generate").addEventListener("click", generateCover);
  $("ai-key").addEventListener("input", (e) => { state.ai.key = e.target.value; });
}

document.addEventListener("DOMContentLoaded", init);
