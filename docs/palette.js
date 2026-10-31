// Command palette: Ctrl/Cmd+K (or "/") to jump anywhere, launch the games or run terminal commands.
(() => {
  "use strict";

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const go = (id) => () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  // Play Zone panels are tabs, so open the tab instead of scrolling to a hidden element.
  const play = (id, sel) => () => {
    window.playZone?.open(id);
    if (sel) setTimeout(() => document.querySelector(sel)?.click(), 500);
  };
  const term = (cmd) => () => {
    play("terminal")();
    setTimeout(() => {
      const input = document.getElementById("term-in");
      input.value = cmd;
      document.getElementById("term-form").requestSubmit();
      input.focus({ preventScroll: true });
    }, 450);
  };
  const open = (url) => () => window.open(url, "_blank", "noopener");
  const OEP = "https://github.com/open-edge-platform";

  const items = [
    ["Go to", "Home", "🏠", go("home")],
    ["Go to", "About", "👋", go("about")],
    ["Go to", "Experience", "💼", go("resume")],
    ["Go to", "Open Source Projects", "🔓", go("oss")],
    ["Go to", "Tech Playground", "🛠️", go("skills")],
    ["Go to", "Side Projects", "📁", go("projects")],
    ["Go to", "Problem Solver at Heart", "🧩", go("solver")],
    ["Go to", "Play Zone", "🎮", play("game")],
    ["Play", "Bug Squash", "🐛", play("game", "#g-start")],
    ["Play", "Chaos Monkey: break the Kubernetes cluster", "🐒", play("k8s", "#k8s-chaos")],
    ["Play", "Interactive terminal", "⌨️", play("terminal")],
    ["Play", "Lights Out logic puzzle", "💡", go("solver")],
    ["Run", "kubectl get pods", "☸️", term("kubectl get pods")],
    ["Run", "experience", "💼", term("experience")],
    ["Run", "oss", "🔓", term("oss")],
    ["Run", "quote (Nietzsche, Dostoevsky, Kafka…)", "📜", term("quote")],
    ["Run", "help", "❓", term("help")],
    ["Open", "Federal & Aerospace AI Suite (drone SDK)", "🛸", open(`${OEP}/federal-and-aerospace-ai-suite`)],
    ["Open", "Local Lingua", "🗣️", open(`${OEP}/edge-developer-kit-reference-scripts/tree/main/samples/ai/local-lingua`)],
    ["Open", "Edge Node Infrastructure Blueprint", "🧱", open(`${OEP}/edge-node-infrastructure-blueprint`)],
    ["Open", "Mynna (live)", "🐦", open("https://trip.mynna.chat")],
    ["Open", "GitHub profile", "🐙", open("https://github.com/xudipta")],
    ["Contact", "Email Sudipta", "✉️", () => { location.href = "mailto:nathsudipta7@gmail.com"; }],
    ["Contact", "LinkedIn", "💼", open("https://www.linkedin.com/in/sudipta-nath-412833136/")],
  ].map(([group, label, icon, run]) => ({ group, label, icon, run }));

  const el = document.createElement("div");
  el.className = "palette";
  el.hidden = true;
  el.innerHTML = `
    <div class="palette-box" role="dialog" aria-modal="true" aria-label="Command palette">
      <div class="palette-input"><span>›</span><input type="text" placeholder="Jump to a section, play a game, run a command…" aria-label="Search commands" autocomplete="off" spellcheck="false"><kbd>esc</kbd></div>
      <ul class="palette-list" role="listbox"></ul>
      <div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>${isMac ? "⌘" : "Ctrl"}</kbd><kbd>K</kbd> toggle</span></div>
    </div>`;
  document.body.appendChild(el);
  const input = el.querySelector("input"), list = el.querySelector(".palette-list");
  let shown = [], active = 0, lastFocus = null;

  function render() {
    const q = input.value.trim().toLowerCase();
    shown = items.filter((it) => !q || `${it.group} ${it.label}`.toLowerCase().includes(q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    let group = "";
    list.innerHTML = shown.length ? shown.map((it, i) => {
      const head = it.group !== group ? `<li class="palette-group">${(group = it.group)}</li>` : "";
      return `${head}<li role="option" class="palette-item${i === active ? " active" : ""}" data-i="${i}" aria-selected="${i === active}"><span>${it.icon}</span>${it.label}</li>`;
    }).join("") : `<li class="palette-empty">No matches. Try "chaos", "kafka" or "intel".</li>`;
    list.querySelector(".active")?.scrollIntoView({ block: "nearest" });
  }

  function show() {
    lastFocus = document.activeElement;
    el.hidden = false; input.value = ""; active = 0; render();
    input.focus(); // synchronously, so keys typed right after Ctrl+K land in the search box
  }
  function hide() { el.hidden = true; lastFocus?.focus?.({ preventScroll: true }); }
  function choose(i) { const it = shown[i]; if (!it) return; hide(); it.run(); }

  input.addEventListener("input", () => { active = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { active = (active + 1) % Math.max(shown.length, 1); render(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { active = (active - 1 + shown.length) % Math.max(shown.length, 1); render(); e.preventDefault(); }
    else if (e.key === "Enter") { choose(active); e.preventDefault(); }
  });
  list.addEventListener("click", (e) => { const li = e.target.closest(".palette-item"); if (li) choose(+li.dataset.i); });
  list.addEventListener("pointermove", (e) => {
    const li = e.target.closest(".palette-item");
    if (li && +li.dataset.i !== active) { active = +li.dataset.i; render(); }
  });
  el.addEventListener("click", (e) => { if (e.target === el) hide(); });
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName) && document.activeElement !== input;
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); el.hidden ? show() : hide(); }
    else if (e.key === "/" && el.hidden && !typing) { e.preventDefault(); show(); }
    else if (e.key === "Escape" && !el.hidden) hide();
  });

  const btn = document.getElementById("palette-open");
  if (btn) {
    btn.querySelector("kbd").textContent = isMac ? "⌘K" : "Ctrl K";
    btn.addEventListener("click", show);
  }
})();
