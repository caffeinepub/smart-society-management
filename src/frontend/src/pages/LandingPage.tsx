import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Bell,
  Building2,
  Car,
  CheckCircle,
  ChevronRight,
  Receipt,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const features = [
  {
    icon: <Building2 className="w-5 h-5" />,
    title: "Administrative Dashboard",
    description:
      "Centralized control for managing properties, towers, and units with full committee oversight.",
    color: "oklch(0.52 0.18 243)",
    bg: "oklch(0.92 0.06 240)",
  },
  {
    icon: <Receipt className="w-5 h-5" />,
    title: "Automated Billing",
    description:
      "Generate maintenance bills, track real-time payments, and manage financial records effortlessly.",
    color: "oklch(0.5 0.16 155)",
    bg: "oklch(0.9 0.08 155)",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Digital Security Desk",
    description:
      "Register visitors, monitor entry/exit, and track vehicles — replacing manual logbooks.",
    color: "oklch(0.55 0.18 30)",
    bg: "oklch(0.94 0.08 55)",
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: "Communication Hub",
    description:
      "Digital notice boards, complaint tracking with workflow, and community polling for residents.",
    color: "oklch(0.5 0.18 280)",
    bg: "oklch(0.93 0.07 280)",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Staff Management",
    description:
      "Manage society staff roles, salaries, and daily attendance from one unified portal.",
    color: "oklch(0.48 0.14 200)",
    bg: "oklch(0.91 0.07 195)",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Analytics Engine",
    description:
      "Custom P&L reports, AMC tracking, and audit-ready financial analytics with export tools.",
    color: "oklch(0.52 0.2 340)",
    bg: "oklch(0.94 0.07 340)",
  },
];

const highlights = [
  "Role-based access control for all stakeholders",
  "PDF bill & receipt generation",
  "Multi-society management",
  "Vehicle & AMC tracking",
];

export default function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
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

      {/* Ambient glow blobs */}
      <div
        className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full blur-[120px] opacity-[0.12]"
        style={{ background: "oklch(0.65 0.22 243)" }}
      />
      <div
        className="absolute bottom-0 -left-32 w-[360px] h-[360px] rounded-full blur-[100px] opacity-[0.08]"
        style={{ background: "oklch(0.58 0.18 280)" }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.52 0.18 243)" }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            SmartSociety
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="font-body text-sm"
            style={{ color: "oklch(0.78 0.025 245)" }}
            onClick={onSignIn}
          >
            Sign In
          </Button>
          <Button
            size="sm"
            className="font-body text-sm gap-1.5"
            style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
            onClick={onSignUp}
          >
            Get Started
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col">
        <section className="flex flex-col items-center text-center px-6 pt-16 pb-20 max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-body font-semibold tracking-wide mb-6"
              style={{
                background: "oklch(0.52 0.18 243 / 0.15)",
                border: "1px solid oklch(0.52 0.18 243 / 0.3)",
                color: "oklch(0.78 0.15 243)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "oklch(0.65 0.2 243)" }}
              />
              Smart Society Management Platform
            </div>

            <h1
              className="font-display font-bold text-white leading-tight mb-5"
              style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
            >
              Digitize Your{" "}
              <span style={{ color: "oklch(0.68 0.2 243)" }}>
                Residential Society
              </span>{" "}
              Operations
            </h1>

            <p
              className="font-body text-base leading-relaxed max-w-2xl mx-auto mb-8"
              style={{ color: "oklch(0.72 0.028 248)" }}
            >
              From billing and security to communication and analytics — one
              platform for committees, residents, and staff to manage everything
              seamlessly.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap mb-10">
              <Button
                size="lg"
                className="font-body font-semibold gap-2 px-8"
                style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
                onClick={onSignUp}
              >
                Create Free Account
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="font-body font-semibold gap-2 px-8"
                style={{
                  background: "oklch(1 0 0 / 0.06)",
                  border: "1px solid oklch(1 0 0 / 0.18)",
                  color: "oklch(0.88 0.015 245)",
                }}
                onClick={onSignIn}
              >
                Sign In to Dashboard
              </Button>
            </div>

            {/* Demo credentials hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="inline-flex flex-col sm:flex-row items-center gap-3 px-5 py-3 rounded-xl text-xs font-body"
              style={{
                background: "oklch(1 0 0 / 0.06)",
                border: "1px solid oklch(1 0 0 / 0.1)",
                color: "oklch(0.65 0.025 248)",
              }}
            >
              <span
                className="font-semibold"
                style={{ color: "oklch(0.72 0.025 245)" }}
              >
                Try the demo:
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  {
                    label: "Super Admin",
                    cred: "admin@society.com / admin123",
                  },
                  {
                    label: "Resident",
                    cred: "rajesh@society.com / resident123",
                  },
                ].map((d) => (
                  <span
                    key={d.label}
                    className="px-2 py-0.5 rounded-md"
                    style={{
                      background: "oklch(1 0 0 / 0.08)",
                      color: "oklch(0.78 0.02 245)",
                    }}
                  >
                    <span className="opacity-70">{d.label}:</span> {d.cred}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Highlights strip */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 px-6 pb-10 max-w-4xl mx-auto w-full"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {highlights.map((h) => (
              <div
                key={h}
                className="flex items-center gap-2 text-sm font-body"
                style={{ color: "oklch(0.72 0.025 245)" }}
              >
                <CheckCircle
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "oklch(0.58 0.16 155)" }}
                />
                {h}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Features grid */}
        <section className="relative z-10 px-6 pb-20 max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55 }}
            className="text-center mb-10"
          >
            <h2
              className="font-display font-bold text-2xl mb-2"
              style={{ color: "oklch(0.9 0.015 245)" }}
            >
              Everything you need in one platform
            </h2>
            <p
              className="font-body text-sm"
              style={{ color: "oklch(0.58 0.025 248)" }}
            >
              8 modules, 5 role types, fully integrated
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.45 }}
                className="rounded-xl p-5 transition-all duration-200 cursor-default"
                style={{
                  background: "oklch(1 0 0 / 0.05)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  backdropFilter: "blur(8px)",
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.15 },
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: feature.bg, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3
                  className="font-display font-semibold text-sm mb-2"
                  style={{ color: "oklch(0.9 0.015 245)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="font-body text-xs leading-relaxed"
                  style={{ color: "oklch(0.62 0.025 248)" }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 text-center py-5 px-6 border-t"
        style={{
          borderColor: "oklch(1 0 0 / 0.08)",
          color: "oklch(0.48 0.02 248)",
        }}
      >
        <p className="text-xs font-body">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
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
      </footer>
    </div>
  );
}
