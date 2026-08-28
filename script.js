(() => {
  "use strict";

  const API_BASE = "https://image.pollinations.ai/prompt/";
  const CHATS_KEY = "contrivance_chats_v1";
  const SETTINGS_KEY = "contrivance_settings_v1";
  const MAX_CHATS = 50;

  const $ = (id) => document.getElementById(id);

  // Elements
  const sidebar = $("sidebar");
  const sidebarOverlay = $("sidebarOverlay");
  const openSidebarBtn = $("openSidebarBtn");
  const closeSidebarBtn = $("closeSidebarBtn");
  const newChatBtn = $("newChatBtn");
  const chatListEl = $("chatList");
  const clearAllBtn = $("clearAllBtn");

  const topbarTitle = $("topbarTitle");
  const settingsBtn = $("settingsBtn");
  const settingsToggle = $("settingsToggle");
  const settingsPanel = $("settingsPanel");
  const closeSettingsBtn = $("closeSettingsBtn");

  const chatScroll = $("chatScroll");
  const welcomeEl = $("welcome");
  const suggestionsEl = $("suggestions");
  const messagesEl = $("messages");

  const promptInput = $("promptInput");
  const sendBtn = $("sendBtn");
  const toastEl = $("toast");

  const modelEl = $("model");
  const ratioEl = $("ratio");
  const seedEl = $("seed");
  const countEl = $("count");
  const noLogoEl = $("noLogo");
  const randomSeedBtn = $("randomSeedBtn");

  const SUGGESTIONS = [
    "A cyberpunk fox on a neon rooftop at night, cinematic lighting",
    "An ancient library floating in the clouds, golden hour",
    "A cozy cabin in a snowy forest, studio ghibli style",
    "A dragon curled around a mountain peak, epic fantasy art",
  ];

  // ---------------- State ----------------
  let chats = loadChats();
  let activeChatId = null; // null = fresh, unsaved "New chat"
  let isGenerating = false;
  let currentGenMsg = null; // assistant message currently locking the composer

  function loadChats() {
    try {
      const raw = localStorage.getItem(CHATS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveChats() {
    try {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats.slice(0, MAX_CHATS)));
    } catch {
      /* storage full/unavailable — best effort only */
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveSettings() {
    const s = {
      model: modelEl.value,
      ratio: ratioEl.value,
      count: countEl.value,
      noLogo: noLogoEl.checked,
    };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }

  (function restoreSettings() {
    const s = loadSettings();
    if (s.model) modelEl.value = s.model;
    if (s.ratio) ratioEl.value = s.ratio;
    if (s.count) countEl.value = s.count;
    if (typeof s.noLogo === "boolean") noLogoEl.checked = s.noLogo;
  })();

  [modelEl, ratioEl, countEl, noLogoEl].forEach((el) =>
    el.addEventListener("change", saveSettings)
  );

  // ---------------- Toast ----------------
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

  function parseRatio(ratio) {
    const [w, h] = ratio.split("x").map(Number);
    return { width: w, height: h };
  }

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // ---------------- Sidebar ----------------
  function renderSidebar() {
    chatListEl.innerHTML = "";
    const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
    for (const chat of sorted) {
      const item = document.createElement("div");
      item.className = "chat-item" + (chat.id === activeChatId ? " active" : "");

      const title = document.createElement("span");
      title.className = "chat-item-title";
      title.textContent = chat.title || "New chat";
      item.appendChild(title);

      const delBtn = document.createElement("button");
      delBtn.className = "chat-item-delete";
      delBtn.title = "Delete chat";
      delBtn.textContent = "🗑";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (!confirm("Delete this chat?")) return;
        chats = chats.filter((c) => c.id !== chat.id);
        saveChats();
        if (activeChatId === chat.id) {
          startNewChat();
        } else {
          renderSidebar();
        }
      };
      item.appendChild(delBtn);

      item.onclick = () => openChat(chat.id);
      chatListEl.appendChild(item);
    }
  }

  function openChat(id) {
    activeChatId = id;
    closeMobileSidebar();
    const chat = chats.find((c) => c.id === id);
    topbarTitle.textContent = chat ? chat.title : "New chat";
    welcomeEl.style.display = "none";
    renderMessages(chat);
    renderSidebar();
    scrollToBottom();
  }

  function startNewChat() {
    activeChatId = null;
    topbarTitle.textContent = "New chat";
    messagesEl.innerHTML = "";
    welcomeEl.style.display = "block";
    closeMobileSidebar();
    renderSidebar();
  }

  // ---------------- Mobile sidebar toggle ----------------
  function openMobileSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
  }
  function closeMobileSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
  }
  openSidebarBtn.addEventListener("click", openMobileSidebar);
  closeSidebarBtn.addEventListener("click", closeMobileSidebar);
  sidebarOverlay.addEventListener("click", closeMobileSidebar);

  // ---------------- Settings popover ----------------
  function toggleSettings() {
    settingsPanel.classList.toggle("hidden");
  }
  settingsBtn.addEventListener("click", toggleSettings);
  settingsToggle.addEventListener("click", toggleSettings);
  closeSettingsBtn.addEventListener("click", () => settingsPanel.classList.add("hidden"));
  randomSeedBtn.addEventListener("click", () => {
    seedEl.value = String(randomSeed());
  });

  // ---------------- Rendering messages ----------------
  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatScroll.scrollTop = chatScroll.scrollHeight;
    });
  }

  function renderMessages(chat) {
    messagesEl.innerHTML = "";
    if (!chat) return;
    for (const msg of chat.messages) {
      messagesEl.appendChild(buildMessageRow(msg));
    }
  }

  function buildMessageRow(msg) {
    const row = document.createElement("div");
    row.className = "msg-row " + msg.role;

    const avatar = document.createElement("div");
    avatar.className = "avatar " + msg.role;
    avatar.textContent = msg.role === "user" ? "You" : "✨";
    row.appendChild(avatar);

    const body = document.createElement("div");
    body.className = "msg-body";

    const name = document.createElement("div");
    name.className = "msg-name";
    name.textContent = msg.role === "user" ? "You" : "Contrivance Image AI";
    body.appendChild(name);

    if (msg.role === "user") {
      const text = document.createElement("div");
      text.className = "msg-text";
      text.textContent = msg.prompt;
      body.appendChild(text);
    } else {
      body.appendChild(buildAssistantContent(msg));
    }

    row.appendChild(body);
    return row;
  }

  function buildAssistantContent(msg) {
    const wrap = document.createElement("div");

    const status = document.createElement("div");
    status.className = "status-line";
    status.innerHTML = `<span class="typing-dots"><span></span><span></span><span></span></span> Contrivance is creating your image…`;
    wrap.appendChild(status);
    msg._statusEl = status;

    const grid = document.createElement("div");
    grid.className = "image-grid" + (msg.images.length === 1 ? " single" : "");
    wrap.appendChild(grid);
    msg._gridEl = grid;

    for (const img of msg.images) {
      grid.appendChild(buildImageCard(img, msg));
    }

    if (msg.showRegenerate) {
      const regenRow = document.createElement("div");
      regenRow.className = "regen-row";
      const regenBtn = document.createElement("button");
      regenBtn.className = "regen-btn";
      regenBtn.textContent = "🔁 Regenerate";
      regenBtn.onclick = () => regenerateMessage(msg);
      regenRow.appendChild(regenBtn);
      wrap.appendChild(regenRow);
    }

    updateAssistantStatus(msg);
    return wrap;
  }

  function updateAssistantStatus(msg) {
    if (!msg._statusEl) return;
    const pending = msg.images.some((i) => i.status === "generating");
    if (pending) {
      msg._statusEl.style.display = "flex";
    } else {
      msg._statusEl.style.display = "none";
    }
  }

  function buildImageCard(imgState, msg) {
    const card = document.createElement("div");
    card.className = "img-card";

    const loading = document.createElement("div");
    loading.className = "card-loading";
    loading.innerHTML = `<span class="spinner"></span><span>Generating…</span>`;

    const img = new Image();
    img.alt = msg.prompt;
    img.loading = "lazy";
    img.style.display = "none";

    if (imgState.status === "done") {
      loading.style.display = "none";
      img.style.display = "block";
    } else if (imgState.status === "error") {
      loading.innerHTML = `<div class="card-error">⚠️ Failed to load.<br>The free endpoint may be busy — try again.</div>`;
    }

    img.onload = () => {
      imgState.status = "done";
      loading.style.display = "none";
      img.style.display = "block";
      updateAssistantStatus(msg);
      persistActiveChat();
      settleOne(msg);
    };
    img.onerror = () => {
      imgState.status = "error";
      loading.innerHTML = `<div class="card-error">⚠️ Failed to load.<br>The free endpoint may be busy — try again.</div>`;
      updateAssistantStatus(msg);
      persistActiveChat();
      settleOne(msg);
    };
    img.src = imgState.url;

    card.appendChild(loading);
    card.appendChild(img);

    const overlay = document.createElement("div");
    overlay.className = "card-overlay";

    const openBtn = document.createElement("button");
    openBtn.className = "overlay-btn";
    openBtn.title = "Open full image";
    openBtn.textContent = "⤢";
    openBtn.onclick = () => window.open(imgState.url, "_blank", "noopener");
    overlay.appendChild(openBtn);

    const copyBtn = document.createElement("button");
    copyBtn.className = "overlay-btn";
    copyBtn.title = "Copy prompt";
    copyBtn.textContent = "📋";
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(msg.prompt);
        showToast("Prompt copied to clipboard");
      } catch {
        showToast("Couldn't copy — clipboard blocked", true);
      }
    };
    overlay.appendChild(copyBtn);

    const regenBtn = document.createElement("button");
    regenBtn.className = "overlay-btn";
    regenBtn.title = "Regenerate this image";
    regenBtn.textContent = "🔁";
    regenBtn.onclick = () => {
      imgState.seed = randomSeed();
      imgState.url = buildImageUrl({ ...imgState, prompt: msg.prompt });
      imgState.status = "generating";
      msg._pending = 1;
      currentGenMsg = msg;
      setGenerating(true);
      rerenderMessage(msg);
    };
    overlay.appendChild(regenBtn);

    card.appendChild(overlay);
    return card;
  }

  function rerenderMessage(msg) {
    const oldWrap = msg._gridEl.parentElement;
    const newWrap = buildAssistantContent(msg);
    oldWrap.replaceWith(newWrap);
    persistActiveChat();
  }

  function regenerateMessage(msg) {
    for (const img of msg.images) {
      img.seed = randomSeed();
      img.url = buildImageUrl({ ...img, prompt: msg.prompt });
      img.status = "generating";
    }
    msg._pending = msg.images.length;
    currentGenMsg = msg;
    setGenerating(true);
    rerenderMessage(msg);
  }

  function settleOne(msg) {
    if (msg._pending === undefined) return;
    msg._pending -= 1;
    if (msg._pending <= 0 && currentGenMsg === msg) {
      currentGenMsg = null;
      setGenerating(false);
    }
  }

  function persistActiveChat() {
    if (!activeChatId) return;
    const chat = chats.find((c) => c.id === activeChatId);
    if (!chat) return;
    chat.updatedAt = Date.now();
    saveChats();
  }

  // ---------------- Sending ----------------
  function setGenerating(on) {
    isGenerating = on;
    promptInput.disabled = on;
    updateSendButton();
  }

  function updateSendButton() {
    const hasText = promptInput.value.trim().length > 0;
    sendBtn.disabled = !hasText || isGenerating;
    sendBtn.classList.toggle("ready", hasText && !isGenerating);
  }

  function autoResize() {
    promptInput.style.height = "auto";
    promptInput.style.height = Math.min(promptInput.scrollHeight, 160) + "px";
  }

  promptInput.addEventListener("input", () => {
    autoResize();
    updateSendButton();
  });

  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener("click", handleSend);

  function truncateTitle(text) {
    const clean = text.trim().replace(/\s+/g, " ");
    return clean.length > 42 ? clean.slice(0, 42) + "…" : clean;
  }

  function handleSend() {
    const prompt = promptInput.value.trim();
    if (!prompt || isGenerating) return;

    if (!activeChatId) {
      const chat = {
        id: uid(),
        title: truncateTitle(prompt),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      chats.unshift(chat);
      activeChatId = chat.id;
      welcomeEl.style.display = "none";
      topbarTitle.textContent = chat.title;
    }

    const chat = chats.find((c) => c.id === activeChatId);

    // clear "showRegenerate" on previous assistant message
    for (const m of chat.messages) m.showRegenerate = false;

    const userMsg = { id: uid(), role: "user", prompt };
    chat.messages.push(userMsg);
    messagesEl.appendChild(buildMessageRow(userMsg));

    const model = modelEl.value;
    const { width, height } = parseRatio(ratioEl.value);
    const nologo = noLogoEl.checked;
    const count = Number(countEl.value);
    const seedInput = seedEl.value.trim();
    const baseSeed = seedInput ? Number(seedInput) : randomSeed();

    const images = [];
    for (let i = 0; i < count; i++) {
      const seed = count === 1 ? baseSeed : baseSeed + i * 7919;
      const imgState = { model, width, height, seed, nologo, status: "generating" };
      imgState.url = buildImageUrl({ ...imgState, prompt });
      images.push(imgState);
    }

    const assistantMsg = {
      id: uid(),
      role: "assistant",
      prompt,
      images,
      showRegenerate: true,
      _pending: images.length,
    };
    chat.messages.push(assistantMsg);
    messagesEl.appendChild(buildMessageRow(assistantMsg));

    chat.updatedAt = Date.now();
    saveChats();
    renderSidebar();

    currentGenMsg = assistantMsg;
    setGenerating(true);

    promptInput.value = "";
    autoResize();
    updateSendButton();
    scrollToBottom();
    showToast(count > 1 ? `Generating ${count} images…` : "Generating image…");
  }

  // ---------------- New chat / clear all ----------------
  newChatBtn.addEventListener("click", startNewChat);

  clearAllBtn.addEventListener("click", () => {
    if (!chats.length) return;
    if (!confirm("Delete all chat history? This only clears your browser, nothing online.")) return;
    chats = [];
    saveChats();
    startNewChat();
    showToast("All chats cleared");
  });

  // ---------------- Suggestions ----------------
  function renderSuggestions() {
    suggestionsEl.innerHTML = "";
    for (const s of SUGGESTIONS) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "suggestion-chip";
      chip.textContent = s;
      chip.onclick = () => {
        promptInput.value = s;
        autoResize();
        updateSendButton();
        handleSend();
      };
      suggestionsEl.appendChild(chip);
    }
  }

  // ---------------- Init ----------------
  renderSuggestions();
  renderSidebar();
  startNewChat();
})();
