import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProfileByUsername, type UserProfile } from "@/data/backend";
import { OwnerBadge } from "@/components/OwnerBadge";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Konekto" },
      { name: "description", content: "The story behind Konekto and why it was built." },
    ],
  }),
  component: AboutPage,
});

function CreatorBadge() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getProfileByUsername("ryany16").then(setProfile).catch(() => {});
  }, []);

  if (!profile) return <div className="h-7 w-32 rounded-full bg-muted animate-pulse" />;

  return (
    <OwnerBadge
      username="ryany16"
      displayName={profile.displayName}
      avatarUrl={profile.avatarUrl}
    />
  );
}

function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-10">

      {/* Hero */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest">About</p>
        <h1 className="text-4xl font-bold leading-tight">
          Hello! Welcome to Konekto 👋
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          A platform built by a student, for students navigating life in Japan.
        </p>
      </div>

      {/* Who I am */}
      <section className="card-base p-6 space-y-3">
        <h2 className="text-lg font-semibold">Who am I?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Hi! My name is Ryan and I am a graduate school student from Australia and based in Japan. As an 
          international student I quickly discovered how hard it can be to find out which clubs are available, 
          open for recruiting and what events they had.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Most of that information travelled by word of mouth, so if you weren't already
          plugged into the right social circles, you simply missed out.
        </p>
      </section>

      {/* Why I built this */}
      <section className="card-base p-6 space-y-3">
        <h2 className="text-lg font-semibold">Why I built Konekto</h2>
        <p className="text-muted-foreground leading-relaxed">
          I wanted to change that. Konekto is a platform where students, especially
          international students new to Japan with little Japanese, can discover
          circles and events, get the information they need, and connect directly
          without relying on word of mouth.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Whether you're looking for a study group, a sports team, a cultural exchange
          circle, or just something fun to do on the weekend, Konekto is the place to find it.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {["🌏 International-friendly", "🎓 Student-built", "🇯🇵 Japan-focused", "🆓 Free to use"].map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium">{tag}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
        <p className="text-base leading-relaxed">
          Feel free to look around and check out my profile as well!
        </p>
        <CreatorBadge />
      </section>

    </div>
  );
}
