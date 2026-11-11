create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cultural_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  description text,
  category text not null default 'routine' check (category in ('routine', 'special', 'cancellation')),
  status text not null default 'scheduled' check (status in ('scheduled', 'altered', 'cancelled')),
  start_at timestamptz not null,
  end_at timestamptz,
  time_start time,
  time_end time,
  location text,
  recurring_rule text,
  is_all_day boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists published boolean not null default false;
alter table public.events add column if not exists status text not null default 'scheduled';
alter table public.events add column if not exists recurring_rule text;
alter table public.events add column if not exists time_start time;
alter table public.events add column if not exists time_end time;
alter table public.events add column if not exists end_at timestamptz;

create table if not exists public.event_exceptions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  exception_date date not null,
  replacement_text text,
  is_cancelled boolean not null default false,
  replacement_start_time time,
  replacement_end_time time,
  created_at timestamptz not null default now(),
  unique (event_id, exception_date)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  description text,
  category text,
  isbn text,
  cover_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.cultural_activities enable row level security;
alter table public.events enable row level security;
alter table public.event_exceptions enable row level security;
alter table public.announcements enable row level security;
alter table public.catalog_items enable row level security;
alter table public.project_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users as admins
    where admins.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
revoke all on table public.admin_users from anon, authenticated;

drop policy if exists "Authenticated admins can read profiles" on public.profiles;
drop policy if exists "Authenticated admins can manage profiles" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins can read profiles" on public.profiles
for select to authenticated using ((select public.is_admin()));
create policy "Admins can manage profiles" on public.profiles
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Published activities are public" on public.cultural_activities;
drop policy if exists "Admins manage activities" on public.cultural_activities;
drop policy if exists "Public can read published activities" on public.cultural_activities;
drop policy if exists "Admins can read all activities" on public.cultural_activities;
drop policy if exists "Admins can insert activities" on public.cultural_activities;
drop policy if exists "Admins can update activities" on public.cultural_activities;
drop policy if exists "Admins can delete activities" on public.cultural_activities;
create policy "Public can read published activities" on public.cultural_activities
for select to anon, authenticated using (status = 'published' or (select public.is_admin()));
create policy "Admins can insert activities" on public.cultural_activities
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update activities" on public.cultural_activities
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete activities" on public.cultural_activities
for delete to authenticated using ((select public.is_admin()));

drop policy if exists "Published events are public" on public.events;
drop policy if exists "Admins manage events" on public.events;
drop policy if exists "Public can read published events" on public.events;
drop policy if exists "Admins can insert events" on public.events;
drop policy if exists "Admins can update events" on public.events;
drop policy if exists "Admins can delete events" on public.events;
create policy "Public can read published events" on public.events
for select to anon, authenticated using (published = true or (select public.is_admin()));
create policy "Admins can insert events" on public.events
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update events" on public.events
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete events" on public.events
for delete to authenticated using ((select public.is_admin()));

drop policy if exists "Admins manage event exceptions" on public.event_exceptions;
drop policy if exists "Public can read published event exceptions" on public.event_exceptions;
drop policy if exists "Admins can manage event exceptions" on public.event_exceptions;
create policy "Public can read published event exceptions" on public.event_exceptions
for select to anon, authenticated using (
  exists (
    select 1 from public.events
    where events.id = event_exceptions.event_id
      and events.published = true
  ) or (select public.is_admin())
);
create policy "Admins can manage event exceptions" on public.event_exceptions
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Published announcements are public" on public.announcements;
drop policy if exists "Admins manage announcements" on public.announcements;
drop policy if exists "Public can read published announcements" on public.announcements;
drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Public can read published announcements" on public.announcements
for select to anon, authenticated using (published = true or (select public.is_admin()));
create policy "Admins can manage announcements" on public.announcements
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Published catalog is public" on public.catalog_items;
drop policy if exists "Admins manage catalog items" on public.catalog_items;
drop policy if exists "Public can read published catalog" on public.catalog_items;
drop policy if exists "Admins can manage catalog items" on public.catalog_items;
create policy "Public can read published catalog" on public.catalog_items
for select to anon, authenticated using (published = true or (select public.is_admin()));
create policy "Admins can manage catalog items" on public.catalog_items
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public settings read" on public.project_settings;
drop policy if exists "Admins manage settings" on public.project_settings;
drop policy if exists "Public can read settings" on public.project_settings;
drop policy if exists "Admins can manage settings" on public.project_settings;
create policy "Public can read settings" on public.project_settings
for select to anon, authenticated using (true);
create policy "Admins can manage settings" on public.project_settings
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select on public.cultural_activities, public.events, public.event_exceptions,
  public.announcements, public.catalog_items, public.project_settings to anon, authenticated;
grant insert, update, delete on public.cultural_activities, public.events,
  public.event_exceptions, public.announcements, public.catalog_items,
  public.project_settings, public.profiles to authenticated;
