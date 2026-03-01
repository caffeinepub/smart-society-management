import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Layout from "./components/Layout";
import RoleSelection, { type AppRole } from "./components/RoleSelection";
import AmcTracker from "./pages/AmcTracker";
import Analytics from "./pages/Analytics";
import Billing from "./pages/Billing";
import Communication from "./pages/Communication";
import Complaints from "./pages/Complaints";
import Dashboard from "./pages/Dashboard";
import Directory from "./pages/Directory";
import Expenses from "./pages/Expenses";
import Notices from "./pages/Notices";
import PnL from "./pages/PnL";
import Properties from "./pages/Properties";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import StaffManagement from "./pages/StaffManagement";
import VehicleRegistration from "./pages/VehicleRegistration";
import { SocietyStoreProvider } from "./store/societyStore";

export default function App() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleRoleSelect = (selectedRole: AppRole) => {
    setRole(selectedRole);
    setCurrentPage("dashboard");
  };

  const handleRoleChange = () => {
    setRole(null);
    setCurrentPage("dashboard");
  };

  if (!role) {
    return (
      <>
        <RoleSelection onSelect={handleRoleSelect} />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard role={role} />;
      case "properties":
        return <Properties role={role} />;
      case "billing":
        return <Billing role={role} />;
      case "security":
        return <Security role={role} />;
      case "communication":
        return <Communication role={role} />;
      case "staff":
        return <StaffManagement role={role} />;
      case "expenses":
        return <Expenses role={role} />;
      case "analytics":
        return <Analytics />;
      case "pnl":
        return <PnL role={role} />;
      case "directory":
        return <Directory role={role} />;
      case "vehicles":
        return <VehicleRegistration role={role} />;
      case "amc":
        return <AmcTracker role={role} />;
      case "notices":
        return <Notices role={role} />;
      case "complaints":
        return <Complaints role={role} />;
      case "settings":
        return <Settings role={role} onRoleChange={handleRoleChange} />;
      default:
        return <Dashboard role={role} />;
    }
  };

  return (
    <SocietyStoreProvider>
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        role={role}
        onRoleChange={handleRoleChange}
      >
        {renderPage()}
      </Layout>
      <Toaster richColors position="top-right" />
    </SocietyStoreProvider>
  );
}
