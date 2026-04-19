import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, BarChart3, HeartHandshake, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative flex-1 min-h-full overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[url('/intheback.png')] bg-cover bg-center bg-no-repeat"
        aria-hidden
      />

      <div className="relative">
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl [text-shadow:0_1px_3px_rgba(0,0,0,0.75),0_2px_28px_rgba(0,0,0,0.5)]">
              GoodDrop helps donation centers receive better goods, predict volume, and guide donors in
              real time.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7),0_2px_20px_rgba(0,0,0,0.45)]">
              Donors see what is needed before they pack the car. Staff sees planned arrivals before
              the dock gets busy. Everyone spends less time sorting things that cannot be resold.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/donate/plan"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full px-8 text-base shadow-md no-underline",
                )}
              >
                Plan your drop-off
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link
                to="/admin"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "rounded-full px-8 text-base no-underline",
                )}
              >
                Open staff dashboard
              </Link>
            </div>
            <dl className="mt-14 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Better incoming quality",
                  body: "Guidance plus a fast pre-drop checklist reduces broken, stained, or unsafe items before they arrive.",
                  icon: ShieldCheck,
                },
                {
                  title: "Smarter staffing",
                  body: "Pre-logged categories and quantities become a live forecast so the floor is staffed before the rush.",
                  icon: BarChart3,
                },
                {
                  title: "Demand-aligned giving",
                  body: "High-need and low-need lists update from the center so donors bring what moves today.",
                  icon: HeartHandshake,
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className="border-border/80 bg-card/95 shadow-sm"
                >
                  <CardContent className="flex gap-4 p-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="size-5" />
                    </span>
                    <div>
                      <dt className="font-semibold">{item.title}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</dd>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                We solve…
              </h2>
              <p className="mt-3 text-lg font-medium tracking-tight text-foreground sm:text-xl">
                Built for the three problems donation floors feel every week
              </p>
              <ul className="mt-6 space-y-4 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong className="text-foreground">Unsellable volume:</strong> guided lists and
                    a donor-side quality assistant set expectations before intake.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong className="text-foreground">Staffing guesswork:</strong> pre-logged items
                    roll into arrival curves and a recommended headcount for each shift.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong className="text-foreground">Donor uncertainty:</strong> live need
                    signals show what helps the mission most this week — and what to leave home.
                  </span>
                </li>
              </ul>
            </div>
            <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-background shadow-md">
              <CardContent className="space-y-4 p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  How it works
                </p>
                <p className="text-lg font-medium leading-snug">
                  Donors build an arrival plan with live need signals on every line item. That same
                  information is available in operations so teams can align staffing, sorting, and
                  demand before anyone reaches the dock.
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>
                    Add what you plan to bring — need signals on each line reflect what the center
                    needs right now.
                  </li>
                  <li>
                    Review the high-need and low-need lists whenever you want more context before
                    you confirm.
                  </li>
                  <li>
                    Work through the short resale-quality prompts, confirm your plan, and arrive
                    with staff already prepared for your categories and volumes.
                  </li>
                </ol>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    to="/donate/plan"
                    className={cn(buttonVariants(), "rounded-full no-underline")}
                  >
                    Plan your donation
                  </Link>
                  <Link
                    to="/admin"
                    className={cn(buttonVariants({ variant: "secondary" }), "rounded-full no-underline")}
                  >
                    Staff dashboard
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
