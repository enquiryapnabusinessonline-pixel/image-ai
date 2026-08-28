# Contrivance Image AI ✨

**A ChatGPT-style chat interface for free, unlimited AI image generation — no signup, no API key, no credit limits.**

Describe what you want in a chat box, and Contrivance Image AI replies with generated images — just like chatting with an AI assistant, except every response is a picture. Runs entirely client-side: plain HTML, CSS, and JavaScript, no build step, no server, no dependencies.

## ✨ Features

- **Chat-style interface** — a sidebar of past chats, message rows (you vs. Contrivance), and a bottom composer, just like a familiar AI chat app.
- **Live "generating…" status** — an animated typing indicator shows while your image is being created, then swaps in the finished picture.
- **Unlimited generations** — no API key, no login, no quota. Fair-use only.
- **Multiple models** — Turbo (fast, SDXL-Turbo based), Flux, Flux Realism, Flux Anime, Flux 3D.
- **Aspect ratio presets, seeds, and batches** — square/portrait/landscape/tall/wide, fixed or random seeds, up to 4 images per message.
- **Chat history** — every conversation is saved locally (in your browser's `localStorage`) and listed in the sidebar; switch between them anytime.
- **Regenerate** — redo a whole response or a single image with one click.
- **One-click actions** — open full resolution, copy the prompt, or regenerate with a new seed.
- **Enter to send, Shift+Enter for a new line** — same shortcuts you already know.
- **Dark, responsive UI** — collapsible sidebar on mobile, no frameworks required.

## 🚀 Getting started

No build tools, no installation. Just open [index.html](index.html) in a browser, or serve the folder statically:

```bash
# any static file server works, e.g.:
npx serve .
# or
python -m http.server 8080
```

Then visit the served URL, type a prompt in the composer, and hit **Enter**.

## 🧠 How it works

Image requests are made directly from your browser to the free Pollinations.ai image endpoint:

```
https://image.pollinations.ai/prompt/<url-encoded prompt>?width=&height=&seed=&model=&nologo=true
```

No backend, no API keys, no per-user rate limiting on our side — the endpoint is free and public. Each chat is stored locally in your browser; nothing is sent to any Contrivance server. Because there's no server at all, deployment is just static hosting (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc. all work out of the box).

## 📦 Project structure

```
.
├── index.html     # Chat UI markup (sidebar, message list, composer)
├── style.css      # Styling (dark ChatGPT-style theme, responsive layout)
├── script.js      # Chat state, generation logic, history, UI wiring
└── README.md
```

## ⚖️ Fair use

This app relies on a free, community-run public API. "Unlimited" means no artificial cap is imposed by this app or by the provider for normal interactive use — please don't script automated mass-scraping against it. If the free endpoint is ever slow or unavailable, that's outside this project's control; consider self-hosting an open-source diffusion model (e.g. SDXL via [🤗 diffusers](https://github.com/huggingface/diffusers)) on your own GPU as an alternative backend.

## 🛣️ Roadmap ideas

- [ ] Optional self-hosted SDXL backend (Python/diffusers) for users with a local GPU
- [ ] Search across chat history
- [ ] Negative prompt support
- [ ] Image-to-image / inpainting mode

## 📄 License

MIT — see [LICENSE](LICENSE).
