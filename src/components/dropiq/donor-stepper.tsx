"use client";

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = [
  { href: "/donate/plan", label: "Donation profile" },
  { href: "/donate/confirm", label: "Confirm" },
] as const;

export function DonorStepper() {
  const { pathname } = useLocation();
  const onFullNeedsList = pathname === "/donate/guidance";

  const idx = onFullNeedsList
    ? null
    : Math.max(
        0,
        steps.findIndex((s) => pathname === s.href || pathname.startsWith(`${s.href}/`)),
      );

  return (
    <div className="mb-8">
      {onFullNeedsList ? (
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Optional reference ·{" "}
          <Link to="/donate/plan" className="text-primary underline-offset-4 hover:underline">
            Back to plan your drop-off
          </Link>
        </p>
      ) : null}
      <ol className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {steps.map((step, i) => {
          const done = idx !== null && i < idx;
          const current = idx !== null && i === idx;
          return (
            <li key={step.href} className="flex items-center gap-2">
              <Link
                to={step.href}
                className={cn(
                  "flex items-center gap-2 rounded-full border-2 px-3 py-1.5 shadow-md transition-colors",
                  current &&
                    "border-primary bg-primary/20 text-primary ring-2 ring-primary/35 dark:bg-primary/30 dark:text-primary-foreground",
                  done &&
                    "border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/80 dark:text-emerald-50",
                  !current &&
                    !done &&
                    "border-neutral-800/25 bg-white/95 text-neutral-900 hover:border-neutral-800/40 hover:bg-white dark:border-white/25 dark:bg-neutral-950/95 dark:text-white dark:hover:bg-neutral-900",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                    current && "bg-primary text-primary-foreground shadow-sm",
                    done && "bg-emerald-600 text-white shadow-sm",
                    !current && !done && "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                {step.label}
              </Link>
              {i < steps.length - 1 ? (
                <span className="px-0.5 font-bold text-neutral-800 dark:text-neutral-200" aria-hidden>
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
