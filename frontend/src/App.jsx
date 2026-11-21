import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
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

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <h2 className="text-xl font-bold text-foreground">
            Something went wrong
          </h2>
          <p className="mt-2 max-w-md text-xs text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = window.location.pathname + "?t=" + Date.now();
            }}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
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

export function ProtectedRoute({ children }) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function DashboardRoute() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  if (user.role === "ra") {
    return <Navigate to="/ra" replace />;
  }
  if (user.role === "bde") {
    return <Navigate to="/bde" replace />;
  }
  return <Dashboard />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Standalone Login Page */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main Application with Sidebar & Header Shell (Protected) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Master Admin */}
        <Route path="/" element={<DashboardRoute />} />
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
    <ErrorBoundary>
      <BrowserRouter>
        <LeadGenProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </LeadGenProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
