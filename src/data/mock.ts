export type SocialLinks = {
  website?: string;
  luma?: string;
  tickets?: string;
  instagram?: string;
  linkedin?: string;
  line?: string;
  discord?: string;
};

export type SocialLinksVisibility = {
  line?: "everyone" | "members";
  discord?: "everyone" | "members";
};

export type Circle = {
  id: string;
  name: string;
  category: string;
  description: string;
  members: number;
  activity: "Daily" | "Weekly" | "Monthly" | "Occasionally";
  englishFriendly: boolean;
  emoji: string;
  tags: string[];
  university?: string;
  country?: string;
  primaryLanguage?: string;
  vibe?: string;
  recruiting?: boolean;
  recruitingPeriod?: string;
  recruitingConditions?: string;
  membershipFee?: string;
  howToJoin?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  socialLinksVisibility?: SocialLinksVisibility;
};

export type EventItem = {
  id: string;
  title: string;
  category: "Social" | "Career" | "Hackathon" | "Networking";
  date: string;
  location: string;
  description?: string;
  emoji: string;
  going: number;
  tags: string[];
  cost?: string;
  primaryLanguage?: string;
  ownerId?: string;
  startDate?: string;
  updatedAt?: string;
  socialLinks?: SocialLinks;
  circleIds?: string[];
  online?: boolean;
  approvalRequired?: boolean;
  howToJoin?: string;
  recurrence?: "weekly";
  cancelledDates?: string[]; // YYYY-MM-DD
  imageUrl?: string;
};

export type Deal = {
  id: string;
  brand: string;
  title: string;
  category: "Food & Drink" | "Technology" | "Fashion" | "Travel" | "Entertainment" | "Education" | "Beauty & Wellness" | "Lifestyle" | "Services" | "Careers" | "Other";
  originalPrice?: string;
  newPrice?: string;
  saleEnd?: string;
  imageUrl?: string;
  description?: string;
  studentOnly: boolean;
  mode: "Online" | "In-Person" | "Both";
  socialLinks?: import("./mock").SocialLinks;
};

export type Job = {
  id: string;
  company: string;
  role: string;
  type: "Shukatsu" | "Baito" | "Opportunity";
  location: string;
  tags: string[];
  emoji: string;
};

export type Guide = {
  id: string;
  title: string;
  section: "Housing" | "Admin" | "Daily Life";
  excerpt: string;
  emoji: string;
  readTime: string;
};

export const circles: Circle[] = [
  { id: "c1", name: "Tokyo Tech Society", category: "Technology", description: "Hackathons, side projects, and AI study sessions every week.", members: 248, activity: "Weekly", englishFriendly: true, emoji: "💻", tags: ["Data Science and AI", "Computer Science"] },
  { id: "c2", name: "Waseda Jazz Club", category: "Arts", description: "Weekly jam sessions in Takadanobaba. All levels welcome.", members: 86, activity: "Weekly", englishFriendly: true, emoji: "🎷", tags: ["Music"] },
  { id: "c3", name: "Keio Finance Circle", category: "Business / Career", description: "Markets, IB prep, and case competitions.", members: 312, activity: "Weekly", englishFriendly: false, emoji: "📈", tags: ["Finance and Economics"] },
  { id: "c4", name: "Kyoto Hiking Crew", category: "Sports", description: "Monthly hikes around Kansai mountains.", members: 142, activity: "Monthly", englishFriendly: true, emoji: "🥾", tags: ["Outdoors and Adventure", "Travel"] },
  { id: "c5", name: "International Film Society", category: "Arts", description: "Screenings & discussions in English and Japanese.", members: 97, activity: "Monthly", englishFriendly: true, emoji: "🎬", tags: ["Movies", "Japanese Culture"] },
  { id: "c6", name: "Todai Robotics", category: "Technology", description: "Build, compete, repeat. Robocon every spring.", members: 64, activity: "Weekly", englishFriendly: false, emoji: "🤖", tags: ["Robotics and Hardware"] },
];

