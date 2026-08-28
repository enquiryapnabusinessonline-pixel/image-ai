# image-ai 🎨

**Free, unlimited AI image generation in your browser — no signup, no API key, no credit limits.**

A lightweight static web app that turns text prompts into AI-generated images using free, open, keyless diffusion endpoints (Pollinations.ai — SDXL-Turbo / Flux family models). Runs entirely client-side: plain HTML, CSS, and JavaScript, no build step, no server, no dependencies.

## ✨ Features

- **Unlimited generations** — no API key, no login, no quota. Fair-use only.
- **Multiple models** — Turbo (fast, SDXL-Turbo based), Flux, Flux Realism, Flux Anime, Flux 3D.
- **Aspect ratio presets** — square, portrait, landscape, tall, wide.
- **Seeds** — set a fixed seed for reproducible results, or randomize.
- **Batch generation** — generate up to 4 variations at once.
- **Local history** — your generated images persist across visits (stored in your browser's `localStorage`, never sent anywhere).
- **One-click actions** — open full resolution, copy the prompt, or regenerate with a new seed.
- **Keyboard shortcut** — `Ctrl`/`Cmd` + `Enter` to generate.
- **Dark, responsive UI** — works on desktop and mobile, no frameworks required.

## 🚀 Getting started

No build tools, no installation. Just open [index.html](index.html) in a browser, or serve the folder statically:

```bash
# any static file server works, e.g.:
npx serve .
# or
python -m http.server 8080
```

Then visit the served URL, type a prompt, and hit **Generate**.

## 🧠 How it works

Image requests are made directly from your browser to the free Pollinations.ai image endpoint:

```
https://image.pollinations.ai/prompt/<url-encoded prompt>?width=&height=&seed=&model=&nologo=true
```

No backend, no API keys, no per-user rate limiting on our side — the endpoint is free and public. Because there's no server, deployment is just static hosting (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc. all work out of the box).

## 📦 Project structure

```
.
├── index.html     # App markup / UI
├── style.css      # Styling (dark theme, responsive grid)
├── script.js      # Generation logic, history, UI wiring
└── README.md
```

## ⚖️ Fair use

This app relies on a free, community-run public API. "Unlimited" means no artificial cap is imposed by this app or by the provider for normal interactive use — please don't script automated mass-scraping against it. If the free endpoint is ever slow or unavailable, that's outside this project's control; consider self-hosting an open-source diffusion model (e.g. SDXL via [🤗 diffusers](https://github.com/huggingface/diffusers)) on your own GPU as an alternative backend.

## 🛣️ Roadmap ideas

- [ ] Optional self-hosted SDXL backend (Python/diffusers) for users with a local GPU
- [ ] Prompt history search/filter
- [ ] Negative prompt support
- [ ] Image-to-image / inpainting mode

## 📄 License

MIT — see [LICENSE](LICENSE).
