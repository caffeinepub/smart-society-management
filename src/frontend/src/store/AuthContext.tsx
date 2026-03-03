import { type ReactNode, createContext, useContext } from "react";
import type { AppRole, User } from "./societyStore";
import { useSocietyStore } from "./societyStore";

// ─── Auth context shape ───────────────────────────────────────────────────────

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  signIn: (
    email: string,
    password: string,
  ) => { success: boolean; error?: string; user?: User };
  signUp: (
    name: string,
    email: string,
    password: string,
    role: AppRole,
    unitId?: number,
    unitNumber?: string,
    societyId?: number,
  ) => { success: boolean; error?: string };
  signOut: () => void;
  updateProfile: (name: string, email: string) => void;
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useSocietyStore();

  const currentUser = store.getCurrentUser();
  const isAuthenticated = currentUser !== null;

  const value: AuthContextValue = {
    currentUser,
    isAuthenticated,
    signIn: (email: string, password: string) => store.signIn(email, password),
    signUp: (
      name: string,
      email: string,
      password: string,
      role: AppRole,
      unitId?: number,
      unitNumber?: string,
      societyId?: number,
    ) =>
      store.signUp(name, email, password, role, unitId, unitNumber, societyId),
    signOut: () => store.signOut(),
    updateProfile: (name: string, email: string) => {
      if (currentUser) {
        store.updateUserProfile(currentUser.id, name, email);
      }
    },
    updatePassword: (currentPassword: string, newPassword: string) => {
      if (!currentUser) return { success: false, error: "Not authenticated" };
      return store.updateUserPassword(
        currentUser.id,
        currentPassword,
        newPassword,
      );
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
