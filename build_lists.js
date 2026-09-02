#!/usr/bin/env node
/* Builds the guidebook "Problem styles" lists (Kjugekull, p.197) and writes them
 * into map_data.json + the `var DATA=` line of index.html.
 *
 *   node build_lists.js
 *
 * The eight lists below were read off a photo of the page. Each entry is the
 * printed name and grade; the camera icon and the page number are not used.
 * Every name is looked up in the cached 27crags API (api/*.json), Kjugekull
 * first, because these lists are Kjugekull lists. A name the lookup cannot
 * place is reported and left out.
 */
const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, 'api');
const MAP_JSON = path.join(__dirname, 'map_data.json');
const TAGS = path.join(__dirname, 'tags_by_path.json');
const HTML = path.join(__dirname, 'index.html');

// Colours continue the palette of the four PDF lists.
const STYLE_LISTS = [
  { title: 'The highballs', color: '#911eb4', items: [
    ['Alla vill till himmelen...', '7C+'],
    ['Crescendo', '7C'],
    ['Regretto', '7C'],
    ['Resan till nattens ände', '7C'],
    ['Tryggare kan ingen vara', '7B+'],
    ['Stress', '7B'],
    ['Caspersens arete', '7A+'],
    ['Demian', '7A'],
    ['Ett långfinger åt döden', '6C+'],
    ['Endast för förryckta', '6C+'],
    ['Lust', '6C'],
    ['Linds långa linje', '6B+'],
    ['Gröna milen', '6B'],
    ['Kokain', '6B'],
    ['Ehmanns elddop', '6A'],
    ['Paraffin', '5+'],
  ]},
  { title: 'The slabs', color: '#008080', items: [
    ['Låååångsamt, låååångsamt', '7B'],
    ['Gonzo', '7B'],
    ['Delikat spagat', '7B'],
    ['Struts är struts', '6C+'],
    ['Eskapism', '6C'],
    ['Enten', '6C'],
    ['Hjelten', '6C'],
    ['Tralfamadore', '6B+'],
    ['Kristallsvaet', '6B+'],
    ['Sva-areten', '6B'],
    ['Daniels kluriga sva', '6A+'],
    ['Svabbet', '6A'],
    ['Snakes and ladders', '5+'],
    ['Mähä', '5+'],
    ['Jag hann först!', 'L'],
    ['Hawaii', 'L'],
  ]},
  { title: 'The mantles', color: '#9A6324', items: [
    ['Djävulen', '7A'],
    ['Butch', '7A'],
    ['Fubbick', '6C+'],
    ['Triceps', '6C+'],
    ['Tilt', '6C+'],
    ['Ta från de klena och ge till...', '6C'],
    ['Smack!', '6C'],
    ['Point Break', '6C'],
    ['Näsvis', '6B+'],
    ['Y-front', '6B+'],
    ['Piraya', '6B'],
    ['Flygel', '6A+'],
    ['Sväva och häva', '5+'],
    ['Lippmofvet', '5'],
    ['Mr Mantle direkt', '5'],
    ['Flora', 'L'],
  ]},
  { title: 'The Bucket list', color: '#800000', items: [
    ['Lithium lågstart', '8A'],
    ['Alla vill till himmelen...', '7C+'],
    ['Moby Dick', '7B+'],
    ['Forza', '7B+'],
    ['Sonic', '7B+'],
    ['Kung Fu', '7B'],
    ['Caspersens arete direkt', '7B'],
    ['Matador', '7A+'],
    ['Baltazar', '7A+'],
    ['Monolith', '7A+'],
    ['Lättja', '7A'],
    ['Fubbick', '6C+'],
    ['Silikon', '6C'],
    ['Linds långa linje', '6B+'],
    ['Nä, men Jeppe', '6A+'],
    ['Mandomsprovet', '6A'],
  ]},
  { title: 'The traverses', color: '#f032e6', items: [
    ['Lex Luthor', '7C'],
    ['Sickman', '7B+'],
    ['Plåt-Nicklas', '7B'],
    ['Det gåtfulla folket', '7B'],
    ['Bragdguld', '7A+'],
    ['Kon har kalvat', '7A'],
    ['Petters gröna', '6B'],
    ['Mr Mantle', '6B'],
    ['Olssons travers', '6A'],
    ['Kristallbandet', 'L'],
  ]},
  { title: 'The overhangs', color: '#000075', items: [
    ['Hidden Dragon', '8B'],
    ['Dulcinea', '8A+'],
    ['Lithium lågstart', '8A'],
    ['Girighet', '7C'],
    ['La Bohème', '7C'],
    ['K.O. sittstart', '7C'],
    ['Adamantium', '7B+'],
    ['Våroffer', '7B'],
    ['The 4-layer man in the...', '7A+'],
    ['Ken Titan', '7A'],
  ]},
  { title: 'The dynos', color: '#469990', items: [
    ['Forza', '7B+'],
    ['Stearin', '7B'],
    ['Rhinestone dyno', '7A+'],
    ['Död och pina', '7A'],
    ['Fajers dyno', '7A'],
    ['Rocketeer', '7A'],
    ['Korsfäst II - Hämnden', '6C+'],
    ['Salt Lakrits', '6B'],
    ['Perssons dyno', '6A+'],
    ['En dyna', '6A'],
  ]},
  { title: 'The weird ones', color: '#808000', items: [
    ['Köttbullen', '7B'],
    ['Snurre Sprätt', '6B+'],
    ['Miss Tricker', '6B+'],
    ['No move wonder', '6B'],
    ['Min häst', '6A+'],
    ['Kom ut ur gymmet', '6A'],
    ['Gubbhanden sittstart', '5'],
    ['Relativitetsteorin', '5'],
    ['Lipphoppet', ''],
    ['Astroman', ''],
  ]},
];

