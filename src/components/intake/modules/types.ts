import type { ConditionNote, HardBlock } from "@/lib/intake-flow/types";

export type CategoryModulePayload = {
  blocks: HardBlock[];
  recycling: ConditionNote[];
  retailNotes: string[];
};