export const events: EventItem[] = [
  // Upcoming
  { id: "e1", title: "International Welcome Mixer", category: "Social", date: "Fri, May 8 · 7:00 PM – 10:00 PM", location: "Shibuya", emoji: "🥂", going: 124, tags: ["international-friendly", "free"], startDate: "2026-05-08T19:00:00.000Z" },
  { id: "e2", title: "Spring Career Forum 2026", category: "Career", date: "Sat, May 16 · 10:00 AM – 6:00 PM", location: "Tokyo Big Sight", emoji: "💼", going: 1820, tags: ["shukatsu", "tech", "finance"], startDate: "2026-05-16T01:00:00.000Z" },
  { id: "e3", title: "48h AI Hackathon", category: "Hackathon", date: "Sat, May 23 · 9:00 AM – Mon, May 25 · 9:00 AM", location: "Roppongi Hills", emoji: "⚡", going: 312, tags: ["coding", "ai", "prizes"], startDate: "2026-05-23T00:00:00.000Z" },
  { id: "e4", title: "Startup Founders Meetup", category: "Networking", date: "Wed, May 13 · 6:30 PM – 9:00 PM", location: "Otemachi", emoji: "🚀", going: 78, tags: ["startup", "networking"], startDate: "2026-05-13T09:30:00.000Z" },
  { id: "e6", title: "Goldman Sachs Info Session", category: "Career", date: "Tue, May 12 · 7:00 PM – 8:30 PM", location: "Online", emoji: "🏦", going: 430, tags: ["finance", "shukatsu"], startDate: "2026-05-12T10:00:00.000Z" },
  // Past
  { id: "e5", title: "Hanami Picnic @ Yoyogi", category: "Social", date: "Sun, Apr 5 · 12:00 PM – 5:00 PM", location: "Yoyogi Park", emoji: "🌸", going: 243, tags: ["outdoors", "free"], startDate: "2026-04-05T03:00:00.000Z" },
  { id: "e7", title: "Spring Networking Night", category: "Networking", date: "Fri, Apr 18 · 7:00 PM – 10:00 PM", location: "Ginza", emoji: "🤝", going: 91, tags: ["networking", "Career and Networking"], startDate: "2026-04-18T10:00:00.000Z" },
  { id: "e8", title: "Web3 & Crypto Workshop", category: "Hackathon", date: "Sat, Apr 26 · 10:00 AM – 6:00 PM", location: "Shibuya Stream", emoji: "🔗", going: 178, tags: ["Computer Science", "Technology"], startDate: "2026-04-26T01:00:00.000Z" },
  { id: "e9", title: "JLPT N2 Study Kickoff", category: "Social", date: "Sun, Apr 13 · 2:00 PM – 5:00 PM", location: "Waseda University", emoji: "📚", going: 64, tags: ["Language Exchange", "Learn Japanese"], startDate: "2026-04-13T05:00:00.000Z" },
  { id: "e10", title: "Sakura Run 5K", category: "Social", date: "Sun, Mar 29 · 8:00 AM – 11:00 AM", location: "Shinjuku Gyoen", emoji: "🏃", going: 312, tags: ["Fitness and Training", "Outdoors and Adventure"], startDate: "2026-03-28T23:00:00.000Z" },
  { id: "e11", title: "Tokyo Intern Fair", category: "Career", date: "Sat, Mar 14 · 10:00 AM – 5:00 PM", location: "Tokyo International Forum", emoji: "💼", going: 2100, tags: ["Career and Networking", "Business / Career"], startDate: "2026-03-14T01:00:00.000Z" },
  { id: "e12", title: "Game Jam 24h", category: "Hackathon", date: "Sat, Mar 7 · 10:00 AM – Sun, Mar 8 · 10:00 AM", location: "Akihabara", emoji: "🎮", going: 88, tags: ["Video Games", "Gaming"], startDate: "2026-03-07T01:00:00.000Z" },
];

