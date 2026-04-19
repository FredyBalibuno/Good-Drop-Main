"use client";

import { useState } from "react";
import type { IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { IntakeMultiPick } from "@/components/intake/intake-multi-pick";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const CAT: IntakeCategoryId = "art";

const INTRO =
  "We accept mass-produced items, signed art pieces, and collectibles of any kind including comic books. Items should be in good condition.";

const F1 = [
  { id: "paintings", label: "Paintings or prints" },
  { id: "sculptures", label: "Sculptures or figurines" },
  { id: "comics", label: "Comic books" },
  { id: "coins", label: "Coins or stamps" },
  { id: "glassware", label: "Collectible glassware" },
  { id: "antique_furniture", label: "Antique furniture" },
  { id: "jewelry", label: "Jewelry" },
  { id: "other", label: "Other collectibles" },
] as const;

export function ArtModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<"intro" | "f1" | "f2" | "f2t" | "f3">("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [damageNote, setDamageNote] = useState("");
  const [, setP] = useState<CategoryModulePayload>({ blocks: [], recycling: [], retailNotes: [] });

  const hasJewelry = types.has("jewelry");

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
      retailNotes: [...base.retailNotes, `Art/antiques: ${[...types].join(", ") || "listed"}`],
    });
  }

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep("f1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "f1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick label="F1. What types of art or antiques are you bringing?" options={[...F1]} selected={types} onToggle={toggle} />
        <Button className="rounded-full" disabled={types.size === 0} onClick={() => setStep("f2")}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "f2") {
    return (
      <IntakeBigChoice
        question="F2. Are all items in good, undamaged condition?"
        yesEmoji="✅"
        noEmoji="🧩"
        yesLabel="Yes"
        noLabel="No — some damage"
        onPick={(yes) => {
          if (yes) {
            if (hasJewelry) setStep("f3");
            else setP((prev) => {
              queueMicrotask(() => finalize(prev));
              return prev;
            });
          } else setStep("f2t");
        }}
      />
    );
  }

  if (step === "f2t") {
    return (
      <div className="space-y-4">
        <Label>Which items are damaged? Describe briefly.</Label>
        <Input value={damageNote} onChange={(e) => setDamageNote(e.target.value)} className="rounded-xl" />
        <Button
          className="rounded-full"
          onClick={() => {
            setP((prev) => {
              const out = {
                ...prev,
                recycling: [
                  ...prev.recycling,
                  {
                    id: "f2-dmg",
                    categoryId: CAT,
                    pipeline: "recycling" as const,
                    message: `Damaged items (may still route to salvage): ${damageNote || "see notes"}. Tag separately.`,
                  },
                ],
              };
              queueMicrotask(() => {
                if (hasJewelry) setStep("f3");
                else finalize(out);
              });
              return out;
            });
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  if (step === "f3") {
    return (
      <IntakeBigChoice
        question="F3. Is the jewelry functional (clasps work, no missing stones that define the piece)?"
        yesEmoji="💎"
        noEmoji="⚠️"
        yesLabel="Yes"
        noLabel="No — issues"
        onPick={(yes) => {
          setP((prev) => {
            const recycling = yes
              ? prev.recycling
              : [
                  ...prev.recycling,
                  {
                    id: "f3-jewelry",
                    categoryId: CAT,
                    pipeline: "recycling" as const,
                    message:
                      "Broken costume jewelry → salvage. Fine/precious jewelry with issues — still bring; Goodwill will assess.",
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
