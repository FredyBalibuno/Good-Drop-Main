import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DemandItem, DonationSubmission, PlannedLineItem } from "@/lib/types";
import { SEED_SUBMISSIONS, DEFAULT_HIGH_NEED, DEFAULT_LOW_NEED, DEFAULT_NOT_ACCEPTED } from "@/lib/mock-data";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type DemandState = {
  highNeed: DemandItem[];
  lowNeed: DemandItem[];
  notAccepted: DemandItem[];
};

type DonationDraft = {
  items: PlannedLineItem[];
  dropoffDate: string;
  arrivalTime: string;
  locationId: string;
  condition: string;
  donationType: "dropoff" | "pickup";
};

const emptyDraft = (): DonationDraft => ({
  items: [],
  dropoffDate: new Date().toISOString().slice(0, 10),
  arrivalTime: "14:00",
  locationId: "main",
  condition: "Good — lightly used",
  donationType: "dropoff",
});

const DEFAULT_DEMAND: DemandState = {
  highNeed: DEFAULT_HIGH_NEED,
  lowNeed: DEFAULT_LOW_NEED,
  notAccepted: DEFAULT_NOT_ACCEPTED,
};

type DonationStoreValue = {
  demand: DemandState;
  setHighNeed: (items: DemandItem[]) => void;
  setLowNeed: (items: DemandItem[]) => void;
  setNotAccepted: (items: DemandItem[]) => void;
  submissions: DonationSubmission[];
  addSubmission: (submission: DonationSubmission) => void;
  resetSubmissionsToDemo: () => void;
  draft: DonationDraft;
  setDraft: (patch: Partial<DonationDraft>) => void;
  resetDraft: () => void;
  lastSubmissionId: string | null;
  setLastSubmissionId: (id: string | null) => void;
  loading: boolean;
};

const DonationStoreContext = createContext<DonationStoreValue | null>(null);

export function DonationStoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [demand, setDemand] = useState<DemandState>(DEFAULT_DEMAND);
  const [submissions, setSubmissions] = useState<DonationSubmission[]>([]);
  const [draft, setDraftState] = useState<DonationDraft>(emptyDraft);
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const demandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initial load from DB ─────────────────────────────────────────
  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const [demandRes, subsRes] = await Promise.all([
          fetch(apiUrl("/api/demand")),
          fetch(apiUrl("/api/submissions")),
        ]);
        if (canceled) return;
        if (demandRes.ok) {
          const data = await demandRes.json() as DemandState;
          if (data.highNeed && data.lowNeed && data.notAccepted) setDemand(data);
        }
        if (subsRes.ok) {
          const data = await subsRes.json() as DonationSubmission[];
          if (Array.isArray(data)) setSubmissions(data);
        }
      } catch {
        /* API offline — keep defaults */
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void load();
    return () => { canceled = true; };
  }, []);

  // ── Persist demand to DB (debounced) ─────────────────────────────
  const persistDemand = useCallback((next: DemandState) => {
    if (demandTimer.current) clearTimeout(demandTimer.current);
    demandTimer.current = setTimeout(() => {
      void fetch(apiUrl("/api/demand"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => { /* offline */ });
    }, 800);
  }, []);

  const setHighNeed = useCallback((items: DemandItem[]) => {
    setDemand((d) => {
      const next = { ...d, highNeed: items };
      persistDemand(next);
      return next;
    });
  }, [persistDemand]);

  const setLowNeed = useCallback((items: DemandItem[]) => {
    setDemand((d) => {
      const next = { ...d, lowNeed: items };
      persistDemand(next);
      return next;
    });
  }, [persistDemand]);

  const setNotAccepted = useCallback((items: DemandItem[]) => {
    setDemand((d) => {
      const next = { ...d, notAccepted: items };
      persistDemand(next);
      return next;
    });
  }, [persistDemand]);

  // ── Add a single submission to DB ────────────────────────────────
  const addSubmission = useCallback((submission: DonationSubmission) => {
    const withUser: DonationSubmission = {
      ...submission,
      userId: user?.id ?? null,
      userName: user?.name ?? null,
    };
    setSubmissions((prev) => [withUser, ...prev]);
    setLastSubmissionId(withUser.id);
    void fetch(apiUrl("/api/submissions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withUser),
    }).catch(() => { /* offline */ });
    // auto-create pickup request in DB when donationType is pickup
    if (withUser.donationType === "pickup" && withUser.pickupDetails && user) {
      void fetch(apiUrl("/api/pickup-requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userRating: user.rating,
          submissionId: withUser.id,
          address: withUser.pickupDetails.address,
          preferredDate: withUser.pickupDetails.preferredDate,
          preferredTime: withUser.pickupDetails.preferredTime,
          notes: withUser.pickupDetails.notes,
        }),
      }).catch(() => { /* offline */ });
    }
  }, [user]);

  // ── Reset to demo data ───────────────────────────────────────────
  const resetSubmissionsToDemo = useCallback(() => {
    setSubmissions([...SEED_SUBMISSIONS]);
    // clear DB and re-seed
    void fetch(apiUrl("/api/submissions"), { method: "DELETE" })
      .then(() =>
        Promise.all(
          SEED_SUBMISSIONS.map((s) =>
            fetch(apiUrl("/api/submissions"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(s),
            }),
          ),
        ),
      )
      .catch(() => { /* offline */ });
  }, []);

  const setDraft = useCallback((patch: Partial<DonationDraft>) => {
    setDraftState((d) => ({ ...d, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraftState(emptyDraft());
  }, []);

  const value = useMemo(
    () => ({
      demand,
      setHighNeed,
      setLowNeed,
      setNotAccepted,
      submissions,
      addSubmission,
      resetSubmissionsToDemo,
      draft,
      setDraft,
      resetDraft,
      lastSubmissionId,
      setLastSubmissionId,
      loading,
    }),
    [
      demand,
      setHighNeed,
      setLowNeed,
      setNotAccepted,
      submissions,
      addSubmission,
      resetSubmissionsToDemo,
      draft,
      setDraft,
      resetDraft,
      lastSubmissionId,
      loading,
    ],
  );

  return (
    <DonationStoreContext.Provider value={value}>{children}</DonationStoreContext.Provider>
  );
}

export function useDonationStore() {
  const ctx = useContext(DonationStoreContext);
  if (!ctx) throw new Error("useDonationStore must be used within DonationStoreProvider");
  return ctx;
}
