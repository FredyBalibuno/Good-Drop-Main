import { cn } from "@/lib/utils";
import type { NeedLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const styles: Record<
  NeedLevel,
  { label: string; className: string }
> = {
  high: {
    label: "High Need",
    className:
      "border-transparent bg-emerald-600/15 text-emerald-900 hover:bg-emerald-600/20 dark:bg-emerald-500/20 dark:text-emerald-50",
  },
  low: {
    label: "Low Need",
    className:
      "border-transparent bg-amber-500/15 text-amber-950 hover:bg-amber-500/20 dark:bg-amber-400/15 dark:text-amber-50",
  },
  blocked: {
    label: "Not Accepted",
    className:
      "border-transparent bg-rose-600/15 text-rose-900 hover:bg-rose-600/20 dark:bg-rose-500/20 dark:text-rose-50",
  },
};

export function NeedStatusBadge({
  level,
  className,
}: {
  level: NeedLevel;
  className?: string;
}) {
  const s = styles[level];
  return (
    <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 text-xs font-semibold", s.className, className)}>
      {s.label}
    </Badge>
  );
}
