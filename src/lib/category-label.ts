import { CATEGORY_EMOJI, DEAL_CATEGORY_EMOJI } from "@/data/profile-options";

const JA_CATEGORY_LABELS: Record<string, string> = {
  All: "すべてのカテゴリ",
  Technology: "テクノロジー",
  "Business / Career": "ビジネス・キャリア",
  "International / Cultural Exchange": "国際交流・文化交流",
  Sports: "スポーツ",
  Arts: "アート",
  Gaming: "ゲーム",
  Community: "コミュニティ",
  Academic: "学術",
  Lifestyle: "ライフスタイル",
  Social: "交流",
  Career: "キャリア",
  Hackathon: "ハッカソン",
  Workshop: "ワークショップ",
  Casual: "カジュアル",
  Travel: "旅行",
  Scholarship: "奨学金",
  "Part-time Job": "アルバイト",
  Internship: "インターン",
  "Study Abroad": "留学",
  Research: "研究",
  Competition: "コンペ",
  Grant: "助成金",
  Volunteer: "ボランティア",
  "Career Event": "キャリアイベント",
  "Food & Drink": "グルメ",
  Fashion: "ファッション",
  Entertainment: "エンタメ",
  Education: "教育",
  "Beauty & Wellness": "美容・ウェルネス",
  Services: "サービス",
  Careers: "キャリア",
  Other: "その他",
};

export function categoryLabel(category: string, language?: string): string {
  const label = language?.startsWith("ja")
    ? JA_CATEGORY_LABELS[category] ?? category
    : category === "All" ? "All categories" : category;
  const emoji = category === "All" ? "" : (CATEGORY_EMOJI[category] ?? DEAL_CATEGORY_EMOJI[category] ?? "");
  if (!emoji) return label;
  return `${emoji} ${label}`;
}
