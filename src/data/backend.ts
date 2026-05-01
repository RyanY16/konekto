import { circles, deals, events, guides, jobs } from "@/data/mock";
import type { Circle, Deal, EventItem, Guide, Job } from "@/data/mock";
import { normalizeSocialLinks } from "@/lib/social-links";
import { toSlug } from "@/lib/slug";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase.types";

type PublicTable = keyof Database["public"]["Tables"];
type Row<T extends PublicTable> = Database["public"]["Tables"][T]["Row"];
type Insert<T extends PublicTable> = Database["public"]["Tables"][T]["Insert"];

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function assertSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
}

async function fromSupabase<TTable extends PublicTable, TItem>(
  table: TTable,
  fallback: TItem[],
  mapRow: (row: Row<TTable>) => TItem,
): Promise<TItem[]> {
  if (!supabase) return fallback;

  const { data, error } = await supabase.from(table).select("*").order("created_at");

  if (error || !data) {
    if (import.meta.env.DEV && error) {
      console.warn(`Supabase ${table} query failed; using mock data.`, error.message);
    }
    return fallback;
  }

  return data.map((row) => mapRow(row as Row<TTable>));
}

async function insertSupabase<TTable extends PublicTable, TItem>(
  table: TTable,
  values: Insert<TTable>,
  mapRow: (row: Row<TTable>) => TItem,
): Promise<TItem> {
  const client = assertSupabase();
  const { data, error } = await client.from(table).insert(values).select("*").single();

  if (error) throw new Error(error.message);
  return mapRow(data as Row<TTable>);
}

async function updateSupabase<TTable extends PublicTable, TItem>(
  table: TTable,
  id: string,
  values: Database["public"]["Tables"][TTable]["Update"],
  mapRow: (row: Row<TTable>) => TItem,
): Promise<TItem> {
  const client = assertSupabase();
  const { data, error } = await client
    .from(table)
    .update(values)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(
      `Could not update ${table} record. It may not exist in Supabase, or your Row Level Security policy denied the update.`,
    );
  }
  return mapRow(data as Row<TTable>);
}

async function deleteSupabase(table: PublicTable, id: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await client.from(table).delete().eq("id", id);

  if (error) throw new Error(error.message);
}

function mapCircle(row: Row<"circles">): Circle {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    members: row.members,
    activity: row.activity,
    englishFriendly: row.english_friendly,
    commitment: row.commitment,
    emoji: row.emoji,
    iconUrl: row.icon_url ?? undefined,
    ownerId: (row as any).owner_id ?? undefined,
    tags: row.tags ?? [],
    socialLinks: normalizeSocialLinks(row.social_links),
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function mapEvent(row: Row<"events">): EventItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: row.date,
    location: row.location,
    emoji: row.emoji,
    going: row.going,
    tags: row.tags ?? [],
    socialLinks: normalizeSocialLinks(row.social_links),
  };
}

function mapDeal(row: Row<"deals">): Deal {
  return {
    id: row.id,
    brand: row.brand,
    title: row.title,
    category: row.category,
    discount: row.discount,
    area: row.area,
    emoji: row.emoji,
    socialLinks: normalizeSocialLinks(row.social_links),
  };
}

function mapJob(row: Row<"jobs">): Job {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    type: row.type,
    location: row.location,
    tags: row.tags ?? [],
    emoji: row.emoji,
    socialLinks: normalizeSocialLinks(row.social_links),
  };
}

function mapGuide(row: Row<"guides">): Guide {
  return {
    id: row.id,
    title: row.title,
    section: row.section,
    excerpt: row.excerpt,
    emoji: row.emoji,
    readTime: row.read_time,
    socialLinks: normalizeSocialLinks(row.social_links),
  };
}

function findByHandle<T>(
  items: T[],
  handle: string,
  makeHandle: (item: T) => string,
  getId: (item: T) => string,
) {
  return items.find((item) => getId(item) === handle || makeHandle(item) === handle);
}

export function getCircleHandle(circle: Pick<Circle, "id" | "name">) {
  return toSlug(circle.name) || circle.id;
}

export function getEventHandle(event: Pick<EventItem, "id" | "title">) {
  return toSlug(event.title) || event.id;
}

