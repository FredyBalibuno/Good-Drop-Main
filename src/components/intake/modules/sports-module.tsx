"use client";

import { useState } from "react";
import type { IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { IntakeMultiPick } from "@/components/intake/intake-multi-pick";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CAT: IntakeCategoryId = "sports";

const INTRO =
  "We accept bicycles, golf clubs, tennis racquets, bowling balls, free weights, treadmills, stationary bikes, and ab rollers — as long as they are functional and not damaged. Exercise machines must be under 50 lbs.";

const J1 = [
  { id: "bicycle", label: "Bicycle" },
  { id: "golf", label: "Golf clubs" },
  { id: "tennis", label: "Tennis or racquet sports gear" },
  { id: "bowling", label: "Bowling ball" },
  { id: "weights", label: "Free weights" },
  { id: "treadmill", label: "Treadmill or elliptical" },
  { id: "stationary", label: "Stationary bike" },
  { id: "bands", label: "Resistance bands or rollers" },
  { id: "other", label: "Other sporting goods" },
] as const;

export function SportsModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<"intro" | "j1" | "j2" | "j3" | "j4" | "j5">("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [p, setP] = useState<CategoryModulePayload>({ blocks: [], recycling: [], retailNotes: [] });

  const bigMachine = types.has("treadmill") || types.has("stationary");

  const toggle = (id: string) =>
    setTypes((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  function finalize(base: CategoryModulePayload) {
    onComplete({
      ...base,
      retailNotes: [...base.retailNotes, `Sports/exercise: ${[...types].join(", ") || "listed"}`],
    });
  }

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep("j1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "j1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick label="J1. What sports or exercise equipment are you bringing?" options={[...J1]} selected={types} onToggle={toggle} />
        <Button className="rounded-full" disabled={types.size === 0} onClick={() => setStep("j2")}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "j2") {
    return (
      <IntakeBigChoice
        question="J2. Is all equipment fully functional and not damaged or missing parts?"
        yesEmoji="✅"
        noEmoji="🧩"
        yesLabel="Yes"
        noLabel="No — issues"
        onPick={(yes) => {
          if (!yes) {
            setP((prev) => ({
              ...prev,
              blocks: [
                ...prev.blocks,
                {
                  id: "j2",
                  categoryId: CAT,
                  message: "Non-functional or incomplete sports equipment cannot be accepted. Remove those items.",
                },
              ],
            }));
          }
          setStep(bigMachine ? "j3" : "j4");
        }}
      />
    );
  }

  if (step === "j3") {
    return (
      <IntakeBigChoice
        question="J3. Does the treadmill, stationary bike, or large exercise machine weigh more than 50 lbs?"
        yesEmoji="⚖️"
        noEmoji="✅"
        yesLabel="Yes — over 50 lbs"
        noLabel="No"
        onPick={(yes) => {
          if (yes) {
            setP((prev) => ({
              ...prev,
              blocks: [
                ...prev.blocks,
                {
                  id: "j3",
                  categoryId: CAT,
                  message: "Oversized exercise equipment cannot be accepted. Do not bring.",
                },
              ],
            }));
          }
          setStep("j4");
        }}
      />
    );
  }

  if (step === "j4") {
    return (
      <IntakeBigChoice
        question="J4. Any visible safety concerns (sharp edges, broken cables, cracked frames)?"
        yesEmoji="⚠️"
        noEmoji="✅"
        yesLabel="Yes — safety concerns"
        noLabel="No"
        onPick={(yes) => {
          if (yes) {
            setP((prev) => ({
              ...prev,
              blocks: [
                ...prev.blocks,
                {
                  id: "j4",
                  categoryId: CAT,
                  message: "Equipment with safety defects cannot be accepted. Do not bring.",
                },
              ],
            }));
          }
          setStep("j5");
        }}
      />
    );
  }

  if (step === "j5") {
    return (
      <IntakeBigChoice
        question="J5. Is any equipment cosmetically worn (scratches, fading, minor dents) but still fully functional?"
        yesEmoji="🏷️"
        noEmoji="✅"
        yesLabel="Yes — cosmetic wear only"
        noLabel="No"
        onPick={(yes) => {
          setP((prev) => {
            let recycling = prev.recycling;
            if (yes) {
              recycling = [
                ...recycling,
                {
                  id: "j5",
                  categoryId: CAT,
                  pipeline: "recycling" as const,
                  message: "Cosmetically worn but functional — retail pipeline with note; still acceptable.",
                },
              ];
            }
            const out = { ...prev, recycling };
            queueMicrotask(() => finalize(out));
            return out;
          });
        }}
      />
    );
  }

  return null;
}