/* ---- the cached crag API ---- */
function norm(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function compact(s) { return norm(s).replace(/[^a-z0-9]/g, ''); }

const routes = [];                 // every boulder of every cached crag
for (const file of fs.readdirSync(API_DIR).sort()) {
  if (!file.endsWith('.json')) continue;
  const cragSlug = path.basename(file, '.json');
  const crag = JSON.parse(fs.readFileSync(path.join(API_DIR, file), 'utf8')).crag;
  const sect = {};
  for (const s of crag.sectors || []) {
    if (s.latitude != null && s.longitude != null) sect[s.id] = s;
  }
  for (const r of crag.routes || []) {
    if (r.genre !== 'Boulder' || r.hidden) continue;
    const s = sect[r.sector_id];
    if (!s) continue;
    routes.push({
      name: r.name.trim(), grade: r.grade || '?',
      rating: r.rating == null ? 0 : +(+r.rating).toFixed(1),
      crag: cragSlug, param: r.param_id,
      lat: +(+s.latitude).toFixed(6), lng: +(+s.longitude).toFixed(6),
      sector: (s.name || '').trim(),
    });
  }
}

const tags = JSON.parse(fs.readFileSync(TAGS, 'utf8'));
function charsOf(r) { return tags['/crags/' + r.crag + '/routes/' + r.param] || []; }
function urlOf(r) { return 'https://27crags.com/crags/' + r.crag + '/routes/' + r.param; }

/* ---- name lookup, Kjugekull first ---- */
const byName = {};
routes.forEach(function (r) { (byName[compact(r.name)] = byName[compact(r.name)] || []).push(r); });

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  let prev = [], cur = [];
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i; let best = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > 2) return 99;
    prev = cur.slice();
  }
  return prev[n];
}

// A printed name ending in "..." is cut short, so it only has to be a prefix.
function pick(cands, grade) {
  let c = cands.filter(function (r) { return r.crag === 'kjugekull'; });
  if (!c.length) c = cands;
  if (grade) {
    const g = c.filter(function (r) { return r.grade.toUpperCase() === grade.toUpperCase(); });
    if (g.length) c = g;
  }
  return c.slice().sort(function (a, b) { return b.rating - a.rating; })[0];
}
function lookup(name, grade) {
  const cut = /\.\.\.$/.test(name);
  const q = compact(name.replace(/\.\.\.$/, ''));
  if (!cut && byName[q]) return { r: pick(byName[q], grade), how: 'exact' };
  // Prefix, for the names the book shortens with "…".
  const pre = routes.filter(function (r) { return compact(r.name).indexOf(q) === 0; });
  if (pre.length) return { r: pick(pre, grade), how: cut ? 'prefix' : 'exact' };
  // Last resort: a spelling that is one or two letters off.
  let best = null, bd = 99;
  routes.forEach(function (r) {
    const d = lev(q, compact(r.name));
    if (d < bd || (d === bd && best && best.crag !== 'kjugekull' && r.crag === 'kjugekull')) { bd = d; best = r; }
  });
  if (best && bd <= 2) return { r: best, how: 'fuzzy(' + bd + ')' };
  return null;
}

