import { Category, DefaultCandidate, DefaultOutcome, ZoneState } from "./types";

export const categories: { id: Category; label: string; micro: string }[] = [
  { id: "estate", label: "Estate", micro: "keys answer fast" },
  { id: "accommodation", label: "Stay", micro: "beds unlock" },
  { id: "car", label: "Car Hire", micro: "wheels appear" },
  { id: "service", label: "Service", micro: "fixers move" },
  { id: "eat", label: "Eat", micro: "plates fill" },
  { id: "coffee", label: "Coffee", micro: "beans brew" },
  { id: "dental", label: "Dental", micro: "teeth shine" },
  { id: "optometrist", label: "Optometrist", micro: "eyes focus" },
  { id: "spa", label: "Spa", micro: "relax unwind" },
  { id: "kids", label: "Kids", micro: "play learn" },
  { id: "blinds", label: "Blinds", micro: "shades drop" },
  { id: "test", label: "Test", micro: "experiments run" },
];

// Derived from provided dataset — one or two strongest candidates per zone.
const deck: Record<string, Record<Category, DefaultCandidate[]>> = {
  george: {
    estate: [
      {
        id: "eden-developments",
        name: "Eden Developments",
        category: "estate",
        responseSpeed: 0.82,
        availability: 0.8,
        proximity: 0.9,
        presence: 0.78,
        clarity: 0.8,
        incumbent: true,
      },
    ],
    accommodation: [
      {
        id: "protea-king-george",
        name: "Protea Hotel King George",
        category: "accommodation",
        responseSpeed: 0.86,
        availability: 0.9,
        proximity: 0.9,
        presence: 0.82,
        clarity: 0.82,
        incumbent: true,
      },
    ],
    car: [
      {
        id: "avis-george",
        name: "Avis George Airport",
        category: "car",
        responseSpeed: 0.9,
        availability: 0.84,
        proximity: 0.92,
        presence: 0.82,
        clarity: 0.8,
        incumbent: true,
      },
    ],
    service: [
      {
        id: "eden-painters",
        name: "Eden Painters",
        category: "service",
        responseSpeed: 0.82,
        availability: 0.78,
        proximity: 0.8,
        presence: 0.75,
        clarity: 0.78,
        incumbent: true,
      },
    ],
    eat: [
      {
        id: "fat-fish-george",
        name: "The Fat Fish George",
        category: "eat",
        responseSpeed: 0.85,
        availability: 0.82,
        proximity: 0.88,
        presence: 0.8,
        clarity: 0.82,
        incumbent: true,
      },
    ],
    coffee: [
      {
        id: "foundry-roasters",
        name: "The Foundry Roasters",
        category: "coffee",
        responseSpeed: 0.8,
        availability: 0.85,
        proximity: 0.9,
        presence: 0.78,
        clarity: 0.8,
        incumbent: true,
      },
    ],
    dental: [
      {
        id: "garden-route-dental",
        name: "Garden Route Dental Studio",
        category: "dental",
        responseSpeed: 0.78,
        availability: 0.8,
        proximity: 0.82,
        presence: 0.76,
        clarity: 0.79,
        incumbent: true,
      },
    ],
    optometrist: [
      {
        id: "george-optometrist",
        name: "George Optometrist",
        category: "optometrist",
        responseSpeed: 0.82,
        availability: 0.78,
        proximity: 0.85,
        presence: 0.77,
        clarity: 0.81,
        incumbent: true,
      },
    ],
    spa: [
      {
        id: "george-spa",
        name: "George Spa & Wellness",
        category: "spa",
        responseSpeed: 0.79,
        availability: 0.83,
        proximity: 0.87,
        presence: 0.8,
        clarity: 0.82,
        incumbent: true,
      },
    ],
    kids: [
      {
        id: "george-little-stars",
        name: "George Little Stars",
        category: "kids",
        responseSpeed: 0.81,
        availability: 0.79,
        proximity: 0.86,
        presence: 0.78,
        clarity: 0.8,
        incumbent: true,
      },
    ],
    blinds: [
      {
        id: "george-blinds",
        name: "George Blinds & Curtains",
        category: "blinds",
        responseSpeed: 0.77,
        availability: 0.75,
        proximity: 0.83,
        presence: 0.74,
        clarity: 0.76,
        incumbent: true,
      },
    ],
    test: [
      {
        id: "test-company",
        name: "Test Company Ltd",
        category: "test",
        responseSpeed: 0.85,
        availability: 0.8,
        proximity: 0.9,
        presence: 0.75,
        clarity: 0.8,
        incumbent: true,
      },
    ],
  },
  wilderness: {
    estate: [
      {
        id: "wilderness-construction",
        name: "Wilderness Construction",
        category: "estate",
        responseSpeed: 0.8,
        availability: 0.76,
        proximity: 0.82,
        presence: 0.74,
        clarity: 0.76,
        incumbent: true,
      },
    ],
    accommodation: [
      {
        id: "wilderness-hotel",
        name: "The Wilderness Hotel",
        category: "accommodation",
        responseSpeed: 0.84,
        availability: 0.88,
        proximity: 0.84,
        presence: 0.8,
        clarity: 0.8,
        incumbent: true,
      },
    ],
    car: [
      {
        id: "garden-route-shuttles",
        name: "Garden Route Shuttles",
        category: "car",
        responseSpeed: 0.86,
        availability: 0.86,
        proximity: 0.8,
        presence: 0.74,
        clarity: 0.78,
        incumbent: true,
      },
    ],
    service: [
      {
        id: "wilderness-roofing",
        name: "Wilderness Roof Repairs",
        category: "service",
        responseSpeed: 0.8,
        availability: 0.74,
        proximity: 0.78,
        presence: 0.74,
        clarity: 0.75,
        incumbent: true,
      },
    ],
    test: [
      {
        id: "wilderness-test-labs",
        name: "Wilderness Test Labs",
        category: "test",
        responseSpeed: 0.82,
        availability: 0.78,
        proximity: 0.88,
        presence: 0.72,
        clarity: 0.77,
        incumbent: true,
      },
    ],
  },
  sedgefield: {
    estate: [
      {
        id: "sedgefield-builders",
        name: "Sedgefield Builders",
        category: "estate",
        responseSpeed: 0.78,
        availability: 0.76,
        proximity: 0.82,
        presence: 0.74,
        clarity: 0.76,
        incumbent: true,
      },
    ],
    accommodation: [
      {
        id: "sedgefield-arms",
        name: "Sedgefield Arms",
        category: "accommodation",
        responseSpeed: 0.76,
        availability: 0.78,
        proximity: 0.78,
        presence: 0.72,
        clarity: 0.78,
        incumbent: true,
      },
    ],
    car: [
      {
        id: "eden-shuttles",
        name: "Eden Shuttles",
        category: "car",
        responseSpeed: 0.78,
        availability: 0.78,
        proximity: 0.74,
        presence: 0.72,
        clarity: 0.72,
        incumbent: true,
      },
    ],
    service: [
      {
        id: "sedgefield-roofing",
        name: "Sedgefield Roofing",
        category: "service",
        responseSpeed: 0.76,
        availability: 0.74,
        proximity: 0.78,
        presence: 0.7,
        clarity: 0.73,
        incumbent: true,
      },
    ],
    test: [
      {
        id: "sedgefield-test-facility",
        name: "Sedgefield Test Facility",
        category: "test",
        responseSpeed: 0.78,
        availability: 0.72,
        proximity: 0.8,
        presence: 0.68,
        clarity: 0.71,
        incumbent: true,
      },
    ],
  },
  knysna: {
    estate: [
      {
        id: "knysna-construction",
        name: "Knysna Construction Group",
        category: "estate",
        responseSpeed: 0.78,
        availability: 0.8,
        proximity: 0.78,
        presence: 0.82,
        clarity: 0.8,
        incumbent: true,
      },
    ],
    accommodation: [
      {
        id: "lofts-hotel",
        name: "The Lofts Boutique Hotel",
        category: "accommodation",
        responseSpeed: 0.8,
        availability: 0.86,
        proximity: 0.82,
        presence: 0.82,
        clarity: 0.82,
        incumbent: true,
      },
    ],
    car: [
      {
        id: "first-car-rental",
        name: "First Car Rental",
        category: "car",
        responseSpeed: 0.82,
        availability: 0.8,
        proximity: 0.78,
        presence: 0.78,
        clarity: 0.78,
        incumbent: true,
      },
    ],
    service: [
      {
        id: "knysna-roofing",
        name: "Knysna Roofing",
        category: "service",
        responseSpeed: 0.8,
        availability: 0.76,
        proximity: 0.78,
        presence: 0.78,
        clarity: 0.76,
        incumbent: true,
      },
    ],
    test: [
      {
        id: "knysna-test-centre",
        name: "Knysna Test Centre",
        category: "test",
        responseSpeed: 0.8,
        availability: 0.75,
        proximity: 0.85,
        presence: 0.7,
        clarity: 0.75,
        incumbent: true,
      },
    ],
  },
  plett: {
    estate: [
      {
        id: "plett-building",
        name: "Plett Building Projects",
        category: "estate",
        responseSpeed: 0.78,
        availability: 0.76,
        proximity: 0.79,
        presence: 0.83,
        clarity: 0.78,
        incumbent: true,
      },
    ],
    accommodation: [
      {
        id: "beacon-island",
        name: "Beacon Island Resort",
        category: "accommodation",
        responseSpeed: 0.84,
        availability: 0.88,
        proximity: 0.82,
        presence: 0.82,
        clarity: 0.82,
        incumbent: true,
      },
    ],
    car: [
      {
        id: "woodford",
        name: "Woodford Car Hire",
        category: "car",
        responseSpeed: 0.82,
        availability: 0.8,
        proximity: 0.78,
        presence: 0.76,
        clarity: 0.78,
        incumbent: true,
      },
    ],
    service: [
      {
        id: "plett-waterproofing",
        name: "Plett Waterproofing",
        category: "service",
        responseSpeed: 0.8,
        availability: 0.76,
        proximity: 0.78,
        presence: 0.78,
        clarity: 0.76,
        incumbent: true,
      },
    ],
    test: [
      {
        id: "plett-test-laboratory",
        name: "Plett Test Laboratory",
        category: "test",
        responseSpeed: 0.79,
        availability: 0.75,
        proximity: 0.81,
        presence: 0.73,
        clarity: 0.74,
        incumbent: true,
      },
    ],
  },
  mossel: {
    estate: [
      {
        id: "matwa-builders",
        name: "Matwa Builders",
        category: "estate",
        responseSpeed: 0.78,
        availability: 0.78,
        proximity: 0.8,
        presence: 0.76,
        clarity: 0.76,
        incumbent: true,
      },
    ],
    accommodation: [
      {
        id: "protea-mossel",
        name: "Protea Hotel Mossel Bay",
        category: "accommodation",
        responseSpeed: 0.8,
        availability: 0.86,
        proximity: 0.82,
        presence: 0.8,
        clarity: 0.8,
        incumbent: true,
      },
    ],
    car: [
      {
        id: "bidvest-mossel",
        name: "Bidvest Car Rental",
        category: "car",
        responseSpeed: 0.82,
        availability: 0.8,
        proximity: 0.8,
        presence: 0.78,
        clarity: 0.78,
        incumbent: true,
      },
    ],
    service: [
      {
        id: "ecotuff",
        name: "EcoTuff SA",
        category: "service",
        responseSpeed: 0.78,
        availability: 0.76,
        proximity: 0.78,
        presence: 0.74,
        clarity: 0.74,
        incumbent: true,
      },
    ],
    test: [
      {
        id: "mossel-test-services",
        name: "Mossel Test Services",
        category: "test",
        responseSpeed: 0.77,
        availability: 0.73,
        proximity: 0.79,
        presence: 0.71,
        clarity: 0.72,
        incumbent: true,
      },
    ],
  },
  oudtshoorn: {
    estate: [
      {
        id: "klein-karoo-construction",
        name: "Klein Karoo Construction",
        category: "estate",
        responseSpeed: 0.76,
        availability: 0.78,
        proximity: 0.82,
        presence: 0.74,
        clarity: 0.76,
        incumbent: true,
      },
    ],
    accommodation: [
      {
        id: "buffelsdrift",
        name: "Buffelsdrift Game Lodge",
        category: "accommodation",
        responseSpeed: 0.82,
        availability: 0.88,
        proximity: 0.8,
        presence: 0.82,
        clarity: 0.82,
        incumbent: true,
      },
    ],
    car: [
      {
        id: "klein-karoo-car",
        name: "Klein Karoo Car Hire",
        category: "car",
        responseSpeed: 0.8,
        availability: 0.8,
        proximity: 0.8,
        presence: 0.76,
        clarity: 0.78,
        incumbent: true,
      },
    ],
    service: [
      {
        id: "oudtshoorn-roofing",
        name: "Oudtshoorn Roofing",
        category: "service",
        responseSpeed: 0.78,
        availability: 0.76,
        proximity: 0.78,
        presence: 0.76,
        clarity: 0.76,
        incumbent: true,
      },
    ],
    test: [
      {
        id: "oudtshoorn-test-centre",
        name: "Oudtshoorn Test Centre",
        category: "test",
        responseSpeed: 0.76,
        availability: 0.72,
        proximity: 0.77,
        presence: 0.69,
        clarity: 0.7,
        incumbent: true,
      },
    ],
  },
};

