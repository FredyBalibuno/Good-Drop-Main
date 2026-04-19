import type { DonationSubmission, PartnerDonationCenter } from "./types";

/** Partner centers that work with GoodDrop — searchable by name, city, tags, and intake notes */
export const PARTNER_DONATION_CENTERS: PartnerDonationCenter[] = [
  {
    id: "main",
    label: "Riverside Reuse Hub",
    city: "Riverside",
    line: "Main intake · textiles, housewares, evening dock hours",
    tags: ["clothing", "furniture small", "books", "linens", "after work"],
  },
  {
    id: "north",
    label: "Northside Community Donation Dock",
    city: "Northside",
    line: "Drive-through lane · great for large boxes & baby gear",
    tags: ["baby", "toys", "car seat check", "drive-through", "Saturday"],
  },
  {
    id: "mobile",
    label: "Weekend mobile drop-off",
    city: "Rotating",
    line: "Sat route · compact loads & pre-log required",
    tags: ["mobile", "Saturday", "compact", "pre-log"],
  },
  {
    id: "east",
    label: "Eastside Circular Store Dock",
    city: "Eastside",
    line: "Electronics testing bench · small appliances welcome",
    tags: ["electronics", "appliances", "testing", "cords", "kitchen"],
  },
  {
    id: "central",
    label: "Central City Intake & Sort",
    city: "Downtown",
    line: "High-volume hub · clothing + shoes priority lanes",
    tags: ["shoes", "coats", "corporate donations", "downtown"],
  },
  {
    id: "south",
    label: "South Loop Textile Annex",
    city: "South Loop",
    line: "Textiles-first · limited furniture space",
    tags: ["textiles", "linens", "jackets", "no mattresses"],
  },
];

/** @deprecated Use PARTNER_DONATION_CENTERS — kept as alias for existing imports */
export const LOCATIONS: PartnerDonationCenter[] = PARTNER_DONATION_CENTERS;

export function partnerCenterSearchBlob(c: PartnerDonationCenter): string {
  return [c.label, c.city, c.line, ...c.tags].join(" ").toLowerCase();
}

export function getPartnerCenter(id: string): PartnerDonationCenter | undefined {
  return PARTNER_DONATION_CENTERS.find((x) => x.id === id);
}

export function getPartnerCenterLabel(id: string): string {
  const c = getPartnerCenter(id);
  return c ? `${c.label} · ${c.city}` : id;
}

/** Baseline scheduled donors so the dashboard never looks empty before the first demo submit */
export const SEED_SUBMISSIONS: DonationSubmission[] = [
  {
    id: "seed-1",
    createdAt: new Date().toISOString(),
    items: [
      { id: "s1", category: "Winter coats", quantity: 6, unit: "pieces" },
      { id: "s2", category: "Children's books", quantity: 22, unit: "pieces" },
    ],
    dropoffDate: new Date().toISOString().slice(0, 10),
    arrivalTime: "10:30",
    locationId: "main",
    locationLabel: getPartnerCenterLabel("main"),
    condition: "Good — lightly used",
    qualityAnswers: {
      clothesClean: true,
      electronicsWorking: true,
      stainsTearsMissing: false,
      shoesPairedWearable: true,
    },
    qualityTier: "good",
    qualityMessage: "These items look suitable for donation",
    donationType: "dropoff",
    pickupDetails: null,
  },
  {
    id: "seed-2",
    createdAt: new Date().toISOString(),
    items: [
      { id: "s3", category: "Office chairs", quantity: 3, unit: "pieces" },
      { id: "s4", category: "Small appliances", quantity: 2, unit: "pieces" },
    ],
    dropoffDate: new Date().toISOString().slice(0, 10),
    arrivalTime: "15:00",
    locationId: "north",
    locationLabel: getPartnerCenterLabel("north"),
    condition: "Mixed — some wear",
    qualityAnswers: {
      clothesClean: true,
      electronicsWorking: false,
      stainsTearsMissing: true,
      shoesPairedWearable: true,
    },
    qualityTier: "mixed",
    qualityMessage: "Some items may not be accepted",
    donationType: "dropoff",
    pickupDetails: null,
  },
];

export const DEFAULT_HIGH_NEED: { id: string; label: string }[] = [
  { id: "h1", label: "Men's jackets" },
  { id: "h2", label: "Children's shoes" },
  { id: "h3", label: "Kitchen appliances in working condition" },
  { id: "h4", label: "Gently used linens" },
];

export const DEFAULT_LOW_NEED: { id: string; label: string }[] = [
  { id: "l1", label: "Office chairs" },
  { id: "l2", label: "Large desks" },
  { id: "l3", label: "DVDs & CDs" },
  /** Pairs with common donor typing like “Shirts” for high-supply / redirect UX */
  { id: "l4", label: "Casual shirts & tops" },
];

/** Shown when a category is high-supply — differentiator for overflow routing */
export const OVERFLOW_SHELTER = {
  name: "Riverside Hope Shelter",
  distance: "2.1 mi",
  note: "Accepting clothing basics & small housewares overflow this week.",
} as const;

export const DEFAULT_NOT_ACCEPTED: { id: string; label: string }[] = [
  { id: "n1", label: "Broken electronics" },
  { id: "n2", label: "Torn or heavily stained clothing" },
  { id: "n3", label: "Mattresses" },
  { id: "n4", label: "Car seats (expired or without manual)" },
];
