"use client";

import { useMemo, useState } from "react";
import type { PartnerDonationCenter } from "@/lib/types";
import {
  PARTNER_DONATION_CENTERS,
  partnerCenterSearchBlob,
} from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight, MapPin, Search } from "lucide-react";

function formatCenterSubtitle(c: PartnerDonationCenter) {
  return `${c.city} · ${c.line}`;
}

export function PartnerDonationCenterField({
  value,
  onValueChange,
  className,
}: {
  value: string;
  onValueChange: (id: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PARTNER_DONATION_CENTERS.filter((c) => partnerCenterSearchBlob(c).includes(q));
  }, [query]);

  const selected = PARTNER_DONATION_CENTERS.find((c) => c.id === value) ?? PARTNER_DONATION_CENTERS[0];

  const sortedCenters = useMemo(
    () => [...PARTNER_DONATION_CENTERS].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  function pickCenter(c: PartnerDonationCenter) {
    onValueChange(c.id);
    setQuery("");
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Label htmlFor="center-search" className="text-foreground">
            Donation center
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Search for what you need — matching{" "}
            <span className="font-medium text-foreground">GoodDrop partner</span> sites appear below.
            Or open the list to browse every partner dock.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-full text-[0.65rem] font-semibold uppercase">
          Partners
        </Badge>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-border/40">
        <div className="relative border-b border-border/60 bg-muted/30">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="center-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for? e.g. electronics, baby gear, Saturday…"
            className="h-11 border-0 bg-transparent pl-10 pr-3 text-sm shadow-none focus-visible:ring-0"
            autoComplete="off"
          />
        </div>

        {query.trim() ? (
          <div className="border-b border-border/60 bg-background/80">
            <p className="px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Matching partners
            </p>
            {matches.length === 0 ? (
              <p className="px-3 pb-3 text-sm text-muted-foreground">
                No partner centers match that search. Try another keyword or pick from the full list
                below.
              </p>
            ) : (
              <ul className="max-h-56 space-y-0.5 overflow-y-auto px-2 pb-2">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => pickCenter(c)}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-xl px-2 py-2.5 text-left text-sm transition-colors",
                        c.id === value
                          ? "bg-primary/10 ring-1 ring-primary/25"
                          : "hover:bg-muted/80",
                      )}
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          {c.label}
                          {c.id === value ? (
                            <Badge variant="outline" className="rounded-full text-[0.6rem] font-semibold">
                              Selected
                            </Badge>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatCenterSubtitle(c)}
                        </span>
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {c.tags.slice(0, 5).map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                        </span>
                      </span>
                      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="border-b border-border/60 px-3 py-2 text-xs text-muted-foreground">
            Start typing to see partner sites that fit what you&apos;re looking for.
          </p>
        )}

        <div className="p-2">
          <p className="mb-1.5 px-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            All partner centers
          </p>
          <Select
            value={value}
            onValueChange={(v) => {
              if (v) onValueChange(v);
            }}
          >
            <SelectTrigger
              className={cn(
                "h-auto min-h-11 w-full border border-border/80 bg-muted/20 px-3 py-2 shadow-none",
                "hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-primary/25",
                "data-placeholder:text-muted-foreground",
              )}
            >
              <SelectValue className="sr-only">
                {`${selected.label} — ${selected.city}`}
              </SelectValue>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left" aria-hidden>
                <span className="truncate text-sm font-medium text-foreground">{selected.label}</span>
                <span className="line-clamp-2 text-xs font-normal text-muted-foreground">
                  {formatCenterSubtitle(selected)}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent
              side="bottom"
              align="start"
              className="max-h-72 rounded-xl"
            >
              {sortedCenters.map((c) => (
                <SelectItem key={c.id} value={c.id} className="items-start whitespace-normal py-2.5">
                  <span className="flex w-full flex-col gap-0.5 pr-4 text-left">
                    <span className="font-medium leading-tight">{c.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {formatCenterSubtitle(c)}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="border-t border-border/60 px-3 py-2 text-[0.7rem] leading-snug text-muted-foreground">
          Partner roster is mock data for this prototype — wire your directory API to the same field
          component later.
        </p>
      </div>
    </div>
  );
}
