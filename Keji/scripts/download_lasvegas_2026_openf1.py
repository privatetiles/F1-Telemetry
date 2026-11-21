"""
Las Vegas GP 2026 — Round 21
OpenF1 session keys:
  Qualifying: 11416  (2026-11-21)
  Race:       11420  (2026-11-22)
"""
import json, gzip, os, time, requests
from datetime import datetime

QUALI_KEY = 11416
RACE_KEY  = 11420

BASE = "/Users/alancai/Desktop/F1 Website Thing With Keji/alan app/public/data/FastF1 Data/fastf1_2026_las_vegas_grand_prix"
TARGET_INTERVAL = 1.0
API = "https://api.openf1.org/v1"

session = requests.Session()


def get(endpoint, params=None, retries=6):
    url = f"{API}/{endpoint}"
    for attempt in range(retries):
        try:
            r = session.get(url, params=params, timeout=30)
            if r.status_code == 429:
                wait = int(r.headers.get('Retry-After', 60))
                print(f"\n    [rate limit — waiting {wait}s]", flush=True)
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
            else:
                raise
    return []


def iso_ts(s):
    if not s: return None
    return datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()


def downsample(pts, interval=TARGET_INTERVAL):
    if not pts: return pts
    result = [pts[0]]
    last_t = pts[0][0]
    for pt in pts[1:]:
        if pt[0] - last_t >= interval:
            result.append(pt)
            last_t = pt[0]
    return result


def nearest_car(car_dict, t):
    if not car_dict:
        return {'speed': 0.0, 'gear': 0, 'throttle': 0.0, 'brake': 0}
    best = min(car_dict.keys(), key=lambda x: abs(x - t))
    return car_dict[best]


def download_fastest_laps(sess_key, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    existing = {f.replace('_fastest_lap_telemetry.csv', '') for f in os.listdir(out_dir) if f.endswith('.csv')}
    drivers = get("drivers", {"session_key": sess_key})
    count = 0

    for drv in drivers:
        abbr = drv.get('name_acronym')
        num  = drv.get('driver_number')
        if not abbr or abbr in existing:
            print(f"  {abbr}: skip")
            continue
        try:
            laps = get("laps", {"session_key": sess_key, "driver_number": num})
            timed = [l for l in laps if l.get('lap_duration') and not l.get('is_pit_out_lap')]
            if not timed:
                print(f"  {abbr}: no timed lap"); continue
            fl = min(timed, key=lambda l: l['lap_duration'])

            t_start = iso_ts(fl['date_start'])
            t_end   = t_start + fl['lap_duration']

            loc_raw = get("location", {"session_key": sess_key, "driver_number": num})
            car_raw = get("car_data", {"session_key": sess_key, "driver_number": num})
            time.sleep(1.0)

            loc = [(iso_ts(d['date']), d['x'], d['y']) for d in loc_raw if d.get('x') is not None]
            car = {}
            for d in car_raw:
                t = iso_ts(d['date'])
                if t:
                    car[t] = {
                        'speed': float(d.get('speed') or 0),
                        'gear':  int(d.get('n_gear') or 0),
                        'throttle': min(100.0, float(d.get('throttle') or 0) / 104.0 * 100.0),
                        'brake': 1 if (d.get('brake') or 0) > 50 else 0,
                    }

            lap_pts = downsample([(t, x, y) for t, x, y in loc if t_start <= t <= t_end])
            if not lap_pts:
                print(f"  {abbr}: no GPS in lap window"); continue

            sess_t0 = loc[0][0] if loc else t_start
            rows = ["Time,SessionTime,Speed,Throttle,Brake,nGear,X,Y,Z,Time_seconds,SessionTime_seconds"]
            for t, x, y in lap_pts:
                c = nearest_car(car, t)
                rel_t = t - t_start
                sess_t = t - sess_t0
                rows.append(f"0 days 00:00:{rel_t:09.6f},{sess_t:.3f},"
                            f"{c['speed']:.1f},{c['throttle']:.1f},{c['brake']},"
                            f"{c['gear']},{x:.1f},{y:.1f},0.0,"
                            f"{rel_t:.3f},{sess_t:.3f}")

            with open(os.path.join(out_dir, f"{abbr}_fastest_lap_telemetry.csv"), 'w') as f:
                f.write('\n'.join(rows))
            print(f"  {abbr}: {len(lap_pts)} pts  ({fl['lap_duration']:.3f}s)")
            count += 1
        except Exception as e:
            print(f"  {abbr}: ERROR — {e}")

    print(f"  → {count} new files written")


print(f"[1/1] Las Vegas GP 2026 — Qualifying (session {QUALI_KEY})...")
download_fastest_laps(QUALI_KEY, f"{BASE}/qualifying/telemetry_fastest_laps")

print("\nDone! Race is tomorrow (session 11420) — run again after the race.")
