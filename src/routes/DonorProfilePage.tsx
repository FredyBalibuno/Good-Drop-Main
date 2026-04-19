import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { apiUrl } from "@/lib/api";
import type { DonationSubmission, UserProfile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Star, Truck, Package, CalendarClock } from "lucide-react";

type ProfileData = UserProfile & { submissions: DonationSubmission[] };

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rating >= n;
        const half = !full && rating >= n - 0.5;
        return (
          <span key={n} className="relative inline-flex size-5">
            {/* empty star base */}
            <Star className="size-5 text-muted-foreground/30" />
            {/* full or half fill on top */}
            {(full || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: full ? "100%" : "50%" }}
              >
                <Star className="size-5 fill-amber-400 text-amber-400" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function DonorProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/", { replace: true }); return; }
    fetch(apiUrl(`/api/users/${user.id}`))
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setProfile(data as ProfileData | null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground text-sm">
        Loading your profile…
      </div>
    );
  }

  const data: ProfileData = profile
    ? { ...profile, rating: Math.max(profile.rating, user.rating) }
    : { ...user, submissions: [] };
  const pickupUnlocked = data.rating >= 4.0;
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      {/* Profile header */}
      <div className="flex items-center gap-5">
        <img src={data.picture} alt={data.name} className="size-16 rounded-full ring-2 ring-border" referrerPolicy="no-referrer" />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <p className="text-sm text-muted-foreground">{data.email}</p>
          <div className="flex items-center gap-3 pt-1">
            {data.rating > 0 ? (
              <>
                <RatingStars rating={data.rating} />
                <span className="text-sm font-semibold">{data.rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No rating yet — complete a donation to get rated by staff.</span>
            )}
          </div>
        </div>
      </div>

      {/* Pickup unlock status */}
      <Card className={cn(
        "rounded-2xl border shadow-sm",
        pickupUnlocked
          ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-card"
          : "border-border/60 bg-muted/20",
      )}>
        <CardContent className="flex items-center gap-4 p-5">
          <Truck className={cn("size-8 shrink-0", pickupUnlocked ? "text-emerald-600" : "text-muted-foreground/40")} />
          <div>
            <p className="font-semibold">
              {pickupUnlocked ? "Home pickup unlocked 🎉" : "Home pickup not yet unlocked"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {pickupUnlocked
                ? "Your rating is 4.0 or above. When you log your next donation you can request a home pickup instead of dropping off."
                : `Reach a staff rating of 4.0 to unlock home pickup. Current rating: ${data.rating > 0 ? data.rating.toFixed(1) : "none yet"}.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Donation history */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Donation history</h2>
          <Link to="/donate/plan" className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full no-underline")}>
            Log new donation
          </Link>
        </div>

        {data.submissions.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border/60">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Package className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No donations logged yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.submissions.map((s) => (
              <Card key={s.id} className="rounded-2xl border border-border/60 bg-card shadow-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CalendarClock className="size-4 text-muted-foreground" />
                      {s.dropoffDate} · {s.arrivalTime}
                    </CardTitle>
                    <Badge
                      className={cn(
                        "rounded-full text-xs font-semibold border-transparent",
                        s.qualityTier === "good" && "bg-emerald-600/15 text-emerald-900 dark:text-emerald-50",
                        s.qualityTier === "mixed" && "bg-amber-500/15 text-amber-950 dark:text-amber-50",
                        s.qualityTier === "risky" && "bg-rose-600/15 text-rose-900 dark:text-rose-50",
                      )}
                    >
                      {s.qualityTier === "good" ? "Resale-ready" : s.qualityTier === "mixed" ? "Mixed" : "High risk"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4 text-sm text-muted-foreground">
                  <p>{s.locationLabel}</p>
                  <p className="mt-1">
                    {s.items.slice(0, 3).map((i) => `${i.category} (${i.quantity})`).join(" · ")}
                    {s.items.length > 3 && ` +${s.items.length - 3} more`}
                  </p>
                  {s.confirmationCode && (
                    <p className="mt-2 font-mono text-xs font-semibold tracking-widest text-foreground/60">
                      {s.confirmationCode}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
