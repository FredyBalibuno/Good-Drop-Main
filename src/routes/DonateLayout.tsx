import { Outlet } from "react-router-dom";
import { DonorStepper } from "@/components/dropiq/donor-stepper";

export default function DonateLayout() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 min-h-full bg-[url('/otherback.png')] bg-cover bg-center bg-no-repeat"
        aria-hidden
      />
      <div className="relative flex min-h-full flex-1 flex-col mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <DonorStepper />
        <Outlet />
      </div>
    </div>
  );
}