export function getDealHandle(deal: Pick<Deal, "id" | "title">) {
  return toSlug(deal.title) || deal.id;
}

export function getJobHandle(job: Pick<Job, "id" | "company" | "role">) {
  return toSlug(`${job.company}-${job.role}`) || job.id;
}

export function getGuideHandle(guide: Pick<Guide, "id" | "title">) {
  return toSlug(guide.title) || guide.id;
}

export async function getCircles(): Promise<Circle[]> {
  return fromSupabase("circles", circles, mapCircle);
}

export async function getEvents(): Promise<EventItem[]> {
  return fromSupabase("events", events, mapEvent);
}

export async function getDeals(): Promise<Deal[]> {
  return fromSupabase("deals", deals, mapDeal);
}

export async function getJobs(): Promise<Job[]> {
  return fromSupabase("jobs", jobs, mapJob);
}

export async function getGuides(): Promise<Guide[]> {
  return fromSupabase("guides", guides, mapGuide);
}

export async function addCircle(
  input: Omit<Circle, "id" | "members" | "ownerId"> & { members?: number; ownerId?: string | null },
) {
  return insertSupabase(
    "circles",
    {
      id: newId("circle"),
      name: input.name,
      category: input.category,
      description: input.description,
      members: input.members ?? 1,
      activity: input.activity,
      english_friendly: input.englishFriendly,
      commitment: input.commitment,
      emoji: input.emoji,
      owner_id: input.ownerId ?? null,
      icon_url: input.iconUrl ?? null,
      tags: input.tags,
      social_links: input.socialLinks ?? {},
    },
    mapCircle,
  );
}

export async function updateCircle(
  id: string,
  input: Omit<Circle, "id" | "members"> & { members?: number },
) {
  return updateSupabase(
    "circles",
    id,
    {
      name: input.name,
      category: input.category,
      description: input.description,
      members: input.members,
      activity: input.activity,
      english_friendly: input.englishFriendly,
      commitment: input.commitment,
      emoji: input.emoji,
      icon_url: input.iconUrl ?? null,
      owner_id: input.ownerId ?? null,
      tags: input.tags,
      social_links: input.socialLinks ?? {},
    },
    mapCircle,
  );
}

export async function deleteCircle(id: string) {
  return deleteSupabase("circles", id);
}

export async function addEvent(input: Omit<EventItem, "id" | "going"> & { going?: number }) {
  return insertSupabase(
    "events",
    {
      id: newId("event"),
      title: input.title,
      category: input.category,
      date: input.date,
      location: input.location,
      emoji: input.emoji,
      going: input.going ?? 1,
      tags: input.tags,
      social_links: input.socialLinks ?? {},
    },
    mapEvent,
  );
}

export async function deleteEvent(id: string) {
  return deleteSupabase("events", id);
}

export async function addDeal(input: Omit<Deal, "id">) {
  return insertSupabase(
    "deals",
    {
      id: newId("deal"),
      brand: input.brand,
      title: input.title,
      category: input.category,
      discount: input.discount,
      area: input.area,
      emoji: input.emoji,
      social_links: input.socialLinks ?? {},
    },
    mapDeal,
  );
}

export async function deleteDeal(id: string) {
  return deleteSupabase("deals", id);
}

export async function addJob(input: Omit<Job, "id">) {
  return insertSupabase(
    "jobs",
    {
      id: newId("job"),
      company: input.company,
      role: input.role,
      type: input.type,
      location: input.location,
      tags: input.tags,
      emoji: input.emoji,
      social_links: input.socialLinks ?? {},
    },
    mapJob,
  );
}

export async function deleteJob(id: string) {
  return deleteSupabase("jobs", id);
}

export async function addGuide(input: Omit<Guide, "id">) {
  return insertSupabase(
    "guides",
    {
      id: newId("guide"),
      title: input.title,
      section: input.section,
      excerpt: input.excerpt,
      emoji: input.emoji,
      read_time: input.readTime,
      social_links: input.socialLinks ?? {},
    },
    mapGuide,
  );
}

export async function deleteGuide(id: string) {
  return deleteSupabase("guides", id);
}

export type UserProfile = {
  id: string;
  username: string | null;
  displayName: string;
  university: string;
  year: string;
  bio: string;
  avatarUrl: string | null;
  tags: string[];
  interests: string[];
  careerField: string;
  goals: string[];
};

