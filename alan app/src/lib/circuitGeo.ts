// Coordinate calibration: FastF1 XY (decimeters, arbitrary origin) → WGS-84 lat/lon.
//
// How it works:
//   1. xyPerMetre ≈ 10 for all circuits (verified from telemetry Distance column).
//   2. We define a reference point: the known lat/lon of the circuit centroid
//      and the corresponding XY centroid measured from telemetry.
//   3. rotationRad: angle (CCW, radians) to rotate the XY frame before projecting
//      to geographic N/E. rotationRad = 0 means XY Y-axis ≈ North, X-axis ≈ East.
//
// Rotation notes per circuit:
//   british      – lap starts heading NNE (~35°). Rotation ≈ 0 is a reasonable first pass.
//   canadian     – elongated N-S island, Y ≈ North is plausible.
//   monaco       – winds through streets, needs tuning.
//   barcelona    – main straight roughly E-W, small positive rotation expected.
//   austrian     – compact mountain circuit, small rotation.
//   miami        – roughly E-W stadium circuit.
//
// All rotations start at 0 and are tuned visually once the overlay is on screen.

export interface CircuitGeo {
  centerLat:  number  // lat of the XY centroid point
  centerLon:  number  // lon of the XY centroid point
  xyOriginX:  number  // FastF1 X coordinate of that centroid
  xyOriginY:  number  // FastF1 Y coordinate of that centroid
  xyPerMetre: number  // FastF1 units per metre (≈10 everywhere)
  rotationRad: number // CCW rotation to align XY → geographic N/E
}

export const CIRCUIT_GEO: Partial<Record<string, CircuitGeo>> = {
  british: {
    centerLat:  52.0733, centerLon:  -1.0174,
    xyOriginX:  3042,    xyOriginY:  5066,
    xyPerMetre: 9.93,    rotationRad: 0,
  },
  canadian: {
    centerLat:  45.5050, centerLon:  -73.5262,
    xyOriginX:  567,     xyOriginY:  6437,
    xyPerMetre: 9.94,    rotationRad: 0,
  },
  monaco: {
    centerLat:  43.7347, centerLon:  7.4205,
    xyOriginX:  -4032,   xyOriginY:  -4282,
    xyPerMetre: 9.97,    rotationRad: 0,
  },
  barcelona_catalunya: {
    centerLat:  41.5702, centerLon:  2.2607,
    xyOriginX:  -2096,   xyOriginY:  -2027,
    xyPerMetre: 9.91,    rotationRad: 0,
  },
  austrian: {
    centerLat:  47.2197, centerLon:  14.7647,
    xyOriginX:  -2517,   xyOriginY:  2201,
    xyPerMetre: 9.97,    rotationRad: 0,
  },
  miami: {
    centerLat:  25.9582, centerLon:  -80.2388,
    xyOriginX:  3268,    xyOriginY:  -1594,
    xyPerMetre: 9.98,    rotationRad: 0,
  },
  australia: {
    centerLat:  -37.8497, centerLon:  144.9680,
    xyOriginX:  33,       xyOriginY:  2417,
    xyPerMetre: 10,       rotationRad: 0,
  },
  china: {
    centerLat:  31.3379, centerLon:  121.2200,
    xyOriginX:  -1430,   xyOriginY:  1083,
    xyPerMetre: 10,      rotationRad: 0,
  },
  japan: {
    centerLat:  34.8431, centerLon:  136.5407,
    xyOriginX:  -3562,   xyOriginY:  -1114,
    xyPerMetre: 10,      rotationRad: 0,
  },
}

// Convert a FastF1 (X, Y) position to WGS-84 (lat, lon).
export function xyToLatLon(
  x: number, y: number, geo: CircuitGeo,
): { lat: number; lon: number } {
  // Offset from origin, convert to metres
  const dxM = (x - geo.xyOriginX) / geo.xyPerMetre
  const dyM = (y - geo.xyOriginY) / geo.xyPerMetre

  // Apply rotation to align with geographic N/E axes
  const cosR = Math.cos(geo.rotationRad)
  const sinR = Math.sin(geo.rotationRad)
  const eastM  =  dxM * cosR - dyM * sinR
  const northM =  dxM * sinR + dyM * cosR

  const lat = geo.centerLat + northM / 111_320
  const lon = geo.centerLon + eastM  / (111_320 * Math.cos(geo.centerLat * (Math.PI / 180)))

  return { lat, lon }
}
