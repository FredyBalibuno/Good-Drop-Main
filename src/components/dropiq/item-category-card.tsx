import { Card, CardContent } from "@/components/ui/card";
import { NeedStatusBadge } from "@/components/dropiq/need-status-badge";
import type { NeedLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

export function ItemCategoryCard({
  label,
  level,
  hint,
  className,
}: {
  label: string;
  level: NeedLevel;
  hint?: string;
  className?: string;
}) {
  const ring =
    level === "high"
      ? "ring-emerald-500/25"
      : level === "low"
        ? "ring-amber-500/20"
        : "ring-rose-500/25";

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 shadow-sm transition hover:shadow-md",
        "ring-1 ring-inset",
        ring,
        className,
      )}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            level === "high" && "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
            level === "low" && "bg-amber-500/10 text-amber-900 dark:text-amber-100",
            level === "blocked" && "bg-rose-500/10 text-rose-900 dark:text-rose-100",
          )}
        >
          <Package className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium leading-snug text-foreground">{label}</p>
            <NeedStatusBadge level={level} />
          </div>
          {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