function mapUser(row: Row<"users">): UserProfile {
  return {
    id: row.id,
    username: (row as any).username ?? null,
    displayName: row.display_name,
    university: row.university,
    year: row.year,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    tags: row.tags ?? [],
    interests: (row as any).interests ?? [],
    careerField: (row as any).career_field ?? "",
    goals: (row as any).goals ?? [],
  };
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return mapUser(data as unknown as Row<"users">);
}

export async function getProfilesByIds(ids: string[]): Promise<UserProfile[]> {
  if (!supabase || ids.length === 0) return [];
  const { data } = await supabase.from("users").select("*").in("id", ids);
  return (data ?? []).map((row) => mapUser(row as unknown as Row<"users">));
}

export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data } = await (supabase.from("users") as any).select("*").eq("username", username).maybeSingle();
  if (!data) return null;
  return mapUser(data as unknown as Row<"users">);
}

export async function upsertProfile(
  userId: string,
  input: Partial<Omit<UserProfile, "id">>,
): Promise<UserProfile> {
  const client = assertSupabase();

  const fields = {
    username: input.username ?? null,
    display_name: input.displayName ?? "",
    university: input.university ?? "",
    year: input.year ?? "",
    bio: input.bio ?? "",
    avatar_url: input.avatarUrl ?? null,
    tags: input.tags ?? [],
    interests: input.interests ?? [],
    career_field: input.careerField ?? "",
    goals: input.goals ?? [],
    updated_at: new Date().toISOString(),
  };

  // Check whether a row already exists (uses the SELECT policy).
  const { data: existing } = await client
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  // Cast the builder to `any` because our hand-written Database type omits
  // the Relationships field that Supabase's generics require for insert/update.
  const table = client.from("users") as any;

  if (existing) {
    const { data, error } = await table.update(fields).eq("id", userId).select("*").single();
    if (error) throw new Error(error.message);
    return mapUser(data as unknown as Row<"users">);
  } else {
    const { data, error } = await table.insert({ id: userId, ...fields }).select("*").single();
    if (error) throw new Error(error.message);
    return mapUser(data as unknown as Row<"users">);
  }
}

export async function getJoinedCircleIds(userId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await (supabase.from("user_circles") as any)
    .select("circle_id")
    .eq("user_id", userId);
  return (data ?? []).map((r: { circle_id: string }) => r.circle_id);
}

export async function joinCircle(userId: string, circleId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("user_circles") as any)
    .insert({ user_id: userId, circle_id: circleId });
  if (error) throw new Error(error.message);
}

export async function leaveCircle(userId: string, circleId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("user_circles") as any)
    .delete()
    .eq("user_id", userId)
    .eq("circle_id", circleId);
  if (error) throw new Error(error.message);
}

export async function uploadCircleIcon(circleId: string, file: File): Promise<string> {
  const client = assertSupabase();
  if (file.size > 2_000_000) throw new Error("Icon must be under 2 MB.");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${circleId}/icon.${ext}`;
  const { error } = await client.storage.from("circle-icons").upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = client.storage.from("circle-icons").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const client = assertSupabase();
  if (file.size > 2_000_000) throw new Error("Avatar must be under 2 MB.");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await client.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = client.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function getHomeData() {
  const [homeEvents, homeCircles, homeDeals] = await Promise.all([
    getEvents(),
    getCircles(),
    getDeals(),
  ]);

  return {
    events: homeEvents,
    circles: homeCircles,
    deals: homeDeals,
  };
}

export async function getCircleByHandle(handle: string) {
  const items = await getCircles();
  return findByHandle(items, handle, getCircleHandle, (item) => item.id);
}

export async function getEventByHandle(handle: string) {
  const items = await getEvents();
  return findByHandle(items, handle, getEventHandle, (item) => item.id);
}

export async function getDealByHandle(handle: string) {
  const items = await getDeals();
  return findByHandle(items, handle, getDealHandle, (item) => item.id);
}

export async function getJobByHandle(handle: string) {
  const items = await getJobs();
  return findByHandle(items, handle, getJobHandle, (item) => item.id);
}

export async function getGuideByHandle(handle: string) {
  const items = await getGuides();
  return findByHandle(items, handle, getGuideHandle, (item) => item.id);
}
