"use client";

import { Link, useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { useDonationStore } from "@/context/donation-store";
import { useAuth } from "@/context/auth-context";
import { INTAKE_CATEGORIES } from "@/lib/intake-flow/categories";
import { GOODWILL_GW_LOCATIONS, getGwLocationLabel } from "@/lib/intake-flow/gw-locations";
import { PROHIBITED_QUESTIONS } from "@/lib/intake-flow/prohibited-questions";
import { buildSubmissionFromIntake } from "@/lib/intake-flow/submission-from-intake";
import type { ConditionNote, HardBlock, IntakeCategoryId } from "@/lib/intake-flow/types";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { AccessoriesModule } from "@/components/intake/modules/accessories-module";
import { ArtModule } from "@/components/intake/modules/art-module";
import { BooksMediaModule } from "@/components/intake/modules/books-media-module";
import { ClothingModule } from "@/components/intake/modules/clothing-module";
import { ComputersModule } from "@/components/intake/modules/computers-module";
import { ElectronicsModule } from "@/components/intake/modules/electronics-module";
import { FurnitureModule } from "@/components/intake/modules/furniture-module";
import { HousewaresModule } from "@/components/intake/modules/housewares-module";
import { LinensModule } from "@/components/intake/modules/linens-module";
import { SportsModule } from "@/components/intake/modules/sports-module";
import { ToysModule } from "@/components/intake/modules/toys-module";
import { VehiclesModule } from "@/components/intake/modules/vehicles-module";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronLeft, Truck, MapPin } from "lucide-react";

const TIME_WINDOWS = [
  { id: "morning", label: "Morning (9–11)", time: "10:00" },
  { id: "midday", label: "Midday (11–1)", time: "12:00" },
  { id: "afternoon", label: "Afternoon (1–4)", time: "14:30" },
  { id: "late", label: "Late afternoon (4–6)", time: "17:00" },
] as const;

// sections: "type" | 0 | 1 | 2 | 3 | 4 | 5 | "pickup-details"
type WizardSection = "type" | 0 | 1 | 2 | 3 | 4 | 5 | "pickup-details";

function sortSelected(selected: IntakeCategoryId[]): IntakeCategoryId[] {
  const order = INTAKE_CATEGORIES.map((c) => c.id);
  return order.filter((id) => selected.includes(id));
}

