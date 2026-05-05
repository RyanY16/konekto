export const CIRCLE_TAG_GROUPS = [
  {
    label: "Tech",
    items: ["coding", "ai", "tech", "engineering", "research", "robotics", "blockchain", "cybersecurity"],
  },
  {
    label: "Business & Career",
    items: ["finance", "shukatsu", "career", "startup", "networking", "consulting", "marketing"],
  },
  {
    label: "Social & Community",
    items: ["international-friendly", "language-exchange", "volunteer", "free", "travel", "food", "japanese-culture"],
  },
  {
    label: "Arts & Creative",
    items: ["music", "performance", "film", "design", "photography", "anime", "writing", "gaming"],
  },
  {
    label: "Outdoors & Health",
    items: ["outdoors", "sports", "wellness", "hiking", "yoga"],
  },
  {
    label: "Events",
    items: ["competition", "prizes", "workshop", "hackathon"],
  },
  {
    label: "Lifestyle",
    items: ["fashion", "lifestyle", "study-group"],
  },
] as const;

export const TAGS = CIRCLE_TAG_GROUPS.flatMap((g) => g.items as readonly string[]);

export default TAGS;
