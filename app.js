/* ResumeForge — client-side resume & cover letter builder.
 * No backend. All data lives in localStorage and never leaves the browser
 * (except AI calls, which go directly from the browser to the provider you pick). */

const STORAGE_KEY = "resumeforge.v1";

const defaultState = () => ({
  template: "modern",
  accent: "#2563eb",
  personal: { name: "", title: "", email: "", phone: "", location: "", website: "" },
  summary: "",
  experience: [],
  education: [],
  skills: "",
  cover: { company: "", role: "", manager: "", highlights: "", body: "" },
  ai: { provider: "openai" },
  view: "resume",
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) { /* ignore */ }
  return defaultState();
}

function save() {
  // Never persist the API key.
  const toStore = JSON.parse(JSON.stringify(state));
  if (toStore.ai) delete toStore.ai.key;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------------- Entry rows (experience / education) ---------------- */
function entryTemplate(kind, idx, data) {
  if (kind === "experience") {
    return `<div class="entry" data-kind="experience" data-idx="${idx}">
      <button class="remove" title="Remove">×</button>
      <input data-k="title" placeholder="Job title" value="${esc(data.title)}" />
      <input data-k="org" placeholder="Company" value="${esc(data.org)}" />
      <input data-k="when" placeholder="Dates (e.g. 2021 – Present)" value="${esc(data.when)}" />
      <textarea data-k="desc" rows="3" placeholder="What you did and achieved (one line per bullet)">${esc(data.desc)}</textarea>
    </div>`;
  }
  return `<div class="entry" data-kind="education" data-idx="${idx}">
    <button class="remove" title="Remove">×</button>
    <input data-k="title" placeholder="Degree / qualification" value="${esc(data.title)}" />
    <input data-k="org" placeholder="School / institution" value="${esc(data.org)}" />
    <input data-k="when" placeholder="Dates (e.g. 2016 – 2020)" value="${esc(data.when)}" />
  </div>`;
}

function renderEntries() {
  $("experience-list").innerHTML = state.experience.map((d, i) => entryTemplate("experience", i, d)).join("");
  $("education-list").innerHTML = state.education.map((d, i) => entryTemplate("education", i, d)).join("");
}

/* ---------------- Sync form -> state ---------------- */
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
  $("accent-color").addEventListener("input", (e) => { state.accent = e.target.value; document.documentElement.style.setProperty("--accent", state.accent); save(); renderPreview(); });
  $("ai-provider").addEventListener("change", (e) => { state.ai.provider = e.target.value; save(); });

  // Delegated handlers for dynamic entries
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
    const kind = entry.dataset.kind, idx = +entry.dataset.idx;
    state[kind].splice(idx, 1); save(); renderEntries(); renderPreview();
  });
}

/* ---------------- Hydrate form from state ---------------- */
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
  document.documentElement.style.setProperty("--accent", state.accent);
  renderEntries();
}

/* ---------------- Preview rendering ---------------- */
function renderResume() {
  const p = state.personal;
  const contact = [p.email, p.phone, p.location, p.website].filter(Boolean)
    .map((c) => `<span>${esc(c)}</span>`).join("");
  const skills = state.skills.split(",").map((s) => s.trim()).filter(Boolean)
    .map((s) => `<span class="skill">${esc(s)}</span>`).join("");

  const expItems = state.experience.map((x) => `
    <div class="item">
      <div class="head"><span class="title">${esc(x.title)}</span><span class="when">${esc(x.when)}</span></div>
      <div class="sub">${esc(x.org)}</div>
      ${x.desc ? `<p>${esc(x.desc)}</p>` : ""}
    </div>`).join("");

  const eduItems = state.education.map((x) => `
    <div class="item">
      <div class="head"><span class="title">${esc(x.title)}</span><span class="when">${esc(x.when)}</span></div>
      <div class="sub">${esc(x.org)}</div>
    </div>`).join("");

  return `
    <h1>${esc(p.name) || "Your Name"}</h1>
    <div class="role">${esc(p.title)}</div>
    <div class="contact">${contact}</div>
    ${state.summary ? `<div class="section"><h2>Summary</h2><p>${esc(state.summary)}</p></div>` : ""}
    ${expItems ? `<div class="section"><h2>Experience</h2>${expItems}</div>` : ""}
    ${eduItems ? `<div class="section"><h2>Education</h2>${eduItems}</div>` : ""}
    ${skills ? `<div class="section"><h2>Skills</h2><div class="skills">${skills}</div></div>` : ""}
  `;
}

