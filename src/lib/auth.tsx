import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "approver" | "preparer" | "auditor" | "viewer";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin (delegator)",
  approver: "Approver",
  preparer: "Preparer",
  auditor: "Auditor (read-only)",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin:
    "Delegates roles, manages employees, full read across the system. Cannot prepare and approve the same record.",
  approver:
    "Approves submissions prepared by others. SoX segregation: cannot approve their own preparation.",
  preparer:
    "Drafts and submits records for approval. Cannot approve their own work.",
  auditor:
    "Read-only access to all records and the immutable audit trail for SoX 404 review.",
  viewer: "Read-only access to non-sensitive dashboards.",
};

export const BOOTSTRAP_ADMIN_EMAIL = "s.michele.leber@syncoraconnect.com";

type Profile = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  title: string | null;
  department: string | null;
  is_active: boolean;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  audit: (entry: {
    action: string;
    resource_type: string;
    resource_id?: string;
    before_state?: unknown;
    after_state?: unknown;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (uid: string) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((p as Profile | null) ?? null);
    setRoles((r ?? []).map((x: { role: AppRole }) => x.role));
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // defer to avoid deadlock in the listener
        setTimeout(() => loadUserData(s.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadUserData(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const audit = useCallback<AuthContextValue["audit"]>(
    async (entry) => {
      if (!user) return;
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_email: user.email ?? null,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id ?? null,
        before_state: (entry.before_state as object | undefined) ?? null,
        after_state: (entry.after_state as object | undefined) ?? null,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      roles,
      loading,
      hasRole: (role) => roles.includes(role),
      hasAnyRole: (rs) => rs.some((r) => roles.includes(r)),
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) return { error: error.message };
        return {};
      },
      signUp: async (email, password, displayName) => {
        const cleanEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? window.location.origin : undefined,
            data: displayName ? { display_name: displayName } : undefined,
          },
        });
        if (error) return { error: error.message };
        return {};
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refresh: async () => {
        if (user) await loadUserData(user.id);
      },
      audit,
    }),
    [user, session, profile, roles, loading, loadUserData, audit],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}