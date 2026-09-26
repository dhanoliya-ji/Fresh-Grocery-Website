import * as THREE from 'three';

// Hero: real cut-out product photos floating in a sunlit 3D space.
// Each item is a plane whose shader fakes volume: the alpha matte is used as a height map,
// so the sun lights one side and shades the other, with a soft rim light.
// Fresh produce also gets procedural water droplets that glint as the light moves.
// A blurred silhouette under each item acts as its contact shadow.
const ITEMS = [
  // [id, category, size, [x, y, z]]: arranged as a loose arc on the right, nothing overlapping the copy
  ['strawberries', 'fruits', 2.3, [3.4, 1.6, 0.8]],
  ['avocados', 'fruits', 2.0, [6.3, 2.5, -1.0]],
  ['oranges', 'fruits', 1.8, [2.0, -1.8, 1.4]],
  ['croissant', 'bakery', 2.3, [5.9, -1.0, 0.6]],
  ['broccoli', 'vegetables', 2.1, [4.2, -3.4, -0.4]],
  ['lemons', 'drinks', 2.0, [8.4, 0.6, -1.6]],
  ['apples', 'fruits', 1.7, [1.2, 2.9, -0.8]],
  ['peppers', 'vegetables', 2.6, [8.6, -2.8, -2.2]],
  ['bananas', 'fruits', 2.2, [8.8, 3.6, -3.2]],
  ['tomatoes', 'vegetables', 1.9, [4.9, 4.1, -2.6]],
  ['blueberries', 'fruits', 1.5, [1.4, -4.0, -1.8]],
  ['eggs', 'dairy', 1.1, [10.8, 1.6, -4.4]],
  ['bagel', 'bakery', 1.7, [11.2, -1.6, -5.0]],
  ['mango', 'fruits', 1.6, [0.5, 0.4, -2.6]],
  ['carrots', 'vegetables', 2.0, [3.3, 0.0, -4.6]],
];
// juice colours for the splash (anything not listed uses the photo's average colour)
const JUICE = { strawberries: '#d9142c', tomatoes: '#e2261b', oranges: '#ff8c00', lemons: '#ffe13a', blueberries: '#4a2a8c', mango: '#ffaa12', apples: '#f4e2a2', peppers: '#e62e1a', broccoli: '#5f9e32', carrots: '#ff7418', avocados: '#9cc257', bananas: '#f6e27a', eggs: '#ffba1f', croissant: '#e2a24a', bagel: '#d4954e' };
const WET = new Set(['strawberries', 'oranges', 'broccoli', 'lemons', 'apples', 'peppers', 'tomatoes', 'blueberries', 'mango', 'carrots', 'avocados']);

