// GitHub contributions: a year grid, today's number and a one-line readout for the day you point at.
// Live counts come from a public contributions API; if it fails, the static graph image is shown instead.
(() => {
  "use strict";

  const USER = "xudipta";
  const API = `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`;
  const root = document.getElementById("activity");
  if (!root) return;
  const act = document.getElementById("act"), fallback = root.querySelector(".activity-fallback");
  const hmEl = document.getElementById("hm"), scroller = document.getElementById("hm-scroll");
  const statsEl = document.getElementById("act-stats"), readout = document.getElementById("act-readout");

  const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const LEVEL = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4);
  const FILL = ["rgba(148,163,184,.12)", "rgba(34,211,238,.38)", "rgba(34,211,238,.62)", "#22d3ee", "#c4b5fd"];
  const fmtLong = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const fmtShort = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  function showFallback() {
    act.hidden = true;
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
          return { date: new Date(y, m - 1, d), count: c.count };
        })
        .filter((d) => d.date <= today)
        .sort((a, b) => a.date - b.date)
        .slice(-365);
      if (days.length < 30) throw new Error("not enough data");
      render(days, today);
    })
    .catch(showFallback);

  function render(days, today) {
    const total = days.reduce((s, d) => s + d.count, 0);
    const active = days.filter((d) => d.count).length;
    let best = 0, run = 0;
    for (const d of days) { run = d.count ? run + 1 : 0; best = Math.max(best, run); }
    // A streak is still alive if today has no commits yet but yesterday did.
    let current = 0, i = days.length - 1;
    if (i >= 0 && !days[i].count) i--;
    for (; i >= 0 && days[i].count; i--) current++;

    const last = days[days.length - 1];
    const isToday = last.date.getTime() === today.getTime();

    statsEl.innerHTML =
      `<span><b>${total.toLocaleString()}</b>contributions</span>` +
      `<span><b>${active}</b>active days</span>` +
      `<span><b>${best}</b>day best streak</span>` +
      (current ? `<span><b>${current}</b>day current streak</span>` : "");

    // Grid: one column per week (Sunday to Saturday), one row per weekday.
    const C = 14, G = 3, L = 30, T = 18;
    const sun0 = new Date(days[0].date); sun0.setDate(sun0.getDate() - sun0.getDay());
    const col = (d) => Math.floor(Math.round((d - sun0) / 864e5) / 7);
    const cols = col(last.date) + 1, W = L + cols * (C + G), H = T + 7 * (C + G);
    let svg = `<svg class="hm" viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="${total} GitHub contributions over the last year, ${active} active days, longest streak ${best} days. Use the arrow keys to move between days.">`;
    [1, 3, 5].forEach((k) => { svg += `<text x="6" y="${T + k * (C + G) + C - 2}">${DN[k]}</text>`; });
    let lastMonth = -1;
    days.forEach((d) => {
      if (d.date.getMonth() !== lastMonth && d.date.getDate() <= 7) {
        lastMonth = d.date.getMonth();
        const x = L + col(d.date) * (C + G);
        if (x < W - 28) svg += `<text x="${x}" y="10">${MN[lastMonth]}</text>`;
      }
    });
    days.forEach((d, idx) => {
      const l = LEVEL(d.count), c = col(d.date), x = L + c * (C + G), y = T + d.date.getDay() * (C + G);
      const glow = l === 4 ? ' style="filter:drop-shadow(0 0 4px rgba(167,139,250,.8))"' : l === 3 ? ' style="filter:drop-shadow(0 0 3px rgba(34,211,238,.6))"' : "";
      const cls = "cell" + (idx === days.length - 1 && isToday ? " today" : "");
      svg += `<rect class="${cls}" data-i="${idx}" style="--c:${c}" x="${x}" y="${y}" width="${C}" height="${C}" rx="3.5" fill="${FILL[l]}"${glow}/>`;
    });
    hmEl.innerHTML = svg + "</svg>";
    const hm = hmEl.firstChild, cells = hm.querySelectorAll(".cell");

    let sel = days.length - 1;
    const say = (idx) => {
      const d = days[idx], tag = isToday && idx === days.length - 1 ? " · today" : "";
      readout.innerHTML = d.count
        ? `<b>${d.count}</b> contribution${d.count === 1 ? "" : "s"} · ${fmtLong(d.date)}${tag}`
        : `No contributions · ${fmtLong(d.date)}${tag}`;
    };
    const pick = (idx) => {
      sel = Math.max(0, Math.min(days.length - 1, idx));
      cells.forEach((c) => c.classList.remove("sel"));
      cells[sel].classList.add("sel");
      say(sel);
    };
    pick(sel);
    cells.forEach((c) => {
      c.addEventListener("click", () => pick(+c.dataset.i));
      c.addEventListener("pointerover", (e) => { if (e.pointerType === "mouse") say(+c.dataset.i); });
    });
    hm.addEventListener("pointerleave", () => say(sel));
    hm.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[e.key];
      if (!step) return;
      e.preventDefault();
      pick(sel + step);
    });

    // Start scrolled to today; fade the left edge only if there is something to scroll.
    scroller.scrollLeft = scroller.scrollWidth;
    if (scroller.scrollWidth <= scroller.clientWidth + 2) scroller.classList.add("nofade");

    // Fill the grid in when it first scrolls into view.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { hm.classList.add("in"); io.disconnect(); } }, { threshold: 0.15 });
      io.observe(hm);
    } else hm.classList.add("in");
  }
})();
