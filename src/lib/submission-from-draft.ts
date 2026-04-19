import type { DonationSubmission, PlannedLineItem, QualityAnswers, QualityTier } from "./types";

function worstTier(tiers: QualityTier[]): QualityTier {
  if (tiers.includes("risky")) return "risky";
  if (tiers.includes("mixed")) return "mixed";
  return "good";
}

/** Map per-line checks to the legacy submission shape used by the staff dashboard */
function legacyQualityAnswers(items: PlannedLineItem[]): QualityAnswers {
  const has = (key: string, v: boolean) =>
    items.some((i) => i.lineQuality && i.lineQuality.answers[key] === v);

  return {
    clothesClean: !has("clean", false),
    electronicsWorking: !has("powersOn", false),
    stainsTearsMissing: has("damageFree", false),
    shoesPairedWearable: !has("pairedWearable", false),
  };
}

function submissionQualityMessage(items: PlannedLineItem[], worst: QualityTier): string {
  const n = items.length;
  const good = items.filter((i) => i.lineQuality?.tier === "good").length;
  if (worst === "good") {
    return `Each of your ${n} item line(s) passed quick resale-ready checks for its category.`;
  }
  if (worst === "mixed") {
    return `${good}/${n} line(s) look resale-ready from your answers; others may need a short intake inspection.`;
  }
  return `One or more lines may not meet typical floor standards — staff will confirm what can be sold before you unload.`;
}

export function buildSubmissionFromDraft(input: {
  items: PlannedLineItem[];
  dropoffDate: string;
  arrivalTime: string;
  locationId: string;
  locationLabel: string;
  condition: string;
  donationType?: DonationSubmission["donationType"];
  pickupDetails?: DonationSubmission["pickupDetails"];
}): DonationSubmission {
  const tiers = input.items.map((i) => i.lineQuality?.tier ?? "mixed");
  const worst = worstTier(tiers);
  const qualityAnswers = legacyQualityAnswers(input.items);
  const qualityMessage = submissionQualityMessage(input.items, worst);

  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : `sub-${Date.now()}`,
    createdAt: new Date().toISOString(),
    donationType: input.donationType ?? "dropoff",
    pickupDetails: input.pickupDetails ?? null,
    items: input.items,
    dropoffDate: input.dropoffDate,
    arrivalTime: input.arrivalTime,
    locationId: input.locationId,
    locationLabel: input.locationLabel,
    condition: input.condition,
    qualityAnswers,
    qualityTier: worst,
    qualityMessage,
  };
}
