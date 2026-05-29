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

export const TAG_GROUP_LABEL_JA: Record<string, string> = {
  "Technology": "テクノロジー",
  "Business / Career": "ビジネス・キャリア",
  "International / Cultural Exchange": "国際交流・文化交流",
  "Sports": "スポーツ",
  "Arts": "アート",
  "Gaming": "ゲーム",
  "Community": "コミュニティ",
  "Academic": "学問",
  "Lifestyle": "ライフスタイル",
};

export const TAG_LABEL_JA: Record<string, string> = {
  "Computer Science": "コンピューターサイエンス",
  "Data Science and AI": "データサイエンス・AI",
  "Cybersecurity": "サイバーセキュリティ",
  "Robotics and Hardware": "ロボット・ハードウェア",
  "Hackathons": "ハッカソン",
  "Consulting": "コンサルティング",
  "Finance and Economics": "金融・経済",
  "Startups": "スタートアップ",
  "Marketing": "マーケティング",
  "Content Creation": "コンテンツ制作",
  "Career and Networking": "キャリア・ネットワーキング",
  "Learn English": "英語学習",
  "Learn Japanese": "日本語学習",
  "Cultural Exchange": "文化交流",
  "Language Exchange": "言語交換",
  "Fitness and Training": "フィットネス・トレーニング",
  "Team Sports": "チームスポーツ",
  "Martial Arts": "武道・格闘技",
  "Water Sports": "ウォータースポーツ",
  "Winter Sports": "ウィンタースポーツ",
  "Outdoors and Adventure": "アウトドア・冒険",
  "Anime and Manga": "アニメ・漫画",
  "Cosplay": "コスプレ",
  "Movies": "映画",
  "Literature and Writing": "文学・執筆",
  "Theatre and Performance": "演劇・パフォーマンス",
  "Dance": "ダンス",
  "Music": "音楽",
  "Photography and Videography": "写真・映像制作",
  "Japanese Culture": "日本文化",
  "Visual Arts and Design": "ビジュアルアート・デザイン",
  "Video Games": "ビデオゲーム",
  "eSports": "eスポーツ",
  "Rhythm Games": "リズムゲーム",
  "Vtubers": "Vtuber",
  "Board Games": "ボードゲーム",
  "Trading Card Games": "トレーディングカードゲーム",
  "Volunteering": "ボランティア",
  "Activism": "社会活動",
  "Community Events": "コミュニティイベント",
  "Sustainability": "サステナビリティ",
  "LGBTQ+": "LGBTQ+",
  "Religion": "宗教",
  "Science": "科学",
  "Engineering": "工学",
  "Social Sciences": "社会科学",
  "Medicine": "医学",
  "Law and Politics": "法律・政治",
  "Education": "教育",
  "Cooking": "料理",
  "Fashion": "ファッション",
  "Travel": "旅行",
  "Beauty": "美容",
  "Cars": "車",
  "Food and Drink": "食べ物・飲み物",
  "Karaoke": "カラオケ",
  "Café": "カフェ",
};

function isJapanese(language?: string) {
  return language?.toLowerCase().startsWith("ja");
}

export function tagLabel(tag: string, language?: string): string {
  return isJapanese(language) ? TAG_LABEL_JA[tag] ?? tag : tag;
}

export function tagGroupLabel(label: string, language?: string): string {
  return isJapanese(language) ? TAG_GROUP_LABEL_JA[label] ?? label : label;
}

const TAG_ORDER = new Map(TAGS.map((t, i) => [t, i]));

export function filterValidTags(tags: string[]): string[] {
  return tags
    .filter((t) => VALID_TAGS.has(t))
    .sort((a, b) => (TAG_ORDER.get(a) ?? 999) - (TAG_ORDER.get(b) ?? 999));
}