const VS = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FS = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uTexel;
uniform vec3 uSun;     // sun direction in the item's screen space
uniform vec3 uTint;    // light colour (warm morning, neutral noon, lamp-lit evening)
uniform float uHover;
uniform float uAlpha;
uniform float uWet;
uniform float uSeed;
varying vec2 vUv;
float a(vec2 o) { return texture2D(uMap, vUv + o).a; }
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.02) discard;
  // height from a blurred alpha: high in the middle of the object, falling to the edges
  vec2 t = uTexel * 9.0;
  float hx = (a(vec2(t.x, 0.0)) + a(vec2(t.x * 2.0, 0.0))) - (a(vec2(-t.x, 0.0)) + a(vec2(-t.x * 2.0, 0.0)));
  float hy = (a(vec2(0.0, t.y)) + a(vec2(0.0, t.y * 2.0))) - (a(vec2(0.0, -t.y)) + a(vec2(0.0, -t.y * 2.0)));
  vec3 n = normalize(vec3(-hx, -hy, 0.9));
  vec3 sun = normalize(uSun);
  float diff = clamp(dot(n, sun), 0.0, 1.0);
  float rim = pow(1.0 - n.z, 2.0);
  vec3 col = c.rgb * (0.78 + 0.42 * diff) + vec3(1.0, 0.93, 0.78) * rim * 0.18;
  // warm sunlight + subtle specular glint for glossy fruit
  vec3 h = normalize(sun + vec3(0.0, 0.0, 1.0));
  col += vec3(1.0, 0.97, 0.9) * pow(clamp(dot(n, h), 0.0, 1.0), 40.0) * 0.18;

  // water droplets: a sparse grid of tiny lenses, only on the solid interior of the object
  if (uWet > 0.0) {
    float inside = smoothstep(0.85, 1.0, a(vec2(t.x * 1.5, 0.0)) * a(vec2(-t.x * 1.5, 0.0)) * a(vec2(0.0, t.y * 1.5)) * a(vec2(0.0, -t.y * 1.5)));
    vec2 g = vUv * 6.5 + uSeed;
    vec2 id = floor(g);
    vec2 f = fract(g);
    vec2 r2 = hash2(id);
    float has = step(0.55, r2.x) * inside;
    vec2 cp = 0.28 + 0.44 * hash2(id + 7.3);
    float rad = 0.13 + 0.15 * r2.y;
    vec2 q = (f - cp) / rad;
    q.y *= 1.12;
    float d = length(q);
    float body = has * (1.0 - smoothstep(0.88, 1.0, d));
    // a tiny shadow the drop casts away from the sun
    float sh = has * (1.0 - smoothstep(0.8, 1.2, length(q + sun.xy * 0.3))) * (1.0 - body);
    col *= 1.0 - sh * 0.28 * uWet;
    // the lens: a brighter, richer body, a dark refraction rim, a soft caustic away from the sun
    col = mix(col, col * 1.15 + 0.03, body * 0.6 * uWet);
    col = mix(col, col * 0.5, smoothstep(0.55, 0.97, d) * body * 0.6 * uWet);
    col += vec3(1.0, 0.97, 0.9) * (1.0 - smoothstep(0.0, 0.5, length(q + sun.xy * 0.38))) * body * 0.2 * uWet;
    // and a sharp specular highlight toward the sun
    float spec = 1.0 - smoothstep(0.05, 0.24, length(q - sun.xy * 0.42));
    col += vec3(1.0) * spec * body * uWet * 1.1;
  }
  col *= uTint;
  col = mix(col, col * 1.08, uHover);
  gl_FragColor = vec4(col, c.a * uAlpha);
}`;

const SHADOW_FS = /* glsl */ `
uniform sampler2D uMap;
uniform float uAlpha;
uniform float uDark;
varying vec2 vUv;
void main() {
  // cheap blur of the silhouette from a low mip level
  float s = 0.0;
  for (int i = 0; i < 9; i++) {
    vec2 o = vec2(float(i % 3) - 1.0, float(i / 3) - 1.0) * 0.035;
    s += texture2D(uMap, vUv + o, 3.0).a;
  }
  // fade to zero before the quad's edge so the blur never gets clipped into a hard rectangle
  vec2 d = (vUv - 0.5) * 2.0;
  float fall = 1.0 - smoothstep(0.35, 1.0, length(d));
  gl_FragColor = vec4(mix(vec3(0.28, 0.2, 0.08), vec3(0.02, 0.01, 0.0), uDark), s / 9.0 * mix(0.32, 0.55, uDark) * uAlpha * fall);
}`;

// juice droplets: round, glossy points sized in world units
const SPLASH_VS = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
uniform float uScale;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vAlpha = aAlpha;
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SPLASH_FS = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  if (d > 0.5 || vAlpha <= 0.0) discard;
  vec3 col = vColor * (0.85 + 0.3 * (0.5 - p.y));
  col = mix(col, vec3(1.0), (1.0 - smoothstep(0.0, 0.16, length(p - vec2(-0.14, -0.16)))) * 0.7);
  gl_FragColor = vec4(col, vAlpha * smoothstep(0.5, 0.4, d));
}`;

const bounce = (x) => {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};

// average colour of the solid pixels of a cut-out, pushed a little more saturated: the "juice" colour
function juiceColor(img) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 24;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 24, 24);
  const d = ctx.getImageData(0, 0, 24, 24).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 200) continue;
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
    n++;
  }
  const c = new THREE.Color(n ? r / n / 255 : 1, n ? g / n / 255 : 0.5, n ? b / n / 255 : 0.3);
  const hsl = {};
  c.getHSL(hsl);
  return c.setHSL(hsl.h, Math.min(1, hsl.s * 1.35 + 0.1), Math.min(0.6, Math.max(0.35, hsl.l)));
}

