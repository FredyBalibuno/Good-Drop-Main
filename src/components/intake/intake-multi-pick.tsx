"use client";

import { cn } from "@/lib/utils";

export type MultiPickOption = { id: string; label: string };

export function IntakeMultiPick({
  label,
  options,
  selected,
  onToggle,
  minHint,
}: {
  label: string;
  options: MultiPickOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  minHint?: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-base font-semibold leading-snug">{label}</p>
      {minHint ? <p className="text-xs text-muted-foreground">{minHint}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.has(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className={cn(
                "rounded-full border-2 px-3 py-2 text-left text-sm font-medium transition-colors",
                on
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border/80 bg-card hover:border-primary/40",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
