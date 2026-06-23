create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default '',
  university text not null default '',
  year text not null default '',
  bio text not null default '',
  avatar_url text,
  tags text[] not null default '{}',
  interests text[] not null default '{}',
  career_field text not null default '',
  goals text[] not null default '{}',
  role text not null default 'user' check (role in ('user', 'admin')),
  updated_at timestamptz not null default now()
);

-- Ensure role column exists before any functions reference it
alter table public.users add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

-- Auto-create a public.users row when someone signs up, seeding from user metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, role, display_name, username, university, interests)
  values (
    new.id,
    'user',
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), ''),
    coalesce(new.raw_user_meta_data->>'university', ''),
    coalesce(
      array(select jsonb_array_elements_text(new.raw_user_meta_data->'interests')),
      '{}'::text[]
    )
  )
  on conflict (id) do update set
    display_name = coalesce(nullif(excluded.display_name, ''), public.users.display_name),
    username     = coalesce(excluded.username, public.users.username),
    university   = coalesce(nullif(excluded.university, ''), public.users.university),
    interests    = case when array_length(excluded.interests, 1) > 0 then excluded.interests else public.users.interests end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: returns true if the calling user has role = 'admin'
create or replace function public.is_admin()
returns boolean
language sql security definer stable
as $$
  select coalesce(
    (select role = 'admin' from public.users where id = auth.uid()),
    false
  );
$$;

alter table public.users enable row level security;
drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Authenticated users can read all profiles" on public.users;
drop policy if exists "Public can read all profiles" on public.users;
-- Profiles are public so username search works even before login (signup availability check)
create policy "Public can read all profiles" on public.users for select using (true);
drop policy if exists "Users can update own profile" on public.users;
-- Users update only their own profile; admins update any (but cannot change role via app)
create policy "Users can update own profile" on public.users for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());
drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

