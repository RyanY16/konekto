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
  if (!supabase) {
    console.warn(`[db] ${table}: supabase not configured, returning fallback`);
    return fallback;
  }

  // Two attempts: first with a generous timeout for cold-start wakeup,
  // then one retry if that also times out before giving up.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const timeout = attempt === 1 ? 15_000 : 20_000;
    console.log(`[db] ${table}: attempt ${attempt} (timeout ${timeout / 1000}s)…`);
    try {
      const { data, error } = await Promise.race([
        supabase.from(table).select("*").order("created_at") as any,
        timeoutAfter(timeout),
      ]) as { data: unknown[] | null; error: any };
      if (error || !data) {
        console.warn(`[db] ${table}: error or null data`, error?.message ?? "no data");
        return fallback;
      }
      console.log(`[db] ${table}: got ${data.length} rows (attempt ${attempt})`);
      return data.map((row) => mapRow(row as Row<TTable>));
    } catch (err) {
      console.warn(`[db] ${table}: attempt ${attempt} timed out`);
      if (attempt === 2) {
        console.error(`[db] ${table}: all attempts exhausted`);
        throw err;
      }
    }
  }

  throw new Error(`[db] ${table}: unreachable`);
}

function abortAfter(ms = 5_000): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cleanup: () => clearTimeout(tid) };
}

function timeoutAfter(ms = 5_000): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out — please try again.")), ms),
  );
}

function throwAbort(error: any): never {
  const msg: string = error?.message ?? String(error);
  if (
    error?.name === "AbortError" ||
    msg.toLowerCase().includes("abort") ||
    msg.toLowerCase().includes("cancelled")
  ) {
    throw new Error("Request timed out — please try again.");
  }
  throw new Error(msg);
}

async function insertSupabase<TTable extends PublicTable, TItem>(
  table: TTable,
  values: Insert<TTable>,
  mapRow: (row: Row<TTable>) => TItem,
): Promise<TItem> {
  const client = assertSupabase();
  try {
    console.log(`[db] insert ${table}`, values);
    const { data, error } = await Promise.race([
      client.from(table).insert(values).select("*").maybeSingle() as any,
      timeoutAfter(),
    ]) as { data: Row<TTable> | null; error: any };
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Insert succeeded but no row returned — check RLS policies.");
    console.log(`[db] insert ${table} ✓`, data);
    return mapRow(data as Row<TTable>);
  } catch (err) {
    console.error(`[db] insert ${table} ✗`, err);
    throw err;
  }
}

async function updateSupabase<TTable extends PublicTable, TItem>(
  table: TTable,
  id: string,
  values: Database["public"]["Tables"][TTable]["Update"],
  mapRow: (row: Row<TTable>) => TItem,
): Promise<TItem> {
  const client = assertSupabase();
  try {
    console.log(`[db] update ${table} id=${id}`, values);
    const { data, error } = await Promise.race([
      client.from(table).update(values).eq("id", id).select("*").maybeSingle() as any,
      timeoutAfter(),
    ]) as { data: Row<TTable> | null; error: any };
    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error(
        `Could not update ${table} record. It may not exist in Supabase, or your Row Level Security policy denied the update.`,
      );
    }
    console.log(`[db] update ${table} ✓`, data);
    return mapRow(data as Row<TTable>);
  } catch (err) {
    console.error(`[db] update ${table} ✗`, err);
    throw err;
  }
}

async function deleteSupabase(table: PublicTable, id: string): Promise<void> {
  const client = assertSupabase();
  console.log(`[db] delete ${table} id=${id}`);
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) { console.error(`[db] delete ${table} ✗`, error); throw new Error(error.message); }
  console.log(`[db] delete ${table} ✓`);
}

function mapCircle(row: Row<"circles">): Circle {
  const rawLinks = row.social_links as Record<string, unknown> | null | undefined;
  const vis = (rawLinks?._visibility ?? {}) as Record<string, string>;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    members: row.members,
    activity: row.activity,
    englishFriendly: row.english_friendly,
    emoji: row.emoji,
    iconUrl: row.icon_url ?? undefined,
    ownerId: (row as any).owner_id ?? undefined,
    tags: row.tags ?? [],
    university: (row as any).university ?? undefined,
    country: (row as any).country ?? undefined,
    primaryLanguage: (row as any).primary_language ?? undefined,
    vibe: (row as any).vibe ?? undefined,
    recruiting: (row as any).recruiting ?? false,
    recruitingPeriod: (row as any).recruiting_period ?? undefined,
    recruitingConditions: (row as any).recruiting_conditions ?? undefined,
    membershipFee: (row as any).membership_fee ?? undefined,
    howToJoin: (row as any).how_to_join ?? undefined,
    socialLinks: normalizeSocialLinks(row.social_links),
    socialLinksVisibility: {
      line: (vis.line === "members" ? "members" : "everyone") as "everyone" | "members",
      discord: (vis.discord === "everyone" ? "everyone" : "members") as "everyone" | "members",
    },
    createdAt: row.created_at,
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
    description: row.description || undefined,
    emoji: row.emoji,
    going: row.going,
    tags: row.tags ?? [],
    cost: row.cost || undefined,
    primaryLanguage: row.primary_language || undefined,
    ownerId: row.owner_id ?? undefined,
    updatedAt: row.updated_at ?? row.created_at,
    socialLinks: normalizeSocialLinks(row.social_links),
    circleIds: row.circle_ids ?? [],
    online: row.online ?? false,
    approvalRequired: row.approval_required ?? false,
    howToJoin: (row as any).how_to_join ?? undefined,
    startDate: (row as any).start_date ?? undefined,
    recurrence: (row as any).recurrence ?? undefined,
    cancelledDates: (row as any).cancelled_dates ?? [],
  };
}

