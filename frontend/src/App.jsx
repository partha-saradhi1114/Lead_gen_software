import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { LeadGenProvider } from "@/lib/leadgen/store";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";

// Master Admin routes
import Dashboard from "./routes/index";
import LeadsReviewPage from "./routes/leads-review";
import LeadAllocationPage from "./routes/lead-allocation";
import CreditsPage from "./routes/credits";
import ResearchAnalystsPage from "./routes/research-analysts";
import TeamPage from "./routes/team";
import OperationsPage from "./routes/operations";
import ReportsPage from "./routes/reports";
import SettingsPage from "./routes/settings";

// Research Analyst (RA) routes
import RaDashboard from "./routes/ra.index";
import RaUploadPage from "./routes/ra.upload";
import MyUploads from "./routes/ra.uploads";
import ApprovalStatus from "./routes/ra.status";
import ApprovedLeads from "./routes/ra.approved";
import RejectedLeads from "./routes/ra.rejected";
import RaReportsPage from "./routes/ra.reports";

// Business Development Executive (BDE) routes
import BdeDashboard from "./routes/bde.index";
import BdeLeads from "./routes/bde.leads";
import BdeCredits from "./routes/bde.credits";
import BdeFollowUps from "./routes/bde.follow-ups";

// Login route
import LoginPage from "./routes/login";

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Standalone Login Page */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main Application with Sidebar & Header Shell */}
      <Route element={<AppLayout />}>
        {/* Master Admin */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads-review" element={<LeadsReviewPage />} />
        <Route path="/lead-allocation" element={<LeadAllocationPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/research-analysts" element={<ResearchAnalystsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Research Analyst (RA) */}
        <Route path="/ra" element={<RaDashboard />} />
        <Route path="/ra/upload" element={<RaUploadPage />} />
        <Route path="/ra/uploads" element={<MyUploads />} />
        <Route path="/ra/status" element={<ApprovalStatus />} />
        <Route path="/ra/approved" element={<ApprovedLeads />} />
        <Route path="/ra/rejected" element={<RejectedLeads />} />
        <Route path="/ra/reports" element={<RaReportsPage />} />

        {/* Business Development Executive (BDE) */}
        <Route path="/bde" element={<BdeDashboard />} />
        <Route path="/bde/leads" element={<BdeLeads />} />
        <Route path="/bde/credits" element={<BdeCredits />} />
        <Route path="/bde/follow-ups" element={<BdeFollowUps />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LeadGenProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </LeadGenProvider>
  );
}
