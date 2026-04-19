import type { DonationSubmission } from "./types";

const COMPLEX = new Set(
  ["furniture", "desk", "chair", "appliance", "electronics", "crib", "mattress"].map((s) =>
    s.toLowerCase(),
  ),
);

function categoryComplexityBonus(items: { category: string; quantity: number }[]): number {
  let bonus = 0;
  for (const row of items) {
    const c = row.category.toLowerCase();
    for (const token of COMPLEX) {
      if (c.includes(token)) {
        bonus += Math.min(2, 1 + Math.floor(row.quantity / 4));
        break;
      }
    }
  }
  return Math.min(3, bonus);
}

export function recommendStaffing(input: {
  submissions: DonationSubmission[];
  /** ISO date yyyy-mm-dd */
  day: string;
  shift: "morning" | "afternoon" | "all";
}): {
  workers: number;
  label: "Light" | "Moderate" | "Heavy";
  totalItems: number;
  donorCount: number;
  complexityNote: string;
} {
  const daySubs = input.submissions.filter((s) => s.dropoffDate === input.day);
  const totalItems = daySubs.reduce(
    (acc, s) => acc + s.items.reduce((a, i) => a + i.quantity, 0),
    0,
  );
  const donorCount = daySubs.length;
  const complexity = daySubs.reduce((acc, s) => acc + categoryComplexityBonus(s.items), 0);

  let volumeScore = totalItems / 35 + donorCount / 6 + complexity * 0.35;
  if (input.shift === "morning") volumeScore *= 0.85;
  if (input.shift === "afternoon") volumeScore *= 1.05;

  let workers = Math.round(2 + volumeScore);
  workers = Math.max(2, Math.min(10, workers));

  const label: "Light" | "Moderate" | "Heavy" =
    workers <= 3 ? "Light" : workers <= 5 ? "Moderate" : "Heavy";

  const complexityNote =
    complexity >= 2
      ? "elevated sorting complexity"
      : complexity >= 1
        ? "moderate sorting complexity"
        : "typical sorting complexity";

  return { workers, label, totalItems, donorCount, complexityNote };
}

export function formatStaffingReasoning(p: {
  donors: number;
  items: number;
  complexityNote: string;
  workers: number;
  shift: string;
}): string {
  return `Based on ${p.donors} expected donors, ${p.items} planned items, and ${p.complexityNote}, recommended staffing is ${p.workers} workers for the ${p.shift} shift.`;
}