function mapDeal(row: Row<"deals">): Deal {
  return {
    id: row.id,
    brand: row.brand,
    title: row.title,
    category: row.category,
    originalPrice: row.original_price ?? undefined,
    newPrice: row.new_price ?? undefined,
    saleEnd: row.sale_end ?? undefined,
    imageUrl: row.image_url ?? undefined,
    description: row.description ?? undefined,
    studentOnly: row.student_only ?? true,
    mode: row.mode ?? "In-Person",
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
  const slug = toSlug(circle.name);
  const suffix = circle.id.replace(/^circle-/, "").slice(0, 8);
  return slug ? `${slug}-${suffix}` : circle.id;
}

export function getEventHandle(event: Pick<EventItem, "id" | "title">) {
  const slug = toSlug(event.title);
  const suffix = event.id.replace(/^event-/, "").slice(0, 8);
  return slug ? `${slug}-${suffix}` : event.id;
}

export function getDealHandle(deal: Pick<Deal, "id" | "title">) {
  const slug = toSlug(deal.title);
  const suffix = deal.id.replace(/^deal-/, "").slice(0, 8);
  return slug ? `${slug}-${suffix}` : deal.id;
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
  input: Omit<Circle, "id" | "members" | "ownerId"> & { members?: number; ownerId?: string | null; id?: string; iconUrl?: string },
) {
  const client = assertSupabase();
  const values = {
    id: input.id ?? newId("circle"),
    name: input.name,
    category: input.category,
    description: input.description,
    members: input.members ?? 1,
    activity: input.activity,
    english_friendly: input.englishFriendly ?? false,
    emoji: input.emoji,
    owner_id: input.ownerId ?? null,
    icon_url: input.iconUrl ?? null,
    tags: input.tags,
    university: input.university ?? "",
    country: input.country ?? "Japan",
    location: (input as any).location ?? "",
    primary_language: input.primaryLanguage ?? "",
    vibe: (input as any).vibe ?? "Casual",
    recruiting: input.recruiting ?? false,
    recruiting_period: input.recruitingPeriod ?? "",
    recruiting_conditions: input.recruitingConditions ?? "",
    membership_fee: input.membershipFee ?? "",
    how_to_join: input.howToJoin ?? "",
    social_links: {
      ...(input.socialLinks ?? {}),
      _visibility: {
        line: input.socialLinksVisibility?.line ?? "members",
        discord: input.socialLinksVisibility?.discord ?? "members",
      },
    },
  };

  const { error } = await Promise.race([
    client.from("circles").insert(values) as any,
    timeoutAfter(),
  ]) as { error: any };
  if (error) throw new Error(error.message);
}

export async function updateCircle(
  id: string,
  input: Omit<Circle, "id" | "members"> & { members?: number },
) {
  const client = assertSupabase();
  const values: Record<string, unknown> = {
    name: input.name,
    category: input.category,
    description: input.description,
    members: input.members,
    activity: input.activity,
    emoji: input.emoji,
    icon_url: input.iconUrl ?? null,
    ...(input.ownerId !== undefined ? { owner_id: input.ownerId } : {}),
    tags: input.tags,
    university: input.university ?? "",
    country: input.country ?? "Japan",
    location: (input as any).location ?? "",
    primary_language: input.primaryLanguage ?? "",
    vibe: (input as any).vibe ?? "Casual",
    recruiting: input.recruiting ?? false,
    recruiting_period: input.recruitingPeriod ?? "",
    recruiting_conditions: input.recruitingConditions ?? "",
    membership_fee: input.membershipFee ?? "",
    how_to_join: input.howToJoin ?? "",
    social_links: {
      ...(input.socialLinks ?? {}),
      _visibility: {
        line: input.socialLinksVisibility?.line ?? "members",
        discord: input.socialLinksVisibility?.discord ?? "members",
      },
    },
  };

  const { error } = await Promise.race([
    client.from("circles").update(values).eq("id", id) as any,
    timeoutAfter(),
  ]) as { error: any };
  if (error) throw new Error(error.message);
}

export async function deleteCircle(id: string) {
  return deleteSupabase("circles", id);
}

export async function deleteAllCircles() {
  const client = assertSupabase();
  console.log("[db] delete all circles");
  const { error } = await (client.from("circles").delete().neq("id", "") as any);
  if (error) { console.error("[db] delete all circles ✗", error); throw new Error(error.message); }
  console.log("[db] delete all circles ✓");
}

export async function addEvent(
  input: Omit<EventItem, "id" | "going"> & { going?: number; ownerId?: string; id?: string },
): Promise<string> {
  const client = assertSupabase();
  const id = input.id ?? newId("event");
  const values = {
    id,
    title: input.title,
    category: input.category,
    description: input.description ?? "",
    date: input.date,
    location: input.location,
    emoji: input.emoji,
    going: input.going ?? 1,
    tags: input.tags,
    cost: input.cost ?? "",
    primary_language: input.primaryLanguage ?? "",
    social_links: input.socialLinks ?? {},
    owner_id: input.ownerId ?? null,
    circle_ids: input.circleIds ?? [],
    online: input.online ?? false,
    approval_required: input.approvalRequired ?? false,
    how_to_join: (input as any).howToJoin ?? "",
  };
  if ((input as any).startDate) (values as any).start_date = (input as any).startDate;
  if ((input as any).recurrence) (values as any).recurrence = (input as any).recurrence;
  (values as any).cancelled_dates = (input as any).cancelledDates ?? [];
  const { error } = await Promise.race([
    client.from("events").insert(values) as any,
    timeoutAfter(),
  ]) as { error: any };
  if (error) throw new Error(error.message);

  return id;
}

export async function updateEvent(
  id: string,
  input: Partial<Omit<EventItem, "id" | "going">>,
) {
  const client = assertSupabase();
  const values: Record<string, unknown> = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.category !== undefined) values.category = input.category;
  if (input.description !== undefined) values.description = input.description;
  if (input.date !== undefined) values.date = input.date;
  if (input.location !== undefined) values.location = input.location;
  if (input.emoji !== undefined) values.emoji = input.emoji;
  if (input.tags !== undefined) values.tags = input.tags;
  if (input.cost !== undefined) values.cost = input.cost;
  if (input.primaryLanguage !== undefined) values.primary_language = input.primaryLanguage;
  if (input.socialLinks !== undefined) values.social_links = input.socialLinks;
  if (input.circleIds !== undefined) values.circle_ids = input.circleIds;
  if (input.online !== undefined) values.online = input.online;
  if (input.approvalRequired !== undefined) values.approval_required = input.approvalRequired;
  if ((input as any).howToJoin !== undefined) values.how_to_join = (input as any).howToJoin ?? "";
  if ((input as any).startDate !== undefined) values.start_date = (input as any).startDate;
  if ((input as any).recurrence !== undefined) values.recurrence = (input as any).recurrence || null;
  if ((input as any).cancelledDates !== undefined) values.cancelled_dates = (input as any).cancelledDates;
  values.updated_at = new Date().toISOString();

  const { error } = await Promise.race([
    client.from("events").update(values).eq("id", id) as any,
    timeoutAfter(),
  ]) as { error: any };
  if (error) throw new Error(error.message);
}