function renderCover() {
  const p = state.personal, c = state.cover;
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const paras = (c.body || "").split(/\n{2,}/).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join("");
  return `
    <h1>${esc(p.name) || "Your Name"}</h1>
    <div class="contact">${[p.email, p.phone, p.location].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("")}</div>
    <div class="cover">
      <p>${esc(date)}</p>
      ${c.company ? `<p>${esc(c.company)}</p>` : ""}
      <p>Dear ${esc(c.manager) || "Hiring Manager"},</p>
      ${paras || `<p class="sub">Your cover letter will appear here. Write it in the editor or generate a draft with AI.</p>`}
    </div>`;
}

function renderPreview() {
  const pv = $("preview");
  pv.className = "page " + state.template;
  pv.innerHTML = state.view === "resume" ? renderResume() : renderCover();
}

/* ---------------- View switching ---------------- */
function setView(view) {
  state.view = view; save();
  $("panel-resume").hidden = view !== "resume";
  $("panel-cover").hidden = view !== "cover";
  $("tab-resume").classList.toggle("active", view === "resume");
  $("tab-cover").classList.toggle("active", view === "cover");
  renderPreview();
}

/* ---------------- Import / export ---------------- */
function exportJSON() {
  const data = JSON.parse(JSON.stringify(state));
  if (data.ai) delete data.ai.key;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (state.personal.name || "resume").replace(/\s+/g, "_").toLowerCase() + ".resumeforge.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = Object.assign(defaultState(), JSON.parse(reader.result));
      save(); hydrate(); setView(state.view || "resume");
    } catch (e) { alert("Could not read that file — is it a valid ResumeForge export?"); }
  };
  reader.readAsText(file);
}

/* ---------------- AI cover letter generation ---------------- */
function buildPrompt() {
  const p = state.personal, c = state.cover;
  const exp = state.experience.map((x) => `- ${x.title} at ${x.org} (${x.when}): ${x.desc}`).join("\n");
  return `Write a concise, confident, professional cover letter (3-4 short paragraphs, no fluff, no clichés like "I am writing to apply").
Applicant: ${p.name || "the applicant"}${p.title ? `, ${p.title}` : ""}.
Target company: ${c.company || "the company"}.
Target role: ${c.role || "the role"}.
Hiring manager: ${c.manager || "unknown"}.
Points to highlight: ${c.highlights || "none specified"}.
Relevant experience:\n${exp || "(not provided)"}\n
Skills: ${state.skills || "(not provided)"}.
Return ONLY the body paragraphs (no date, no address block, no "Dear ...", no "Sincerely" sign-off).`;
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
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error("OpenAI " + res.status + " — " + (await res.text()).slice(0, 200));
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(key, prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error("Anthropic " + res.status + " — " + (await res.text()).slice(0, 200));
  const data = await res.json();
  return data.content[0].text;
}

/* ---------------- Wire up ---------------- */
function init() {
  bindInputs();
  hydrate();
  setView(state.view || "resume");

  $("tab-resume").addEventListener("click", () => setView("resume"));
  $("tab-cover").addEventListener("click", () => setView("cover"));
  $("btn-print").addEventListener("click", () => window.print());
  $("btn-export-json").addEventListener("click", exportJSON);
  $("btn-import").addEventListener("click", () => $("file-import").click());
  $("file-import").addEventListener("change", (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); });
  $("btn-generate").addEventListener("click", generateCover);
  $("ai-key").addEventListener("input", (e) => { state.ai.key = e.target.value; });
}

document.addEventListener("DOMContentLoaded", init);
