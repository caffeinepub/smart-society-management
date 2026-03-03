import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Layout from "./components/Layout";
import AmcTracker from "./pages/AmcTracker";
import Analytics from "./pages/Analytics";
import AuthPage from "./pages/AuthPage";
import Billing from "./pages/Billing";
import Communication from "./pages/Communication";
import Dashboard from "./pages/Dashboard";
import Directory from "./pages/Directory";
import Expenses from "./pages/Expenses";
import LandingPage from "./pages/LandingPage";
import PnL from "./pages/PnL";
import Properties from "./pages/Properties";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import StaffManagement from "./pages/StaffManagement";
import VehicleRegistration from "./pages/VehicleRegistration";
import { AuthProvider, useAuth } from "./store/AuthContext";
import { SocietyStoreProvider } from "./store/societyStore";
import type { AppRole } from "./store/societyStore";

type AuthMode = "landing" | "signin" | "signup" | "app";

function AppInner() {
  const { isAuthenticated, currentUser, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>(
    isAuthenticated ? "app" : "landing",
  );
  const [currentPage, setCurrentPage] = useState("dashboard");
  // SuperAdmin society switcher: null = global view, number = scoped to a society
  const [viewAsSocietyId, setViewAsSocietyId] = useState<number | null>(null);

  // The effective societyId used for ALL data queries
  const effectiveSocietyId: number | null =
    currentUser?.role === "SuperAdmin"
      ? viewAsSocietyId // null = global, number = scoped
      : (currentUser?.societyId ?? null);

  const handleSignOut = () => {
    signOut();
    setAuthMode("landing");
    setCurrentPage("dashboard");
    setViewAsSocietyId(null);
  };

  const handleAuthSuccess = (_role: AppRole) => {
    setAuthMode("app");
    setCurrentPage("dashboard");
  };

  // If already authenticated, always show the app shell
  if (isAuthenticated && authMode !== "app") {
    return (
      <AppShell
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onSignOut={handleSignOut}
        effectiveSocietyId={effectiveSocietyId}
        viewAsSocietyId={viewAsSocietyId}
        onViewAsSocietyChange={setViewAsSocietyId}
      />
    );
  }

  if (authMode === "landing") {
    return (
      <>
        <LandingPage
          onSignIn={() => setAuthMode("signin")}
          onSignUp={() => setAuthMode("signup")}
        />
        <Toaster />
      </>
    );
  }

  if (authMode === "signin" || authMode === "signup") {
    return (
      <>
        <AuthPage
          defaultTab={authMode === "signup" ? "signup" : "signin"}
          onAuthSuccess={handleAuthSuccess}
          onBack={() => setAuthMode("landing")}
        />
        <Toaster />
      </>
    );
  }

  return (
    <AppShell
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      onSignOut={handleSignOut}
      effectiveSocietyId={effectiveSocietyId}
      viewAsSocietyId={viewAsSocietyId}
      onViewAsSocietyChange={setViewAsSocietyId}
    />
  );
}

function AppShell({
  currentPage,
  setCurrentPage,
  onSignOut,
  effectiveSocietyId,
  viewAsSocietyId,
  onViewAsSocietyChange,
}: {
  currentPage: string;
  setCurrentPage: (p: string) => void;
  onSignOut: () => void;
  effectiveSocietyId: number | null;
  viewAsSocietyId: number | null;
  onViewAsSocietyChange: (id: number | null) => void;
}) {
  const { currentUser } = useAuth();
  const role = currentUser?.role ?? "Resident";

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard role={role} societyId={effectiveSocietyId} />;
      case "properties":
        return <Properties role={role} societyId={effectiveSocietyId} />;
      case "billing":
        return <Billing role={role} societyId={effectiveSocietyId} />;
      case "security":
        return <Security role={role} societyId={effectiveSocietyId} />;
      case "communication":
        return <Communication role={role} societyId={effectiveSocietyId} />;
      case "staff":
        return <StaffManagement role={role} societyId={effectiveSocietyId} />;
      case "expenses":
        return <Expenses role={role} societyId={effectiveSocietyId} />;
      case "analytics":
        return <Analytics societyId={effectiveSocietyId} />;
      case "pnl":
        return <PnL role={role} societyId={effectiveSocietyId} />;
      case "directory":
        return <Directory role={role} societyId={effectiveSocietyId} />;
      case "vehicles":
        return (
          <VehicleRegistration role={role} societyId={effectiveSocietyId} />
        );
      case "amc":
        return <AmcTracker role={role} societyId={effectiveSocietyId} />;
      case "settings":
        return (
          <Settings
            role={role}
            onRoleChange={onSignOut}
            societyId={effectiveSocietyId}
          />
        );
      default:
        return <Dashboard role={role} societyId={effectiveSocietyId} />;
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        role={role}
        onRoleChange={onSignOut}
        viewAsSocietyId={viewAsSocietyId}
        onViewAsSocietyChange={onViewAsSocietyChange}
      >
        {renderPage()}
      </Layout>
      <Toaster richColors position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <SocietyStoreProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </SocietyStoreProvider>
  );
}
