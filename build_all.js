#!/usr/bin/env node
/* Builds the full-boulder search index from the cached 27crags API files and
 * injects it into index.html as `var CRAGS=..., SECT=..., ALL=...;`.
 *
 *   node build_all.js
 *
 * Also writes all_boulders.json so the index is readable outside the page.
 *
 * Shapes (kept short on purpose, the file is embedded in the page):
 *   CRAGS[i] = [slug, name, parkingLat|null, parkingLng|null, access, accessInfo]
 *              access is the 27crags traffic light: "green" | "yellow" | "red".
 *              accessInfo is the crag's own access and ethics text ("" when none).
 *   SECT[i]  = [cragIdx, sectorName, lat, lng, paramId, topos]
 *              topos[j] = [photoRef, routeId, routeId, ...] - the picture and
 *              the boulders drawn on it. See photoRef() below.
 *   ALL[i]   = [routeId, name, grade, rating, sectIdx, paramId, ascents, info, videos]
 *              paramId is "" when it is just the slug of the name.
 *              ascents is the public logged-ascent count (0 when none).
 *              info is the public route description ("" when none).
 *              videos is the count of videos on the route page (0 when none).
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

/* Topo pictures. Every style of one photo sits on the same host and under the
 * same folder, and only the file name changes:
 *
 *   .../photos/000/190/190454/size_m-f3c3edfd3037.jpg
 *
 * So the page only needs the photo id and the two file-name hashes it shows:
 * `size_m` for the strip and `size_l` for the full-screen view. They travel as
 * one string, "id/hashM/hashL", and the page builds the address back.
 *
 * A sector keeps at most MAX_TOPOS pictures: the strip shows a handful, and
 * every extra one is weight in a file that is downloaded whole.
 */
const MAX_TOPOS = 4;
function photoRef(photo) {
  const st = photo && photo.styles;
  if (!st || !st.size_m || !st.size_l) return null;
  const hash = (u) => { const m = /-([0-9a-f]+)\.jpg$/.exec(u); return m ? m[1] : null; };
  const m = hash(st.size_m.url), l = hash(st.size_l.url);
  if (!m || !l) return null;
  return photo.id + '/' + m + '/' + l;
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
    crag.access_status || '',
    (crag.access_info || '').trim(),
  ]) - 1;

  for (const s of crag.sectors || []) {
    if (s.latitude == null || s.longitude == null) continue;
    const topos = [];
    for (const t of s.topo_images || []) {
      if (topos.length >= MAX_TOPOS) break;
      const ref = photoRef(t.photo);
      if (ref) topos.push([ref].concat(t.route_ids || []));
    }
    sectKey[s.id] = sects.push([
      ci, s.name, +(+s.latitude).toFixed(6), +(+s.longitude).toFixed(6),
      slug(s.name) === s.param_id ? '' : s.param_id,
      topos,
    ]) - 1;
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
      r.ascents_done_count || 0,
      (r.info || '').trim(),
      r.video_count || 0,
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

const nTopos = sects.reduce((a, s) => a + s[5].length, 0);
console.log('crags', crags.length, 'sectors', sects.length, 'boulders', all.length, 'topos', nTopos);
console.log('injected', (line.length / 1024).toFixed(0) + ' KB into index.html');
