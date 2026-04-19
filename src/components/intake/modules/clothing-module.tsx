"use client";

import { useCallback, useState } from "react";
import type { ConditionNote, HardBlock, IntakeCategoryId } from "@/lib/intake-flow/types";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const CAT: IntakeCategoryId = "clothing";

const INTRO =
  "All clothing must be clean and free of stains, tears, pet hair, and odor. We accept men's, women's, children's, and infant clothing — both vintage and new items are welcome.";

export function ClothingModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState(0);
  const [a1, setA1] = useState("");
  const [stainCount, setStainCount] = useState("");
  const [tearCount, setTearCount] = useState("");
  const [petDesc, setPetDesc] = useState("");
  const [accum, setAccum] = useState<CategoryModulePayload>({
    blocks: [],
    recycling: [],
    retailNotes: [],
  });

  const pushRecycling = useCallback((note: Omit<ConditionNote, "categoryId">) => {
    setAccum((prev) => ({
      ...prev,
      recycling: [...prev.recycling, { ...note, categoryId: CAT }],
    }));
  }, []);

  const pushBlock = useCallback((block: Omit<HardBlock, "categoryId">) => {
    setAccum((prev) => ({
      ...prev,
      blocks: [...prev.blocks, { ...block, categoryId: CAT }],
    }));
  }, []);

  const finish = useCallback(() => {
    const retailNotes = a1 ? [...accum.retailNotes, `Clothing volume band: ${a1}`] : accum.retailNotes;
    onComplete({ ...accum, retailNotes });
  }, [a1, accum, onComplete]);

  if (step === 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed text-foreground/90">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep(1)}>
            Start clothing questions
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold">A1. How many clothing items approximately?</Label>
        <Select value={a1} onValueChange={(v) => v && setA1(v)}>
          <SelectTrigger className="h-12 rounded-xl text-base">
            <SelectValue placeholder="Choose a range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1–5">1 – 5</SelectItem>
            <SelectItem value="6–15">6 – 15</SelectItem>
            <SelectItem value="16–30">16 – 30</SelectItem>
            <SelectItem value="30+">30+</SelectItem>
          </SelectContent>
        </Select>
        <Button className="rounded-full" disabled={!a1} onClick={() => setStep(2)}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <IntakeBigChoice
        question="A2. Are all clothing items clean with no visible stains?"
        hint="If not, we'll tag stained pieces for the textile recycling stream — bag them separately as “Recycling.”"
        yesEmoji="✨"
        noEmoji="🧺"
        yesLabel="Yes — clean"
        noLabel="No — some stains"
        onPick={(yes) => {
          if (yes) setStep(3);
          else setStep(20);
        }}
      />
    );
  }

  if (step === 20) {
    return (
      <div className="space-y-4">
        <Label>How many items have stains?</Label>
        <Input
          inputMode="numeric"
          value={stainCount}
          onChange={(e) => setStainCount(e.target.value)}
          placeholder="e.g., 3"
          className="h-12 rounded-xl"
        />
        <Button
          className="rounded-full"
          onClick={() => {
            pushRecycling({
              id: "clothing-stains",
              pipeline: "recycling",
              message: `${stainCount || "?"} stained clothing item(s) — bag separately labeled “Recycling”.`,
            });
            setStep(3);
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <IntakeBigChoice
        question="A3. Are all clothing items free of tears, holes, or rips?"
        yesEmoji="🪡"
        noEmoji="✂️"
        yesLabel="Yes — intact"
        noLabel="No — some damage"
        onPick={(yes) => {
          if (yes) setStep(4);
          else setStep(30);
        }}
      />
    );
  }

  if (step === 30) {
    return (
      <div className="space-y-4">
        <Label>How many items have tears or holes?</Label>
        <Input
          value={tearCount}
          onChange={(e) => setTearCount(e.target.value)}
          className="h-12 rounded-xl"
        />
        <Button
          className="rounded-full"
          onClick={() => {
            pushRecycling({
              id: "clothing-tears",
              pipeline: "recycling",
              message: `${tearCount || "?"} torn item(s) — textile recycling pipeline.`,
            });
            setStep(4);
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <IntakeBigChoice
        question="A4. Are any clothing items covered in pet hair?"
        yesEmoji="🐾"
        noEmoji="🚫"
        yesLabel="Yes — pet hair present"
        noLabel="No pet hair"
        onPick={(yes) => {
          if (yes) setStep(40);
          else setStep(5);
        }}
      />
    );
  }

  if (step === 40) {
    return (
      <div className="space-y-4">
        <Label>Which items have pet hair? (short description)</Label>
        <Input value={petDesc} onChange={(e) => setPetDesc(e.target.value)} className="h-12 rounded-xl" />
        <Button
          className="rounded-full"
          onClick={() => {
            pushRecycling({
              id: "clothing-pet",
              pipeline: "recycling",
              message: `Pet hair: ${petDesc || "see notes"} — bag separately.`,
            });
            setStep(5);
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  if (step === 5) {
    return (
      <IntakeBigChoice
        question="A5. Do any items have a strong or persistent odor (smoke, mildew, mustiness)?"
        hint="Mildew cannot be accepted or recycled — dispose at home. Smoke may route to recycling."
        yesEmoji="👃"
        noEmoji="🌿"
        yesLabel="Yes — odor present"
        noLabel="No strong odor"
        onPick={(yes) => {
          if (!yes) {
            setStep(6);
            return;
          }
          setStep(50);
        }}
      />
    );
  }

  if (step === 50) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">What kind of odor?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="destructive"
            className="h-auto min-h-[100px] flex-col gap-2 rounded-2xl py-4"
            onClick={() => {
              pushBlock({
                id: "mildew",
                message: "Mildew odor — cannot be accepted or recycled. Leave these items at home.",
              });
              setStep(6);
            }}
          >
            <span className="text-3xl">🦠</span>
            Mildew / mold smell
          </Button>
          <Button
            variant="secondary"
            className="h-auto min-h-[100px] flex-col gap-2 rounded-2xl py-4"
            onClick={() => {
              pushRecycling({
                id: "smoke",
                pipeline: "recycling",
                message: "Smoke odor — recycling pipeline; bag separately.",
              });
              setStep(6);
            }}
          >
            <span className="text-3xl">🚬</span>
            Smoke / other odor
          </Button>
        </div>
      </div>
    );
  }

  if (step === 6) {
    return (
      <IntakeBigChoice
        question="A6. Are any of the items wet or damp right now?"
        hint="Wet items cannot be accepted under any circumstances — fully dry at home before donating."
        yesEmoji="💧"
        noEmoji="☀️"
        yesLabel="Yes — wet / damp"
        noLabel="Dry — ready"
        onPick={(yes) => {
          if (yes) {
            const wetBlock = {
              id: "wet-clothing",
              categoryId: CAT,
              message: "Wet clothing cannot be accepted. Dry fully at home — do not bring damp items.",
            } satisfies HardBlock;
            const retailNotes = a1 ? [...accum.retailNotes, `Clothing volume band: ${a1}`] : accum.retailNotes;
            onComplete({ ...accum, blocks: [...accum.blocks, wetBlock], retailNotes });
            return;
          }
          finish();
        }}
      />
    );
  }

  return null;
}
