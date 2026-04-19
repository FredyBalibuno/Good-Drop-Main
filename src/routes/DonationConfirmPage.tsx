import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useDonationStore } from "@/context/donation-store";
import { useAuth } from "@/context/auth-context";
import { DonationSummaryCard } from "@/components/dropiq/donation-summary-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartyPopper, Truck } from "lucide-react";

export default function DonationConfirmPage() {
  const navigate = useNavigate();
  const { submissions, lastSubmissionId } = useDonationStore();
  const { user } = useAuth();

  const submission = useMemo(
    () => submissions.find((s) => s.id === lastSubmissionId) ?? submissions[0] ?? null,
    [submissions, lastSubmissionId],
  );

  useEffect(() => {
    if (!submission) navigate("/donate/plan", { replace: true });
  }, [submission, navigate]);

  if (!submission) return null;

  const isPickup = submission.donationType === "pickup";

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-md sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit rounded-full font-semibold">
            {isPickup ? "Pickup requested" : "Drop-off logged"}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {isPickup ? "Pickup request submitted!" : "Thank you — your advance notice matters."}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-foreground/90">
            {isPickup
              ? "Your pickup request has been sent to staff. They will review and confirm a time with you shortly."
              : "Your pre-log helps the dock schedule enough hands, stage high-need categories, and spend more time serving shoppers instead of triaging surprises."}
          </p>
        </div>
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/35 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100">
          {isPickup ? <Truck className="size-7" aria-hidden /> : <PartyPopper className="size-7" aria-hidden />}
        </span>
      </div>

      {isPickup && submission.pickupDetails ? (
        <Card className="rounded-2xl border border-emerald-600/35 bg-card shadow-md ring-1 ring-black/5 dark:ring-white/10">
          <CardContent className="space-y-3 p-6">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">Pickup details</p>
            <div className="grid gap-2 text-sm text-foreground/90 sm:grid-cols-2">
              <p><span className="font-semibold text-foreground">Address:</span> {submission.pickupDetails.address}</p>
              <p><span className="font-semibold text-foreground">Date:</span> {submission.pickupDetails.preferredDate}</p>
              <p><span className="font-semibold text-foreground">Time:</span> {submission.pickupDetails.preferredTime}</p>
              {submission.pickupDetails.notes && (
                <p><span className="font-semibold text-foreground">Notes:</span> {submission.pickupDetails.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <DonationSummaryCard
          items={submission.items}
          dropoffDate={submission.dropoffDate}
          arrivalTime={submission.arrivalTime}
          locationLabel={submission.locationLabel}
          condition={submission.condition}
        />
      )}

      <Card className="border border-border bg-card shadow-md ring-1 ring-black/5 dark:ring-white/10">
        <CardContent className="space-y-3 p-6">
          <p className="text-sm font-semibold text-primary">How this helps operations</p>
          <p className="text-sm leading-relaxed text-foreground/90">
            Staff now sees your categories in the incoming pipeline, can align sorting labor with
            expected volume, and can message donors when certain aisles are full.
          </p>
          {!user && (
            <p className="text-xs leading-relaxed text-foreground/80">
              Sign in with Google to track your donations, earn a rating, and unlock home pickup.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-card p-4 text-sm shadow-md ring-1 ring-black/5 dark:ring-white/10">
        <p className="font-medium text-foreground">Assistant summary</p>
        <p className="mt-1 text-foreground/90">{submission.qualityMessage}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "rounded-full no-underline")}>
          Back to home
        </Link>
        <Link to="/admin" className={cn(buttonVariants(), "rounded-full no-underline")}>
          See how staff views this
        </Link>
        <Link to="/donate/plan" className={cn(buttonVariants({ variant: "secondary" }), "rounded-full no-underline")}>
          Plan another donation
        </Link>
      </div>
    </div>
  );
}