export async function cancelEventOccurrence(eventId: string, dateIso: string): Promise<void> {
  const client = assertSupabase();
  const { data } = await (client.from("events").select("cancelled_dates").eq("id", eventId).single() as any);
  const current: string[] = data?.cancelled_dates ?? [];
  if (current.includes(dateIso)) return;
  const { error } = await (client.from("events").update({ cancelled_dates: [...current, dateIso], updated_at: new Date().toISOString() }).eq("id", eventId) as any);
  if (error) throw new Error(error.message);
}

export type EventCircleLinkStatus = "pending" | "approved" | "declined";

export type EventCircleLink = {
  eventId: string;
  circleId: string;
  status: EventCircleLinkStatus;
  requestedBy: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  circle?: Circle | null;
};

function mapEventCircleLink(row: any, circle?: Circle | null): EventCircleLink {
  return {
    eventId: row.event_id,
    circleId: row.circle_id,
    status: row.status as EventCircleLinkStatus,
    requestedBy: row.requested_by ?? null,
    approvedBy: row.approved_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    circle,
  };
}

async function syncApprovedEventCircleIds(eventId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await (supabase.from("event_circle_links") as any)
    .select("circle_id")
    .eq("event_id", eventId)
    .eq("status", "approved");
  if (error) return [];
  const ids = (data ?? []).map((r: any) => r.circle_id as string);
  await (supabase.from("events") as any).update({ circle_ids: ids, updated_at: new Date().toISOString() }).eq("id", eventId);
  return ids;
}

export async function getEventCircleLinks(eventId: string): Promise<EventCircleLink[]> {
  if (!supabase) return [];
  const { data, error } = await (supabase.from("event_circle_links") as any)
    .select("event_id, circle_id, status, requested_by, approved_by, created_at, updated_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    const event = await getEventByHandle(eventId);
    const circlesForEvent = await Promise.all((event?.circleIds ?? []).map((id) => getCircleByHandle(id)));
    return circlesForEvent.filter(Boolean).map((circle) => ({
      eventId,
      circleId: circle!.id,
      status: "approved" as const,
      requestedBy: event?.ownerId ?? null,
      approvedBy: event?.ownerId ?? null,
      createdAt: event?.updatedAt ?? "",
      updatedAt: event?.updatedAt ?? null,
      circle,
    }));
  }

  const circleIds = [...new Set((data ?? []).map((r: any) => r.circle_id as string))];
  const circlesForLinks = circleIds.length
    ? await Promise.all(circleIds.map((id) => getCircleByHandle(id)))
    : [];
  const circleMap = new Map(circlesForLinks.filter(Boolean).map((circle) => [circle!.id, circle]));
  return (data ?? []).map((row: any) => mapEventCircleLink(row, circleMap.get(row.circle_id) ?? null));
}

export async function getCircleEvents(circleId: string): Promise<EventItem[]> {
  const eventsForCircle = await getEvents();
  const byId = new Map(eventsForCircle
    .filter((event) => (event.circleIds ?? []).includes(circleId))
    .map((event) => [event.id, event]));

  if (supabase) {
    const { data } = await (supabase.from("event_circle_links") as any)
      .select("event_id")
      .eq("circle_id", circleId)
      .eq("status", "approved");
    const linkedIds = (data ?? []).map((row: any) => row.event_id as string);
    const linkedEvents = await Promise.all(linkedIds.map((id) => getEventByHandle(id).catch(() => null)));
    linkedEvents.filter(Boolean).forEach((event) => byId.set(event!.id, event!));
  }

  return [...byId.values()].sort((a, b) => {
    const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
    const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
    return aTime - bTime;
  });
}

