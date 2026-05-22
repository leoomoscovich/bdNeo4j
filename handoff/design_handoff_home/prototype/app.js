/* ============================================================
   SkinGraph Radar — interactions
   ============================================================ */

/* ---------- clock ---------- */
(function clock(){
  const el = document.getElementById('clock');
  if(!el) return;
  function tick(){
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    el.textContent = `${hh}:${mm} ART`;
  }
  tick(); setInterval(tick, 30000);
})();

/* ---------- "last updated" counter ---------- */
(function lastUpdated(){
  const el = document.getElementById('lastUpdated');
  if(!el) return;
  let s = 38;
  setInterval(()=>{
    s += 1;
    if(s > 119) s = 12;
    el.textContent = `hace ${s} s`;
  }, 1000);
})();

/* ============================================================
   Network graph
   ============================================================ */
(function netgraph(){
  const svg = document.getElementById('netgraph');
  if(!svg) return;
  const nodesG = document.getElementById('nodes');
  const edgesG = document.getElementById('edges');

  // Hand-tuned positions for an editorial, balanced composition.
  const nodes = [
    // buyers (filled black)
    { id:'B-2071', type:'buyer',  x:170, y:130, label:'B-2071', meta:{conn:14, match:'6 traders', last:'hace 4 min', mkts:'CSFloat · BUFF163', vol:'$48.210', note:'Aparece en seis cadenas distintas comprando AK-47 Voltaic. Tres terminan en el mismo trader: T-118.'} },
    { id:'B-1042', type:'buyer',  x:140, y:300, label:'B-1042', meta:{conn:9,  match:'4 traders', last:'hace 18 min', mkts:'BUFF163',          vol:'$22.870', note:'Tres compras consecutivas de Karambit Doppler en menos de 72 h, todas con stickers similares.'} },
    { id:'B-3318', type:'buyer',  x:230, y:440, label:'B-3318', meta:{conn:6,  match:'2 traders', last:'hace 1 h',   mkts:'CSFloat',           vol:'$11.420', note:'Comprador nuevo. Ya cruzó con dos traders del cluster T-118.'} },
    // traders (red)
    { id:'T-118',  type:'trader', x:380, y:210, label:'T-118',  meta:{conn:42, match:'18 compradores', last:'hace 2 min',  mkts:'CSFloat · BUFF163 · Skinport', vol:'$184.300', note:'Trader denso. Aparece en 22 ciclos cerrados sobre AK-47, AWP y Karambit en los últimos 30 días.'} },
    { id:'T-204',  type:'trader', x:420, y:380, label:'T-204',  meta:{conn:28, match:'12 compradores', last:'hace 9 min',  mkts:'BUFF163 · Skinport',          vol:'$71.500',  note:'Tempo más lento que T-118 pero comparte cinco compradores en común.'} },
    // skins (white)
    { id:'AK-V',   type:'skin',   x:580, y:140, label:'AK',     meta:{conn:31, match:'AK-47 │ Voltaic', last:'hace 3 min',   mkts:'CSFloat · BUFF163', vol:'$284.700', note:'Modelo con mayor densidad de spreads y reapariciones del mes.'} },
    { id:'KAR-D',  type:'skin',   x:620, y:320, label:'KAR',    meta:{conn:18, match:'Karambit │ Doppler P2', last:'hace 12 min', mkts:'BUFF163', vol:'$112.300', note:'Reaparición consecutiva en cuatro listados de un mismo float.'} },
    { id:'AWP-W',  type:'skin',   x:540, y:470, label:'AWP',    meta:{conn:12, match:'AWP │ Wildfire', last:'hace 30 min', mkts:'CSFloat · BUFF163', vol:'$58.220', note:'Spread amplio entre venues sostenido por 11 días.'} },
    // markets (dark diamond)
    { id:'M-CSF',  type:'mkt',    x:680, y:80,  label:'CSF',    meta:{conn:42, match:'CSFloat', last:'live', mkts:'—', vol:'—', note:'Venue principal para floats raros.'} },
    { id:'M-BUF',  type:'mkt',    x:700, y:240, label:'BUF',    meta:{conn:51, match:'BUFF163', last:'live', mkts:'—', vol:'—', note:'Mayor volumen pero menor velocidad de cierre.'} },
    { id:'M-SKP',  type:'mkt',    x:670, y:430, label:'SKP',    meta:{conn:24, match:'Skinport', last:'live', mkts:'—', vol:'—', note:'Tempo distinto. Suele rezagarse 2–4 h sobre BUFF.'} },
    // transactions (small gray)
    { id:'TX-A',   type:'tx',     x:290, y:170, label:'',       meta:{conn:1, match:'B-2071 → T-118', last:'hace 4 min', mkts:'—', vol:'$1.842', note:'Transacción reciente con spread +14% sobre la mediana.'} },
    { id:'TX-B',   type:'tx',     x:310, y:330, label:'',       meta:{conn:1, match:'B-1042 → T-204', last:'hace 22 min', mkts:'—', vol:'$2.940', note:'Karambit Doppler con float top 1%.'} },
    { id:'TX-C',   type:'tx',     x:480, y:120, label:'',       meta:{conn:1, match:'T-118 → AK-V',  last:'hace 8 min', mkts:'—', vol:'$1.789', note:'Listado abierto en CSFloat. Sospecha de reaparición.'} },
  ];

  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));

  const edges = [
    ['B-2071','TX-A'], ['TX-A','T-118'], ['T-118','TX-C'], ['TX-C','AK-V'], ['AK-V','M-CSF'],
    ['B-1042','TX-B'], ['TX-B','T-204'], ['T-204','KAR-D'], ['KAR-D','M-BUF'],
    ['B-3318','T-118'], ['B-3318','T-204'],
    ['T-118','M-BUF'], ['T-118','AWP-W'], ['AWP-W','M-SKP'],
    ['B-2071','T-204'], ['AK-V','M-BUF'], ['T-204','M-SKP'],
    ['B-1042','T-118']
  ];

  // Hot path — a closed ring that mirrors R/01 in the dark section
  const HOT = new Set([
    'B-2071>TX-A','TX-A>T-118','T-118>TX-C','TX-C>AK-V','B-2071>T-204','T-204>T-118'
  ].map(k=>k));

  // build edges
  edges.forEach(([a,b])=>{
    const A = nodeById[a], B = nodeById[b];
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', A.x); line.setAttribute('y1', A.y);
    line.setAttribute('x2', B.x); line.setAttribute('y2', B.y);
    line.dataset.from = a; line.dataset.to = b;
    if(HOT.has(`${a}>${b}`) || HOT.has(`${b}>${a}`)){
      line.classList.add('edge--hot');
      line.classList.add('pulse');
    }
    edgesG.appendChild(line);
  });

  // build nodes
  nodes.forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class', `node node--${n.type}`);
    g.setAttribute('transform', `translate(${n.x} ${n.y})`);
    g.dataset.id = n.id;

    let shape;
    if(n.type === 'mkt'){
      shape = document.createElementNS('http://www.w3.org/2000/svg','rect');
      const s = 18;
      shape.setAttribute('x', -s/2); shape.setAttribute('y', -s/2);
      shape.setAttribute('width', s); shape.setAttribute('height', s);
      shape.setAttribute('transform', `rotate(45)`);
    } else if(n.type === 'tx'){
      shape = document.createElementNS('http://www.w3.org/2000/svg','circle');
      shape.setAttribute('r', 5);
    } else {
      shape = document.createElementNS('http://www.w3.org/2000/svg','circle');
      shape.setAttribute('r', n.type==='trader' ? 22 : n.type==='skin' ? 24 : 20);
    }
    shape.setAttribute('class','node-bg');
    g.appendChild(shape);

    if(n.label){
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('y', 3);
      t.textContent = n.label;
      g.appendChild(t);
    }

    g.addEventListener('click', () => selectNode(n.id));
    g.addEventListener('mouseenter', () => highlightNode(n.id));
    g.addEventListener('mouseleave', () => clearHighlight());
    nodesG.appendChild(g);
  });

  // selection + inspector
  const insId    = document.getElementById('insId');
  const insType  = document.getElementById('insType');
  const insList  = document.getElementById('insList');
  const insNote  = document.querySelector('.inspector__note');

  function typeLabel(t){
    return {buyer:'Comprador', trader:'Trader', skin:'Skin', mkt:'Marketplace', tx:'Transacción'}[t];
  }

  function fillInspector(n){
    insId.textContent = n.id;
    insType.textContent = typeLabel(n.type);
    insList.innerHTML = `
      <div><dt>Conexiones</dt><dd>${n.meta.conn}</dd></div>
      <div><dt>Coincidencias</dt><dd>${n.meta.match}</dd></div>
      <div><dt>Última actividad</dt><dd>${n.meta.last}</dd></div>
      <div><dt>Marketplaces</dt><dd>${n.meta.mkts}</dd></div>
      <div><dt>Volumen 30 d</dt><dd>${n.meta.vol}</dd></div>
    `;
    insNote.textContent = n.meta.note;
  }

  let currentSel = 'B-2071';
  function selectNode(id){
    currentSel = id;
    nodesG.querySelectorAll('.node').forEach(g => {
      g.classList.toggle('node--selected', g.dataset.id === id);
    });
    fillInspector(nodeById[id]);
    highlightNode(id, true);
  }

  function highlightNode(id, persist=false){
    const connected = new Set([id]);
    edgesG.querySelectorAll('line').forEach(line => {
      const f = line.dataset.from, t = line.dataset.to;
      if(f === id || t === id){
        connected.add(f); connected.add(t);
        line.classList.remove('edge--dim');
      } else {
        line.classList.add('edge--dim');
      }
    });
  }
  function clearHighlight(){
    edgesG.querySelectorAll('line').forEach(line => line.classList.remove('edge--dim'));
    if(currentSel) highlightNode(currentSel);
  }

  // default selection
  selectNode('B-2071');
})();

