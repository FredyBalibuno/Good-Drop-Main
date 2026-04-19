"use client";

import { useState } from "react";
import { IntakeBigChoice } from "@/components/intake/intake-big-choice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryModulePayload } from "@/components/intake/modules/types";
import type { IntakeCategoryId } from "@/lib/intake-flow/types";

const CAT: IntakeCategoryId = "vehicles";

const CONTEXT =
  "Vehicle donations are handled through a separate program at gwcars.org. You must have a title or proof of ownership. We accept cars, trucks, motorcycles, RVs, and boats on trailers.";

export function VehiclesModule({ onComplete }: { onComplete: (p: CategoryModulePayload) => void }) {
  const [step, setStep] = useState(0);
  const [vehicleType, setVehicleType] = useState("");

  if (step === 0) {
    return (
      <Card className="border-amber-500/25 bg-amber-500/5">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm leading-relaxed">{CONTEXT}</p>
          <Button className="rounded-full" onClick={() => setStep(1)}>
            Start vehicle questions
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold">L1. What type of vehicle are you donating?</Label>
        <Select value={vehicleType} onValueChange={(v) => v && setVehicleType(v)}>
          <SelectTrigger className="h-12 rounded-xl text-base">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="car_truck">Car or truck</SelectItem>
            <SelectItem value="motorcycle">Motorcycle</SelectItem>
            <SelectItem value="rv">RV or camper</SelectItem>
            <SelectItem value="boat">Boat on trailer</SelectItem>
            <SelectItem value="mower">Lawnmower</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button className="rounded-full" disabled={!vehicleType} onClick={() => setStep(2)}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <IntakeBigChoice
        question="L2. Do you have the title or legal proof of ownership for this vehicle?"
        yesEmoji="📄"
        noEmoji="❌"
        yesLabel="Yes — I have title/proof"
        noLabel="No — not yet"
        onPick={(yes) => {
          if (yes) {
            setStep(3);
          } else {
            onComplete({
              blocks: [
                {
                  id: "vehicle-no-title",
                  categoryId: CAT,
                  message:
                    "A title or proof of ownership is legally required. You cannot proceed with vehicle donation until you obtain it from the DMV.",
                },
              ],
              recycling: [],
              retailNotes: [vehicleType],
            });
          }
        }}
      />
    );
  }

  if (step === 3) {
    return (
      <IntakeBigChoice
        question="L3. Are you aware vehicle donations go through Goodwill’s separate vehicle program (not the store dock)?"
        hint="866-492-2770 · gwcars.org"
        yesEmoji="🚗"
        noEmoji="❓"
        yesLabel="Yes — I’ll use the vehicle program"
        noLabel="I didn’t know"
        onPick={() => {
          onComplete({
            blocks: [],
            recycling: [],
            retailNotes: [
              `Vehicle type: ${vehicleType}. Donor directed to vehicle program: 866-492-2770, gwcars.org — not a dock unload.`,
            ],
          });
        }}
      />
    );
  }

  return null;
}
