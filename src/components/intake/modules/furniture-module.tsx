"use client";

import { useState } from "react";
import type { IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { IntakeMultiPick } from "@/components/intake/intake-multi-pick";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CAT: IntakeCategoryId = "furniture";

const INTRO =
  "We accept small, clean furniture in good sellable condition — free of pet hair, rips, stains, mildew, and rust. Items must be under 50 lbs and fully assembled. We do NOT accept mattresses, box springs, bed frames, sleeper sofas, or office furniture.";

const STORE_NOTE =
  "Not all Goodwill locations accept furniture. We’ll confirm whether your selected store accepts furniture after you complete this section.";

const G1 = [
  { id: "chair", label: "Chair" },
  { id: "bookshelf", label: "Bookshelf or shelving unit" },
  { id: "side_table", label: "Side table or end table" },
  { id: "coffee", label: "Coffee table" },
  { id: "desk", label: "Desk" },
  { id: "dresser", label: "Dresser or chest of drawers" },
  { id: "sofa", label: "Sofa or couch" },
  { id: "bed_frame", label: "Bed frame or bed rails" },
  { id: "mattress", label: "Mattress or box spring" },
  { id: "sleeper", label: "Sleeper sofa" },
  { id: "air_mattress", label: "Air mattress" },
  { id: "beanbag", label: "Bean bag chair" },
  { id: "other", label: "Other" },
] as const;

export function FurnitureModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<"intro" | "g1" | "g2" | "g3" | "g4" | "g5" | "g6" | "g7" | "g8">("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [p, setP] = useState<CategoryModulePayload>({ blocks: [], recycling: [], retailNotes: [] });

  const toggle = (id: string) =>
    setTypes((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const block = (id: string, message: string) =>
    setP((x) => ({ ...x, blocks: [...x.blocks, { id, categoryId: CAT, message }] }));

  function finalize(base: CategoryModulePayload) {
    onComplete({
      ...base,
      retailNotes: [...base.retailNotes, `Furniture: ${[...types].join(", ") || "listed"}`],
    });
  }

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <p className="text-xs font-medium text-amber-900 dark:text-amber-100">{STORE_NOTE}</p>
          <Button className="rounded-full" onClick={() => setStep("g1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "g1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick label="G1. What furniture are you bringing?" options={[...G1]} selected={types} onToggle={toggle} />
        <Button className="rounded-full" disabled={types.size === 0} onClick={() => setStep("g2")}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "g2") {
    return (
      <IntakeBigChoice
        question="G2. Are you including a mattress, box spring, bed rail, sleeper sofa, air mattress, mattress topper, or bean bag chair?"
        yesEmoji="🚫"
        noEmoji="✅"
        yesLabel="Yes — including one of these"
        noLabel="No"
        onPick={(yes) => {
          if (yes) {
            block(
              "g2",
              "These items cannot be accepted. Do not bring. (Mattress Disposal Plus, Mattress Warehouse — fee.)",
            );
          }
          setStep("g3");
        }}
      />
    );
  }

  if (step === "g3") {
    return (
      <IntakeBigChoice
        question="G3. Are you including office furniture? (large executive desk, conference table, filing cabinet, cubicle panels)"
        yesEmoji="🏢"
        noEmoji="✅"
        yesLabel="Yes"
        noLabel="No"
        onPick={(yes) => {
          if (yes) block("g3", "Office furniture cannot be accepted. Do not bring.");
          setStep("g4");
        }}
      />
    );
  }

  if (step === "g4") {
    return (
      <IntakeBigChoice
        question="G4. Does any piece weigh more than 50 lbs?"
        yesEmoji="⚖️"
        noEmoji="✅"
        yesLabel="Yes — over 50 lbs"
        noLabel="No"
        onPick={(yes) => {
          if (yes) block("g4", "Oversized or overweight furniture cannot be accepted. Do not bring those pieces.");
          setStep("g5");
        }}
      />
    );
  }

  if (step === "g5") {
    return (
      <IntakeBigChoice
        question="G5. Is all furniture free of pet or animal hair?"
        yesEmoji="✅"
        noEmoji="🐾"
        yesLabel="Yes"
        noLabel="No — pet hair present"
        onPick={(yes) => {
          if (!yes) block("g5", "Furniture covered in animal hair cannot be accepted, even for recycling. Do not bring.");
          setStep("g6");
        }}
      />
    );
  }

  if (step === "g6") {
    return (
      <IntakeBigChoice
        question="G6. Is all furniture free of rips, tears, stains, soiling, or mildew?"
        yesEmoji="✅"
        noEmoji="⚠️"
        yesLabel="Yes"
        noLabel="No"
        onPick={(yes) => {
          if (!yes) {
            block(
              "g6",
              "Stained, torn, or mildewed furniture cannot be accepted (firm rejection). Do not bring.",
            );
          }
          setStep("g7");
        }}
      />
    );
  }

  if (step === "g7") {
    return (
      <IntakeBigChoice
        question="G7. Is all furniture free of rust or structural damage?"
        yesEmoji="✅"
        noEmoji="🔧"
        yesLabel="Yes"
        noLabel="No"
        onPick={(yes) => {
          if (!yes) block("g7", "Rusty or structurally damaged furniture cannot be accepted.");
          setStep("g8");
        }}
      />
    );
  }

  if (step === "g8") {
    return (
      <IntakeBigChoice
        question="G8. Is all furniture fully assembled and not missing any parts?"
        yesEmoji="✅"
        noEmoji="📦"
        yesLabel="Yes — assembled"
        noLabel="No — incomplete / disassembled"
        onPick={(yes) => {
          setP((prev) => {
            const blocks = yes
              ? prev.blocks
              : [
                  ...prev.blocks,
                  {
                    id: "g8",
                    categoryId: CAT,
                    message: "Disassembled or incomplete furniture cannot be accepted. Reassemble or do not bring.",
                  },
                ];
            const out = { ...prev, blocks };
            queueMicrotask(() => finalize(out));
            return out;
          });
        }}
      />
    );
  }

  return null;
}
