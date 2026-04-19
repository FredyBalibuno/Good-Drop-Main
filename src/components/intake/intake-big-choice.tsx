"use client";

import { cn } from "@/lib/utils";

export function IntakeBigChoice({
  question,
  hint,
  onPick,
  yesEmoji = "👍",
  noEmoji = "👎",
  yesLabel = "Yes",
  noLabel = "No",
  variant = "default",
}: {
  question: string;
  hint?: string;
  onPick: (yes: boolean) => void;
  yesEmoji?: string;
  noEmoji?: string;
  yesLabel?: string;
  noLabel?: string;
  variant?: "default" | "danger";
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-semibold leading-snug text-foreground">{question}</p>
        {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onPick(true)}
          className={cn(
            "group flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border/80 bg-card p-6 text-center shadow-sm transition-all",
            "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            variant === "danger" &&
              "hover:border-emerald-500/40 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10",
          )}
        >
          <span className="text-5xl leading-none transition-transform group-hover:scale-110" aria-hidden>
            {yesEmoji}
          </span>
          <span className="text-base font-semibold">{yesLabel}</span>
        </button>
        <button
          type="button"
          onClick={() => onPick(false)}
          className={cn(
            "group flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border/80 bg-card p-6 text-center shadow-sm transition-all",
            "hover:-translate-y-0.5 hover:border-rose-400/50 hover:bg-rose-500/5 hover:shadow-md dark:hover:bg-rose-500/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400",
          )}
        >
          <span className="text-5xl leading-none transition-transform group-hover:scale-110" aria-hidden>
            {noEmoji}
          </span>
          <span className="text-base font-semibold">{noLabel}</span>
        </button>
      </div>
    </div>
  );
}
