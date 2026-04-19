import { INTAKE_CATEGORIES } from "@/lib/intake-flow/categories";
import type { IntakeCategoryId } from "@/lib/intake-flow/types";
import type { ConditionNote, HardBlock } from "@/lib/intake-flow/types";
import type { DonationSubmission, LineItemQualityState, PlannedLineItem, QualityAnswers, QualityTier } from "@/lib/types";

function newId() {
  return typeof crypto !== "undefined" ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;
}

function lineTierForCategory(
  catId: IntakeCategoryId,
  blocks: HardBlock[],
  recycling: ConditionNote[],
): { tier: QualityTier; message: string } {
  const catBlocks = blocks.filter((b) => b.categoryId === catId);
  const catRecycle = recycling.filter((r) => r.categoryId === catId && r.pipeline === "recycling");
  const catAdv = recycling.filter((r) => r.categoryId === catId && r.pipeline === "advisory");
  if (catBlocks.length) {
    return {
      tier: "risky",
      message: catBlocks.map((b) => b.message).join(" "),
    };
  }
  if (catRecycle.length) {
    return {
      tier: "mixed",
      message: `Include recycling stream: ${catRecycle.map((r) => r.message).join(" · ")}`,
    };
  }
  if (catAdv.length) {
    return {
      tier: "good",
      message: `Passes intake for this category. Advisory: ${catAdv.map((r) => r.message).join(" · ")}`,
    };
  }
  return {
    tier: "good",
    message: "Passes intake screening for this category — bag by category label.",
  };
}

function lineQuality(catId: IntakeCategoryId, blocks: HardBlock[], recycling: ConditionNote[]): LineItemQualityState {
  const { tier, message } = lineTierForCategory(catId, blocks, recycling);
  return {
    profileId: `intake-${catId}`,
    profileTitle: "Donation profile",
    answers: {},
    tier,
    message,
  };
}

function worstTier(tiers: QualityTier[]): QualityTier {
  if (tiers.includes("risky")) return "risky";
  if (tiers.includes("mixed")) return "mixed";
  return "good";
}

export function buildSubmissionFromIntake(input: {
  selectedCategories: IntakeCategoryId[];
  dropoffDate: string;
  arrivalTime: string;
  arrivalHour?: number;
  locationId: string;
  locationLabel: string;
  condition: string;
  recycling: ConditionNote[];
  blocks: HardBlock[];
  donorNotes: string;
  bagBand: string;
  donationType: "dropoff" | "pickup";
  pickupDetails?: { address: string; preferredDate: string; preferredTime: string; notes: string } | null;
}): DonationSubmission {
  const items: PlannedLineItem[] = [];
  for (const catId of input.selectedCategories) {
    const meta = INTAKE_CATEGORIES.find((c) => c.id === catId);
    if (!meta) continue;
    if (catId === "vehicles") {
      items.push({
        id: newId(),
        category: meta.label,
        quantity: 1,
        unit: "vehicle",
        lineQuality: {
          profileId: "intake-vehicle",
          profileTitle: "Vehicle program",
          answers: {},
          tier: "mixed",
          message:
            "Vehicle donations use the separate Goodwill vehicle program (866-492-2770, gwcars.org) — not unloaded at the donation dock with household goods.",
        },
      });
      continue;
    }
    items.push({
      id: newId(),
      category: meta.label,
      quantity: 1,
      unit: "category",
      lineQuality: lineQuality(catId, input.blocks, input.recycling),
    });
  }

  const tiers = items.map((i) => i.lineQuality?.tier ?? "mixed");
  const globalBlocks = input.blocks.filter((b) => !b.categoryId);
  const worst = globalBlocks.length ? "risky" : worstTier(tiers);

  const qualityAnswers: QualityAnswers = {
    clothesClean: !input.blocks.some((b) => b.id.includes("wet") || b.id === "mildew"),
    electronicsWorking: !input.blocks.some((b) => b.id.includes("appliance") || b.id.includes("cord")),
    stainsTearsMissing: input.recycling.some((r) => r.pipeline === "recycling"),
    shoesPairedWearable: true,
  };

  const prohibitedSummary =
    globalBlocks.length > 0
      ? `Universal prohibited check: ${globalBlocks.map((b) => b.message + (b.alternatives ? ` (${b.alternatives})` : "")).join(" · ")}. `
      : "";

  const qualityMessage =
    worst === "good"
      ? `${prohibitedSummary}Profile complete — ${items.length} categor${items.length === 1 ? "y" : "ies"} look ready for the sales floor where applicable.`
      : worst === "mixed"
        ? `${prohibitedSummary}Some items are tagged for recycling/salvage — keep those bags labeled RECYCLING and separate from resale-ready goods.`
        : `${prohibitedSummary}One or more answers indicate items that cannot be accepted — review the block list on your summary before you pack the car.`;

  const condition =
    input.bagBand && input.donorNotes
      ? `${input.condition} · ${input.bagBand} · Note: ${input.donorNotes}`
      : input.bagBand
        ? `${input.condition} · ${input.bagBand}`
        : input.donorNotes
          ? `${input.condition} · Note: ${input.donorNotes}`
          : input.condition;

  return {
    id: newId(),
    confirmationCode: "GD-" + newId().replace(/-/g, "").slice(0, 6).toUpperCase(),
    createdAt: new Date().toISOString(),
    donationType: input.donationType,
    pickupDetails: input.pickupDetails ?? null,
    items,
    dropoffDate: input.dropoffDate,
    arrivalTime: input.arrivalTime,
    arrivalHour: input.arrivalHour,
    locationId: input.locationId,
    locationLabel: input.locationLabel,
    condition,
    qualityAnswers,
    qualityTier: worst,
    qualityMessage,
  };
}
