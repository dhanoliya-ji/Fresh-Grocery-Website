// A tiny 2D physics basket: each item is a circle that falls in, bounces off the curved
// bottom and walls, and stacks on the others (position-based / verlet style, no library).
export function createBasket(host) {
  const bodies = []; // { key, el, x, y, px, py, r, a }
  let raf = 0, idle = 0, running = false;
  const G = 1500; // px/s²

  const floor = (x, W, H) => {
    // a shallow bowl: deepest in the middle, rising toward the walls
    const u = (x - W / 2) / (W / 2);
    return H - 10 - 26 * (1 - u * u);
  };

  function step(dt) {
    const W = host.clientWidth, H = host.clientHeight;
    for (const b of bodies) {
      const vx = (b.x - b.px) * 0.995, vy = (b.y - b.py) * 0.995;
      b.px = b.x;
      b.py = b.y;
      b.x += vx;
      b.y += vy + G * dt * dt;
      b.a += vx / b.r;
    }
    for (let it = 0; it < 6; it++) {
      // circle vs circle
      for (let i = 0; i < bodies.length; i++)
        for (let j = i + 1; j < bodies.length; j++) {
          const A = bodies[i], B = bodies[j];
          const dx = B.x - A.x, dy = B.y - A.y;
          const min = (A.r + B.r) * 0.86; // a little overlap looks like a soft pile
          const d2 = dx * dx + dy * dy;
          if (d2 > 0 && d2 < min * min) {
            const d = Math.sqrt(d2), push = (min - d) / d / 2;
            A.x -= dx * push;
            A.y -= dy * push;
            B.x += dx * push;
            B.y += dy * push;
          }
        }
      // walls and bowl
      for (const b of bodies) {
        if (b.x < b.r) b.x = b.r;
        if (b.x > W - b.r) b.x = W - b.r;
        const f = floor(b.x, W, H);
        if (b.y > f - b.r) {
          b.y = f - b.r;
          // bounce + friction
          const vy = b.y - b.py;
          if (vy < 0) b.py = b.y + vy * 0.35;
          b.px += (b.x - b.px) * 0.18;
          // slide toward the middle along the slope
          b.x += ((W / 2 - b.x) / W) * 0.6;
        }
      }
    }
  }

  function draw() {
    for (const b of bodies) b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) rotate(${b.a}rad)`;
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = 1 / 60;
    step(dt);
    draw();
    const moving = bodies.some((b) => Math.abs(b.x - b.px) + Math.abs(b.y - b.py) > 0.05);
    idle = moving ? 0 : idle + 1;
    if (idle > 30) stop();
  }
  function start() {
    if (running) return;
    running = true;
    idle = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // items: [{ key, src, photo }] in the order they should appear; new keys drop in from above
  function set(items) {
    const W = host.clientWidth || 300;
    const keep = new Set(items.map((i) => i.key));
    for (let i = bodies.length - 1; i >= 0; i--)
      if (!keep.has(bodies[i].key)) {
        bodies[i].el.remove();
        bodies.splice(i, 1);
      }
    let dropped = 0;
    for (const it of items) {
      if (bodies.some((b) => b.key === it.key)) continue;
      const el = document.createElement('img');
      el.src = it.src;
      el.alt = '';
      el.draggable = false;
      if (it.photo) el.className = 'photo';
      host.appendChild(el);
      const r = 25 + ((it.key.length * 7) % 6);
      el.style.width = el.style.height = `${r * 2}px`;
      const x = W * (0.3 + Math.random() * 0.4);
      const y = -r - dropped * 46;
      bodies.push({ key: it.key, el, x, y, px: x + (Math.random() - 0.5) * 3, py: y - 2, r, a: Math.random() * 2 - 1 });
      dropped++;
    }
    draw();
    start();
  }
  // a nudge when the drawer opens so the pile settles visibly
  function shake() {
    for (const b of bodies) b.py = b.y + 4 + Math.random() * 4;
    start();
  }
  return { set, shake, stop };
}