export const deals: Deal[] = [
  { id: "d1", brand: "Ichiran Ramen", title: "20% off with student ID", category: "Food & Drink", originalPrice: "¥1,200", newPrice: "¥960", studentOnly: true, mode: "In-Person", description: "Show your student ID at any Ichiran location for 20% off your meal." },
  { id: "d2", brand: "Uniqlo", title: "Student day — 10% off all items", category: "Fashion", studentOnly: true, mode: "Both", description: "Every Tuesday is student day at Uniqlo. Present a valid student card at the register." },
  { id: "d3", brand: "Apple Education", title: "Up to ¥24,000 off MacBook", category: "Technology", originalPrice: "¥198,800", newPrice: "¥174,800", studentOnly: true, mode: "Online", description: "Apple's education store offers exclusive pricing on Macs, iPads, and accessories for enrolled students." },
  { id: "d4", brand: "Starbucks", title: "Free size upgrade for students", category: "Food & Drink", studentOnly: true, mode: "In-Person", description: "Get a free size upgrade on any handcrafted beverage with a student ID." },
  { id: "d5", brand: "Spotify Premium", title: "¥480/month student plan", category: "Entertainment", originalPrice: "¥980/month", newPrice: "¥480/month", studentOnly: true, mode: "Online", description: "Half-price Spotify Premium for verified students. Renew annually with a valid student email." },
  { id: "d6", brand: "Beams", title: "15% off select items", category: "Fashion", studentOnly: false, mode: "In-Person", description: "15% off select seasonal items at all Beams stores. No student ID required — just show the coupon." },
];

export const jobs: Job[] = [
  { id: "j1", company: "Mercari", role: "Software Engineer Intern", type: "Shukatsu", location: "Roppongi · Hybrid", tags: ["tech", "internship", "english-ok"], emoji: "🛍️" },
  { id: "j2", company: "Rakuten", role: "Product Management New Grad", type: "Shukatsu", location: "Setagaya", tags: ["product", "newgrad"], emoji: "🛒" },
  { id: "j3", company: "Starbucks Roppongi", role: "Barista (Evenings)", type: "Baito", location: "Roppongi", tags: ["english-ok", "flexible"], emoji: "☕" },
  { id: "j4", company: "GaijinPot", role: "Content Writer (Part-time)", type: "Baito", location: "Remote", tags: ["english", "writing"], emoji: "✍️" },
  { id: "j5", company: "MEXT", role: "Scholarship for International Students", type: "Opportunity", location: "Nationwide", tags: ["scholarship", "international"], emoji: "🎓" },
  { id: "j6", company: "TechCrunch Tokyo", role: "Student Pitch Competition", type: "Opportunity", location: "Shibuya", tags: ["startup", "prize"], emoji: "🏆" },
];

export const guides: Guide[] = [
  { id: "g1", title: "Finding an apartment in Tokyo", section: "Housing", excerpt: "Key money, guarantor companies, and the foreigner-friendly listings worth bookmarking.", emoji: "🏠", readTime: "6 min" },
  { id: "g2", title: "Opening a Japanese bank account", section: "Admin", excerpt: "Compare Shinsei, JP Post, and Sony Bank — and which work best as a student.", emoji: "🏦", readTime: "5 min" },
  { id: "g3", title: "National pension & exemption", section: "Admin", excerpt: "Yes, you have to enroll. No, you probably don't have to pay yet.", emoji: "📋", readTime: "4 min" },
  { id: "g4", title: "Cheap eats near every major campus", section: "Daily Life", excerpt: "Where to grab lunch under ¥600 in Waseda, Hongo, Mita and beyond.", emoji: "🍱", readTime: "7 min" },
  { id: "g5", title: "Residence card & moving notifications", section: "Admin", excerpt: "The 14-day rule and what happens if you miss it.", emoji: "🪪", readTime: "3 min" },
  { id: "g6", title: "Train pass (teikiken) explained", section: "Daily Life", excerpt: "Save thousands per month with a commuter pass. Here's how to buy one.", emoji: "🚆", readTime: "4 min" },
];
