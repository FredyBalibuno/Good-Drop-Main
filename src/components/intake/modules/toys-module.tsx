"use client";

import { useState } from "react";
import type { IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { IntakeMultiPick } from "@/components/intake/intake-multi-pick";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CAT: IntakeCategoryId = "toys";

const INTRO =
  "We accept toys for all ages — dolls, stuffed animals, sealed games, and puzzles. All toys must be clean and safe, with no broken or sharp parts. Baby furniture is NOT accepted.";

const K1 = [
  { id: "dolls", label: "Dolls or action figures" },
  { id: "plush", label: "Stuffed animals" },
  { id: "board", label: "Board games" },
  { id: "puzzles", label: "Puzzles" },
  { id: "building", label: "Building sets (LEGO, etc.)" },
  { id: "outdoor", label: "Outdoor toys" },
  { id: "rideon", label: "Ride-on toys" },
  { id: "baby_toys", label: "Baby or toddler toys" },
  { id: "baby_gear", label: "Baby furniture or gear" },
  { id: "edu", label: "Educational toys" },
  { id: "other", label: "Other" },
] as const;

export function ToysModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<"intro" | "k1" | "k2" | "k3" | "k4" | "k5" | "k6">("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [, setP] = useState<CategoryModulePayload>({ blocks: [], recycling: [], retailNotes: [] });

  const hasGames = types.has("board") || types.has("puzzles");

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
      retailNotes: [...base.retailNotes, `Toys: ${[...types].join(", ") || "listed"}`],
    });
  }

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep("k1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "k1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick label="K1. What toys are you bringing?" options={[...K1]} selected={types} onToggle={toggle} />
        <Button className="rounded-full" disabled={types.size === 0} onClick={() => setStep("k2")}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "k2") {
    return (
      <IntakeBigChoice
        question="K2. Are you including any baby furniture or gear? (cribs, strollers, car seats, highchairs, playpens, changing tables, bassinettes, baby walkers)"
        yesEmoji="🚫"
        noEmoji="✅"
        yesLabel="Yes"
        noLabel="No"
        onPick={(yes) => {
          if (yes) {
            setP((prev) => ({
              ...prev,
              blocks: [
                ...prev.blocks,
                {
                  id: "k2",
                  categoryId: CAT,
                  message:
                    "Baby furniture and gear cannot be accepted (recall/safety). Do not bring. Consider mutual aid, Buy Nothing, or certified resellers for car seats.",
                },
              ],
            }));
          }
          setStep("k3");
        }}
      />
    );
  }

  if (step === "k3") {
    return (
      <IntakeBigChoice
        question="K3. Are all toys clean and safe with no broken pieces, sharp edges, or missing hazard-creating parts?"
        yesEmoji="✅"
        noEmoji="⚠️"
        yesLabel="Yes"
        noLabel="No — unsafe"
        onPick={(yes) => {
          if (!yes) {
            setP((prev) => ({
              ...prev,
              blocks: [
                ...prev.blocks,
                {
                  id: "k3",
                  categoryId: CAT,
                  message: "Broken or unsafe toys cannot be accepted. Remove those items. Do not bring.",
                },
              ],
            }));
          }
          setStep(hasGames ? "k4" : "k5");
        }}
      />
    );
  }

  if (step === "k4") {
    return (
      <IntakeBigChoice
        question="K4. Are board games and puzzles complete with all pieces?"
        yesEmoji="🎲"
        noEmoji="🧩"
        yesLabel="Yes — complete"
        noLabel="No — incomplete"
        onPick={(yes) => {
          if (!yes) {
            setP((prev) => ({
              ...prev,
              recycling: [
                ...prev.recycling,
                {
                  id: "k4",
                  categoryId: CAT,
                  pipeline: "advisory" as const,
                  message:
                    "Incomplete games/puzzles have very low resale value but are still accepted — Goodwill will assess.",
                },
              ],
            }));
          }
          setStep("k5");
        }}
      />
    );
  }

  if (step === "k5") {
    return (
      <div className="space-y-4">
        <p className="text-base font-semibold">K5. Are any toys on a CPSC safety recall list?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            type="button"
            variant="destructive"
            className={cn("h-auto min-h-[100px] flex-col gap-2 rounded-2xl py-4")}
            onClick={() => {
              setP((prev) => ({
                ...prev,
                blocks: [
                  ...prev.blocks,
                  {
                    id: "k5-yes",
                    categoryId: CAT,
                    message: "Recalled toys cannot be donated. Do not bring.",
                  },
                ],
              }));
              setStep("k6");
            }}
          >
            <span className="text-2xl">⚠️</span>
            Yes — recalled
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-auto min-h-[100px] flex-col gap-2 rounded-2xl py-4"
            onClick={() => {
              setP((prev) => ({
                ...prev,
                recycling: [
                  ...prev.recycling,
                  {
                    id: "k5-unsure",
                    categoryId: CAT,
                    pipeline: "advisory" as const,
                    message: "Check cpsc.gov before donating. When in doubt, do not bring.",
                  },
                ],
              }));
              setStep("k6");
            }}
          >
            <span className="text-2xl">❓</span>
            Unsure
          </Button>
          <Button
            type="button"
            className="h-auto min-h-[100px] flex-col gap-2 rounded-2xl border-2 border-primary/30 py-4"
            onClick={() => setStep("k6")}
          >
            <span className="text-2xl">✅</span>
            No — not recalled
          </Button>
        </div>
      </div>
    );
  }

  if (step === "k6") {
    return (
      <IntakeBigChoice
        question="K6. Any toys gently worn (fading, minor scuffs) but still fully safe and functional?"
        yesEmoji="🏷️"
        noEmoji="✅"
        yesLabel="Yes — cosmetic only"
        noLabel="No"
        onPick={(yes) => {
          setP((prev) => {
            let recycling = prev.recycling;
            if (yes) {
              recycling = [
                ...recycling,
                {
                  id: "k6",
                  categoryId: CAT,
                  pipeline: "recycling" as const,
                  message: "Cosmetically worn but safe toys — retail with note.",
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
