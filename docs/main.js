(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel) => document.querySelector(sel);

  // ---------- Content (edit here) ----------
  const GITHUB_USER = "xudipta";

  const roles = [
    "software engineer @ Intel",
    "cloud & infra engineer",
    "Kubernetes wrangler",
    "system designer (HLD + LLD)",
    "AI product builder",
    "game developer (C++)",
    "automation enthusiast",
    "professional bug starer",
  ];

  // Where a skill was used. Keys are referenced from the skill list below.
  const OEP = "https://github.com/open-edge-platform";
  const proof = {
    lingua: ["Local Lingua", `${OEP}/edge-developer-kit-reference-scripts/tree/main/samples/ai/local-lingua`],
    fedaero: ["Federal & Aerospace AI Suite", `${OEP}/federal-and-aerospace-ai-suite`],
    enib: ["Edge Node Infrastructure Blueprint", `${OEP}/edge-node-infrastructure-blueprint`],
    emf: ["Edge Manageability Framework", `${OEP}/edge-manageability-framework`],
    mynna: ["Mynna", "https://trip.mynna.chat"],
    cookbook: ["cookbook", "https://github.com/xudipta/cookbook"],
    games: ["nostalgia-bytes", "https://github.com/sbrous-org/nostalgia-bytes"],
    sbi: ["State Bank of India", null],
    lld: ["LLD", "https://github.com/xudipta/LLD"],
    dsa: ["dsaRepo", "https://github.com/xudipta/dsaRepo"],
    spring: ["springbootCRUD", "https://github.com/xudipta/springbootCRUD"],
    flutter: ["paint_flutter", "https://github.com/xudipta/paint_flutter"],
    site: ["this site", null],
  };

  const skills = [
    { id: "edge-ai", icon: "🧠", title: "Edge AI & Acceleration", blurb: "Running real models locally on Intel CPU, GPU and NPU. No cloud required.",
      items: [["OpenVINO", "lingua", "fedaero"], ["Intel NPU", "lingua"], ["Intel iGPU", "lingua", "enib"], ["DL Streamer", "fedaero"], ["YOLO object detection", "fedaero"],
        ["Whisper speech-to-text", "lingua"], ["NLLB-200 translation", "lingua"], ["Sentiment & voice emotion", "lingua"], ["Text-to-speech", "lingua"]] },
    { id: "drones", icon: "🛸", title: "Drones & Aerospace", blurb: "SDKs and AI for UAVs and aerospace edge deployments.",
      items: [["Drone / UAV SDKs", "fedaero"], ["MAVLink telemetry", "fedaero"], ["Video analytics pipelines", "fedaero"], ["RTSP streaming", "fedaero"]] },
    { id: "infra", icon: "☸️", title: "Edge & Cloud Infrastructure", blurb: "From bare-metal edge nodes to Kubernetes clusters.",
      items: [["Kubernetes", "cookbook"], ["Helm", "cookbook"], ["Docker", "lingua", "mynna", "cookbook"], ["Edge node provisioning", "enib"], ["Edge fleet management", "emf"],
        ["SR-IOV", "enib"], ["GPU / NPU enablement", "enib"], ["Terraform", "cookbook"], ["AWS"], ["Linux", "cookbook"], ["Networking"], ["CI/CD & GitHub Actions", "cookbook"]] },
    { id: "backend", icon: "🗄️", title: "Backend & Data", blurb: "Scalable services, from banking backends to real-time apps.",
      items: [["Scalable backends", "sbi"], ["FastAPI", "mynna", "lingua"], ["Spring Boot", "spring"], ["REST APIs", "lingua", "spring"], ["WebSockets", "mynna"],
        ["PostgreSQL", "mynna"], ["pgvector", "mynna"], ["SQLite", "lingua"], ["LISTEN/NOTIFY fan-out", "mynna"]] },
    { id: "ai-apps", icon: "🤖", title: "AI & LLM Apps", blurb: "Grounded, cheap and swappable: LLM products that actually ship.",
      items: [["RAG", "mynna"], ["LLM pipelines", "mynna"], ["Pluggable small models", "mynna"], ["Prompt design", "mynna"], ["Hybrid search", "mynna"],
        ["Agent Skills", "cookbook"], ["Model Context Protocol (MCP)", "cookbook"]] },
    { id: "langs", icon: "💻", title: "Languages", blurb: "Picking the right tool, not the favourite one.",
      items: [["Go"], ["Python", "lingua", "mynna"], ["Java", "spring", "lld"], ["C++", "games", "dsa"], ["JavaScript", "site"], ["SQL", "mynna"], ["Shell", "cookbook"], ["PowerShell"]] },
    { id: "frontend", icon: "🎨", title: "Frontend, Graphics & Games", blurb: "Because shipping includes the part people see.",
      items: [["WebGL", "site"], ["Canvas & animation", "site"], ["HTML & CSS", "site"], ["Flutter", "flutter"], ["Game development", "games"]] },
    { id: "craft", icon: "📐", title: "Engineering Craft", blurb: "How I think before I type.",
      items: [["System design (HLD)"], ["Low-level design (LLD)", "lld"], ["Design patterns", "lld"], ["Data structures & algorithms", "dsa"],
        ["Architecture decision records", "mynna"], ["POC → production", "mynna"], ["Testing in CI", "cookbook"]] },
  ];
  const exploring = ["Agentic AI workflows", "NPU-first AI apps", "Small language models on the edge"];

  // `repo` is the public GitHub repo (used for live star counts); `url` overrides the link.
  const projects = [
    { name: "Mynna", org: "OxomiAi", url: "https://trip.mynna.chat", linkLabel: "live ↗", icon: "🐦",
      desc: "Shared-session trip planner for Northeast India. Friends plan together in one live chat with Mynna, an AI bot grounded in a curated knowledge base, which builds a shared, live itinerary.",
      tags: ["Python", "FastAPI", "WebSockets", "PostgreSQL", "pgvector", "RAG", "LLM", "Docker"] },
    { name: "nostalgia-bytes", org: "sbrous-org", repo: "sbrous-org/nostalgia-bytes", icon: "🎮",
      desc: "Classic games built in C++: Serpente (Snake), Traffigo (car race), Egatho (egg basket) and Broppy (Flappy Bird), with Make and Windows build scripts.",
      tags: ["C++", "Game Dev", "Make"] },
    { name: "cookbook", repo: `${GITHUB_USER}/cookbook`, icon: "📖",
      desc: "CI-validated notes on Kubernetes, Docker, Linux, Terraform, CI/CD, Agent Skills and MCP. Every note ships with a runnable, automatically checked example.",
      tags: ["Python", "Shell", "GitHub Actions"] },
  ];

  // ---------- Background: animated "cluster" network ----------
  function initBackground() {
    if (document.documentElement.classList.contains("has-3d")) return; // scene.js is running
    const canvas = $("#bg");
    const ctx = canvas.getContext("2d");
    let w, h, nodes, packets;
    const mouse = { x: -1e4, y: -1e4 };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.floor((w * h) / 22000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 1,
      }));
      packets = [];
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      const maxDist = 140;
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 120 && d > 0) { n.x += (dx / d) * 1.2; n.y += (dy / d) * 1.2; }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxDist) {
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.14 * (1 - d / maxDist)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (packets.length < 25 && Math.random() < 0.0008) packets.push({ a, b, t: 0 });
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = "rgba(167, 139, 250, 0.7)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      // "packets" travelling between pods
      packets = packets.filter((p) => (p.t += 0.015) < 1);
      for (const p of packets) {
        const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.fillStyle = "rgba(52, 211, 153, 0.9)";
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    requestAnimationFrame(reducedMotion ? () => drawStatic() : frame);

    function drawStatic() {
      for (const n of nodes) {
        ctx.fillStyle = "rgba(167, 139, 250, 0.5)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // ---------- Typed roles ----------
  function initTyped() {
    const el = $("#typed");
    if (reducedMotion) { el.textContent = roles[0]; return; }
    let r = 0, i = 0, deleting = false;
    (function tick() {
      const word = roles[r];
      el.textContent = word.slice(0, i);
      if (!deleting && i === word.length) { deleting = true; return setTimeout(tick, 1600); }
      if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; }
      i += deleting ? -1 : 1;
      setTimeout(tick, deleting ? 35 : 70);
    })();
  }

  // ---------- Count-up stats ----------
  function countUp(el) {
    const target = +el.dataset.count;
    if (reducedMotion) { el.textContent = target; return; }
    const start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  // ---------- Skills & projects ----------
  function renderSkills() {
    const root = $("#skill-groups"), tabs = $("#skill-tabs");
    const total = skills.reduce((n, g) => n + g.items.length, 0);
    const stat = document.querySelector("[data-count-skills]");
    if (stat) stat.dataset.count = total;

    const tip = document.createElement("div");
    tip.className = "skill-tip";
    document.body.appendChild(tip);

    tabs.innerHTML = [`<button type="button" class="tab active" data-f="all">All <span>${total}</span></button>`]
      .concat(skills.map((g) => `<button type="button" class="tab" data-f="${g.id}">${g.icon} ${g.title} <span>${g.items.length}</span></button>`)).join("");

    let delay = 0;
    for (const g of skills) {
      const card = document.createElement("div");
      card.className = "card skill-card tilt";
      card.dataset.group = g.id;
      card.innerHTML = `<div class="skill-head"><span class="ico">${g.icon}</span><h4>${g.title}</h4><span class="count">${g.items.length}</span></div><p>${g.blurb}</p><div class="chips"></div>`;
      const chips = card.querySelector(".chips");
      for (const [name, ...refs] of g.items) {
        const used = refs.map((r) => proof[r]).filter(Boolean);
        const link = used.find(([, url]) => url);
        const c = document.createElement(link ? "a" : "span");
        c.className = "chip" + (used.length ? " proven" : "");
        c.textContent = name;
        if (link) { c.href = link[1]; c.target = "_blank"; c.rel = "noopener"; }
        if (used.length) {
          c.dataset.used = used.map(([label]) => label).join(" · ");
          c.setAttribute("aria-label", `${name}, used in ${c.dataset.used}`);
        }
        c.style.transitionDelay = `${(delay += 18)}ms`;
        c.addEventListener("mouseleave", () => { c.style.transitionDelay = "0ms"; tip.classList.remove("on"); });
        c.addEventListener("mouseenter", () => {
          if (!c.dataset.used) return;
          tip.innerHTML = `<small>used in</small>${c.dataset.used}`;
          const r = c.getBoundingClientRect();
          tip.style.left = `${Math.min(Math.max(8, r.left + r.width / 2 - tip.offsetWidth / 2), window.innerWidth - tip.offsetWidth - 8)}px`;
          tip.style.top = `${r.top - tip.offsetHeight - 10}px`;
          tip.classList.add("on");
        });
        chips.appendChild(c);
      }
      root.appendChild(card);
    }

    root.insertAdjacentHTML("afterend", `<div class="exploring"><span class="pulse"></span><b>Currently exploring</b>${exploring.map((e) => `<span>${e}</span>`).join("")}</div>`);

    tabs.addEventListener("click", (e) => {
      const t = e.target.closest(".tab");
      if (!t) return;
      tabs.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === t));
      root.querySelectorAll(".skill-card").forEach((card) => {
        card.hidden = t.dataset.f !== "all" && card.dataset.group !== t.dataset.f;
      });
      root.classList.toggle("single", t.dataset.f !== "all");
    });
    window.addEventListener("scroll", () => tip.classList.remove("on"), { passive: true });
  }

  function renderProjects() {
    const grid = $("#project-grid");
    for (const p of projects) {
      const a = document.createElement("a");
      a.className = "card project tilt";
      a.href = p.url || `https://github.com/${p.repo}`;
      a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = `
        <div class="top"><h4>${p.icon} ${p.name}</h4><span class="stars" data-repo="${p.repo || ""}">${p.linkLabel || ""}</span></div>
        ${p.org ? `<span class="org">@${p.org}</span>` : ""}
        <p>${p.desc}</p>
        <div class="meta">${p.tags.map((t) => `<span>#${t}</span>`).join("")}</div>`;
      a.addEventListener("pointermove", (e) => {
        const r = a.getBoundingClientRect();
        a.style.setProperty("--mx", `${e.clientX - r.left}px`);
        a.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
      grid.appendChild(a);
    }
    // Live star counts; silently skipped if the API is unavailable or rate limited.
    for (const p of projects.filter((p) => p.repo)) {
      fetch(`https://api.github.com/repos/${p.repo}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((repo) => {
          const el = document.querySelector(`.stars[data-repo="${p.repo}"]`);
          if (repo && el && repo.stargazers_count > 0) el.textContent = `★ ${repo.stargazers_count}`;
        })
        .catch(() => {});
    }
  }

  // ---------- 3D tilt on cards ----------
  function initTilt() {
    if (reducedMotion || !window.matchMedia("(hover: hover)").matches) return;
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest && e.target.closest(".tilt");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-3px)`;
    });
    document.addEventListener("pointerout", (e) => {
      const card = e.target.closest && e.target.closest(".tilt");
      if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
    });
  }

  // ---------- Scroll reveal ----------
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add("visible");
        io.unobserve(en.target);
      }
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    document.querySelectorAll("[data-count]").forEach(countUp);
  }

  // ---------- Resume button (only shown if docs/resume.pdf exists) ----------
  function initResume() {
    const btn = $("#resume-btn");
    fetch(btn.getAttribute("href"), { method: "HEAD" })
      .then((r) => { if (r.ok) btn.hidden = false; })
      .catch(() => {});
  }

  // ---------- Interactive terminal ----------
  function initTerminal() {
    const body = $("#term-body"), form = $("#term-form"), input = $("#term-in");
    const history = []; let hIdx = 0;
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const print = (html, cls = "") => {
      const div = document.createElement("div");
      if (cls) div.className = cls;
      div.innerHTML = html;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    };

    const commands = {
      help: () => [
        "Available commands:",
        "  <span class='hl'>about</span>       who is this person?",
        "  <span class='hl'>experience</span>  where I've worked",
        "  <span class='hl'>oss</span>         open source at Intel",
        "  <span class='hl'>skills</span>      the tech playground",
        "  <span class='hl'>projects</span>    things I've built",
        "  <span class='hl'>chaos</span>       break my Kubernetes cluster",
        "  <span class='hl'>game</span>        squash some bugs",
        "  <span class='hl'>puzzle</span>      a logic puzzle",
        "  <span class='hl'>motto</span>       how I solve problems",
        "  <span class='hl'>quote</span>       Nietzsche, Dostoevsky, Kafka & co.",
        "  <span class='hl'>kubectl</span>     try: kubectl get pods",
        "  <span class='hl'>github</span>      open my GitHub",
        "  <span class='hl'>clear</span>       clear the screen",
        "  ...and a few hidden ones 👀",
      ].join("\n"),
      about: () => "Sudipta: engineer at Intel, full-time code wrangler, part-time philosopher.\nM.Tech, NIT Durgapur. Doesn't quit until the problem gives up first.",
      experience: () => [
        "<span class='hl'>Intel</span> (current)",
        "  ▸ next     🔒 under wraps (will be open-sourced)",
        "  ▸ now      drone SDK (Federal & Aerospace AI Suite), Local Lingua",
        "  ▸ then     Edge Node Infrastructure Blueprint",
        "  ▸ started  Edge Manageability Framework",
        "<span class='hl'>State Bank of India</span>: application developer, scalable apps & backends",
        "<span class='hl'>Food delivery startup</span>: end-to-end campus delivery, college venture",
        "<span class='hl'>Education</span>: M.Tech, NIT Durgapur",
      ].join("\n"),
      whoami: () => "sudipta",
      skills: () => skills.map((g) => `${g.icon} <span class='hl'>${g.title}</span>: ${g.items.map(([n]) => n).join(", ")}`).join("\n"),
      projects: () => projects.map((p) => `${p.icon} <a href="${p.url || `https://github.com/${p.repo}`}" target="_blank" rel="noopener">${p.name}</a>${p.org ? ` <span class='hl'>@${p.org}</span>` : ""}`).join("\n"),
      ls: () => projects.map((p) => p.name + "/").join("  ") + "  README.md",
      "cat": (args) => args[0] && args[0].toLowerCase() === "readme.md"
        ? "# Hey there, I'm Sudipta 🚀\nWriting code that doesn't crash... eventually."
        : "cat: missing or unknown file. Try: cat README.md",
      resume: () => { location.hash = "#resume"; return "Opening experience..."; },
      chaos: () => { location.hash = "#k8s"; return "Releasing the chaos monkey 🐒..."; },
      game: () => { location.hash = "#game"; return "Loading bug squash... good luck."; },
      github: () => { window.open(`https://github.com/${GITHUB_USER}`, "_blank", "noopener"); return "Opening github.com/" + GITHUB_USER; },
      kubectl: (args) => {
        if (args.join(" ") === "get pods") {
          return [
            "NAME                       READY   STATUS             RESTARTS   AGE",
            "curiosity-7f9c4d-x2k8p     1/1     Running            0          ∞",
            "coffee-5b8d7c-9qwz1        1/1     Running            42         8h",
            "side-project-6c4f-mn3lp    1/1     Running            0          3d",
            "sleep-schedule-4d2a-0aa1   0/1     CrashLoopBackOff   999        2y",
          ].join("\n");
        }
        if (args[0] === "delete") return "Error from server (Forbidden): nice try, this cluster is production 😅";
        return "usage: kubectl get pods";
      },
      docker: () => "Cannot connect to the Docker daemon. Is it running? (It's always the daemon.)",
      terraform: (args) => args[0] === "destroy" ? "<span class='err'>Plan: 0 to add, 0 to change, everything to destroy.</span>\nAborted. Not today." : "Terraform has been successfully initialized! Try: terraform destroy",
      sudo: () => "<span class='err'>sudo: permission denied.</span> This incident will be reported. 🚨",
      date: () => new Date().toString(),
      echo: (args) => esc(args.join(" ")),
      exit: () => "There is no escape. Try <span class='hl'>game</span> instead.",
      puzzle: () => { location.hash = "#solver"; return "Opening the Logic Lab... turn all the lights off."; },
      quote: () => { const [q, a] = quotes[Math.floor(Math.random() * quotes.length)]; return `“${q}”\n  <span class='hl'>— ${a}</span>`; },
      oss: () => [
        ["federal-and-aerospace-ai-suite", "drone SDK for aerospace & defence edge AI"],
        ["edge-developer-kit-reference-scripts/tree/main/samples/ai/local-lingua", "Local Lingua: offline translation + sentiment on CPU/GPU/NPU"],
        ["edge-node-infrastructure-blueprint", "edge nodes with GPU, NPU and SR-IOV acceleration"],
      ].map(([p, d]) => `🔓 <a href="https://github.com/open-edge-platform/${p}" target="_blank" rel="noopener">${p.split("/").pop()}</a>  ${d}`).concat("🔒 ██████████  coming soon").join("\n"),
      motto: () => "Understand → Break it down → Build → Break it (on purpose) → Fix → Repeat.",
      clear: () => { body.innerHTML = ""; return null; },
    };

    function run(raw) {
      const line = raw.trim();
      print(`<span class="cmd">sudipta@portfolio:~$</span> ${esc(line)}`);
      if (!line) return;
      history.push(line); hIdx = history.length;
      const [cmd, ...args] = line.split(/\s+/);
      const fn = commands[cmd.toLowerCase()];
      const out = fn ? fn(args) : `<span class="err">command not found: ${esc(cmd)}</span>. Type <span class="hl">help</span>.`;
      if (out) print(out);
    }

    print("Welcome to sudipta's portfolio shell v1.0.0\nType <span class='hl'>help</span> to see available commands.");
    form.addEventListener("submit", (e) => { e.preventDefault(); run(input.value); input.value = ""; });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && hIdx > 0) { input.value = history[--hIdx]; e.preventDefault(); }
      if (e.key === "ArrowDown") { hIdx = Math.min(hIdx + 1, history.length); input.value = history[hIdx] || ""; e.preventDefault(); }
      if (e.key === "Tab") {
        e.preventDefault();
        const match = Object.keys(commands).find((c) => c.startsWith(input.value));
        if (match && input.value) input.value = match;
      }
    });
    $("#term").addEventListener("click", () => input.focus({ preventScroll: true }));
  }

  // ---------- Bug Squash game ----------
  function initGame() {
    const canvas = $("#game-canvas"), ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const overlay = $("#g-overlay"), scoreEl = $("#g-score"), timeEl = $("#g-time"), bestEl = $("#g-best");
    let best = 0;
    try { best = +localStorage.getItem("bugsquash-best") || 0; } catch (_) {}
    bestEl.textContent = best;

    let entities = [], splats = [], score = 0, timeLeft = 30, running = false, last = 0, spawnTimer = 0, raf;

    function spawn() {
      const isFeature = Math.random() < 0.22;
      const speed = (isFeature ? 40 : 60 + Math.random() * 80) * (1 + (30 - timeLeft) / 30);
      const angle = Math.random() * Math.PI * 2;
      entities.push({
        x: 40 + Math.random() * (W - 80), y: 40 + Math.random() * (H - 80),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        feature: isFeature, life: isFeature ? 2.5 : 4 + Math.random() * 2, wobble: Math.random() * 10,
      });
    }

    function drawGrid() {
      ctx.fillStyle = "#070a10"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(148,163,184,0.06)"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      timeLeft -= dt;
      if (timeLeft <= 0) return end();
      timeEl.textContent = Math.ceil(timeLeft);

      spawnTimer -= dt;
      if (spawnTimer <= 0) { spawn(); spawnTimer = Math.max(0.25, 0.8 - (30 - timeLeft) * 0.018); }

      drawGrid();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const s of splats) {
        s.t -= dt;
        ctx.globalAlpha = Math.max(s.t, 0);
        ctx.font = "bold 22px system-ui, sans-serif";
        ctx.fillStyle = s.good ? "#34d399" : "#f87171";
        ctx.fillText(s.text, s.x, s.y - (1 - s.t) * 30);
      }
      ctx.globalAlpha = 1;
      splats = splats.filter((s) => s.t > 0);

      ctx.font = "34px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
      for (const e of entities) {
        e.wobble += dt * 8;
        e.x += e.vx * dt + Math.sin(e.wobble) * 0.6; e.y += e.vy * dt;
        if (e.x < 20 || e.x > W - 20) e.vx *= -1;
        if (e.y < 20 || e.y > H - 20) e.vy *= -1;
        e.life -= dt;
        ctx.save();
        ctx.translate(e.x, e.y);
        if (!e.feature) ctx.rotate(Math.atan2(e.vy, e.vx) + Math.PI / 2);
        ctx.globalAlpha = Math.min(1, e.life);
        ctx.fillText(e.feature ? "✅" : "🐛", 0, 0);
        ctx.restore();
      }
      entities = entities.filter((e) => e.life > 0);
      raf = requestAnimationFrame(loop);
    }

    function hit(clientX, clientY) {
      if (!running) return;
      const r = canvas.getBoundingClientRect();
      const x = (clientX - r.left) * (W / r.width), y = (clientY - r.top) * (H / r.height);
      for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        if (Math.hypot(e.x - x, e.y - y) < 28) {
          entities.splice(i, 1);
          if (e.feature) { score = Math.max(0, score - 3); splats.push({ x: e.x, y: e.y, t: 1, text: "-3 regression!", good: false }); }
          else { score += 1; splats.push({ x: e.x, y: e.y, t: 1, text: "+1", good: true }); }
          scoreEl.textContent = score;
          return;
        }
      }
    }

    function start() {
      entities = []; splats = []; score = 0; timeLeft = 30; spawnTimer = 0;
      scoreEl.textContent = 0; timeEl.textContent = 30;
      overlay.hidden = true; running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function end() {
      running = false; cancelAnimationFrame(raf);
      timeEl.textContent = 0;
      if (score > best) {
        best = score; bestEl.textContent = best;
        try { localStorage.setItem("bugsquash-best", best); } catch (_) {}
      }
      const verdict = score >= 30 ? "Senior SRE material. 🏆" : score >= 18 ? "Ship it! Production is stable. 🚀" : score >= 8 ? "Not bad. A few bugs made it to prod. 🔥" : "Have you tried turning it off and on again? 😅";
      $("#g-title").textContent = `You squashed ${score} bug${score === 1 ? "" : "s"}`;
      $("#g-msg").textContent = verdict;
      $("#g-start").textContent = "Play again";
      overlay.hidden = false;
    }

    canvas.addEventListener("pointerdown", (e) => hit(e.clientX, e.clientY));
    $("#g-start").addEventListener("click", start);
    drawGrid();
  }

  // ---------- Problem-solving loop (highlights one step at a time) ----------
  function initLoop() {
    const steps = document.querySelectorAll("#loop li");
    let i = 0;
    steps[0].classList.add("active");
    if (reducedMotion) return;
    setInterval(() => {
      steps[i].classList.remove("active");
      i = (i + 1) % steps.length;
      steps[i].classList.add("active");
    }, 1400);
  }

  // ---------- Lights Out puzzle ----------
  function initLightsOut() {
    const N = 5, grid = $("#lo-grid"), movesEl = $("#lo-moves"), status = $("#lo-status");
    let board = [], moves = 0, solved = false;
    const cells = [];

    function toggle(r, c) {
      for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const y = r + dr, x = c + dc;
        if (y >= 0 && y < N && x >= 0 && x < N) board[y * N + x] ^= 1;
      }
    }
    function draw() {
      board.forEach((on, k) => cells[k].classList.toggle("on", !!on));
      movesEl.textContent = moves;
    }
    // Scramble by pressing random cells from a solved board, so every puzzle is solvable.
    function newPuzzle() {
      board = new Array(N * N).fill(0); moves = 0; solved = false;
      while (board.every((v) => !v)) {
        for (let k = 0; k < 6; k++) toggle(Math.floor(Math.random() * N), Math.floor(Math.random() * N));
      }
      status.textContent = "";
      grid.classList.remove("won");
      draw();
    }
    for (let k = 0; k < N * N; k++) {
      const b = document.createElement("button");
      b.className = "lo-cell";
      b.setAttribute("aria-label", `Row ${Math.floor(k / N) + 1}, column ${(k % N) + 1}`);
      b.addEventListener("click", () => {
        if (solved) return;
        toggle(Math.floor(k / N), k % N);
        moves++; draw();
        if (board.every((v) => !v)) {
          solved = true;
          grid.classList.add("won");
          status.textContent = `Solved in ${moves} moves! 🎉`;
        }
      });
      cells.push(b); grid.appendChild(b);
    }
    $("#lo-new").addEventListener("click", newPuzzle);
    newPuzzle();
  }

  // ---------- Philosophical quotes drifting in the background ----------
  const quotes = [
    ["Simplicity is prerequisite for reliability.", "Edsger W. Dijkstra"],
    ["The obstacle is the way.", "Marcus Aurelius"],
    ["What I cannot create, I do not understand.", "Richard Feynman"],
    ["First, solve the problem. Then, write the code.", "John Johnson"],
    ["The only way to go fast is to go well.", "Robert C. Martin"],
    ["Order is the shape upon which beauty depends.", "Pearl S. Buck"],
    ["One must still have chaos in oneself to be able to give birth to a dancing star.", "Friedrich Nietzsche"],
    ["He who has a why to live can bear almost any how.", "Friedrich Nietzsche"],
    ["The mystery of human existence lies not in just staying alive, but in finding something to live for.", "Fyodor Dostoevsky"],
    ["To go wrong in one's own way is better than to go right in someone else's.", "Fyodor Dostoevsky"],
    ["A book must be the axe for the frozen sea within us.", "Franz Kafka"],
    ["From a certain point onward there is no longer any turning back. That is the point that must be reached.", "Franz Kafka"],
  ];
  function initQuotes() {
    const fig = $(".quote"), text = $("#quote-text"), by = $("#quote-by");
    const favourites = ["Friedrich Nietzsche", "Fyodor Dostoevsky", "Franz Kafka"];
    const deck = quotes.flatMap((q) => (favourites.includes(q[1]) ? [q, q] : [q]))
      .sort(() => Math.random() - 0.5)
      .filter((q, k, a) => k === 0 || q !== a[k - 1]);
    let i = 0;
    const show = () => {
      fig.classList.remove("show");
      setTimeout(() => {
        [text.textContent, by.textContent] = [`“${deck[i][0]}”`, deck[i][1]];
        fig.classList.add("show");
        i = (i + 1) % deck.length;
      }, reducedMotion ? 0 : 900);
    };
    show();
    if (!reducedMotion) setInterval(show, 9000);
  }

  // ---------- Cursor glow ----------
  function initCursorGlow() {
    const glow = $(".cursor-glow");
    if (reducedMotion || !window.matchMedia("(hover: hover)").matches) return;
    let x = 0, y = 0, gx = 0, gy = 0;
    window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; glow.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", () => glow.classList.remove("on"));
    (function follow() {
      gx += (x - gx) * 0.15; gy += (y - gy) * 0.15;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(follow);
    })();
  }

  // ---------- Highlight the nav link of the section in view ----------
  function initNavSpy() {
    const links = new Map([...document.querySelectorAll(".nav nav a")].map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        links.forEach((a) => a.classList.remove("active"));
        const link = links.get(en.target.id);
        if (link) link.classList.add("active");
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
  }

  // ---------- "Decrypting" scramble on the classified project card ----------
  function initRedacted() {
    if (reducedMotion) return;
    const glyphs = "█▓▒░<>/\\#$%&@01";
    document.querySelectorAll(".redacted").forEach((el) => {
      const len = el.dataset.text.length;
      setInterval(() => {
        el.textContent = Array.from({ length: len }, (_, k) => (el.dataset.text[k] === " " ? " " : glyphs[Math.floor(Math.random() * glyphs.length)])).join("");
      }, 120);
    });
  }

  // ---------- Konami code easter egg ----------
  function initKonami() {
    const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let pos = 0;
    document.addEventListener("keydown", (e) => {
      pos = e.key === code[pos] ? pos + 1 : (e.key === code[0] ? 1 : 0);
      if (pos < code.length) return;
      pos = 0;
      document.body.classList.add("party");
      const emojis = ["🚀", "☸️", "🐳", "🐛", "⚡", "🎉", "🐧"];
      for (let i = 0; i < 60; i++) {
        const s = document.createElement("span");
        s.className = "confetti";
        s.textContent = emojis[i % emojis.length];
        s.style.left = Math.random() * 100 + "vw";
        s.style.animationDuration = 2 + Math.random() * 3 + "s";
        s.style.animationDelay = Math.random() * 0.8 + "s";
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 6000);
      }
      setTimeout(() => document.body.classList.remove("party"), 6000);
    });
  }

  renderSkills();
  renderProjects();
  initBackground();
  initTyped();
  initReveal();
  initTilt();
  initResume();
  initTerminal();
  initGame();
  initLoop();
  initLightsOut();
  initKonami();
  initRedacted();
  initQuotes();
  initCursorGlow();
  initNavSpy();
})();
