"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type User = {
  id: string;
  email?: string | null;
  role: "user" | "admin";
  username: string | null;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  profileReady: boolean;
  isAdmin: boolean;
  profileIncomplete: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ id: string } | undefined>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setProfileReady(true);
      return;
    }

    let mounted = true;
    let generation = 0;

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const gen = ++generation;
      const u = session?.user ?? null;

      if (!u) {
        if (mounted && gen === generation) {
          setUser(null);
          setLoading(false);
          setProfileReady(true);
        }
        return;
      }

      // Resolve loading immediately — don't wait for the profile DB fetch.
      // This prevents a cold Supabase DB query from blocking the entire page.
      if (mounted && gen === generation) {
        setUser({ id: u.id, email: u.email, role: "user", username: null });
        setLoading(false);
      }

      // Fetch the profile in the background, then update user + signal ready.
      try {
        const { data: profile } = await supabase!
          .from("users")
          .select("role, username")
          .eq("id", u.id)
          .maybeSingle();
        if (mounted && gen === generation) {
          setUser({
            id: u.id,
            email: u.email,
            role: (profile?.role ?? "user") as "user" | "admin",
            username: (profile as any)?.username ?? null,
          });
        }
      } catch (err) {
        console.error(`[auth] profile fetch failed`, err);
      } finally {
        if (mounted && gen === generation) setProfileReady(true);
      }

      if (!mounted || gen !== generation) return;

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
          if (mounted && row && !row.display_name && !row.username) {
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
    if (data.user && data.user.identities?.length === 0) {
      throw new Error("An account with this email already exists. Try logging in instead.");
    }
    return data.user ?? undefined;
  }

  async function signInWithGoogle() {
    if (!isSupabaseConfigured || !supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/signup` },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!isSupabaseConfigured || !supabase) return;
    setUser(null);
    supabase.auth.signOut({ scope: "local" }).catch(() => {});
  }

  async function refreshUser() {
    if (!supabase) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { data: profile } = await supabase.from("users").select("role, username").eq("id", u.id).maybeSingle();
    setUser({
      id: u.id,
      email: u.email,
      role: (profile?.role ?? "user") as "user" | "admin",
      username: (profile as any)?.username ?? null,
    });
  }

  const isAdmin = user?.role === "admin";
  const profileIncomplete = !!(user && !user.username);

  return (
    <AuthContext.Provider value={{ user, loading, profileReady, isAdmin, profileIncomplete, signIn, signUp, signInWithGoogle, signOut, refreshUser }}>
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