export function createHero({ canvas, base, onPick, tip, reduced }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, innerWidth < 820 ? 12 : 16);
  const loader = new THREE.TextureLoader();
  const group = new THREE.Group();
  scene.add(group);
  const items = [];
  const plane = new THREE.PlaneGeometry(1, 1);
  let loaded = 0;
  let onReady = null;

  const small = innerWidth < 820;
  const list = small ? ITEMS.slice(0, 9) : ITEMS;
  for (const [id, cat, size, pos] of list) {
    const tex = loader.load(`${base}img/c/${id}.webp`, (t) => {
      const img = t.image;
      const k = img.width / img.height;
      it.mesh.scale.set(size * Math.min(1.4, k), (size * Math.min(1.4, k)) / k, 1);
      it.shadow.scale.set(it.mesh.scale.x * 1.05, it.mesh.scale.y * 0.35, 1);
      it.mat.uniforms.uTexel.value.set(1 / img.width, 1 / img.height);
      it.juice = JUICE[id] ? new THREE.Color(JUICE[id]) : juiceColor(img);
      it.ready = true;
      if (++loaded === list.length && onReady) onReady();
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: tex }, uTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) }, uSun: { value: new THREE.Vector3(0.6, 0.7, 0.8) },
        uTint: { value: new THREE.Vector3(1, 1, 1) }, uHover: { value: 0 }, uAlpha: { value: 0 }, uWet: { value: WET.has(id) ? 1 : 0 }, uSeed: { value: Math.random() * 50 },
      },
      vertexShader: VS,
      fragmentShader: FS,
      transparent: true,
      depthWrite: false,
    });
    const shadowMat = new THREE.ShaderMaterial({ uniforms: { uMap: { value: tex }, uAlpha: { value: 0 }, uDark: { value: 0 } }, vertexShader: VS, fragmentShader: SHADOW_FS, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(plane, mat);
    const shadow = new THREE.Mesh(plane, shadowMat);
    const holder = new THREE.Group();
    holder.add(shadow, mesh);
    group.add(holder);
    const x = small ? (pos[0] - 5) * 0.85 : pos[0] * 0.88 + 0.3;
    const y = small ? pos[1] * 0.75 : pos[1];
    const it = {
      id, cat, mesh, shadow, holder, mat, shadowMat, ready: false,
      base: new THREE.Vector3(x, y, pos[2]),
      ph: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.5,
      hover: 0,
      burst: 0, // 0 = whole, counts up while squashed and regrowing
    };
    mesh.userData.item = it;
    holder.position.copy(it.base);
    items.push(it);
  }
  // draw far items first so transparency composites correctly
  items.sort((a, b) => a.base.z - b.base.z).forEach((it, i) => {
    it.mesh.renderOrder = i * 2 + 1;
    it.shadow.renderOrder = i * 2;
  });

  // ---------- juice splash particles ----------
  const MAX = 420;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(MAX * 3), pCol = new Float32Array(MAX * 3), pSize = new Float32Array(MAX), pAlpha = new Float32Array(MAX);
  const pVel = new Float32Array(MAX * 3), pLife = new Float32Array(MAX), pMax = new Float32Array(MAX);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));
  pGeo.setAttribute('aAlpha', new THREE.BufferAttribute(pAlpha, 1));
  const pMat = new THREE.ShaderMaterial({ uniforms: { uScale: { value: 400 } }, vertexShader: SPLASH_VS, fragmentShader: SPLASH_FS, transparent: true, depthWrite: false });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  points.renderOrder = 999;
  scene.add(points);
  let pNext = 0, pActive = 0;
  function splash(it) {
    const o = it.holder.position;
    const col = it.juice || new THREE.Color('#ff7a3d');
    const light = col.clone().offsetHSL(0, -0.1, 0.12);
    const n = reduced ? 0 : 80;
    for (let k = 0; k < n; k++) {
      const i = pNext;
      pNext = (pNext + 1) % MAX;
      // spray outward in every direction, biased up, with a few big slow blobs and many fine drops
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      const big = Math.random() < 0.18;
      const sp = big ? 2 + Math.random() * 3 : 4 + Math.random() * 7;
      pVel[i * 3] = Math.sin(ph) * Math.cos(th) * sp;
      pVel[i * 3 + 1] = Math.abs(Math.cos(ph)) * sp * 0.9 + 2.5;
      pVel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp * 0.6 + 1.5;
      pPos[i * 3] = o.x + (Math.random() - 0.5) * 0.5;
      pPos[i * 3 + 1] = o.y + (Math.random() - 0.5) * 0.5;
      pPos[i * 3 + 2] = o.z + 0.2;
      const c = Math.random() < 0.3 ? light : col;
      pCol[i * 3] = c.r;
      pCol[i * 3 + 1] = c.g;
      pCol[i * 3 + 2] = c.b;
      pSize[i] = big ? 0.28 + Math.random() * 0.22 : 0.06 + Math.random() * 0.14;
      pMax[i] = pLife[i] = 0.8 + Math.random() * 0.7;
      pAlpha[i] = 1;
    }
    pActive = MAX;
  }
  function stepSplash(dt) {
    if (!pActive) return;
    let alive = 0;
    for (let i = 0; i < MAX; i++) {
      if (pLife[i] <= 0) continue;
      pLife[i] -= dt;
      pVel[i * 3 + 1] -= 16 * dt;
      pVel[i * 3] *= 0.985;
      pPos[i * 3] += pVel[i * 3] * dt;
      pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
      pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
      pAlpha[i] = Math.max(0, Math.min(1, (pLife[i] / pMax[i]) * 2.2));
      if (pLife[i] > 0) alive++;
      else pAlpha[i] = 0;
    }
    pGeo.attributes.position.needsUpdate = pGeo.attributes.aAlpha.needsUpdate = pGeo.attributes.aColor.needsUpdate = pGeo.attributes.aSize.needsUpdate = true;
    if (!alive) pActive = 0;
  }

  // ---------- interaction ----------
  const mouse = new THREE.Vector2(0, 0);
  const smooth = new THREE.Vector2(0, 0);
  const ray = new THREE.Raycaster();
  let hovered = null;
  let scrollK = 0;
  const pick = (cx, cy) => {
    const r = canvas.getBoundingClientRect();
    const p = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(p, camera);
    const hits = ray.intersectObjects(items.filter((i) => !i.burst).map((i) => i.mesh));
    // ignore transparent parts of the plane: sample the alpha at the hit uv
    for (const h of hits) {
      const it = h.object.userData.item;
      const img = it.mat.uniforms.uMap.value.image;
      if (!img || !h.uv) continue;
      if (!pick.ctx) {
        pick.cv = document.createElement('canvas');
        pick.ctx = pick.cv.getContext('2d', { willReadFrequently: true });
      }
      if (pick.cv.src !== img.src) {
        pick.cv.width = 128;
        pick.cv.height = 128;
        pick.ctx.clearRect(0, 0, 128, 128);
        pick.ctx.drawImage(img, 0, 0, 128, 128);
        pick.cv.src = img.src;
      }
      const a = pick.ctx.getImageData(Math.min(127, h.uv.x * 128) | 0, Math.min(127, (1 - h.uv.y) * 128) | 0, 1, 1).data[3];
      if (a > 40) return it;
    }
    return null;
  };
  const hero = canvas.parentElement;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (e.pointerType !== 'mouse') return;
    const it = pick(e.clientX, e.clientY);
    if (it !== hovered) {
      hovered = it;
      canvas.style.cursor = it ? 'pointer' : '';
      canvas.dataset.cursor = it ? 'Squeeze!' : '';
      tip.classList.toggle('show', !!it);
    }
    if (it) {
      tip.innerHTML = `${it.label}<small>Shop →</small>`;
      tip.style.left = `${e.clientX - r.left}px`;
      tip.style.top = `${e.clientY - r.top}px`;
    }
  });
  hero.addEventListener('pointerleave', () => {
    hovered = null;
    tip.classList.remove('show');
    mouse.set(0, 0);
  });
  canvas.addEventListener('click', (e) => {
    const it = pick(e.clientX, e.clientY);
    if (!it) return;
    // squash, burst into juice, then regrow while the page moves on
    it.burst = 0.0001;
    hovered = null;
    tip.classList.remove('show');
    setTimeout(() => splash(it), reduced ? 0 : 160);
    setTimeout(() => onPick(it), reduced ? 0 : 650);
  });
  // the canvas sits under the text; let clicks on empty canvas areas reach it
  canvas.style.pointerEvents = 'auto';

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the produce on the right on wide screens, behind the copy on narrow ones
    camera.setViewOffset(w, h, w < 820 ? 0 : -w * 0.04, 0, w, h);
    camera.updateProjectionMatrix();
    pMat.uniforms.uScale.value = (h * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  };
  addEventListener('resize', resize);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);
  let lastT = performance.now(), elapsed = 0;
  let started = false, introT = 0;
  let night = 0, nightTarget = 0;
  const sunMorning = new THREE.Vector3(0.95, 0.25, 0.75), sunNoon = new THREE.Vector3(0.35, 0.9, 0.8);
  const tintMorning = new THREE.Vector3(1.07, 0.97, 0.86), tintNoon = new THREE.Vector3(1.02, 1.01, 0.99), tintNight = new THREE.Vector3(0.86, 0.7, 0.52);
  const sun = new THREE.Vector3(), tint = new THREE.Vector3();
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible) return;
    const now = performance.now();
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    const t = (elapsed += dt);
    if (started) introT += dt;
    smooth.lerp(mouse, 1 - Math.exp(-dt * 4));
    night += (nightTarget - night) * Math.min(1, dt * 3);
    scrollK = Math.min(1, Math.max(0, scrollY / (hero.clientHeight * 0.9)));
    // time of day: low warm morning sun at the top of the page, climbing to a neutral noon as you scroll
    const day = Math.min(1, scrollK * 1.6);
    sun.lerpVectors(sunMorning, sunNoon, day);
    sun.x -= smooth.x * 0.25;
    sun.y -= smooth.y * 0.25;
    tint.lerpVectors(tintMorning, tintNoon, day).lerp(tintNight, night);
    for (const [i, it] of items.entries()) {
      const d = 1 - it.base.z * -0.12; // nearer items move more
      // intro: every item drops in from above and bounces to rest
      const k = reduced ? 1 : Math.min(1, Math.max(0, (introT - i * 0.075) / 1.15));
      const fall = (1 - bounce(k)) * 9;
      const bob = reduced ? 0 : Math.sin(t * 0.9 + it.ph) * 0.18;
      const p = it.holder.position;
      p.x = it.base.x + smooth.x * 0.55 * d + scrollK * (it.base.x - 3) * 0.45;
      p.y = it.base.y + bob * k + smooth.y * 0.4 * d + fall + scrollK * (2 + it.base.z * 0.4);
      p.z = it.base.z + scrollK * 3;
      it.hover += ((it === hovered ? 1 : 0) - it.hover) * Math.min(1, dt * 10);
      // burst: puff up, squash to nothing, pause, regrow with a little overshoot
      let bs = 1;
      if (it.burst) {
        it.burst += dt;
        const b = it.burst;
        if (b < 0.16) bs = 1 + b * 1.6;
        else if (b < 0.3) bs = Math.max(0, 1.25 * (1 - (b - 0.16) / 0.14));
        else if (b < 1.3) bs = 0;
        else if (b < 1.9) {
          const g = (b - 1.3) / 0.6;
          bs = Math.min(1, g * 2.5) + Math.sin(g * Math.PI) * 0.12 * (1 - g);
        } else it.burst = 0;
      }
      const s = (1 + it.hover * 0.1) * bs;
      it.holder.scale.set(s, s, s);
      it.mesh.rotation.z = (reduced ? 0 : Math.sin(t * 0.6 + it.ph) * 0.08 + it.spin * 0.3) + smooth.x * -0.06 + it.hover * 0.05 + (1 - k) * it.spin * 5;
      // rock the plane slightly in 3D so it catches the light like a real object
      it.mesh.rotation.y = smooth.x * 0.25 + (reduced ? 0 : Math.sin(t * 0.5 + it.ph) * 0.12);
      it.mesh.rotation.x = -smooth.y * 0.2;
      // shadows stretch away from the low morning sun and tuck under at noon; they stay on the ground while the item falls
      it.shadow.position.set(0.25 - (1 - day) * 0.55, -it.mesh.scale.y * 0.52 - 0.25 - bob * 0.6 - fall, -0.05);
      it.shadow.scale.x = it.mesh.scale.x * (1.05 + (1 - day) * 0.35);
      const alpha = it.ready ? Math.min(1, k * 5) * (1 - scrollK * 0.85) : 0;
      it.mat.uniforms.uAlpha.value = alpha;
      it.shadowMat.uniforms.uAlpha.value = alpha * (1 - bob * 0.8) * Math.max(0.15, 1 - fall / 9) * (1 - Math.min(1, it.burst * 4) * (it.burst < 1.3 ? 1 : 0));
      it.shadowMat.uniforms.uDark.value = night;
      it.mat.uniforms.uHover.value = it.hover;
      it.mat.uniforms.uSun.value.copy(sun);
      it.mat.uniforms.uTint.value.copy(tint);
    }
    stepSplash(dt);
    renderer.render(scene, camera);
  };
  loop();
  return {
    items,
    setLabels: (fn) => items.forEach((it) => (it.label = fn(it.id))),
    // resolves once every texture is in (or immediately if they already are)
    ready: () => new Promise((res) => (loaded === list.length ? res() : (onReady = res))),
    start: () => (started = true),
    setNight: (on) => (nightTarget = on ? 1 : 0),
  };
}
