import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/dropiq/site-header";
import { useStaffAuth } from "@/context/staff-auth-context";
import AdminDashboardPage from "@/routes/AdminDashboardPage";
import DonateLayout from "@/routes/DonateLayout";
import DonationConfirmPage from "@/routes/DonationConfirmPage";
import DonationGuidancePage from "@/routes/DonationGuidancePage";
import DonorProfilePage from "@/routes/DonorProfilePage";
import HomePage from "@/routes/HomePage";
import PlanDonationPage from "@/routes/PlanDonationPage";
import QualityRedirectPage from "@/routes/QualityRedirectPage";
import StaffLoginPage from "@/routes/StaffLoginPage";

function StaffGuard() {
  const { isStaff } = useStaffAuth();
  return isStaff ? <Outlet /> : <Navigate to="/staff/login" replace />;
}

function RootShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {/* Offset matches SiteHeader inner min-heights (fixed header is out of flow). */}
      <div className="flex min-h-screen flex-1 flex-col pt-[4.75rem] sm:pt-[5.35rem] md:pt-24">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <Routes>
          <Route element={<RootShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route element={<StaffGuard />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>
            <Route path="/profile" element={<DonorProfilePage />} />
            <Route path="/donate" element={<DonateLayout />}>
              <Route path="plan" element={<PlanDonationPage />} />
              <Route path="confirm" element={<DonationConfirmPage />} />
              <Route path="guidance" element={<DonationGuidancePage />} />
              <Route path="quality" element={<QualityRedirectPage />} />
            </Route>
          </Route>
        </Routes>
      </Providers>
    </BrowserRouter>
  );
}
