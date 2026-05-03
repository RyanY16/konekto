"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type User = {
  id: string;
  email?: string | null;
  role: "user" | "admin";
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ id: string } | undefined>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function resolveUser(u: { id: string; email?: string | null } | null) {
      if (!u) return null;
      const { data: profile } = await supabase!.from("users").select("role").eq("id", u.id).single();
      return { id: u.id, email: u.email, role: (profile?.role ?? "user") as "user" | "admin" };
    }

    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(await resolveUser(u));
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(await resolveUser(u));

      // On first sign-in, backfill profile fields from signup metadata if the
      // row exists but is still empty (trigger may have created it without data).
      if ((_event === "SIGNED_IN" || _event === "INITIAL_SESSION") && u) {
        const meta = u.user_metadata ?? {};
        if (meta.display_name || meta.username) {
          const { data: row } = await supabase!
            .from("users")
            .select("display_name, username")
            .eq("id", u.id)
            .maybeSingle();
          if (row && !row.display_name && !row.username) {
            const fields: Record<string, unknown> = {
              id: u.id,
              updated_at: new Date().toISOString(),
            };
            if (meta.display_name) fields.display_name = meta.display_name;
            if (meta.username) fields.username = meta.username;
            if (meta.university) fields.university = meta.university;
            if (Array.isArray(meta.interests) && meta.interests.length > 0)
              fields.interests = meta.interests;
            await (supabase!.from("users") as any)
              .upsert(fields, { onConflict: "id" });
          }
        }
      }
    });

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured || !supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    if (!isSupabaseConfigured || !supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: metadata ? { data: metadata } : undefined,
    });
    if (error) throw error;
    return data.user ?? undefined;
  }

  async function signOut() {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export default AuthProvider;
