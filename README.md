# RetroFit Amsterdam

A neighbourhood-level policy simulator for targeted green renovation subsidies in the
Amsterdam housing market. Single-page React application; every calculation runs
client-side, and there is no backend.

## Running locally

```bash
npm install
npm run dev
```

The dev server starts on <http://localhost:5173>.

| Script | What it does |
| --- | --- |
| `npm run dev` | Regenerates the data, then starts Vite in dev mode |
| `npm run build` | Regenerates the data, then builds to `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run data` | Converts the CSV to JSON only |
| `npm run lint` | Runs oxlint |

## Location: keep this off iCloud Drive

This project used to live under `~/Desktop`, and that Mac has the iCloud
"Desktop & Documents Folders" option enabled, so the entire tree was synced. It
has since been moved to `~/code/retrofit-amsterdam`, outside the synced tree.
Do not move it back.

Two problems came from the sync, and both are now gone.

**The dev server restarted every few minutes.** iCloud's sync daemon (`bird`)
periodically walked the folder writing file metadata, notably the
`com.apple.provenance` extended attribute. Writing an xattr bumps a file's ctime
while leaving contents and mtime untouched. fsevents reported that as a change,
and Vite restarts whenever its own config file appears to change. The evidence
was unambiguous: files nobody had edited that day all had their ctime bumped
inside a single five-minute window, while their mtimes were days old.

```
vite.config.js   mtime=09-01 18:59:36   ctime=09-03 18:05:21
package.json     mtime=09-01 19:06:48   ctime=09-03 18:05:20
index.html       mtime=09-02 17:39:43   ctime=09-03 18:00:51
```

**Everything was pathologically slow**, because `node_modules` (around 8,000
files) sat inside the synced tree and iCloud churned through it, competing for
the same file-provider I/O the toolchain needed. Builds, dev-server starts and
Tailwind compiles would sit at 0% CPU for minutes, which reads like a hang but
is really a process blocked on I/O.

The speedup from moving is not subtle:

| | On iCloud Desktop | On `~/code` |
| --- | --- | --- |
| `vite` startup | 333,081 ms | 2,571 ms |
| `npm install` | minutes, often stalled | 1 s |

A note on moving it: `mv` was not a rename here. iCloud's file provider behaves
as a separate device, so `mv` fell back to a file-by-file copy and had produced
nothing after five minutes. Copying the 62 project files with `rsync` (excluding
`node_modules` and `dist`) and running `npm install` at the destination took
seconds instead.

## Data pipeline

`data/amsterdam_buurt_samenvatting.csv` (517 Amsterdam buurten) is converted to
`src/data/buurten.json` at build time by `scripts/csv-to-json.mjs`, which runs
automatically before `dev` and `build`. The JSON is imported statically and bundled,
so the app makes no network requests for data.

The generated JSON is **not** committed, it is a build artefact and is listed in
`.gitignore`. Edit the CSV, not the JSON.

The converter also handles three quirks of the source file:

- CBS writes suppressed or not-applicable numbers as a bare `.`, which becomes `null`.
- 47 buurten (harbour and industrial zones with effectively no housing stock) have no
  energy-label columns. They are kept in the dataset with `hasEnergyData: false`, and
  the UI shows them in the dropdown marked "no data" rather than hiding them.
- Each buurt carries its parent wijk (`wijkcode` / `wijknaam`), the official CBS district
  level. 2 buurten (Pampusbuurt-West and -Oost) have no wijk mapping and get
  `wijkName: null`; they are never grouped.

The converter reads columns by name, so adding columns to the CSV does not break it.

## Search: buurt and wijk

People search for the district, "Jordaan", "Oude Pijp", "Museumkwartier", which in CBS
terms is the **wijk**, while the simulator operates on the **buurt** beneath it. The
dropdown therefore matches both levels at once (`src/lib/search.js`):

- A **wijk match** renders as a labelled group with all its constituent buurten listed
  underneath as selectable options (1 to 11 per wijk). Typing "Pijp" returns three
  groups: Nieuwe Pijp, Oude Pijp, Zuid Pijp.
- A **buurt match** not already covered by a matched wijk renders standalone, ungrouped,
  as before. The 2 buurten with no wijk can only ever appear this way.
