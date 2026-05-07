export const TAG_GROUPS = [
  {
    label: "Technology",
    items: ["Computer Science", "Data Science and AI", "Cybersecurity", "Robotics and Hardware", "Hackathons"],
  },
  {
    label: "Business / Career",
    items: ["Consulting", "Finance and Economics", "Startups", "Marketing", "Content Creation", "Career and Networking"],
  },
  {
    label: "International / Cultural Exchange",
    items: ["Learn English", "Learn Japanese", "Cultural Exchange", "Language Exchange"],
  },
  {
    label: "Sports",
    items: ["Fitness and Training", "Team Sports", "Martial Arts", "Water Sports", "Winter Sports", "Outdoors and Adventure"],
  },
  {
    label: "Arts",
    items: ["Anime and Manga", "Cosplay", "Movies", "Literature and Writing", "Theatre and Performance", "Dance", "Music", "Photography and Videography", "Japanese Culture", "Visual Arts and Design"],
  },
  {
    label: "Gaming",
    items: ["Video Games", "eSports", "Rhythm Games", "Vtubers", "Board Games", "Trading Card Games"],
  },
  {
    label: "Community",
    items: ["Volunteering", "Activism", "Community Events", "Sustainability", "LGBTQ+", "Religion"],
  },
  {
    label: "Academic",
    items: ["Science", "Engineering", "Social Sciences", "Medicine", "Law and Politics", "Education"],
  },
  {
    label: "Lifestyle",
    items: ["Cooking", "Fashion", "Travel", "Beauty", "Cars", "Food and Drink", "Karaoke", "Café"],
  },
] as const;

export const TAGS = TAG_GROUPS.flatMap((g) => g.items as readonly string[]);

export const VALID_TAGS = new Set(TAGS);

export function filterValidTags(tags: string[]): string[] {
  return tags.filter((t) => VALID_TAGS.has(t));
}

// Keep these aliases so existing imports don't break
export const CIRCLE_TAG_GROUPS = TAG_GROUPS;

export default TAGS;
