const TAG_COLOURS: Record<string, string> = {
  // ── Tech (blue) ──────────────────────────────────────────────────────────
  ai:                    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  coding:                "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  tech:                  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  engineering:           "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  research:              "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "software engineering":"bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "web development":     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "data science":        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  cybersecurity:         "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  robotics:              "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "game development":    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  blockchain:            "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  // ── Business & Finance (amber) ───────────────────────────────────────────
  finance:               "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  shukatsu:              "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  career:                "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  startup:               "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  startups:              "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  networking:            "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  consulting:            "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  marketing:             "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "e-commerce":          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  // ── Social & Community (green) ───────────────────────────────────────────
  "international-friendly": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "language-exchange":   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  volunteer:             "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  volunteering:          "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  free:                  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "language learning":   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "japanese culture":    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  travel:                "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  food:                  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  // ── Arts & Creative (purple) ─────────────────────────────────────────────
  music:                 "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  performance:           "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  film:                  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  design:                "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  photography:           "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  anime:                 "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  writing:               "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  gaming:                "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  // ── Outdoors & Health (teal) ─────────────────────────────────────────────
  outdoors:              "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  sports:                "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  wellness:              "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "gym":                 "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  hiking:                "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  yoga:                  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  nutrition:             "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  // ── Events & Competition (orange) ────────────────────────────────────────
  prizes:                "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  competition:           "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  workshop:              "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  // ── Food & Lifestyle (pink) ──────────────────────────────────────────────
  fashion:               "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  lifestyle:             "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  // ── Research & Academia (cyan) ───────────────────────────────────────────
  "study-group":         "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  politics:              "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  law:                   "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  education:             "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  medicine:              "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
};

const DEFAULT = "bg-muted text-muted-foreground";

export function tagClass(tag: string): string {
  const key = tag.toLowerCase().replace(/\s*\/.*$/, "").trim();
  return TAG_COLOURS[key] ?? DEFAULT;
}

