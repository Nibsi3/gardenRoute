export type AttentionDirection = "heating" | "cooling" | "stable";

export type AttentionZone = {
  id: string;
  name: string;
  coordinates: [number, number];
  baseline: number; // base density floor
  volatility: number; // amplitude of swings
  tempo: number; // radians per second
  phase: number; // starting offset
  decayMinutes: number; // how long a spike lingers
  narrative: string;
};

export type ZoneState = {
  id: string;
  name: string;
  coordinates: [number, number];
  intensity: number; // 0..1
  velocity: number; // -1..1
  direction: AttentionDirection;
  decay: number; // 0..1
  narrative: string;
  lastShiftMinutes: number;
};

export type Category = "estate" | "accommodation" | "car" | "service" | "eat" | "coffee" | "dental" | "optometrist" | "spa" | "kids" | "blinds" | "test";

export type DefaultCandidate = {
  id: string;
  name: string;
  category: Category;
  responseSpeed: number;
  availability: number;
  proximity: number;
  presence: number;
  clarity: number;
  bias?: number;
  incumbent?: boolean;
};

export type DefaultOutcome = {
  zoneId: string;
  category: Category;
  winner: DefaultCandidate;
  score: number;
  lock: "locked" | "shifting";
  rationale: string;
};
