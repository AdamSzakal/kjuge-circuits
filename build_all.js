#!/usr/bin/env node
/* Builds the full-boulder search index from the cached 27crags API files and
 * injects it into index.html as `var CRAGS=..., SECT=..., ALL=...;`.
 *
 *   node build_all.js
 *
 * Also writes all_boulders.json so the index is readable outside the page.
 *
 * Shapes (kept short on purpose, the file is embedded in the page):
 *   CRAGS[i] = [slug, name, parkingLat|null, parkingLng|null]
 *   SECT[i]  = [cragIdx, sectorName, lat, lng]
 *   ALL[i]   = [routeId, name, grade, rating, sectIdx, paramId]
 *              paramId is "" when it is just the slug of the name.
 */
const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, 'api');
const HTML = path.join(__dirname, 'index.html');
const JSON_OUT = path.join(__dirname, 'all_boulders.json');

function slug(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const crags = [], sects = [], all = [];
const sectKey = {};

for (const file of fs.readdirSync(API_DIR).sort()) {
  if (!file.endsWith('.json')) continue;
  const crag = JSON.parse(fs.readFileSync(path.join(API_DIR, file), 'utf8')).crag;
  const cragSlug = path.basename(file, '.json');

  const park = (crag.map_markers || []).find(m => m.kind === 'parking_space');
  const ci = crags.push([
    cragSlug, crag.name,
    park ? +(+park.latitude).toFixed(6) : null,
    park ? +(+park.longitude).toFixed(6) : null,
  ]) - 1;

  for (const s of crag.sectors || []) {
    if (s.latitude == null || s.longitude == null) continue;
    sectKey[s.id] = sects.push([ci, s.name, +(+s.latitude).toFixed(6), +(+s.longitude).toFixed(6)]) - 1;
  }

  for (const r of crag.routes || []) {
    if (r.genre !== 'Boulder' || r.hidden) continue;
    const si = sectKey[r.sector_id];
    if (si === undefined) continue;               // no GPS, cannot map it
    all.push([
      r.id, r.name, r.grade || '?',
      r.rating == null ? -1 : +(+r.rating).toFixed(1),
      si,
      slug(r.name) === r.param_id ? '' : r.param_id,
    ]);
  }
}

all.sort((a, b) => a[1].localeCompare(b[1], 'sv'));

fs.writeFileSync(JSON_OUT, JSON.stringify({ CRAGS: crags, SECT: sects, ALL: all }));

const line = 'var CRAGS=' + JSON.stringify(crags) +
  ',SECT=' + JSON.stringify(sects) +
  ',ALL=' + JSON.stringify(all) + ';';

let html = fs.readFileSync(HTML, 'utf8');
if (/^var CRAGS=/m.test(html)) {
  html = html.replace(/^var CRAGS=.*$/m, line);
} else {
  // Put it straight after the embedded DATA line.
  html = html.replace(/^(var DATA=.*)$/m, '$1\n' + line);
}
fs.writeFileSync(HTML, html);

console.log('crags', crags.length, 'sectors', sects.length, 'boulders', all.length);
console.log('injected', (line.length / 1024).toFixed(0) + ' KB into index.html');
