# ⚒️ ResumeForge

**A free, open-source AI resume & cover letter builder that runs entirely in your browser.**

No sign-up. No backend. No database. Your data never leaves your device — there is literally no server to send it to. Host it for free on GitHub Pages, Netlify, or Vercel.

[**▶ Live demo**](#deploy-for-free) · [Features](#features) · [Quick start](#quick-start) · [How it makes money](#monetization-honest-version)

---

## Features

- 📝 **Live resume editor** — personal details, summary, experience, education, and skills with an instant A4 preview.
- 🎨 **Templates & accent color** — Modern, Classic, and Compact layouts; pick any accent color.
- ✨ **AI cover letter assist** — generate a tailored draft using **your own** OpenAI or Anthropic API key. The key is stored only in your browser's `localStorage` and is sent directly to the provider — never to any ResumeForge server (there isn't one).
- 💾 **Autosave + import/export** — everything is saved locally; export your data as JSON and re-import it anytime.
- 🖨️ **One-click PDF** — uses the browser's native print-to-PDF, so the output is crisp and free.
- 🔒 **Private by design** — 100% client-side. Nothing is tracked, uploaded, or stored remotely.

## Quick start

It's a static site — no build step, no dependencies.

```bash
git clone https://github.com/<your-username>/resume-forge.git
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
├── styles.css    # styling, templates, print rules
├── app.js        # editor state, live preview, import/export, AI calls
├── LICENSE       # MIT
└── README.md
```

## AI: bring your own key

ResumeForge does **not** ship with an API key and does **not** proxy your requests. When you generate a cover letter:

1. You paste your own OpenAI or Anthropic key into the AI panel.
2. The request goes **directly** from your browser to that provider.
3. The key is kept in `localStorage` and never exported with your resume data.

This keeps the tool genuinely free to run — you only pay your provider for the tokens you use (typically a fraction of a cent per cover letter).

> Note: calling provider APIs from the browser exposes your key to that single browser session. For personal use this is fine. If you build a hosted product on top of this, move AI calls behind a small serverless function instead.

## Monetization (honest version)

This repo is the **product**, not a money machine. Open-source code alone does not generate revenue — distribution and execution do. Realistic, legitimate paths people use to monetize a free tool like this:

- **Premium templates / theme packs** — keep the core free, sell polished designer templates.
- **Hosted "Pro" tier** — a paid version that stores resumes in the cloud, adds team features, or bundles AI credits so users don't need their own key.
- **Affiliate & partnerships** — job boards, ATS-friendly checks, interview-prep tools.
- **Sponsorship / GitHub Sponsors** — if the project gets traction.
- **Done-for-you services** — sell resume reviews or writing on top of the free tool.

⚠️ **Reality check:** there is no honest tool that "automatically makes $200K/month for free." Income from a project like this depends on building an audience, ranking in search, and converting a small percentage of free users into paying ones. Treat this repo as a solid, free starting point — the work that follows (marketing, SEO, customer support, iteration) is where revenue actually comes from.

## Roadmap ideas

- [ ] More templates (two-column, photo header)
- [ ] Multiple resume profiles
- [ ] ATS keyword checker
- [ ] Markdown / DOCX export
- [ ] i18n (multi-language UI)

Contributions welcome — open an issue or PR.

## License

[MIT](LICENSE) — free for personal and commercial use.
