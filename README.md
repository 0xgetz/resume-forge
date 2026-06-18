# ⚒️ ResumeForge

**A free, open-source AI resume & cover letter builder that runs entirely in your browser.**

No sign-up. No backend. No database. Your data never leaves your device — there is literally no server to send it to. Host it for free on GitHub Pages, Netlify, or Vercel.

[Features](#features) · [Quick start](#quick-start) · [Deploy free](#deploy-for-free) · [How it makes money](#monetization-honest-version)

---

## Features

- 📝 **Live resume editor** — personal details, summary, experience, education, and skills with an instant A4 preview.
- 🎨 **5 templates + accent color + photo** — Modern, Classic, Compact, **Two-column**, and **Photo-header** layouts; pick any accent color and add a profile photo.
- 👥 **Multiple profiles** — keep separate resumes (e.g. "Design CV", "PM CV") and switch between them instantly. Create, rename, and delete profiles; each stores its own data.
- 🎯 **ATS keyword checker** — paste a job description and get a match score plus the exact keywords you're **missing**, so you can tailor your resume before applying.
- ✨ **AI cover letter assist** — generate a tailored draft using **your own** OpenAI or Anthropic key (in the selected UI language). The key is stored only in your browser's `localStorage` and is sent directly to the provider — never to any ResumeForge server (there isn't one).
- 📤 **Export anywhere** — download as **PDF** (print), **Word (.doc)**, or **Markdown (.md)**. Plus JSON import/export to back up or move all your profiles.
- 🌍 **Multi-language UI (i18n)** — English, Bahasa Indonesia, and Español, switchable on the fly.
- 💾 **Autosave** — everything is saved locally as you type.
- 🔒 **Private by design** — 100% client-side. Nothing is tracked, uploaded, or stored remotely.

## Quick start

It's a static site — no build step, no dependencies.

```bash
git clone https://github.com/0xgetz/resume-forge.git
cd resume-forge

# open index.html directly, or serve locally:
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy for free

| Host | How |
|------|-----|
| **GitHub Pages** | Repo → Settings → Pages → deploy from `main` / root. |
| **Netlify** | "Add new site" → drag the folder, or connect the repo. No build command. |
| **Vercel** | Import the repo; framework preset = "Other". |
| **Cloudflare Pages** | Connect repo; build command empty, output dir = `/`. |

All of these have free tiers that comfortably handle a static site.

## Project structure

```
resume-forge/
├── index.html    # markup & layout
├── styles.css    # styling, 5 templates, print rules
├── i18n.js       # UI translations (en / id / es)
├── app.js        # state, profiles, preview, ATS, exports, AI calls
├── LICENSE       # MIT
└── README.md
```

## ATS keyword checker

Open the **ATS Check** tab, paste a job description, and click **Analyze**. ResumeForge extracts the most important terms (single words and notable phrases), checks which already appear in your resume, and shows:

- a **match score** (found ÷ total keywords),
- the keywords **found** in your resume (green),
- the keywords **missing** (red) — weave these into your summary, experience, or skills.

All analysis runs locally in your browser; the job description is never uploaded.

## AI: bring your own key

ResumeForge does **not** ship with an API key and does **not** proxy your requests. When you generate a cover letter:

1. You paste your own OpenAI or Anthropic key into the AI panel.
2. The request goes **directly** from your browser to that provider, in your selected UI language.
3. The key is kept in `localStorage` and is never exported with your resume data.

This keeps the tool genuinely free to run — you only pay your provider for the tokens you use (typically a fraction of a cent per cover letter).

> Note: calling provider APIs from the browser exposes your key to that single browser session. For personal use this is fine. If you build a hosted product on top of this, move AI calls behind a small serverless function instead.

## Monetization (honest version)

This repo is the **product**, not a money machine. Open-source code alone does not generate revenue — distribution and execution do. Realistic, legitimate paths people use to monetize a free tool like this:

- **Premium templates / theme packs** — keep the core free, sell polished designer templates.
- **Hosted "Pro" tier** — cloud sync, team features, or bundled AI credits so users don't need their own key.
- **Affiliate & partnerships** — job boards, ATS-friendly checks, interview-prep tools.
- **Sponsorship / GitHub Sponsors** — if the project gets traction.
- **Done-for-you services** — sell resume reviews or writing on top of the free tool.

⚠️ **Reality check:** there is no honest tool that "automatically makes $200K/month for free." Income from a project like this depends on building an audience, ranking in search, and converting a small percentage of free users into paying ones. Treat this repo as a solid, free starting point — the work that follows (marketing, SEO, support, iteration) is where revenue actually comes from.

## Roadmap

- [x] More templates (two-column, photo header)
- [x] Multiple resume profiles
- [x] ATS keyword checker
- [x] Markdown / Word (.doc) export
- [x] i18n (multi-language UI) — English, Bahasa Indonesia, Español
- [ ] Native `.docx` export (currently Word-compatible HTML `.doc`)
- [ ] More templates (timeline, two-tone sidebar)
- [ ] More UI languages
- [ ] ATS check with weighted scoring & synonyms

Contributions welcome — open an issue or PR.

## License

[MIT](LICENSE) — free for personal and commercial use.