const TAG_ALIASES: Partial<Record<string, string[]>> = {
  "Computer Science": ["coding", "programming", "software", "developer", "web", "app", "computer science"],
  "Data Science and AI": ["ai", "artificial intelligence", "machine learning", "ml", "data science", "analytics"],
  "Cybersecurity": ["security", "cyber", "ctf", "hacking"],
  "Robotics and Hardware": ["robot", "robotics", "hardware", "electronics", "iot"],
  "Hackathons": ["hackathon", "hackathons", "buildathon"],
  "Consulting": ["consulting", "case interview", "case competition"],
  "Finance and Economics": ["finance", "investment", "banking", "markets", "economics", "trading"],
  "Startups": ["startup", "startups", "founder", "entrepreneurship", "venture"],
  "Marketing": ["marketing", "branding", "growth"],
  "Content Creation": ["content", "creator", "youtube", "media", "sns"],
  "Career and Networking": ["career", "networking", "shukatsu", "internship", "recruiting"],
  "Learn English": ["english", "learn english", "english conversation"],
  "Learn Japanese": ["japanese", "learn japanese", "jlpt"],
  "Cultural Exchange": ["international", "culture", "cultural exchange", "exchange"],
  "Language Exchange": ["language exchange", "language", "bilingual"],
  "Fitness and Training": ["fitness", "training", "gym", "workout", "running"],
  "Team Sports": ["football", "soccer", "basketball", "baseball", "volleyball", "team sport"],
  "Martial Arts": ["martial", "karate", "judo", "kendo", "aikido"],
  "Water Sports": ["swim", "surf", "diving", "water sport"],
  "Winter Sports": ["ski", "snowboard", "winter sport"],
  "Outdoors and Adventure": ["hiking", "camping", "outdoor", "adventure", "mountain"],
  "Anime and Manga": ["anime", "manga"],
  "Cosplay": ["cosplay"],
  "Movies": ["movie", "film", "cinema"],
  "Literature and Writing": ["literature", "writing", "book", "poetry"],
  "Theatre and Performance": ["theatre", "theater", "performance", "acting", "drama"],
  "Dance": ["dance", "dancing"],
  "Music": ["music", "band", "jazz", "orchestra", "choir", "song"],
  "Photography and Videography": ["photo", "photography", "videography", "video", "camera"],
  "Japanese Culture": ["japanese culture", "traditional", "tea ceremony", "kimono"],
  "Visual Arts and Design": ["art", "design", "drawing", "painting", "illustration"],
  "Video Games": ["video game", "gaming", "game"],
  "eSports": ["esports", "e-sports", "competitive gaming"],
  "Rhythm Games": ["rhythm game"],
  "Vtubers": ["vtuber", "vtubers"],
  "Board Games": ["board game", "tabletop"],
  "Trading Card Games": ["trading card", "tcg", "card game"],
  "Volunteering": ["volunteer", "volunteering"],
  "Activism": ["activism", "advocacy"],
  "Community Events": ["community", "meetup", "event"],
  "Sustainability": ["sustainability", "environment", "climate"],
  "LGBTQ+": ["lgbt", "lgbtq", "queer"],
  "Religion": ["religion", "faith", "church", "temple"],
  "Science": ["science", "research"],
  "Engineering": ["engineering", "engineer"],
  "Social Sciences": ["social science", "sociology", "psychology"],
  "Medicine": ["medicine", "medical", "healthcare"],
  "Law and Politics": ["law", "politics", "policy", "debate"],
  "Education": ["education", "teaching", "tutoring"],
  "Cooking": ["cooking", "cook", "food"],
  "Fashion": ["fashion", "style"],
  "Travel": ["travel", "trip"],
  "Beauty": ["beauty", "makeup", "cosmetics"],
  "Cars": ["car", "cars", "automotive"],
  "Food and Drink": ["food", "drink", "cafe", "restaurant", "ramen"],
  "Karaoke": ["karaoke"],
  "Café": ["cafe", "coffee", "café"],
};

function normaliseText(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferRelevantTags(input: {
  tags?: unknown;
  text?: Array<string | null | undefined>;
  limit?: number;
}): string[] {
  const rawTags = Array.isArray(input.tags)
    ? input.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : [];
  const exactByNormalised = new Map(TAGS.map((tag) => [normaliseText(tag), tag]));
  const exact = rawTags
    .map((tag) => exactByNormalised.get(normaliseText(tag)))
    .filter((tag): tag is string => Boolean(tag));

  const searchable = normaliseText([...(input.text ?? []), ...rawTags].filter(Boolean).join(" "));
  if (!searchable && exact.length === 0) return [];

  const inferred = TAGS
    .map((tag) => {
      const tagText = normaliseText(tag);
      let score = exact.includes(tag) ? 100 : 0;
      if (searchable.includes(tagText)) score += 10;
      for (const token of tagText.split(" ")) {
        if (token.length >= 4 && searchable.includes(token)) score += 1;
      }
      for (const alias of TAG_ALIASES[tag] ?? []) {
        if (searchable.includes(normaliseText(alias))) score += 6;
      }
      return { tag, score };
    })
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score || (TAG_ORDER.get(a.tag) ?? 999) - (TAG_ORDER.get(b.tag) ?? 999))
    .slice(0, input.limit ?? 5)
    .map((item) => item.tag);

  return filterValidTags([...new Set([...exact, ...inferred])]);
}

// Keep these aliases so existing imports don't break
export const CIRCLE_TAG_GROUPS = TAG_GROUPS;

export default TAGS;
