import { Link } from "react-router-dom";
import { useDonationStore } from "@/context/donation-store";
import { ItemCategoryCard } from "@/components/dropiq/item-category-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Ban, ThumbsUp } from "lucide-react";

export default function DonationGuidancePage() {
  const { demand } = useDonationStore();

  return (
    <div className="space-y-10">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-white">
          Full needs list — optional deep dive
        </h1>
        <p className="text-white">
          Most donors start on{" "}
          <Link to="/donate/plan" className="font-medium text-white underline underline-offset-4 hover:text-white/80">
            Plan your drop-off
          </Link>{" "}
          for live line-by-line signals. Use this page when you want the complete picture staff is
          publishing right now.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
            <Sparkles className="size-4" />
          </span>
          <h2 className="text-lg font-semibold text-white">Most needed right now</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {demand.highNeed.map((item) => (
            <ItemCategoryCard
              key={item.id}
              label={item.label}
              level="high"
              hint="Clean, complete, and ready for the sales floor or direct community programs."
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-900 dark:text-amber-100">
            <ThumbsUp className="size-4" />
          </span>
          <h2 className="text-lg font-semibold text-white">Temporarily lower priority</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {demand.lowNeed.map((item) => (
            <ItemCategoryCard
              key={item.id}
              label={item.label}
              level="low"
              hint="Still welcome if excellent condition — but storage is tight, so quality matters more."
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-900 dark:text-rose-100">
            <Ban className="size-4" />
          </span>
          <h2 className="text-lg font-semibold text-white">Not accepted</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {demand.notAccepted.map((item) => (
            <ItemCategoryCard
              key={item.id}
              label={item.label}
              level="blocked"
              hint="Please keep these out of your donation bags so staff can focus on resale-ready goods."
            />
          ))}
        </div>
      </section>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Simple quality guidelines</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              Clean and dry textiles — no heavy odors, mildew, or pet damage.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              Working electronics with cords or chargers when possible.
            </li>
          </ul>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              Shoes should be paired; soles intact and safe to wear.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              Small parts taped inside boxes; puzzles and games complete.
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/80">
          Ready to turn this into a forecast for staff? Add your items on the plan screen — feedback
          updates as you type.
        </p>
        <Link
          to="/donate/plan"
          className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8 no-underline")}
        >
          Plan your drop-off
        </Link>
      </div>
    </div>
  );
}
