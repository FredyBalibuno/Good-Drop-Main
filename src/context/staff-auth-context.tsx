import { createContext, useCallback, useContext, useMemo, useState } from "react";

const STAFF_EMAIL = "admin@goodwill.com";
const STAFF_PASSWORD = "admin123!";
const STORAGE_KEY = "gooddrop-staff";

type StaffAuthState = {
  isStaff: boolean;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
};

const StaffAuthContext = createContext<StaffAuthState | null>(null);

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [isStaff, setIsStaff] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");

  const signIn = useCallback((email: string, password: string) => {
    if (email === STAFF_EMAIL && password === STAFF_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setIsStaff(true);
      return true;
    }
    return false;
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsStaff(false);
  }, []);

  const value = useMemo(() => ({ isStaff, signIn, signOut }), [isStaff, signIn, signOut]);

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error("useStaffAuth must be used within StaffAuthProvider");
  return ctx;
}
