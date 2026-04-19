import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { googleLogout } from "@react-oauth/google";
import type { UserProfile } from "@/lib/types";
import { apiUrl } from "@/lib/api";

type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  signIn: (credential: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "gooddrop-user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    async function hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const cached = JSON.parse(raw) as UserProfile;
        if (!canceled) setUser(cached);
        const res = await fetch(apiUrl(`/api/users/${cached.id}`));
        if (!res.ok || canceled) return;
        const fresh = await res.json() as UserProfile & { submissions: unknown[] };
        const updated: UserProfile = {
          id: fresh.id,
          email: fresh.email,
          name: fresh.name,
          picture: fresh.picture,
          rating: fresh.rating,
          pickupUnlocked: fresh.rating >= 4.0,
          createdAt: fresh.createdAt,
        };
        if (!canceled) {
          setUser(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      } catch { /* offline — use cached */ }
      finally { if (!canceled) setLoading(false); }
    }
    void hydrate();
    return () => { canceled = true; };
  }, []);

  const signIn = useCallback(async (credential: string) => {
    const res = await fetch(apiUrl("/api/auth/google"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) throw new Error("Sign-in failed");
    const profile = await res.json() as UserProfile;
    // re-fetch to get latest rating/pickupUnlocked in case they were updated since last sign-in
    const fresh = await fetch(apiUrl(`/api/users/${profile.id}`)).then((r) => r.ok ? r.json() : null).catch(() => null) as (UserProfile & { submissions: unknown[] }) | null;
    const updated: UserProfile = fresh ? {
      id: fresh.id,
      email: fresh.email,
      name: fresh.name,
      picture: fresh.picture,
      rating: fresh.rating,
      pickupUnlocked: fresh.pickupUnlocked,
      createdAt: fresh.createdAt,
    } : profile;
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const signOut = useCallback(() => {
    googleLogout();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
