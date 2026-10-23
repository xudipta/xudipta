// "From chaos to order": a WebGL particle field that morphs between shapes as you scroll.
// Sphere (golden ratio) -> neural network -> torus knot (the endless loop) -> Möbius strip.
// Reacts to pointer/touch (tilt + ripple), clicks/taps (shockwave) and device tilt.
// Falls back to the 2D canvas in main.js when WebGL is unavailable or motion is reduced.
(() => {
  "use strict";

  const canvas = document.getElementById("scene");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, powerPreference: "high-performance" });
  if (!gl) return;
  document.documentElement.classList.add("has-3d");

  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  const N = small ? 3200 : 7000;
  const STARS = small ? 350 : 800;
  const TAU = Math.PI * 2;
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const rand = Math.random;
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

  // ---------- Shapes (particle i maps to the same index in every shape, so morphs flow) ----------
  const seeds = new Float32Array(N).map(() => rand());

  function sphere() {
    const out = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), th = i * GOLDEN, s = 1.75 * (1 + gauss() * 0.012);
      out[i * 3] = Math.cos(th) * r * s; out[i * 3 + 1] = y * s; out[i * 3 + 2] = Math.sin(th) * r * s;
    }
    return out;
  }

  let edgeVerts;
  function network() {
    const nodes = [], M = 34;
    for (let k = 0; k < M; k++) {
      const y = 1 - (2 * (k + 0.5)) / M, r = Math.sqrt(1 - y * y), th = k * GOLDEN, s = 1.1 + rand() * 0.9;
      nodes.push([Math.cos(th) * r * s, y * s, Math.sin(th) * r * s]);
    }
    nodes.push([0, 0, 0]);
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    const edges = [];
    nodes.forEach((a, i) => {
      nodes.map((b, j) => [j, d2(a, b)]).filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, 3)
        .forEach(([j]) => { if (!edges.some(([p, q]) => (p === j && q === i))) edges.push([i, j]); });
    });
    edgeVerts = new Float32Array(edges.flatMap(([i, j]) => [...nodes[i], ...nodes[j]]));
    const out = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      let x, y, z;
      if (i % 3 === 0) {
        const n = nodes[Math.floor(i / 3) % nodes.length];
        x = n[0] + gauss() * 0.07; y = n[1] + gauss() * 0.07; z = n[2] + gauss() * 0.07;
      } else {
        const [p, q] = edges[i % edges.length], a = nodes[p], b = nodes[q], t = rand();
        x = a[0] + (b[0] - a[0]) * t + gauss() * 0.015;
        y = a[1] + (b[1] - a[1]) * t + gauss() * 0.015;
        z = a[2] + (b[2] - a[2]) * t + gauss() * 0.015;
      }
      out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
    }
    return out;
  }

  function torusKnot() {
    const out = new Float32Array(N * 3), P = 2, Q = 3, s = 0.6;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * TAU, r = 2 + Math.cos(Q * t);
      const th = rand() * TAU, ph = Math.acos(2 * rand() - 1), tube = 0.2 * Math.sqrt(rand());
      out[i * 3] = (r * Math.cos(P * t)) * s + Math.sin(ph) * Math.cos(th) * tube;
      out[i * 3 + 1] = (r * Math.sin(P * t)) * s + Math.sin(ph) * Math.sin(th) * tube;
      out[i * 3 + 2] = -Math.sin(Q * t) * s + Math.cos(ph) * tube;
    }
    return out;
  }

  function mobius() {
    const out = new Float32Array(N * 3), s = 1.65, tilt = 0.9, ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let i = 0; i < N; i++) {
      const u = (i / N) * TAU, v = (rand() * 2 - 1) * 0.55;
      const x = (1 + v * Math.cos(u / 2)) * Math.cos(u), y = (1 + v * Math.cos(u / 2)) * Math.sin(u), z = v * Math.sin(u / 2);
      out[i * 3] = x * s; out[i * 3 + 1] = (y * ct - z * st) * s; out[i * 3 + 2] = (y * st + z * ct) * s;
    }
    return out;
  }

  const shapes = [sphere(), network(), torusKnot(), mobius()];
  const NETWORK = 1;

  // Section id -> shape index.
  const stageFor = { home: 0, about: 0, solver: 1, skills: 2, oss: 2, projects: 2, terminal: 2, game: 2, k8s: 2, resume: 3 };
  const sections = Object.keys(stageFor).map((id) => document.getElementById(id)).filter(Boolean);

  // ---------- Particle state ----------
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) pos[i] = (rand() - 0.5) * 12; // start as chaos, settle into order
  let from = pos.slice(), to = shapes[0], stage = 0, morphStart = performance.now() / 1000;
  const MORPH = 2.4;

  function setStage(s, now) {
    if (s === stage) return;
    stage = s; from = pos.slice(); to = shapes[s]; morphStart = now;
  }

  const stars = new Float32Array(STARS * 3), starSeeds = new Float32Array(STARS).map(() => rand());
  for (let i = 0; i < STARS; i++) {
    const th = rand() * TAU, ph = Math.acos(2 * rand() - 1), r = 9 + rand() * 8;
    stars[i * 3] = Math.sin(ph) * Math.cos(th) * r; stars[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * r; stars[i * 3 + 2] = Math.cos(ph) * r;
  }

  // ---------- Input ----------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: 0 };
  const waves = [];
  function setPointer(cx, cy) {
    pointer.tx = (cx / window.innerWidth) * 2 - 1;
    pointer.ty = -((cy / window.innerHeight) * 2 - 1);
    pointer.x = pointer.tx; pointer.y = pointer.ty;
    pointer.active = performance.now() / 1000;
  }
  window.addEventListener("pointermove", (e) => setPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) setPointer(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener("pointerdown", (e) => {
    setPointer(e.clientX, e.clientY);
    if (e.target.closest("a, button, input, canvas#game-canvas, .lo-grid")) return;
    if (waves.length < 4) waves.push({ x: pointer.x, y: pointer.y, t: performance.now() / 1000, c: null });
  }, { passive: true });
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null || performance.now() / 1000 - pointer.active < 3) return;
    pointer.tx = Math.max(-1, Math.min(1, e.gamma / 30));
    pointer.ty = Math.max(-1, Math.min(1, (45 - e.beta) / 30));
  }, { passive: true });

  // ---------- WebGL ----------
  function program(vs, fs) {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    return p;
  }

  const pointProg = program(`
    attribute vec3 aPos; attribute float aSeed;
    uniform mat4 uMVP; uniform float uTime, uSize, uOpacity, uWarm;
    varying vec3 vColor; varying float vAlpha;
    void main() {
      vec4 p = uMVP * vec4(aPos, 1.0);
      gl_Position = p;
      float tw = 0.7 + 0.3 * sin(uTime * 1.3 + aSeed * 40.0);
      gl_PointSize = uSize * (0.6 + aSeed * 1.0) * tw * (7.0 / p.w);
      float h = clamp(aPos.y * 0.28 + 0.5, 0.0, 1.0);
      vColor = mix(vec3(0.13, 0.83, 0.93), vec3(0.66, 0.55, 0.98), h);
      vColor = mix(vColor, vec3(1.0, 0.78, 0.45), step(0.975, aSeed) * uWarm);
      vAlpha = uOpacity * tw * clamp(1.4 - p.w / 10.0, 0.2, 1.0);
    }`, `
    precision mediump float;
    varying vec3 vColor; varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float core = smoothstep(0.18, 0.0, d), halo = smoothstep(0.5, 0.0, d);
      float a = (core * 0.9 + halo * halo * 0.8) * vAlpha;
      gl_FragColor = vec4(vColor * a, a);
    }`);

  const lineProg = program(`
    attribute vec3 aPos; uniform mat4 uMVP;
    void main() { gl_Position = uMVP * vec4(aPos, 1.0); }`, `
    precision mediump float; uniform vec4 uColor;
    void main() { gl_FragColor = vec4(uColor.rgb * uColor.a, uColor.a); }`);

  const loc = (p, n) => gl.getAttribLocation(p, n);
  const uni = (p, n) => gl.getUniformLocation(p, n);
  const P = { pos: loc(pointProg, "aPos"), seed: loc(pointProg, "aSeed"), mvp: uni(pointProg, "uMVP"), time: uni(pointProg, "uTime"),
    size: uni(pointProg, "uSize"), opacity: uni(pointProg, "uOpacity"), warm: uni(pointProg, "uWarm") };
  const L = { pos: loc(lineProg, "aPos"), mvp: uni(lineProg, "uMVP"), color: uni(lineProg, "uColor") };

  function buffer(data, usage = gl.STATIC_DRAW) {
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); return b;
  }
  const posBuf = buffer(pos, gl.DYNAMIC_DRAW), seedBuf = buffer(seeds);
  const starBuf = buffer(stars), starSeedBuf = buffer(starSeeds), edgeBuf = buffer(edgeVerts);

  function attrib(l, buf, size) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0);
  }

  // ---------- Matrices (column-major) ----------
  const FOV = (50 * Math.PI) / 180, CAM_Z = 7;
  let aspect = 1, dpr = 1, proj;
  function perspective() {
    const f = 1 / Math.tan(FOV / 2), near = 0.1, far = 60, nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
    }
    return o;
  }
  // Rotation R = Rx(ax) * Ry(ay), returned as a row-major 3x3 for CPU use.
  function rot(ax, ay) {
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
    return [cy, 0, sy, sx * sy, cx, -sx * cy, -cx * sy, sx, cx * cy];
  }
  function model(R, ox, oy, s) {
    return new Float32Array([R[0] * s, R[3] * s, R[6] * s, 0, R[1] * s, R[4] * s, R[7] * s, 0, R[2] * s, R[5] * s, R[8] * s, 0, ox, oy, 0, 1]);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    canvas.width = Math.round(window.innerWidth * dpr); canvas.height = Math.round(window.innerHeight * dpr);
    aspect = window.innerWidth / window.innerHeight;
    proj = perspective();
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  // ---------- Loop ----------
  let rotY = 0, offX = 0, opacity = 0, scale = 1, netWeight = 0, frame = 0, running = true, lost = false;
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !lost) requestAnimationFrame(tick);
  });

  function currentSection() {
    const mid = window.innerHeight * 0.5;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) return s.id;
    }
    return window.scrollY < 50 ? "home" : null;
  }

  let sectionId = "home";
  function tick(ms) {
    if (!running || lost) return;
    const now = ms / 1000;
    if (frame++ % 8 === 0) {
      const id = currentSection();
      if (id) { sectionId = id; setStage(stageFor[id], now); }
    }

    // Smooth pointer + layout targets.
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
    const hero = sectionId === "home", wide = window.innerWidth > 900;
    offX += ((hero && wide ? 1.9 : 0) - offX) * 0.04;
    opacity += ((hero ? (wide ? 1 : 0.55) : wide ? 0.7 : 0.5) - opacity) * 0.04;
    scale += ((hero ? 1 : 1.15) - scale) * 0.04;
    netWeight += ((stage === NETWORK && now - morphStart > MORPH * 0.6 ? 1 : 0) - netWeight) * 0.03;
    rotY += 0.0018;

    const ay = rotY + pointer.x * 0.55, ax = 0.2 - pointer.y * 0.4;
    const R = rot(ax, ay);
    const camX = pointer.x * 0.25, camY = pointer.y * 0.15;
    const M = model(R, offX, 0, scale);
    const V = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -camX, -camY, -CAM_Z, 1]);
    const MVP = mul(proj, mul(V, M));

    // Pointer ray in the particle field's local space (for the ripple).
    const th = Math.tan(FOV / 2);
    let dx = pointer.x * th * aspect, dy = pointer.y * th, dz = -1;
    const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
    const Ox = (camX - offX) / scale, Oy = camY / scale, Oz = CAM_Z / scale;
    const ox = R[0] * Ox + R[3] * Oy + R[6] * Oz, oy = R[1] * Ox + R[4] * Oy + R[7] * Oz, oz = R[2] * Ox + R[5] * Oy + R[8] * Oz;
    const rx = R[0] * dx + R[3] * dy + R[6] * dz, ry = R[1] * dx + R[4] * dy + R[7] * dz, rz = R[2] * dx + R[5] * dy + R[8] * dz;
    const repel = now - pointer.active < 2.5;

    // Shockwaves start at the ray's closest point to the origin.
    for (const w of waves) if (!w.c) { const t = -(ox * rx + oy * ry + oz * rz); w.c = [ox + rx * t, oy + ry * t, oz + rz * t]; }
    while (waves.length && now - waves[0].t > 1.6) waves.shift();

    const breath = 1 + 0.02 * Math.sin(now * 0.8);
    for (let i = 0; i < N; i++) {
      const k = i * 3, sd = seeds[i];
      let e = (now - morphStart - sd * 0.9) / MORPH;
      e = e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e);
      const swirl = Math.sin(Math.PI * e) * 0.9;
      let tx = (from[k] + (to[k] - from[k]) * e) * breath, ty = (from[k + 1] + (to[k + 1] - from[k + 1]) * e) * breath, tz = (from[k + 2] + (to[k + 2] - from[k + 2]) * e) * breath;
      if (swirl > 0.01) {
        tx += Math.sin(sd * 13 + now * 0.7) * swirl; ty += Math.cos(sd * 7 + now * 0.9) * swirl; tz += Math.sin(sd * 5 + now) * swirl;
      }
      let px = pos[k], py = pos[k + 1], pz = pos[k + 2];
      let vx = vel[k] + (tx - px) * 0.035, vy = vel[k + 1] + (ty - py) * 0.035, vz = vel[k + 2] + (tz - pz) * 0.035;

      if (repel) {
        const wx = px - ox, wy = py - oy, wz = pz - oz, along = wx * rx + wy * ry + wz * rz;
        const qx = wx - rx * along, qy = wy - ry * along, qz = wz - rz * along, d = Math.hypot(qx, qy, qz);
        if (d < 0.6 && d > 1e-4) { const f = ((1 - d / 0.6) ** 2 * 0.03) / d; vx += qx * f; vy += qy * f; vz += qz * f; }
      }
      for (const w of waves) {
        const cx = px - w.c[0], cy = py - w.c[1], cz = pz - w.c[2], d = Math.hypot(cx, cy, cz), ring = (now - w.t) * 3.2;
        if (Math.abs(d - ring) < 0.35 && d > 1e-4) { const f = (0.05 * (1 - (now - w.t) / 1.6)) / d; vx += cx * f; vy += cy * f; vz += cz * f; }
      }
      vx *= 0.86; vy *= 0.86; vz *= 0.86;
      vel[k] = vx; vel[k + 1] = vy; vel[k + 2] = vz;
      pos[k] = px + vx; pos[k + 1] = py + vy; pos[k + 2] = pz + vz;
    }

    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);

    // Stars (slow drift, ignores layout offset).
    gl.useProgram(pointProg);
    const S = model(rot(0.1, now * 0.01), 0, 0, 1);
    gl.uniformMatrix4fv(P.mvp, false, mul(proj, mul(V, S)));
    gl.uniform1f(P.time, now); gl.uniform1f(P.size, 2.2 * dpr); gl.uniform1f(P.opacity, 0.55); gl.uniform1f(P.warm, 0);
    attrib(P.pos, starBuf, 3); attrib(P.seed, starSeedBuf, 1);
    gl.drawArrays(gl.POINTS, 0, STARS);

    // Particle field.
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.uniformMatrix4fv(P.mvp, false, MVP);
    gl.uniform1f(P.size, (small ? 4.6 : 4.4) * dpr); gl.uniform1f(P.opacity, opacity * 0.9); gl.uniform1f(P.warm, 1);
    attrib(P.pos, posBuf, 3); attrib(P.seed, seedBuf, 1);
    gl.drawArrays(gl.POINTS, 0, N);

    // Network synapses fade in on the "problem solver" section.
    if (netWeight > 0.01) {
      gl.disableVertexAttribArray(P.seed);
      gl.useProgram(lineProg);
      gl.uniformMatrix4fv(L.mvp, false, MVP);
      gl.uniform4f(L.color, 0.4, 0.75, 1, 0.3 * netWeight * opacity);
      attrib(L.pos, edgeBuf, 3);
      gl.drawArrays(gl.LINES, 0, edgeVerts.length / 3);
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
