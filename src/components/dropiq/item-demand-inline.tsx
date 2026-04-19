"use client";

import { cn } from "@/lib/utils";
import type { DemandSignal } from "@/lib/demand-feedback";
import { OVERFLOW_SHELTER } from "@/lib/mock-data";
import { MapPin, CalendarDays, Sparkles } from "lucide-react";

function SignalDot({ signal }: { signal: Exclude<DemandSignal, "empty"> }) {
  const map = {
    high: "bg-emerald-500 shadow-[0_0_0_3px] shadow-emerald-500/30",
    moderate: "bg-amber-400 shadow-[0_0_0_3px] shadow-amber-400/25",
    high_supply: "bg-orange-500 shadow-[0_0_0_3px] shadow-orange-500/25",
    not_accepted: "bg-rose-500 shadow-[0_0_0_3px] shadow-rose-500/25",
  } as const;
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", map[signal])}
      aria-hidden
    />
  );
}

export function ItemDemandInline({
  signal,
  headline,
  body,
  categoryLabel,
}: {
  signal: DemandSignal;
  headline: string;
  body: string;
  categoryLabel: string;
}) {
  if (signal === "empty") {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
        {body}
      </div>
    );
  }

  const tone =
    signal === "high"
      ? "border-emerald-500/40 bg-emerald-500/[0.07]"
      : signal === "moderate"
        ? "border-amber-500/35 bg-amber-500/[0.06]"
        : signal === "high_supply"
          ? "border-orange-500/40 bg-orange-500/[0.06]"
          : "border-rose-500/40 bg-rose-500/[0.06]";

  return (
    <div className={cn("space-y-2 rounded-lg border-l-4 px-3 py-2.5 text-sm", tone)}>
      <div className="flex items-start gap-2">
        <SignalDot signal={signal} />
        <div>
          <p className="font-semibold text-foreground">{headline}</p>
          <p className="mt-0.5 leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>

      {signal === "high_supply" ? (
        <div className="ml-4 space-y-2 rounded-md border border-border/60 bg-background/80 p-3 text-xs leading-relaxed">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Suggestions
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Consider donating to:</span>{" "}
            {OVERFLOW_SHELTER.name}{" "}
            <span className="inline-flex items-center gap-1 text-foreground/80">
              <MapPin className="size-3" aria-hidden />
              {OVERFLOW_SHELTER.distance}
            </span>
            — {OVERFLOW_SHELTER.note}
          </p>
          <p className="flex items-start gap-1.5 text-muted-foreground">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Or</span> schedule your GoodDrop drop-off
              for next week when our{" "}
              <span className="font-medium text-foreground">
                {categoryLabel || "this category"}
              </span>{" "}
              lane typically clears — you&apos;re never blocked from giving; we just help you time it
              better.
            </span>
          </p>
        </div>
      ) : null}

      {signal === "not_accepted" ? (
        <div className="ml-4 space-y-2 rounded-md border border-border/60 bg-background/80 p-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Partner option:</span>{" "}
            {OVERFLOW_SHELTER.name} ({OVERFLOW_SHELTER.distance}) may accept some items we
            can&apos;t process here — call ahead to confirm.
          </p>
        </div>
      ) : null}
    </div>
  );
}
