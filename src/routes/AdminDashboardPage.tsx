import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDonationStore } from "@/context/donation-store";
import { apiUrl } from "@/lib/api";
import type { PickupRequest } from "@/lib/types";
import { MetricCard } from "@/components/dropiq/metric-card";
import { StaffingRecommendationCard } from "@/components/dropiq/staffing-recommendation-card";
import { QualityRiskCard } from "@/components/dropiq/quality-risk-card";
import { DemandListEditor } from "@/components/dropiq/demand-list-editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { DonationSubmission } from "@/lib/types";
import { addDaysISO, todayISO } from "@/lib/dates";
import { formatStaffingReasoning, recommendStaffing } from "@/lib/staffing";
import {
  aggregateCategories,
  busiestArrivalBuckets,
  qualitySplit,
  submissionsForDays,
  topRiskCategories,
  totalPlannedItems,
  unsellableRiskEstimate,
} from "@/lib/admin-analytics";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Megaphone,
  Package,
  Sparkles,
  Truck,
  Users,
  Workflow,
} from "lucide-react";

const CategoryMixChart = lazy(() =>
  import("@/components/dropiq/category-mix-chart").then((m) => ({ default: m.CategoryMixChart })),
);

const BusyWindowsChart = lazy(() =>
  import("@/components/dropiq/busy-windows-chart").then((m) => ({ default: m.BusyWindowsChart })),
);

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "pipeline", label: "Pipeline", icon: Package },
  { id: "staffing", label: "Workforce", icon: Workflow },
  { id: "quality", label: "Quality", icon: ListChecks },
  { id: "demand", label: "Demand", icon: Megaphone },
  { id: "pickups", label: "Pickups", icon: Truck },
  { id: "snapshot", label: "Snapshot", icon: CalendarClock },
] as const;

function donorRef(s: DonationSubmission) {
  return `Pre-log · ${s.id.slice(0, 8)}`;
}

function itemsPreview(s: DonationSubmission) {
  const parts = s.items.slice(0, 2).map((i) => `${i.category} (${i.quantity})`);
  const extra = s.items.length > 2 ? ` +${s.items.length - 2}` : "";
  return parts.join(" · ") + extra;
}

function tierProgress(tier: DonationSubmission["qualityTier"]) {
  if (tier === "good") return 100;
  if (tier === "mixed") return 50;
  return 15;
}

function tierBadge(tier: DonationSubmission["qualityTier"]) {
  if (tier === "good")
    return (
      <Badge className="rounded-full border-transparent bg-emerald-600/15 font-semibold text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-50">
        Resale-ready
      </Badge>
    );
  if (tier === "mixed")
    return (
      <Badge className="rounded-full border-transparent bg-amber-500/15 font-semibold text-amber-950 dark:bg-amber-400/15 dark:text-amber-50">
        Mixed
      </Badge>
    );
  return (
    <Badge className="rounded-full border-transparent bg-rose-600/15 font-semibold text-rose-900 dark:bg-rose-500/20 dark:text-rose-50">
      High risk
    </Badge>
  );
}

