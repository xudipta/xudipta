// Chaos Monkey: a toy Kubernetes cluster that heals itself.
// Click pods to kill them, take down whole nodes, or spike traffic, and watch the
// ReplicaSet controller, scheduler and autoscaler put things back together.
(() => {
  "use strict";

  const root = document.getElementById("k8s");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const nodesEl = $("#k8s-nodes"), pendingEl = $("#k8s-pending"), logEl = $("#k8s-log"), spark = $("#k8s-spark");
  const sctx = spark.getContext("2d");

  const APPS = {
    web: { replicas: 4, base: 4, color: "web" },
    api: { replicas: 3, base: 3, color: "api" },
    cache: { replicas: 2, base: 2, color: "cache" },
  };
  const NODE_CAP = 8;
  const T = { pending: 500, creating: 1100, terminating: 700, nodeDown: 1400, nodeBack: 9000 };

  let nodes, pods, stats, history, events, hpaUntil, startedAt;
  const rid = () => Math.random().toString(36).slice(2, 7);
  const hash = { web: "7f9c4d", api: "5b8d7c", cache: "6c4f2a" };

  function reset() {
    nodes = ["node-1", "node-2", "node-3"].map((name) => ({ name, ready: true, downAt: 0, el: null }));
    pods = [];
    stats = { kills: 0, healed: 0, nodeKills: 0, minAvail: 100 };
    history = [];
    events = [];
    hpaUntil = 0;
    startedAt = performance.now();
    for (const a of Object.keys(APPS)) APPS[a].replicas = APPS[a].base;
    // Start with a healthy, already-running cluster.
    for (const [app, cfg] of Object.entries(APPS)) {
      for (let i = 0; i < cfg.replicas; i++) {
        const p = newPod(app);
        p.node = pickNode().name; p.state = "Running";
        pods.push(p);
      }
    }
    nodesEl.innerHTML = "";
    for (const n of nodes) nodesEl.appendChild(nodeEl(n));
    log("Normal", "ClusterReady", "cluster/portfolio", "3 nodes Ready, 9 pods Running");
    render();
  }

  function newPod(app) {
    return { id: `${app}-${hash[app]}-${rid()}`, app, node: null, state: "Pending", t: performance.now() };
  }

  function pickNode() {
    const ready = nodes.filter((n) => n.ready);
    if (!ready.length) return null;
    const load = (n) => pods.filter((p) => p.node === n.name && p.state !== "Terminating").length;
    const best = ready.sort((a, b) => load(a) - load(b))[0];
    return load(best) < NODE_CAP ? best : null;
  }

  function log(type, reason, obj, msg) {
    const s = ((performance.now() - startedAt) / 1000).toFixed(1).padStart(5);
    events.unshift(`<span class="t">${s}s</span> <span class="${type === "Warning" ? "warn" : "ok"}">${type.padEnd(7)}</span> <b>${reason.padEnd(17)}</b> ${obj}  <span class="m">${msg}</span>`);
    events.length = Math.min(events.length, 9);
    logEl.innerHTML = events.join("\n");
  }

  // ---------- Actions ----------
  function killPod(id) {
    const p = pods.find((x) => x.id === id);
    if (!p || p.state === "Terminating") return;
    p.state = "Terminating"; p.t = performance.now();
    stats.kills++;
    log("Normal", "Killing", `pod/${p.id}`, "Stopping container (chaos monkey 🐒)");
  }

  function killNode(name) {
    const n = nodes.find((x) => x.name === name);
    if (!n || !n.ready) return;
    n.ready = false; n.downAt = performance.now();
    stats.nodeKills++;
    log("Warning", "NodeNotReady", `node/${n.name}`, "Kubelet stopped posting node status");
  }

  function chaos() {
    const alive = pods.filter((p) => p.state === "Running");
    for (let i = 0; i < 5 && alive.length; i++) killPod(alive.splice(Math.floor(Math.random() * alive.length), 1)[0].id);
  }

  function spike() {
    APPS.web.replicas = 8;
    hpaUntil = performance.now() + 12000;
    log("Normal", "SuccessfulRescale", "hpa/web", "New size: 8; reason: cpu above target");
    $("#k8s-spike").disabled = true;
  }

  // ---------- Control loop (ReplicaSet controller + scheduler + kubelet + node lifecycle) ----------
  function reconcile() {
    const now = performance.now();

    for (const n of nodes) {
      if (!n.ready && n.downAt && now - n.downAt > T.nodeDown && !n.evicted) {
        n.evicted = true;
        for (const p of pods.filter((p) => p.node === n.name && p.state !== "Terminating")) {
          p.state = "Terminating"; p.t = now;
          log("Warning", "TaintManagerEviction", `pod/${p.id}`, `Evicting from ${n.name}`);
        }
      }
      if (!n.ready && now - n.downAt > T.nodeBack) {
        n.ready = true; n.evicted = false;
        log("Normal", "NodeReady", `node/${n.name}`, "Back and Ready; new pods can land here (running pods aren't moved back)");
      }
    }

    if (hpaUntil && now > hpaUntil) {
      hpaUntil = 0; APPS.web.replicas = APPS.web.base;
      log("Normal", "SuccessfulRescale", "hpa/web", "New size: 4; reason: all metrics below target");
      $("#k8s-spike").disabled = false;
    }

    for (const p of pods) {
      const age = now - p.t;
      if (p.state === "Pending" && !p.node) {
        const n = pickNode();
        if (n && age > T.pending) { p.node = n.name; p.state = "ContainerCreating"; p.t = now; log("Normal", "Scheduled", `pod/${p.id}`, `Assigned to ${n.name}`); }
      } else if (p.state === "ContainerCreating" && age > T.creating) {
        p.state = "Running"; p.t = now;
        if (p.replacement) stats.healed++;
        log("Normal", "Started", `pod/${p.id}`, "Container started");
      } else if (p.state === "Terminating" && age > T.terminating) {
        p.gone = true;
      }
    }
    pods = pods.filter((p) => !p.gone);

    for (const [app, cfg] of Object.entries(APPS)) {
      const live = pods.filter((p) => p.app === app && p.state !== "Terminating");
      if (live.length < cfg.replicas) {
        for (let i = live.length; i < cfg.replicas; i++) {
          const p = newPod(app); p.replacement = i < cfg.base; pods.push(p);
          log("Normal", "SuccessfulCreate", `replicaset/${app}-${hash[app]}`, `Created pod: ${p.id}`);
        }
      } else if (live.length > cfg.replicas) {
        live.slice(cfg.replicas).forEach((p) => { p.state = "Terminating"; p.t = now; });
        log("Normal", "SuccessfulDelete", `replicaset/${app}-${hash[app]}`, `Scaled down to ${cfg.replicas}`);
      }
    }
  }

  // Availability = the worst service's share of Running pods, against its base replica count.
  function availability() {
    let worst = 1;
    for (const [app, cfg] of Object.entries(APPS)) {
      const running = pods.filter((p) => p.app === app && p.state === "Running" && nodes.find((n) => n.name === p.node).ready).length;
      worst = Math.min(worst, Math.min(1, running / cfg.base));
    }
    return Math.round(worst * 100);
  }

  // ---------- Rendering ----------
  function nodeEl(n) {
    const el = document.createElement("div");
    el.className = "k-node";
    el.innerHTML = `<div class="k-node-head"><span class="k-node-name">🖥️ ${n.name}</span><span class="k-node-status"></span>
      <button class="k-node-kill" type="button" title="Take this node down">⏻ kill node</button></div>
      <div class="k-cpu"><i></i></div><div class="k-pods"></div>`;
    el.querySelector(".k-node-kill").addEventListener("click", () => killNode(n.name));
    n.el = el;
    return el;
  }

  const podEls = new Map();
  function podEl(p) {
    let el = podEls.get(p.id);
    if (!el) {
      el = document.createElement("button");
      el.type = "button";
      el.className = `k-pod ${APPS[p.app].color}`;
      el.innerHTML = `<span class="k-pod-app">${p.app}</span><span class="k-pod-id">${p.id.slice(-5)}</span>`;
      el.addEventListener("click", () => killPod(p.id));
      podEls.set(p.id, el);
    }
    el.dataset.state = p.state;
    el.title = `${p.id}\n${p.state}${p.state === "Running" ? " · click to kill" : ""}`;
    el.setAttribute("aria-label", `Pod ${p.id}, ${p.state}`);
    return el;
  }

  function place(container, list) {
    const want = list.map(podEl);
    [...container.children].forEach((c) => { if (!want.includes(c)) c.remove(); });
    want.forEach((el, i) => { if (container.children[i] !== el) container.insertBefore(el, container.children[i] || null); });
  }

  function render() {
    for (const n of nodes) {
      const mine = pods.filter((p) => p.node === n.name);
      n.el.classList.toggle("down", !n.ready);
      n.el.querySelector(".k-node-status").textContent = n.ready ? "Ready" : "NotReady";
      n.el.querySelector(".k-node-kill").disabled = !n.ready;
      n.el.querySelector(".k-cpu i").style.width = `${Math.min(100, (mine.filter((p) => p.state === "Running").length / NODE_CAP) * 100 * (hpaUntil ? 1.35 : 1))}%`;
      place(n.el.querySelector(".k-pods"), mine);
    }
    place(pendingEl, pods.filter((p) => !p.node));
    $(".k-pending-wrap").classList.toggle("has", pods.some((p) => !p.node));
    for (const id of [...podEls.keys()]) if (!pods.some((p) => p.id === id)) podEls.delete(id);

    const a = availability();
    stats.minAvail = Math.min(stats.minAvail, a);
    const running = pods.filter((p) => p.state === "Running").length;
    const desired = Object.values(APPS).reduce((s, c) => s + c.replicas, 0);
    $("#k8s-avail").textContent = `${a}%`;
    $("#k8s-avail").className = a >= 90 ? "good" : a >= 60 ? "warn" : "bad";
    $("#k8s-running").textContent = `${running}/${desired}`;
    $("#k8s-kills").textContent = stats.kills + stats.nodeKills;
    $("#k8s-healed").textContent = stats.healed;
    $("#k8s-min").textContent = `${stats.minAvail}%`;
    drawSpark(a);
  }

  function drawSpark(a) {
    history.push(a); if (history.length > 120) history.shift();
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = spark.clientWidth, h = spark.clientHeight;
    if (spark.width !== w * dpr) { spark.width = w * dpr; spark.height = h * dpr; }
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.clearRect(0, 0, w, h);
    sctx.strokeStyle = "rgba(148,163,184,0.15)"; sctx.setLineDash([3, 4]);
    sctx.beginPath(); sctx.moveTo(0, h * 0.1); sctx.lineTo(w, h * 0.1); sctx.stroke(); sctx.setLineDash([]);
    const grad = sctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(34,211,238,0.35)"); grad.addColorStop(1, "rgba(34,211,238,0)");
    sctx.beginPath();
    history.forEach((v, i) => { const x = (i / 119) * w, y = h - (v / 100) * h * 0.9; i ? sctx.lineTo(x, y) : sctx.moveTo(x, y); });
    sctx.strokeStyle = a >= 90 ? "#22d3ee" : a >= 60 ? "#fbbf77" : "#f87171"; sctx.lineWidth = 1.5; sctx.stroke();
    sctx.lineTo(((history.length - 1) / 119) * w, h); sctx.lineTo(0, h); sctx.fillStyle = grad; sctx.fill();
  }

  // ---------- Wire up ----------
  $("#k8s-chaos").addEventListener("click", chaos);
  $("#k8s-spike").addEventListener("click", spike);
  $("#k8s-reset").addEventListener("click", () => { $("#k8s-spike").disabled = false; podEls.clear(); reset(); });

  reset();
  let timer = null;
  const run = (on) => { clearInterval(timer); timer = on ? setInterval(() => { reconcile(); render(); }, 250) : null; };
  // Only run the control loop while the section is visible.
  new IntersectionObserver(([en]) => run(en.isIntersecting)).observe(root);
})();