/* ---- walking route: nearest neighbour + 2-opt, same as the app ---- */
function hav(a, b) {
  const R = 6371000, t = Math.PI / 180;
  const dLat = (b[0] - a[0]) * t, dLng = (b[1] - a[1]) * t;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function tsp(C, start) {
  const n = C.length;
  if (n <= 1) return C.map(function (_, i) { return i; });
  const seen = new Array(n).fill(false);
  let order = [start]; seen[start] = true;
  for (let k = 1; k < n; k++) {
    let last = order[order.length - 1], bi = -1, bd = Infinity;
    for (let i = 0; i < n; i++) {
      if (seen[i]) continue;
      const d = hav(C[last], C[i]);
      if (d < bd) { bd = d; bi = i; }
    }
    order.push(bi); seen[bi] = true;
  }
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < order.length - 1; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const a = C[order[i - 1]], b = C[order[i]], c = C[order[j]], d = order[j + 1] ? C[order[j + 1]] : null;
        const before = hav(a, b) + (d ? hav(c, d) : 0);
        const after = hav(a, c) + (d ? hav(b, d) : 0);
        if (after + 1e-9 < before) {
          const seg = order.slice(i, j + 1).reverse();
          order = order.slice(0, i).concat(seg, order.slice(j + 1));
          improved = true;
        }
      }
    }
  }
  return order;
}

/* ---- build the layers ---- */
const PARKING = [56.07347, 14.359501];        // Kjugekull parking, as in the PDF lists
const problems = [];

function buildLayer(list) {
  const stopsMap = {}, missing = [], notes = [];
  list.items.forEach(function (it) {
    const hit = lookup(it[0], it[1]);
    if (!hit || !hit.r) { missing.push(it[0] + (it[1] ? ' ' + it[1] : '')); return; }
    const r = hit.r;
    if (hit.how !== 'exact') notes.push(it[0] + ' -> ' + r.name + ' [' + hit.how + ']');
    if (it[1] && r.grade.toUpperCase() !== it[1].toUpperCase()) {
      notes.push(it[0] + ': book ' + it[1] + ', 27crags ' + r.grade);
    }
    if (r.crag !== 'kjugekull') notes.push(it[0] + ' is at ' + r.crag + ', not Kjugekull');
    const key = r.lat.toFixed(6) + ',' + r.lng.toFixed(6);
    const s = stopsMap[key] || (stopsMap[key] = { lat: r.lat, lng: r.lng, label: r.crag + ' \u00b7 ' + r.sector, b: [] });
    if (!s.b.some(function (x) { return x.url === urlOf(r); })) {
      s.b.push({ name: r.name, grade: r.grade, crag: r.crag, url: urlOf(r), chars: charsOf(r), rating: r.rating });
    }
  });
  const stops = Object.keys(stopsMap).map(function (k) { return stopsMap[k]; });
  const C = stops.map(function (s) { return [s.lat, s.lng]; });
  let start = 0, bd = Infinity;
  C.forEach(function (c, i) { const d = hav(c, PARKING); if (d < bd) { bd = d; start = i; } });
  const order = tsp(C, start);
  let dist = 0, prev = PARKING;
  const markers = order.map(function (oi, k) {
    const s = stops[oi];
    dist += hav(prev, [s.lat, s.lng]); prev = [s.lat, s.lng];
    return { i: k + 1, lat: s.lat, lng: s.lng, label: s.label, b: s.b };
  });
  const n = markers.reduce(function (a, m) { return a + m.b.length; }, 0);
  problems.push({ title: list.title, n: n, of: list.items.length, missing: missing, notes: notes });
  return { title: list.title, color: list.color, markers: markers, parking: PARKING, dist: Math.round(dist) };
}

/* ---- write map_data.json and index.html ---- */
const map = JSON.parse(fs.readFileSync(MAP_JSON, 'utf8'));
// Real names instead of URL slugs, so every list reads the same way.
const nameByUrl = {};
routes.forEach(function (r) { nameByUrl[urlOf(r)] = r.name; });
map.layers.forEach(function (l) {
  l.markers.forEach(function (m) {
    m.b.forEach(function (b) { if (nameByUrl[b.url]) b.name = nameByUrl[b.url]; });
  });
});

// The four PDF lists stay; the style lists are rebuilt from scratch every run.
const styleTitles = STYLE_LISTS.map(function (l) { return l.title; });
const keep = map.layers.filter(function (l) { return styleTitles.indexOf(l.title) < 0; });
map.layers = keep.concat(STYLE_LISTS.map(buildLayer));
fs.writeFileSync(MAP_JSON, JSON.stringify(map));

const line = 'var DATA=' + JSON.stringify(map.layers) + ', GORD=' + JSON.stringify(map.gord) + ';';
let html = fs.readFileSync(HTML, 'utf8');
html = html.replace(/^var DATA=.*$/m, line.replace(/\$/g, '$$$$'));
fs.writeFileSync(HTML, html);

problems.forEach(function (p) {
  console.log(p.title + ': ' + p.n + '/' + p.of + ' boulders');
  p.notes.forEach(function (n) { console.log('   note: ' + n); });
  p.missing.forEach(function (m) { console.log('   MISSING: ' + m); });
});
console.log('layers', map.layers.length, '| injected', (line.length / 1024).toFixed(0) + ' KB into index.html');
