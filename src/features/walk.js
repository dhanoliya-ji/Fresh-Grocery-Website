import * as THREE from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 3D shelf walk: the section pins while you scroll, and scrolling walks the camera down a store aisle.
// Every category gets a stretch of shelving on both sides, stocked with the real product photos:
// cut-outs sit loose in wooden crates, packaged goods are boxes with the photo on the front.
// All copies of a product share one InstancedMesh, so hundreds of items cost ~60 draw calls.
const SEG = 6; // metres of aisle per category
const X = 1.62; // shelf front edge, either side of the aisle centre
const BOARDS = [0.46, 1.02, 1.58];
const SLOT = 0.72;

function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function initWalk({ section, canvas, tip, nowEl, ticksEl, app, CATEGORIES, PRODUCTS }) {
  const N = CATEGORIES.length;
  const L = SEG * N;
  const Z0 = 3.2, Z1 = -L + 3.5;
  let progress = 0, smoothP = 0;
  let built = false, visible = false;

  // pin + scrub. Created right away so the page layout (pin spacing) is correct from the start.
  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${Math.round(innerHeight * 3.4)}`,
    pin: true,
    scrub: true,
    refreshPriority: 1,
    onUpdate: (s) => (progress = s.progress),
  });

  ticksEl.innerHTML = CATEGORIES.map((c, i) => `<button data-i="${i}" style="--c:${c.color}"><i></i><span>${c.name}</span></button>`).join('');
  ticksEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const k = (+b.dataset.i + 0.35) / N;
    const y = st.start + (st.end - st.start) * k;
    app.scrollTo ? app.scrollTo(y, { offset: 0 }) : scrollTo({ top: y, behavior: 'smooth' });
  });

  // ---------------- renderer (built lazily, just before the section scrolls into view) ----------------
  let renderer, scene, camera, hemi, dir, lamp, glow, meshes = [], hoverId = null;
  const mouse = new THREE.Vector2(), look = new THREE.Vector2(), ptr = new THREE.Vector2(-9, -9);
  const ray = new THREE.Raycaster();
  let night = 0;

  async function build() {
    built = true;
    // the canvas-drawn signs use the page fonts
    await document.fonts.ready;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 820 ? 1.3 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    scene = new THREE.Scene();
    const bg = new THREE.Color('#f4ede0');
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 9, 30);
    camera = new THREE.PerspectiveCamera(innerWidth < 820 ? 70 : 58, 1, 0.05, 80);
    camera.position.set(0, 1.55, Z0);

    hemi = new THREE.HemisphereLight('#fff8ec', '#8a7358', 1.6);
    dir = new THREE.DirectionalLight('#ffffff', 1.3);
    dir.position.set(0.5, 4, 2);
    lamp = new THREE.PointLight('#ffe9c4', 9, 9, 1.6);
    scene.add(hemi, dir, lamp);

    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
    const box = new THREE.BoxGeometry(1, 1, 1);
    const add = (mat, sx, sy, sz, x, y, z) => {
      const m = new THREE.Mesh(box, mat);
      m.scale.set(sx, sy, sz);
      m.position.set(x, y, z);
      scene.add(m);
      return m;
    };

    // floor: glossy tiles
    const tiles = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#efe6d6';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#e4d8c4';
      c.fillRect(0, 0, w / 2, h / 2);
      c.fillRect(w / 2, h / 2, w / 2, h / 2);
      c.strokeStyle = '#d6c8b0';
      c.lineWidth = 3;
      c.strokeRect(0, 0, w, h);
      c.beginPath();
      c.moveTo(w / 2, 0);
      c.lineTo(w / 2, h);
      c.moveTo(0, h / 2);
      c.lineTo(w, h / 2);
      c.stroke();
    });
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
    tiles.repeat.set(3.5, (L + 24) / 1.7);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, L + 24), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.28, metalness: 0.05 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -L / 2 + 2;
    scene.add(floor);
    // ceiling with light strips
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6, L + 24), std('#f7f2e8', { side: THREE.BackSide }));
    ceil.rotation.x = -Math.PI / 2;
    ceil.position.set(0, 3.4, -L / 2 + 2);
    scene.add(ceil);
    glow = new THREE.MeshBasicMaterial({ color: '#fffaf0' });
    for (let z = 2; z > -L - 4; z -= 3.2) add(glow, 0.22, 0.02, 1.6, 0, 3.39, z);

    // shelving
    const wood = std('#d8c2a0', { roughness: 0.8 });
    const back = std('#f6f1e7');
    const base = std('#3b4a3f');
    const crateMat = std('#b9895a', { roughness: 0.9 });
    const crateXf = [];
    CATEGORIES.forEach((c, i) => {
      const zc = -i * SEG - SEG / 2;
      const edge = std(c.color, { roughness: 0.5 });
      const header = std(new THREE.Color(c.color).offsetHSL(0, 0.1, -0.12), { roughness: 0.5 });
      for (const s of [-1, 1]) {
        add(back, 0.04, 2.3, SEG - 0.04, s * (X + 0.58), 1.15, zc);
        add(base, 0.6, 0.2, SEG - 0.04, s * (X + 0.3), 0.1, zc);
        add(header, 0.62, 0.18, SEG - 0.04, s * (X + 0.3), 2.26, zc);
        for (const y of BOARDS) {
          add(wood, 0.6, 0.035, SEG - 0.06, s * (X + 0.3), y, zc);
          add(edge, 0.025, 0.075, SEG - 0.06, s * (X + 0.012), y - 0.01, zc);
        }
        for (const zz of [zc - SEG / 2 + 0.03, zc + SEG / 2 - 0.03]) add(base, 0.6, 2.3, 0.05, s * (X + 0.3), 1.15, zz);
      }
      // hanging aisle sign, readable as you approach
      const sign = canvasTex(1024, 256, (g, w, h) => {
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.roundRect(8, 8, w - 16, h - 16, 40);
        g.fill();
        g.fillStyle = c.color;
        g.beginPath();
        g.roundRect(8, 8, 150, h - 16, [40, 0, 0, 40]);
        g.fill();
        g.fillStyle = '#1f2a22';
        g.font = '700 42px Inter, "Noto Sans Devanagari", sans-serif';
        g.fillText(app.t('AISLE {n}', { n: i + 1 }), 190, 92);
        g.font = '800 96px Fraunces, "Noto Serif Devanagari", Georgia, serif';
        g.fillText(c.name, 186, 196);
        g.font = '700 110px Fraunces, Georgia, serif';
        g.fillStyle = '#ffffff';
        g.textAlign = 'center';
        g.fillText(String(i + 1), 83, 170);
      });
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.575), new THREE.MeshBasicMaterial({ map: sign, transparent: true, toneMapped: false }));
      sm.position.set(0, 2.78, -i * SEG - 0.6);
      scene.add(sm);
      for (const sx of [-0.9, 0.9]) add(base, 0.012, 0.35, 0.012, sx, 3.24, -i * SEG - 0.6);
    });
    // end wall
    const endTex = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = '#1f7a4d';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffffff';
      g.textAlign = 'center';
      g.font = '800 120px Fraunces, Georgia, serif';
      g.fillText('Freshly', w / 2, 230);
      g.font = '600 46px Inter, "Noto Sans Devanagari", sans-serif';
      g.fillStyle = '#ffc94a';
      g.fillText(app.t('Checkout this way →'), w / 2, 330);
    });
    const endWall = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.3), new THREE.MeshBasicMaterial({ map: endTex, toneMapped: false }));
    endWall.position.set(0, 1.7, -L - 0.4);
    scene.add(endWall);
    add(back, 6, 3.4, 0.1, 0, 1.7, -L - 0.5);

    // ---------------- products ----------------
    const loader = new THREE.TextureLoader();
    const loadTex = (url) => new Promise((res) => loader.load(url, res, undefined, () => res(null)));
    const byCat = Object.fromEntries(CATEGORIES.map((c) => [c.id, PRODUCTS.filter((p) => p.cat === c.id)]));
    const placements = new Map(); // id -> [{x,y,z,s,rot,jit}]
    const tagPl = new Map();
    const crateCats = new Set(['fruits', 'vegetables']);
    CATEGORIES.forEach((c, i) => {
      const list = byCat[c.id];
      let k = i * 3;
      for (const s of [-1, 1]) {
        const n = Math.floor(SEG / SLOT);
        BOARDS.forEach((y, bi) => {
          for (let j = 0; j < n; j++) {
            const p = list[k++ % list.length];
            const z = -i * SEG - SEG / 2 + (j - (n - 1) / 2) * SLOT;
            const arr = placements.get(p.id) || [];
            arr.push({ x: s * (X + 0.26), y: y + 0.02, z, s, crate: p.cut && crateCats.has(c.id) });
            placements.set(p.id, arr);
            const ta = tagPl.get(p.id) || [];
            ta.push({ x: s * (X - 0.005), y: y - 0.012, z: z + 0.12, s });
            tagPl.set(p.id, ta);
            if (p.cut && crateCats.has(c.id)) crateXf.push({ x: s * (X + 0.28), y: y + 0.1, z });
          }
          k += bi;
        });
      }
    });

    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    const crateGeo = new THREE.BoxGeometry(0.5, 0.16, 0.62);
    const crates = new THREE.InstancedMesh(crateGeo, crateMat, crateXf.length);
    crateXf.forEach((c, i) => {
      m4.compose(v.set(c.x, c.y, c.z), q.identity(), sc.set(1, 1, 1));
      crates.setMatrixAt(i, m4);
    });
    crates.computeBoundingSphere();
    scene.add(crates);

    const plane = new THREE.PlaneGeometry(1, 1);
    const boxGeo = new THREE.BoxGeometry(0.26, 0.44, 0.46);
    const tagGeo = new THREE.PlaneGeometry(0.2, 0.075);
    const jobs = PRODUCTS.map(async (p) => {
      const pl = placements.get(p.id);
      if (!pl) return;
      const tex = await loadTex(`${app.BASE}img/${p.cut ? 'c' : 'p'}/${p.img}.webp`);
      if (!tex) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const img = tex.image, a = img.width / img.height;
      let mesh;
      if (p.cut) {
        // loose produce: three overlapping cut-outs per slot, slightly staggered, like a pile
        const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.55 });
        const hgt = 0.4, wid = Math.min(0.62, hgt * a);
        mesh = new THREE.InstancedMesh(plane, mat, pl.length * 3);
        let n = 0;
        pl.forEach((o) => {
          for (let r = 0; r < 3; r++) {
            const off = (r - 1) * 0.17;
            const lift = o.crate ? 0.1 : 0;
            e.set(0, o.s > 0 ? -Math.PI / 2 : Math.PI / 2, (r - 1) * 0.12);
            q.setFromEuler(e);
            const k = 0.82 + (r === 1 ? 0.18 : 0);
            m4.compose(v.set(o.x - o.s * (r === 1 ? 0.12 : 0.02), o.y + (hgt * k) / 2 + lift + (r === 1 ? 0.05 : 0), o.z + off), q, sc.set(wid * k, hgt * k, 1));
            mesh.setMatrixAt(n++, m4);
          }
        });
      } else {
        // packaged goods: a box with the photo on the side facing the aisle
        if (a > 1) {
          tex.repeat.set(1 / a, 1);
          tex.offset.set((1 - 1 / a) / 2, 0);
        } else {
          tex.repeat.set(1, a);
          tex.offset.set(0, (1 - a) / 2);
        }
        const catCol = new THREE.Color(CATEGORIES.find((c) => c.id === p.cat).color);
        const side = new THREE.MeshStandardMaterial({ color: catCol, roughness: 0.6 });
        const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 });
        mesh = new THREE.InstancedMesh(boxGeo, [side, front, side, side, side, side], pl.length);
        pl.forEach((o, i) => {
          q.setFromEuler(e.set(0, o.s > 0 ? 0 : Math.PI, 0));
          m4.compose(v.set(o.x, o.y + 0.22, o.z), q, sc.set(1, 1, 1));
          mesh.setMatrixAt(i, m4);
        });
      }
      mesh.computeBoundingSphere();
      mesh.userData.id = p.id;
      scene.add(mesh);
      meshes.push(mesh);
      // shelf price tags
      const tagTex = canvasTex(256, 96, (g, w, h) => {
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, w, h);
        g.fillStyle = p.old ? '#e8453c' : '#ffc94a';
        g.fillRect(0, 0, 14, h);
        g.fillStyle = '#1f2a22';
        g.font = '800 48px Inter, sans-serif';
        g.fillText(app.money(p.price), 28, 56);
        g.font = '500 20px Inter, "Noto Sans Devanagari", sans-serif';
        g.fillStyle = '#6b746d';
        g.fillText(p.name.slice(0, 22), 28, 84);
      });
      const tp = tagPl.get(p.id);
      const tags = new THREE.InstancedMesh(tagGeo, new THREE.MeshBasicMaterial({ map: tagTex, toneMapped: false }), tp.length);
      tp.forEach((o, i) => {
        q.setFromEuler(e.set(0, o.s > 0 ? -Math.PI / 2 : Math.PI / 2, 0));
        m4.compose(v.set(o.x, o.y, o.z), q, sc.set(1, 1, 1));
        tags.setMatrixAt(i, m4);
      });
      tags.computeBoundingSphere();
      scene.add(tags);
    });
    await Promise.all(jobs);
    applyNight();
    resize();
  }

  // ---------------- interaction ----------------
  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ptr.copy(mouse);
    tip.style.left = `${e.clientX - r.left}px`;
    tip.style.top = `${e.clientY - r.top}px`;
  });
  section.addEventListener('pointerleave', () => {
    mouse.set(0, 0);
    ptr.set(-9, -9);
  });
  canvas.addEventListener('click', () => hoverId && app.openProduct(hoverId));

  const resize = () => {
    if (!renderer) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);

  function applyNight() {
    if (!scene) return;
    const c = new THREE.Color(night ? '#2a2318' : '#f4ede0');
    scene.background = c;
    scene.fog.color = c;
    hemi.intensity = night ? 0.55 : 1.6;
    hemi.color.set(night ? '#ffcf8a' : '#fff8ec');
    dir.intensity = night ? 0.35 : 1.3;
    lamp.intensity = night ? 16 : 9;
    lamp.color.set(night ? '#ffb45e' : '#ffe9c4');
    glow.color.set(night ? '#8a6a3c' : '#fffaf0');
  }

  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible && !built) build();
    },
    { rootMargin: '120% 0px' },
  ).observe(section);

  let lastI = -1;
  let lastT = performance.now(), elapsed = 0;
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible || !renderer) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    smoothP += (progress - smoothP) * Math.min(1, dt * 6);
    look.lerp(mouse, Math.min(1, dt * 3));
    const z = Z0 + (Z1 - Z0) * smoothP;
    const walking = Math.abs(progress - smoothP) * 60;
    camera.position.set(Math.sin(z * 0.6) * 0.06, 1.55 + Math.sin(z * 3.2) * 0.02 * Math.min(1, walking), z);
    camera.rotation.set(look.y * 0.18 - 0.06, -look.x * 0.55, 0, 'YXZ');
    lamp.position.set(camera.position.x, 2.6, z - 1.5);
    // which aisle are we in?
    const i = Math.max(0, Math.min(N - 1, Math.floor((-z + 1.5) / SEG)));
    if (i !== lastI) {
      lastI = i;
      nowEl.textContent = CATEGORIES[i].name;
      nowEl.style.setProperty('--c', CATEGORIES[i].color);
      [...ticksEl.children].forEach((b, k) => b.classList.toggle('on', k === i));
    }
    ticksEl.style.setProperty('--p', smoothP);
    // hover a product on the shelf
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(meshes, false).find((h) => h.distance < 7);
    const id = hit?.object.userData.id || null;
    if (id !== hoverId) {
      hoverId = id;
      canvas.style.cursor = id ? 'pointer' : '';
      canvas.dataset.cursor = id ? 'View' : '';
      tip.classList.toggle('show', !!id);
      if (id) {
        const p = app.byId[id];
        tip.innerHTML = `<b>${app.esc(p.name)}</b><span>${app.money(p.price)} · ${p.unit}</span>`;
      }
    }
    renderer.render(scene, camera);
  };
  loop();

  return {
    setNight(on) {
      night = on ? 1 : 0;
      applyNight();
    },
  };
}
