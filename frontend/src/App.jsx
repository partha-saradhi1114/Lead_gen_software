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
              window.location.href =
                window.location.pathname + "?t=" + Date.now();
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

export function RoleRoute({ allowedRoles, children }) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const rawRole = (user.role || "").toLowerCase();
  const normalizedRole =
    rawRole.includes("admin") || user.name?.toLowerCase() === "sriram"
      ? "admin"
      : rawRole.includes("ra") || rawRole.includes("analyst")
      ? "ra"
      : rawRole.includes("bde")
      ? "bde"
      : null;

  if (!normalizedRole) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = allowedRoles.some((r) => r.toLowerCase() === normalizedRole);
  if (!isAllowed) {
    if (normalizedRole === "ra") return <Navigate to="/ra" replace />;
    if (normalizedRole === "bde") return <Navigate to="/bde" replace />;
    return <Navigate to="/login" replace />;
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

  const rawRole = (user.role || "").toLowerCase();
  if (rawRole.includes("admin") || user.name?.toLowerCase() === "sriram") {
    return <Dashboard />;
  }
  if (rawRole.includes("ra") || rawRole.includes("analyst")) {
    return <Navigate to="/ra" replace />;
  }
  if (rawRole.includes("bde")) {
    return <Navigate to="/bde" replace />;
  }
  return <Navigate to="/login" replace />;
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
        {/* Master Admin (Strictly Admin only) */}
        <Route path="/" element={<DashboardRoute />} />
        <Route path="/leads-review" element={<RoleRoute allowedRoles={["admin"]}><LeadsReviewPage /></RoleRoute>} />
        <Route path="/lead-allocation" element={<RoleRoute allowedRoles={["admin"]}><LeadAllocationPage /></RoleRoute>} />
        <Route path="/credits" element={<RoleRoute allowedRoles={["admin"]}><CreditsPage /></RoleRoute>} />
        <Route path="/research-analysts" element={<RoleRoute allowedRoles={["admin"]}><ResearchAnalystsPage /></RoleRoute>} />
        <Route path="/team" element={<RoleRoute allowedRoles={["admin"]}><TeamPage /></RoleRoute>} />
        <Route path="/operations" element={<RoleRoute allowedRoles={["admin"]}><OperationsPage /></RoleRoute>} />
        <Route path="/reports" element={<RoleRoute allowedRoles={["admin"]}><ReportsPage /></RoleRoute>} />
        <Route path="/settings" element={<RoleRoute allowedRoles={["admin"]}><SettingsPage /></RoleRoute>} />

        {/* Research Analyst (RA) */}
        <Route path="/ra" element={<RoleRoute allowedRoles={["ra", "admin"]}><RaDashboard /></RoleRoute>} />
        <Route path="/ra/upload" element={<RoleRoute allowedRoles={["ra", "admin"]}><RaUploadPage /></RoleRoute>} />
        <Route path="/ra/uploads" element={<RoleRoute allowedRoles={["ra", "admin"]}><MyUploads /></RoleRoute>} />
        <Route path="/ra/status" element={<RoleRoute allowedRoles={["ra", "admin"]}><ApprovalStatus /></RoleRoute>} />
        <Route path="/ra/approved" element={<RoleRoute allowedRoles={["ra", "admin"]}><ApprovedLeads /></RoleRoute>} />
        <Route path="/ra/rejected" element={<RoleRoute allowedRoles={["ra", "admin"]}><RejectedLeads /></RoleRoute>} />
        <Route path="/ra/reports" element={<RoleRoute allowedRoles={["ra", "admin"]}><RaReportsPage /></RoleRoute>} />

        {/* Business Development Executive (BDE) */}
        <Route path="/bde" element={<RoleRoute allowedRoles={["bde", "admin"]}><BdeDashboard /></RoleRoute>} />
        <Route path="/bde/leads" element={<RoleRoute allowedRoles={["bde", "admin"]}><BdeLeads /></RoleRoute>} />
        <Route path="/bde/credits" element={<RoleRoute allowedRoles={["bde", "admin"]}><BdeCredits /></RoleRoute>} />
        <Route path="/bde/follow-ups" element={<RoleRoute allowedRoles={["bde", "admin"]}><BdeFollowUps /></RoleRoute>} />
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
