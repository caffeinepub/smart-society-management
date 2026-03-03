import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../store/AuthContext";
import { useSocietyStore } from "../store/societyStore";
import type { AppRole } from "../store/societyStore";

interface AuthPageProps {
  defaultTab?: "signin" | "signup";
  onAuthSuccess: (role: AppRole) => void;
  onBack: () => void;
}

// SuperAdmin is NOT available in self-signup — created by SuperAdmin only
const roleOptions: { value: AppRole; label: string }[] = [
  { value: "Chairman", label: "Chairman" },
  { value: "Secretary", label: "Secretary" },
  { value: "Treasurer", label: "Treasurer" },
  { value: "SecurityGuard", label: "Security Guard" },
  { value: "Resident", label: "Resident" },
  { value: "Staff", label: "Society Staff" },
];

export default function AuthPage({
  defaultTab = "signin",
  onAuthSuccess,
  onBack,
}: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const store = useSocietyStore();
  const societies = store.getSocieties();
  const units = store.getUnits();
  const towers = store.getTowers();

  // ─── Sign In state ──────────────────────────────────────────────────────────
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInShowPassword, setSignInShowPassword] = useState(false);

  // ─── Sign Up state ──────────────────────────────────────────────────────────
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState<AppRole | "">("");
  const [signUpSocietyId, setSignUpSocietyId] = useState(
    societies.length === 1 ? societies[0].id.toString() : "",
  );
  const [signUpUnitId, setSignUpUnitId] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpShowPassword, setSignUpShowPassword] = useState(false);

  const handleSignIn = () => {
    setSignInError("");
    if (!signInEmail || !signInPassword) {
      setSignInError("Please enter your email and password");
      return;
    }
    setSignInLoading(true);
    setTimeout(() => {
      const result = signIn(signInEmail, signInPassword);
      setSignInLoading(false);
      if (result.success && result.user) {
        onAuthSuccess(result.user.role);
      } else {
        setSignInError(result.error ?? "Sign in failed");
      }
    }, 350);
  };

  const handleSignUp = () => {
    setSignUpError("");
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpRole) {
      setSignUpError("Please fill in all required fields");
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError("Passwords do not match");
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters");
      return;
    }
    if (societies.length > 1 && !signUpSocietyId) {
      setSignUpError("Please select your society");
      return;
    }
    if (signUpRole === "Resident" && !signUpUnitId) {
      setSignUpError("Please select your unit");
      return;
    }

    let unitId: number | undefined;
    let unitNumber: string | undefined;
    if (signUpRole === "Resident" && signUpUnitId) {
      const unit = units.find((u) => u.id === Number(signUpUnitId));
      unitId = unit?.id;
      unitNumber = unit?.unitNumber;
    }

    const selectedSocietyId = signUpSocietyId
      ? Number(signUpSocietyId)
      : societies[0]?.id;

    setSignUpLoading(true);
    setTimeout(() => {
      const result = signUp(
        signUpName,
        signUpEmail,
        signUpPassword,
        signUpRole as AppRole,
        unitId,
        unitNumber,
        selectedSocietyId,
      );
      setSignUpLoading(false);
      if (result.success) {
        onAuthSuccess(signUpRole as AppRole);
      } else {
        setSignUpError(result.error ?? "Sign up failed");
      }
    }, 350);
  };

  const getTowerName = (towerId: number) =>
    towers.find((t) => t.id === towerId)?.name ?? "";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.24 0.045 258) 0%, oklch(0.19 0.038 252) 45%, oklch(0.22 0.05 243) 100%)",
      }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.88 0.015 245) 1px, transparent 1px), linear-gradient(90deg, oklch(0.88 0.015 245) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.1]"
        style={{ background: "oklch(0.65 0.22 243)" }}
      />

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-5 left-6 z-10"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-body transition-opacity hover:opacity-70"
          style={{ color: "oklch(0.65 0.025 248)" }}
        >
          ← Back to Home
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.52 0.18 243)" }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl tracking-tight">
              SmartSociety
            </span>
          </div>
          <p
            className="font-body text-sm"
            style={{ color: "oklch(0.62 0.025 248)" }}
          >
            Society Management Platform
          </p>
        </div>

        {/* Auth card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "oklch(1 0 0 / 0.06)",
            border: "1px solid oklch(1 0 0 / 0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Tabs defaultValue={defaultTab}>
            <TabsList
              className="w-full mb-6"
              style={{
                background: "oklch(1 0 0 / 0.08)",
                border: "1px solid oklch(1 0 0 / 0.1)",
              }}
            >
              <TabsTrigger
                value="signin"
                className="flex-1 font-body text-sm data-[state=active]:text-foreground"
                style={{ color: "oklch(0.65 0.025 248)" }}
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="flex-1 font-body text-sm data-[state=active]:text-foreground"
                style={{ color: "oklch(0.65 0.025 248)" }}
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* ─── Sign In ─────────────────────────────────────────────────────── */}
            <TabsContent value="signin" className="mt-0 space-y-4">
              <div className="space-y-1.5">
                <Label
                  className="font-body text-sm"
                  style={{ color: "oklch(0.82 0.015 245)" }}
                >
                  Email
                </Label>
                <Input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => {
                    setSignInEmail(e.target.value);
                    setSignInError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  placeholder="you@society.com"
                  className="font-body"
                  style={{
                    background: "oklch(1 0 0 / 0.07)",
                    border: "1px solid oklch(1 0 0 / 0.15)",
                    color: "oklch(0.9 0.01 245)",
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  className="font-body text-sm"
                  style={{ color: "oklch(0.82 0.015 245)" }}
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={signInShowPassword ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => {
                      setSignInPassword(e.target.value);
                      setSignInError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    placeholder="Enter your password"
                    className="font-body pr-10"
                    style={{
                      background: "oklch(1 0 0 / 0.07)",
                      border: "1px solid oklch(1 0 0 / 0.15)",
                      color: "oklch(0.9 0.01 245)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setSignInShowPassword(!signInShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
                    style={{ color: "oklch(0.75 0.02 245)" }}
                  >
                    {signInShowPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {signInError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-body"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.15)",
                      border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                      color: "oklch(0.88 0.1 25)",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {signInError}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className="w-full font-body font-semibold gap-2"
                style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
                onClick={handleSignIn}
                disabled={signInLoading}
              >
                {signInLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </TabsContent>

            {/* ─── Sign Up ─────────────────────────────────────────────────────── */}
            <TabsContent value="signup" className="mt-0 space-y-4">
              <div className="space-y-1.5">
                <Label
                  className="font-body text-sm"
                  style={{ color: "oklch(0.82 0.015 245)" }}
                >
                  Full Name
                </Label>
                <Input
                  value={signUpName}
                  onChange={(e) => {
                    setSignUpName(e.target.value);
                    setSignUpError("");
                  }}
                  placeholder="Your full name"
                  className="font-body"
                  style={{
                    background: "oklch(1 0 0 / 0.07)",
                    border: "1px solid oklch(1 0 0 / 0.15)",
                    color: "oklch(0.9 0.01 245)",
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  className="font-body text-sm"
                  style={{ color: "oklch(0.82 0.015 245)" }}
                >
                  Email
                </Label>
                <Input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => {
                    setSignUpEmail(e.target.value);
                    setSignUpError("");
                  }}
                  placeholder="you@society.com"
                  className="font-body"
                  style={{
                    background: "oklch(1 0 0 / 0.07)",
                    border: "1px solid oklch(1 0 0 / 0.15)",
                    color: "oklch(0.9 0.01 245)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    className="font-body text-sm"
                    style={{ color: "oklch(0.82 0.015 245)" }}
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={signUpShowPassword ? "text" : "password"}
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        setSignUpError("");
                      }}
                      placeholder="Min 6 chars"
                      className="font-body pr-9"
                      style={{
                        background: "oklch(1 0 0 / 0.07)",
                        border: "1px solid oklch(1 0 0 / 0.15)",
                        color: "oklch(0.9 0.01 245)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setSignUpShowPassword(!signUpShowPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
                      style={{ color: "oklch(0.75 0.02 245)" }}
                    >
                      {signUpShowPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="font-body text-sm"
                    style={{ color: "oklch(0.82 0.015 245)" }}
                  >
                    Confirm
                  </Label>
                  <Input
                    type="password"
                    value={signUpConfirmPassword}
                    onChange={(e) => {
                      setSignUpConfirmPassword(e.target.value);
                      setSignUpError("");
                    }}
                    placeholder="Repeat password"
                    className="font-body"
                    style={{
                      background: "oklch(1 0 0 / 0.07)",
                      border: "1px solid oklch(1 0 0 / 0.15)",
                      color: "oklch(0.9 0.01 245)",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  className="font-body text-sm"
                  style={{ color: "oklch(0.82 0.015 245)" }}
                >
                  Role
                </Label>
                <Select
                  value={signUpRole}
                  onValueChange={(v) => {
                    setSignUpRole(v as AppRole);
                    setSignUpError("");
                  }}
                >
                  <SelectTrigger
                    className="font-body"
                    style={{
                      background: "oklch(1 0 0 / 0.07)",
                      border: "1px solid oklch(1 0 0 / 0.15)",
                      color: signUpRole
                        ? "oklch(0.9 0.01 245)"
                        : "oklch(0.5 0.02 248)",
                    }}
                  >
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                        className="font-body"
                      >
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Society selector — shown only when multiple societies exist */}
              <AnimatePresence>
                {societies.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <Label
                      className="font-body text-sm"
                      style={{ color: "oklch(0.82 0.015 245)" }}
                    >
                      Your Society
                    </Label>
                    <Select
                      value={signUpSocietyId}
                      onValueChange={(v) => {
                        setSignUpSocietyId(v);
                        setSignUpUnitId("");
                        setSignUpError("");
                      }}
                    >
                      <SelectTrigger
                        className="font-body"
                        style={{
                          background: "oklch(1 0 0 / 0.07)",
                          border: "1px solid oklch(1 0 0 / 0.15)",
                          color: signUpSocietyId
                            ? "oklch(0.9 0.01 245)"
                            : "oklch(0.5 0.02 248)",
                        }}
                      >
                        <SelectValue placeholder="Select your society" />
                      </SelectTrigger>
                      <SelectContent>
                        {societies.map((s) => (
                          <SelectItem
                            key={s.id.toString()}
                            value={s.id.toString()}
                            className="font-body"
                          >
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Unit selector — shown only for Resident */}
              <AnimatePresence>
                {signUpRole === "Resident" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <Label
                      className="font-body text-sm"
                      style={{ color: "oklch(0.82 0.015 245)" }}
                    >
                      Your Unit
                    </Label>
                    <Select
                      value={signUpUnitId}
                      onValueChange={(v) => {
                        setSignUpUnitId(v);
                        setSignUpError("");
                      }}
                    >
                      <SelectTrigger
                        className="font-body"
                        style={{
                          background: "oklch(1 0 0 / 0.07)",
                          border: "1px solid oklch(1 0 0 / 0.15)",
                          color: signUpUnitId
                            ? "oklch(0.9 0.01 245)"
                            : "oklch(0.5 0.02 248)",
                        }}
                      >
                        <SelectValue placeholder="Select your unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-52">
                        {units
                          .filter((u) =>
                            signUpSocietyId
                              ? u.societyId === Number(signUpSocietyId)
                              : true,
                          )
                          .map((u) => (
                            <SelectItem
                              key={u.id}
                              value={u.id.toString()}
                              className="font-body"
                            >
                              {getTowerName(u.towerId)} — {u.unitNumber}
                              {u.ownerName ? ` (${u.ownerName})` : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {signUpError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-body"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.15)",
                      border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                      color: "oklch(0.88 0.1 25)",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {signUpError}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className="w-full font-body font-semibold gap-2"
                style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
                onClick={handleSignUp}
                disabled={signUpLoading}
              >
                {signUpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
