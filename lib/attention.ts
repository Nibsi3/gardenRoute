import { AttentionZone, ZoneState } from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const regionBounds = {
  // Garden Route focus box (lng, lat)
  sw: [21.7, -34.5] as [number, number],
  ne: [23.9, -33.5] as [number, number],
};

const zoneCatalog: AttentionZone[] = [
  {
    id: "george",
    name: "George Central",
    coordinates: [22.461, -33.964],
    baseline: 0.52,
    volatility: 0.28,
    tempo: 0.011,
    phase: 0.3,
    decayMinutes: 18,
    narrative: "steady glow from civic pressure and fast replies",
  },
  {
    id: "oudtshoorn",
    name: "Oudtshoorn",
    coordinates: [22.203, -33.59],
    baseline: 0.34,
    volatility: 0.26,
    tempo: 0.009,
    phase: 0.9,
    decayMinutes: 20,
    narrative: "This weeks spotlight",
  },
  {
    id: "mossel",
    name: "Mossel Bay",
    coordinates: [22.137, -34.183],
    baseline: 0.35,
    volatility: 0.28,
    tempo: 0.0102,
    phase: 1.8,
    decayMinutes: 19,
    narrative: "port-side jolts when bookings and freight collide",
  },
  {
    id: "sedgefield",
    name: "Sedgefield",
    coordinates: [22.77, -34.007],
    baseline: 0.3,
    volatility: 0.24,
    tempo: 0.0105,
    phase: 1.1,
    decayMinutes: 17,
    narrative: "slow coastal lift when locals flip from errands to bookings",
  },
  {
    id: "wilderness",
    name: "Wilderness",
    coordinates: [22.577, -33.989],
    baseline: 0.31,
    volatility: 0.25,
    tempo: 0.0105,
    phase: 2.9,
    decayMinutes: 16,
    narrative: "cooling fades after dawn hikes and late checkouts",
  },
  {
    id: "knysna",
    name: "Knysna",
    coordinates: [23.046, -34.04],
    baseline: 0.38,
    volatility: 0.32,
    tempo: 0.0095,
    phase: 1.4,
    decayMinutes: 22,
    narrative: "warming gradient driven by slow-burn property searches",
  },
  {
    id: "plett",
    name: "Plettenberg Bay",
    coordinates: [23.371, -34.052],
    baseline: 0.36,
    volatility: 0.4,
    tempo: 0.013,
    phase: 2.1,
    decayMinutes: 14,
    narrative: "sharp spikes when visitors switch from browsing to booking",
  },
];

const directionThreshold = 0.012;

const calculateState = (zone: AttentionZone, timestamp: number): ZoneState => {
  const timeSeconds = timestamp / 1000;
  const primary = 0.5 + 0.5 * Math.sin(timeSeconds * zone.tempo + zone.phase);
  const cross = 0.5 + 0.5 * Math.sin(timeSeconds * 0.015 + zone.phase / 3);
  const drift = 0.08 * Math.sin(timeSeconds * 0.002 + zone.phase * 0.7);

  const rawIntensity =
    zone.baseline + zone.volatility * primary + 0.25 * cross + drift;
  const intensity = clamp(rawIntensity, 0.08, 1);

  const previousSample = timestamp - 9000; // 9s back for velocity reference
  const prevPrimary =
    0.5 + 0.5 * Math.sin((previousSample / 1000) * zone.tempo + zone.phase);
  const prevCross =
    0.5 +
    0.5 * Math.sin((previousSample / 1000) * 0.015 + zone.phase / 3);
  const prevDrift =
    0.08 * Math.sin((previousSample / 1000) * 0.002 + zone.phase * 0.7);
  const prev = clamp(
    zone.baseline + zone.volatility * prevPrimary + 0.25 * prevCross + prevDrift,
    0.08,
    1,
  );

  const velocity = intensity - prev;
  const direction: ZoneState["direction"] =
    velocity > directionThreshold
      ? "heating"
      : velocity < -directionThreshold
        ? "cooling"
        : "stable";

  const decay = Math.exp(
    -((timestamp % (zone.decayMinutes * 60_000)) / (zone.decayMinutes * 60_000)),
  );

  const phase = timeSeconds * zone.tempo + zone.phase;
  const wrappedPhase = (phase + Math.PI / 2) % (2 * Math.PI);
  const secondsSinceShift = wrappedPhase / zone.tempo;
  const lastShiftMinutes = clamp(secondsSinceShift / 60, 0, 60);

  return {
    id: zone.id,
    name: zone.name,
    coordinates: zone.coordinates,
    intensity,
    velocity,
    direction,
    decay,
    narrative: zone.narrative,
    lastShiftMinutes,
  };
};

export const getAttentionField = (timestamp = Date.now()): ZoneState[] =>
  zoneCatalog.map((zone) => calculateState(zone, timestamp));

export const getZoneCatalog = () => zoneCatalog;

export const getAttentionSnapshot = (timestamp = Date.now()) => ({
  timestamp,
  zones: getAttentionField(timestamp),
});