/* ============================================================
   Scroll reveal
   ============================================================ */
(function reveal(){
  const items = [...document.querySelectorAll('.reveal')];
  document.querySelectorAll('.layers .layer').forEach((el, i) => {
    el.style.setProperty('--i', i);
  });
  function check(){
    const vh = window.innerHeight;
    for(const el of items){
      if(el.classList.contains('is-in')) continue;
      const r = el.getBoundingClientRect();
      // trigger as soon as top is below 88% of viewport height OR bottom is in view
      if(r.top < vh * 0.88 && r.bottom > 0){
        el.classList.add('is-in');
      }
    }
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  check();
  // run again after a tick in case fonts/layout shift
  setTimeout(check, 100);
  setTimeout(check, 400);
})();

/* ============================================================
   Counter rolls (only on .kv__v with numeric value)
   ============================================================ */
(function counters(){
  const parseTarget = (txt) => {
    const m = txt.replace(/\./g,'').replace(/,/g,'.').match(/(\d+(?:\.\d+)?)([KMB%×s]*)/);
    if(!m) return null;
    return { value: parseFloat(m[1]), suffix: m[2], raw: txt };
  };
  const fmt = (n, raw) => {
    if(raw.includes('K')) return n.toFixed(1).replace('.', ',') + 'K';
    if(raw.includes('.')) {
      const s = Math.round(n).toString();
      return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    if(raw.match(/^\d+$/)) return Math.round(n).toString().padStart(raw.length,'0');
    return n.toString();
  };
  const els = [...document.querySelectorAll('.kv__v')]
    .filter(el => /^\s*[\d\.,]/.test(el.textContent));
  if(!els.length) return;
  const done = new WeakSet();

  function tryAnimate(el){
    if(done.has(el)) return;
    const r = el.getBoundingClientRect();
    if(r.top > window.innerHeight * 0.85 || r.bottom < 0) return;
    done.add(el);
    const original = el.innerHTML;
    const text = el.textContent.trim();
    const t = parseTarget(text);
    if(!t || isNaN(t.value)) return;
    const duration = 1100;
    const start = performance.now();
    function step(now){
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = t.value * eased;
      el.textContent = fmt(v, text);
      if(p < 1) requestAnimationFrame(step);
      else el.innerHTML = original;
    }
    requestAnimationFrame(step);
  }
  function check(){ els.forEach(tryAnimate); }
  window.addEventListener('scroll', check, { passive: true });
  setTimeout(check, 200);
})();

/* ============================================================
   Tweaks panel
   ============================================================ */
(function tweaks(){
  const defaults = window.__TWEAKS__ || { texture:'grid', density:'editorial', red:'signal', motion:true };
  const state = { ...defaults };
  if(typeof state.motion === 'string') state.motion = state.motion === 'on';

  const panel = document.getElementById('tweaks');
  if(!panel) return;
  const closeBtn = document.getElementById('tweaksClose');

  function applyAll(){
    document.body.dataset.texture = state.texture;
    document.body.dataset.density = state.density;
    document.body.dataset.red = state.red;
    document.body.dataset.motion = state.motion ? 'on' : 'off';
    // sync button pressed states
    panel.querySelectorAll('.tw__seg').forEach(seg => {
      const key = seg.dataset.tw;
      const cur = key === 'motion' ? (state.motion ? 'on' : 'off') : state[key];
      seg.querySelectorAll('button').forEach(b => {
        b.setAttribute('aria-pressed', String(b.dataset.val === cur));
      });
    });
  }

  function persist(patch){
    try{
      window.parent.postMessage({type:'__edit_mode_set_keys', edits: patch}, '*');
    }catch(e){}
  }

  panel.querySelectorAll('.tw__seg').forEach(seg => {
    const key = seg.dataset.tw;
    seg.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        const val = b.dataset.val;
        if(key === 'motion'){
          state.motion = val === 'on';
          persist({ motion: state.motion });
        } else {
          state[key] = val;
          persist({ [key]: val });
        }
        applyAll();
      });
    });
  });

  // Host protocol
  window.addEventListener('message', (e) => {
    const t = e.data && e.data.type;
    if(t === '__activate_edit_mode'){ panel.hidden = false; }
    else if(t === '__deactivate_edit_mode'){ panel.hidden = true; }
  });

  closeBtn.addEventListener('click', () => {
    panel.hidden = true;
    try{ window.parent.postMessage({type:'__edit_mode_dismissed'}, '*'); }catch(e){}
  });

  applyAll();
  try{ window.parent.postMessage({type:'__edit_mode_available'}, '*'); }catch(e){}
})();
