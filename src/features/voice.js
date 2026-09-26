import { cart } from '../cart.js';

// Voice search using the browser's built-in speech recognition (Chrome, Edge, Safari).
// Understands a few commands, otherwise it simply searches:
//   "add two bananas", "put salmon in my basket", "show bakery", "open the smoothie bar", "strawberries"
const NUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, couple: 2, few: 3 };
const PLACES = { deal: 'deals', deals: 'deals', smoothie: 'smoothie', smoothies: 'smoothie', blender: 'smoothie', recipe: 'recipe', planner: 'planner', plan: 'planner', walk: 'walk', aisle: 'walk', map: 'storemap', delivery: 'how', farm: 'farms', farms: 'farms', basket: 'cart', cart: 'cart' };

export function initVoice({ app, button, input }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    button.hidden = true;
    return;
  }
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  let listening = false;
  const wrap = button.closest('.search');
  const placeholder = input.placeholder;

  const find = (words) => {
    const w = words.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!w) return null;
    const stem = (s) => s.replace(/(ies)$/, 'y').replace(/(es|s)$/, '');
    const ws = w.split(' ').map(stem).filter((x) => x.length > 2);
    let best = null, score = 0;
    for (const p of app.PRODUCTS) {
      const hay = `${p.name} ${p.id}`.toLowerCase();
      const s = ws.reduce((n, x) => n + (hay.includes(x) ? x.length : 0), 0);
      if (s > score) {
        score = s;
        best = p;
      }
    }
    return best;
  };

  function run(text) {
    const t = text.toLowerCase().trim().replace(/[.?!]$/, '');
    let m = t.match(/^(?:please\s+)?(?:add|buy|put|get)\s+(?:me\s+)?(?:(\d+|a couple of|couple of|a few|few|an|a|one|two|three|four|five|six)\s+)?(?:of\s+)?(.+?)(?:\s+(?:to|in|into)\s+(?:my|the)?\s*(?:basket|cart))?$/);
    if (m) {
      const q = m[1] ? Number(m[1]) || NUM[m[1].replace(/^a\s+/, '').replace(/\s+of$/, '')] || 1 : 1;
      const p = find(m[2]);
      if (p) {
        cart.add(p.id, q);
        app.toast(`🎙️ Added ${q} × <b>${app.esc(p.name)}</b>`, p);
        return;
      }
    }
    m = t.match(/^(?:show|open|go to|take me to|browse)\s+(?:me\s+)?(?:the\s+)?(.+)$/);
    if (m) {
      const what = m[1].replace(/\s+(section|aisle|page|bar)$/, '');
      const cat = app.CATEGORIES.find((c) => c.name.toLowerCase().includes(what) || c.id.startsWith(what.replace(/s$/, '')));
      if (cat) {
        app.setCat(cat.id);
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
        app.toast(`🎙️ Showing <b>${cat.name}</b>`);
        return;
      }
      const place = PLACES[what.split(' ').find((x) => PLACES[x])];
      if (place === 'cart') return app.openDrawer();
      if (place) return document.getElementById(place)?.scrollIntoView({ behavior: 'smooth' });
    }
    // anything else is a search
    input.value = text;
    input.dispatchEvent(new Event('input'));
    document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  }

  rec.onresult = (e) => {
    const r = [...e.results].map((x) => x[0].transcript).join(' ');
    input.value = r;
    if (e.results[e.results.length - 1].isFinal) {
      stop();
      run(r);
    }
  };
  rec.onerror = (e) => {
    stop();
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') app.toast('🎙️ Microphone access was blocked');
    else if (e.error === 'no-speech') app.toast('🎙️ Didn’t catch that. Try “add two bananas”');
  };
  rec.onend = () => listening && stop();
  const stop = () => {
    listening = false;
    wrap.classList.remove('listening');
    input.placeholder = placeholder;
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  };
  button.addEventListener('click', () => {
    if (listening) return stop();
    listening = true;
    wrap.classList.add('listening');
    input.value = '';
    input.placeholder = 'Listening… try “add two bananas”';
    try {
      rec.start();
    } catch {
      stop();
    }
  });
  return { run };
}