- Wijken whose name *starts with* the query rank above those that merely contain it;
  within any list, simulatable buurten come before "no data" ones, then alphabetically
  by Dutch collation.
- Matching is case- and diacritic-insensitive.

Grouped and standalone rows share one keyboard sequence, so the arrow keys move
continuously across group boundaries. The empty-query list is unchanged: a flat
alphabetical listing.

This is a search and presentation layer only, the data model, the selection, and every
calculation downstream of it are untouched.

City-wide aggregates are computed once at build time. The headline E/F/G rate is
**weighted by the number of labelled dwellings per buurt** (9.9%); the unweighted mean
across buurten is higher (12.9%), because the worst-performing buurten tend to be small.

### Ranking reliability

Four buurten report 100% E/F/G off one or two labelled dwellings. Ranking by raw
percentage would put those at the top, so the ranking chart defaults to buurten with at
least 100 labelled dwellings (405 of the 470 with label data). The threshold lives in
`MIN_LABELLED_FOR_RANKING` and can be switched off in the UI. It affects the ranking
only, every buurt with label data stays selectable in the simulator.

## Model coefficients

All coefficients live in **`src/config/coefficients.js`**, each with its source, units,
base year, and a note on how much confidence it carries. Nothing else in the codebase
hard-codes a parameter. In short:

| Parameter | Value | Source |
| --- | --- | --- |
| Renovation cost | Lookup table by dwelling type × starting label | TNO/PBL, *Bepaling Isolatiekosten Woningen, Startanalyse 2025* (Feb 2025), Table 3.1, "zelfstandig" scenario, target schillabel B, 2020 € excl. VAT |
| Reference dwelling | 75 m² | Cost scales as `cost × m²/75`, proportional around the reference, not a €/m² rate |
| Home value uplift | 4% (adjustable 4–6%) | Brounen & Kok (2011), *JEEM* 62(2), ~3.7% A/B/C premium |
| CO₂ emission factor | 1.8 kg CO₂/m³ gas | RVO, *Nederlandse lijst Energiedragers en standaard CO₂-emissiefactoren* (TTW combustion) |
| Gas saving | 45% (adjustable 40–50%) | **Rough estimate, no single citation.** Flagged as such in the config and in the UI |

## Target label

The selector offers **A** and **B**, and the distinction between them is honest about
where the sourced figures stop.

**B is costed.** The TNO/PBL table publishes exactly one target, schillabel B, and that
is the only envelope cost quoted as a source.

**A is not costed.** Reaching a genuine label A means the same envelope package plus a
heating-system replacement (heat pump, low-temperature emitters, or a district-heat
connection), and no per-dwelling figure for that component exists in our sources.
Rather than invent one, selecting A opens an installation allowance the user sets
themselves. It defaults to zero, which makes an A run cost exactly what a B run costs
and says so in the interface. The allowance is labelled as an assumption, never as a
source, and `renovationCost` returns the envelope and installation parts separately so
the interface can show which half is which.

**A+ and A++ are deliberately absent.** Costing them would mean extrapolating past the
end of the published table, and an invented number carried through into a payback
period is worse than an option the interface simply does not offer.

### Stated limitations

These are surfaced in the interface as tooltips and footnotes, not buried here:

- **Insulation only.** The cost table covers the building envelope to schillabel B. It
  excludes the heating-system upgrade (heat pump, low-temperature emitters, district
  heat) that a real label-A transition additionally requires.
- **The value uplift is the softest number in the model.** Aydin et al. (2020) find the
  label premium has weakened over time, and it is realised only on sale, which is why
  the payback calculation deliberately excludes it.
- **The gas saving is not calibrated.** CBS did not publish neighbourhood-level gas and
  electricity consumption for 2025, so the energy label distribution is the only energy
  indicator in the dataset, and the savings fraction could not be checked against
  observed consumption. Realised savings typically fall short of engineering estimates
  (prebound and rebound effects).
- **Buurt-level totals assume full take-up** of an identical dwelling throughout. They
  are an upper bound, not a budget forecast.

## Energy poverty risk score

A proxy composite, 0 to 100, computed per buurt in `src/lib/energyPoverty.js` and
offered as a second measure in the ranking chart.

