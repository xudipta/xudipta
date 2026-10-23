// "Year Orbit": the last year of GitHub contributions drawn as a rotating radial clock.
// Seven rings (one per weekday), one dot per day, brighter and bigger = more contributions.
// Live data comes from a public contributions API; if it fails, the static graph image is shown instead.
(() => {
  "use strict";

  const USER = "xudipta";
  const API = `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`;
  const root = document.getElementById("activity");
  if (!root) return;
  const cv = document.getElementById("orbit"), ctx = cv.getContext("2d");
  const wrap = root.querySelector(".orbit-wrap"), fallback = root.querySelector(".activity-fallback");
  const pills = document.getElementById("orbit-pills");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tip = document.createElement("div");
  tip.className = "orbit-tip";
  document.body.appendChild(tip);

  function showFallback() {
    wrap.hidden = true;
    fallback.hidden = false;
    fallback.onerror = () => { root.hidden = true; };
  }

  fetch(API)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data) => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const days = (data.contributions || [])
        .map((c) => {
          const [y, m, d] = c.date.split("-").map(Number);
          return { date: new Date(y, m - 1, d), count: c.count, level: c.level };
        })
        .filter((d) => d.date <= today)
        .sort((a, b) => a.date - b.date)
        .slice(-371);
      if (days.length < 30) throw new Error("not enough data");
      render(days);
    })
    .catch(showFallback);

  function render(days) {
    const level = (d) => (d.level != null ? d.level : d.count === 0 ? 0 : d.count < 3 ? 1 : d.count < 6 ? 2 : d.count < 10 ? 3 : 4);
    const total = days.reduce((s, d) => s + d.count, 0);
    const active = days.filter((d) => d.count).length;
    let longest = 0, run = 0;
    for (const d of days) { run = d.count ? run + 1 : 0; longest = Math.max(longest, run); }
    // Today often has no commits yet, so the current streak may start from yesterday.
    let current = 0, i = days.length - 1;
    if (i >= 0 && !days[i].count) i--;
    for (; i >= 0 && days[i].count; i--) current++;
    pills.innerHTML = [
      [total.toLocaleString(), "contributions"],
      [active, "active days"],
      [`${longest}-day`, "best streak"],
      current ? [`${current}-day`, "current streak"] : null,
    ].filter(Boolean).map(([v, k]) => `<span class="pill"><b>${v}</b> ${k}</span>`).join("");
    cv.setAttribute("aria-label", `${total} GitHub contributions over the last year, ${active} active days, longest streak ${longest} days.`);

    const fmt = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const t0 = days[0].date.getTime(), span = days[days.length - 1].date.getTime() - t0 || 1;

    let S = 0, dpr = 1, rot = 0, mouse = null, hover = null, visible = false, start = null, raf = 0;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      S = cv.clientWidth;
      cv.width = S * dpr; cv.height = S * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw(t) {
      if (start == null) start = t;
      const c = S / 2, R0 = S * 0.2, step = S * 0.035;
      const prog = reduced ? 1 : Math.min(1, (t - start) / 2200);
      if (!reduced) rot += 0.0008;
      ctx.clearRect(0, 0, S, S);

      for (let k = 0; k < 7; k++) {
        ctx.beginPath(); ctx.arc(c, c, R0 + k * step, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(148,163,184,0.06)"; ctx.stroke();
      }

      // Month spokes, with each label sitting in the middle of its month.
      const first = days[0].date;
      for (let m = 1; m <= 12; m++) {
        const d = new Date(first.getFullYear(), first.getMonth() + m, 1);
        if (d.getTime() > t0 + span) break;
        const a = ((d - t0) / span) * Math.PI * 2 + rot - Math.PI / 2;
        ctx.strokeStyle = "rgba(34,211,238,0.08)";
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * (R0 - 10), c + Math.sin(a) * (R0 - 10));
        ctx.lineTo(c + Math.cos(a) * (R0 + 7 * step), c + Math.sin(a) * (R0 + 7 * step));
        ctx.stroke();
        const la = a + 0.26;
        ctx.save();
        ctx.translate(c + Math.cos(la) * (R0 + 7.9 * step), c + Math.sin(la) * (R0 + 7.9 * step));
        ctx.rotate(la + Math.PI / 2);
        ctx.fillStyle = "rgba(143,155,179,0.8)";
        ctx.font = `500 ${Math.max(9, S * 0.02)}px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(months[d.getMonth()], 0, 0);
        ctx.restore();
      }

      hover = null;
      days.forEach((d, i) => {
        if (i / days.length > prog) return;
        const a = ((d.date - t0) / span) * Math.PI * 2 + rot - Math.PI / 2, r = R0 + d.date.getDay() * step;
        const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r, lv = level(d);
        const size = (lv ? 1.4 + lv * 1.05 : 1.1) * Math.max(0.6, Math.min(1, S / 520));
        if (mouse && Math.hypot(mouse[0] - x, mouse[1] - y) < Math.max(size + 2, 6)) hover = { d, x, y, size };
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = lv ? (lv === 4 ? "#c4b5fd" : `rgba(34,211,238,${0.3 + lv * 0.18})`) : "rgba(148,163,184,0.15)";
        ctx.shadowBlur = lv >= 3 ? 10 : 0;
        ctx.shadowColor = lv === 4 ? "#a78bfa" : "#22d3ee";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // "Today" hand.
      const aT = Math.PI * 2 + rot - Math.PI / 2, len = R0 + 6.6 * step;
      const grad = ctx.createLinearGradient(c, c, c + Math.cos(aT) * len, c + Math.sin(aT) * len);
      grad.addColorStop(0, "rgba(251,191,119,0)"); grad.addColorStop(1, "rgba(251,191,119,0.9)");
      ctx.strokeStyle = grad; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(c + Math.cos(aT) * len, c + Math.sin(aT) * len); ctx.stroke();
      ctx.lineWidth = 1;

      ctx.textAlign = "center";
      ctx.fillStyle = "#e8eaf2";
      ctx.font = `800 ${S * 0.085}px Inter, system-ui, sans-serif`;
      ctx.fillText(Math.round(total * prog).toLocaleString(), c, c + S * 0.012);
      ctx.fillStyle = "#8f9bb3";
      ctx.font = `500 ${S * 0.024}px "JetBrains Mono", monospace`;
      ctx.fillText("CONTRIBUTIONS", c, c + S * 0.055);

      if (hover) {
        ctx.beginPath(); ctx.arc(hover.x, hover.y, hover.size + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#fff"; ctx.stroke();
      }
      if (visible && !reduced) raf = requestAnimationFrame(draw);
    }

    function point(e) {
      const r = cv.getBoundingClientRect();
      mouse = [e.clientX - r.left, e.clientY - r.top];
      if (reduced || !visible) draw(performance.now());
      // Read `hover` after the next frame has hit-tested the pointer.
      requestAnimationFrame(() => {
        if (!hover) { tip.classList.remove("on"); return; }
        const n = hover.d.count;
        tip.innerHTML = `<b>${n}</b> contribution${n === 1 ? "" : "s"} · ${fmt(hover.d.date)}`;
        tip.style.left = `${Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8)}px`;
        tip.style.top = `${e.clientY + 14}px`;
        tip.classList.add("on");
      });
    }
    cv.addEventListener("pointermove", point);
    cv.addEventListener("pointerdown", point);
    cv.addEventListener("pointerleave", () => { mouse = null; tip.classList.remove("on"); });

    // Only animate while the orbit is on screen.
    let revealed = false;
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !revealed) { revealed = true; start = null; } // play the intro when first seen
      cancelAnimationFrame(raf);
      if (visible || start == null) raf = requestAnimationFrame(draw);
    }).observe(cv);
  }
})();
