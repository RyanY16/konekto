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

export { TAG_GROUPS as INTEREST_GROUPS } from "@/data/tags";

import { TAGS } from "@/data/tags";
export const INTERESTS = TAGS;

export const CIRCLE_CATEGORIES = [
  "Technology",
  "Business / Career",
  "International / Cultural Exchange",
  "Sports",
  "Arts",
  "Gaming",
  "Community",
  "Academic",
  "Lifestyle",
] as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  "Technology":                        "💻",
  "Business / Career":                 "💼",
  "International / Cultural Exchange": "🌏",
  "Sports":                            "⚽",
  "Arts":                              "🎨",
  "Gaming":                            "🎮",
  "Community":                         "🤝",
  "Academic":                          "📚",
  "Lifestyle":                         "🌿",
};

export const ACTIVITY_LEVELS = ["Daily", "Weekly", "Monthly", "Occasionally"] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export type Nationality = { name: string; flag: string };

export const NATIONALITIES: Nationality[] = [
  { name: "Japanese", flag: "🇯🇵" },
  { name: "Chinese", flag: "🇨🇳" },
  { name: "Korean", flag: "🇰🇷" },
  { name: "American", flag: "🇺🇸" },
  { name: "British", flag: "🇬🇧" },
  { name: "Australian", flag: "🇦🇺" },
  { name: "Canadian", flag: "🇨🇦" },
  { name: "Indian", flag: "🇮🇳" },
  { name: "Taiwanese", flag: "🇹🇼" },
  { name: "Vietnamese", flag: "🇻🇳" },
  { name: "Thai", flag: "🇹🇭" },
  { name: "Indonesian", flag: "🇮🇩" },
  { name: "Malaysian", flag: "🇲🇾" },
  { name: "Filipino", flag: "🇵🇭" },
  { name: "Singaporean", flag: "🇸🇬" },
  { name: "Bangladeshi", flag: "🇧🇩" },
  { name: "Pakistani", flag: "🇵🇰" },
  { name: "Nepalese", flag: "🇳🇵" },
  { name: "Sri Lankan", flag: "🇱🇰" },
  { name: "German", flag: "🇩🇪" },
  { name: "French", flag: "🇫🇷" },
  { name: "Italian", flag: "🇮🇹" },
  { name: "Spanish", flag: "🇪🇸" },
  { name: "Dutch", flag: "🇳🇱" },
  { name: "Swedish", flag: "🇸🇪" },
  { name: "Norwegian", flag: "🇳🇴" },
  { name: "Danish", flag: "🇩🇰" },
  { name: "Finnish", flag: "🇫🇮" },
  { name: "Swiss", flag: "🇨🇭" },
  { name: "Belgian", flag: "🇧🇪" },
  { name: "Austrian", flag: "🇦🇹" },
  { name: "Polish", flag: "🇵🇱" },
  { name: "Czech", flag: "🇨🇿" },
  { name: "Hungarian", flag: "🇭🇺" },
  { name: "Romanian", flag: "🇷🇴" },
  { name: "Greek", flag: "🇬🇷" },
  { name: "Portuguese", flag: "🇵🇹" },
  { name: "Russian", flag: "🇷🇺" },
  { name: "Ukrainian", flag: "🇺🇦" },
  { name: "Turkish", flag: "🇹🇷" },
  { name: "Israeli", flag: "🇮🇱" },
  { name: "Saudi Arabian", flag: "🇸🇦" },
  { name: "Emirati", flag: "🇦🇪" },
  { name: "Iranian", flag: "🇮🇷" },
  { name: "Egyptian", flag: "🇪🇬" },
  { name: "Nigerian", flag: "🇳🇬" },
  { name: "Kenyan", flag: "🇰🇪" },
  { name: "South African", flag: "🇿🇦" },
  { name: "Ghanaian", flag: "🇬🇭" },
  { name: "Ethiopian", flag: "🇪🇹" },
  { name: "Brazilian", flag: "🇧🇷" },
  { name: "Mexican", flag: "🇲🇽" },
  { name: "Argentine", flag: "🇦🇷" },
  { name: "Colombian", flag: "🇨🇴" },
  { name: "Chilean", flag: "🇨🇱" },
  { name: "Peruvian", flag: "🇵🇪" },
  { name: "New Zealander", flag: "🇳🇿" },
  { name: "Other", flag: "🌍" },
];

