import * as THREE from 'three';

// Hero: real cut-out product photos floating in a sunlit 3D space.
// Each item is a plane whose shader fakes volume: the alpha matte is used as a height map,
// so the sun (top-right) lights one side and shades the other, with a soft rim light.
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
uniform float uHover;
uniform float uAlpha;
varying vec2 vUv;
float a(vec2 o) { return texture2D(uMap, vUv + o).a; }
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.02) discard;
  // height from a blurred alpha: high in the middle of the object, falling to the edges
  vec2 t = uTexel * 9.0;
  float hx = (a(vec2(t.x, 0.0)) + a(vec2(t.x * 2.0, 0.0))) - (a(vec2(-t.x, 0.0)) + a(vec2(-t.x * 2.0, 0.0)));
  float hy = (a(vec2(0.0, t.y)) + a(vec2(0.0, t.y * 2.0))) - (a(vec2(0.0, -t.y)) + a(vec2(0.0, -t.y * 2.0)));
  vec3 n = normalize(vec3(-hx, -hy, 0.9));
  float diff = clamp(dot(n, normalize(uSun)), 0.0, 1.0);
  float rim = pow(1.0 - n.z, 2.0);
  vec3 col = c.rgb * (0.78 + 0.42 * diff) + vec3(1.0, 0.93, 0.78) * rim * 0.18;
  // warm sunlight + subtle specular glint for glossy fruit
  vec3 h = normalize(normalize(uSun) + vec3(0.0, 0.0, 1.0));
  col += vec3(1.0, 0.97, 0.9) * pow(clamp(dot(n, h), 0.0, 1.0), 40.0) * 0.18;
  col = mix(col, col * 1.08, uHover);
  gl_FragColor = vec4(col, c.a * uAlpha);
}`;

const SHADOW_FS = /* glsl */ `
uniform sampler2D uMap;
uniform float uAlpha;
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
  gl_FragColor = vec4(0.28, 0.2, 0.08, s / 9.0 * 0.32 * uAlpha * fall);
}`;

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

  const small = innerWidth < 820;
  const list = small ? ITEMS.slice(0, 9) : ITEMS;
  for (const [id, cat, size, pos] of list) {
    const tex = loader.load(`${base}img/c/${id}.webp`, (t) => {
      const img = t.image;
      const k = img.width / img.height;
      it.mesh.scale.set(size * Math.min(1.4, k), (size * Math.min(1.4, k)) / k, 1);
      it.shadow.scale.set(it.mesh.scale.x * 1.05, it.mesh.scale.y * 0.35, 1);
      it.mat.uniforms.uTexel.value.set(1 / img.width, 1 / img.height);
      it.ready = true;
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex }, uTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) }, uSun: { value: new THREE.Vector3(0.6, 0.7, 0.8) }, uHover: { value: 0 }, uAlpha: { value: 0 } },
      vertexShader: VS,
      fragmentShader: FS,
      transparent: true,
      depthWrite: false,
    });
    const shadowMat = new THREE.ShaderMaterial({ uniforms: { uMap: { value: tex }, uAlpha: { value: 0 } }, vertexShader: VS, fragmentShader: SHADOW_FS, transparent: true, depthWrite: false });
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
      pop: 0,
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
    const hits = ray.intersectObjects(items.map((i) => i.mesh));
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
    it.pop = 1;
    onPick(it);
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
  };
  addEventListener('resize', resize);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);
  const clock = new THREE.Clock();
  let intro = 0;
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    intro = Math.min(1, intro + dt * 0.7);
    smooth.lerp(mouse, 1 - Math.exp(-dt * 4));
    scrollK = Math.min(1, Math.max(0, scrollY / (hero.clientHeight * 0.9)));
    for (const [i, it] of items.entries()) {
      const d = 1 - it.base.z * -0.12; // nearer items move more
      const ease = 1 - Math.pow(1 - Math.min(1, Math.max(0, intro * 1.6 - i * 0.05)), 3);
      const bob = reduced ? 0 : Math.sin(t * 0.9 + it.ph) * 0.18;
      const p = it.holder.position;
      p.x = it.base.x + smooth.x * 0.55 * d + scrollK * (it.base.x - 3) * 0.45;
      p.y = it.base.y + bob + smooth.y * 0.4 * d + (1 - ease) * -6 + scrollK * (2 + it.base.z * 0.4);
      p.z = it.base.z + scrollK * 3;
      it.hover += ((it === hovered ? 1 : 0) - it.hover) * Math.min(1, dt * 10);
      it.pop = Math.max(0, it.pop - dt * 2.5);
      const s = 1 + it.hover * 0.1 + Math.sin(it.pop * Math.PI) * 0.18;
      it.mesh.scale.z = 1;
      it.holder.scale.setScalar(s);
      it.mesh.rotation.z = (reduced ? 0 : Math.sin(t * 0.6 + it.ph) * 0.08 + it.spin * 0.3) + smooth.x * -0.06 + it.hover * 0.05;
      // rock the plane slightly in 3D so it catches the light like a real object
      it.mesh.rotation.y = smooth.x * 0.25 + (reduced ? 0 : Math.sin(t * 0.5 + it.ph) * 0.12);
      it.mesh.rotation.x = -smooth.y * 0.2;
      it.shadow.position.set(0.25, -it.mesh.scale.y * 0.52 - 0.25 - bob * 0.6, -0.05);
      const alpha = it.ready ? ease * (1 - scrollK * 0.85) : 0;
      it.mat.uniforms.uAlpha.value = alpha;
      it.shadowMat.uniforms.uAlpha.value = alpha * (1 - bob * 0.8);
      it.mat.uniforms.uHover.value = it.hover;
      it.mat.uniforms.uSun.value.set(0.7 - smooth.x * 0.3, 0.75 - smooth.y * 0.3, 0.8);
    }
    renderer.render(scene, camera);
  };
  loop();
  return { items, setLabels: (fn) => items.forEach((it) => (it.label = fn(it.id))) };
}
