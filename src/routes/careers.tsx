import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { jobs, type Job } from "@/data/mock";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Konekto" },
      {
        name: "description",
        content:
          "Shukatsu, baito, and opportunities for students in Japan. Track applications kanban-style.",
      },
    ],
  }),
  component: CareersPage,
});

const tabs = ["Shukatsu", "Baito", "Opportunities", "Tracker"] as const;

function CareersPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Shukatsu");

  return (
    <div>
      <PageHeader
        eyebrow="Careers"
        title="Build your future, here."
        subtitle="Internships, part-time gigs, and once-in-a-lifetime opportunities."
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Tracker" ? <Kanban /> : <JobList type={tab === "Opportunities" ? "Opportunity" : tab} />}
    </div>
  );
}

function JobList({ type }: { type: Job["type"] }) {
  const filtered = jobs.filter((j) => j.type === type);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filtered.map((j) => (
        <article key={j.id} className="card-base card-hover p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
              {j.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{j.company}</p>
              <h3 className="font-semibold">{j.role}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">📍 {j.location}</p>
            </div>
            <SaveButton />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {j.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button className="text-sm font-semibold text-primary hover:underline">
              View role →
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

const columns = [
  { title: "Saved", count: 4, color: "bg-muted" },
  { title: "Applied", count: 3, color: "bg-primary-soft" },
  { title: "Interview", count: 2, color: "bg-accent-soft" },
  { title: "Offer", count: 1, color: "bg-success/15" },
];

const kanbanCards: Record<string, { company: string; role: string; emoji: string }[]> = {
  Saved: [
    { company: "Mercari", role: "SWE Intern", emoji: "🛍️" },
    { company: "Rakuten", role: "PM New Grad", emoji: "🛒" },
    { company: "Sony", role: "UX Designer", emoji: "🎮" },
    { company: "LINE", role: "Backend Intern", emoji: "💬" },
  ],
  Applied: [
    { company: "Goldman Sachs", role: "Summer Analyst", emoji: "🏦" },
    { company: "McKinsey", role: "BA Intern", emoji: "📊" },
    { company: "Recruit", role: "Strategy", emoji: "🎯" },
  ],
  Interview: [
    { company: "Google Japan", role: "APM", emoji: "🔍" },
    { company: "Indeed", role: "SWE", emoji: "🔧" },
  ],
  Offer: [{ company: "Smartnews", role: "Product Intern", emoji: "📰" }],
};

function Kanban() {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Drag-and-drop coming soon — for now, a snapshot of your pipeline.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.title} className="space-y-3">
            <div className={`${col.color} rounded-xl px-3 py-2 flex items-center justify-between`}>
              <h3 className="font-semibold text-sm">{col.title}</h3>
              <span className="text-xs font-semibold text-muted-foreground">{col.count}</span>
            </div>
            <div className="space-y-2">
              {kanbanCards[col.title].map((c, i) => (
                <div key={i} className="card-base p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{c.company}</p>
                      <p className="text-sm font-medium truncate">{c.role}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full text-xs text-muted-foreground border border-dashed border-border rounded-lg py-2 hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
