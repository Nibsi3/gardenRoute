import { Category, DefaultCandidate, DefaultOutcome, ZoneState } from "./types";

// Category sections for organized display - NEW STRUCTURE
export const categorySections = {
  "EAT & DRINK": ["eat-drink"],
  "STAY": ["stay"],
  "TRADES & FIXES": ["trades-fixes"],
  "HOME & LIVING": ["home-living"],
  "DRIVE & AUTO": ["drive-auto"],
  "HEALTH & ESSENTIALS": ["health-essentials"],
};

// Subcategories for each main category
export const subcategories: Record<string, string[]> = {
  "Eat & Drink": ["Fine Dining", "Casual & Family", "Coffee & Breakfast", "Pubs & Bars", "Farm Stalls"],
  "Stay": ["Hotels & Resorts", "Guesthouses & B&B", "Self-Catering & Villas"],
  "Trades & Fixes": ["Electricians", "Plumbers", "Locksmiths", "Handyman & Paint", "Pest Control"],
  "Home & Living": ["Solar & Power", "Security & Alarms", "Garden & Pool", "Cleaning Services", "Internet & IT", "Moving"],
  "Drive & Auto": ["Mechanics & Tyres", "Towing & Recovery", "Car Hire"],
  "Health & Essentials": ["Medical & Doctors", "Pharmacies", "Vets", "Real Estate"],
};

export const categories: { id: Category; label: string; micro: string; section?: string }[] = [
  // Main categories matching businessData.ts
  { id: "eat-drink", label: "Eat & Drink", micro: "dine & sip", section: "EAT & DRINK" },
  { id: "stay", label: "Stay", micro: "rest & relax", section: "STAY" },
  { id: "trades-fixes", label: "Trades & Fixes", micro: "pros on call", section: "TRADES & FIXES" },
  { id: "home-living", label: "Home & Living", micro: "home essentials", section: "HOME & LIVING" },
  { id: "drive-auto", label: "Drive & Auto", micro: "wheels & roads", section: "DRIVE & AUTO" },
  { id: "health-essentials", label: "Health & Essentials", micro: "care & wellbeing", section: "HEALTH & ESSENTIALS" },
];

// Deck is empty - defaults feature will be updated separately
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deck: Record<string, Partial<Record<Category, DefaultCandidate[]>>> = {};

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
