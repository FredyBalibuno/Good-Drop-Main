"use client";

import { useState } from "react";
import type { IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { IntakeMultiPick } from "@/components/intake/intake-multi-pick";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CAT: IntakeCategoryId = "books_media";

const INTRO =
  "We accept hardback and paperback books, textbooks, encyclopedias, vinyl records, cassette tapes, CDs, video games, DVDs, VHS movies, and books on tape.";

const H1 = [
  { id: "hardback", label: "Hardback books" },
  { id: "paperback", label: "Paperback books" },
  { id: "textbooks", label: "Textbooks or encyclopedias" },
  { id: "vinyl", label: "Vinyl records" },
  { id: "cassette", label: "Cassette tapes" },
  { id: "cds", label: "CDs" },
  { id: "dvd", label: "DVDs or Blu-rays" },
  { id: "vhs", label: "VHS movies" },
  { id: "games", label: "Video games" },
  { id: "software", label: "Software" },
  { id: "other", label: "Other media" },
] as const;

export function BooksMediaModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState<"intro" | "h1" | "h2" | "h3" | "h4" | "h5">("intro");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [p, setP] = useState<CategoryModulePayload>({ blocks: [], recycling: [], retailNotes: [] });

  const hasGames = types.has("games");
  const hasCdDvd = types.has("cds") || types.has("dvd");
  /** H5 — shown if software or video games selected */
  const askSoftwareAge = types.has("software") || types.has("games");

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
      retailNotes: [...base.retailNotes, `Books/media: ${[...types].join(", ") || "listed"}`],
    });
  }

  function routeAfterH2() {
    if (hasGames) setStep("h3");
    else if (hasCdDvd) setStep("h4");
    else if (askSoftwareAge) setStep("h5");
    else setP((prev) => {
      finalize(prev);
      return prev;
    });
  }

  function routeAfterH3() {
    if (hasCdDvd) setStep("h4");
    else if (askSoftwareAge) setStep("h5");
    else
      setP((prev) => {
        finalize(prev);
        return prev;
      });
  }

  function routeAfterH4() {
    if (askSoftwareAge) setStep("h5");
    else
      setP((prev) => {
        finalize(prev);
        return prev;
      });
  }

  if (step === "intro") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{INTRO}</p>
          <Button className="rounded-full" onClick={() => setStep("h1")}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "h1") {
    return (
      <div className="space-y-4">
        <IntakeMultiPick label="H1. What media are you bringing?" options={[...H1]} selected={types} onToggle={toggle} />
        <Button className="rounded-full" disabled={types.size === 0} onClick={() => setStep("h2")}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "h2") {
    return (
      <IntakeBigChoice
        question="H2. Are all books free of water damage, mold, and excessive highlighting or writing?"
        yesEmoji="📚"
        noEmoji="⚠️"
        yesLabel="Yes"
        noLabel="No — some issues"
        onPick={(yes) => {
          setP((prev) => {
            let recycling = prev.recycling;
            if (!yes) {
              recycling = [
                ...recycling,
                {
                  id: "h2-books",
                  categoryId: CAT,
                  pipeline: "recycling" as const,
                  message:
                    "Water-damaged or moldy books cannot be accepted — remove those. Heavy writing/highlighting → paper recycling; tag separately.",
                },
              ];
            }
            const out = { ...prev, recycling };
            queueMicrotask(() => routeAfterH2());
            return out;
          });
        }}
      />
    );
  }

  if (step === "h3") {
    return (
      <IntakeBigChoice
        question="H3. Is game software or disc/cartridge in working condition and in its original case?"
        yesEmoji="🎮"
        noEmoji="📀"
        yesLabel="Yes"
        noLabel="No"
        onPick={(yes) => {
          setP((prev) => {
            let recycling = prev.recycling;
            if (!yes) {
              recycling = [
                ...recycling,
                {
                  id: "h3-games",
                  categoryId: CAT,
                  pipeline: "recycling" as const,
                  message: "Games without cases or damaged discs — still bring; tag lower-priority.",
                },
              ];
            }
            const out = { ...prev, recycling };
            queueMicrotask(() => routeAfterH3());
            return out;
          });
        }}
      />
    );
  }

  if (step === "h4") {
    return (
      <IntakeBigChoice
        question="H4. For CDs and DVDs — are the discs free of deep scratches that would affect playability?"
        yesEmoji="✅"
        noEmoji="💿"
        yesLabel="Yes"
        noLabel="No — heavily scratched"
        onPick={(yes) => {
          setP((prev) => {
            let recycling = prev.recycling;
            if (!yes) {
              recycling = [
                ...recycling,
                {
                  id: "h4-disc",
                  categoryId: CAT,
                  pipeline: "recycling" as const,
                  message: "Heavily scratched discs → recycling/salvage; tag separately.",
                },
              ];
            }
            const out = { ...prev, recycling };
            queueMicrotask(() => routeAfterH4());
            return out;
          });
        }}
      />
    );
  }

  if (step === "h5") {
    return (
      <IntakeBigChoice
        question="H5. Is the software less than 2 years old?"
        yesEmoji="🆕"
        noEmoji="📅"
        yesLabel="Yes"
        noLabel="No — older"
        onPick={(yes) => {
          setP((prev) => {
            const recycling = yes
              ? prev.recycling
              : [
                  ...prev.recycling,
                  {
                    id: "h5-soft",
                    categoryId: CAT,
                    pipeline: "advisory" as const,
                    message: "Older software has very limited resale value — still acceptable; Goodwill may not sell.",
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
