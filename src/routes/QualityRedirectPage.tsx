import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Quality is now captured per item on the plan screen; keep route for old links. */
export default function QualityRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/donate/plan", { replace: true });
  }, [navigate]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <p className="text-sm text-muted-foreground">Redirecting to the combined list + quality flow…</p>
      <Link to="/donate/plan" className={cn(buttonVariants(), "no-underline")}>
        Go to plan your drop-off
      </Link>
    </div>
  );
}
