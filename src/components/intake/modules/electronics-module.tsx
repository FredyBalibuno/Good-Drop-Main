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

const CAT: IntakeCategoryId = "electronics";

const INTRO =
  "We accept working small electronics and appliances. FLAT-SCREEN TVs only — no tube or CRT televisions. Large appliances are not accepted.";

const E1 = [
  { id: "tv", label: "Television" },
  { id: "dvd", label: "DVD or Blu-ray player" },
  { id: "stereo", label: "Stereo or radio" },
  { id: "mp3", label: "MP3 player or iPod" },
  { id: "small_kitchen", label: "Small kitchen appliance" },
  { id: "coffee", label: "Coffee maker" },
  { id: "vacuum", label: "Vacuum cleaner" },
  { id: "pac", label: "Portable air conditioner" },
  { id: "microwave", label: "Microwave" },
  { id: "lawn", label: "Lawn equipment" },
  { id: "gaming", label: "Gaming system" },
  { id: "other", label: "Other small electronics" },
] as const;

export function ElectronicsModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<
    "intro" | "e1" | "e2" | "e3" | "e4" | "e5" | "e5b" | "e6" | "e6t" | "e7"
  >("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [brokenNote, setBrokenNote] = useState("");
  const [p, setP] = useState<CategoryModulePayload>({ blocks: [], recycling: [], retailNotes: [] });

  const hasTv = types.has("tv");
  const hasLawn = types.has("lawn");

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
      retailNotes: [...base.retailNotes, `Electronics: ${[...types].join(", ") || "listed"}`],
    });
  }

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep("e1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "e1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick label="E1. What electronics are you bringing?" options={[...E1]} selected={types} onToggle={toggle} />
        <Button className="rounded-full" disabled={types.size === 0} onClick={() => setStep(hasTv ? "e2" : "e3")}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "e2") {
    return (
      <IntakeBigChoice
        question="E2. Is the TV a flat-screen (LED, LCD, OLED, or plasma)?"
        yesEmoji="📺"
        noEmoji="📦"
        yesLabel="Yes — flat-screen"
        noLabel="No — tube / CRT / box TV"
        onPick={(yes) => {
          if (!yes) {
            setP((prev) => ({
              ...prev,
              blocks: [
                ...prev.blocks,
                {
                  id: "e2-crt",
                  categoryId: CAT,
                  message:
                    "Non-flat-screen televisions cannot be accepted. Best Buy accepts them for a fee. Do not bring to Goodwill.",
                },
              ],
            }));
          }
          setStep("e3");
        }}
      />
    );
  }

  if (step === "e3") {
    return (
      <IntakeBigChoice
        question="E3. Are you bringing any large appliances? (stove, oven, refrigerator, freezer, washer, dryer, dishwasher, hot water heater, trash compactor, central AC)"
        yesEmoji="🏠"
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
                  id: "e3-large",
                  categoryId: CAT,
                  message: "Large appliances cannot be accepted under any circumstances. Do not bring.",
                },
              ],
            }));
          }
          setStep("e4");
        }}
      />
    );
  }

  if (step === "e4") {
    return (
      <IntakeBigChoice
        question="E4. Are you bringing any gas-powered tools or appliances?"
        yesEmoji="⛽"
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
                  id: "e4-gas",
                  categoryId: CAT,
                  message: "Gas-powered tools and appliances cannot be accepted. Do not bring.",
                },
              ],
            }));
          }
          setStep(hasLawn ? "e5" : "e6");
        }}
      />
    );
  }

  if (step === "e5") {
    return (
      <IntakeBigChoice
        question="E5. Has all fuel been completely removed from the lawn equipment before donating?"
        yesEmoji="✅"
        noEmoji="⛽"
        yesLabel="Yes — fuel removed"
        noLabel="No — fuel still present"
        onPick={(yes) => (yes ? setStep("e6") : setStep("e5b"))}
      />
    );
  }

  if (step === "e5b") {
    return (
      <IntakeBigChoice
        question="Fuel must be removed before you arrive. Can you confirm you will remove it before drop-off?"
        yesEmoji="✅"
        noEmoji="🚫"
        yesLabel="Yes — I’ll remove fuel"
        noLabel="No — can’t commit"
        onPick={(yes) => {
          if (!yes) {
            setP((prev) => ({
              ...prev,
              blocks: [
                ...prev.blocks,
                {
                  id: "e5-fuel",
                  categoryId: CAT,
                  message: "Do not bring lawn equipment until fuel is fully removed.",
                },
              ],
            }));
          }
          setStep("e6");
        }}
      />
    );
  }

  if (step === "e6") {
    return (
      <IntakeBigChoice
        question="E6. Are all electronics in working condition with all necessary cords and parts?"
        yesEmoji="✅"
        noEmoji="🔧"
        yesLabel="Yes"
        noLabel="No — some issues"
        onPick={(yes) => (yes ? setStep("e7") : setStep("e6t"))}
      />
    );
  }

  if (step === "e6t") {
    return (
      <div className="space-y-4">
        <Label>E6 follow-up. Which items are not working or incomplete? (Non-computer electronics cannot be accepted if not working.)</Label>
        <Input value={brokenNote} onChange={(e) => setBrokenNote(e.target.value)} className="rounded-xl" />
        <Button
          className="rounded-full"
          onClick={() => {
            setP((prev) => ({
              ...prev,
              recycling: [
                ...prev.recycling,
                {
                  id: "e6-broken",
                  categoryId: CAT,
                  pipeline: "recycling" as const,
                  message: `Non-working or incomplete (not computers): ${brokenNote || "see notes"} — remove from donation.`,
                },
              ],
            }));
            setStep("e7");
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  if (step === "e7") {
    return (
      <IntakeBigChoice
        question="E7. Are all cords and cables in safe condition (no fraying, exposed wiring, or damage)?"
        yesEmoji="✅"
        noEmoji="⚡"
        yesLabel="Yes — safe"
        noLabel="No — damaged cords"
        onPick={(yes) => {
          setP((prev) => {
            const blocks = yes
              ? prev.blocks
              : [
                  ...prev.blocks,
                  {
                    id: "e7-cord",
                    categoryId: CAT,
                    message: "Damaged cords are safety hazards and cannot be accepted.",
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
