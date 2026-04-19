"use client";

import { Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/auth-context";
import { useStaffAuth } from "@/context/staff-auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/donate/plan", label: "Donor", match: (p: string) => p.startsWith("/donate") },
  { href: "/admin", label: "Staff", match: (p: string) => p.startsWith("/admin") },
] as const;

export function SiteHeader() {
  const { pathname } = useLocation();
  const { user, signIn, signOut } = useAuth();
  const { isStaff, signOut: staffSignOut } = useStaffAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[4.75rem] max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:min-h-[5.35rem] sm:gap-5 sm:px-6 md:min-h-24 md:gap-6">
        <Link
          to="/"
          className="relative flex h-14 w-[min(100vw-8rem,18.5rem)] shrink-0 items-center sm:h-16 sm:w-[22rem] md:h-[5.25rem] md:w-[27rem] lg:h-24 lg:w-[32rem]"
        >
          <img
            src="/gooddroplogo.png"
            alt="GoodDrop"
            className="absolute inset-0 h-full w-full object-contain object-left"
            width={512}
            height={128}
            fetchPriority="high"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {nav.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "inline-flex min-h-14 items-center justify-center px-3 text-sm font-semibold tracking-tight transition-colors sm:min-h-16 sm:px-4 sm:text-base md:min-h-[5.25rem] md:px-5 md:text-lg",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isStaff && (
            <Button variant="outline" size="sm" onClick={staffSignOut} className="rounded-full text-xs">
              Staff sign out
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
                <img src={user.picture} alt={user.name} className="size-6 rounded-full" referrerPolicy="no-referrer" />
                <span className="hidden sm:inline max-w-[8rem] truncate">{user.name.split(" ")[0]}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-xs text-muted-foreground">
                Sign out
              </Button>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={(res) => { if (res.credential) void signIn(res.credential); }}
              onError={() => console.error("Google sign-in failed")}
              shape="pill"
              size="medium"
              text="signin_with"
            />
          )}
        </div>
      </div>
    </header>
  );
}
