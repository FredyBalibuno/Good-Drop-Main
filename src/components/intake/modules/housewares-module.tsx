"use client";

import { useState } from "react";
import type { IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { IntakeMultiPick } from "@/components/intake/intake-multi-pick";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CAT: IntakeCategoryId = "housewares";

const INTRO =
  "We accept kitchenware, home décor, and small appliances in good working condition. Items must be complete — we cannot accept items missing parts.";

const D1 = [
  { id: "dishes", label: "Kitchen dishes" },
  { id: "pots", label: "Pots" },
  { id: "pans", label: "Pans" },
  { id: "glasses", label: "Glasses and mugs" },
  { id: "decor", label: "Home décor (frames, vases, candles)" },
  { id: "small_appliances", label: "Small appliances" },
  { id: "lamps", label: "Lamps" },
  { id: "fans", label: "Fans" },
  { id: "other", label: "Other" },
] as const;

export function HousewaresModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<"intro" | "d1" | "d2" | "d2b" | "d3" | "d4" | "d5">("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [, setP] = useState<CategoryModulePayload>({ blocks: [], recycling: [], retailNotes: [] });

  const hasSmallApp = types.has("small_appliances");
  const hasLampsFans = types.has("lamps") || types.has("fans");

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
      retailNotes: [...base.retailNotes, `Housewares: ${[...types].join(", ") || "listed"}`],
    });
  }

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep("d1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "d1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick label="D1. What types of housewares are you bringing?" options={[...D1]} selected={types} onToggle={toggle} />
        <Button className="rounded-full" disabled={types.size === 0} onClick={() => setStep("d2")}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "d2") {
    return (
      <IntakeBigChoice
        question="D2. Are all items in good, working condition with no broken or missing parts?"
        yesEmoji="✅"
        noEmoji="🧩"
        yesLabel="Yes"
        noLabel="No — some issues"
        onPick={(yes) => (yes ? setStep("d3") : setStep("d2b"))}
      />
    );
  }

  if (step === "d2b") {
    return (
      <IntakeBigChoice
        question="For broken or incomplete items: can any of them still function safely?"
        hint="If yes, tag for recycling/salvage. If no, do not bring."
        yesEmoji="♻️"
        noEmoji="🗑️"
        yesLabel="Yes — safe for salvage"
        noLabel="No — not safe"
        onPick={(yes) => {
          setP((prev) => {
            if (yes) {
              return {
                ...prev,
                recycling: [
                  ...prev.recycling,
                  {
                    id: "d2-salvage",
                    categoryId: CAT,
                    pipeline: "recycling" as const,
                    message:
                      "Broken/incomplete but donor says still safe — recycling/salvage; tag separately.",
                  },
                ],
              };
            }
            return {
              ...prev,
              blocks: [
                ...prev.blocks,
                {
                  id: "d2-reject",
                  categoryId: CAT,
                  message: "Cannot accept items that cannot function safely — dispose of at home.",
                },
              ],
            };
          });
          setStep("d3");
        }}
      />
    );
  }

  if (step === "d3") {
    return (
      <IntakeBigChoice
        question="D3. Are any items chipped, cracked, or structurally damaged?"
        yesEmoji="🏺"
        noEmoji="✅"
        yesLabel="Yes"
        noLabel="No"
        onPick={(yes) => {
          setP((prev) => {
            let recycling = prev.recycling;
            if (yes) {
              recycling = [
                ...recycling,
                {
                  id: "d3-chip",
                  categoryId: CAT,
                  pipeline: "recycling" as const,
                  message:
                    "Chipped/cracked ceramics or glass — wrap safely; tag recycling/salvage. Broken glass is a staff hazard.",
                },
              ];
            }
            const out = { ...prev, recycling };
            queueMicrotask(() => {
              if (hasSmallApp) setStep("d4");
              else if (hasLampsFans) setStep("d5");
              else finalize(out);
            });
            return out;
          });
        }}
      />
    );
  }

  if (step === "d4") {
    return (
      <IntakeBigChoice
        question="D4. Are all small appliances fully functional and tested?"
        yesEmoji="🔌"
        noEmoji="⛔"
        yesLabel="Yes"
        noLabel="No — not working"
        onPick={(yes) => {
          setP((prev) => {
            let blocks = prev.blocks;
            if (!yes) {
              blocks = [
                ...blocks,
                {
                  id: "d4-appliance",
                  categoryId: CAT,
                  message:
                    "Non-working small appliances (other than computers) cannot be accepted. Do not bring.",
                },
              ];
            }
            const out = { ...prev, blocks };
            queueMicrotask(() => {
              if (hasLampsFans) setStep("d5");
              else finalize(out);
            });
            return out;
          });
        }}
      />
    );
  }

  if (step === "d5") {
    return (
      <IntakeBigChoice
        question="D5. Are lamps and fans CPSC-approved and not on any recall list?"
        hint="Informational — confirm you are not donating recalled items."
        yesEmoji="✅"
        noEmoji="❓"
        yesLabel="Yes — not recalled"
        noLabel="No / unsure"
        onPick={(yes) => {
          setP((prev) => {
            const recycling = yes
              ? prev.recycling
              : [
                  ...prev.recycling,
                  {
                    id: "d5-cpsc",
                    categoryId: CAT,
                    pipeline: "advisory" as const,
                    message: "Check cpsc.gov before bringing lamps or fans if unsure about recalls.",
                  },
                ];
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
