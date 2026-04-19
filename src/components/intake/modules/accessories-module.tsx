"use client";

import { useState } from "react";
import type { ConditionNote, IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { IntakeMultiPick } from "@/components/intake/intake-multi-pick";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CAT: IntakeCategoryId = "accessories";

const INTRO =
  "We accept shoes, belts, handbags, briefcases, hats, gloves, scarves, and ties. All accessories must be in good, usable condition.";

const B1_OPTIONS = [
  { id: "shoes", label: "Shoes" },
  { id: "belts", label: "Belts" },
  { id: "handbags", label: "Handbags or purses" },
  { id: "hats", label: "Hats" },
  { id: "gloves_scarves", label: "Gloves or scarves" },
  { id: "ties", label: "Ties" },
  { id: "other", label: "Other" },
] as const;

export function AccessoriesModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<"intro" | "b1" | "b2" | "b3" | "b4">("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [accum, setAccum] = useState<CategoryModulePayload>({ blocks: [], recycling: [], retailNotes: [] });

  const toggle = (id: string) => {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function afterB1() {
    if (types.has("shoes")) setStep("b2");
    else if (types.has("handbags") || types.has("belts")) setStep("b3");
    else setStep("b4");
  }

  function afterB2() {
    if (types.has("handbags") || types.has("belts")) setStep("b3");
    else setStep("b4");
  }

  function pushRecycling(note: Omit<ConditionNote, "categoryId">) {
    setAccum((prev) => ({
      ...prev,
      recycling: [...prev.recycling, { ...note, categoryId: CAT, pipeline: "recycling" as const }],
    }));
  }

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep("b1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "b1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick
          label="B1. What types of accessories are you bringing?"
          options={[...B1_OPTIONS]}
          selected={types}
          onToggle={toggle}
          minHint="Select all that apply."
        />
        <Button className="rounded-full" disabled={types.size === 0} onClick={afterB1}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "b2") {
    return (
      <IntakeBigChoice
        question="B2. Are the shoes in good condition with soles that are not worn through?"
        yesEmoji="👟"
        noEmoji="🪵"
        yesLabel="Yes — retail ready"
        noLabel="No — heavily worn"
        onPick={(yes) => {
          if (!yes) {
            pushRecycling({
              id: "b2-shoes",
              pipeline: "recycling" as const,
              message: "Heavily worn shoes → recycling/salvage; tag separately.",
            });
          }
          afterB2();
        }}
      />
    );
  }

  if (step === "b3") {
    return (
      <IntakeBigChoice
        question="B3. Do all bags and belts have intact straps and functioning hardware (buckles, zippers, clasps)?"
        yesEmoji="✅"
        noEmoji="🧷"
        yesLabel="Yes — intact"
        noLabel="No — damaged"
        onPick={(yes) => {
          if (!yes) {
            pushRecycling({
              id: "b3-bags",
              pipeline: "recycling" as const,
              message: "Damaged bags/belts → recycling/salvage pipeline.",
            });
          }
          setStep("b4");
        }}
      />
    );
  }

  if (step === "b4") {
    return (
      <IntakeBigChoice
        question="B4. Are all accessories clean and free of visible staining or damage?"
        yesEmoji="✨"
        noEmoji="⚠️"
        yesLabel="Yes — clean"
        noLabel="No — staining/damage"
        onPick={(yes) => {
          setAccum((prev) => {
            let recycling = prev.recycling;
            if (!yes) {
              recycling = [
                ...recycling,
                {
                  id: "b4-damage",
                  categoryId: CAT,
                  pipeline: "recycling" as const,
                  message: "Damaged accessories → recycling/salvage; bag separately.",
                },
              ];
            }
            const retailNotes = [
              ...prev.retailNotes,
              `Accessory types: ${[...types].join(", ") || "none listed"}`,
            ];
            const out: CategoryModulePayload = { ...prev, recycling, retailNotes };
            queueMicrotask(() => onComplete(out));
            return out;
          });
        }}
      />
    );
  }

  return null;
}