const weights = {
  responseSpeed: 0.28,
  availability: 0.24,
  proximity: 0.18,
  presence: 0.18,
  clarity: 0.12,
  momentum: 0.08,
};

const describe = (winner: DefaultCandidate, zone: ZoneState) => {
  const factors = [
    { key: "response", value: winner.responseSpeed },
    { key: "availability", value: winner.availability },
    { key: "proximity", value: winner.proximity },
    { key: "presence", value: winner.presence },
    { key: "clarity", value: winner.clarity },
  ].sort((a, b) => b.value - a.value);

  const lead = factors[0];
  const accent = factors[1];
  return `${lead.key} and ${accent.key} stay ahead while ${zone.narrative}`;
};

const scoreCandidate = (
  candidate: DefaultCandidate,
  zone: ZoneState,
): number => {
  const base =
    candidate.responseSpeed * weights.responseSpeed +
    candidate.availability * weights.availability +
    candidate.proximity * weights.proximity +
    candidate.presence * weights.presence +
    candidate.clarity * weights.clarity +
    (candidate.bias ?? 0);

  const heat = zone.direction === "heating" ? 0.04 : zone.direction === "cooling" ? -0.03 : 0;
  const velocityBoost = zone.velocity * weights.momentum * 3;

  return base + heat + velocityBoost;
};

