import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

export function QualityRiskCard({
  resaleReadyPct,
  inspectionPct,
  topRisks,
}: {
  resaleReadyPct: number;
  inspectionPct: number;
  topRisks: { label: string; value: number }[];
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="size-4" />
          </span>
          Quality & resale readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Likely resale-ready</span>
              <span className="font-semibold tabular-nums">{Math.round(resaleReadyPct)}%</span>
            </div>
            <Progress value={resaleReadyPct} className="h-2" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Flagged for inspection</span>
              <span className="font-semibold tabular-nums">{Math.round(inspectionPct)}%</span>
            </div>
            <Progress value={inspectionPct} className="h-2 bg-rose-500/15 [&>div]:bg-rose-500" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Common risk categories</p>
          <ul className="space-y-2">
            {topRisks.map((r) => (
              <li
                key={r.label}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-sm"
              >
                <span>{r.label}</span>
                <span className="tabular-nums text-muted-foreground">{r.value}% of risk flags</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
