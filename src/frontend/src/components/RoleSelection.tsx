import {
  Briefcase,
  Building2,
  ChevronRight,
  Home,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

export type AppRole =
  | "SuperAdmin"
  | "Admin"
  | "SecurityGuard"
  | "Resident"
  | "Staff";

interface RoleOption {
  id: AppRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  permissions: string[];
  color: string;
}

const roles: RoleOption[] = [
  {
    id: "SuperAdmin",
    label: "Super Admin",
    description: "Full access to all modules and settings",
    icon: <Shield className="w-6 h-6" />,
    permissions: [
      "Dashboard",
      "Properties",
      "Billing",
      "Security",
      "Communication",
      "Staff",
      "Analytics",
      "Settings",
    ],
    color: "from-blue-600 to-indigo-700",
  },
  {
    id: "Admin",
    label: "Committee Admin",
    description: "Manage society operations and residents",
    icon: <Building2 className="w-6 h-6" />,
    permissions: [
      "Dashboard",
      "Properties",
      "Billing",
      "Security",
      "Communication",
      "Analytics",
    ],
    color: "from-violet-600 to-purple-700",
  },
  {
    id: "SecurityGuard",
    label: "Security Guard",
    description: "Register and monitor visitor entry/exit",
    icon: <Shield className="w-6 h-6" />,
    permissions: ["Dashboard", "Security Desk"],
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "Resident",
    label: "Resident",
    description: "View bills, notices, and raise complaints",
    icon: <Home className="w-6 h-6" />,
    permissions: ["Dashboard", "Communication", "Billing"],
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "Staff",
    label: "Society Staff",
    description: "View attendance and salary records",
    icon: <Briefcase className="w-6 h-6" />,
    permissions: ["Dashboard", "My Attendance"],
    color: "from-slate-500 to-slate-700",
  },
];

interface RoleSelectionProps {
  onSelect: (role: AppRole) => void;
}

export default function RoleSelection({ onSelect }: RoleSelectionProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.22 0.04 255) 0%, oklch(0.18 0.035 250) 50%, oklch(0.25 0.05 240) 100%)",
      }}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.88 0.015 245) 1px, transparent 1px), linear-gradient(90deg, oklch(0.88 0.015 245) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glowing orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "oklch(0.65 0.2 240)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center mb-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "oklch(0.52 0.18 243)" }}
          >
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <span className="font-display text-3xl font-bold text-white tracking-tight">
            SmartSociety
          </span>
        </div>
        <p
          className="text-lg font-body"
          style={{ color: "oklch(0.72 0.03 245)" }}
        >
          Select your role to continue
        </p>
      </motion.div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {roles.map((role, index) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(role.id)}
            className="group relative text-left rounded-xl p-5 border transition-all duration-200 cursor-pointer"
            style={{
              background: "oklch(1 0 0 / 0.06)",
              borderColor: "oklch(1 0 0 / 0.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Role card hover overlay */}
            <div
              className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${role.color}`}
            />

            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br ${role.color} shadow-md`}
              >
                {role.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-white text-base mb-1">
                  {role.label}
                </h3>
                <p
                  className="text-xs font-body leading-relaxed"
                  style={{ color: "oklch(0.68 0.025 245)" }}
                >
                  {role.description}
                </p>
              </div>
              <ChevronRight
                className="w-4 h-4 mt-1 flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity"
                style={{ color: "oklch(0.8 0.02 245)" }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-1">
              {role.permissions.slice(0, 4).map((perm) => (
                <span
                  key={perm}
                  className="text-xs px-2 py-0.5 rounded-full font-body"
                  style={{
                    background: "oklch(1 0 0 / 0.1)",
                    color: "oklch(0.78 0.02 245)",
                  }}
                >
                  {perm}
                </span>
              ))}
              {role.permissions.length > 4 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-body"
                  style={{
                    background: "oklch(1 0 0 / 0.1)",
                    color: "oklch(0.78 0.02 245)",
                  }}
                >
                  +{role.permissions.length - 4} more
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 mt-8 text-center"
      >
        <p
          className="text-xs font-body"
          style={{ color: "oklch(0.5 0.02 248)" }}
        >
          <Users className="inline w-3 h-3 mr-1" />
          Role determines your access level within the platform
        </p>
      </motion.div>
    </div>
  );
}
