import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function StaffingRecommendationCard({
  workers,
  volumeLabel,
  reasoning,
  shiftLabel,
}: {
  workers: number;
  volumeLabel: "Light" | "Moderate" | "Heavy";
  reasoning: string;
  shiftLabel: string;
}) {
  const tone =
    volumeLabel === "Light"
      ? "bg-sky-500/10 text-sky-900 dark:text-sky-100"
      : volumeLabel === "Moderate"
        ? "bg-violet-500/10 text-violet-900 dark:text-violet-100"
        : "bg-orange-500/10 text-orange-950 dark:text-orange-50";

  return (
    <Card className="border-border/80 shadow-sm ring-1 ring-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-4" />
          </span>
          Workforce prediction
          <Badge variant="secondary" className="rounded-full font-semibold">
            {shiftLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Recommended on floor</p>
            <p className="text-4xl font-semibold tracking-tight">{workers}</p>
            <p className="text-sm text-muted-foreground">workers</p>
          </div>
          <div className={cn("rounded-xl px-3 py-2 text-sm font-semibold", tone)}>
            {volumeLabel} volume
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border border-border/80 bg-muted/40 p-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-foreground/90">{reasoning}</p>
        </div>
      </CardContent>
    </Card>
  );
}