export function IntakeWizard() {
  const navigate = useNavigate();
  const { addSubmission, setDraft } = useDonationStore();
  const { user } = useAuth();

  const canPickup = user && user.rating >= 4.0;

  // Start at "type" chooser if pickup is unlocked, else skip straight to section 0
  const [section, setSection] = useState<WizardSection>(canPickup ? "type" : 0);
  const [donationType, setDonationType] = useState<"dropoff" | "pickup">("dropoff");

  // Donor info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gwLocationId, setGwLocationId] = useState("");
  const [dropoffDate, setDropoffDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dropoffWindow, setDropoffWindow] = useState<(typeof TIME_WINDOWS)[number]["id"] | "">("");

  // Pickup details
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pickupTime, setPickupTime] = useState<(typeof TIME_WINDOWS)[number]["id"] | "">("");
  const [pickupNotes, setPickupNotes] = useState("");

  // Categories & screening
  const [selected, setSelected] = useState<IntakeCategoryId[]>([]);
  const [catIndex, setCatIndex] = useState(0);
  const [recycling, setRecycling] = useState<ConditionNote[]>([]);
  const [blocks, setBlocks] = useState<HardBlock[]>([]);
  const [prohibitedIdx, setProhibitedIdx] = useState(0);
  const [bagBand, setBagBand] = useState("");
  const [donorNotes, setDonorNotes] = useState("");

  const orderedCats = useMemo(() => sortSelected(selected), [selected]);
  const currentCat = orderedCats[catIndex] ?? null;
  const locationLabel = gwLocationId ? getGwLocationLabel(gwLocationId) : "";
  const selectedWindow = TIME_WINDOWS.find((w) => w.id === dropoffWindow);
  const arrivalTime = selectedWindow?.label ?? "";
  const arrivalHour = selectedWindow ? Number(selectedWindow.time.split(":")[0]) : 14;

  const section0Valid = donationType === "pickup"
    ? Boolean(fullName.trim() && email.includes("@")) && dropoffDate
    : Boolean(fullName.trim() && email.includes("@")) && gwLocationId && dropoffDate && dropoffWindow;

  const pickupDetailsValid = pickupAddress.trim() && pickupDate && pickupTime;

  const toggleCategory = useCallback((id: IntakeCategoryId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const mergeModulePayload = useCallback((p: CategoryModulePayload) => {
    setRecycling((r) => [...r, ...p.recycling]);
    setBlocks((b) => [...b, ...p.blocks]);
  }, []);

  const advanceCategory = useCallback(
    (p: CategoryModulePayload) => {
      mergeModulePayload(p);
      setCatIndex((i) => {
        const next = i + 1;
        if (next >= orderedCats.length) { setSection(3); return orderedCats.length; }
        return next;
      });
    },
    [mergeModulePayload, orderedCats.length],
  );

  const onProhibitedPick = useCallback(
    (yes: boolean) => {
      const q = PROHIBITED_QUESTIONS[prohibitedIdx];
      if (yes) {
        setBlocks((b) => [...b, { id: `prohibited-${q.id}`, message: q.blockMessage, alternatives: q.alternatives }]);
      }
      if (prohibitedIdx >= PROHIBITED_QUESTIONS.length - 1) {
        setSection(4);
      } else {
        setProhibitedIdx((i) => i + 1);
      }
    },
    [prohibitedIdx],
  );

  const handleSubmit = useCallback(() => {
    if (!section0Valid || !bagBand) return;
    const pickupWindowLabel = TIME_WINDOWS.find((w) => w.id === pickupTime)?.label ?? pickupTime;
    const submission = buildSubmissionFromIntake({
      selectedCategories: orderedCats,
      dropoffDate,
      arrivalTime: donationType === "pickup" ? pickupWindowLabel : arrivalTime,
      arrivalHour: donationType === "pickup"
        ? Number(TIME_WINDOWS.find((w) => w.id === pickupTime)?.time.split(":")[0] ?? 14)
        : arrivalHour,
      locationId: donationType === "pickup" ? "pickup" : gwLocationId,
      locationLabel: donationType === "pickup" ? "Home pickup" : locationLabel,
      condition: "Goodwill of Greater Washington — donation profile",
      recycling,
      blocks,
      donorNotes: donorNotes.trim(),
      bagBand,
      donationType,
      pickupDetails: donationType === "pickup" ? {
        address: pickupAddress,
        preferredDate: pickupDate,
        preferredTime: pickupWindowLabel,
        notes: pickupNotes,
      } : null,
    });
    const contactBits = [
      fullName.trim() ? `Donor: ${fullName.trim()}` : null,
      email.trim() ? `Email: ${email.trim()}` : null,
      phone.trim() ? `Phone: ${phone.trim()}` : null,
    ].filter(Boolean);
    if (contactBits.length) {
      submission.condition = `${contactBits.join(" · ")} · ${submission.condition}`;
    }
    addSubmission(submission);
    setDraft({
      items: submission.items,
      dropoffDate,
      arrivalTime: submission.arrivalTime,
      locationId: submission.locationId,
      condition: submission.condition,
      donationType,
    });
    navigate("/donate/confirm");
  }, [
    section0Valid, bagBand, orderedCats, dropoffDate, arrivalTime, arrivalHour,
    gwLocationId, locationLabel, recycling, blocks, donorNotes, donationType,
    pickupAddress, pickupDate, pickupTime, pickupNotes, fullName, email, phone,
    addSubmission, setDraft, navigate,
  ]);

  const sectionTitle = () => {
    if (section === "type") return "How would you like to donate?";
    if (section === 0) return donationType === "pickup" ? "Your details & pickup date" : "Donor identification";
    if (section === 1) return "What are you bringing?";
    if (section === 2 && currentCat) return INTAKE_CATEGORIES.find((c) => c.id === currentCat)?.label ?? "";
    if (section === 3) return "Prohibited items";
    if (section === 4) return "How to pack (routing)";
    if (section === 5) return "Almost done";
    if (section === "pickup-details") return "Pickup details";
    return "";
  };

  return (
    <div className="mx-auto w-full max-w-3xl shrink-0 space-y-8 pb-16">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.75),0_2px_24px_rgba(0,0,0,0.45)] sm:text-4xl">
            Plan your donation
          </h1>
        </div>
        <Link
          to="/donate/guidance"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "inline-flex shrink-0 items-center gap-1 rounded-full border border-white/40 bg-white/15 font-semibold text-white shadow-md hover:bg-white/25 hover:text-white",
          )}
        >
          <ChevronLeft className="size-4" />
          Needs list
        </Link>
      </div>

      <Card className="shrink-0 border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base font-semibold">{sectionTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">

          {/* ── Type chooser ── */}
          {section === "type" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your rating of <span className="font-semibold text-amber-600">{user?.rating.toFixed(1)} ★</span> unlocks free home pickup. How would you like to donate?
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => { setDonationType("dropoff"); setSection(0); }}
                  className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border/80 bg-card p-6 text-center transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <MapPin className="size-10 text-sky-600" />
                  <p className="font-semibold">Drop off</p>
                  <p className="text-xs text-muted-foreground">Bring your items to a Goodwill location at your chosen time.</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setDonationType("pickup"); setSection(0); }}
                  className="flex flex-col items-center gap-3 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-6 text-center transition-all hover:border-emerald-500/70 hover:shadow-md"
                >
                  <Truck className="size-10 text-emerald-600" />
                  <p className="font-semibold text-emerald-900 dark:text-emerald-100">Home pickup</p>
                  <p className="text-xs text-muted-foreground">We come to you — available because of your donation history.</p>
                </button>
              </div>
            </div>
          )}

          {/* ── Section 0 — Donor info ── */}
          {section === 0 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nm">Full name</Label>
                  <Input id="nm" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="em">Email address</Label>
                  <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph">Phone number (optional)</Label>
                  <Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="space-y-4 border-t border-border/60 pt-6">
                {donationType === "dropoff" && (
                  <div className="space-y-2">
                    <Label>Which Goodwill location are you dropping off at?</Label>
                    <Select value={gwLocationId} onValueChange={(v) => v && setGwLocationId(v)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Choose a GW location" />
                      </SelectTrigger>
                      <SelectContent>
                        {GOODWILL_GW_LOCATIONS.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className={cn("grid gap-4", donationType === "dropoff" && "sm:grid-cols-2")}>
                  <div className="space-y-2">
                    <Label htmlFor="dt">{donationType === "pickup" ? "Preferred pickup date" : "Planned drop-off date"}</Label>
                    <Input id="dt" type="date" value={dropoffDate} onChange={(e) => setDropoffDate(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  {donationType === "dropoff" && (
                    <div className="space-y-2">
                      <Label>Time window</Label>
                      <Select value={dropoffWindow} onValueChange={(v) => v && setDropoffWindow(v as (typeof TIME_WINDOWS)[number]["id"])}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Pick a window" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_WINDOWS.map((w) => (
                            <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button className="rounded-full" disabled={!section0Valid} onClick={() => setSection(1)}>
                  Continue to categories
                </Button>
              </div>
            </div>
          )}

          {/* ── Section 1 — Categories ── */}
          {section === 1 && (
            <div className="space-y-6">
              <p className="text-sm font-medium text-foreground">
                Which categories best describe what you're donating?{" "}
                <span className="text-muted-foreground">Select all that apply.</span>
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {INTAKE_CATEGORIES.map((c) => {
                  const on = selected.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center transition-all",
                        on ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/20" : "border-border/80 bg-card hover:border-primary/30 hover:shadow-sm",
                      )}
                    >
                      <span className="text-4xl leading-none sm:text-5xl" aria-hidden>{c.emoji}</span>
                      <span className="text-xs font-semibold leading-snug sm:text-sm">{c.label}</span>
                    </button>
                  );
                })}
              </div>
              <Button className="rounded-full" disabled={selected.length === 0} onClick={() => { setCatIndex(0); setSection(2); }}>
                Continue ({selected.length} selected)
              </Button>
            </div>
          )}

          {/* ── Section 2 — Category modules ── */}
          {section === 2 && currentCat && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Category {catIndex + 1} of {orderedCats.length}</p>
              {currentCat === "clothing" && <ClothingModule onComplete={advanceCategory} />}
              {currentCat === "accessories" && <AccessoriesModule onComplete={advanceCategory} />}
              {currentCat === "linens" && <LinensModule onComplete={advanceCategory} />}
              {currentCat === "housewares" && <HousewaresModule onComplete={advanceCategory} />}
              {currentCat === "electronics" && <ElectronicsModule onComplete={advanceCategory} />}
              {currentCat === "art" && <ArtModule onComplete={advanceCategory} />}
              {currentCat === "furniture" && <FurnitureModule onComplete={advanceCategory} />}
              {currentCat === "books_media" && <BooksMediaModule onComplete={advanceCategory} />}
              {currentCat === "computers" && <ComputersModule onComplete={advanceCategory} />}
              {currentCat === "sports" && <SportsModule onComplete={advanceCategory} />}
              {currentCat === "toys" && <ToysModule onComplete={advanceCategory} />}
              {currentCat === "vehicles" && <VehiclesModule onComplete={advanceCategory} />}
            </div>
          )}

          {/* ── Section 3 — Prohibited ── */}
          {section === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">
                Please confirm you are not bringing any of the following items.
              </p>
              <IntakeBigChoice
                question={PROHIBITED_QUESTIONS[prohibitedIdx]?.prompt ?? ""}
                hint={`Question ${prohibitedIdx + 1} of ${PROHIBITED_QUESTIONS.length}`}
                yesEmoji="⚠️"
                noEmoji="✅"
                yesLabel="Yes — I'm bringing some"
                noLabel="No — not bringing these"
                onPick={onProhibitedPick}
              />
            </div>
          )}

          {/* ── Section 4 — Packing routing ── */}
          {section === 4 && (
            <div className="space-y-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Retail pipeline:</strong> good condition — bag by category; label each bag.</p>
                <p><strong className="text-foreground">Recycling / salvage:</strong> damaged but has material value — separate bags labeled <strong className="text-foreground">RECYCLING</strong>.</p>
                <p><strong className="text-foreground">Cannot accept:</strong> hard prohibited categories — leave at home.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-emerald-500/25 bg-emerald-500/5">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-emerald-900 dark:text-emerald-50">Retail pipeline</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="list-disc space-y-1 pl-4">
                      {orderedCats.map((id) => <li key={id}>{INTAKE_CATEGORIES.find((c) => c.id === id)?.label}</li>)}
                      {orderedCats.length === 0 && <li>See recycling / blocks for adjustments</li>}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-amber-500/25 bg-amber-500/5">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-amber-950 dark:text-amber-50">Recycling / salvage</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {recycling.length ? <ul className="list-disc space-y-1 pl-4">{recycling.map((r) => <li key={r.id}>{r.message}</li>)}</ul> : <p>No recycling tags.</p>}
                  </CardContent>
                </Card>
                <Card className="border-rose-500/25 bg-rose-500/5">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-rose-900 dark:text-rose-50">Do not bring</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {blocks.length ? <ul className="list-disc space-y-1 pl-4">{blocks.map((b) => <li key={b.id}>{b.message}{b.alternatives && <span className="block text-xs text-foreground/80">{b.alternatives}</span>}</li>)}</ul> : <p>No hard blocks.</p>}
                  </CardContent>
                </Card>
              </div>
              <Button className="rounded-full" onClick={() => setSection(donationType === "pickup" ? "pickup-details" : 5)}>
                Continue
              </Button>
            </div>
          )}

          {/* ── Pickup details step ── */}
          {section === "pickup-details" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-500/8 px-4 py-3">
                <Truck className="size-5 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-900 dark:text-emerald-100">We'll come to you. Fill in your pickup details below.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pu-addr">Pickup address</Label>
                <Input id="pu-addr" placeholder="123 Main St, City, State" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pu-date">Preferred date</Label>
                  <Input id="pu-date" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Preferred time window</Label>
                  <Select value={pickupTime} onValueChange={(v) => v && setPickupTime(v as (typeof TIME_WINDOWS)[number]["id"])}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Pick a window" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_WINDOWS.map((w) => <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pu-notes">Notes (optional)</Label>
                <Input id="pu-notes" placeholder="Gate code, parking info, heavy items, etc." value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <Button className="rounded-full" disabled={!pickupDetailsValid} onClick={() => setSection(5)}>
                Continue
              </Button>
            </div>
          )}

          {/* ── Section 5 — Final ── */}
          {section === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Roughly how many bags or boxes are you {donationType === "pickup" ? "putting out for pickup" : "bringing"} in total?</Label>
                <Select value={bagBand} onValueChange={(v) => v && setBagBand(v)}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select volume" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 bag">1 bag</SelectItem>
                    <SelectItem value="2–3 bags">2 – 3 bags</SelectItem>
                    <SelectItem value="4–5 bags">4 – 5 bags</SelectItem>
                    <SelectItem value="6–10 bags">6 – 10 bags</SelectItem>
                    <SelectItem value="More than 10">More than 10</SelectItem>
                    <SelectItem value="Truckload">Truckload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Anything else we should know? (optional)</Label>
                <Input id="notes" value={donorNotes} onChange={(e) => setDonorNotes(e.target.value)} placeholder="e.g., large bookshelf needs two people" className="h-11 rounded-xl" />
              </div>
              <Button className="h-12 rounded-full px-8 text-base font-semibold" disabled={!bagBand} onClick={handleSubmit}>
                Submit donation profile
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
