(() => {
  "use strict";

  const API_BASE = "https://image.pollinations.ai/prompt/";
  const STORAGE_KEY = "imageai_history_v1";
  const MAX_HISTORY = 60;

  const $ = (id) => document.getElementById(id);

  const promptEl = $("prompt");
  const modelEl = $("model");
  const ratioEl = $("ratio");
  const seedEl = $("seed");
  const countEl = $("count");
  const noLogoEl = $("noLogo");
  const generateBtn = $("generateBtn");
  const surpriseBtn = $("surpriseBtn");
  const randomSeedBtn = $("randomSeedBtn");
  const clearBtn = $("clearBtn");
  const grid = $("grid");
  const emptyState = $("emptyState");
  const toastEl = $("toast");

  const SURPRISE_PROMPTS = [
    "A cyberpunk fox standing on a neon rooftop at night, cinematic lighting, ultra detailed",
    "An ancient library floating in the clouds, golden hour, matte painting",
    "A cozy cabin in a snowy forest, warm window light, studio ghibli style",
    "A futuristic samurai made of glass and light, dramatic pose, 8k render",
    "An underwater city with bioluminescent architecture, wide angle",
    "A steampunk airship sailing above a desert canyon at sunset",
    "A tiny robot gardener tending to giant glowing flowers, whimsical illustration",
    "A dragon curled around a mountain peak, storm clouds, epic fantasy art",
    "A retro-futuristic diner on Mars with astronauts having coffee",
    "A portrait of a queen made entirely of autumn leaves, hyper detailed",
    "A neon-lit Tokyo alley in the rain, reflections, cinematic photography",
    "A crystal forest under two moons, surreal digital art",
  ];

  let toastTimer = null;
  function showToast(message, isError = false) {
    toastEl.textContent = message;
    toastEl.classList.toggle("error", isError);
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  function randomSeed() {
    return Math.floor(Math.random() * 1_000_000_000);
  }

  function buildImageUrl({ prompt, model, width, height, seed, nologo }) {
    const encoded = encodeURIComponent(prompt.trim());
    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      seed: String(seed),
      model,
    });
    if (nologo) params.set("nologo", "true");
    return `${API_BASE}${encoded}?${params.toString()}`;
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
    } catch {
      /* storage full or unavailable — ignore, history is best-effort */
    }
  }

  function updateEmptyState() {
    emptyState.style.display = grid.children.length ? "none" : "block";
  }

  function makeCard(entry, { prepend = true } = {}) {
    const card = document.createElement("div");
    card.className = "card";

    const loading = document.createElement("div");
    loading.className = "card-loading";
    loading.innerHTML = `<span class="spinner"></span><span>Generating…</span>`;
    card.appendChild(loading);

    const img = new Image();
    img.alt = entry.prompt;
    img.loading = "lazy";
    img.style.display = "none";

    img.onload = () => {
      loading.remove();
      img.style.display = "block";
    };

    img.onerror = () => {
      loading.innerHTML = `<div class="card-error">⚠️ Failed to load.<br>The free endpoint may be busy — try again.</div>`;
    };

    img.src = entry.url;
    card.appendChild(img);

    const overlay = document.createElement("div");
    overlay.className = "card-overlay";

    const dlBtn = document.createElement("button");
    dlBtn.className = "overlay-btn";
    dlBtn.title = "Open full image";
    dlBtn.textContent = "⤢";
    dlBtn.onclick = () => window.open(entry.url, "_blank", "noopener");
    overlay.appendChild(dlBtn);

    const copyBtn = document.createElement("button");
    copyBtn.className = "overlay-btn";
    copyBtn.title = "Copy prompt";
    copyBtn.textContent = "📋";
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(entry.prompt);
        showToast("Prompt copied to clipboard");
      } catch {
        showToast("Couldn't copy — clipboard blocked", true);
      }
    };
    overlay.appendChild(copyBtn);

    const regenBtn = document.createElement("button");
    regenBtn.className = "overlay-btn";
    regenBtn.title = "Regenerate with new seed";
    regenBtn.textContent = "🔁";
    regenBtn.onclick = () => {
      generateOne({ ...entry, seed: randomSeed() }, true);
    };
    overlay.appendChild(regenBtn);

    card.appendChild(overlay);

    if (prepend) {
      grid.prepend(card);
    } else {
      grid.appendChild(card);
    }
    updateEmptyState();
  }

  function generateOne(entry, prependToHistory = true) {
    entry.url = buildImageUrl(entry);
    makeCard(entry);
    if (prependToHistory) {
      const history = loadHistory();
      history.unshift(entry);
      saveHistory(history);
    }
  }

  function parseRatio() {
    const [w, h] = ratioEl.value.split("x").map(Number);
    return { width: w, height: h };
  }

  async function handleGenerate() {
    const prompt = promptEl.value.trim();
    if (!prompt) {
      showToast("Type a prompt first ✍️", true);
      promptEl.focus();
      return;
    }

    const model = modelEl.value;
    const { width, height } = parseRatio();
    const nologo = noLogoEl.checked;
    const count = Number(countEl.value);
    const seedInput = seedEl.value.trim();
    const baseSeed = seedInput ? Number(seedInput) : randomSeed();

    generateBtn.disabled = true;
    generateBtn.querySelector(".btn-label").innerHTML = `<span class="spinner"></span> Generating…`;

    try {
      for (let i = 0; i < count; i++) {
        const seed = count === 1 ? baseSeed : baseSeed + i * 7919; // spread seeds for variety
        generateOne({ prompt, model, width, height, seed, nologo });
      }
      showToast(count > 1 ? `Generating ${count} images…` : "Generating image…");
    } finally {
      setTimeout(() => {
        generateBtn.disabled = false;
        generateBtn.querySelector(".btn-label").innerHTML = "✨ Generate image";
      }, 500);
    }
  }

  function restoreHistory() {
    const history = loadHistory();
    for (let i = history.length - 1; i >= 0; i--) {
      makeCard(history[i], { prepend: false });
    }
    updateEmptyState();
  }

  generateBtn.addEventListener("click", handleGenerate);

  promptEl.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  });

  surpriseBtn.addEventListener("click", () => {
    const pick = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    promptEl.value = pick;
    promptEl.focus();
  });

  randomSeedBtn.addEventListener("click", () => {
    seedEl.value = String(randomSeed());
  });

  clearBtn.addEventListener("click", () => {
    if (!grid.children.length) return;
    if (!confirm("Clear your local generation history? This only clears your browser, nothing online.")) return;
    grid.innerHTML = "";
    saveHistory([]);
    updateEmptyState();
    showToast("History cleared");
  });

  restoreHistory();
})();
