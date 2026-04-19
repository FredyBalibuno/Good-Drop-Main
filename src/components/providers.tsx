"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/context/auth-context";
import { DonationStoreProvider } from "@/context/donation-store";
import { DonationChatbot } from "@/components/dropiq/donation-chatbot";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <DonationStoreProvider>
          {children}
          <DonationChatbot />
        </DonationStoreProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
