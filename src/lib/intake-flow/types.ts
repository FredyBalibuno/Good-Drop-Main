/** 12 donation categories — Section 1 */
export type IntakeCategoryId =
  | "clothing"
  | "accessories"
  | "linens"
  | "housewares"
  | "electronics"
  | "art"
  | "furniture"
  | "books_media"
  | "computers"
  | "sports"
  | "toys"
  | "vehicles";

export type Pipeline = "retail" | "recycling" | "blocked" | "vehicle_program" | "advisory";

export type ConditionNote = {
  id: string;
  /** When set, ties the note to a Section 1 category for per-line summaries */
  categoryId?: IntakeCategoryId;
  pipeline: Exclude<Pipeline, "vehicle_program">;
  message: string;
};

export type HardBlock = {
  id: string;
  message: string;
  alternatives?: string;
  categoryId?: IntakeCategoryId;
};

export type IntakeSection = 0 | 1 | 2 | 3 | 4 | 5;
