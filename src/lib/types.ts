export type NeedLevel = "high" | "low" | "blocked";

export interface UserProfile {
  id: string; // Google sub
  email: string;
  name: string;
  picture: string;
  rating: number; // 0–5, manually set by staff
  pickupUnlocked: boolean; // true when rating >= 4.0
  createdAt: string;
}

export interface PickupRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRating: number;
  submissionId: string;
  address: string;
  notes: string;
  preferredDate: string;
  preferredTime: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export type QualityTier = "good" | "mixed" | "risky";

export interface DemandItem {
  id: string;
  label: string;
}

export interface LineItemQualityState {
  profileId: string;
  profileTitle: string;
  answers: Record<string, boolean>;
  tier: QualityTier;
  message: string;
}

export interface PlannedLineItem {
  id: string;
  category: string;
  quantity: number;
  unit?: string;
  /** Per-line resale checklist completed in-plan (dialog) */
  lineQuality?: LineItemQualityState;
}

export interface QualityAnswers {
  clothesClean: boolean | null;
  electronicsWorking: boolean | null;
  stainsTearsMissing: boolean | null;
  shoesPairedWearable: boolean | null;
}

export interface DonationSubmission {
  id: string;
  userId?: string | null;
  userName?: string | null;
  createdAt: string;
  donationType: "dropoff" | "pickup";
  pickupDetails?: {
    address: string;
    preferredDate: string;
    preferredTime: string;
    notes: string;
  } | null;
  items: PlannedLineItem[];
  dropoffDate: string;
  arrivalTime: string;
  arrivalHour?: number;
  locationId: string;
  locationLabel: string;
  condition: string;
  qualityAnswers: QualityAnswers;
  qualityTier: QualityTier;
  qualityMessage: string;
}

export interface LocationOption {
  id: string;
  label: string;
}

/** Richer record for donor search + partner badge; `label` stays the display line for confirmations */
export interface PartnerDonationCenter extends LocationOption {
  city: string;
  /** One-line intake note */
  line: string;
  /** Search facets: specialties, materials, programs */
  tags: string[];
}
