"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import type { LineItemQualityState, QualityTier } from "@/lib/types";
import {
  getItemQualityProfile,
  lineQualitySummaryMessage,
  tierForLineAnswers,
} from "@/lib/item-line-quality";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

function YesNo({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper?: string;
  value: boolean | null;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="text-sm font-medium leading-snug text-foreground">{label}</p>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      <div className="flex flex-wrap gap-2 pt-0.5">
        {(
          [
            { key: "yes", label: "Yes", val: true as const },
            { key: "no", label: "No", val: false as const },
          ] as const
        ).map((opt) => (
          <Button
            key={opt.key}
            type="button"
            size="sm"
            variant={value === opt.val ? "default" : "outline"}
            className={cn("rounded-full px-4", value === opt.val && "shadow-sm")}
            onClick={() => onChange(opt.val)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function ItemQualityDialog({
  open,
  onOpenChange,
  category,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  initial?: LineItemQualityState | null;
  onSave: (result: LineItemQualityState) => void;
}) {
  const profile = useMemo(() => getItemQualityProfile(category.trim() || "Miscellaneous"), [category]);

  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    if (!open) return;
    const p = getItemQualityProfile(category.trim() || "Miscellaneous");
    const next: Record<string, boolean | null> = {};
    for (const q of p.questions) {
      next[q.id] = initial?.answers[q.id] ?? null;
    }
    startTransition(() => setAnswers(next));
  }, [open, category, initial]);

  const allAnswered = profile.questions.every((q) => answers[q.id] !== null && answers[q.id] !== undefined);

  const liveTier: QualityTier | null = useMemo(() => {
    if (!allAnswered) return null;
    const bools: Record<string, boolean> = {};
    for (const q of profile.questions) {
      bools[q.id] = answers[q.id] as boolean;
    }
    return tierForLineAnswers(bools);
  }, [allAnswered, answers, profile.questions]);

  const liveMessage = useMemo(() => {
    if (liveTier === null) return "Answer each question — we’ll compare your line to typical intake standards.";
    return lineQualitySummaryMessage(category.trim() || "This item", profile.title, liveTier);
  }, [liveTier, category, profile.title]);

  function patch(id: string, v: boolean) {
    setAnswers((a) => ({ ...a, [id]: v }));
  }

  function handleSave() {
    if (!allAnswered) return;
    const bools: Record<string, boolean> = {};
    for (const q of profile.questions) {
      bools[q.id] = answers[q.id] as boolean;
    }
    const tier = tierForLineAnswers(bools);
    const message = lineQualitySummaryMessage(category.trim() || "This item", profile.title, tier);
    onSave({
      profileId: profile.id,
      profileTitle: profile.title,
      answers: bools,
      tier,
      message,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[min(90vh,40rem)] w-full max-w-lg gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <div className="border-b border-border/60 bg-primary/5 px-4 py-4 sm:px-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Quick quality check
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              <span className="font-medium text-foreground">
                {category.trim() || "This line"}
              </span>{" "}
              — answer using the same standards most reuse centers train intake staff on. This helps
              reduce surprises at the dock.
            </DialogDescription>
          </DialogHeader>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
            <Sparkles className="size-3.5" aria-hidden />
            {profile.title}
          </p>
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5">
          {profile.questions.map((q) => (
            <YesNo
              key={q.id}
              label={q.prompt}
              helper={q.helper}
              value={answers[q.id] ?? null}
              onChange={(v) => patch(q.id, v)}
            />
          ))}
        </div>

        <div
          className={cn(
            "mx-4 mb-4 flex gap-3 rounded-xl border px-3 py-3 text-sm sm:mx-5",
            liveTier === "good" && "border-emerald-500/40 bg-emerald-500/10",
            liveTier === "mixed" && "border-amber-500/40 bg-amber-500/10",
            liveTier === "risky" && "border-rose-500/40 bg-rose-500/10",
            liveTier === null && "border-border/80 bg-muted/30",
          )}
        >
          {liveTier === "good" ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
          ) : liveTier === "risky" ? (
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-700 dark:text-rose-300" />
          ) : liveTier === "mixed" ? (
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-800 dark:text-amber-200" />
          ) : (
            <Sparkles className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          )}
          <p className="leading-relaxed text-foreground/90">{liveMessage}</p>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/30 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!allAnswered}>
            Save for this item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