const resolveCategory = (
  zone: ZoneState,
  category: Category,
): DefaultOutcome | null => {
  const candidates = deck[zone.id]?.[category];
  if (!candidates?.length) return null;

  const scored = candidates.map((candidate) => ({
    candidate,
    score: scoreCandidate(candidate, zone),
  }));

  scored.sort((a, b) => b.score - a.score);
  const incumbent = scored.find((entry) => entry.candidate.incumbent);
  const leader = scored[0];

  const stabilityGuard = incumbent && leader.score - incumbent.score < 0.08;
  const winner = stabilityGuard ? incumbent! : leader;
  const lock: DefaultOutcome["lock"] = stabilityGuard ? "locked" : "shifting";

  return {
    zoneId: zone.id,
    category,
    winner: winner.candidate,
    score: winner.score,
    lock,
    rationale: describe(winner.candidate, zone),
  };
};

export const resolveDefaults = (
  zones: ZoneState[],
  categoriesToUse: Category[] = categories.map((c) => c.id),
): DefaultOutcome[] => {
  const outcomes: DefaultOutcome[] = [];
  zones.forEach((zone) => {
    categoriesToUse.forEach((category) => {
      const result = resolveCategory(zone, category);
      if (result) outcomes.push(result);
    });
  });
  return outcomes;
};

export const outcomeLookup = (outcomes: DefaultOutcome[]) => {
  const map = new Map<string, DefaultOutcome>();
  outcomes.forEach((outcome) => {
    map.set(`${outcome.zoneId}-${outcome.category}`, outcome);
  });
  return map;
};
