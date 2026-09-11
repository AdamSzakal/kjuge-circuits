<div align="center">

<img src="icons/icon-192.png" width="76" alt="">

# Kjuge Circuits

**A walking-route planner for the boulders of Kjugekull and Ivösjön.**

Pick a circuit, get the shortest walk through it, and take the whole thing to the crag with no signal.

[![Open the app](https://img.shields.io/badge/open-kjuge.netlify.app-0ea5e9?style=flat-square)](https://kjuge.netlify.app)
[![Boulders](https://img.shields.io/badge/boulders-3141-f59e0b?style=flat-square)](#the-data)
[![Crags](https://img.shields.io/badge/crags-14-f59e0b?style=flat-square)](#the-data)
[![Build step](https://img.shields.io/badge/build_step-none-22c55e?style=flat-square)](#why-one-file)
[![npm packages](https://img.shields.io/badge/npm_packages-0-22c55e?style=flat-square)](#why-one-file)
[![PWA](https://img.shields.io/badge/PWA-installable-8b5cf6?style=flat-square)](#take-it-to-the-crag)

<img src="docs/demo.gif" width="280" alt="The sheet at rest, the walk, a block page with its photographs, a tick, the topo, two circuits merged, and the grade filter">

<sub>Rebuilt from the live app by <a href="record_demo.js"><code>record_demo.js</code></a> — run it whenever the interface changes.</sub>

</div>

---

## What this is

Four bouldering top-lists for **Kjugekull** and **Around Ivösjön** were published as a PDF by **Carl Nilsask** in 2021. They are a good list and a bad map: hundreds of boulders, no order, no walk.

This project takes every boulder on those lists, looks each one up on 27crags (now thetopo) for its GPS position, and plots the shortest walk through them all. Then it does the same for the eight **Problem styles** lists of the printed Kjugekull guidebook, and for two circles the community made — so there are **14 circuits** in the app, and you can build your own out of any of the 3 141 boulders in the dataset.

It is one HTML file. No backend, no login, no build step, no packages.

## Open it

| | |
|---|---|
| **On the web** | **[kjuge.netlify.app](https://kjuge.netlify.app)** — nothing to install. |
| **On your phone** | Open the link, then *Add to home screen*. It installs, and it opens cold with no signal. |
| **From disk** | `git clone` and open [`index.html`](index.html) in a browser. Everything but the map tiles and the photographs is already inside the file. |

## What you get

|  |  |
|---|---|
| 🔎 **Search every boulder** | 3 141 problems over 14 crags, by name, grade, crag or sector. Hits light up orange on the map, also outside your circuit. |
| 🧩 **Build your own circuit** | Add boulders from a search, from a stop, or paste a whole list of names at once. Name it and share it — the link carries it, so there is no login and no backend. |
| 🧭 **The shortest walk** | Nearest-neighbour + 2-opt over the distinct blocks, anchored at the nearest parking, recomputed in the browser whenever you change the pick. |
| 🗺️ **Merge circuits** | Tick several lists and they become one walk, shared blocks counted once. Tick none and the map shows all 542 blocks of the dataset to browse. |
| 🎚️ **Filter** | Grade, 13 characteristics and star rating, applied to the built-in lists and to your own circuits alike. |
| 🪨 **Read the block** | Every stop is a page: the topo photographs, then each boulder with its grade, ⭐ rating, characteristics, ascents, videos and description. The best line of the block is marked. |
| ✅ **Tick what you send** | One tap on the ring. The header then counts what is left, and what you have done today. Ticks stay in your browser. |
| 📍 **Where you are** | The crosshair follows your position and every stop says how far away it is. Satellites need no signal, so this is at its best in the woods. |
| 📴 **Works with no signal** | *Save this walk for offline* puts the map tiles and every stop photograph in the browser before you leave the house. |
| 🌗 **One sheet, dark or light** | The chrome follows the system; the map keeps its daylight, because contour lines read better that way. Everything lives in one bottom sheet that is always on screen. |

<details>
<summary><b>Every feature, with the reasoning behind it</b></summary>

<br>

- **Search** — free-text search over **every** boulder in the dataset (3141 boulders across 14 crags), matching name, grade, crag and sector.
- **Map search** — the search box at the top of the panel draws its hits on the map in **orange**, also when they sit outside the picked circuits and outside the filters. A hit that is off-screen pulls the map to it. Each hit can be added to the current circuit, from the result row or from its map popup.
- **My circle** — add any boulder from the search results to your own circle, name it, and get a walking route through it just like the built-in lists. The **Share** link carries every circle (ids + names), so no backend or login is needed.
- **Paste a list** — paste problem names (one per line, comma separated, or `Name, Grade` pairs) to fill a circle in one go. Numbering, quotes and a header row are stripped; names are read as Kjugekull names first and only then against the other crags; the grade breaks the remaining ties; anything unmatched is reported back.
- **Build a circuit** — boulders are added and removed in the circuit editor (search results, the pasted list, or the × of the *In this circuit* list), and from the stop itself: every boulder of a stop carries a **+** that puts it in the circuit.
- **Circuits** — a tab of its own: multi-select checkboxes over the built-in lists (community first, then the top-lists and the guidebook styles) and your own circuits. Selecting several merges their boulders, de-duplicates shared sectors, and recomputes one combined walking route. With nothing picked the map shows **every block of the dataset** in grey instead of going empty — 3141 boulders over 542 blocks, with no route, because nobody picked an order. The view stays where you were looking, so the blocks appear around it; tap one to read it, and pick a circuit to get the walk back. A list that crosses several crags is counted in crags, not in kilometres, because its route is a visiting order and not a footpath. The picks of the last visit come back on the next one (`localStorage`), browsing included; only a first visit takes the default pick, and a link that carries its own lists always wins over both. The list numbers a share link carries belong to the data, not to the order the tab shows, so reordering the groups never moves somebody else's link.
- **Filters** — the third tab: grade, character and star rating, applied to everything drawn on the map, the built-in lists *and* your own circuits. Picking circuits and filtering their contents never change each other. The tab carries a dot while anything is narrowed. Grade chips cover the whole dataset scale (3 … 8C, plus ungraded); a boulder of a circle that a filter removes is marked *filtered out* in the editor.
- **Character filter** — 13 characteristics scraped from 27crags (technical, mental, slopers, crimpers, slab, powerful, dangerous, crack, jugs, endurance, pockets, dyno, traverse). Shows boulders with *any* selected characteristic.
- **Shortest route** — nearest-neighbour + 2-opt TSP over the distinct sectors, anchored at the nearest parking, recomputed in-browser whenever the selection/filters change.
- **The walk** — the first tab: the stops in walking order, each with its boulder count and grade range. A tap on a line opens that stop on the map. Above it sits the **Access & ethics** notice of every crag the walk touches, in the crag's own words.
- **Stops** — a stop reads as a block page: photographs of the block, then every boulder with grade, ⭐ rating (0–3), characteristics, logged ascents, videos, the route description and a link to 27crags, then the block itself on 27crags. The best line of each block is marked **Best on block** — by the same Bayesian score *Jacobs Running* is built with (see below), so a 3.0 from four people cannot outrank a 2.2 from three hundred.
- **Photographs** — the topo pictures of the block, scrolled sideways. A tap opens the big one, captioned with the boulders drawn on it, and every name in that caption opens the line on 27crags.
- **Share** — the current selection (lists + grade + character filters) is encoded in the URL hash; the **Share** button copies a link that reopens the exact same circuit. No backend required.
- **Base map** — OpenTopoMap: contour lines and forest tracks for the walk-in. Free for light use, no API key.
- **The toilet** — Kjugekull's access notice says there is a toilet close by the café, so the map says where it is: a 🚾 stands at it, 53 m from Caféblocket. It is drawn once and never taken off, whatever circuit you pick, because it belongs to the ground and not to the walk. Its pane sits over the route line and under the stops, so it can never cover a boulder you came for. The position is the one OpenStreetMap carries for it — open around the clock, no fee.
- **Ticks** — one tap on the ring of a boulder marks it done. The walk then counts what is left, on the day (*100 boulders · 59 stops · 3.13 km · 12 done*) and on every stop. A filter hides what you have finished. Beside that count stands the day's own — *2 today* — everything you have ticked since midnight, whichever circuit it came from, so a day at the crag adds up even when you move between lists. Ticks stay in this browser: a share link carries the circuit, not somebody else's ticklist.
- **Where you are** — the crosshair button follows your position, drawn with its accuracy, and every line of the walk then says how far away it is, with the nearest stop marked. Satellites need no signal, so this is at its best in the woods. A drag of the map stops it following you. Planning from home, the map stays on the boulders: it only goes to you if you are within 5 km of the circuit, and a small toast over the map says why it stayed (*You are 424 km from the walk, so the map stays on it*). Location trouble — permission refused, no fix yet — comes as a toast too, because the sheet it used to be written in may be folded away. Tapping the button again takes you there anyway.
- **Offline** — **Save this walk for offline** takes the whole walk with you: map tiles into IndexedDB (about 90 for the whole of Kjugekull) and, when the app is opened from its web address, the photographs of every stop as well, at the size the strip shows (40–70 kB each, so *Affonsos Darlings* is 60 pictures and about 4 MB — the count and the size are on the button before you tap it). The big picture behind a tap is ten times that and is not taken along; with no signal the strip's own picture stands in for it, captioned with the same lines. The page, its data and your ticks are already local. A tile drawn once draws again with no signal. A save is confirmed by a toast, and the section then folds to one line — *Offline ✓ Ready for no signal* — so the walk list comes straight after it. Readiness is counted over the tiles **this walk** asks for, not over whatever the store happens to hold, because panning the map alone fills it with tiles of somewhere else; picking a walk that is not saved opens the fold again.
- **Install it** — served over https the app registers a service worker and carries a manifest, so it installs to the home screen and opens cold with no signal. Opened from a file it works the same, minus the photographs: a browser gives no worker to a `file://` page, and the 27crags host allows no copy to be kept without one. A strip that cannot load takes itself off the stop.
- **Dark** — the chrome follows the system. The map keeps its daylight in both, because contour lines and forest tracks read better that way.
- **The sheet** — one bottom sheet holds everything, and it is always on screen. Its header is the way in: a grab bar, the search box, where the walk starts (*① Starts at Caféblocket*), the day in one line (*100 boulders · 59 stops · 3.13 km*), and a tab bar for **The walk**, **Circuits** and **Filters**. A tap on the grab bar, on a tab, or in the search box folds the list out; a second tap on the grab bar folds it back. A search takes the body over for as long as there is something in the box. A phone parks the header along the bottom edge, over a full-screen map that keeps the route clear of it; a big screen docks the same sheet at the left and starts unfolded.
- **How many have opened it** — the credits line at the foot of the sheet ends with a count: *Opened by 1 284 climbers.* There is no backend here, so a free counter service ([abacus](https://abacus.jasoncameron.dev)) holds the number and the browser itself says whether it is new: the first visit adds one and writes a mark in `localStorage`, every visit after that only reads. So it counts browsers, not people — the same person on a phone and on a laptop counts twice, and a cleared store counts again. It is the closest a page with no login can come to a count of people. The mark is written only after the service has answered, so a first visit with no signal is counted on the next one instead of being lost. Nothing is sent but the request itself, and a failure — no signal, the service gone, a `file://` page — leaves the line away and changes nothing else.

</details>

## The circuits

Fourteen are built in. Tick one, or tick several and they merge into a single walk.

### Community — the ones to climb

| Circuit | Boulders | Stops | Grades | Walk |
|---|--:|--:|---|--:|
| **Affonsos Darlings** | 33 | 16 | 3+ – 5+ | 1.02 km |
| **Jacobs Running** | 24 | 22 | 3+ – 7C+ | 2.02 km |

*Affonsos Darlings* is a warm-up circle of Kjugekull classics proposed by **Affonso** — it is what a first visit opens on. *Jacobs Running* is 24 boulders [chosen by the machine](#jacobs-running--how-the-machine-chose) out of the crag data alone, with no guidebook.

### The top-lists — Carl Nilsask, 2021

| Circuit | Boulders | Stops | Grades | Walk |
|---|--:|--:|---|--:|
| Kjugekull · Top 100 | 100 | 59 | L – 8A+ | 3.13 km |
| Kjugekull · Hidden gems | 100 | 63 | L – 8A | 3.62 km |
| Around Ivösjön · Top 100 | 82 | 48 | L – 8B | 13 crags <sup>†</sup> |
| Around Ivösjön · Hidden gems | 77 | 57 | L – 8B+ | 12 crags <sup>†</sup> |

<sup>†</sup> These two span the crags around the lake, some of them across water. Their "route" is a visiting *order*, not a footpath, so the app counts them in crags and not in kilometres.

### Guidebook styles — the *Problem styles* page

| Circuit | Boulders | Stops | Grades | Walk |
|---|--:|--:|---|--:|
| The highballs | 16 | 9 | 6A – 7C+ | 1.64 km |
| The slabs | 16 | 16 | 4+ – 7B | 1.72 km |
| The mantles | 16 | 13 | 5 – 7A+ | 1.84 km |
| The Bucket list | 16 | 14 | 6A – 8A | 1.72 km |
| The traverses | 10 | 9 | 4+ – 7C | 1.52 km |
| The overhangs | 10 | 9 | 7A – 8B | 1.69 km |
| The dynos | 10 | 9 | 6A – 7C | 1.99 km |
| The weird ones | 10 | 10 | 5 – 7B | 2.10 km |

A static, human-readable itinerary of the four top-list routes is in [`ROUTES.md`](ROUTES.md).

## Take it to the crag

Kjugekull has trees and no bars on the phone. Three things follow from that.

- **The page keeps itself.** Served over https, a service worker holds the page, Leaflet and the boulder photographs, so the app opens cold with no signal and installs to the home screen.
- **The map keeps itself.** Map tiles go into IndexedDB as you pan, and *Save this walk for offline* fetches the rest of them — about 90 tiles for the whole of Kjugekull — before you leave.
- **Your ticks never leave.** They live in `localStorage`. A share link carries the circuit, not somebody else's ticklist.

## How it works

### The pipeline

1. **Extract links** from `Kjuge top-lists v1.pdf` (annotation URIs) and align each with its grade by text position.
2. **Keep every graded boulder** on the lists — from L up to the hardest one in the data, which is 8B+. There is no upper cut.
3. **Locate** every boulder: the `27crags` web API (`/api/web01/crags/<id>`) gives a `sector_id` per route, and each sector has GPS. A sector is the natural walking granularity. Parking markers come from the same API.
4. **Route** each list with a TSP (nearest-neighbour + 2-opt), anchored at parking.
5. **Characteristics** are only rendered on 27crags route pages for signed-in users, so they were scraped from an authenticated browser session (`.tag` classes on each boulder page). Star ratings come straight from the crag API.
6. **Render** everything into the self-contained `index.html`.

### Why one file

Every number the app needs is known before anybody opens it, so there is nothing for a server to do. The data is baked into `index.html` as one `var DATA=` line, and the whole page comes to about 480 kB — the size of one full-size topo photograph.

What follows is worth the trade: no backend to keep alive, no login, no API key, no bundler and no packages. `git clone` and a double-click is a working copy of the app. The only things that come off the network are the Leaflet library, the map tiles and the photographs, and the service worker keeps all three.

Nothing is built to open the app. The two scripts that *write* the data — `build_all.js` and `build_lists.js` — are run by hand when the crag data changes, and they use node built-ins only.

### The data

| | |
|--:|---|
| **3 141** | boulders |
| **542** | blocks, each one a stop |
| **14** | crags, cached from the 27crags API |
| **13** | characteristics scraped per boulder |
| **3 – 8C** | the grade span of the dataset |
| **14** | built-in circuits |

<details>
<summary><b>Every file in the repo, and what it holds</b></summary>

<br>

| File | What |
|---|---|
| `index.html` | The whole app — markup, style, script and data in one file |
| `Kjuge top-lists v1.pdf` | Source lists |
| `map_data.json` | The data embedded in `index.html` (stops, boulders, grades, chars, ratings, per-list routes) |
| `links_grades.json` | Each PDF link paired with its list + grade |
| `located.json` | The 359 top-list boulders (L–8B+) with sector GPS |
| `routes.json` | Precomputed per-list TSP order + distance |
| `tags_by_path.json` | Scraped characteristics per boulder |
| `boulder_urls.json` | All 215 boulder URLs |
| `all_boulders.json` | Search index of every boulder in the cached crags (crags with their access notice, sectors with their topo pictures, routes with ascents and videos) |
| `build_all.js` | Builds `all_boulders.json` from `api/*.json` and injects it into `index.html` |
| `build_lists.js` | Holds the eight guidebook style lists, *Affonsos Darlings* and *Jacobs Running*, resolves each name against `api/*.json`, routes them, and writes `map_data.json` + the `var DATA=` line of `index.html` |
| `api/*.json` | Cached 27crags crag API responses (routes + sectors + parking) |
| `scrape.js` / `scrape_min.js` | The in-session character scraper |
| `sw.js` | Service worker: keeps the page, Leaflet and the photographs. Only runs when the app is served |
| `manifest.webmanifest`, `icons/` | Install to the home screen |
| `record_demo.js` | Rebuilds `docs/demo.gif` by driving Chrome over the DevTools Protocol (node built-ins + ffmpeg, no packages) |
| `docs/demo.gif` | The walkthrough at the top of this file |
| `ROUTES.md` | A static itinerary of the four top-list routes |

</details>

## Jacobs Running — how the machine chose

No guidebook, only the crag data:

1. **Score every Kjugekull boulder** with at least 15 logged ascents by a Bayesian rating, `(v*R + m*C) / (v + m)` — `v` ascents, `R` its 27crags rating, `C` the crag mean (1.23), `m` = 20. A 3.0 from four people cannot outrank a 2.2 from three hundred.
2. **Fix a grade ladder** so the circuit reads as a session: 6 easy (L–5+), 7 middle (6A–6B+), 4 upper (6C–6C+), 5 hard (7A–7B), 2 elite (7B+ and up).
3. **Search** (simulated annealing, 12 restarts) for the 24 boulders that maximise total score, plus a bonus per covered characteristic and per distinct grade, minus the walking distance and minus any sector asked for more than two problems.
4. **Two swaps by hand**: a real dyno (*Perssons dyno*) and the classic mantle (*Mr Mantel direkt*) in place of two untagged fillers.

Result: 24 boulders, 3+ to 7C+, **all 13 characteristics**, 22 stops, **2.02 km**.

## Notes and caveats

- The two **Kjugekull** lists are a single crag — a tight ~3 km walkable loop.
- The eight **style lists** were read off a photo of the guidebook page. Where the book and 27crags disagree on a grade, the app shows the 27crags grade, because every other number on the map comes from there too.
- [`ROUTES.md`](ROUTES.md) covers the four PDF lists only; the style lists are in the app.
- The two **Around Ivösjön** lists span ~13 crags around the lake (some across water); their "routes" are a visiting *order*, not a footpath. Distances are straight-line sums, not trail-routed.
- Boulders that are unclimbed projects (no 27crags link in the PDF) are excluded.

## Access and ethics

Every walk opens with the **Access & ethics** notice of each crag it touches, in the crag's own words — bird restrictions, parking that fits one car, houses to keep a low profile near. Read it before you go. Brush your tick marks, take your rubbish home, and park so a tractor can still get past.

## Credits

Lists © **Carl Nilsask** — [original PDF](https://drive.google.com/file/d/1_B4msOiupGdst2TktklMcE4gQHJrjmW2/view?usp=sharing).
The eight style lists come from the "Problem styles" page of the printed **Kjugekull guidebook**.
*Affonsos Darlings* was proposed by **Affonso**.
Boulder data © **27crags / thetopo** and the respective contributors.
Map tiles © **[OpenTopoMap](https://opentopomap.org)** and **OpenStreetMap** contributors (CC-BY-SA).
