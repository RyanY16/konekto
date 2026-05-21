// Category → gradient pairs (Tailwind CSS classes)
const EVENT_CATEGORY_GRADIENTS: Record<string, string> = {
  Social:    "from-pink-400/30 to-rose-500/30",
  Career:    "from-blue-400/30 to-indigo-500/30",
  Hackathon: "from-violet-400/30 to-purple-600/30",
  Workshop:  "from-cyan-400/30 to-teal-500/30",
  Casual:    "from-amber-400/30 to-orange-400/30",
};

export function eventGradient(category: string): string {
  return EVENT_CATEGORY_GRADIENTS[category] ?? "from-primary/20 to-accent/20";
}

const DEAL_CATEGORY_GRADIENTS: Record<string, string> = {
  "Food & Drink": "from-yellow-400/30 to-orange-400/30",
  Fashion:        "from-pink-400/30 to-rose-500/30",
  Tech:           "from-blue-400/30 to-indigo-500/30",
  Entertainment:  "from-violet-400/30 to-purple-600/30",
  Transport:      "from-cyan-400/30 to-blue-500/30",
  Lifestyle:      "from-green-400/30 to-teal-500/30",
};

export function dealGradient(category: string): string {
  return DEAL_CATEGORY_GRADIENTS[category] ?? "from-primary/20 to-accent/20";
}

export function circlePlaceholderUrl(name: string): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundType=gradientLinear&backgroundColor=0081FA,745AF4&fontFamily=Inter&fontSize=40&fontWeight=700&textColor=ffffff`;
}