export type CircleEventCollabRequest = EventCircleLink & {
  event: EventItem | null;
  organizer: Pick<UserProfile, "id" | "username" | "displayName" | "avatarUrl"> | null;
};

export async function getCircleEventCollabRequests(circleId: string): Promise<CircleEventCollabRequest[]> {
  if (!supabase) return [];
  const { data, error } = await (supabase.from("event_circle_links") as any)
    .select("event_id, circle_id, status, requested_by, approved_by, created_at, updated_at")
    .eq("circle_id", circleId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const requests = await Promise.all(data.map(async (row: any) => {
    const event = await getEventByHandle(row.event_id).catch(() => null);
    const organizerId = event?.ownerId ?? row.requested_by ?? null;
    const organizer = organizerId ? await getProfile(organizerId).catch(() => null) : null;
    return {
      ...mapEventCircleLink(row),
      event,
      organizer: organizer ? {
        id: organizer.id,
        username: organizer.username,
        displayName: organizer.displayName,
        avatarUrl: organizer.avatarUrl,
      } : null,
    };
  }));

  return requests;
}

async function notifyCircleManagers(circleId: string, type: string, payload: Record<string, any>) {
  if (!supabase) return;
  const circle = await getCircleByHandle(circleId);
  const ids = new Set<string>();
  if (circle?.ownerId) ids.add(circle.ownerId);
  const managers = await getCircleManagers(circleId).catch(() => []);
  managers.forEach((manager) => ids.add(manager.id));
  await Promise.all([...ids].map((id) => insertNotification(id, type, payload)));
}

export async function setEventCircleCollaborations(input: {
  eventId: string;
  eventTitle: string;
  eventOwnerId?: string | null;
  requesterId: string;
  approvedCircleIds: string[];
  invitedCircleIds: string[];
}): Promise<void> {
  const client = assertSupabase();
  const now = new Date().toISOString();
  const approved = [...new Set(input.approvedCircleIds)];
  const invited = [...new Set(input.invitedCircleIds)].filter((id) => !approved.includes(id));
  const desired = new Set([...approved, ...invited]);

  const existing = await getEventCircleLinks(input.eventId).catch(() => [] as EventCircleLink[]);
  await Promise.all(existing
    .filter((link) => link.status !== "declined" && !desired.has(link.circleId))
    .map((link) => (client.from("event_circle_links") as any)
      .delete()
      .eq("event_id", input.eventId)
      .eq("circle_id", link.circleId)));

  for (const circleId of approved) {
    const { error } = await (client.from("event_circle_links") as any).upsert({
      event_id: input.eventId,
      circle_id: circleId,
      status: "approved",
      requested_by: input.requesterId,
      approved_by: input.requesterId,
      updated_at: now,
    }, { onConflict: "event_id,circle_id" });
    if (error) throw new Error(error.message);
  }

  for (const circleId of invited) {
    const already = existing.find((link) => link.circleId === circleId);
    if (already?.status === "approved" || already?.status === "pending") continue;
    const { error } = await (client.from("event_circle_links") as any).upsert({
      event_id: input.eventId,
      circle_id: circleId,
      status: "pending",
      requested_by: input.requesterId,
      approved_by: null,
      updated_at: now,
    }, { onConflict: "event_id,circle_id" });
    if (error) throw new Error(error.message);
    await notifyCircleManagers(circleId, "event_circle_invite", {
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      circleId,
      requesterId: input.requesterId,
    });
  }

  await (client.from("events") as any)
    .update({ circle_ids: approved, updated_at: now })
    .eq("id", input.eventId);
}

export async function approveEventCircleCollaboration(eventId: string, circleId: string, approverId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("event_circle_links") as any)
    .update({ status: "approved", approved_by: approverId, updated_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("circle_id", circleId);
  if (error) throw new Error(error.message);
  const ids = await syncApprovedEventCircleIds(eventId);
  const event = await getEventByHandle(eventId).catch(() => null);
  const circle = await getCircleByHandle(circleId).catch(() => null);
  if (event?.ownerId) {
    await insertNotification(event.ownerId, "event_circle_approved", {
      eventId,
      eventTitle: event.title,
      circleId,
      circleName: circle?.name ?? circleId,
      circleIds: ids,
    });
  }
}

export async function declineEventCircleCollaboration(eventId: string, circleId: string, declinerId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("event_circle_links") as any)
    .update({ status: "declined", approved_by: declinerId, updated_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("circle_id", circleId);
  if (error) throw new Error(error.message);
  await syncApprovedEventCircleIds(eventId);
  const event = await getEventByHandle(eventId).catch(() => null);
  const circle = await getCircleByHandle(circleId).catch(() => null);
  if (event?.ownerId) {
    await insertNotification(event.ownerId, "event_circle_declined", {
      eventId,
      eventTitle: event.title,
      circleId,
      circleName: circle?.name ?? circleId,
    });
  }
}

export async function cancelEventCircleCollaboration(eventId: string, circleId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("event_circle_links") as any)
    .delete()
    .eq("event_id", eventId)
    .eq("circle_id", circleId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  await syncApprovedEventCircleIds(eventId);
}

export async function deleteEvent(id: string) {
  return deleteSupabase("events", id);
}

export async function deleteAllEvents() {
  const client = assertSupabase();
  console.log("[db] delete all events");
  const { error } = await (client.from("events").delete().neq("id", "") as any);
  if (error) { console.error("[db] delete all events ✗", error); throw new Error(error.message); }
  console.log("[db] delete all events ✓");
}

export async function addDeal(input: Omit<Deal, "id">) {
  return insertSupabase(
    "deals",
    {
      id: newId("deal"),
      brand: input.brand,
      title: input.title,
      category: input.category,
      original_price: input.originalPrice ?? null,
      new_price: input.newPrice ?? null,
      sale_end: input.saleEnd ?? null,
      image_url: input.imageUrl ?? null,
      description: input.description ?? null,
      student_only: input.studentOnly,
      mode: input.mode,
      social_links: input.socialLinks ?? {},
    } as any,
    mapDeal,
  );
}

export async function updateDeal(id: string, input: Partial<Omit<Deal, "id">>) {
  const values: Record<string, unknown> = {};
  if (input.brand !== undefined) values.brand = input.brand;
  if (input.title !== undefined) values.title = input.title;
  if (input.category !== undefined) values.category = input.category;
  if (input.originalPrice !== undefined) values.original_price = input.originalPrice || null;
  if (input.newPrice !== undefined) values.new_price = input.newPrice || null;
  if (input.saleEnd !== undefined) values.sale_end = input.saleEnd || null;
  if (input.imageUrl !== undefined) values.image_url = input.imageUrl || null;
  if (input.description !== undefined) values.description = input.description || null;
  if (input.studentOnly !== undefined) values.student_only = input.studentOnly;
  if (input.mode !== undefined) values.mode = input.mode;
  if (input.socialLinks !== undefined) values.social_links = input.socialLinks;
  const client = assertSupabase();
  console.log(`[db] update deals id=${id}`, values);
  const { data, error } = await (client.from("deals").update(values).eq("id", id).select().single() as any);
  if (error) { console.error("[db] update deals ✗", error); throw new Error(error.message); }
  console.log("[db] update deals ✓", data);
  return mapDeal(data);
}

export async function deleteDeal(id: string) {
  return deleteSupabase("deals", id);
}

export async function deleteAllDeals() {
  const client = assertSupabase();
  console.log("[db] delete all deals");
  const { error } = await (client.from("deals").delete().neq("id", "") as any);
  if (error) { console.error("[db] delete all deals ✗", error); throw new Error(error.message); }
  console.log("[db] delete all deals ✓");
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

export async function deleteAllGuides() {
  const client = assertSupabase();
  console.log("[db] delete all guides");
  const { error } = await (client.from("guides").delete().neq("id", "") as any);
  if (error) { console.error("[db] delete all guides ✗", error); throw new Error(error.message); }
  console.log("[db] delete all guides ✓");
}

export type SpokenLanguage = { language: string; fluency: string };

export type UserProfile = {
  id: string;
  username: string | null;
  displayName: string;
  university: string;
  year: string;
  nationality: string;
  bio: string;
  avatarUrl: string | null;
  tags: string[];
  interests: string[];
  careerField: string;
  goals: string[];
  languages: SpokenLanguage[];
  socialLinks: { website?: string; instagram?: string; linkedin?: string; line?: string };
};

function mapUser(row: Row<"users">): UserProfile {
  return {
    id: row.id,
    username: (row as any).username ?? null,
    displayName: row.display_name,
    university: row.university,
    year: row.year,
    nationality: (row as any).nationality ?? "",
    bio: row.bio,
    avatarUrl: row.avatar_url,
    tags: row.tags ?? [],
    interests: (row as any).interests ?? [],
    careerField: (row as any).career_field ?? "",
    goals: (row as any).goals ?? [],
    languages: (row as any).languages ?? [],
    socialLinks: normalizeSocialLinks((row as any).social_links),
  };
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return mapUser(data as unknown as Row<"users">);
}

export async function getCurrentUserInterests(): Promise<string[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const profile = await getProfile(user.id);
  return profile?.interests ?? [];
}

export async function getProfilesByIds(ids: string[]): Promise<UserProfile[]> {
  if (!supabase || ids.length === 0) return [];
  const { data } = await supabase.from("users").select("*").in("id", ids);
  return (data ?? []).map((row) => mapUser(row as unknown as Row<"users">));
}

export async function checkEmailExists(email: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await (supabase as any).rpc("email_exists", { email_input: email.toLowerCase().trim() });
  return Boolean(data);
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

  const fields: Record<string, unknown> = { id: userId };
  if (input.username !== undefined) fields.username = input.username;
  if (input.displayName !== undefined) fields.display_name = input.displayName;
  if (input.university !== undefined) fields.university = input.university;
  if (input.year !== undefined) fields.year = input.year;
  if (input.nationality !== undefined) fields.nationality = input.nationality;
  if (input.bio !== undefined) fields.bio = input.bio;
  if (input.avatarUrl !== undefined) fields.avatar_url = input.avatarUrl;
  if (input.tags !== undefined) fields.tags = input.tags;
  if (input.interests !== undefined) fields.interests = input.interests;
  if (input.careerField !== undefined) fields.career_field = input.careerField;
  if (input.goals !== undefined) fields.goals = input.goals;
  if (input.languages !== undefined) fields.languages = input.languages;
  if (input.socialLinks !== undefined) fields.social_links = input.socialLinks;
  fields.updated_at = new Date().toISOString();

  const { data, error } = await Promise.race([
    (client.from("users") as any)
      .upsert(fields, { onConflict: "id" })
      .select("*")
      .maybeSingle(),
    timeoutAfter(),
  ]);

  if (error) throw new Error(error.message);
  if (!data) {
    const { data: refetch } = await (client.from("users") as any).select("*").eq("id", userId).maybeSingle();
    if (!refetch) throw new Error("Save succeeded but could not read back profile.");
    return mapUser(refetch as unknown as Row<"users">);
  }
  return mapUser(data as unknown as Row<"users">);
}

export async function getCircleManagerIds(circleId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await (supabase.from("circle_editors") as any)
    .select("user_id")
    .eq("circle_id", circleId);
  return (data ?? []).map((r: any) => r.user_id as string);
}

export async function getMyEditableCircles(userId: string): Promise<Circle[]> {
  if (!supabase) return [];
  const { data: editorRows } = await (supabase.from("circle_editors") as any)
    .select("circle_id")
    .eq("user_id", userId);
  const editorIds: string[] = (editorRows ?? []).map((r: any) => r.circle_id as string);

  const { data: owned } = await supabase.from("circles").select("*").eq("owner_id", userId);

  let editorCircles: any[] = [];
  if (editorIds.length > 0) {
    const { data } = await supabase.from("circles").select("*").in("id", editorIds);
    editorCircles = data ?? [];
  }

  const seen = new Set<string>();
  const all = [...(owned ?? []), ...editorCircles].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  return all.map((r) => mapCircle(r as unknown as Row<"circles">));
}

export async function getCircleManagers(circleId: string): Promise<UserProfile[]> {
  if (!supabase) return [];
  const ids = await getCircleManagerIds(circleId);
  if (ids.length === 0) return [];
  return getProfilesByIds(ids);
}

export async function addCircleManager(circleId: string, username: string): Promise<void> {
  const client = assertSupabase();
  const profile = await getProfileByUsername(username);
  if (!profile) throw new Error(`No user found with username @${username}`);
  const { error } = await (client.from("circle_editors") as any)
    .insert({ circle_id: circleId, user_id: profile.id });
  if (error) throw new Error(error.message);
}

export async function addCircleManagerById(circleId: string, userId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("circle_editors") as any)
    .insert({ circle_id: circleId, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function removeCircleManager(circleId: string, userId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("circle_editors") as any)
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function transferCircleOwnership(circleId: string, username: string): Promise<void> {
  const client = assertSupabase();
  const profile = await getProfileByUsername(username);
  if (!profile) throw new Error(`No user found with username @${username}`);
  const { error } = await (client
    .from("circles")
    .update({ owner_id: profile.id } as any) as any)
    .eq("id", circleId);
  if (error) throw new Error(error.message);
}

export async function getJoinedCircleIds(userId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await (supabase.from("user_circles") as any)
    .select("circle_id")
    .eq("user_id", userId);
  return (data ?? []).map((r: { circle_id: string }) => r.circle_id);
}

export type CircleMember = UserProfile & { title: string };

export async function getCircleMembers(circleId: string): Promise<CircleMember[]> {
  if (!supabase) return [];
  // Try selecting with title; fall back to user_id only if the column doesn't exist yet
  let rows: { user_id: string; title?: string }[] | null = null;
  const { data: withTitle, error } = await (supabase.from("user_circles") as any)
    .select("user_id, title")
    .eq("circle_id", circleId);
  if (!error) {
    rows = withTitle;
  } else {
    const { data: withoutTitle } = await (supabase.from("user_circles") as any)
      .select("user_id")
      .eq("circle_id", circleId);
    rows = withoutTitle;
  }
  if (!rows || rows.length === 0) return [];
  const titleMap = new Map<string, string>(rows.map((r) => [r.user_id, r.title ?? "Member"]));
  const profiles = await getProfilesByIds([...titleMap.keys()]);
  return profiles.map((p) => ({ ...p, title: titleMap.get(p.id) ?? "Member" }));
}

export async function updateMemberTitle(circleId: string, userId: string, title: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("user_circles") as any)
    .update({ title: title.trim() || "Member" })
    .eq("circle_id", circleId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function joinCircle(userId: string, circleId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("user_circles") as any)
    .insert({ user_id: userId, circle_id: circleId });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

export async function leaveCircle(userId: string, circleId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("user_circles") as any)
    .delete()
    .eq("user_id", userId)
    .eq("circle_id", circleId);
  if (error) throw new Error(error.message);
}

export async function removeMember(circleId: string, userId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("user_circles") as any)
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

// ─── Circle Join Requests ────────────────────────────────────────────────────

export type JoinRequestStatus = "pending" | "approved" | "rejected";

export type CircleJoinRequest = {
  userId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  status: JoinRequestStatus;
  createdAt: string;
};

export async function getMyJoinRequest(circleId: string, userId: string): Promise<JoinRequestStatus | null> {
  if (!supabase) return null;
  const { data } = await (supabase.from("circle_join_requests") as any)
    .select("status")
    .eq("circle_id", circleId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.status as JoinRequestStatus) ?? null;
}

export async function requestToJoinCircle(
  circle: { id: string; name: string; ownerId?: string },
  userId: string,
): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("circle_join_requests") as any)
    .insert({ circle_id: circle.id, user_id: userId, status: "pending" });
  if (error) throw new Error(error.message);

  if (circle.ownerId) {
    await (client.from("notifications") as any).insert({
      user_id: circle.ownerId,
      type: "circle_join_request",
      payload: { circleId: circle.id, circleName: circle.name, requesterId: userId },
    });
  }
}

export async function withdrawJoinRequest(circleId: string, userId: string): Promise<void> {
  const client = assertSupabase();
  const { error } = await (client.from("circle_join_requests") as any)
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function getCircleJoinRequests(circleId: string): Promise<CircleJoinRequest[]> {
  if (!supabase) return [];
  const { data } = await (supabase.from("circle_join_requests") as any)
    .select("user_id, status, created_at")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: false });
  if (!data || data.length === 0) return [];

  const ids = data.map((r: any) => r.user_id as string);
  const profiles = await getProfilesByIds(ids).catch(() => [] as UserProfile[]);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return data.map((r: any) => {
    const p = profileMap.get(r.user_id);
    return {
      userId: r.user_id,
      username: p?.username ?? null,
      displayName: p?.displayName ?? r.user_id,
      avatarUrl: p?.avatarUrl ?? null,
      status: r.status as JoinRequestStatus,
      createdAt: r.created_at,
    };
  });
}

export async function approveJoinRequest(
  circle: { id: string; name: string },
  requesterId: string,
): Promise<void> {
  const client = assertSupabase();
  const { error: memberError } = await (client.from("user_circles") as any)
    .insert({ user_id: requesterId, circle_id: circle.id });
  if (memberError && !memberError.message.includes("duplicate")) throw new Error(memberError.message);

  await (client.from("circle_join_requests") as any)
    .delete()
    .eq("circle_id", circle.id)
    .eq("user_id", requesterId);

  const { data: circleRow } = await (client.from("circles") as any).select("members").eq("id", circle.id).maybeSingle();
  const newCount = (circleRow?.members ?? 0) + 1;
  await (client.from("circles") as any).update({ members: newCount }).eq("id", circle.id);

  await (client.from("notifications") as any).insert({
    user_id: requesterId,
    type: "circle_join_approved",
    payload: { circleId: circle.id, circleName: circle.name },
  });
}

export async function rejectJoinRequest(
  circle: { id: string; name: string },
  requesterId: string,
): Promise<void> {
  const client = assertSupabase();
  await (client.from("circle_join_requests") as any)
    .delete()
    .eq("circle_id", circle.id)
    .eq("user_id", requesterId);

  await (client.from("notifications") as any).insert({
    user_id: requesterId,
    type: "circle_join_rejected",
    payload: { circleId: circle.id, circleName: circle.name },
  });
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

export async function uploadDealImage(dealId: string, file: File): Promise<string> {
  const client = assertSupabase();
  if (file.size > 5_000_000) throw new Error("Image must be under 5 MB.");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${dealId}/image.${ext}`;
  const { error } = await client.storage.from("deal-images").upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = client.storage.from("deal-images").getPublicUrl(path);
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
  if (supabase) {
    try {
      const { data: byId } = await Promise.race([
        supabase.from("circles").select("*").eq("id", handle).maybeSingle() as any,
        timeoutAfter(5_000),
      ]) as { data: unknown | null };
      if (byId) return mapCircle(byId as unknown as Row<"circles">);
      const { data: all, error } = await Promise.race([
        supabase.from("circles").select("*").order("created_at") as any,
        timeoutAfter(5_000),
      ]) as { data: unknown[] | null; error: any };
      if (!error && all) {
        const items = all.map((r) => mapCircle(r as unknown as Row<"circles">));
        return findByHandle(items, handle, getCircleHandle, (item) => item.id) ?? null;
      }
    } catch (err) {
      throw err;
    }
  }
  const items = await getCircles();
  return findByHandle(items, handle, getCircleHandle, (item) => item.id) ?? null;
}

export async function getEventByHandle(handle: string) {
  if (supabase) {
    try {
      const { data: byId } = await Promise.race([
        supabase.from("events").select("*").eq("id", handle).maybeSingle() as any,
        timeoutAfter(5_000),
      ]) as { data: unknown | null };
      if (byId) return mapEvent(byId as unknown as Row<"events">);
      const { data: all, error } = await Promise.race([
        supabase.from("events").select("*").order("created_at") as any,
        timeoutAfter(5_000),
      ]) as { data: unknown[] | null; error: any };
      if (!error && all) {
        const items = all.map((r) => mapEvent(r as unknown as Row<"events">));
        return findByHandle(items, handle, getEventHandle, (item) => item.id) ?? null;
      }
    } catch (err) {
      throw err;
    }
  }
  const items = await getEvents().catch(() => []);
  return findByHandle(items, handle, getEventHandle, (item) => item.id) ?? null;
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

export type SearchResult =
  | { type: "circle"; id: string; name: string; category: string; emoji: string; iconUrl?: string; handle: string }
  | { type: "person"; id: string; name: string; username: string; university: string; avatarUrl: string | null };

export async function searchAll(q: string): Promise<SearchResult[]> {
  if (!supabase || q.trim().length < 2) return [];
  const ql = `%${q.trim()}%`;

  const [{ data: circleRows }, { data: userRows }] = await Promise.all([
    supabase
      .from("circles")
      .select("id, name, category, emoji, icon_url, tags")
      .or(`name.ilike.${ql},description.ilike.${ql}`)
      .limit(6),
    supabase
      .from("users")
      .select("id, display_name, username, university, avatar_url")
      .or(`username.ilike.${ql},display_name.ilike.${ql}`)
      .limit(6),
  ]);

  const circles: SearchResult[] = (circleRows ?? []).map((r: any) => ({
    type: "circle",
    id: r.id,
    name: r.name,
    category: r.category,
    emoji: r.emoji,
    iconUrl: r.icon_url ?? undefined,
    handle: toSlug(r.name) || r.id,
  }));

  const people: SearchResult[] = (userRows ?? [])
    .filter((r: any) => r.username)
    .map((r: any) => ({
      type: "person",
      id: r.id,
      name: r.display_name || r.username,
      username: r.username,
      university: r.university ?? "",
      avatarUrl: r.avatar_url ?? null,
    }));

  return [...circles, ...people];
}

// ─── Event Attendees ────────────────────────────────────────────────────────

export type AttendeeStatus = "pending" | "approved" | "declined";

export type EventAttendee = {
  userId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  status: AttendeeStatus;
  createdAt: string;
};

export async function getMyAttendance(eventId: string, userId: string): Promise<AttendeeStatus | null> {
  if (!supabase) return null;
  const { data } = await (supabase.from("event_attendees") as any)
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.status as AttendeeStatus) ?? null;
}

export async function requestToAttend(event: Pick<EventItem, "id" | "title" | "ownerId" | "approvalRequired">, userId: string): Promise<void> {
  const client = assertSupabase();
  const status = event.approvalRequired ? "pending" : "approved";

  const { error } = await (client.from("event_attendees") as any)
    .insert({ event_id: event.id, user_id: userId, status });
  if (error) throw new Error(error.message);

  if (!event.approvalRequired) {
    await client.rpc("increment_going" as any, { p_event_id: event.id } as any);
  }

  if (event.approvalRequired && event.ownerId) {
    await insertNotification(event.ownerId, "event_request", {
      eventId: event.id,
      eventTitle: event.title,
      requesterId: userId,
    });
  }
}

export async function withdrawAttendance(eventId: string, userId: string): Promise<void> {
  const client = assertSupabase();
  const { data: existing } = await (client.from("event_attendees") as any)
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await (client.from("event_attendees") as any)
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  if (existing?.status === "approved") {
    await client.rpc("decrement_going" as any, { p_event_id: eventId } as any);
  }
}

export async function getEventAttendees(eventId: string): Promise<EventAttendee[]> {
  if (!supabase) return [];
  const { data } = await (supabase.from("event_attendees") as any)
    .select("user_id, status, created_at")
    .eq("event_id", eventId)
    .order("created_at");
  if (!data || data.length === 0) return [];

  const ids = data.map((r: any) => r.user_id as string);
  const profiles = await getProfilesByIds(ids).catch(() => [] as UserProfile[]);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return data.map((r: any) => {
    const p = profileMap.get(r.user_id);
    return {
      userId: r.user_id,
      username: p?.username ?? null,
      displayName: p?.displayName ?? r.user_id,
      avatarUrl: p?.avatarUrl ?? null,
      status: r.status as AttendeeStatus,
      createdAt: r.created_at,
    };
  });
}

export async function updateAttendeeStatus(
  event: Pick<EventItem, "id" | "title" | "ownerId">,
  userId: string,
  newStatus: "approved" | "declined",
): Promise<void> {
  const client = assertSupabase();

  const { data: existing } = await (client.from("event_attendees") as any)
    .select("status")
    .eq("event_id", event.id)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await (client.from("event_attendees") as any)
    .update({ status: newStatus })
    .eq("event_id", event.id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  if (newStatus === "approved" && existing?.status !== "approved") {
    await client.rpc("increment_going" as any, { p_event_id: event.id } as any);
  } else if (newStatus === "declined" && existing?.status === "approved") {
    await client.rpc("decrement_going" as any, { p_event_id: event.id } as any);
  }

  await insertNotification(userId, newStatus === "approved" ? "event_approved" : "event_declined", {
    eventId: event.id,
    eventTitle: event.title,
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type AppNotification = {
  id: string;
  type: string;
  payload: Record<string, any>;
  read: boolean;
  createdAt: string;
};

async function insertNotification(userId: string, type: string, payload: Record<string, any>): Promise<void> {
  if (!supabase) return;
  await (supabase.from("notifications") as any).insert({ user_id: userId, type, payload });
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  if (!supabase) return [];
  const { data } = await (supabase.from("notifications") as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    type: r.type,
    payload: r.payload ?? {},
    read: r.read,
    createdAt: r.created_at,
  }));
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (!supabase) return 0;
  const { count } = await (supabase.from("notifications") as any)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!supabase) return;
  await (supabase.from("notifications") as any)
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

export async function searchUsers(q: string): Promise<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]> {
  if (!supabase || q.trim().length < 1) return [];
  const ql = `%${q.trim()}%`;
  const { data } = await supabase
    .from("users")
    .select("id, display_name, username, avatar_url")
    .or(`username.ilike.${ql},display_name.ilike.${ql}`)
    .limit(8);
  return (data ?? [])
    .filter((r: any) => r.username)
    .map((r: any) => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name || r.username,
      avatarUrl: r.avatar_url ?? null,
    }));
}