export default function AdminDashboardPage() {
  const [activeNav, setActiveNav] = useState<string>("overview");
  const {
    submissions,
    demand,
    setHighNeed,
    setLowNeed,
    setNotAccepted,
    loading,
  } = useDonationStore();

  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const pendingPickups = pickupRequests.filter((r) => r.status === "pending");

  useEffect(() => {
    fetch(apiUrl("/api/pickup-requests"))
      .then((r) => r.json())
      .then((data) => setPickupRequests(data as PickupRequest[]))
      .catch(() => {});
  }, []);

  async function updatePickupStatus(id: string, status: "accepted" | "rejected") {
    await fetch(apiUrl(`/api/pickup-requests/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    setPickupRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);

  const subsToday = useMemo(
    () => submissionsForDays(submissions, [today]),
    [submissions, today],
  );
  const subsTomorrow = useMemo(
    () => submissionsForDays(submissions, [tomorrow]),
    [submissions, tomorrow],
  );
  const subsCombined = useMemo(() => [...subsToday, ...subsTomorrow], [subsToday, subsTomorrow]);

  const itemsToday = totalPlannedItems(subsToday);
  const itemsTomorrow = totalPlannedItems(subsTomorrow);
  const donorsToday = subsToday.length;
  const donorsTomorrow = subsTomorrow.length;

  const categoryData = useMemo(() => aggregateCategories(subsCombined, 7), [subsCombined]);
  const riskUnits = useMemo(() => unsellableRiskEstimate(subsCombined), [subsCombined]);
  const quality = useMemo(() => qualitySplit(subsCombined), [subsCombined]);
  const risks = useMemo(() => topRiskCategories(subsCombined), [subsCombined]);
  const busy = useMemo(() => busiestArrivalBuckets(subsCombined), [subsCombined]);

  const staffTodayPm = useMemo(
    () => recommendStaffing({ submissions: subsToday, day: today, shift: "afternoon" }),
    [subsToday, today],
  );

  const staffTomorrowAm = useMemo(
    () => recommendStaffing({ submissions: subsTomorrow, day: tomorrow, shift: "morning" }),
    [subsTomorrow, tomorrow],
  );

  const topCategoryLabel = categoryData[0]?.name ?? null;
  const clothingHeavy = categoryData.some(
    (c) => /cloth|shirt|jacket|shoe|coat|textile/i.test(c.name) && c.count >= 12,
  );

  const recommendations = useMemo(() => {
    if (!subsCombined.length) return ["No pre-logs yet for today or tomorrow — check back once donors start planning."];
    const peak = [...busy].sort((a, b) => b.count - a.count)[0]?.window;
    const lines: string[] = [];
    if (peak) lines.push(`Arrivals concentrate in the ${peak} window — schedule extra sorting staff then.`);
    if (clothingHeavy) {
      lines.push("High clothing volume incoming — keep textile carts staged near the dock.");
    } else if (categoryData.length) {
      lines.push(`Incoming mix is led by ${categoryData[0].name} — keep a flexible pod ready.`);
    }
    if (demand.lowNeed.some((d) => /furniture|desk|chair/i.test(d.label))) {
      lines.push("Furniture is marked low need — redirect donors toward smaller hardlines this week.");
    }
    if (quality.inspectionPct > 40) {
      lines.push(`${quality.inspectionPct}% of incoming items flagged for inspection — consider an extra quality lane.`);
    }
    return lines;
  }, [subsCombined, busy, clothingHeavy, categoryData, demand.lowNeed, quality.inspectionPct]);

  const pipelineRows = useMemo(
    () => [...submissions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [submissions],
  );

  const railCards = useMemo(() => subsCombined.slice(0, 4), [subsCombined]);

  const [ratingInputs, setRatingInputs] = useState<Record<string, string>>({});
  const [ratingLoading, setRatingLoading] = useState<Record<string, boolean>>({});

  async function submitRating(userId: string, submissionId: string) {
    const val = Number(ratingInputs[submissionId]);
    if (!val || val < 1 || val > 5) return;
    setRatingLoading((p) => ({ ...p, [submissionId]: true }));
    await fetch(apiUrl(`/api/users/${userId}/rating`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: val }),
    }).catch(() => {});
    setRatingLoading((p) => ({ ...p, [submissionId]: false }));
    setRatingInputs((p) => ({ ...p, [submissionId]: "" }));
  }

  function scrollToSection(id: string) {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground text-sm">
        Loading dashboard data…
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#eef1f4] dark:bg-background">
      <div className="mx-auto grid max-w-[1600px] gap-0 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        {/* Mobile nav */}
        <div className="border-b border-border/60 bg-card/80 px-3 py-2 lg:hidden">
          <nav className="flex gap-1.5 overflow-x-auto pb-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "border-sky-600/40 bg-sky-500/15 text-sky-950 dark:text-sky-50"
                      : "border-border/60 bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-3.5 opacity-80" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Left sidebar — desktop */}
        <aside className="relative hidden border-r border-border/60 bg-card/70 lg:block">
          <div className="sticky top-[4.75rem] flex max-h-[calc(100vh-4.75rem)] flex-col gap-1 overflow-y-auto p-3 sm:top-[5.35rem] sm:max-h-[calc(100vh-5.35rem)] md:top-24 md:max-h-[calc(100vh-6rem)]">
            <p className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Navigate
            </p>
            <div className="relative flex flex-col gap-0.5 pl-2">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "relative flex w-full items-center gap-2 rounded-lg py-2 pr-2 pl-3 text-left text-sm font-medium transition-colors",
                      active
                        ? "bg-sky-500/12 text-sky-950 dark:bg-sky-500/15 dark:text-sky-50"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    {active ? (
                      <span className="absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-full bg-sky-600 dark:bg-sky-400" />
                    ) : null}
                    <Icon className="size-4 shrink-0 opacity-80" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main column */}
        <main className="min-w-0 space-y-6 p-4 sm:p-6 lg:border-r lg:border-border/50">
          <section id="overview" className="scroll-mt-40 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Planned items · today"
                value={String(itemsToday)}
                subtitle="Across all pre-logged donors"
                icon={ClipboardList}
                trend={{ label: `${donorsToday} donors on the calendar`, positive: true }}
              />
              <MetricCard
                title="Planned items · tomorrow"
                value={String(itemsTomorrow)}
                subtitle="Helps overnight staging decisions"
                icon={LineChart}
              />
              <MetricCard
                title="Donors scheduled"
                value={`${donorsToday + donorsTomorrow}`}
                subtitle={`${donorsToday} today · ${donorsTomorrow} tomorrow`}
                icon={Users}
              />
              <MetricCard
                title="Unsellable-risk units (est.)"
                value={String(riskUnits)}
                subtitle="Weighted from quality self-check + categories"
                icon={AlertTriangle}
                trend={{ label: "Lower is better for dock throughput", positive: riskUnits < 40 }}
              />
            </div>
          </section>

          {/* Map replacement: dual analytics canvas */}
          <section className="scroll-mt-40 space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Active donation pipeline
                </h2>
                <p className="text-base font-semibold text-foreground">Volume & arrival mix (today + tomorrow)</p>
              </div>
              <BarChart3 className="size-5 text-sky-600 opacity-80 dark:text-sky-400" />
            </div>

            <Card className="overflow-hidden rounded-2xl border-0 bg-card shadow-md ring-1 ring-black/5 dark:ring-white/10">
              <Suspense
                fallback={
                  <CardContent className="grid gap-8 p-5 lg:grid-cols-2 lg:gap-6">
                    <div className="h-56 w-full animate-pulse rounded-xl bg-muted/60" />
                    <div className="h-48 w-full animate-pulse rounded-xl bg-muted/60" />
                  </CardContent>
                }
              >
                <CardContent className="grid gap-8 p-5 lg:grid-cols-2 lg:gap-6">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Top categories
                    </p>
                    <CategoryMixChart data={categoryData} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Busiest arrival windows
                    </p>
                    <BusyWindowsChart data={busy} />
                    <p className="mt-2 text-[0.7rem] text-muted-foreground">
                      Based on pre-logged arrival times from the DB.
                    </p>
                  </div>
                </CardContent>
              </Suspense>
            </Card>

            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <span className="size-2 rounded-full bg-emerald-500" /> Donor view: high demand
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-400" /> Moderate / waitlist
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-500" /> High supply (redirect-friendly)
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-500" /> Not accepted at dock
              </span>
            </div>
          </section>

          <section id="pipeline" className="scroll-mt-40 space-y-3">
            <h2 className="text-base font-semibold">Incoming pre-logs</h2>
            <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Donor</th>
                      <th className="px-4 py-3">Drop-off</th>
                      <th className="px-4 py-3">Planned items</th>
                      <th className="px-4 py-3">Quality</th>
                      <th className="px-4 py-3">Arrival</th>
                      <th className="px-4 py-3">Rate donor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          No pre-logs yet. Donors will appear here once they plan a donation.
                        </td>
                      </tr>
                    ) : (
                      pipelineRows.map((s) => (
                        <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">
                            {s.userId ? (
                              <Link to="/profile" className="hover:underline text-sky-700 dark:text-sky-400">
                                {s.userName ?? donorRef(s)}
                              </Link>
                            ) : donorRef(s)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{s.dropoffDate}</td>
                          <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground" title={itemsPreview(s)}>
                            {itemsPreview(s)}
                          </td>
                          <td className="px-4 py-3">{tierBadge(s.qualityTier)}</td>
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">{s.arrivalTime}</td>
                          <td className="px-4 py-3">
                            {s.userId ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={5}
                                  step={0.5}
                                  placeholder="1–5"
                                  value={ratingInputs[s.id] ?? ""}
                                  onChange={(e) => setRatingInputs((p) => ({ ...p, [s.id]: e.target.value }))}
                                  className="w-16 rounded-lg border border-border/60 bg-background px-2 py-1 text-xs tabular-nums"
                                />
                                <Button
                                  size="sm"
                                  disabled={!ratingInputs[s.id] || ratingLoading[s.id]}
                                  onClick={() => void submitRating(s.userId!, s.id)}
                                  className="h-7 rounded-full px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  {ratingLoading[s.id] ? "…" : "Rate"}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Guest</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section id="staffing" className="scroll-mt-40 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-sky-600 dark:text-sky-400" />
              <h2 className="text-lg font-semibold">Workforce prediction</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <StaffingRecommendationCard
                workers={staffTodayPm.workers}
                volumeLabel={staffTodayPm.label}
                shiftLabel="Today · afternoon dock"
                reasoning={formatStaffingReasoning({
                  donors: staffTodayPm.donorCount,
                  items: staffTodayPm.totalItems,
                  complexityNote: staffTodayPm.complexityNote,
                  workers: staffTodayPm.workers,
                  shift: "afternoon",
                })}
              />
              <StaffingRecommendationCard
                workers={staffTomorrowAm.workers}
                volumeLabel={staffTomorrowAm.label}
                shiftLabel="Tomorrow · morning open"
                reasoning={formatStaffingReasoning({
                  donors: staffTomorrowAm.donorCount,
                  items: staffTomorrowAm.totalItems,
                  complexityNote: staffTomorrowAm.complexityNote,
                  workers: staffTomorrowAm.workers,
                  shift: "morning",
                })}
              />
            </div>
          </section>

          <section id="quality" className="scroll-mt-40 space-y-3">
            <h2 className="text-lg font-semibold">Donation quality & resale readiness</h2>
            <QualityRiskCard
              resaleReadyPct={quality.resaleReadyPct}
              inspectionPct={quality.inspectionPct}
              topRisks={risks}
            />
          </section>

          <section id="demand" className="scroll-mt-40 space-y-4">
            <h2 className="text-lg font-semibold">Demand signals donors see</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Changes save to MongoDB instantly and update what donors see on the guidance page.
            </p>
            <div className="grid gap-4 xl:grid-cols-3">
              <DemandListEditor
                title="High need"
                description="Green “High Need” cards on the donor side."
                items={demand.highNeed}
                onChange={setHighNeed}
              />
              <DemandListEditor
                title="Low need"
                description="Amber “Low Need” — still accepted if excellent."
                items={demand.lowNeed}
                onChange={setLowNeed}
              />
              <DemandListEditor
                title="Not accepted"
                description="Red “Not accepted” to reduce costly diversions."
                items={demand.notAccepted}
                onChange={setNotAccepted}
              />
            </div>
          </section>

          <section id="pickups" className="scroll-mt-40 space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="size-5 text-sky-600 dark:text-sky-400" />
              <h2 className="text-lg font-semibold">Pickup requests</h2>
              {pendingPickups.length > 0 && (
                <Badge className="rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-200 border-transparent font-semibold">
                  {pendingPickups.length} pending
                </Badge>
              )}
            </div>
            {pickupRequests.length === 0 ? (
              <Card className="rounded-2xl border border-dashed border-border/60">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No pickup requests yet.
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3">Donor</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3">Address</th>
                        <th className="px-4 py-3">Date · Time</th>
                        <th className="px-4 py-3">Notes</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickupRequests.map((r) => (
                        <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-medium">{r.userName}</p>
                            <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-amber-600">{r.userRating.toFixed(1)} ★</td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{r.address}</td>
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">{r.preferredDate} · {r.preferredTime}</td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">{r.notes || "—"}</td>
                          <td className="px-4 py-3">
                            <Badge className={cn(
                              "rounded-full border-transparent font-semibold text-xs",
                              r.status === "pending" && "bg-amber-500/15 text-amber-950 dark:text-amber-50",
                              r.status === "accepted" && "bg-emerald-600/15 text-emerald-900 dark:text-emerald-50",
                              r.status === "rejected" && "bg-rose-600/15 text-rose-900 dark:text-rose-50",
                            )}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {r.status === "pending" && (
                              <div className="flex gap-2">
                                <Button size="sm" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 h-7 px-3 text-xs" onClick={() => void updatePickupStatus(r.id, "accepted")}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-full h-7 px-3 text-xs text-rose-700 border-rose-300 hover:bg-rose-50" onClick={() => void updatePickupStatus(r.id, "rejected")}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </section>

          <section id="snapshot" className="scroll-mt-40 space-y-3 pb-8">
            <h2 className="text-lg font-semibold">Daily operations snapshot</h2>
            <Card className="rounded-2xl border border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Signals & recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {topCategoryLabel && (
                  <>
                    <div>
                      <p className="font-medium">Incoming category spotlight</p>
                      <p className="mt-1 text-muted-foreground">
                        Largest planned lane: <span className="font-semibold text-foreground">{topCategoryLabel}</span>.
                      </p>
                    </div>
                    <Separator />
                  </>
                )}
                {subsCombined.length > 0 && (
                  <>
                    <div>
                      <p className="font-medium">Quality trend</p>
                      <p className="mt-1 text-muted-foreground">
                        {quality.resaleReadyPct >= 65
                          ? "Self-check signals are trending resale-ready."
                          : quality.resaleReadyPct === 0
                            ? "No quality data yet for today or tomorrow."
                            : "Mixed loads — consider an extra inspection lane."}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}
                <div>
                  <p className="font-medium">Playbook</p>
                  <ul className="mt-2 space-y-2 text-muted-foreground">
                    {recommendations.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-sky-600 dark:bg-sky-400" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>

        {/* Right rail */}
        <aside className="space-y-4 border-t border-border/60 bg-card/40 p-4 lg:border-t-0 lg:bg-transparent lg:p-5">
          <Card className="rounded-2xl border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-card shadow-sm ring-1 ring-sky-500/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Today at a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Items today: <span className="font-semibold text-foreground">{itemsToday}</span></p>
              <p>Items tomorrow: <span className="font-semibold text-foreground">{itemsTomorrow}</span></p>
              <p>Risk-weighted units: <span className="font-semibold text-foreground">{riskUnits}</span></p>
              {pendingPickups.length > 0 && (
                <p className="font-semibold text-rose-600">{pendingPickups.length} pickup{pendingPickups.length > 1 ? "s" : ""} awaiting action</p>
              )}
            </CardContent>
          </Card>

          <div>
            <p className="mb-2 px-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Pipeline summary
            </p>
            <div className="space-y-3">
              {railCards.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
                  No donors scheduled today or tomorrow yet.
                </p>
              ) : (
                railCards.map((s) => (
                  <Card
                    key={s.id}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-tight">{s.userName ?? donorRef(s)}</p>
                        {tierBadge(s.qualityTier)}
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{itemsPreview(s)}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[0.65rem] font-medium text-muted-foreground">
                          <span>Resale confidence</span>
                          <span>{tierProgress(s.qualityTier)}%</span>
                        </div>
                        <Progress value={tierProgress(s.qualityTier)} className="h-1.5" />
                      </div>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {s.dropoffDate} · {s.arrivalTime} · {s.locationLabel.split("·")[0]?.trim()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm">
            <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">All submissions</p>
              <p>Total in DB: {submissions.length}</p>
              <p>Today: {donorsToday} donors · {itemsToday} items</p>
              <p>Tomorrow: {donorsTomorrow} donors · {itemsTomorrow} items</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