The conceptual basis is CBS/TNO's Monitor Energiearmoede, which treats energy poverty
as the intersection of low income, poor dwelling energy quality (the "Lage Energie
Kwaliteit" threshold, which covers labels D through G rather than E/F/G alone) and a
high energy cost burden. **This score is not that indicator.** CBS has not published
household income at buurt level for 2025, so the income and cost-burden legs cannot be
measured. Read it as a relative ranking of neighbourhoods, not a count of households.

Three components, weighted equally at one third each:

| Component | Source columns | Direction |
| --- | --- | --- |
| Poor energy quality | `pct_D` + `pct_EFG` | higher is riskier |
| Dwelling value | `woz_gemiddeld_x1000`, inverted | lower is riskier |
| Tenure vulnerability | `pct_huurwoning`, `pct_wcorp` | higher is riskier |

Equal weights are the honest default: the official indicator rests on three legs, we
have one proxy for each, and nothing in this dataset justifies preferring one over
another.

Two deliberate departures from the obvious implementation, both explained at length in
the module:

- **Percentile rank, not min-max.** WOZ is strongly right-skewed across Amsterdam
  (median around 504k, maximum around 2,286k). Under min-max a single expensive
  neighbourhood compresses every other buurt into a narrow band.
- **Tenure is averaged, not summed.** `pct_wcorp` is a subset of `pct_huurwoning`
  (verified: `pct_koopwoning` + `pct_huurwoning` = 100 everywhere, and `pct_wcorp` never
  exceeds `pct_huurwoning`). Summing them raw double-counts social housing and yields a
  component that can reach 200. Each is percentile-ranked separately and averaged, which
  still lets social housing raise the score on top of rental share.

40 of the 470 buurten with label data report no WOZ or no tenure split. They get a null
score and drop out of the risk ranking rather than being imputed.

The `pct_EFG`-only views elsewhere in the application are unchanged. D-and-worse is used
by this score alone, and the two are never mixed.

## Heritage protection flag

`src/config/heritage.js` marks neighbourhoods that fall inside well-known Amsterdam
protected areas, so the simulator can warn that envelope work may need a municipal
permit. Informational only: it feeds nothing into cost, subsidy, CO2 or payback.

**This is an approximation.** There is no buurt-level dataset of protected status here,
and real designations follow street and parcel boundaries rather than CBS statistical
geography. The flag is applied at wijk level and is coarse in both directions: a flagged
wijk contains unprotected infill, and protected monuments exist across the whole city
outside the listed areas. Replacing it with the municipal designation layer is the same
piece of work as adding the CBS boundary geometry for a proper choropleth.

21 wijken are flagged, covering 127 buurten (119 with energy data), grouped as historic
centre, Oud-Zuid, Plan Zuid / Rivierenbuurt, Betondorp, Admiralenbuurt and Amsterdam
School. Every entry was checked against a real `wijknaam` in the data.

### Which mappings are approximate

Not every area named in the brief exists as a `wijknaam`. The table records how each one
was resolved, so the reasoning is auditable rather than buried in the code. "Direct"
means the area name is itself a wijk in the CBS data.

| Area | How it is represented | Basis |
| --- | --- | --- |
| Historic centre | Direct: 10 Centrum wijken flagged individually | Beschermd stadsgezicht; the canal ring within it is UNESCO-listed |
| Jordaan | Direct | Wijk of the same name |
| Betondorp | Direct | Wijk of the same name |
| Spaarndammerbuurt / Zeeheldenbuurt | Direct | Amsterdam School housing, Het Schip |
| **Oud-Zuid** | **Indicative.** No wijk of this name. Split into Museumkwartier, Apollobuurt, Willemspark, Vondelparkbuurt | The four wijken forming its historic core |
| **Rivierenbuurt** | **Indicative.** No wijk of this name. Split into IJselbuurt, Rijnbuurt, Scheldebuurt | Its three constituent wijken, plus Stadionbuurt for Plan Zuid |
| **Admiralenbuurt** | **Weakest mapping. Approximated by Chassébuurt** | No wijk *or* buurt of this name exists in the data. Chassébuurt's constituent buurten are Van Brakelkwartier, Kortenaerkwartier and Filips van Almondekwartier, the admiral-named streets the Admiralenbuurt is named for |

The three bold rows are inferences, not municipal designations. Anything relying on them
should say so. Spaarndammerbuurt was added beyond the areas originally named for this
feature, because the designation there is well established.

## Visual design

The reference is the printed Dutch statistical monograph, the sort of document
this analysis would actually appear in, rather than a product dashboard. Three
decisions carry it, and they are set out in full at the top of `src/index.css`:

- **Paper, not screen.** A warm uncoated off-white ground with warm near-black
  text. Depth comes from hairline rules and flat tonal blocks. No blur, no drop
  shadows, no rounded glass cards.
- **Colour is argument.** Two hues only. Delft blue carries every neutral
  measure and every interactive affordance. Brick red is reserved exclusively
  for the E/F/G bracket, so red always means the same thing wherever it appears.
- **Type does the work.** Newsreader (a text serif) sets headings and every
  large figure. IBM Plex Sans carries running text, IBM Plex Mono carries codes,
  axes and small labels, so machine-readable values are visibly a different
  class of thing from prose. Nothing is set in Inter.

Layout varies by section on purpose: an inverted ink masthead, an asymmetric
seven-and-five opening spread, headline figures set as a ruled table of figures,
and the theory and recommendation sections as a numbered editorial list. The
bordered `plate` is used only where content genuinely needs enclosing.

## Charts

The energy-label scale is ordinal, so labels A–D use a single-hue sequential teal ramp
and E/F/G uses a reserved warning amber. The ramp was checked with a palette validator
against the dark chart surface (`#0f1524`): monotone lightness, adjacent ΔL ≥ 0.06,
light-end contrast 3.06:1, single hue. Every segment also carries a direct text label
and a 2px gap, so nothing rests on colour alone. Values are in `src/config/palette.js`.

The neighbourhood ranking chart stands in for a choropleth map until real geometry is
wired in. It offers two measures, poor label share and the energy poverty risk score,
and marks protected-cityscape neighbourhoods on whichever is active. The heritage cue is
a dashed outline on the bar plus a filled square against the name, never colour on its
own, since colour is already carrying the measure. The city-average reference line is an
E/F/G figure and is therefore only drawn on that measure.

## Deploying to Vercel

`vercel.json` is included and the project needs no configuration beyond it:

```bash
npx vercel
```

Vercel runs `npm run build` (which regenerates the data) and serves `dist/`. Since the
data is bundled at build time, there is nothing to provision, no database, no
environment variables, no serverless functions.

## Notes on the implementation

- Tailwind's automatic content detection is switched off (`source(none)`) and the two
  source globs are declared explicitly in `src/index.css`. Automatic detection walks up
  from the stylesheet looking for a repository boundary to stop at; this project is not
  a git repository, so the walk escaped into the surrounding Desktop folder and stalled
  the build for minutes. Naming the sources keeps the scan inside the project.
- The ranked windows in the E/F/G chart show exactly their own top or bottom slice. An
  earlier version spliced the selected buurt in whenever it fell outside the window,
  which broke the "Lowest" view twice over: the splice re-sorted descending, so a rank-1
  buurt sat at the head of a list of the lowest, and its value then set the axis maximum
  and flattened every genuinely low bar to a sliver. The axis now scales to the rows
  actually drawn, the city-average reference line is hidden when it falls outside that
  range, and a note points at "Around selection" when the selection is off-window.

- Section switching is React state with a keyed enter-only Framer Motion transition.
  It deliberately avoids `AnimatePresence mode="wait"`, which gates mounting the
  incoming section on the outgoing one's exit animation completing, and
  `requestAnimationFrame` is throttled in background tabs, which can leave the page
  blank. See the comment in `src/App.jsx`.
- Result counters animate with a spring but commit the exact value on a settle timer,
  so a displayed number is never left stale if frames were never painted.
- `MotionConfig reducedMotion="user"` plus a CSS media query make the whole interface
  respect the viewer's OS "reduce motion" setting.
- Both columns of the simulator grid carry `min-w-0`. Grid items default to
  `min-width: auto`, so one `white-space: nowrap` descendant (the truncated
  buurt/wijk subtitle, or a wide chart) can size the whole track to its min-content
  and push the layout past the viewport on narrow screens.

## Content still to be written

Sections 3 (Theoretical Framework), 4 (Policy Recommendations) and 5 (Team Process &
AI Statement) are built out as card scaffolding with `[CONTENT TO BE ADDED]`
placeholders, as is the problem statement on the Executive Summary. Card titles and
ordering are final; only the prose is pending.
