import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, LogOut, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppRole } from "../components/RoleSelection";
import { useSocietyStore } from "../store/societyStore";

const roleLabels: Record<AppRole, string> = {
  SuperAdmin: "Super Admin",
  Admin: "Committee Admin",
  SecurityGuard: "Security Guard",
  Resident: "Resident",
  Staff: "Society Staff",
};

const roleColors: Record<AppRole, React.CSSProperties> = {
  SuperAdmin: {
    background: "oklch(0.92 0.06 240)",
    color: "oklch(0.35 0.15 243)",
    border: "1px solid oklch(0.84 0.1 240)",
  },
  Admin: {
    background: "oklch(0.93 0.07 280)",
    color: "oklch(0.35 0.15 280)",
    border: "1px solid oklch(0.84 0.1 280)",
  },
  SecurityGuard: {
    background: "oklch(0.95 0.08 75)",
    color: "oklch(0.4 0.12 65)",
    border: "1px solid oklch(0.88 0.1 70)",
  },
  Resident: {
    background: "oklch(0.9 0.08 155)",
    color: "oklch(0.3 0.1 155)",
    border: "1px solid oklch(0.82 0.1 155)",
  },
  Staff: {
    background: "oklch(0.92 0.015 245)",
    color: "oklch(0.45 0.03 248)",
    border: "1px solid oklch(0.84 0.02 245)",
  },
};

interface SettingsProps {
  role: AppRole;
  onRoleChange: () => void;
}

export default function Settings({ role, onRoleChange }: SettingsProps) {
  const store = useSocietyStore();
  const isAdmin = role === "SuperAdmin" || role === "Admin";

  // Society info form
  const [societyName, setSocietyName] = useState("");
  const [societyAddress, setSocietyAddress] = useState("");
  const [societyCity, setSocietyCity] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const societyInfo = store.getSocietyInfo();

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync form from societyInfo object
  useEffect(() => {
    if (societyInfo) {
      setSocietyName(societyInfo.name || "");
      setSocietyAddress(societyInfo.address || "");
      setSocietyCity(societyInfo.city || "");
      setRegistrationNumber(societyInfo.registrationNumber || "");
      setContactPhone(societyInfo.contactPhone || "");
    }
  }, [
    societyInfo.name,
    societyInfo.address,
    societyInfo.city,
    societyInfo.registrationNumber,
    societyInfo.contactPhone,
  ]);

  const handleSave = () => {
    if (!societyName) return;
    store.updateSocietyInfo(
      societyName,
      societyAddress,
      societyCity,
      registrationNumber,
      contactPhone,
    );
    toast.success("Society information updated");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Tabs defaultValue={isAdmin ? "society" : "profile"}>
        <TabsList className="font-body mb-6">
          {isAdmin && (
            <TabsTrigger value="society" className="gap-2">
              <Building2 className="w-3.5 h-3.5" /> Society Info
            </TabsTrigger>
          )}
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-3.5 h-3.5" /> My Profile
          </TabsTrigger>
        </TabsList>

        {/* Society Info */}
        {isAdmin && (
          <TabsContent value="society" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">
                  Society Information
                </CardTitle>
                <p className="text-sm font-body text-muted-foreground">
                  Update your society&apos;s basic details and contact
                  information
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="font-body">Society Name</Label>
                  <Input
                    value={societyName}
                    onChange={(e) => setSocietyName(e.target.value)}
                    placeholder="e.g. Prestige Lakeside Habitat"
                    className="font-body"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-body">Address</Label>
                  <Input
                    value={societyAddress}
                    onChange={(e) => setSocietyAddress(e.target.value)}
                    placeholder="Full address"
                    className="font-body"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-body">City</Label>
                    <Input
                      value={societyCity}
                      onChange={(e) => setSocietyCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body">Contact Phone</Label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="font-body"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-body">Registration Number</Label>
                  <Input
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. CHS/MH/2024/001234"
                    className="font-body"
                  />
                </div>

                <Separator />

                <Button
                  className="gap-2 font-body"
                  onClick={handleSave}
                  disabled={!societyName}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Profile */}
        <TabsContent value="profile" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">
                My Profile
              </CardTitle>
              <p className="text-sm font-body text-muted-foreground">
                Your current session and role details
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: "oklch(0.94 0.012 245)" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-bold text-xl"
                  style={{ background: "oklch(0.52 0.18 243)" }}
                >
                  {roleLabels[role].charAt(0)}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base">
                    {roleLabels[role]}
                  </h3>
                  <Badge
                    className="font-body text-xs mt-1"
                    style={roleColors[role]}
                  >
                    {role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-1">
                    Current Role
                  </p>
                  <p className="font-body font-medium">{roleLabels[role]}</p>
                </div>
                <div>
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-1">
                    Access Level
                  </p>
                  <p className="font-body font-medium">
                    {role === "SuperAdmin"
                      ? "Full Access — All Modules"
                      : role === "Admin"
                        ? "Administrative — Operations & Reporting"
                        : role === "SecurityGuard"
                          ? "Security — Visitor & Vehicle Management"
                          : role === "Resident"
                            ? "Resident — View Bills, Notices, File Complaints"
                            : "Staff — View Own Attendance"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-display font-semibold text-sm">Session</h3>
                <p className="text-sm font-body text-muted-foreground">
                  You are currently signed in as{" "}
                  <strong>{roleLabels[role]}</strong>. To access a different
                  role, switch your role below.
                </p>
                <Button
                  variant="outline"
                  className="gap-2 font-body w-full sm:w-auto"
                  onClick={onRoleChange}
                >
                  <LogOut className="w-4 h-4" />
                  Switch Role
                </Button>
              </div>

              <Separator />

              <div className="text-xs font-body text-muted-foreground">
                <p>SmartSociety Management Platform</p>
                <p className="mt-0.5">
                  &copy; {new Date().getFullYear()}. Built with love using{" "}
                  <a
                    href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: "oklch(0.52 0.18 243)" }}
                  >
                    caffeine.ai
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
