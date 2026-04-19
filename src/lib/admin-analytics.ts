import type { DonationSubmission } from "./types";

export function submissionsForDays(
  submissions: DonationSubmission[],
  days: string[],
): DonationSubmission[] {
  const set = new Set(days);
  return submissions.filter((s) => set.has(s.dropoffDate) && s.donationType !== "pickup");
}

export function aggregateCategories(
  submissions: DonationSubmission[],
  limit = 8,
): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const s of submissions) {
    for (const i of s.items) {
      const key = i.category.trim() || "Uncategorized";
      map.set(key, (map.get(key) ?? 0) + i.quantity);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function totalPlannedItems(submissions: DonationSubmission[]): number {
  return submissions.reduce(
    (acc, s) => acc + s.items.reduce((a, i) => a + i.quantity, 0),
    0,
  );
}

export function unsellableRiskEstimate(submissions: DonationSubmission[]): number {
  let riskUnits = 0;
  for (const s of submissions) {
    const tierWeight = s.qualityTier === "risky" ? 0.45 : s.qualityTier === "mixed" ? 0.22 : 0.08;
    const qty = s.items.reduce((a, i) => a + i.quantity, 0);
    riskUnits += qty * tierWeight;
  }
  return Math.round(riskUnits);
}

export function qualitySplit(submissions: DonationSubmission[]): {
  resaleReadyPct: number;
  inspectionPct: number;
} {
  if (!submissions.length) return { resaleReadyPct: 0, inspectionPct: 0 };
  const good = submissions.filter((s) => s.qualityTier === "good").length;
  const mixed = submissions.filter((s) => s.qualityTier === "mixed").length;
  const risky = submissions.filter((s) => s.qualityTier === "risky").length;
  const n = submissions.length;
  const resaleReadyPct = Math.round((good / n) * 100 + (mixed / n) * 55);
  const inspectionPct = Math.round((mixed / n) * 45 + (risky / n) * 100);
  return { resaleReadyPct, inspectionPct };
}

export function topRiskCategories(submissions: DonationSubmission[]): { label: string; value: number }[] {
  const risky = submissions.filter((s) => s.qualityTier !== "good");
  if (!risky.length) return [];
  const map = new Map<string, number>();
  for (const s of risky) {
    for (const i of s.items) {
      map.set(i.category, (map.get(i.category) ?? 0) + i.quantity);
    }
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, v]) => ({ label, value: Math.round((v / total) * 100) }));
}

export function busiestArrivalBuckets(submissions: DonationSubmission[]): { window: string; count: number }[] {
  const buckets: Record<string, number> = {
    "Morning (9–11)": 0,
    "Midday (11–1)": 0,
    "Afternoon (1–4)": 0,
    "Late afternoon (4–6)": 0,
  };

  for (const s of submissions.filter((s) => s.donationType !== "pickup")) {
    const h = s.arrivalHour ?? Number(s.arrivalTime.split(":")[0]);
    if (!Number.isFinite(h)) continue;
    if (h < 11) buckets["Morning (9–11)"] += 1;
    else if (h < 13) buckets["Midday (11–1)"] += 1;
    else if (h < 16) buckets["Afternoon (1–4)"] += 1;
    else buckets["Late afternoon (4–6)"] += 1;
  }

  return Object.entries(buckets).map(([window, count]) => ({ window, count }));
}
