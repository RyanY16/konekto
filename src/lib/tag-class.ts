const CATEGORY_COLOUR: Record<string, string> = {
  "Technology":                       "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Business / Career":                "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "International / Cultural Exchange":"bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "Sports":                           "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Arts":                             "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "Gaming":                           "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "Community":                        "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "Academic":                         "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "Lifestyle":                        "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

const TAG_CATEGORY: Record<string, string> = {
  // Technology
  "Computer Science":          "Technology",
  "Data Science and AI":       "Technology",
  "Cybersecurity":             "Technology",
  "Robotics and Hardware":     "Technology",
  "Hackathons":                "Technology",
  // Business / Career
  "Consulting":                "Business / Career",
  "Finance and Economics":     "Business / Career",
  "Startups":                  "Business / Career",
  "Marketing":                 "Business / Career",
  "Content Creation":          "Business / Career",
  "Career and Networking":     "Business / Career",
  // International / Cultural Exchange
  "Learn English":             "International / Cultural Exchange",
  "Learn Japanese":            "International / Cultural Exchange",
  "Cultural Exchange":         "International / Cultural Exchange",
  "Language Exchange":         "International / Cultural Exchange",
  // Sports
  "Fitness and Training":      "Sports",
  "Team Sports":               "Sports",
  "Martial Arts":              "Sports",
  "Water Sports":              "Sports",
  "Winter Sports":             "Sports",
  "Outdoors and Adventure":    "Sports",
  // Arts
  "Anime and Manga":           "Arts",
  "Cosplay":                   "Arts",
  "Movies":                    "Arts",
  "Literature and Writing":    "Arts",
  "Theatre and Performance":   "Arts",
  "Dance":                     "Arts",
  "Music":                     "Arts",
  "Photography and Videography":"Arts",
  "Japanese Culture":          "Arts",
  "Visual Arts and Design":    "Arts",
  // Gaming
  "Video Games":               "Gaming",
  "eSports":                   "Gaming",
  "Rhythm Games":              "Gaming",
  "Vtubers":                   "Gaming",
  "Board Games":               "Gaming",
  "Trading Card Games":        "Gaming",
  // Community
  "Volunteering":              "Community",
  "Activism":                  "Community",
  "Community Events":          "Community",
  "Sustainability":            "Community",
  "LGBTQ+":                    "Community",
  "Religion":                  "Community",
  // Academic
  "Science":                   "Academic",
  "Engineering":               "Academic",
  "Social Sciences":           "Academic",
  "Medicine":                  "Academic",
  "Law and Politics":          "Academic",
  "Education":                 "Academic",
  // Lifestyle
  "Cooking":                   "Lifestyle",
  "Fashion":                   "Lifestyle",
  "Travel":                    "Lifestyle",
  "Beauty":                    "Lifestyle",
  "Cars":                      "Lifestyle",
  "Food and Drink":            "Lifestyle",
  "Karaoke":                   "Lifestyle",
  "Café":                      "Lifestyle",
};

const DEFAULT = "bg-muted text-muted-foreground";

export function tagClass(tag: string): string {
  const category = TAG_CATEGORY[tag];
  return category ? CATEGORY_COLOUR[category] : DEFAULT;
}
