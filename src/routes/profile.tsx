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

type CustomItem = {
  id: string;
  type: "event" | "circle" | "deal" | "application";
  title: string;
  detail: string;
  emoji: string;
};

const TYPE_META: Record<CustomItem["type"], { label: string; emoji: string; icon: React.ReactNode }> = {
  event: { label: "Event", emoji: "📅", icon: <Calendar className="h-4 w-4" /> },
  circle: { label: "Circle", emoji: "👥", icon: <Users className="h-4 w-4" /> },
  deal: { label: "Deal", emoji: "🏷️", icon: <Tag className="h-4 w-4" /> },
  application: { label: "Application", emoji: "💼", icon: <Briefcase className="h-4 w-4" /> },
};

function ProfilePage() {
  const savedEvents = events.slice(0, 3);
  const myCircles = circles.slice(0, 2);

  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CustomItem["type"]>("event");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCustomItems((prev) => [
      {
        id: `${Date.now()}`,
        type,
        title: title.trim(),
        detail: detail.trim(),
        emoji: TYPE_META[type].emoji,
      },
      ...prev,
    ]);
    setTitle("");
    setDetail("");
    setOpen(false);
  };

  const handleRemove = (id: string) => {
    setCustomItems((prev) => prev.filter((i) => i.id !== id));
  };

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
        <Stat icon={<Bookmark />} label="Saved items" value={`${14 + customItems.length}`} />
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

      {/* My additions */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">My additions</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full gap-1.5">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to your hub</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(TYPE_META) as CustomItem["type"][]).map((t) => {
                      const active = type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                            active
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {TYPE_META[t].icon}
                          {TYPE_META[t].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`e.g. ${
                      type === "event"
                        ? "Sakura picnic at Yoyogi"
                        : type === "circle"
                          ? "Tokyo Photography Walk"
                          : type === "deal"
                            ? "20% off at Saizeriya"
                            : "Mercari summer internship"
                    }`}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Details
                  </label>
                  <Input
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Date, location, or a short note"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={!title.trim()}>
                    Add
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {customItems.length === 0 ? (
          <div className="card-base p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Add an event, circle, deal, or application you want to track.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {customItems.map((item) => (
              <div key={item.id} className="card-base p-3 flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {TYPE_META[item.type].label}
                    {item.detail ? ` · ${item.detail}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  aria-label="Remove"
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
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
