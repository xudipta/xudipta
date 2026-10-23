(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel) => document.querySelector(sel);

  // ---------- Content (edit here) ----------
  const GITHUB_USER = "xudipta";

  const roles = [
    "cloud & infrastructure engineer",
    "Kubernetes wrangler",
    "system designer (HLD + LLD)",
    "automation enthusiast",
    "professional bug starer",
  ];

  const skills = {
    "Languages": ["Go", "Python", "Java", "C++", "Shell", "PowerShell"],
    "Cloud & DevOps": ["Kubernetes", "Docker", "Helm", "Terraform", "AWS", "GitHub Actions"],
    "Foundations": ["Linux", "Networking", "HLD", "LLD", "DSA"],
  };

  const projects = [
    { name: "cookbook", desc: "CI-validated notes on Kubernetes, Docker, Linux, Terraform, CI/CD, Agent Skills and MCP. Every note ships with a runnable, automatically checked example.", tags: ["Python", "Shell", "GitHub Actions"] },
    { name: "prep", desc: "Preparation and practice work in Go.", tags: ["Go"] },
    { name: "LLD", desc: "Low-level design exercises and patterns.", tags: ["Java", "OOP"] },
    { name: "dsaRepo", desc: "Data structures and algorithms practice.", tags: ["C++"] },
    { name: "scripts", desc: "General-purpose automation scripts.", tags: ["PowerShell"] },
    { name: "springbootCRUD", desc: "Spring Boot CRUD service.", tags: ["Java", "Spring Boot"] },
    { name: "HtmlToPdf", desc: "HTML to PDF conversion using different approaches.", tags: ["Java"] },
  ];

  // ---------- Background: animated "cluster" network ----------
  function initBackground() {
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
    const root = $("#skill-groups");
    let delay = 0;
    for (const [group, items] of Object.entries(skills)) {
      const div = document.createElement("div");
      div.className = "skill-group";
      div.innerHTML = `<h4>// ${group}</h4><div class="chips"></div>`;
      const chips = div.querySelector(".chips");
      for (const s of items) {
        const c = document.createElement("span");
        c.className = "chip";
        c.textContent = s;
        c.style.transitionDelay = `${(delay += 40)}ms`;
        c.addEventListener("mouseleave", () => (c.style.transitionDelay = "0ms"));
        chips.appendChild(c);
      }
      root.appendChild(div);
    }
  }

  function renderProjects() {
    const grid = $("#project-grid");
    for (const p of projects) {
      const a = document.createElement("a");
      a.className = "card project tilt";
      a.href = `https://github.com/${GITHUB_USER}/${p.name}`;
      a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = `
        <div class="top"><h4>📁 ${p.name}</h4><span class="stars" data-repo="${p.name}"></span></div>
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
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`)
      .then((r) => (r.ok ? r.json() : []))
      .then((repos) => {
        for (const repo of repos) {
          const el = document.querySelector(`.stars[data-repo="${repo.name}"]`);
          if (el && repo.stargazers_count > 0) el.textContent = `★ ${repo.stargazers_count}`;
        }
      })
      .catch(() => {});
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
        "  <span class='hl'>skills</span>      the tech playground",
        "  <span class='hl'>projects</span>    things I've built",
        "  <span class='hl'>resume</span>      jump to the resume",
        "  <span class='hl'>game</span>        squash some bugs",
        "  <span class='hl'>kubectl</span>     try: kubectl get pods",
        "  <span class='hl'>github</span>      open my GitHub",
        "  <span class='hl'>clear</span>       clear the screen",
        "  ...and a few hidden ones 👀",
      ].join("\n"),
      about: () => "Sudipta: full-time code wrangler, part-time philosopher.\nCloud & infra, system design, automation. Doesn't quit until the problem gives up first.",
      whoami: () => "sudipta",
      skills: () => Object.entries(skills).map(([g, s]) => `<span class='hl'>${g}</span>: ${s.join(", ")}`).join("\n"),
      projects: () => projects.map((p) => `📁 <a href="https://github.com/${GITHUB_USER}/${p.name}" target="_blank" rel="noopener">${p.name}</a>  ${p.desc}`).join("\n"),
      ls: () => projects.map((p) => p.name + "/").join("  ") + "  README.md",
      "cat": (args) => args[0] && args[0].toLowerCase() === "readme.md"
        ? "# Hey there, I'm Sudipta 🚀\nWriting code that doesn't crash... eventually."
        : "cat: missing or unknown file. Try: cat README.md",
      resume: () => { location.hash = "#resume"; return "Opening resume..."; },
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
  initKonami();
})();
