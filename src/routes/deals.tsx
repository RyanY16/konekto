import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { deals } from "@/data/mock";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Deals — Konekto" },
      {
        name: "description",
        content:
          "Student discounts and gakuwari near campus — food, fashion, and lifestyle perks across Japan.",
      },
    ],
  }),
  component: DealsPage,
});

const cats = ["All", "Food", "Fashion", "Lifestyle"] as const;

function DealsPage() {
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const filtered = cat === "All" ? deals : deals.filter((d) => d.category === cat);

  return (
    <div>
      <PageHeader
        eyebrow="Deals · 学割"
        title="Student perks, sorted."
        subtitle="Show your student ID. Save serious yen."
      />

      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                cat === c
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> Showing near Shibuya
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <article key={d.id} className="card-base card-hover p-5">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary-soft flex items-center justify-center text-3xl shrink-0">
                {d.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{d.brand}</p>
                <h3 className="font-semibold leading-snug">{d.title}</h3>
              </div>
              <SaveButton />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="chip chip-primary text-sm font-bold">{d.discount}</span>
              <p className="text-xs text-muted-foreground">{d.area}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
