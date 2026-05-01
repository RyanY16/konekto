export const CAREER_FIELDS = [
  "Technology / Software",
  "Finance / Banking",
  "Consulting",
  "Engineering",
  "Medicine / Healthcare",
  "Research / Academia",
  "Law",
  "Business / Entrepreneurship",
  "Design / Creative",
  "Marketing / PR",
  "Media / Journalism",
  "Education",
  "Government / Policy",
  "Social Work / NGO",
  "Arts / Entertainment",
  "Architecture",
  "Hospitality / Tourism",
  "Other",
] as const;

export type CareerField = (typeof CAREER_FIELDS)[number];

export type InterestGroup = { label: string; items: readonly string[] };

export const INTEREST_GROUPS: readonly InterestGroup[] = [
  {
    label: "Tech",
    items: ["AI / Machine Learning", "Software Engineering", "Web Development", "Data Science", "Cybersecurity", "Robotics", "Game Development", "Blockchain / Web3"],
  },
  {
    label: "Business & Finance",
    items: ["Finance / Investment", "Startups / Entrepreneurship", "Consulting", "Marketing", "E-commerce"],
  },
  {
    label: "Health & Wellness",
    items: ["Gym / Fitness", "Hiking / Outdoors", "Yoga / Meditation", "Nutrition", "Sports"],
  },
  {
    label: "Arts & Culture",
    items: ["Music", "Film", "Anime / Manga", "Photography", "Design / Art", "Writing", "Gaming"],
  },
  {
    label: "Social & Languages",
    items: ["Language Learning", "Japanese Culture", "Volunteering", "Networking", "Travel", "Food"],
  },
  {
    label: "Research & Academia",
    items: ["Research", "Politics / Policy", "Law", "Education", "Medicine / Healthcare"],
  },
] as const;

export const INTERESTS = INTEREST_GROUPS.flatMap((g) => g.items);

export const CIRCLE_CATEGORIES = [
  "Tech", "Music", "Career", "Outdoors", "Arts", "Sports",
  "Culture", "Social", "Academic", "Health", "Gaming", "Food", "Language", "Other",
] as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  Tech: "💻",
  Music: "🎵",
  Career: "💼",
  Outdoors: "🥾",
  Arts: "🎨",
  Sports: "⚽",
  Culture: "🏯",
  Social: "🤝",
  Academic: "📚",
  Health: "🏃",
  Gaming: "🎮",
  Food: "🍜",
  Language: "🗣️",
  Other: "👥",
};

export const ACTIVITY_LEVELS = ["Daily", "Weekly", "Monthly", "Occasionally"] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const COMMITMENT_LEVELS = ["Casual", "Regular", "Serious"] as const;
export type CommitmentLevel = (typeof COMMITMENT_LEVELS)[number];

export const GOALS = [
  "Find an internship",
  "Land a full-time job",
  "Shukatsu (就活)",
  "Start a company",
  "Publish research",
  "Make international friends",
  "Improve Japanese",
  "Practice English",
  "Join more circles",
  "Network with professionals",
  "Learn new skills",
  "Study abroad experience",
  "Enjoy student life",
  "Build a portfolio",
] as const;

export type Goal = (typeof GOALS)[number];
