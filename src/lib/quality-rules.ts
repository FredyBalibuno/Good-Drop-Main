import type { QualityAnswers, QualityTier } from "./types";

export function evaluateQuality(answers: QualityAnswers): {
  tier: QualityTier;
  message: string;
  flags: string[];
} {
  const flags: string[] = [];

  if (answers.clothesClean === false) {
    flags.push("Clothing may need laundering before intake");
  }
  if (answers.electronicsWorking === false) {
    flags.push("Non-working electronics are not accepted");
  }
  if (answers.stainsTearsMissing === true) {
    flags.push("Damage or heavy wear reduces resale readiness");
  }
  if (answers.shoesPairedWearable === false) {
    flags.push("Shoes should be paired and wearable");
  }

  const hasNull = Object.values(answers).some((v) => v === null);
  if (hasNull) {
    return {
      tier: "mixed",
      message: "Answer all questions for a clearer preview",
      flags,
    };
  }

  const risky =
    answers.electronicsWorking === false ||
    answers.stainsTearsMissing === true ||
    answers.shoesPairedWearable === false;

  if (risky) {
    const tier: QualityTier = answers.electronicsWorking === false ? "risky" : "mixed";
    return {
      tier,
      message:
        tier === "risky"
          ? "We recommend removing broken electronics before drop-off"
          : "Some items may not be accepted — staff will inspect on arrival",
      flags,
    };
  }

  if (answers.clothesClean === false) {
    return {
      tier: "mixed",
      message: "Some items may not be accepted — consider washing textiles first",
      flags,
    };
  }

  return {
    tier: "good",
    message: "These items look suitable for donation",
    flags,
  };
}
