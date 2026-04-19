"use client";

import { useState } from "react";
import type { ConditionNote, HardBlock, IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { IntakeMultiPick } from "@/components/intake/intake-multi-pick";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type NotePipeline = ConditionNote["pipeline"];

const CAT: IntakeCategoryId = "linens";

const INTRO =
  "We accept decorative and throw pillows, bedspreads, blankets, sheets, towels, curtains, draperies, and area/throw rugs — all must be clean and stain-free. We do NOT accept sleeping pillows, mattress toppers, or wall-to-wall carpeting.";

const C1 = [
  { id: "decorative_pillows", label: "Decorative / throw pillows" },
  { id: "bedspreads", label: "Bedspreads or comforters" },
  { id: "blankets", label: "Blankets" },
  { id: "sheets", label: "Sheets" },
  { id: "towels", label: "Towels" },
  { id: "curtains", label: "Curtains or drapes" },
  { id: "rugs", label: "Area or throw rugs" },
  { id: "other", label: "Other textiles" },
] as const;

export function LinensModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<
    "intro" | "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "c6n" | "c7"
  >("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [stainCount, setStainCount] = useState("");
  const [payload, setPayload] = useState<CategoryModulePayload>({
    blocks: [],
    recycling: [],
    retailNotes: [],
  });

  const hasRugs = types.has("rugs");

  const pushBlock = (b: Omit<HardBlock, "categoryId">) => {
    setPayload((p) => ({ ...p, blocks: [...p.blocks, { ...b, categoryId: CAT }] }));
  };
  const pushRecycling = (n: Omit<ConditionNote, "categoryId" | "pipeline"> & { pipeline?: ConditionNote["pipeline"] }) => {
    setPayload((p) => ({
      ...p,
      recycling: [
        ...p.recycling,
        {
          id: n.id,
          categoryId: CAT,
          pipeline: (n.pipeline ?? "recycling") as NotePipeline,
          message: n.message,
        },
      ],
    }));
  };

  const toggle = (id: string) => {
    setTypes((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep("c1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "c1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick label="C1. What types of linens or textiles are you bringing?" options={[...C1]} selected={types} onToggle={toggle} />
        <Button className="rounded-full" disabled={types.size === 0} onClick={() => setStep("c2")}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "c2") {
    return (
      <IntakeBigChoice
        question="C2. Are you including sleeping pillows or bed pillows?"
        yesEmoji="🛏️"
        noEmoji="✅"
        yesLabel="Yes — bed pillows"
        noLabel="No"
        onPick={(yes) => {
          if (yes) {
            pushBlock({
              id: "c2-pillows",
              message: "Sleeping/bed pillows are not accepted. Do not bring — dispose at home.",
            });
          }
          setStep("c3");
        }}
      />
    );
  }

  if (step === "c3") {
    return (
      <IntakeBigChoice
        question="C3. Are you including a mattress topper?"
        yesEmoji="📦"
        noEmoji="✅"
        yesLabel="Yes"
        noLabel="No"
        onPick={(yes) => {
          if (yes) {
            pushBlock({
              id: "c3-topper",
              message: "Mattress toppers cannot be accepted. Do not bring.",
            });
          }
          setStep(hasRugs ? "c4" : "c6");
        }}
      />
    );
  }

  if (step === "c4") {
    return (
      <IntakeBigChoice
        question="C4. Is the rug an unbound / wall-to-wall carpet section (cut from a larger carpet)?"
        yesEmoji="📐"
        noEmoji="✅"
        yesLabel="Yes — unbound section"
        noLabel="No"
        onPick={(yes) => {
          if (yes) {
            pushBlock({
              id: "c4-wall",
              message: "Unbound carpeting cannot be accepted.",
            });
          }
          setStep("c5");
        }}
      />
    );
  }

  if (step === "c5") {
    return (
      <IntakeBigChoice
        question="C5. Is the rug free of animal hair, stains, mildew, and soiling?"
        yesEmoji="✨"
        noEmoji="🚫"
        yesLabel="Yes — clean rug"
        noLabel="No — soiled / hair / stains"
        onPick={(yes) => {
          if (!yes) {
            pushBlock({
              id: "c5-rug",
              message: "Soiled, stained, or hair-covered rugs cannot be accepted. Do not bring.",
            });
          }
          setStep("c6");
        }}
      />
    );
  }

  if (step === "c6") {
    return (
      <IntakeBigChoice
        question="C6. Are all linens and textiles clean and stain-free?"
        yesEmoji="✅"
        noEmoji="🧺"
        yesLabel="Yes"
        noLabel="No — some stains"
        onPick={(yes) => {
          if (yes) setStep("c7");
          else setStep("c6n");
        }}
      />
    );
  }

  if (step === "c6n") {
    return (
      <div className="space-y-4">
        <Label>C6 follow-up. How many stained items?</Label>
        <Input value={stainCount} onChange={(e) => setStainCount(e.target.value)} className="h-11 rounded-xl" />
        <Button
          className="rounded-full"
          onClick={() => {
            pushRecycling({
              id: "c6-stains",
              message: `${stainCount || "?"} stained linen item(s) — textile recycling; bag separately labeled “Recycling”.`,
            });
            setStep("c7");
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  if (step === "c7") {
    return (
      <IntakeBigChoice
        question="C7. Are any items damp, wet, or showing mold or mildew?"
        yesEmoji="💧"
        noEmoji="✅"
        yesLabel="Yes"
        noLabel="No"
        onPick={(yes) => {
          setPayload((p) => {
            const blocks =
              yes
                ? [
                    ...p.blocks,
                    {
                      id: "c7-wet",
                      categoryId: CAT,
                      message:
                        "Mildewed or wet items cannot be accepted or recycled. Dispose at home. Do not bring.",
                    },
                  ]
                : p.blocks;
            const out: CategoryModulePayload = {
              ...p,
              blocks,
              retailNotes: [
                ...p.retailNotes,
                `Linens types: ${[...types].join(", ") || "none listed"}`,
              ],
            };
            queueMicrotask(() => onComplete(out));
            return out;
          });
        }}
      />
    );
  }

  return null;
}
