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
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

create table if not exists public.circles (
  id text primary key,
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
  title text not null,
  category text not null check (category in ('Social', 'Career', 'Hackathon', 'Networking')),
  date text not null,
  location text not null,
  emoji text not null,
  going integer not null default 0,
  tags text[] not null default '{}',
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id text primary key,
  brand text not null,
  title text not null,
  category text not null check (category in ('Food', 'Fashion', 'Lifestyle')),
  discount text not null,
  area text not null,
  emoji text not null,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id text primary key,
  company text not null,
  role text not null,
  type text not null check (type in ('Shukatsu', 'Baito', 'Opportunity')),
  location text not null,
  tags text[] not null default '{}',
  emoji text not null,
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
alter table public.circles add column if not exists icon_url text;
alter table public.events add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.deals add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.jobs add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.guides add column if not exists social_links jsonb not null default '{}'::jsonb;

alter table public.circles drop constraint if exists circles_commitment_check;
alter table public.circles
  add constraint circles_commitment_check
  check (commitment in ('Daily', 'Weekly', 'Monthly', 'Casual', 'Regular', 'Serious'));

alter table public.circles enable row level security;
alter table public.events enable row level security;
alter table public.deals enable row level security;
alter table public.jobs enable row level security;
alter table public.guides enable row level security;

drop policy if exists "Public read circles" on public.circles;
create policy "Public read circles" on public.circles for select using (true);
drop policy if exists "Public insert circles" on public.circles;
create policy "Insert as owner" on public.circles for insert with check (auth.uid() = owner_id);
drop policy if exists "Public update circles" on public.circles;
create policy "Update by owner" on public.circles for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Public delete circles" on public.circles;
create policy "Delete by owner" on public.circles for delete using (auth.uid() = owner_id);

drop policy if exists "Public read events" on public.events;
create policy "Public read events" on public.events for select using (true);
drop policy if exists "Public insert events" on public.events;
create policy "Public insert events" on public.events for insert with check (true);
drop policy if exists "Public update events" on public.events;
create policy "Public update events" on public.events for update using (true) with check (true);
drop policy if exists "Public delete events" on public.events;
create policy "Public delete events" on public.events for delete using (true);

drop policy if exists "Public read deals" on public.deals;
create policy "Public read deals" on public.deals for select using (true);
drop policy if exists "Public insert deals" on public.deals;
create policy "Public insert deals" on public.deals for insert with check (true);
drop policy if exists "Public update deals" on public.deals;
create policy "Public update deals" on public.deals for update using (true) with check (true);
drop policy if exists "Public delete deals" on public.deals;
create policy "Public delete deals" on public.deals for delete using (true);

drop policy if exists "Public read jobs" on public.jobs;
create policy "Public read jobs" on public.jobs for select using (true);
drop policy if exists "Public insert jobs" on public.jobs;
create policy "Public insert jobs" on public.jobs for insert with check (true);
drop policy if exists "Public update jobs" on public.jobs;
create policy "Public update jobs" on public.jobs for update using (true) with check (true);
drop policy if exists "Public delete jobs" on public.jobs;
create policy "Public delete jobs" on public.jobs for delete using (true);

drop policy if exists "Public read guides" on public.guides;
create policy "Public read guides" on public.guides for select using (true);
drop policy if exists "Public insert guides" on public.guides;
create policy "Public insert guides" on public.guides for insert with check (true);
drop policy if exists "Public update guides" on public.guides;
create policy "Public update guides" on public.guides for update using (true) with check (true);
drop policy if exists "Public delete guides" on public.guides;
create policy "Public delete guides" on public.guides for delete using (true);

insert into public.circles (id, name, category, description, members, activity, english_friendly, commitment, emoji, tags) values
  ('c1', 'Tokyo Tech Society', 'Tech', 'Hackathons, side projects, and AI study sessions every week.', 248, 'High', true, 'Regular', '💻', array['coding', 'ai', 'international-friendly']),
  ('c2', 'Waseda Jazz Club', 'Music', 'Weekly jam sessions in Takadanobaba. All levels welcome.', 86, 'Medium', true, 'Casual', '🎷', array['music', 'performance']),
  ('c3', 'Keio Finance Circle', 'Career', 'Markets, IB prep, and case competitions.', 312, 'High', false, 'Serious', '📈', array['finance', 'shukatsu']),
  ('c4', 'Kyoto Hiking Crew', 'Outdoors', 'Monthly hikes around Kansai mountains.', 142, 'Medium', true, 'Casual', '🥾', array['outdoors', 'travel']),
  ('c5', 'International Film Society', 'Arts', 'Screenings & discussions in English and Japanese.', 97, 'Low', true, 'Casual', '🎬', array['film', 'international-friendly']),
  ('c6', 'Todai Robotics', 'Tech', 'Build, compete, repeat. Robocon every spring.', 64, 'High', false, 'Serious', '🤖', array['engineering', 'competition'])
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  members = excluded.members,
  activity = excluded.activity,
  english_friendly = excluded.english_friendly,
  commitment = excluded.commitment,
  emoji = excluded.emoji,
  tags = excluded.tags;

insert into public.events (id, title, category, date, location, emoji, going, tags) values
  ('e1', 'International Welcome Mixer', 'Social', 'Fri, May 8 · 7:00 PM', 'Shibuya', '🥂', 124, array['international-friendly', 'free']),
  ('e2', 'Spring Career Forum 2026', 'Career', 'Sat, May 16 · 10:00 AM', 'Tokyo Big Sight', '💼', 1820, array['shukatsu', 'tech', 'finance']),
  ('e3', '48h AI Hackathon', 'Hackathon', 'Sat, May 23 · 9:00 AM', 'Roppongi Hills', '⚡', 312, array['coding', 'ai', 'prizes']),
  ('e4', 'Startup Founders Meetup', 'Networking', 'Wed, May 13 · 6:30 PM', 'Otemachi', '🚀', 78, array['startup', 'networking']),
  ('e5', 'Hanami Picnic @ Yoyogi', 'Social', 'Sun, May 4 · 12:00 PM', 'Yoyogi Park', '🌸', 56, array['outdoors', 'free']),
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

insert into public.jobs (id, company, role, type, location, tags, emoji) values
  ('j1', 'Mercari', 'Software Engineer Intern', 'Shukatsu', 'Roppongi · Hybrid', array['tech', 'internship', 'english-ok'], '🛍️'),
  ('j2', 'Rakuten', 'Product Management New Grad', 'Shukatsu', 'Setagaya', array['product', 'newgrad'], '🛒'),
  ('j3', 'Starbucks Roppongi', 'Barista (Evenings)', 'Baito', 'Roppongi', array['english-ok', 'flexible'], '☕'),
  ('j4', 'GaijinPot', 'Content Writer (Part-time)', 'Baito', 'Remote', array['english', 'writing'], '✍️'),
  ('j5', 'MEXT', 'Scholarship for International Students', 'Opportunity', 'Nationwide', array['scholarship', 'international'], '🎓'),
  ('j6', 'TechCrunch Tokyo', 'Student Pitch Competition', 'Opportunity', 'Shibuya', array['startup', 'prize'], '🏆')
on conflict (id) do update set
  company = excluded.company,
  role = excluded.role,
  type = excluded.type,
  location = excluded.location,
  tags = excluded.tags,
  emoji = excluded.emoji;

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
