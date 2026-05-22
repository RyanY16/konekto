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
  // Only true when the DB fetch completed without throwing — prevents incorrect
  // "profile incomplete" redirects when the network / RLS causes a fetch error.
  const [profileFetchOk, setProfileFetchOk] = useState(false);

  useEffect(() => {
    console.log("[auth] init — configured:", isSupabaseConfigured);

    if (!isSupabaseConfigured || !supabase) {
      console.log("[auth] supabase not configured, skipping auth");
      setLoading(false);
      setProfileReady(true);
      return;
    }

    let mounted = true;
    let generation = 0;

    // Bootstrap: read session from localStorage immediately — no network call, resolves in <1ms.
    // This sets loading=false before onAuthStateChange fires (which waits for JWT validation).
    // If onAuthStateChange has already run (generation > 0), skip to avoid overwriting fresh state.
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(`[auth] getSession resolved — generation=${generation} user=${session?.user?.id ?? "null"}`);
      if (!mounted || generation > 0) {
        console.log("[auth] getSession: skipped (mounted=" + mounted + ", generation=" + generation + ")");
        return;
      }
      const u = session?.user ?? null;
      if (!u) {
        console.log("[auth] getSession: no user → loading=false profileReady=true");
        setUser(null);
        setLoading(false);
        setProfileReady(true);
      } else {
        console.log("[auth] getSession: user found → partial user set, loading=false, awaiting profileReady from onAuthStateChange");
        setUser({ id: u.id, email: u.email, role: "user", username: null });
        setLoading(false);
        // profileReady / profileFetchOk will be set once onAuthStateChange completes the profile fetch
      }
    }).catch((err) => {
      console.error("[auth] getSession error", err);
      if (mounted && generation === 0) {
        setLoading(false);
        setProfileReady(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const gen = ++generation;
      const u = session?.user ?? null;
      console.log(`[auth] onAuthStateChange — event=${_event} user=${u?.id ?? "null"} gen=${gen}`);

      if (!u) {
        if (mounted && gen === generation) {
          console.log("[auth] no user → clearing state");
          setUser(null);
          setLoading(false);
          setProfileReady(true);
        }
        return;
      }

      if (mounted && gen === generation) {
        // Reset profile state so stale profileReady/profileFetchOk from a
        // previous generation don't make profileIncomplete=true while we wait
        // for the new profile fetch (e.g. TOKEN_REFRESHED firing after INITIAL_SESSION).
        setUser({ id: u.id, email: u.email, role: "user", username: null });
        setProfileReady(false);
        setProfileFetchOk(false);
        setLoading(false);
      }

      // Fetch the profile in the background, then update user + signal ready.
      console.log(`[auth] profile fetch start — userId=${u.id} gen=${gen}`);
      let fetchOk = false;
      try {
        const { data: profile, error: profileError } = await supabase!
          .from("users")
          .select("role, username")
          .eq("id", u.id)
          .maybeSingle();

        console.log(`[auth] profile fetch result — gen=${gen} generation=${generation} username=${(profile as any)?.username ?? null} error=${profileError?.message ?? null}`);

        if (profileError) {
          console.error("[auth] profile fetch DB error:", profileError);
          // fetchOk stays false → profileIncomplete=false → no redirect
        } else if (profile === null) {
          // maybeSingle returns null when the row doesn't exist OR when RLS
          // blocks the SELECT (no error, just empty result). We can't tell
          // which, so don't redirect — it's safer to leave an existing user
          // on the page than to boot them to /signup on an RLS/timing hiccup.
          console.warn("[auth] profile row is null — treating as unknown, no redirect");
          // fetchOk stays false → profileIncomplete=false → no redirect
        } else {
          // Row exists — profile state is definitive.
          fetchOk = true;
          if (mounted && gen === generation) {
            setUser({
              id: u.id,
              email: u.email,
              role: ((profile as any)?.role ?? "user") as "user" | "admin",
              username: (profile as any)?.username ?? null,
            });
          }
        }
      } catch (err) {
        console.error(`[auth] profile fetch threw — gen=${gen}`, err);
        // fetchOk stays false → profileIncomplete stays false → no redirect
      } finally {
        if (mounted && gen === generation) {
          console.log(`[auth] profileReady=true fetchOk=${fetchOk} gen=${gen}`);
          setProfileFetchOk(fetchOk);
          setProfileReady(true);
        } else {
          console.log(`[auth] finally: stale gen=${gen} generation=${generation} mounted=${mounted} — skipped`);
        }
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
      console.log("[auth] cleanup");
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
    setProfileFetchOk(false);
    supabase.auth.signOut({ scope: "local" }).catch(() => {});
  }

  async function refreshUser() {
    if (!supabase) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { data: profile, error } = await supabase.from("users").select("role, username").eq("id", u.id).maybeSingle();
    if (!error) {
      setProfileFetchOk(true);
      setUser({
        id: u.id,
        email: u.email,
        role: (profile?.role ?? "user") as "user" | "admin",
        username: (profile as any)?.username ?? null,
      });
    }
  }

  const isAdmin = user?.role === "admin";
  // Only consider the profile incomplete when the DB fetch confirmed username is null.
  // If the fetch errored, profileFetchOk=false → profileIncomplete=false → no redirect.
  const profileIncomplete = !!(user && !user.username && profileFetchOk);

  console.log(`[auth] render — loading=${loading} profileReady=${profileReady} profileFetchOk=${profileFetchOk} user=${user?.id ?? "null"} username=${user?.username ?? "null"} profileIncomplete=${profileIncomplete}`);

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
