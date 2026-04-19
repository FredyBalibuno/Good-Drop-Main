"use client";

import { useState } from "react";
import type { IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { IntakeMultiPick } from "@/components/intake/intake-multi-pick";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CAT: IntakeCategoryId = "computers";

const INTRO =
  "Goodwill accepts ALL computer equipment in ANY condition — working or not — through our recycling partnership. This includes desktops, laptops, keyboards, monitors, and speakers.";

const I1 = [
  { id: "desktop", label: "Desktop PC" },
  { id: "laptop", label: "Laptop" },
  { id: "monitor", label: "Monitor" },
  { id: "keyboard", label: "Keyboard" },
  { id: "mouse", label: "Mouse" },
  { id: "speakers", label: "Speakers" },
  { id: "hdd", label: "Hard drives" },
  { id: "gaming", label: "Gaming system (PlayStation, Xbox, Nintendo, Sega)" },
  { id: "software", label: "Software" },
  { id: "printer", label: "Printer" },
  { id: "phone", label: "Cell phone" },
  { id: "other", label: "Other peripherals" },
] as const;

export function ComputersModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<"intro" | "i1" | "i2" | "i3" | "i4" | "i5">("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [p, setP] = useState<CategoryModulePayload>({ blocks: [], recycling: [], retailNotes: [] });

  const hasPrinter = types.has("printer");
  const hasSoftware = types.has("software");
  const hasPhone = types.has("phone");

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
      retailNotes: [...base.retailNotes, `Computers: ${[...types].join(", ") || "listed"}`],
    });
  }

  function routeAfterI1() {
    if (hasPrinter) setStep("i2");
    else if (hasSoftware) setStep("i3");
    else if (hasPhone) setStep("i4");
    else setStep("i5");
  }

  function routeAfterI2() {
    if (hasSoftware) setStep("i3");
    else if (hasPhone) setStep("i4");
    else setStep("i5");
  }

  function routeAfterI3() {
    if (hasPhone) setStep("i4");
    else setStep("i5");
  }

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep("i1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "i1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick label="I1. What computer equipment are you bringing?" options={[...I1]} selected={types} onToggle={toggle} />
        <Button className="rounded-full" disabled={types.size === 0} onClick={() => routeAfterI1()}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "i2") {
    return (
      <IntakeBigChoice
        question="I2. Some locations do not accept printers or toner. Have you confirmed your selected store accepts printers?"
        yesEmoji="✅"
        noEmoji="❓"
        yesLabel="Yes / will check"
        noLabel="No — not confirmed"
        onPick={(yes) => {
          setP((prev) => {
            const recycling = !yes
              ? [
                  ...prev.recycling,
                  {
                    id: "i2-print",
                    categoryId: CAT,
                    pipeline: "advisory" as const,
                    message: "Check with your selected store directly before bringing a printer.",
                  },
                ]
              : prev.recycling;
            const out = { ...prev, recycling };
            queueMicrotask(() => routeAfterI2());
            return out;
          });
        }}
      />
    );
  }

  if (step === "i3") {
    return (
      <IntakeBigChoice
        question="I3. Is the software less than 2 years old?"
        yesEmoji="🆕"
        noEmoji="📅"
        yesLabel="Yes"
        noLabel="No — older"
        onPick={(yes) => {
          setP((prev) => {
            const recycling = !yes
              ? [
                  ...prev.recycling,
                  {
                    id: "i3-soft",
                    categoryId: CAT,
                    pipeline: "advisory" as const,
                    message: "Older software has limited resale value but can still be donated — Goodwill will assess.",
                  },
                ]
              : prev.recycling;
            queueMicrotask(() => routeAfterI3());
            return { ...prev, recycling };
          });
        }}
      />
    );
  }

  if (step === "i4") {
    return (
      <IntakeBigChoice
        question="I4. Have you confirmed your selected store accepts cell phones?"
        yesEmoji="✅"
        noEmoji="❓"
        yesLabel="Yes"
        noLabel="No"
        onPick={(yes) => {
          setP((prev) => {
            const recycling = !yes
              ? [
                  ...prev.recycling,
                  {
                    id: "i4-phone",
                    categoryId: CAT,
                    pipeline: "advisory" as const,
                    message: "Confirm with store before bringing cell phones.",
                  },
                ]
              : prev.recycling;
            queueMicrotask(() => setStep("i5"));
            return { ...prev, recycling };
          });
        }}
      />
    );
  }

  if (step === "i5") {
    return (
      <IntakeBigChoice
        question="I5. For working computers: have you wiped all personal data from the device?"
        hint="Strongly recommended before donating."
        yesEmoji="🔒"
        noEmoji="⚠️"
        yesLabel="Yes — wiped"
        noLabel="No — not yet"
        onPick={(yes) => {
          setP((prev) => {
            const recycling = yes
              ? prev.recycling
              : [
                  ...prev.recycling,
                  {
                    id: "i5-wipe",
                    categoryId: CAT,
                    pipeline: "advisory" as const,
                    message: "Strongly recommend wiping personal data before donation for your privacy.",
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
