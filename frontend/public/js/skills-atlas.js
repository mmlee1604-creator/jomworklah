/* Skills Atlas — an embedded Malaysia skills supply/demand/gap map.
   Adapted for JomWorkLah from the standalone Skills Atlas prototype.
   Geometry comes from ATLAS_GEO / ATLAS_DGEO (official DOSM/open boundaries).
   Supply, demand, gap, employer and institution figures are illustrative demo data. */
var SkillsAtlas = (() => {
  "use strict";

  const GEO = ATLAS_GEO;
  const DGEO = ATLAS_DGEO;
  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STORAGE_KEY = "jomworklah-atlas-v1";
  const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js";
  const CONTROLS_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js";
  const UTILS_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js";

  const STATES = [
    { id: "PLS", name: "Perlis", scale: 0.08, aff: { agriculture: .75, logistics: .2, hospitality: .3 } },
    { id: "KDH", name: "Kedah", scale: 0.36, aff: { semiconductor: .70, agriculture: .72, logistics: .4, construction: .4 } },
    { id: "PNG", name: "Pulau Pinang", scale: 0.46, aff: { semiconductor: .95, software: .6, digitalmedia: .5, logistics: .6, hospitality: .6, healthcare: .5 } },
    { id: "PRK", name: "Perak", scale: 0.42, aff: { construction: .5, agriculture: .6, automotive: .45, semiconductor: .45, hospitality: .4 } },
    { id: "KTN", name: "Kelantan", scale: 0.34, aff: { agriculture: .78, hospitality: .45, healthcare: .45, construction: .4 } },
    { id: "TRG", name: "Terengganu", scale: 0.26, aff: { oilgas: .90, hospitality: .55, agriculture: .5, construction: .4 } },
    { id: "PHG", name: "Pahang", scale: 0.34, aff: { agriculture: .72, oilgas: .55, construction: .55, hospitality: .5, logistics: .4 } },
    { id: "SEL", name: "Selangor", scale: 1.00, aff: { software: .90, logistics: .90, digitalmedia: .80, construction: .80, semiconductor: .6, automotive: .6, healthcare: .65, hospitality: .55 } },
    { id: "KUL", name: "Kuala Lumpur", scale: 0.72, aff: { software: .95, digitalmedia: .90, healthcare: .7, hospitality: .7, logistics: .6, construction: .7, semiconductor: .4 } },
    { id: "NSN", name: "Negeri Sembilan", scale: 0.28, aff: { automotive: .65, logistics: .55, construction: .55, agriculture: .45 } },
    { id: "MLK", name: "Melaka", scale: 0.24, aff: { semiconductor: .70, automotive: .55, hospitality: .6, logistics: .5, software: .4 } },
    { id: "JHR", name: "Johor", scale: 0.78, aff: { logistics: .85, automotive: .6, construction: .7, software: .5, semiconductor: .45, hospitality: .5, agriculture: .45 } },
    { id: "SWK", name: "Sarawak", scale: 0.50, aff: { oilgas: .80, agriculture: .7, construction: .6, hospitality: .5, logistics: .4 } },
    { id: "SBH", name: "Sabah", scale: 0.52, aff: { agriculture: .80, hospitality: .80, oilgas: .5, logistics: .4, construction: .45 } }
  ];
  const SKILLS = [
    { id: "semi", name: "Semiconductor & E&E", sector: "semiconductor", tvet: "Penang Skills Development Centre (PSDC)" },
    { id: "soft", name: "Software & Data", sector: "software", tvet: "TVET diploma + HRD Corp coding bootcamps" },
    { id: "media", name: "Digital Media & Content", sector: "digitalmedia", tvet: "Creative multimedia TVET / MyDigital" },
    { id: "logi", name: "Logistics & Supply Chain", sector: "logistics", tvet: "Port & warehousing NOSS pathways" },
    { id: "auto", name: "Automotive & Mechanical", sector: "automotive", tvet: "ADTEC / automotive NOSS certification" },
    { id: "oil", name: "Oil, Gas & Energy", sector: "oilgas", tvet: "INSTEP / energy-sector TVET" },
    { id: "hosp", name: "Hospitality & Tourism", sector: "hospitality", tvet: "Tourism & culinary TVET institutes" },
    { id: "health", name: "Healthcare Support", sector: "healthcare", tvet: "Allied-health TVET / assistant nursing" },
    { id: "cons", name: "Construction & Built Env.", sector: "construction", tvet: "CIDB accredited training" },
    { id: "agri", name: "Agriculture & Agrotech", sector: "agriculture", tvet: "Agropolitan / agrotech TVET" }
  ];
  const DEMAND_BOOST = { soft: { SEL: 1.6, KUL: 1.7, PNG: 1.25 }, media: { KUL: 1.55, SEL: 1.3 }, semi: { PNG: 1.35, KDH: 1.25 }, oil: { TRG: 1.4, SWK: 1.35 }, logi: { JHR: 1.4, SEL: 1.25 }, health: { KUL: 1.35, SEL: 1.25 } };
  const SUPPLY_BOOST = { agri: { KTN: 1.45, PLS: 1.45, PRK: 1.3, SBH: 1.25, PHG: 1.25 }, auto: { NSN: 1.25, PRK: 1.15 }, semi: { KDH: 1.2 } };
  // Long state names wrap at the state centre when space is tight.
  function labelLines(name) {
    if (name === "Pulau Pinang") return ["Pulau", "Pinang"];
    if (name === "Kuala Lumpur") return ["Kuala", "Lumpur"];
    if (name === "Negeri Sembilan") return ["Negeri", "Sembilan"];
    return [name];
  }
  // District hubs: where jobs concentrate (demand spikes) by sector.
  const HUB = {
    "Petaling": ["software", "digitalmedia", "logistics", "healthcare"], "Hulu Langat": ["software", "construction"], "Klang": ["logistics", "construction", "automotive"],
    "Johor Bahru": ["logistics", "software", "construction", "automotive"], "Kulai": ["logistics"], "Batu Pahat": ["automotive"],
    "Kulim": ["semiconductor"], "Kuala Muda": ["semiconductor", "logistics"],
    "Seberang Perai Tengah": ["semiconductor", "logistics"], "Seberang Perai Utara": ["semiconductor"], "Timur Laut": ["software", "hospitality", "healthcare"],
    "Kinta": ["construction", "software", "healthcare"], "Manjung": ["construction"],
    "Kuantan": ["oilgas", "logistics", "construction"], "Kemaman": ["oilgas"], "Kuala Terengganu": ["hospitality", "oilgas"],
    "Kuching": ["software", "oilgas", "hospitality"], "Miri": ["oilgas", "hospitality"], "Bintulu": ["oilgas", "logistics"], "Samarahan": ["software"],
    "Kota Kinabalu": ["hospitality", "software", "logistics", "healthcare"], "Sandakan": ["agriculture", "logistics"], "Tawau": ["agriculture", "hospitality"],
    "Melaka Tengah": ["semiconductor", "hospitality", "automotive"], "Seremban": ["automotive", "logistics", "construction"], "Port Dickson": ["hospitality"]
  };
  const LOCATION_STATE = { "Kuala Lumpur": "KUL", Selangor: "SEL", Penang: "PNG", Johor: "JHR", Perak: "PRK" };

  const COMPANIES = {
    semiconductor: ["Intel Malaysia", "Infineon", "Inari Amertron", "ViTrox", "Greatech", "Osram Opto", "Micron"],
    software: ["Grab", "GXBank", "Setel", "iPay88", "MoneyLion", "Fusionex", "Aerodyne"],
    digitalmedia: ["Astro", "Media Prima", "Lemon Sky Studios", "Les' Copaque", "Primeworks", "Lion Studios"],
    logistics: ["Pos Malaysia", "GDex", "J&T Express", "Westports", "MMC Logistics", "DHL Malaysia"],
    automotive: ["Proton", "Perodua", "UMW Toyota", "Honda Malaysia", "Sime Darby Motors"],
    oilgas: ["Petronas", "Shell Malaysia", "Sapura Energy", "Dialog Group", "Bumi Armada"],
    hospitality: ["Genting", "Shangri-La", "Sunway Resort", "YTL Hotels", "Berjaya Hotels"],
    healthcare: ["KPJ Healthcare", "IHH Pantai", "Columbia Asia", "Sunway Medical", "BP Healthcare"],
    construction: ["Gamuda", "IJM", "Sunway Construction", "WCT Holdings", "MRCB"],
    agriculture: ["Sime Darby Plantation", "FGV Holdings", "IOI Corporation", "KL Kepong"]
  };
  const INSTITUTIONS = {
    semiconductor: ["Penang Skills Dev. Centre", "German-Malaysian Institute", "Politeknik Seberang Perai", "British Malaysian Institute"],
    software: ["APU", "HRD Corp bootcamps", "Politeknik Kuala Lumpur", "ADTEC Shah Alam"],
    digitalmedia: ["The One Academy", "Multimedia University", "IACT College", "Politeknik (multimedia)"],
    logistics: ["ALAM Melaka", "Netherlands Maritime Inst.", "Politeknik (logistics)", "MARA Skills"],
    automotive: ["ADTEC", "IKBN", "Politeknik (automotive)", "Proton Academy"],
    oilgas: ["INSTEP", "Univ. Teknologi PETRONAS", "Kolej Kemahiran Tinggi MARA", "Politeknik (O&G)"],
    hospitality: ["Taylor's Culinary", "KDU Hospitality", "IKBN Hospitality", "Politeknik (tourism)"],
    healthcare: ["MARA Nursing College", "Allied Health College", "Politeknik (health)", "KPJ Uni College"],
    construction: ["CIDB Academy", "IKBN Construction", "Politeknik (civil)", "ABM"],
    agriculture: ["TVET Agropolitan", "Politeknik (agro)", "IKBN Agro", "Univ. Putra extension"]
  };
  const SKILLCOLORS = { semi: "#3b82f6", soft: "#22d3ee", media: "#8b5cf6", logi: "#f59e0b", auto: "#ec4899", oil: "#ef4444", hosp: "#10b981", health: "#eab308", cons: "#94a3b8", agri: "#84cc16" };

  function hash(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return (((h ^= h >>> 16) >>> 0) / 4294967296); }
  function aff(s, sec) { return s.aff[sec] != null ? s.aff[sec] : 0.22; }
  function hubMul(name, sector) { for (const key in HUB) { if (name.indexOf(key) >= 0 && HUB[key].indexOf(sector) >= 0) return 1.85; } return 1; }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }

  /* ---- state-level data ---- */
  const RAW = {};
  STATES.forEach(s => { RAW[s.id] = {}; SKILLS.forEach(k => {
    const base = Math.pow(s.scale, 0.62) * (0.22 + 0.78 * aff(s, k.sector));
    const sb = (SUPPLY_BOOST[k.id] && SUPPLY_BOOST[k.id][s.id]) || 1;
    const db = (DEMAND_BOOST[k.id] && DEMAND_BOOST[k.id][s.id]) || 1;
    RAW[s.id][k.id] = { s: base * (0.8 + 0.4 * hash(s.id + k.id + "s")) * sb, d: base * (0.8 + 0.4 * hash(s.id + k.id + "d")) * db };
  }); });
  function aggRaw(s) { let S = 0, D = 0; SKILLS.forEach(k => { S += RAW[s.id][k.id].s; D += RAW[s.id][k.id].d; }); return { s: S, d: D }; }
  const NORM = {}; STATES.forEach(s => NORM[s.id] = {});
  (function () { ["all", ...SKILLS.map(k => k.id)].forEach(kid => { let ms = 0, md = 0;
    STATES.forEach(s => { const r = kid === "all" ? aggRaw(s) : RAW[s.id][kid]; ms = Math.max(ms, r.s); md = Math.max(md, r.d); });
    STATES.forEach(s => { const r = kid === "all" ? aggRaw(s) : RAW[s.id][kid]; NORM[s.id][kid] = { s: Math.round(r.s / ms * 100), d: Math.round(r.d / md * 100) }; }); }); })();
  function cell(sid, kid) { const n = NORM[sid][kid]; return { supply: n.s, demand: n.d, gap: n.d - n.s }; }

  /* ---- district-level data (modelled within each state) ---- */
  const DCACHE = {};
  function draw1(sid, d, kid) { const s = STATES.find(x => x.id === sid); const sec = SKILLS.find(k => k.id === kid).sector; const a = aff(s, sec);
    return { s: (0.5 + 0.9 * hash(d.id + kid + "s")) * (0.30 + 0.70 * a),
      d: (0.5 + 0.9 * hash(d.id + kid + "d")) * (0.30 + 0.70 * a) * hubMul(d.name, sec) }; }
  function distCells(sid, kid) {
    const key = sid + "|" + kid; if (DCACHE[key]) return DCACHE[key];
    const ds = DGEO.states[sid].districts;
    const raw = ds.map(d => { let S = 0, D = 0; if (kid === "all") { SKILLS.forEach(k => { const r = draw1(sid, d, k.id); S += r.s; D += r.d; }); }
      else { const r = draw1(sid, d, kid); S = r.s; D = r.d; } return { d, S, D }; });
    const ms = Math.max(...raw.map(r => r.S)) || 1, md = Math.max(...raw.map(r => r.D)) || 1;
    const res = {}; raw.forEach(r => { const su = Math.round(r.S / ms * 100), de = Math.round(r.D / md * 100);
      res[r.d.id] = { supply: su, demand: de, gap: de - su, name: r.d.name }; });
    DCACHE[key] = res; return res;
  }

  /* ---- view state (kept across re-mounts) ---- */
  let mode = "overlay", skill = "all", selected = null, home = null, level = "nation", activeState = null, selDist = null, view = "3d";
  let started = false, mounted = false, root = null, els = {};
  try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (stored && ["skills", "industry", "overlay"].includes(stored.mode)) mode = stored.mode; } catch (error) { /* storage can be unavailable on file origins */ }
  function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode })); } catch (error) { /* ignore */ } }

  /* ---- colours ---- */
  const TOKENS = {
    "--bg": "--atlas-bg", "--surface": "--atlas-surface", "--surface-2": "--atlas-surface2",
    "--line": "--atlas-line", "--line-soft": "--atlas-line-soft", "--ink": "--atlas-ink",
    "--ink-dim": "--atlas-dim", "--ink-faint": "--atlas-faint", "--supply": "--atlas-supply",
    "--supply-lo": "--atlas-supply-lo", "--demand": "--atlas-demand", "--demand-lo": "--atlas-demand-lo",
    "--pos": "--atlas-pos", "--neg": "--atlas-neg", "--neutral": "--atlas-neutral", "--sea": "--atlas-sea"
  };
  function cssv(n) { return getComputedStyle(root).getPropertyValue(TOKENS[n] || n).trim(); }
  function toRgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function toHex(a) { return "#" + a.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join(""); }
  function mix(c1, c2, t) { const a = toRgb(c1), b = toRgb(c2); return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  function colorFromCell(c) {
    if (mode === "skills") return mix(cssv("--supply-lo"), cssv("--supply"), Math.max(.12, c.supply / 100));
    if (mode === "industry") return mix(cssv("--demand-lo"), cssv("--demand"), Math.max(.12, c.demand / 100));
    const g = c.gap / gapMax; return g >= 0 ? mix(cssv("--neutral"), cssv("--pos"), Math.max(.08, g)) : mix(cssv("--neutral"), cssv("--neg"), Math.max(.08, -g));
  }
  let gapMax = 100;
  function updateGapMax(districts = false) {
    if (mode !== "overlay") return;
    if (districts && activeState) {
      gapMax = Math.max(1, ...Object.values(distCells(activeState, skill)).map(c => Math.abs(c.gap)));
    } else {
      gapMax = Math.max(1, ...STATES.map(s => Math.abs(cell(s.id, skill).gap)));
    }
  }

  /* ---- 2D zoom ---- */
  let curVB = [0, 0, GEO.w, GEO.h];
  function setVB(v) { if (!els.map) return; curVB = v; els.map.setAttribute("viewBox", `${v[0].toFixed(1)} ${v[1].toFixed(1)} ${v[2].toFixed(1)} ${v[3].toFixed(1)}`); }
  function tweenVB(to, dur) { if (reduceMotion) { setVB(to); return; } const from = curVB.slice(); const t0 = performance.now();
    (function step(t) { if (!els.map) return; let p = Math.min(1, (t - t0) / dur); p = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setVB(from.map((v, i) => v + (to[i] - v) * p)); if (p < 1) requestAnimationFrame(step); })(performance.now()); }
  function stateVB(sid) { const b = (DGEO.states[sid] && DGEO.states[sid].bbox) || [0, 0, GEO.w, GEO.h];
    let [x0, y0, x1, y1] = b; const pad = Math.max(x1 - x0, y1 - y0) * 0.12; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const ar = GEO.w / GEO.h; let bw = x1 - x0, bh = y1 - y0; if (bw / bh > ar) bh = bw / ar; else bw = bh * ar;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; return [cx - bw / 2, cy - bh / 2, bw, bh]; }
  function drill(sid) { if (!DGEO.states[sid] || !DGEO.states[sid].districts.length) return;
    activeState = sid; level = "district"; selected = sid; selDist = null; render(); tweenVB(stateVB(sid), 520); }
  function goNation() { level = "nation"; activeState = null; selDist = null; render(); tweenVB([0, 0, GEO.w, GEO.h], 520); }
  function stateName(id) { const s = STATES.find(x => x.id === id); return s ? s.name : id; }

  /* ---- 2D render ---- */
  function regionAria(name, c, kind) {
    return `${esc(name)}: supply ${c.supply}, demand ${c.demand}, gap ${c.gap > 0 ? "+" : ""}${c.gap}. ${kind}`;
  }
  function stateLabels() {
    const items = STATES.map(s => {
      const g = GEO.states[s.id]; if (!g) return null;
      const lines = labelLines(s.name);
      const size = 11;
      return { g, lines, size,
        w: Math.max(...lines.map(line => line.length)) * size * .58 + 3,
        h: lines.length * size * 1.14 + 2 };
    }).filter(Boolean);
    // Labels stay centred on their state; crowded ones shrink instead of moving.
    for (let pass = 0; pass < 16; pass++) {
      let changed = false;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i], b = items[j];
          if (Math.abs(a.g.cx - b.g.cx) >= (a.w + b.w) / 2 || Math.abs(a.g.cy - b.g.cy) >= (a.h + b.h) / 2) continue;
          [a, b].forEach(item => {
            if (item.size > 7) {
              item.size = Math.max(7, item.size * .88);
              item.w = Math.max(...item.lines.map(line => line.length)) * item.size * .58 + 3;
              item.h = item.lines.length * item.size * 1.14 + 2;
              changed = true;
            }
          });
        }
      }
      if (!changed) break;
    }
    return items.map(({ g, lines, size }) => {
      const lineHeight = size * 1.12;
      const spans = lines.map((line, index) => `<tspan x="${g.cx.toFixed(1)}" y="${(g.cy + (index - (lines.length - 1) / 2) * lineHeight).toFixed(1)}">${esc(line)}</tspan>`).join("");
      return `<text class="state-label" x="${g.cx.toFixed(1)}" y="${g.cy.toFixed(1)}" text-anchor="middle" dominant-baseline="central" style="font-size:${size.toFixed(1)}px;stroke-width:${(size * .24).toFixed(1)}px">${spans}</text>`;
    }).join("");
  }
  function buildMap() {
    if (!els.map) return;
    updateGapMax(level === "district");
    let svg = `<rect class="sea" x="0" y="0" width="${GEO.w}" height="${GEO.h}" rx="12"/>`;
    if (level === "nation") {
      svg += `<text class="searegion" x="${(GEO.w * 0.52).toFixed(0)}" y="${(GEO.h * 0.60).toFixed(0)}" text-anchor="middle">LAUT CHINA SELATAN</text>`;
      STATES.forEach(s => { const g = GEO.states[s.id]; if (!g) return; const c = cell(s.id, skill);
        const cls = ["state"]; if (selected === s.id) cls.push("sel"); if (home === s.id) cls.push("home");
        svg += `<path class="${cls.join(" ")}" d="${g.path}" fill="${colorFromCell(c)}" data-id="${s.id}" tabindex="0" role="button" aria-label="${regionAria(s.name, c, "Press Enter to explore its districts.")}"></path>`; });
      svg += stateLabels();
    } else {
      STATES.forEach(s => { if (s.id === activeState) return; const g = GEO.states[s.id]; if (!g) return;
        svg += `<path class="state-context" d="${g.path}" data-drill="${s.id}" aria-hidden="true"></path>`; });
      const dc = distCells(activeState, skill), ds = DGEO.states[activeState].districts;
      ds.forEach(d => { const c = dc[d.id]; const cls = ["district"]; if (selDist === d.id) cls.push("sel");
        svg += `<path class="${cls.join(" ")}" d="${d.path}" fill="${colorFromCell(c)}" data-dist="${d.id}" tabindex="0" role="button" aria-label="${regionAria(d.name, c, "Press Enter to select this district.")}"></path>`; });
      svg += `<path class="active-outline" d="${GEO.states[activeState].path}"/>`;
      if (ds.length <= 16) {
        const bw = stateVB(activeState)[2]; const LS = (bw * 0.021); const SW = (LS * 0.22).toFixed(2);
        const placed = [];
        const candidates = ds.map(d => {
          const width = d.name.length * LS * 0.58, height = LS * 1.05;
          return { d, hub: HUB[d.name] ? 1 : 0, box: { x1: d.cx - width / 2, y1: d.cy - height / 2, x2: d.cx + width / 2, y2: d.cy + height / 2 } };
        }).sort((a, b) => b.hub - a.hub || a.d.name.length - b.d.name.length);
        candidates.forEach(({ d, box }) => {
          if (placed.some(p => !(box.x2 < p.x1 || box.x1 > p.x2 || box.y2 < p.y1 || box.y1 > p.y2))) return;
          placed.push(box);
          svg += `<text class="state-label" style="font-size:${LS.toFixed(2)}px;stroke-width:${SW}px" x="${d.cx}" y="${(d.cy + LS * 0.33).toFixed(1)}" text-anchor="middle">${esc(d.name)}</text>`;
        });
      }
    }
    els.map.innerHTML = svg;
    els.map.querySelectorAll(".state").forEach(n => {
      n.addEventListener("click", () => { selected = n.dataset.id; render(); });
      n.addEventListener("dblclick", () => drill(n.dataset.id));
      n.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); drill(n.dataset.id); }
        else if (e.key === " ") { e.preventDefault(); selected = n.dataset.id; render(); }
      }); });
    els.map.querySelectorAll("[data-drill]").forEach(n => n.addEventListener("click", () => drill(n.dataset.drill)));
    els.map.querySelectorAll(".district").forEach(n => { const pick = () => { selDist = n.dataset.dist; render(); };
      n.addEventListener("click", pick); n.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }); });
  }

  function buildCrumb() { const el = els.crumb; if (!el) return;
    if (level === "nation") { el.hidden = true; el.innerHTML = ""; return; }
    const s = STATES.find(x => x.id === activeState); el.hidden = false;
    el.innerHTML = `<button type="button" class="crumb-home" data-atlas-home>← Malaysia</button><span class="sep">›</span><span class="cur">${esc(s.name)}</span>`;
    el.querySelector("[data-atlas-home]").addEventListener("click", goNation); }

  function buildLegend() { const el = els.legend; if (!el) return;
    if (mode === "overlay") {
      el.innerHTML = `<div class="ltitle">The gap</div>
        <div class="lbar" style="background:linear-gradient(90deg,${cssv("--neg")},${cssv("--neutral")},${cssv("--pos")})" aria-hidden="true"></div>
        <div class="lrow"><span>Oversupply</span><span>Balanced</span><span>Shortage</span></div>
        <div class="lhint">Colour intensity scales to the largest gap in view.</div>`;
    } else { const hi = mode === "skills" ? cssv("--supply") : cssv("--demand"); const lo = mode === "skills" ? cssv("--supply-lo") : cssv("--demand-lo");
      el.innerHTML = `<div class="ltitle">${mode === "skills" ? "Training supply" : "Hiring demand"} index</div>
        <div class="lbar" style="background:linear-gradient(90deg,${lo},${hi})" aria-hidden="true"></div>
        <div class="lrow"><span>Low</span><span>High</span></div>`; }
  }

  /* ---- sidebar ---- */
  function skillName3(kid) { return SKILLS.find(k => k.id === kid).name; }
  function sectorOf(kid) { return SKILLS.find(k => k.id === kid).sector; }
  function entRow(name, kid, val) { const col = SKILLCOLORS[kid];
    return `<div class="sb-row2"><span class="n">${esc(name)}</span><span class="sec" style="color:${col};background:color-mix(in srgb,${col} 18%,transparent)">${esc(skillName3(kid))}</span><span class="v">${val}</span></div>`; }
  function regionDisplayName(rid) { if (rid.indexOf("-") >= 0) { const sid = rid.split("-")[0]; const d = DGEO.states[sid].districts.find(x => x.id === rid); return (d ? d.name : rid) + ", " + stateName(sid); } return stateName(rid); }
  function cellFor(rid, kid) { return rid.indexOf("-") >= 0 ? distCells(rid.split("-")[0], kid)[rid] : cell(rid, kid); }
  function pickN(pool, seed, n) { return (pool || []).map(nm => ({ nm, s: hash(seed + nm) })).sort((a, b) => a.s - b.s).slice(0, Math.min(n, (pool || []).length)).map(o => o.nm); }
  function distribute(names, seed, total) { let it = names.map(nm => ({ nm, w: 0.45 + hash(seed + nm + "w") })); const ws = it.reduce((s, i) => s + i.w, 0) || 1;
    it = it.map(i => ({ nm: i.nm, count: Math.max(1, Math.round(total * i.w / ws)) })); it.sort((a, b) => b.count - a.count); return it; }
  function pieSVG(parts, size) { const R = size / 2, cx = R, cy = R; let a0 = -Math.PI / 2; const total = parts.reduce((s, p) => s + p.value, 0) || 1; let d = "";
    parts.forEach(p => { if (p.value <= 0) return; const f = p.value / total; const a1 = a0 + f * 2 * Math.PI;
      if (f > 0.9999) { d += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p.color}"/>`; }
      else { const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1), lg = f > 0.5 ? 1 : 0;
        d += `<path d="M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 ${lg} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z" fill="${p.color}"/>`; }
      a0 = a1; });
    d += `<circle cx="${cx}" cy="${cy}" r="${(R * 0.54).toFixed(1)}" fill="${cssv("--surface")}"/>`;
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true" style="display:block">${d}</svg>`; }
  function skillParts(rid, measure) { return SKILLS.map(k => ({ label: k.name, kid: k.id, value: rawSkillVal(rid, k.id, measure), color: SKILLCOLORS[k.id] })).filter(p => p.value > 0).sort((a, b) => b.value - a.value); }

  function gapBars(supply, demand) { const gap = demand - supply;
    return `<div class="gapbars">
      <div class="gapbar"><div class="lab"><span>Supply</span><span>${supply}</span></div><div class="tr"><div class="fl" style="width:${supply}%;background:${cssv("--supply")}"></div></div></div>
      <div class="gapbar"><div class="lab"><span>Demand</span><span>${demand}</span></div><div class="tr"><div class="fl" style="width:${demand}%;background:${cssv("--demand")}"></div></div></div>
      <div class="sb-total"><span>Gap (demand − supply)</span><span style="color:${gap >= 0 ? cssv("--pos") : cssv("--neg")}">${gap > 0 ? "+" : ""}${gap}</span></div></div>`; }
  function verdictText(gap, sk) { if (gap >= 12) return { cls: "op", html: `<b>Opportunity zone.</b> Demand for ${sk} outstrips local supply — strong openings for those who train up.` };
    if (gap <= -12) return { cls: "ov", html: `<b>Oversupply.</b> More ${sk} talent is trained than hired locally — consider relocation or adjacent in-demand skills.` };
    return { cls: "", html: `<b>Roughly balanced.</b> Supply and demand for ${sk} track each other here.` }; }

  function demandContent(rid) {
    let html = "";
    if (skill === "all") {
      const parts = skillParts(rid, "d");
      html += `<div class="sb-grid"><div class="pie-wrap">${pieSVG(parts, 150)}</div><div><div class="sb-sub first">Demand mix by skill</div><div class="pie-legend">${parts.slice(0, 6).map(p => `<span><i style="background:${p.color}"></i>${esc(p.label)}</span>`).join("")}</div></div></div>`;
      let comp = []; SKILLS.forEach(k => { const di = cellFor(rid, k.id).demand;
        (COMPANIES[k.sector] || []).forEach(nm => comp.push({ nm, kid: k.id, count: Math.max(1, Math.round(di * (0.3 + 0.5 * hash(rid + nm)) * 0.45)) })); });
      comp.sort((a, b) => b.count - a.count);
      html += `<div class="sb-sub">Who's hiring — all employers (sample)</div><div class="sb-scroll">${comp.map(c => entRow(c.nm, c.kid, c.count + " roles")).join("")}</div>`;
    } else {
      const sec = sectorOf(skill), c = cellFor(rid, skill), total = Math.round(c.demand * 1.6 + 5);
      const it = distribute(pickN(COMPANIES[sec], rid + sec, 6), rid + sec, total);
      html += `<div class="sb-sub first">Sample employers hiring · ${esc(skillName3(skill))}</div><div class="sb-list">${it.map(c => `<div class="sb-row"><span class="n">${esc(c.nm)}</span><span class="v">${c.count} roles</span></div>`).join("")}</div>`;
      html += `<div class="sb-total"><span>Total sample open roles</span><span>${total}</span></div>`;
    }
    return html + `<div class="disc">Illustrative employers &amp; role counts — in production these come from geocoded MYFutureJobs postings.</div>`;
  }
  function supplyContent(rid) {
    let html = "";
    if (skill === "all") {
      const parts = skillParts(rid, "s");
      html += `<div class="sb-grid"><div class="pie-wrap">${pieSVG(parts, 150)}</div><div><div class="sb-sub first">Supply mix by skill</div><div class="pie-legend">${parts.slice(0, 6).map(p => `<span><i style="background:${p.color}"></i>${esc(p.label)}</span>`).join("")}</div></div></div>`;
      let inst = []; SKILLS.forEach(k => { const si = cellFor(rid, k.id).supply;
        (INSTITUTIONS[k.sector] || []).forEach(nm => inst.push({ nm, kid: k.id, count: Math.max(2, Math.round(si * (0.4 + 0.5 * hash(rid + nm)) * 0.8)) })); });
      inst.sort((a, b) => b.count - a.count);
      const users = Math.round(cellFor(rid, "all").supply * 2 + 20);
      html += `<div class="sb-sub">Where it's trained — all institutions (sample)</div><div class="sb-scroll">${inst.map(c => entRow(c.nm, c.kid, c.count + "/yr")).join("")}</div>`;
      html += `<div class="sb-total"><span>JomWorkLah users (all skills)</span><span>${users}</span></div>`;
    } else {
      const sec = sectorOf(skill), c = cellFor(rid, skill), grads = Math.round(c.supply * 3 + 15), users = Math.round(c.supply * 1.1 + 6);
      const it = distribute(pickN(INSTITUTIONS[sec], rid + sec, 5), rid + sec, grads);
      html += `<div class="sb-sub first">Where it's trained · ${esc(skillName3(skill))}</div><div class="sb-list">${it.map(c => `<div class="sb-row"><span class="n">${esc(c.nm)}</span><span class="v">${c.count}/yr</span></div>`).join("")
        }<div class="sb-row"><span class="n">Users on JomWorkLah with this skill</span><span class="v">${users}</span></div></div>`;
      html += `<div class="sb-total"><span>Trained supply (sample)</span><span>${grads + users}</span></div>`;
    }
    return html + `<div class="disc">Illustrative institutions &amp; counts — in production, supply = TVET graduate output (UP_TVET/NOSS) + anonymised platform users.</div>`;
  }
  function gapContent(rid) {
    let html = "";
    if (skill === "all") {
      const c = cellFor(rid, "all"); html += gapBars(c.supply, c.demand);
      const rows = SKILLS.map(k => ({ k, c: cellFor(rid, k.id) })).sort((a, b) => b.c.gap - a.c.gap);
      const maxGap = Math.max(1, ...rows.map(r => Math.abs(r.c.gap)));
      html += `<div class="sb-sub">Gap by skill (demand − supply)</div><div class="sb-list">${rows.map(r => { const g = r.c.gap; const w = Math.min(50, Math.abs(g) / maxGap * 50); const col = g >= 0 ? cssv("--pos") : cssv("--neg");
        return `<div class="ps-row"><span class="nm">${esc(r.k.name)}</span><span class="track"><span class="div-mid"></span><span class="fill" style="${g >= 0 ? "left:50%" : "right:50%"};width:${w}%;background:${col}"></span></span><span class="v">${g > 0 ? "+" : ""}${g}</span></div>`; }).join("")}</div>`;
    } else {
      const c = cellFor(rid, skill); html += gapBars(c.supply, c.demand);
      const v = verdictText(c.gap, skillName3(skill)); html += `<div class="verdict ${v.cls}" style="margin-top:12px">${v.html}</div>`;
    }
    return html + `<div class="disc">Gap = demand index − supply index, normalised per skill. Positive = shortage (opportunity).</div>`;
  }

  function buildSidebar() { const el = els.sidecard; if (!el) return;
    const rid = selDist || selected;
    const modeLabel = mode === "skills" ? "Training supply" : mode === "industry" ? "Hiring demand" : "The gap";
    if (!rid) {
      el.innerHTML = `<div class="sb-head"><h2>Explore the atlas</h2><p class="sub">Select a ${view === "3d" ? "column" : "state"} to see its breakdown.</p></div>
        <div class="verdict">Click any region to compare training supply, hiring demand and the gap${home ? ` — your profile location, ${esc(stateName(home))}, is outlined in orange` : ""}.</div>`;
      return;
    }
    const name = regionDisplayName(rid);
    const skName = skill === "all" ? "all skills" : skillName3(skill);
    let html = `<div class="sb-head"><h2>${esc(name)}</h2><p class="sub">${modeLabel} · ${esc(skName)}</p></div>`;
    if (view === "2d" && level === "nation" && rid.indexOf("-") < 0) { html += `<button type="button" class="drillbtn" data-atlas-drill>Explore ${esc(name)}'s districts →</button>`; }
    if (mode === "overlay") html += gapContent(rid);
    else if (mode === "skills") html += supplyContent(rid);
    else html += demandContent(rid);
    el.innerHTML = html;
    const drillButton = el.querySelector("[data-atlas-drill]"); if (drillButton) drillButton.addEventListener("click", () => drill(rid));
  }

  function hoverHTML(rid) {
    const name = regionDisplayName(rid);
    const ml = mode === "skills" ? "Supply" : mode === "industry" ? "Demand" : "Gap";
    let body = "";
    if (skill !== "all") {
      const c = cellFor(rid, skill);
      const val = mode === "skills" ? c.supply : mode === "industry" ? c.demand : c.gap;
      const color = mode === "skills" ? cssv("--supply") : mode === "industry" ? cssv("--demand") : (c.gap >= 0 ? cssv("--pos") : cssv("--neg"));
      const sign = (mode === "overlay" && val > 0) ? "+" : "";
      body = `<div class="tv" style="color:${color}">${sign}${val}</div><div class="tl">${ml} index &middot; ${esc(skillName3(skill))}</div>`;
    } else if (mode !== "overlay") {
      const m = mode === "skills" ? "s" : "d";
      const parts = SKILLS.map(k => ({ name: k.name, v: rawSkillVal(rid, k.id, m), col: SKILLCOLORS[k.id] })).filter(p => p.v > 0).sort((a, b) => b.v - a.v);
      const total = parts.reduce((s, p) => s + p.v, 0) || 1;
      const bar = parts.map(p => `<span style="width:${(p.v / total * 100).toFixed(2)}%;background:${p.col}"></span>`).join("");
      body = `<div class="tbar">${bar}</div>` + parts.slice(0, 6).map(p => `<div class="trow"><span class="d" style="background:${p.col}"></span><span class="nn">${esc(p.name)}</span><span class="vv">${Math.round(p.v / total * 100)}%</span></div>`).join("");
    } else {
      const rows = SKILLS.map(k => ({ name: k.name, g: cellFor(rid, k.id).gap, col: SKILLCOLORS[k.id] })).sort((a, b) => b.g - a.g);
      body = rows.map(r => `<div class="trow"><span class="d" style="background:${r.col}"></span><span class="nn">${esc(r.name)}</span><span class="vv" style="color:${r.g >= 0 ? cssv("--pos") : cssv("--neg")}">${r.g > 0 ? "+" : ""}${r.g}</span></div>`).join("");
    }
    return `<div class="tn">${esc(name)}</div><div class="tsub">${ml}${skill === "all" ? " composition" : ""}</div>${body}`;
  }
  function showHoverTip(e, rid) { const tip = els.tip; if (!tip) return;
    tip.innerHTML = hoverHTML(rid); tip.hidden = false;
    const w = tip.offsetWidth || 200, h = tip.offsetHeight || 120; let x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
    if (y + h > window.innerHeight - 8) y = Math.max(8, window.innerHeight - h - 8);
    tip.style.left = x + "px"; tip.style.top = y + "px"; }
  function hideHoverTip() { if (els.tip) els.tip.hidden = true; }

  /* ====================== 3D view ====================== */
  let lod3d = "state", tween3d = null, three = {}, threePromise = null;
  const S3 = 100 / GEO.w, CX3 = GEO.w / 2, CY3 = GEO.h / 2;
  const wx = x => (x - CX3) * S3, wz = y => (y - CY3) * S3;
  const MAXH = 22, FIXEDH = 4.2, BASE_Y = 0.66, SWITCH_IN = 38, SWITCH_OUT = 54;
  const DMAP = {}; Object.keys(DGEO.states).forEach(sid => DGEO.states[sid].districts.forEach(d => DMAP[d.id] = { sid, d }));

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src; script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load " + src));
      document.head.appendChild(script);
    });
  }
  function loadThree() {
    if (window.THREE && window.THREE.OrbitControls && window.THREE.BufferGeometryUtils) return Promise.resolve(true);
    if (!threePromise) {
      threePromise = loadScript(THREE_URL)
        .then(() => Promise.all([loadScript(CONTROLS_URL), loadScript(UTILS_URL)]))
        .then(() => Boolean(window.THREE && window.THREE.OrbitControls))
        .catch(() => false);
    }
    return threePromise;
  }

  function parseRings(d) { const r = []; d.split("M").filter(Boolean).forEach(sp => { sp = sp.replace(/Z$/, "");
    const pts = sp.split("L").map(t => { const a = t.split(","); return { x: +a[0], y: +a[1] }; }).filter(p => isFinite(p.x) && isFinite(p.y));
    if (pts.length >= 3) r.push(pts); }); return r; }
  function seaColor() { return cssv("--sea"); }
  function landColor() { return cssv("--surface-2"); }
  function borderCol() { return cssv("--ink-faint"); }
  function parentOf(rid) { return rid.indexOf("-") >= 0 ? rid.split("-")[0] : rid; }
  function centroidOf(rid) { return rid.indexOf("-") >= 0 ? DMAP[rid].d : GEO.states[rid]; }
  function rawSkillVal(rid, kid, measure) { if (rid.indexOf("-") >= 0) { return draw1(DMAP[rid].sid, DMAP[rid].d, kid)[measure]; } return RAW[rid][kid][measure]; }
  function regionCell(rid) { if (rid.indexOf("-") >= 0) { return distCells(DMAP[rid].sid, skill)[rid]; } return cell(rid, skill); }
  function regionSkillGap(rid, kid) { return rid.indexOf("-") >= 0 ? distCells(DMAP[rid].sid, kid)[rid].gap : cell(rid, kid).gap; }
  function regionName(rid) { return rid.indexOf("-") >= 0 ? DMAP[rid].d.name : stateName(rid); }

  function ringLine(ring, y, opacity) { const pts = ring.map(p => new THREE.Vector3(wx(p.x), y, wz(p.y)));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: borderCol(), transparent: true, opacity })); }
  function unitPrismFor(path) { const shapes = parseRings(path).map(r => new THREE.Shape(r.map(p => new THREE.Vector2(wx(p.x), -wz(p.y)))));
    const g = new THREE.ExtrudeGeometry(shapes, { depth: 1, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
    g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, 0); return g; }
  function cachePrism(rid) { if (three.prismCache[rid]) return three.prismCache[rid];
    const path = rid.indexOf("-") >= 0 ? DMAP[rid].d.path : GEO.states[rid].path;
    return three.prismCache[rid] = unitPrismFor(path); }

  function updateColors3D() { if (!three.renderer) return;
    three.renderer.setClearColor(cssv("--bg"), 1);
    three.landMat.color.set(landColor()); three.sea.material.color.set(seaColor());
    [three.stateBorders, three.districtBorders].forEach(g => { if (g) g.children.forEach(l => l.material.color.set(borderCol())); });
    if (three.labelCache) { Object.values(three.labelCache).forEach(sp => { if (sp.material.map) sp.material.map.dispose(); sp.material.dispose(); }); three.labelCache = {}; clearLabelGroup(); } }

  function init3D(container) {
    if (!window.THREE || !container) return;
    const w = container.clientWidth || 900, h = container.clientHeight || 520;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 3000); camera.position.set(0, 55, 75);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h); renderer.setClearColor(cssv("--bg"), 1);
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "3D map of Malaysia skills supply, demand and gaps. Drag to orbit and scroll to zoom.");
    container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.82));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.7); d1.position.set(45, 120, 60); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xffffff, 0.22); d2.position.set(-60, 50, -50); scene.add(d2);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 320), new THREE.MeshBasicMaterial({ color: seaColor() }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -0.25; scene.add(sea);
    const plate = new THREE.Group();
    const landMat = new THREE.MeshStandardMaterial({ color: landColor(), roughness: 0.95, metalness: 0 });
    Object.values(GEO.states).forEach(g => { parseRings(g.path).forEach(r => {
      const shape = new THREE.Shape(r.map(p => new THREE.Vector2(wx(p.x), -wz(p.y))));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
      plate.add(new THREE.Mesh(geo, landMat)); }); });
    scene.add(plate);
    const sb = new THREE.Group();
    Object.values(GEO.states).forEach(g => parseRings(g.path).forEach(r => sb.add(ringLine(r, 0.60, 0.9)))); scene.add(sb);
    const dbg = new THREE.Group(); dbg.visible = false;
    Object.values(DGEO.states).forEach(st => st.districts.forEach(d => parseRings(d.path).forEach(r => dbg.add(ringLine(r, 0.62, 0.5))))); scene.add(dbg);
    const cols = new THREE.Group(); scene.add(cols);
    const labelGroup = new THREE.Group(); scene.add(labelGroup);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enablePan = true; controls.screenSpacePanning = true; controls.panSpeed = 0.9;
    controls.minDistance = 24; controls.maxDistance = 320; controls.maxPolarAngle = Math.PI * 0.49; controls.target.set(0, 2, 0);
    const mats = {}; SKILLS.forEach(k => mats[k.id] = new THREE.MeshStandardMaterial({ color: SKILLCOLORS[k.id], roughness: 0.55, metalness: 0.05 }));
    const vcMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05 });
    const pickMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    const resizeObserver = window.ResizeObserver ? new ResizeObserver(resize3D) : null;
    if (resizeObserver) resizeObserver.observe(container);
    three = { scene, camera, renderer, controls, cols, labelGroup, plate, landMat, sea, mats, vcMat, pickMat, container, prismCache: {}, labelCache: {}, topY: null,
      stateBorders: sb, districtBorders: dbg, raycaster: new THREE.Raycaster(), pick: [], dx: 0, dy: 0, resizeObserver, raf: 0 };
    const dom = renderer.domElement;
    dom.addEventListener("pointermove", onHover);
    dom.addEventListener("pointerdown", e => { three.dx = e.clientX; three.dy = e.clientY; });
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointerleave", hideHoverTip);
    window.addEventListener("resize", resize3D);
    animate();
  }

  function dispose3D() {
    if (!three || !three.renderer) { three = {}; return; }
    if (three.raf) cancelAnimationFrame(three.raf);
    if (three.resizeObserver) three.resizeObserver.disconnect();
    window.removeEventListener("resize", resize3D);
    try {
      Object.values(three.labelCache || {}).forEach(sprite => { if (sprite.material) { if (sprite.material.map) sprite.material.map.dispose(); sprite.material.dispose(); } });
      Object.values(three.mats || {}).forEach(material => material.dispose());
      [three.vcMat, three.pickMat, three.landMat].forEach(material => { if (material) material.dispose(); });
      if (three.sea && three.sea.material) three.sea.material.dispose();
      Object.values(three.prismCache || {}).forEach(geometry => geometry.dispose());
      three.renderer.dispose();
      if (three.renderer.forceContextLoss) three.renderer.forceContextLoss();
      three.renderer.domElement.remove();
    } catch (error) { /* renderer may already be gone */ }
    three = {}; lod3d = "state"; tween3d = null;
  }

  function ensure3D() {
    if (three.renderer) return true;
    if (!window.THREE) return false;
    els.threeMsg.hidden = true;
    try { init3D(els.scene3d); return true; }
    catch (error) { els.scene3d.innerHTML = ""; if (els.reset) els.reset.hidden = true; show3DMessage("The 3D view could not start in this browser. The 2D map still works."); return false; }
  }
  function show3DMessage(message) { if (!els.threeMsg) return; els.threeMsg.innerHTML = message; els.threeMsg.hidden = false; }

  function updateBorders() { if (three.stateBorders) three.stateBorders.visible = true;
    if (three.districtBorders) three.districtBorders.visible = (lod3d === "district"); }

  function listRegionIds(districts) {
    let ids = [];
    if (!districts) ids = STATES.map(s => s.id);
    else STATES.forEach(s => DGEO.states[s.id].districts.forEach(d => ids.push(d.id)));
    if (districts) { if (selDist) ids = ids.filter(i => i === selDist); else if (selected) ids = ids.filter(i => parentOf(i) === selected); }
    else { if (selected) ids = ids.filter(i => i === selected); }
    return ids;
  }

  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function makeLabelSprite(id) {
    const lines = labelLines(regionName(id));
    const fs = 42, pad = 14, lh = Math.round(fs * 1.08);
    const family = '"Instrument Sans", system-ui, sans-serif';
    const cv = document.createElement("canvas"); const ctx = cv.getContext("2d");
    ctx.font = "700 " + fs + "px " + family;
    const tw = Math.max(...lines.map(line => ctx.measureText(line).width));
    cv.width = Math.ceil(tw + pad * 2); cv.height = Math.ceil(lines.length * lh + pad * 2);
    const c2 = cv.getContext("2d"); c2.font = "700 " + fs + "px " + family;
    c2.fillStyle = cssv("--surface"); roundRect(c2, 0, 0, cv.width, cv.height, 16); c2.fill();
    c2.strokeStyle = cssv("--line"); c2.lineWidth = 3; roundRect(c2, 1.5, 1.5, cv.width - 3, cv.height - 3, 15); c2.stroke();
    c2.fillStyle = cssv("--ink"); c2.textAlign = "center"; c2.textBaseline = "middle";
    lines.forEach((line, index) => c2.fillText(line, cv.width / 2, pad + lh * (index + .5)));
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 2;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.userData.aspect = cv.width / cv.height; sp.scale.set(cv.width / cv.height, 1, 1); return sp;
  }

  function clearCols() { const cols = three.cols;
    for (let i = cols.children.length - 1; i >= 0; i--) { const ch = cols.children[i];
      if (ch.geometry && !ch.isSprite) ch.geometry.dispose();
      if (ch.isSprite && ch.material) { if (ch.material.map) ch.material.map.dispose(); ch.material.dispose(); }
      cols.remove(ch); } three.pick = []; }

  function buildColumns() {
    if (!three.cols) return;
    clearCols();
    if (!THREE.BufferGeometryUtils || !THREE.BufferGeometryUtils.mergeBufferGeometries) return;
    const merge = geos => THREE.BufferGeometryUtils.mergeBufferGeometries(geos);
    updateGapMax(lod3d === "district");
    const districts = lod3d === "district";
    const ids = listRegionIds(districts);
    const supplyDemandComp = (skill === "all" && (mode === "skills" || mode === "industry"));
    const gapComp = (skill === "all" && mode === "overlay");
    const topY = {};
    if (supplyDemandComp) {
      const measure = mode === "skills" ? "s" : "d";
      const data = ids.map(rid => { const vals = SKILLS.map(k => rawSkillVal(rid, k.id, measure)); return { rid, vals, total: vals.reduce((a, b) => a + b, 0) }; });
      const maxTotal = Math.max(1e-6, ...data.map(d => d.total));
      const scaleH = MAXH / maxTotal;
      const seg = {};
      data.forEach(d => { const order = d.vals.map((v, si) => ({ si, v })).sort((a, b) => a.v - b.v); // ascending -> largest ends on top
        let y = BASE_Y; const m = new Array(SKILLS.length);
        order.forEach(o => { const h = Math.max(o.v * scaleH, 0.0001); m[o.si] = { y, h }; y += h; });
        seg[d.rid] = m; topY[d.rid] = y; });
      SKILLS.forEach((k, si) => {
        const geos = [];
        data.forEach(d => { const s = seg[d.rid][si]; const g = cachePrism(d.rid).clone(); g.scale(1, s.h, 1); g.translate(0, s.y, 0); geos.push(g); });
        if (geos.length) { const merged = merge(geos); if (merged) three.cols.add(new THREE.Mesh(merged, three.mats[k.id])); }
      });
    } else if (gapComp) {
      const data = ids.map(rid => { const gaps = SKILLS.map(k => regionSkillGap(rid, k.id));
        return { rid, gaps, totalAbs: gaps.reduce((a, b) => a + Math.abs(b), 0) }; });
      const maxAbs = Math.max(1e-6, ...data.map(d => d.totalAbs));
      const scaleH = MAXH / maxAbs;
      const neutral = new THREE.Color(cssv("--neutral"));
      const geos = [];
      data.forEach(d => {
        const order = d.gaps.map((g, si) => ({ si, g, abs: Math.abs(g) })).sort((a, b) => a.abs - b.abs); // ascending -> largest on top
        let y = BASE_Y;
        order.forEach(o => { const hh = Math.max(o.abs * scaleH, 0.0001);
          const g = cachePrism(d.rid).clone(); g.scale(1, hh, 1); g.translate(0, y, 0); y += hh;
          const col = new THREE.Color(SKILLCOLORS[SKILLS[o.si].id]); if (o.g < 0) col.lerp(neutral, 0.6);
          const n = g.attributes.position.count; const arr = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) { arr[3 * i] = col.r; arr[3 * i + 1] = col.g; arr[3 * i + 2] = col.b; }
          g.setAttribute("color", new THREE.BufferAttribute(arr, 3)); geos.push(g); });
        topY[d.rid] = Math.max(y, BASE_Y + 0.4); });
      if (geos.length) { const merged = merge(geos); if (merged) three.cols.add(new THREE.Mesh(merged, three.vcMat)); }
    } else {
      const geos = [];
      ids.forEach(rid => { const c = regionCell(rid); const col = new THREE.Color(colorFromCell(c));
        const g = cachePrism(rid).clone(); g.scale(1, FIXEDH, 1); g.translate(0, BASE_Y, 0);
        const n = g.attributes.position.count; const arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { arr[3 * i] = col.r; arr[3 * i + 1] = col.g; arr[3 * i + 2] = col.b; }
        g.setAttribute("color", new THREE.BufferAttribute(arr, 3)); geos.push(g); topY[rid] = BASE_Y + FIXEDH; });
      if (geos.length) { const merged = merge(geos); if (merged) three.cols.add(new THREE.Mesh(merged, three.vcMat)); }
    }
    // invisible pick prisms
    ids.forEach(rid => { const hh = Math.max((topY[rid] || (BASE_Y + FIXEDH)) - BASE_Y, 2.5);
      const g = cachePrism(rid).clone(); g.scale(1, hh, 1); g.translate(0, BASE_Y, 0);
      const mesh = new THREE.Mesh(g, three.pickMat); mesh.userData.rid = rid; three.cols.add(mesh); three.pick.push(mesh); });
    three.topY = topY; updateLabels();
    updateBorders(); updateHUD();
  }

  function clearLabelGroup() {
    const g = three.labelGroup; if (!g) return;
    for (let i = g.children.length - 1; i >= 0; i--) g.remove(g.children[i]);
  }
  function getLabel(id) { if (three.labelCache[id]) return three.labelCache[id]; const sp = makeLabelSprite(id); three.labelCache[id] = sp; return sp; }
  function updateLabels() {
    if (!three.labelGroup || !three.topY || !three.renderer) return;
    clearLabelGroup();
    const districts = lod3d === "district";
    const ids = listRegionIds(districts);
    let chosen;
    if (!districts) { chosen = ids; }
    else {
      const t = three.controls.target; const dist = three.camera.position.distanceTo(t);
      const R = Math.max(12, Math.min(46, dist * 0.55));
      chosen = ids.map(id => { const c = centroidOf(id); const dx = wx(c.cx) - t.x, dz = wz(c.cy) - t.z; return { id, d2: dx * dx + dz * dz }; })
        .filter(o => o.d2 <= R * R).sort((a, b) => a.d2 - b.d2).slice(0, 14).map(o => o.id);
    }
    const camera = three.camera;
    const canvas = three.renderer.domElement;
    const width = canvas.clientWidth || 900, height = canvas.clientHeight || 520;
    const dist = camera.position.distanceTo(three.controls.target);
    const tanHalf = Math.tan(camera.fov * Math.PI / 360);
    const baseH = districts ? 13 : 17;
    const minH = districts ? 7.5 : 8.5;
    const yOff = districts ? 0.9 : 1.5;
    const homeSid = id => id.indexOf("-") >= 0 ? id.split("-")[0] : id;
    const priority = id => (homeSid(id) === home ? 4 : 0) + (id === selected || id === selDist ? 2 : 0);
    const items = [];
    [...chosen].sort((a, b) => priority(b) - priority(a) || regionName(a).length - regionName(b).length).forEach(id => {
      const sp = getLabel(id);
      const c = centroidOf(id);
      const anchor = new THREE.Vector3(wx(c.cx), (three.topY[id] || (BASE_Y + FIXEDH)) + yOff, wz(c.cy));
      const projected = anchor.clone().project(camera);
      if (projected.z < -1 || projected.z > 1) return;
      const ax = (projected.x * .5 + .5) * width;
      const ay = (-projected.y * .5 + .5) * height;
      if (ax < 0 || ax > width || ay < 0 || ay > height) return;
      const aspect = sp.userData.aspect;
      items.push({ sp, anchor, ax, ay, aspect, h: baseH, w: baseH * aspect });
    });
    // Centred labels stay put; crowded ones shrink instead of moving.
    for (let pass = 0; pass < 16; pass++) {
      let changed = false;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i], b = items[j];
          if (Math.abs(a.ax - b.ax) >= (a.w + b.w) / 2 || Math.abs(a.ay - b.ay) >= (a.h + b.h) / 2) continue;
          [a, b].forEach(item => {
            if (item.h > minH) {
              item.h = Math.max(minH, item.h * .88);
              item.w = item.h * item.aspect;
              changed = true;
            }
          });
        }
      }
      if (!changed) break;
    }
    items.forEach(item => {
      const worldH = item.h * 2 * camera.position.distanceTo(item.anchor) * tanHalf / height;
      item.sp.scale.set(worldH * item.aspect, worldH, 1);
      item.sp.position.copy(item.anchor);
      item.sp.renderOrder = 2;
      three.labelGroup.add(item.sp);
    });
    three._lu = { d: three.camera.position.distanceTo(three.controls.target), t: three.controls.target.clone(), c: three.camera.position.clone() };
    three._luTime = performance.now();
  }
  function updateHUD() { const el = els.hud; if (!el) return;
    const stacked = (skill === "all");
    const ml = mode === "skills" ? "Supply" : mode === "industry" ? "Demand" : "Gap";
    const enc = !stacked ? "colour = value" : (mode === "overlay" ? "height = total gap · colour = skill" : "height = total · colour = skill");
    const iso = (selDist || selected) ? " · isolated" : "";
    el.innerHTML = `<b>${lod3d === "district" ? "Districts" : "States"}</b> · ${ml} · ${esc(skill === "all" ? "all skills" : skillName3(skill))}<br><span class="hud-note">${enc}${iso}</span>`; }

  function buildLegend3D() { const el = els.legend; if (!el) return;
    const stacked = (skill === "all");
    if (stacked) {
      const items = SKILLS.map(k => `<span class="litem"><i style="background:${SKILLCOLORS[k.id]}"></i>${esc(k.name)}</span>`).join("");
      const title = mode === "overlay" ? "Gap composition" : (mode === "skills" ? "Supply composition" : "Demand composition");
      const extra = mode === "overlay" ? `<div class="lhint">Bright = shortage · dim = oversupply · height = total gap.</div>` : "";
      el.innerHTML = `<span class="ltitle">${title}</span>${items}${extra}<div class="lhint">Largest component on top.</div>`;
    } else if (mode === "overlay") {
      el.innerHTML = `<span class="ltitle">The gap</span><div class="lbar" style="background:linear-gradient(90deg,${cssv("--neg")},${cssv("--neutral")},${cssv("--pos")})"></div><div class="lrow"><span>Oversupply</span><span>Balanced</span><span>Shortage</span></div>`;
    } else { const hi = mode === "skills" ? cssv("--supply") : cssv("--demand"); const lo = mode === "skills" ? cssv("--supply-lo") : cssv("--demand-lo");
      el.innerHTML = `<span class="ltitle">${mode === "skills" ? "Training supply" : "Hiring demand"} · ${esc(skillName3(skill))}</span><div class="lbar" style="background:linear-gradient(90deg,${lo},${hi})"></div><div class="lrow"><span>Low</span><span>High</span></div>`; }
  }

  function ndc(e) { const r = three.renderer.domElement.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }; }
  function raycastAt(e) { const n = ndc(e); three.raycaster.setFromCamera(n, three.camera);
    const hits = three.raycaster.intersectObjects(three.pick, false);
    if (!hits.length) return null; return hits[0].object.userData.rid; }
  function onUp(e) { const moved = Math.abs(e.clientX - three.dx) + Math.abs(e.clientY - three.dy);
    if (moved < 6) { const rid = raycastAt(e);
      if (rid) selectRegion(rid);
      else if (selected || selDist) { resetView(); } } }
  function selectRegion(rid) {
    if (rid.indexOf("-") >= 0) { const sid = rid.split("-")[0]; activeState = sid; level = "district"; selDist = rid; selected = sid; }
    else { selected = rid; level = "nation"; activeState = null; selDist = null; }
    render();
  }
  function onHover(e) { const rid = raycastAt(e);
    if (!rid) { hideHoverTip(); three.renderer.domElement.style.cursor = "grab"; return; }
    three.renderer.domElement.style.cursor = "pointer"; showHoverTip(e, rid); }

  function flyTo(rid) {
    if (!three.controls) return;
    const c = centroidOf(rid); const dist = rid.indexOf("-") >= 0 ? 42 : 64;
    const tgt = new THREE.Vector3(wx(c.cx), 2, wz(c.cy));
    const dir = three.camera.position.clone().sub(three.controls.target).normalize();
    const camTo = tgt.clone().add(dir.multiplyScalar(dist));
    if (reduceMotion) { three.controls.target.copy(tgt); three.camera.position.copy(camTo); tween3d = null; return; }
    tween3d = { t0: performance.now(), dur: 650, tFrom: three.controls.target.clone(), tTo: tgt, cFrom: three.camera.position.clone(), cTo: camTo };
  }
  function flyOverview() {
    if (!three.controls) return;
    const tgt = new THREE.Vector3(0, 2, 0);
    const camTo = new THREE.Vector3(0, 55, 75);
    if (reduceMotion) { three.controls.target.copy(tgt); three.camera.position.copy(camTo); tween3d = null; return; }
    tween3d = { t0: performance.now(), dur: 650, tFrom: three.controls.target.clone(), tTo: tgt, cFrom: three.camera.position.clone(), cTo: camTo };
  }
  function resetView() {
    selected = null; selDist = null; level = "nation"; activeState = null;
    render();
    flyOverview();
  }
  function stepTween() { const tw = tween3d; let p = Math.min(1, (performance.now() - tw.t0) / tw.dur); p = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    three.controls.target.lerpVectors(tw.tFrom, tw.tTo, p); three.camera.position.lerpVectors(tw.cFrom, tw.cTo, p);
    if (p >= 1) tween3d = null; }
  function resize3D() { if (!three.renderer) return; const c = three.container; const w = c.clientWidth || 900, h = c.clientHeight || 520;
    three.camera.aspect = w / h; three.camera.updateProjectionMatrix(); three.renderer.setSize(w, h);
    if (three.topY) updateLabels(); }
  function animate() {
    if (!three.renderer) return;
    three.raf = requestAnimationFrame(animate);
    if (!root || view !== "3d") return;
    if (tween3d) stepTween();
    three.controls.update();
    const dist = three.camera.position.distanceTo(three.controls.target);
    if (lod3d === "state" && dist < SWITCH_IN) { lod3d = "district"; buildColumns(); buildLegend3D(); }
    else if (lod3d === "district" && dist > SWITCH_OUT) { lod3d = "state"; buildColumns(); buildLegend3D(); }
    const t = three.controls.target;
    const now = performance.now();
    if (three.topY && (!three._lu || Math.abs(dist - three._lu.d) > 0.5 || t.distanceTo(three._lu.t) > 0.2 || three.camera.position.distanceTo(three._lu.c) > 0.2)) {
      if (!three._luTime || now - three._luTime > 90) updateLabels();
    }
    three.renderer.render(three.scene, three.camera);
  }
  /* ==================== end 3D view ==================== */

  /* ---- shell + controls ---- */
  function shellHTML() {
    return `<div class="atlas-controls">
      <div class="atlas-modes" role="group" aria-label="Map mode">
        <button type="button" class="mode" data-mode="skills" aria-pressed="false">Skills supply<small>TVET output + user base</small></button>
        <button type="button" class="mode" data-mode="industry" aria-pressed="false">Industry demand<small>Hiring postings</small></button>
        <button type="button" class="mode" data-mode="overlay" aria-pressed="true">The gap<small>Demand − supply</small></button>
      </div>
      <div class="atlas-viewtoggle" role="group" aria-label="Map view">
        <button type="button" class="vt" data-view="2d" aria-pressed="false">Map</button>
        <button type="button" class="vt" data-view="3d" aria-pressed="true">3D</button>
      </div>
    </div>
    <div class="atlas-toolbar">
      <label class="atlas-field"><span>Skill cluster</span><select data-atlas-skill aria-label="Skill cluster"></select></label>
      <p class="atlas-hint">Click a state for its breakdown. In 3D, drag to orbit and scroll to zoom into districts.</p>
    </div>
    <div class="atlas-layout">
      <div class="atlas-mapcard">
        <div class="atlas-crumb" data-atlas-crumb hidden></div>
        <div class="atlas-stage2d" data-atlas-stage2d><svg class="atlas-map" data-atlas-map viewBox="0 0 1000 361" role="img" aria-label="Map of Malaysia skills supply and demand by state"></svg></div>
        <div class="atlas-stage3d" data-atlas-stage3d hidden>
          <div class="atlas-scene3d" data-atlas-scene3d></div>
          <button type="button" class="atlas-reset" data-atlas-reset aria-label="Reset the 3D camera and show all states">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg>
            Reset camera
          </button>
          <div class="atlas-hud3d" data-atlas-hud></div>
          <div class="atlas-3d-msg" data-atlas-3d-msg hidden></div>
        </div>
        <div class="atlas-legend" data-atlas-legend></div>
      </div>
      <div class="atlas-sidecard" data-atlas-sidecard aria-live="polite"></div>
    </div>
    <div class="atlas-tip" data-atlas-tip hidden></div>`;
  }

  function buildSkillOptions() {
    if (!els.skill) return;
    els.skill.innerHTML = `<option value="all">All skills</option>` + SKILLS.map(k => `<option value="${k.id}">${esc(k.name)}</option>`).join("");
    els.skill.value = skill;
  }

  function syncControls() {
    if (!root) return;
    if (els.skill) els.skill.value = skill;
    els.modes?.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    els.views?.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
  }

  /* The 3D view is the default, so the engine is fetched on first mount as well
     as when the 3D toggle is pressed. */
  async function boot3D() {
    if (!root || view !== "3d") return;
    if (!three.renderer) {
      show3DMessage("Loading the 3D map…");
      const loaded = await loadThree();
      if (!root || !root.isConnected) return;
      if (!loaded) {
        if (els.reset) els.reset.hidden = true;
        show3DMessage("The 3D view needs an internet connection to load its map engine. The 2D map works offline.");
        buildSidebar();
        return;
      }
    }
    render();
    if (selected || selDist) flyTo(selDist || selected);
  }

  async function setView(next) {
    if (!root || next === view) return;
    if (next === "2d") { view = "2d"; render(); return; }
    view = "3d";
    els.stage2d.hidden = true; els.stage3d.hidden = false;
    if (els.reset) els.reset.hidden = false;
    syncControls();
    if (three.renderer) { render(); return; }
    await boot3D();
  }

  function bindControls() {
    els.skill?.addEventListener("change", () => { skill = els.skill.value; render(); });
    els.modes.forEach(button => button.addEventListener("click", () => { mode = button.dataset.mode; persist(); render(); }));
    els.views.forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
    els.reset?.addEventListener("click", resetView);
    els.map?.addEventListener("mousemove", event => {
      const target = event.target.closest ? event.target.closest("[data-id],[data-dist]") : null;
      const rid = target ? (target.getAttribute("data-dist") || target.getAttribute("data-id")) : null;
      if (rid) showHoverTip(event, rid); else hideHoverTip();
    });
    els.map?.addEventListener("mouseleave", hideHoverTip);
  }

  function render() {
    if (!root) return;
    els.stage2d.hidden = view !== "2d";
    els.stage3d.hidden = view !== "3d";
    if (view === "2d") { buildCrumb(); buildMap(); buildLegend(); }
    else { if (els.crumb) els.crumb.hidden = true; if (ensure3D()) { updateColors3D(); buildColumns(); buildLegend3D(); resize3D(); } }
    buildSidebar();
    syncControls();
  }

  function mount(container, context = {}) {
    if (!container) return;
    if (root === container && mounted) return;
    destroy();
    root = container;
    const nextHome = LOCATION_STATE[context.location] || null;
    if (!started) { selected = nextHome; started = true; }
    else if (selected && selected === home) selected = nextHome;
    home = nextHome;
    root.innerHTML = shellHTML();
    els = {
      skill: root.querySelector("[data-atlas-skill]"),
      modes: [...root.querySelectorAll(".mode")],
      views: [...root.querySelectorAll(".vt")],
      stage2d: root.querySelector("[data-atlas-stage2d]"),
      stage3d: root.querySelector("[data-atlas-stage3d]"),
      scene3d: root.querySelector("[data-atlas-scene3d]"),
      map: root.querySelector("[data-atlas-map]"),
      crumb: root.querySelector("[data-atlas-crumb]"),
      legend: root.querySelector("[data-atlas-legend]"),
      sidecard: root.querySelector("[data-atlas-sidecard]"),
      hud: root.querySelector("[data-atlas-hud]"),
      reset: root.querySelector("[data-atlas-reset]"),
      tip: root.querySelector("[data-atlas-tip]"),
      threeMsg: root.querySelector("[data-atlas-3d-msg]")
    };
    buildSkillOptions();
    bindControls();
    mounted = true;
    render();
    if (view === "3d") boot3D();
  }

  function destroy() {
    dispose3D();
    mounted = false;
    root = null;
    els = {};
  }

  return { mount, destroy };
})();