export const FLUENCY_LEVELS = ["Native", "Fluent", "Advanced", "Intermediate", "Basic"] as const;
export type FluencyLevel = (typeof FLUENCY_LEVELS)[number];

export type Language = { name: string; flag: string };

export const LANGUAGES: Language[] = [
  { name: "Japanese", flag: "🇯🇵" },
  { name: "English", flag: "🇬🇧" },
  { name: "Mandarin Chinese", flag: "🇨🇳" },
  { name: "Korean", flag: "🇰🇷" },
  { name: "Spanish", flag: "🇪🇸" },
  { name: "French", flag: "🇫🇷" },
  { name: "German", flag: "🇩🇪" },
  { name: "Portuguese", flag: "🇵🇹" },
  { name: "Italian", flag: "🇮🇹" },
  { name: "Russian", flag: "🇷🇺" },
  { name: "Arabic", flag: "🇸🇦" },
  { name: "Hindi", flag: "🇮🇳" },
  { name: "Bengali", flag: "🇧🇩" },
  { name: "Turkish", flag: "🇹🇷" },
  { name: "Vietnamese", flag: "🇻🇳" },
  { name: "Thai", flag: "🇹🇭" },
  { name: "Indonesian", flag: "🇮🇩" },
  { name: "Malay", flag: "🇲🇾" },
  { name: "Dutch", flag: "🇳🇱" },
  { name: "Polish", flag: "🇵🇱" },
  { name: "Swedish", flag: "🇸🇪" },
  { name: "Norwegian", flag: "🇳🇴" },
  { name: "Danish", flag: "🇩🇰" },
  { name: "Finnish", flag: "🇫🇮" },
  { name: "Greek", flag: "🇬🇷" },
  { name: "Romanian", flag: "🇷🇴" },
  { name: "Czech", flag: "🇨🇿" },
  { name: "Hungarian", flag: "🇭🇺" },
  { name: "Ukrainian", flag: "🇺🇦" },
  { name: "Tagalog", flag: "🇵🇭" },
  { name: "Cantonese", flag: "🇭🇰" },
  { name: "Taiwanese Mandarin", flag: "🇹🇼" },
  { name: "Swahili", flag: "🇰🇪" },
  { name: "Other", flag: "🌐" },
];

export type GoalGroup = { label: string; items: readonly string[] };

export const GOAL_GROUPS: readonly GoalGroup[] = [
  {
    label: "Career",
    items: ["Find an internship", "Land a full-time job", "Shukatsu (就活)", "Start a company", "Build a portfolio", "Network with professionals"],
  },
  {
    label: "Academic",
    items: ["Publish research", "Learn new skills", "Study abroad experience", "Build a portfolio"],
  },
  {
    label: "Social & Culture",
    items: ["Make international friends", "Join more circles", "Enjoy student life", "Improve Japanese", "Practice English"],
  },
] as const;

export const GOALS = GOAL_GROUPS.flatMap((g) => g.items).filter((v, i, a) => a.indexOf(v) === i) as unknown as readonly string[];

export const COUNTRIES = [
  "Japan",
  "Australia", "Brazil", "Canada", "China", "France", "Germany",
  "India", "Indonesia", "Italy", "Malaysia", "Mexico", "Netherlands",
  "New Zealand", "Philippines", "Singapore", "South Korea", "Spain",
  "Taiwan", "Thailand", "United Kingdom", "United States", "Vietnam",
  "Other",
] as const;

export type Goal = string;