create table if not exists public.circles (
  id text primary key,
  slug text,
  name text not null,
  category text not null,
  description text not null,
  members integer not null default 0,
  activity text not null check (activity in ('Low', 'Medium', 'High')),
  english_friendly boolean not null default false,
  commitment text not null check (commitment in ('Daily', 'Weekly', 'Monthly', 'Casual', 'Regular', 'Serious')),
  emoji text not null,
  owner_id uuid references auth.users(id),
  icon_url text,
  tags text[] not null default '{}',
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.events (
  id text primary key,
  slug text,
  title text not null,
  category text not null check (category in ('Social', 'Career', 'Hackathon', 'Workshop', 'Casual', 'Travel')),
  date text not null,
  location text not null,
  emoji text not null,
  going integer not null default 0,
  tags text[] not null default '{}',
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.events drop constraint if exists events_category_check;
update public.events set category = 'Career', emoji = '💼' where category = 'Networking';
alter table public.events add constraint events_category_check
  check (category in ('Social', 'Career', 'Hackathon', 'Workshop', 'Casual', 'Travel'));

create table if not exists public.deals (
  id text primary key,
  slug text,
  brand text not null,
  title text not null,
  category text not null check (category in ('Food', 'Fashion', 'Lifestyle')),
  discount text not null,
  area text not null,
  emoji text not null,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.jobs') is not null and to_regclass('public.opportunities') is null then
    alter table public.jobs rename to opportunities;
  end if;
end $$;

create table if not exists public.opportunities (
  id text primary key,
  slug text,
  company text not null,
  role text not null,
  type text not null check (type in ('Shukatsu', 'Baito', 'Opportunity')),
  organization text not null default '',
  title text not null default '',
  category text not null default 'Other' check (category in ('Scholarship', 'Part-time Job', 'Internship', 'Study Abroad', 'Research', 'Competition', 'Grant', 'Volunteer', 'Career Event', 'Other')),
  location text not null,
  mode text not null default 'In-Person' check (mode in ('Online', 'In-Person', 'Hybrid')),
  deadline date,
  description text not null default '',
  eligibility text not null default '',
  application_url text not null default '',
  tags text[] not null default '{}',
  emoji text not null,
  image_url text,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.guides (
  id text primary key,
  title text not null,
  section text not null check (section in ('Housing', 'Admin', 'Daily Life')),
  excerpt text not null,
  emoji text not null,
  read_time text not null,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.circles add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.users add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.users add column if not exists nationality text not null default '';
alter table public.users add column if not exists languages jsonb not null default '[]'::jsonb;
alter table public.circles add column if not exists icon_url text;
alter table public.circles add column if not exists slug text;
update public.circles set slug = lower(regexp_replace(regexp_replace(regexp_replace(name, '[^[:alnum:][:space:]-]+', '', 'g'), '[[:space:]-]+', '-', 'g'), '(^-|-$)', '', 'g')) where slug is null or slug = '';
create unique index if not exists circles_slug_unique on public.circles (slug) where slug is not null and slug <> '';
alter table public.circles add column if not exists university text not null default '';
alter table public.circles add column if not exists primary_language text not null default '';
alter table public.circles add column if not exists recruiting boolean not null default false;
alter table public.circles add column if not exists recruiting_period text not null default '';
alter table public.circles add column if not exists recruiting_conditions text not null default '';
alter table public.circles add column if not exists membership_fee text not null default '';
alter table public.circles add column if not exists vibe text not null default 'Casual';
alter table public.events add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.events add column if not exists description text not null default '';
alter table public.events add column if not exists owner_id uuid references auth.users(id);
alter table public.events add column if not exists updated_at timestamptz;
alter table public.events add column if not exists cost text not null default '';
alter table public.events add column if not exists primary_language text not null default '';
alter table public.events add column if not exists circle_ids text[] not null default '{}';
alter table public.events add column if not exists online boolean not null default false;
alter table public.events add column if not exists approval_required boolean not null default false;
alter table public.events add column if not exists start_date timestamptz;
alter table public.events add column if not exists image_url text;
alter table public.events add column if not exists slug text;
update public.events set slug = lower(regexp_replace(regexp_replace(regexp_replace(title, '[^[:alnum:][:space:]-]+', '', 'g'), '[[:space:]-]+', '-', 'g'), '(^-|-$)', '', 'g')) where slug is null or slug = '';
create unique index if not exists events_slug_unique on public.events (slug) where slug is not null and slug <> '';

-- Event/circle collaborations. Approved rows are mirrored into events.circle_ids
-- for compatibility with existing event cards and detail pages.
create table if not exists public.event_circle_links (
  event_id text not null references public.events(id) on delete cascade,
  circle_id text not null references public.circles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  primary key (event_id, circle_id)
);
alter table public.event_circle_links enable row level security;
drop policy if exists "Approved event circle links visible to all" on public.event_circle_links;
create policy "Approved event circle links visible to all" on public.event_circle_links for select
  using (
    status = 'approved'
    or exists (select 1 from public.events where id = event_id and owner_id = auth.uid())
    or exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or exists (select 1 from public.circle_editors where circle_id = event_circle_links.circle_id and user_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Event owners can create circle links" on public.event_circle_links;
create policy "Event owners can create circle links" on public.event_circle_links for insert
  with check (
    exists (select 1 from public.events where id = event_id and owner_id = auth.uid())
    or exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or exists (select 1 from public.circle_editors where circle_id = event_circle_links.circle_id and user_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Event or circle managers can update circle links" on public.event_circle_links;
create policy "Event or circle managers can update circle links" on public.event_circle_links for update
  using (
    exists (select 1 from public.events where id = event_id and owner_id = auth.uid())
    or exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or exists (select 1 from public.circle_editors where circle_id = event_circle_links.circle_id and user_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Event owners can delete circle links" on public.event_circle_links;
create policy "Event owners can delete circle links" on public.event_circle_links for delete
  using (
    exists (select 1 from public.events where id = event_id and owner_id = auth.uid())
    or public.is_admin()
  );

-- ─── Event Attendees ──────────────────────────────────────────────────────────
create table if not exists public.event_attendees (
  event_id text not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_attendees enable row level security;
drop policy if exists "Attendees visible to self and event owner" on public.event_attendees;
create policy "Attendees visible to self and event owner" on public.event_attendees for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.events where id = event_id and owner_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Users can request to attend" on public.event_attendees;
create policy "Users can request to attend" on public.event_attendees for insert
  with check (auth.uid() = user_id);
drop policy if exists "Owner or admin can update attendance" on public.event_attendees;
create policy "Owner or admin can update attendance" on public.event_attendees for update
  using (
    exists (select 1 from public.events where id = event_id and owner_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Self or owner can delete attendance" on public.event_attendees;
create policy "Self or owner can delete attendance" on public.event_attendees for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from public.events where id = event_id and owner_id = auth.uid())
    or public.is_admin()
  );

-- ─── Notifications ────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications" on public.notifications for select
  using (auth.uid() = user_id);
drop policy if exists "Authenticated can insert notifications" on public.notifications;
create policy "Authenticated can insert notifications" on public.notifications for insert
  with check (auth.uid() is not null);
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications for update
  using (auth.uid() = user_id);

-- ─── Helper RPCs ─────────────────────────────────────────────────────────────
create or replace function public.increment_going(p_event_id text)
returns void language sql security definer as $$
  update public.events set going = going + 1 where id = p_event_id;
$$;

create or replace function public.decrement_going(p_event_id text)
returns void language sql security definer as $$
  update public.events set going = greatest(going - 1, 0) where id = p_event_id;
$$;
alter table public.deals add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.deals add column if not exists slug text;
update public.deals set slug = lower(regexp_replace(regexp_replace(regexp_replace(title, '[^[:alnum:][:space:]-]+', '', 'g'), '[[:space:]-]+', '-', 'g'), '(^-|-$)', '', 'g')) where slug is null or slug = '';
create unique index if not exists deals_slug_unique on public.deals (slug) where slug is not null and slug <> '';
alter table public.opportunities add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.opportunities add column if not exists organization text not null default '';
alter table public.opportunities add column if not exists title text not null default '';
alter table public.opportunities add column if not exists category text not null default 'Other';
alter table public.opportunities add column if not exists mode text not null default 'In-Person';
alter table public.opportunities add column if not exists deadline date;
alter table public.opportunities
  alter column deadline drop default,
  alter column deadline drop not null,
  alter column deadline type date using (
    case
      when deadline::text ~ '^\d{4}-\d{2}-\d{2}$' then deadline::text::date
      else null
    end
  );
alter table public.opportunities add column if not exists description text not null default '';
alter table public.opportunities add column if not exists eligibility text not null default '';
alter table public.opportunities add column if not exists application_url text not null default '';
alter table public.opportunities add column if not exists image_url text;
alter table public.opportunities add column if not exists slug text;
update public.opportunities set slug = lower(regexp_replace(regexp_replace(regexp_replace(coalesce(nullif(organization, ''), company) || '-' || coalesce(nullif(title, ''), role), '[^[:alnum:][:space:]-]+', '', 'g'), '[[:space:]-]+', '-', 'g'), '(^-|-$)', '', 'g')) where slug is null or slug = '';
create unique index if not exists opportunities_slug_unique on public.opportunities (slug) where slug is not null and slug <> '';
alter table public.opportunities drop constraint if exists opportunities_category_check;
update public.opportunities
set category = 'Competition'
where category = 'Competition / Grant';
alter table public.opportunities
  add constraint opportunities_category_check
  check (category in ('Scholarship', 'Part-time Job', 'Internship', 'Study Abroad', 'Research', 'Competition', 'Grant', 'Volunteer', 'Career Event', 'Other'));
alter table public.opportunities drop constraint if exists opportunities_mode_check;
alter table public.opportunities
  add constraint opportunities_mode_check
  check (mode in ('Online', 'In-Person', 'Hybrid'));
update public.opportunities set
  organization = case when organization = '' then company else organization end,
  title = case when title = '' then role else title end,
  category = case
    when category <> 'Other' then category
    when type = 'Baito' then 'Part-time Job'
    when type = 'Shukatsu' then 'Internship'
    else 'Other'
  end,
  mode = case
    when lower(location) like '%remote%' then 'Online'
    when lower(location) like '%hybrid%' then 'Hybrid'
    else mode
  end;
alter table public.guides add column if not exists social_links jsonb not null default '{}'::jsonb;

alter table public.circles drop constraint if exists circles_commitment_check;
alter table public.circles
  add constraint circles_commitment_check
  check (commitment in ('Daily', 'Weekly', 'Monthly', 'Casual', 'Regular', 'Serious'));

alter table public.circles enable row level security;
alter table public.events enable row level security;
alter table public.deals enable row level security;
alter table public.opportunities enable row level security;
alter table public.guides enable row level security;

drop policy if exists "Public read circles" on public.circles;
create policy "Public read circles" on public.circles for select using (true);
drop policy if exists "Public insert circles" on public.circles;
create policy "Insert as owner" on public.circles for insert with check (auth.uid() IS NOT NULL);
drop policy if exists "Public update circles" on public.circles;
drop policy if exists "Update by owner or admin" on public.circles;
create policy "Update by owner, editor or admin" on public.circles for update
  using (
    auth.uid() = owner_id or public.is_admin()
    or exists (select 1 from public.circle_editors where circle_id = id and user_id = auth.uid())
  )
  with check (
    auth.uid() = owner_id or public.is_admin()
    or exists (select 1 from public.circle_editors where circle_id = id and user_id = auth.uid())
  );
drop policy if exists "Public delete circles" on public.circles;
create policy "Delete by owner or admin" on public.circles for delete
  using (auth.uid() = owner_id or public.is_admin());

drop policy if exists "Public read events" on public.events;
create policy "Public read events" on public.events for select using (true);
drop policy if exists "Public insert events" on public.events;
drop policy if exists "Admin insert events" on public.events;
create policy "Owner or admin insert events" on public.events for insert with check (auth.uid() IS NOT NULL);
drop policy if exists "Public update events" on public.events;
drop policy if exists "Admin update events" on public.events;
create policy "Owner or admin update events" on public.events for update
  using (auth.uid() = owner_id or public.is_admin())
  with check (auth.uid() = owner_id or public.is_admin());
drop policy if exists "Public delete events" on public.events;
drop policy if exists "Admin delete events" on public.events;
create policy "Owner or admin delete events" on public.events for delete
  using (auth.uid() = owner_id or public.is_admin());

drop policy if exists "Public read deals" on public.deals;
create policy "Public read deals" on public.deals for select using (true);
drop policy if exists "Public insert deals" on public.deals;
create policy "Admin insert deals" on public.deals for insert with check (public.is_admin());
drop policy if exists "Public update deals" on public.deals;
create policy "Admin update deals" on public.deals for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Public delete deals" on public.deals;
create policy "Admin delete deals" on public.deals for delete using (public.is_admin());

drop policy if exists "Public read jobs" on public.opportunities;
drop policy if exists "Public read opportunities" on public.opportunities;
create policy "Public read opportunities" on public.opportunities for select using (true);
drop policy if exists "Public insert jobs" on public.opportunities;
drop policy if exists "Admin insert jobs" on public.opportunities;
drop policy if exists "Admin insert opportunities" on public.opportunities;
create policy "Admin insert opportunities" on public.opportunities for insert with check (public.is_admin());
drop policy if exists "Public update jobs" on public.opportunities;
drop policy if exists "Admin update jobs" on public.opportunities;
drop policy if exists "Admin update opportunities" on public.opportunities;
create policy "Admin update opportunities" on public.opportunities for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Public delete jobs" on public.opportunities;
drop policy if exists "Admin delete jobs" on public.opportunities;
drop policy if exists "Admin delete opportunities" on public.opportunities;
create policy "Admin delete opportunities" on public.opportunities for delete using (public.is_admin());

drop policy if exists "Public read guides" on public.guides;
create policy "Public read guides" on public.guides for select using (true);
drop policy if exists "Public insert guides" on public.guides;
create policy "Admin insert guides" on public.guides for insert with check (public.is_admin());
drop policy if exists "Public update guides" on public.guides;
create policy "Admin update guides" on public.guides for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Public delete guides" on public.guides;
create policy "Admin delete guides" on public.guides for delete using (public.is_admin());

-- Circle seed data removed; circles are managed via the app.

insert into public.events (id, title, category, date, location, emoji, going, tags) values
  ('e1', 'International Welcome Mixer', 'Social', 'Fri, May 8 · 7:00 PM', 'Shibuya', '🥂', 124, array['international-friendly', 'free']),
  ('e2', 'Spring Career Forum 2026', 'Career', 'Sat, May 16 · 10:00 AM', 'Tokyo Big Sight', '💼', 1820, array['shukatsu', 'tech', 'finance']),
  ('e3', '48h AI Hackathon', 'Hackathon', 'Sat, May 23 · 9:00 AM', 'Roppongi Hills', '⚡', 312, array['coding', 'ai', 'prizes']),
  ('e4', 'Startup Founders Meetup', 'Career', 'Wed, May 13 · 6:30 PM', 'Otemachi', '💼', 78, array['startup', 'networking']),
  ('e5', 'Hanami Picnic @ Yoyogi', 'Casual', 'Sun, May 4 · 12:00 PM', 'Yoyogi Park', '🌸', 56, array['outdoors', 'free']),
  ('e6', 'Goldman Sachs Info Session', 'Career', 'Tue, May 12 · 7:00 PM', 'Online', '🏦', 430, array['finance', 'shukatsu'])
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  date = excluded.date,
  location = excluded.location,
  emoji = excluded.emoji,
  going = excluded.going,
  tags = excluded.tags;

insert into public.deals (id, brand, title, category, discount, area, emoji) values
  ('d1', 'Ichiran Ramen', '20% off with student ID', 'Food', '20% OFF', 'Shibuya · Shinjuku', '🍜'),
  ('d2', 'Uniqlo', 'Student day — 10% off all items', 'Fashion', '10% OFF', 'Nationwide', '👕'),
  ('d3', 'Apple Education', 'Up to ¥24,000 off MacBook', 'Lifestyle', '¥24,000 OFF', 'Online', '💻'),
  ('d4', 'Starbucks', 'Free size upgrade for students', 'Food', 'FREE UPGRADE', 'Nationwide', '☕'),
  ('d5', 'Spotify Premium', '¥480/month student plan', 'Lifestyle', '50% OFF', 'Online', '🎧'),
  ('d6', 'Beams', '15% off select items', 'Fashion', '15% OFF', 'Harajuku', '🧥')
on conflict (id) do update set
  brand = excluded.brand,
  title = excluded.title,
  category = excluded.category,
  discount = excluded.discount,
  area = excluded.area,
  emoji = excluded.emoji;

insert into public.opportunities (id, company, role, type, organization, title, category, location, mode, deadline, description, eligibility, application_url, tags, emoji) values
  ('j1', 'Mercari', 'Software Engineer Intern', 'Shukatsu', 'Mercari', 'Software Engineer Intern', 'Internship', 'Roppongi', 'Hybrid', null, 'Build production features with Mercari engineering teams during a student-friendly internship.', 'University students with software development experience.', 'https://www.mercari.com/careers/', array['Computer Science', 'Career and Networking'], '🛍️'),
  ('j2', 'Rakuten', 'Product Management New Grad', 'Shukatsu', 'Rakuten', 'Product Management New Grad', 'Internship', 'Setagaya', 'In-Person', null, 'Explore product strategy and marketplace operations through Rakuten student recruiting.', 'Students graduating within the next recruitment cycle.', 'https://corp.rakuten.co.jp/careers/', array['Marketing', 'Career and Networking'], '🛒'),
  ('j3', 'Starbucks Roppongi', 'Barista Evenings', 'Baito', 'Starbucks Roppongi', 'Barista Evenings', 'Part-time Job', 'Roppongi', 'In-Person', null, 'Evening shifts for students who want customer-facing work in central Tokyo.', 'Valid work permission and conversational Japanese preferred.', '', array['Food and Drink', 'Learn Japanese'], '☕'),
  ('j4', 'GaijinPot', 'Content Writer', 'Baito', 'GaijinPot', 'Content Writer', 'Part-time Job', 'Remote', 'Online', null, 'Write student-focused articles about living, working, and studying in Japan.', 'Strong English writing samples required.', '', array['Content Creation', 'Literature and Writing'], '✍️'),
  ('j5', 'MEXT', 'Scholarship for International Students', 'Opportunity', 'MEXT', 'Scholarship for International Students', 'Scholarship', 'Japan', 'Hybrid', null, 'Government scholarship support for international students pursuing study or research in Japan.', 'Eligibility varies by country, program, and degree level.', 'https://www.mext.go.jp/en/', array['Education', 'Cultural Exchange'], '🎓'),
  ('j6', 'TechCrunch Tokyo', 'Student Pitch Competition', 'Opportunity', 'TechCrunch Tokyo', 'Student Pitch Competition', 'Competition', 'Shibuya', 'In-Person', '2026-09-30', 'Pitch a startup idea to mentors and investors for feedback, prizes, and community exposure.', 'Student-led teams with an early-stage idea or prototype.', '', array['Startups', 'Career and Networking'], '🏆'),
  ('j7', 'Waseda University', 'Short-term Exchange Program', 'Opportunity', 'Waseda University', 'Short-term Exchange Program', 'Study Abroad', 'Seoul', 'In-Person', '2026-10-15', 'A semester exchange opportunity for students who want to study abroad through a partner university.', 'Enrolled students in good academic standing.', '', array['Travel', 'Cultural Exchange'], '✈️')
on conflict (id) do update set
  company = excluded.company,
  role = excluded.role,
  type = excluded.type,
  organization = excluded.organization,
  title = excluded.title,
  category = excluded.category,
  location = excluded.location,
  mode = excluded.mode,
  deadline = excluded.deadline,
  description = excluded.description,
  eligibility = excluded.eligibility,
  application_url = excluded.application_url,
  tags = excluded.tags,
  emoji = excluded.emoji;

-- Circle managers: users the owner grants edit/management access to
create table if not exists public.circle_editors (
  circle_id text not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (circle_id, user_id)
);
alter table public.circle_editors enable row level security;
drop policy if exists "Editors visible to owner and self" on public.circle_editors;
create policy "Editors visible to owner and self" on public.circle_editors for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Owner can add editors" on public.circle_editors;
create policy "Owner can add editors" on public.circle_editors for insert
  with check (
    exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Owner can remove editors" on public.circle_editors;
create policy "Owner can remove editors" on public.circle_editors for delete
  using (
    exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or public.is_admin()
  );

-- Circle membership: users who have been approved as members
create table if not exists public.user_circles (
  user_id uuid not null references auth.users(id) on delete cascade,
  circle_id text not null references public.circles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  title text not null default 'Member',
  primary key (user_id, circle_id)
);
alter table public.user_circles enable row level security;
drop policy if exists "Members visible to all" on public.user_circles;
create policy "Members visible to all" on public.user_circles for select using (true);
drop policy if exists "Users can join circles" on public.user_circles;
create policy "Users can join circles" on public.user_circles for insert
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or exists (select 1 from public.circle_editors where circle_id = user_circles.circle_id and user_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Users can leave circles" on public.user_circles;
create policy "Users can leave circles" on public.user_circles for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or exists (select 1 from public.circle_editors where circle_id = user_circles.circle_id and user_id = auth.uid())
    or public.is_admin()
  );

-- Circle join requests
create table if not exists public.circle_join_requests (
  circle_id text not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  message text not null default '',
  created_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
alter table public.circle_join_requests enable row level security;
drop policy if exists "Join requests visible to owner manager requester" on public.circle_join_requests;
create policy "Join requests visible to owner manager requester" on public.circle_join_requests for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or exists (select 1 from public.circle_editors where circle_id = circle_join_requests.circle_id and user_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Users can create join requests" on public.circle_join_requests;
create policy "Users can create join requests" on public.circle_join_requests for insert
  with check (auth.uid() = user_id);
drop policy if exists "Owner manager admin can update join requests" on public.circle_join_requests;
create policy "Owner manager admin can update join requests" on public.circle_join_requests for update
  using (
    exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or exists (select 1 from public.circle_editors where circle_id = circle_join_requests.circle_id and user_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "Requester owner admin can delete join request" on public.circle_join_requests;
create policy "Requester owner admin can delete join request" on public.circle_join_requests for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
    or public.is_admin()
  );

insert into public.guides (id, title, section, excerpt, emoji, read_time) values
  ('g1', 'Finding an apartment in Tokyo', 'Housing', 'Key money, guarantor companies, and the foreigner-friendly listings worth bookmarking.', '🏠', '6 min'),
  ('g2', 'Opening a Japanese bank account', 'Admin', 'Compare Shinsei, JP Post, and Sony Bank — and which work best as a student.', '🏦', '5 min'),
  ('g3', 'National pension & exemption', 'Admin', 'Yes, you have to enroll. No, you probably do not have to pay yet.', '📋', '4 min'),
  ('g4', 'Cheap eats near every major campus', 'Daily Life', 'Where to grab lunch under ¥600 in Waseda, Hongo, Mita and beyond.', '🍱', '7 min'),
  ('g5', 'Residence card & moving notifications', 'Admin', 'The 14-day rule and what happens if you miss it.', '🪪', '3 min'),
  ('g6', 'Train pass (teikiken) explained', 'Daily Life', 'Save thousands per month with a commuter pass. Here is how to buy one.', '🚆', '4 min')
on conflict (id) do update set
  title = excluded.title,
  section = excluded.section,
  excerpt = excluded.excerpt,
  emoji = excluded.emoji,
  read_time = excluded.read_time;

-- ── Post verification / moderation ──────────────────────────────────────────

-- Status column on circles and events.
-- Default 'approved' so existing data stays visible; new non-admin posts are
-- set to 'pending' explicitly by the backend.
alter table public.circles add column if not exists open_access boolean not null default false;
alter table public.circles add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'declined'));
alter table public.events add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'declined'));

-- ── Admin discovery / import queue ──────────────────────────────────────────
create table if not exists public.import_sources (
  id text primary key,
  name text not null,
  type text not null default 'mixed' check (type in ('event', 'circle', 'deal', 'mixed')),
  url text not null unique,
  enabled boolean not null default true,
  cadence text not null default 'daily' check (cadence in ('manual', 'daily', 'weekly')),
  last_scraped_at timestamptz,
  last_status text,
  error_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.import_candidates (
  id text primary key,
  source_id text references public.import_sources(id) on delete set null,
  source_name text not null default '',
  source_url text not null default '',
  item_url text not null,
  type text not null check (type in ('event', 'circle', 'deal')),
  title text not null,
  description text not null default '',
  normalized_payload jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0.5,
  duplicate_key text not null,
  status text not null default 'new' check (status in ('new', 'approved', 'rejected', 'duplicate')),
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists import_candidates_duplicate_key_idx
  on public.import_candidates (duplicate_key);

alter table public.import_sources enable row level security;
alter table public.import_candidates enable row level security;
drop policy if exists "Admins manage import sources" on public.import_sources;
create policy "Admins manage import sources" on public.import_sources for all
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "Admins manage import candidates" on public.import_candidates;
create policy "Admins manage import candidates" on public.import_candidates for all
  using (public.is_admin())
  with check (public.is_admin());

-- Daily overnight scraping is run by invoking the discover-imports Edge Function.
-- Configure your deployed scheduler for roughly 03:00 Asia/Tokyo, plus admins
-- can trigger the same function manually from /admin.

-- Update circles SELECT: public sees only approved; owners and admins see all
drop policy if exists "Public read circles" on public.circles;
drop policy if exists "Read approved or own circles" on public.circles;
create policy "Read approved or own circles" on public.circles for select
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());

-- Update events SELECT: same pattern
drop policy if exists "Public read events" on public.events;
drop policy if exists "Read approved or own events" on public.events;
create policy "Read approved or own events" on public.events for select
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());

-- Audit trail for every moderation action
create table if not exists public.moderation_history (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('circle', 'event')),
  content_id text not null,
  submitter_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('submitted', 'approved', 'declined')),
  actor_id uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.moderation_history enable row level security;
drop policy if exists "Users see own mod history" on public.moderation_history;
create policy "Users see own mod history" on public.moderation_history for select
  using (submitter_id = auth.uid() or public.is_admin());
drop policy if exists "Authenticated can insert mod history" on public.moderation_history;
create policy "Authenticated can insert mod history" on public.moderation_history for insert
  with check (auth.uid() is not null);
drop policy if exists "Admin delete mod history" on public.moderation_history;
create policy "Admin delete mod history" on public.moderation_history for delete
  using (public.is_admin());
