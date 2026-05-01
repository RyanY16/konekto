import { createFileRoute } from "@tanstack/react-router";
import { Settings, Bookmark, Users, Briefcase, Plus, Calendar, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { circles, events } from "@/data/mock";
import { PageHeader } from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Konekto" },
      { name: "description", content: "Your profile, saved items, and application tracker." },
    ],
  }),
  component: ProfilePage,
});

const interests = ["finance", "ai", "international-friendly", "music", "startup"];

function ProfilePage() {
  const savedEvents = events.slice(0, 3);
  const myCircles = circles.slice(0, 2);

  return (
    <div>
      <PageHeader eyebrow="Profile" title="Your hub." />

      {/* Profile card */}
      <section className="card-base p-6 mb-8 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl text-primary-foreground font-bold shrink-0">
          Y
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold">Yuki Tanaka</h2>
          <p className="text-sm text-muted-foreground">Waseda University · Year 3 · Computer Science</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {interests.map((i) => (
              <span key={i} className="chip chip-primary">
                #{i}
              </span>
            ))}
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-muted">
          <Settings className="h-4 w-4" /> Edit
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Stat icon={<Bookmark />} label="Saved items" value="14" />
        <Stat icon={<Users />} label="Joined circles" value={`${myCircles.length}`} />
        <Stat icon={<Briefcase />} label="Applications" value="6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Block title="Saved events">
          <div className="space-y-2">
            {savedEvents.map((e) => (
              <div key={e.id} className="card-base p-3 flex items-center gap-3">
                <span className="text-2xl">{e.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.date}</p>
                </div>
                <span className="chip">{e.category}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Joined circles">
          <div className="space-y-2">
            {myCircles.map((c) => (
              <div key={c.id} className="card-base p-3 flex items-center gap-3">
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.category} · {c.members} members
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Block>
      </div>

      <Block title="Preferences" className="mt-6">
        <div className="card-base p-5 space-y-3">
          <Pref label="University" value="Waseda University" />
          <Pref label="Goals" value="Find an internship · Make international friends" />
          <Pref label="Language" value="English / 日本語" />
          <Pref label="Notifications" value="Weekly digest" />
        </div>
      </Block>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-base p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Block({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Pref({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-3 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
