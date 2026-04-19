import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PlannedLineItem } from "@/lib/types";
import { ClipboardList } from "lucide-react";

export function DonationSummaryCard({
  items,
  dropoffDate,
  arrivalTime,
  locationLabel,
  condition,
}: {
  items: PlannedLineItem[];
  dropoffDate: string;
  arrivalTime: string;
  locationLabel: string;
  condition: string;
}) {
  const total = items.reduce((a, i) => a + i.quantity, 0);

  return (
    <Card className="border border-border bg-card shadow-md ring-1 ring-black/5 dark:ring-white/10">
      <CardHeader className="border-b border-border/60 bg-muted/30 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-4" />
          </span>
          Planned drop-off summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{dropoffDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Arrival</p>
            <p className="font-medium">{arrivalTime}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{locationLabel}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Overall condition</p>
            <p className="font-medium">{condition}</p>
          </div>
        </div>
        <Separator />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">Items ({items.length} categories)</p>
            <p className="text-muted-foreground">{total} pieces total</p>
          </div>
          <ul className="space-y-2">
            {items.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <span className="font-medium">{row.category}</span>
                  {row.lineQuality ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {row.lineQuality.message}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.quantity}
                  {row.unit ? ` ${row.unit}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
