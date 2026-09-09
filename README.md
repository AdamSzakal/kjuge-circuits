# Kjuge Circles

Interactive walking-route planner for the **Kjugekull** and **Around Ivösjön** bouldering top-lists (Carl Nilsask, 2021) and for the eight **Problem styles** lists of the Kjugekull guidebook.

It also carries **Affonsos Darlings**, a 33-problem warm-up circle of Kjugekull classics (3+ to 5+) proposed by Affonso.

The four top-lists are the work of **Carl Nilsask** (2021) — see the [original PDF](https://drive.google.com/file/d/1_B4msOiupGdst2TktklMcE4gQHJrjmW2/view?usp=sharing). The eight style lists (*The highballs*, *The slabs*, *The mantles*, *The Bucket list*, *The traverses*, *The overhangs*, *The dynos*, *The weird ones*) come from the "Problem styles" page of the printed Kjugekull guidebook.

Given the four PDF top-lists, this project takes every boulder graded **L to 7A**, looks up each boulder's location on [27crags](https://27crags.com) (now thetopo.com), and plots the shortest walk through them all. It also supports live filtering by **grade**, **characteristics** (crimpers, slopers, slab, …) and **star rating**.



https://github.com/user-attachments/assets/d47d994f-6837-40e9-9478-73f7489bf25a



## Open it

Open [`index.html`](index.html) in any browser — it's a single self-contained file (Leaflet + OpenTopoMap tiles from CDN, all data embedded). No build step, no server.

### Features
- **Search** — free-text search over **every** boulder in the dataset (3141 boulders across 14 crags), matching name, grade, crag and sector.
- **Map search** — the search box at the top of the panel draws its hits on the map in **orange**, also when they sit outside the picked circuits and outside the filters. A hit that is off-screen pulls the map to it. Each hit can be added to the current circuit, from the result row or from its map popup.
- **My circle** — add any boulder from the search results to your own circle, name it, and get a walking route through it just like the built-in lists. The **Share** link carries every circle (ids + names), so no backend or login is needed.
- **Paste a list** — paste problem names (one per line, comma separated, or `Name, Grade` pairs) to fill a circle in one go. Numbering, quotes and a header row are stripped; names are read as Kjugekull names first and only then against the other crags; the grade breaks the remaining ties; anything unmatched is reported back.
- **Build a circuit** — boulders are added and removed in the circuit editor (search results, the pasted list, or the × of the *In this circuit* list). Map popups only read: name, grade, stars, characteristics and the link — the one exception is a search hit, whose popup also has an **Add** button. A shared link can still carry hidden boulders; the *Circuits* section then offers **Show all**.
- **Circuits** — a fold of its own: multi-select checkboxes over the built-in lists (top-lists, guidebook styles, community) and your own circuits. Selecting several merges their boulders, de-duplicates shared sectors, and recomputes one combined walking route. The picks of the last visit come back on the next one (`localStorage`); a link that carries its own lists always wins over them.
- **Filters** — a second, separate fold: grade, character and star rating, applied to everything drawn on the map, the built-in lists *and* your own circuits. Picking circuits and filtering their contents never change each other. Grade chips cover the whole dataset scale (3 … 8C, plus ungraded); a boulder of a circle that a filter removes is marked *filtered out* in the editor.
- **Character filter** — 13 characteristics scraped from 27crags (technical, mental, slopers, crimpers, slab, powerful, dangerous, crack, jugs, endurance, pockets, dyno, traverse). Shows boulders with *any* selected characteristic.
- **Shortest route** — nearest-neighbour + 2-opt TSP over the distinct sectors, anchored at the nearest parking, recomputed in-browser whenever the selection/filters change.
- **Popups** — each stop lists its boulders with grade, ⭐ rating (0–3), characteristics, and a link to the 27crags page. A tap on a route dot only shows what is there; only an orange search dot offers a button.
- **Share** — the current selection (lists + grade + character filters) is encoded in the URL hash; the **Share** button copies a link that reopens the exact same circuit. No backend required.
- **Base map** — OpenTopoMap: contour lines and forest tracks for the walk-in. Free for light use, no API key.
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
| `all_boulders.json` | Search index of every boulder in the cached crags (crags, sectors, routes) |
| `build_all.js` | Builds `all_boulders.json` from `api/*.json` and injects it into `index.html` |
| `build_lists.js` | Holds the eight guidebook style lists and *Affonsos Darlings*, resolves each name against `api/*.json`, routes them, and writes `map_data.json` + the `var DATA=` line of `index.html` |
| `api/*.json` | Cached 27crags crag API responses (routes + sectors + parking) |
| `scrape.js` / `scrape_min.js` | The in-session character scraper |

## Notes / caveats
- The two **Kjugekull** lists are a single crag — a tight ~3 km walkable loop.
- The eight **style lists** were read off a photo of the guidebook page. Where the book and 27crags disagree on a grade, the app shows the 27crags grade, because every other number on the map comes from there too.
- [`ROUTES.md`](ROUTES.md) covers the four PDF lists only; the style lists are in the app.
- The two **Around Ivösjön** lists span ~13 crags around the lake (some across water); their "routes" are a visiting *order*, not a footpath. Distances are straight-line sums, not trail-routed.
- Boulders that are unclimbed projects (no 27crags link in the PDF) are excluded.

Lists © **Carl Nilsask** — [original PDF](https://drive.google.com/file/d/1_B4msOiupGdst2TktklMcE4gQHJrjmW2/view?usp=sharing). Boulder data © 27crags / thetopo.com and the respective contributors.
