import type { QualityTier } from "./types";

export type ItemQualityProfileId = "textile" | "footwear" | "electronics" | "books_media" | "general";

export type LineQualityQuestion = {
  id: string;
  prompt: string;
  helper?: string;
};

export type ItemQualityProfile = {
  id: ItemQualityProfileId;
  title: string;
  questions: LineQualityQuestion[];
};

/** Donation-center-style questions tailored to category keywords */
export function getItemQualityProfile(category: string): ItemQualityProfile {
  const c = category.toLowerCase();

  if (/shoe|boot|sneaker|sandal|footwear|cleat|heel|loafer|slipper/.test(c)) {
    return {
      id: "footwear",
      title: "Footwear — resale standards",
      questions: [
        {
          id: "clean",
          prompt: "Clean, dry, and free of strong odors?",
          helper: "Mildew, smoke, or pet-soaked pairs are usually turned away.",
        },
        {
          id: "pairedWearable",
          prompt: "Paired, soles intact, and wearable for the next person?",
          helper: "Singles and blown-out soles rarely make the sales floor.",
        },
        {
          id: "damageFree",
          prompt: "No major cracks, holes, or broken hardware on the pair?",
          helper: "Minor scuffs are fine; structural damage is not.",
        },
        {
          id: "floorReady",
          prompt: "Overall, would typical thrift staff put this on the sales floor?",
          helper: 'Honest “no” is OK — we may route to textile recycling instead.',
        },
      ],
    };
  }

  if (
    /shirt|jacket|coat|pant|dress|skirt|sweater|hoodie|cloth|linen|blanket|towel|apparel|textile|jean|blouse|short|sock|underwear|scarf|glove/.test(
      c,
    )
  ) {
    return {
      id: "textile",
      title: "Clothing & textiles — resale standards",
      questions: [
        {
          id: "clean",
          prompt: "Clean, dry, and free of strong odors?",
          helper: "Laundered or like-new is what most intake docks expect.",
        },
        {
          id: "damageFree",
          prompt: "No heavy stains, tears, burns, or active mold?",
          helper: "Light wear is OK; hygiene issues are not.",
        },
        {
          id: "wearable",
          prompt: "Still wearable / usable for the next person (not scraps only)?",
          helper: "Rags-only bundles belong in recycling streams, not the rack.",
        },
        {
          id: "floorReady",
          prompt: "Would staff sell this on the retail floor?",
          helper: "If you would hesitate to hang it for $5, answer no.",
        },
      ],
    };
  }

  if (
    /tv|television|monitor|laptop|computer|console|cable|charger|appliance|microwave|toaster|blender|electronic|speaker|tablet|phone|radio|dvd|player/.test(
      c,
    )
  ) {
    return {
      id: "electronics",
      title: "Electronics & powered goods",
      questions: [
        {
          id: "powersOn",
          prompt: "For powered items: do they turn on / operate without sparks or exposed wiring?",
          helper: "Answer what you know today — staff will retest on intake.",
        },
        {
          id: "damageFree",
          prompt: "No cracked screens, liquid damage, or sharp broken parts?",
          helper: "Broken glass or leaking batteries are common rejects.",
        },
        {
          id: "included",
          prompt: "Reasonably complete with expected accessories (remotes, cords, lids) when applicable?",
          helper: "Missing critical parts often drops resale value sharply.",
        },
        {
          id: "floorReady",
          prompt: "Overall, would staff consider this safe to place on or behind the sales floor?",
          helper: "Recalled or hazardous items should stay home.",
        },
      ],
    };
  }

  if (/book|dvd|cd|tape|record|game|puzzle|board\s*game|media|vinyl/.test(c)) {
    return {
      id: "books_media",
      title: "Books, games & media",
      questions: [
        {
          id: "clean",
          prompt: "Clean with no mildew smell on pages or boxes?",
          helper: "Warped or moldy media is usually rejected.",
        },
        {
          id: "complete",
          prompt: "Complete enough to use (not missing most pieces or core pages)?",
          helper: "A missing edge piece might be OK; half the puzzle is not.",
        },
        {
          id: "damageFree",
          prompt: "No heavy damage that makes it unusable (waterlogged, shredded)?",
          helper: "Light notes or shelf wear are usually fine.",
        },
        {
          id: "floorReady",
          prompt: "Would staff shelve this for shoppers?",
          helper: "“No” can still route to education or craft partners.",
        },
      ],
    };
  }

  return {
    id: "general",
    title: "General goods — resale standards",
    questions: [
      {
        id: "clean",
        prompt: "Clean, dry, and presentation-ready (no strong odors)?",
        helper: "Applies to almost everything we sort.",
      },
      {
        id: "functional",
        prompt: "Works as intended without missing critical pieces?",
        helper: "Broken “for parts” items often need a different channel.",
      },
      {
        id: "damageFree",
        prompt: "No major stains, rust, mold, or unsafe breakage?",
        helper: "Cosmetic wear can be fine.",
      },
      {
        id: "floorReady",
        prompt: "Would a Goodwill-style center put this on the retail floor?",
        helper: "If you would not buy it for a few dollars, answer no.",
      },
    ],
  };
}

export function tierForLineAnswers(answers: Record<string, boolean>): QualityTier {
  const vals = Object.values(answers);
  if (!vals.length) return "mixed";
  if (vals.every(Boolean)) return "good";
  const bad = vals.filter((v) => !v).length;
  return bad >= 2 ? "risky" : "mixed";
}

export function lineQualitySummaryMessage(
  category: string,
  profileTitle: string,
  tier: QualityTier,
): string {
  const name = category.trim() || "This item";
  if (tier === "good") {
    return `${name} looks aligned with typical ${profileTitle.toLowerCase()} for resale.`;
  }
  if (tier === "mixed") {
    return `${name} may need dock inspection — some answers suggest mixed resale readiness.`;
  }
  return `${name} may not meet common resale standards — staff may divert or decline parts of the load.`;
}
