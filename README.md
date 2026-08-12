# Kjuge Circles

Interactive walking-route planner for the **Kjugekull** and **Around Ivösjön** bouldering top-lists (Carl Nilsask, 2021).

Given the four PDF top-lists, this project takes every boulder graded **L to 7A**, looks up each boulder's location on [27crags](https://27crags.com) (now thetopo.com), and plots the shortest walk through them all. It also supports live filtering by **grade**, **characteristics** (crimpers, slopers, slab, …) and **star rating**.

## Open it

Open [`index.html`](index.html) in any browser — it's a single self-contained file (Leaflet + CARTO tiles from CDN, all data embedded). No build step, no server.

### Features
- **Lists** — multi-select checkboxes; selecting several lists merges their boulders, de-duplicates shared sectors, and recomputes one combined walking route.
- **Grade filter** — tap-chips for L … 7A.
- **Character filter** — 13 characteristics scraped from 27crags (technical, mental, slopers, crimpers, slab, powerful, dangerous, crack, jugs, endurance, pockets, dyno, traverse). Shows boulders with *any* selected characteristic.
- **Shortest route** — nearest-neighbour + 2-opt TSP over the distinct sectors, anchored at the nearest parking, recomputed in-browser whenever the selection/filters change.
- **Popups** — each stop lists its boulders with grade, ⭐ rating (0–3), characteristics, and a link to the 27crags page.
- **Mobile** — full-screen map with a bottom-sheet filter panel and touch-sized controls; desktop keeps a docked side panel.

A static, human-readable itinerary of the per-list routes is in [`ROUTES.md`](ROUTES.md).

## How it was built

1. **Extract links** from `Kjuge top-lists v1.pdf` (annotation URIs) and align each with its grade by text position.
2. **Filter** to grades L–7A.
3. **Locate** every boulder: `27crags` web API (`/api/web01/crags/<id>`) gives per-route `sector_id`; each sector has GPS. Sector = the natural walking granularity. Parking markers come from the same API.
4. **Route** each list with a TSP (nearest-neighbour + 2-opt), anchored at parking.
5. **Characteristics** are only rendered on 27crags route pages for signed-in users, so they were scraped from an authenticated browser session (`.tag` classes on each boulder page). Star ratings come straight from the crag API.
6. **Render** everything into the self-contained `index.html`.

## Data files

| File | What |
|---|---|
| `Kjuge top-lists v1.pdf` | Source lists |
| `map_data.json` | The data embedded in `index.html` (stops, boulders, grades, chars, ratings, per-list routes) |
| `links_grades.json` | Each PDF link paired with its list + grade |
| `located.json` | L–7A boulders with sector GPS |
| `routes.json` | Precomputed per-list TSP order + distance |
| `tags_by_path.json` | Scraped characteristics per boulder |
| `boulder_urls.json` | All 215 boulder URLs |
| `api/*.json` | Cached 27crags crag API responses (routes + sectors + parking) |
| `scrape.js` / `scrape_min.js` | The in-session character scraper |

## Notes / caveats
- The two **Kjugekull** lists are a single crag — a tight ~3 km walkable loop.
- The two **Around Ivösjön** lists span ~13 crags around the lake (some across water); their "routes" are a visiting *order*, not a footpath. Distances are straight-line sums, not trail-routed.
- Boulders that are unclimbed projects (no 27crags link in the PDF) are excluded.

Data © 27crags / thetopo.com and the respective contributors. Lists © Carl Nilsask.
