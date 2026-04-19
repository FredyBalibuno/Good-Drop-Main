import type { DemandItem } from "./types";

export type DemandSignal = "empty" | "high" | "moderate" | "high_supply" | "not_accepted";

function norm(s: string) {
  return s.trim().toLowerCase();
}

/** Loose match between donor-typed category and a staff demand label */
export function categoryMatchesLabel(category: string, label: string): boolean {
  const c = norm(category);
  const l = norm(label);
  if (!c || !l) return false;
  if (c.includes(l) || l.includes(c)) return true;
  const cWords = c.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const lWords = l.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  for (const cw of cWords) {
    for (const lw of lWords) {
      if (cw === lw) return true;
      if (cw.length >= 4 && (cw.includes(lw) || lw.includes(cw))) return true;
    }
  }
  return false;
}

function firstMatch(category: string, list: DemandItem[]): DemandItem | undefined {
  return list.find((item) => categoryMatchesLabel(category, item.label));
}

export type ItemDemandFeedback = {
  signal: DemandSignal;
  /** Matched staff label for context */
  matched?: string;
  headline: string;
  body: string;
};

export function getItemDemandFeedback(
  categoryRaw: string,
  lists: { highNeed: DemandItem[]; lowNeed: DemandItem[]; notAccepted: DemandItem[] },
): ItemDemandFeedback {
  const category = categoryRaw.trim();
  if (!category) {
    return {
      signal: "empty",
      headline: "Start typing",
      body: "Add what you are bringing to see how it lines up with today’s dock needs.",
    };
  }

  const blocked = firstMatch(category, lists.notAccepted);
  if (blocked) {
    return {
      signal: "not_accepted",
      matched: blocked.label,
      headline: "Needs special handling",
      body: `We usually can’t process “${blocked.label}” at this intake. If it’s still usable, a partner agency may be a better fit — see suggestions below.`,
    };
  }

  const high = firstMatch(category, lists.highNeed);
  if (high) {
    return {
      signal: "high",
      matched: high.label,
      headline: "High demand right now",
      body: `Great timing — we’re actively moving categories like “${high.label}”.`,
    };
  }

  const low = firstMatch(category, lists.lowNeed);
  if (low) {
    return {
      signal: "high_supply",
      matched: low.label,
      headline: "High supply right now",
      body: `We currently have plenty of “${low.label}” on hand. Your items are still appreciated — we’ll route them carefully — but the sales floor may move slower.`,
    };
  }

  return {
    signal: "moderate",
    headline: "Moderate need",
    body: "Still welcome — we’ll sort and place it where it helps most this week.",
  };
}
