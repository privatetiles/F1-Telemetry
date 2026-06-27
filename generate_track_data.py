#!/usr/bin/env python3
"""Generate compact track JSON files with 3-class segment coloring for each circuit."""

import csv, json, os

BASE = os.path.dirname(__file__)
KEJI = os.path.join(BASE, "Keji all data", "FastF1 Data")
OUT  = os.path.join(BASE, "pace_analysis", "track_data")
os.makedirs(OUT, exist_ok=True)

CIRCUITS = [
    {
        "event_key": "fastf1_2026_australia_grand_prix",
        "prefix": "01_australia_2026",
        "lap_csv": "race/telemetry_fastest_laps/HAM_fastest_lap_telemetry.csv",
        "seg_csv": "analysis_outputs/australia_grand_prix_nonrepeating_telemetry_points_segment_categories_3class.csv",
    },
    {
        "event_key": "fastf1_2026_barcelona_grand_prix",
        "prefix": "02_barcelona_2026",
        "lap_csv": "race/telemetry_fastest_laps/HAM_fastest_lap_telemetry.csv",
        "seg_csv": "analysis_outputs/barcelona_grand_prix_nonrepeating_telemetry_points_segment_categories_3class.csv",
    },
    {
        "event_key": "fastf1_2026_canadian_grand_prix",
        "prefix": "03_canada_2026",
        "lap_csv": "race/telemetry_fastest_laps/NOR_fastest_lap_telemetry.csv",
        "seg_csv": "analysis_outputs/canadian_grand_prix_nonrepeating_telemetry_points_segment_categories_3class.csv",
    },
    {
        "event_key": "fastf1_2026_china_grand_prix",
        "prefix": "04_china_2026",
        "lap_csv": "race/telemetry_fastest_laps/VER_fastest_lap_telemetry.csv",
        "seg_csv": "analysis_outputs/shanghai_international_circuit_nonrepeating_telemetry_points_segment_categories_3class.csv",
    },
    {
        "event_key": "fastf1_2026_japan_grand_prix",
        "prefix": "05_japan_2026",
        "lap_csv": "race/telemetry_fastest_laps/NOR_fastest_lap_telemetry.csv",
        "seg_csv": "analysis_outputs/japan_grand_prix_nonrepeating_telemetry_points_segment_categories_3class.csv",
    },
    {
        "event_key": "fastf1_2026_miami_grand_prix",
        "prefix": "06_miami_2026",
        "lap_csv": "race/telemetry_fastest_laps/NOR_fastest_lap_telemetry.csv",
        "seg_csv": "analysis_outputs/miami_grand_prix_nonrepeating_telemetry_points_segment_categories_3class.csv",
    },
    {
        "event_key": "fastf1_2026_monaco_grand_prix",
        "prefix": "07_monaco_2026",
        "lap_csv": "qualifying/telemetry_fastest_laps/LEC_fastest_lap_telemetry.csv",
        "seg_csv": "analysis_outputs/monaco_grand_prix_nonrepeating_telemetry_points_segment_categories_3class.csv",
    },
    {
        "event_key": "fastf1_2025_austrian_grand_prix",
        "prefix": "08_austria_2025",
        "lap_csv": "race/telemetry_fastest_laps/NOR_fastest_lap_telemetry.csv",
        "seg_csv": "analysis_outputs/fastf1_2025_austrian_grand_prix_nonrepeating_telemetry_points_segment_categories_3class.csv",
    },
]

CATEGORY_LABEL = {
    "straight": "Straights",
    "slow_corner": "Slow corners",
    "fast_corner": "Fast corners",
}


def load_segments(seg_path):
    """Returns list of {category, label, start, end} sorted by start."""
    segments = []
    with open(seg_path, newline="") as f:
        for row in csv.DictReader(f):
            segments.append({
                "category": row["category"],
                "label": row["category_label"],
                "start": float(row["start_distance_m"]),
                "end": float(row["end_distance_m"]),
            })
    segments.sort(key=lambda s: s["start"])
    return segments


def assign_category(dist, segments):
    for seg in segments:
        if seg["start"] <= dist <= seg["end"]:
            return seg["label"]
    # fallback: nearest
    nearest = min(segments, key=lambda s: min(abs(dist - s["start"]), abs(dist - s["end"])))
    return nearest["label"]


def load_lap(lap_path):
    """Returns list of (x, y, dist) tuples from telemetry CSV."""
    points = []
    with open(lap_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                x = float(row["X"])
                y = float(row["Y"])
                d = float(row["Distance"])
                if not (x == 0 and y == 0):
                    points.append((x, y, d))
            except (ValueError, KeyError):
                pass
    return points


def thin_points(points, min_dist=15):
    """Keep only points that are at least min_dist apart in Euclidean space."""
    if not points:
        return []
    result = [points[0]]
    for p in points[1:]:
        dx = p[0] - result[-1][0]
        dy = p[1] - result[-1][1]
        if (dx*dx + dy*dy) >= min_dist * min_dist:
            result.append(p)
    return result


for circuit in CIRCUITS:
    event_key = circuit["event_key"]
    prefix = circuit["prefix"]
    circuit_dir = os.path.join(KEJI, event_key)

    lap_path = os.path.join(circuit_dir, circuit["lap_csv"])
    seg_path = os.path.join(circuit_dir, circuit["seg_csv"])

    if not os.path.exists(lap_path):
        print(f"MISSING lap: {lap_path}")
        continue
    if not os.path.exists(seg_path):
        print(f"MISSING seg: {seg_path}")
        continue

    segments = load_segments(seg_path)
    raw_points = load_lap(lap_path)

    if not raw_points:
        print(f"No points for {event_key}")
        continue

    thinned = thin_points(raw_points, min_dist=10)

    # Group consecutive points by category into runs
    labeled = []
    for x, y, dist in thinned:
        cat = assign_category(dist, segments)
        labeled.append({"x": round(x, 1), "y": round(y, 1), "cat": cat})

    # Build segment runs (consecutive same-category points)
    runs = []
    if labeled:
        current_cat = labeled[0]["cat"]
        current_pts = [{"x": labeled[0]["x"], "y": labeled[0]["y"]}]
        for pt in labeled[1:]:
            if pt["cat"] == current_cat:
                current_pts.append({"x": pt["x"], "y": pt["y"]})
            else:
                runs.append({"category": current_cat, "points": current_pts})
                current_cat = pt["cat"]
                # Start new run with last point of previous (for continuity)
                prev = current_pts[-1]
                current_pts = [prev, {"x": pt["x"], "y": pt["y"]}]
        runs.append({"category": current_cat, "points": current_pts})

    out_path = os.path.join(OUT, f"{prefix}_track.json")
    with open(out_path, "w") as f:
        json.dump({"event": event_key, "segments": runs}, f, separators=(",", ":"))

    total_pts = sum(len(r["points"]) for r in runs)
    print(f"{prefix}: {len(runs)} runs, {total_pts} points → {out_path}")

print("Done.")
