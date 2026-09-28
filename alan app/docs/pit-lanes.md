# Pit lane geometry

From the app directory, using Node 22.6 or later:

```sh
npm run generate:pit-lanes
npm test
npm run build
```

The generator reads each race's `telemetry_full_race.json`, or the checked-in `.json.gz` when the plain file is absent. It writes `race/pit_lane.json` with coordinates and the source driver/lap. Source telemetry is never modified.

Each path comes from one complete, timestamp-ordered pit visit. Entry/exit samples and stationary stops are retained, including samples at exactly 80 km/h. Visits with missing data, frozen moving coordinates, large jumps, or implausible geometry are rejected. The runtime fallback uses the same extractor; saved paths are also validated before rendering.

The current 25 race datasets produce 19 validated paths. Empty paths are intentional for Germany 2019 and China, Netherlands, Hungary, Italy, and Madrid 2026, where no complete valid traversal is available. Better source telemetry or pit-stop metadata is required to restore these overlays; unrelated points must not be joined to fill the gaps.

Regression tests check limiter-speed samples, stationary stops, discontinuities, stale requests, and that every generated coordinate belongs to the documented single pit visit.
