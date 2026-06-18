import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BriefcaseBusiness, Calendar, MapPin, Users } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { SaveButton } from "@/components/SaveButton";
import { dealGradient, eventGradient, opportunityGradient } from "@/lib/placeholders";
import { tagClass } from "@/lib/tag-class";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Test — Konekto" },
      { name: "description", content: "Temporary showcase feed with diverse sample Konekto entries." },
    ],
  }),
  component: TestPage,
});

const showcaseItems = [
  {
    id: "test-circle-creative-tech",
    type: "circle",
    categoryTag: "Visual Arts and Design",
    categoryLabel: "Design",
    title: "Global Creators Lab",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    description: "A bilingual community for designers, coders, filmmakers, musicians, and builders making portfolio projects together.",
    badges: ["Recruiting", "English + 日本語"],
    tags: ["Content Creation", "Language Exchange"],
    gradient: "from-sky-400/30 to-violet-500/30",
    meta: "Weekly · Shibuya / Online",
  },
  {
    id: "test-event-food-culture",
    type: "event",
    categoryTag: "Food and Drink",
    categoryLabel: "Food",
    title: "Night Market Language Picnic",
    image: "https://images.unsplash.com/photo-1526139334526-f591a54b477c?auto=format&fit=crop&q=80&w=800",
    description: "Low-pressure food crawl with language exchange tables, halal/vegan picks, photo spots, and new-student hosts.",
    badges: ["Free entry", "International-friendly"],
    tags: ["Cultural Exchange", "Learn Japanese"],
    gradient: eventGradient("Social"),
    meta: "Fri, Jul 10 · 6:30 PM · Ueno",
  },
  {
    id: "test-deal-wellness",
    type: "deal",
    categoryTag: "Fitness and Training",
    categoryLabel: "Wellness",
    title: "Student Reset Pass",
    image: "https://images.unsplash.com/photo-1758599880866-940def52706a?auto=format&fit=crop&q=80&w=800",
    description: "40% off coworking, gym day passes, bathhouse tickets, and quiet study cafes during exam season.",
    badges: ["Student only", "Online + In-person"],
    tags: ["Café", "Travel"],
    gradient: dealGradient("Lifestyle"),
    meta: "From ¥500 · Tokyo, Osaka, Kyoto",
  },
  {
    id: "test-opportunity-impact",
    type: "opportunity",
    categoryTag: "Sustainability",
    categoryLabel: "Sustainability",
    title: "Climate x AI Micro-Internship",
    image: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?auto=format&fit=crop&q=80&w=800",
    description: "Four-week remote-friendly team sprint for students in engineering, policy, design, business, and translation.",
    badges: ["Paid", "Remote-friendly"],
    tags: ["Data Science and AI", "Engineering"],
    gradient: opportunityGradient("Internship"),
    meta: "Deadline: Aug 15 · Hybrid",
  },
] as const;

function TestPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !isAdmin) return null;

  return <TestFeedShowcase />;
}

export function TestFeedShowcase() {
  return (
    <div className="grid grid-cols-1 gap-2.5">
        {showcaseItems.map((item) => (
          <article key={item.id} className="card-base card-hover relative overflow-hidden">
            <div className="flex items-center gap-3.5 p-3.5">
              <div className={`h-28 w-28 shrink-0 overflow-hidden rounded-lg flex items-center justify-center bg-gradient-to-br ${item.gradient}`}>
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex max-w-full flex-wrap gap-1">
                      <span className={`inline-flex max-w-full items-center truncate rounded-full px-1.5 py-0.5 text-[11px] font-medium ${tagClass(item.categoryTag)}`}>
                        {item.categoryLabel}
                      </span>
                    </div>
                    <h3 className="line-clamp-1 text-sm font-semibold leading-snug sm:text-base">{item.title}</h3>
                  </div>
                  <SaveButton itemId={item.id} itemType={item.type === "opportunity" ? "opportunity" : item.type} />
                </div>

                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{item.description}</p>

                <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-[11px] text-muted-foreground">
                  {item.type === "circle" ? <Users className="h-3 w-3 shrink-0" /> : item.type === "event" ? <Calendar className="h-3 w-3 shrink-0" /> : item.type === "deal" ? <MapPin className="h-3 w-3 shrink-0" /> : <BriefcaseBusiness className="h-3 w-3 shrink-0" />}
                  <span className="truncate">{item.meta}</span>
                </p>

                <div className="mt-1.5 flex max-w-full flex-wrap gap-1 overflow-hidden">
                  {item.badges.map((badge, index) => (
                    <span
                      key={badge}
                      className={`inline-flex max-w-full items-center truncate rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                        index === 0
                          ? item.type === "circle"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            : "chip-primary"
                          : ""
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                  {item.tags.map((tag) => (
                    <span key={tag} className={`inline-flex max-w-full items-center truncate rounded-full px-1.5 py-0.5 text-[11px] font-medium ${tagClass(tag)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
    </div>
  );
}
