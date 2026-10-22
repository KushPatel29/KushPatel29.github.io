# Case-study video tours

`assets/video/*-tour.mp4` are rendered here, frame by frame, from real
material: each project's committed Power BI, Excel and app screenshots, and
terminal output captured from running that project's own tests (pytest, and
`dbt build` for the B.C. pipeline) on 22 October 2026. Nothing in a tour is
mocked up; every caption figure is one the project's README states and tests.

- `stage.html` draws one frame for any time `t` (no real-time capture, so the
  output is identical on every run).
- `specs/*.json` is each tour's script: scenes, crops, highlight boxes and
  captions. The captions are burned in and also written to a WebVTT track.
- `render.mjs` steps through the frames in Chromium and pipes them to ffmpeg
  (H.264, 24 fps, 1280×720).

## Rebuild

Copy the screenshots each spec names into `tools/video/img/` (gitignored by
`tmp/`-style convention; they live in the project repositories):

| File | Source |
|---|---|
| `go_rev.png`, `go_exec.png`, `go_diag.png`, `go_xl.png` | GrowthOps-OS `docs/images/pbi-revenue-truth.png`, `pbi-executive.png`, `diagnostics.png`, `excel-dashboard.png` |
| `ct01.png`, `ct07.png`, `ct04.png`, `ct03.png`, `ctgis.png` | supply-chain-control-tower `powerbi/screenshots/01-…`, `07-…`, `04-…`, `03-…`, `docs/assets/gis-network-risk-studio.png` |
| `bc_dash.png`, `bc_prov.png`, `bc_plan.png`, `bc_checks.png` | bc-local-government-finance `docs/img/dashboard.png`, `province.png`, `plan.png`, `checks.png` |

Then, from `tools/video/` with `fonts/` copied from `assets/fonts/`:

```bash
node render.mjs specs/growthops.json ../../assets/video/growthops-tour.mp4
node render.mjs specs/growthops.json /tmp/go --preview 3,9,15   # stills
```
