-- Goodkind database schema for Supabase (PostgreSQL).
-- Run in the Supabase SQL Editor after creating a project.
-- Phone numbers and OTP credentials stay in Supabase Auth, not in public profile rows.

create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 60),
  age smallint not null check (age between 18 and 99),
  gender text not null check (gender in ('Man', 'Woman', 'Non-binary')),
  bio text not null default '' check (char_length(bio) <= 500),
  city text not null default '',
  looking_for text not null default '',
  relationship_type text not null default '',
  interests text[] not null default '{}',
  languages text[] not null default '{}',
  mother_tongue text not null default '',
  family_plan text not null default '',
  religion text not null default '',
  education text not null default '',
  exercise text not null default '',
  job_title text not null default '',
  company_name text not null default '',
  workplace text not null default '',
  drinking text not null default '',
  smoking text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(interests) <= 5)
);

-- Private fields are only readable by the profile owner and trusted server-side code.
create table if not exists public.private_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birth_date date,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  precise_location_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  object_path text not null unique,
  position smallint not null check (position between 1 and 6),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, position)
);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '' check (char_length(message) <= 300),
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 3000),
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);

create table if not exists public.profile_views (
  viewer_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references auth.users(id) on delete cascade,
  last_viewed_at timestamptz not null default now(),
  view_count integer not null default 1 check (view_count > 0),
  primary key (viewer_id, profile_id),
  check (viewer_id <> profile_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 2 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(trim(name)) between 2 and 60),
  price_minor_units integer not null check (price_minor_units >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  billing_period text not null check (billing_period in ('month', 'quarter', 'year', 'one time')),
  duration_days integer not null check (duration_days between 1 and 3650),
  description text not null default '' check (char_length(description) <= 300),
  feature_keys text[] not null default '{}',
  custom_features text[] not null default '{}',
  published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled', 'pending')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  payment_reference text,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create table if not exists public.daily_like_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  likes_sent integer not null default 0 check (likes_sent >= 0),
  primary key (user_id, usage_date)
);

create index if not exists profiles_active_city_idx on public.profiles (city) where is_active;
create index if not exists likes_to_user_idx on public.likes (to_user_id, created_at desc);
create index if not exists messages_participants_idx on public.messages (sender_id, recipient_id, sent_at desc);
create index if not exists profile_views_owner_idx on public.profile_views (profile_id, last_viewed_at desc);
create index if not exists subscriptions_user_expiry_idx on public.subscriptions (user_id, expires_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.can_view_profile(candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (select auth.uid()) is not null
    and exists (select 1 from public.profiles p where p.user_id = candidate_id and p.is_active)
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = candidate_id)
         or (b.blocker_id = candidate_id and b.blocked_id = (select auth.uid()))
    );
$$;

create or replace function public.profile_photo_owner(path text)
returns uuid
language plpgsql
immutable
set search_path = public, pg_temp
as $$
begin
  if split_part(path, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return split_part(path, '/', 1)::uuid;
  end if;
  return null;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists private_profiles_set_updated_at on public.private_profiles;
create trigger private_profiles_set_updated_at before update on public.private_profiles
for each row execute function public.set_updated_at();
drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at before update on public.plans
for each row execute function public.set_updated_at();

alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.private_profiles enable row level security;
alter table public.profile_photos enable row level security;
alter table public.blocks enable row level security;
alter table public.likes enable row level security;
alter table public.messages enable row level security;
alter table public.profile_views enable row level security;
alter table public.reports enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.daily_like_usage enable row level security;

drop policy if exists "read own role" on public.user_roles;
create policy "read own role" on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "read visible profiles" on public.profiles;
create policy "read visible profiles" on public.profiles for select to authenticated
using (user_id = (select auth.uid()) or public.can_view_profile(user_id) or public.is_admin());
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "admin manages profiles" on public.profiles;
create policy "admin manages profiles" on public.profiles for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "private profile owner access" on public.private_profiles;
create policy "private profile owner access" on public.private_profiles for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "read visible photos" on public.profile_photos;
create policy "read visible photos" on public.profile_photos for select to authenticated
using (public.can_view_profile(user_id) or user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "manage own photos" on public.profile_photos;
create policy "manage own photos" on public.profile_photos for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "read own blocks" on public.blocks;
create policy "read own blocks" on public.blocks for select to authenticated
using (blocker_id = (select auth.uid()));
drop policy if exists "create own blocks" on public.blocks;
create policy "create own blocks" on public.blocks for insert to authenticated
with check (blocker_id = (select auth.uid()));
drop policy if exists "remove own blocks" on public.blocks;
create policy "remove own blocks" on public.blocks for delete to authenticated
using (blocker_id = (select auth.uid()));

drop policy if exists "read likes involving me" on public.likes;
create policy "read likes involving me" on public.likes for select to authenticated
using (from_user_id = (select auth.uid()) or to_user_id = (select auth.uid()));
drop policy if exists "send own likes" on public.likes;
create policy "send own likes" on public.likes for insert to authenticated
with check (from_user_id = (select auth.uid()) and public.can_view_profile(to_user_id));
drop policy if exists "remove own likes" on public.likes;
create policy "remove own likes" on public.likes for delete to authenticated
using (from_user_id = (select auth.uid()));

drop policy if exists "read messages in my conversations" on public.messages;
create policy "read messages in my conversations" on public.messages for select to authenticated
using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
drop policy if exists "send messages as myself" on public.messages;
create policy "send messages as myself" on public.messages for insert to authenticated
with check (sender_id = (select auth.uid()) and public.can_view_profile(recipient_id));
drop policy if exists "recipient marks message read" on public.messages;
create policy "recipient marks message read" on public.messages for update to authenticated
using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

drop policy if exists "read profile views involving me" on public.profile_views;
create policy "read profile views involving me" on public.profile_views for select to authenticated
using (viewer_id = (select auth.uid()) or profile_id = (select auth.uid()));
drop policy if exists "record own profile views" on public.profile_views;
create policy "record own profile views" on public.profile_views for insert to authenticated
with check (viewer_id = (select auth.uid()) and public.can_view_profile(profile_id));
drop policy if exists "update own profile view" on public.profile_views;
create policy "update own profile view" on public.profile_views for update to authenticated
using (viewer_id = (select auth.uid())) with check (viewer_id = (select auth.uid()));

drop policy if exists "submit reports as myself" on public.reports;
create policy "submit reports as myself" on public.reports for insert to authenticated
with check (reporter_id = (select auth.uid()));
drop policy if exists "admins review reports" on public.reports;
create policy "admins review reports" on public.reports for select to authenticated
using (public.is_admin());
drop policy if exists "admins update reports" on public.reports;
create policy "admins update reports" on public.reports for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read published plans" on public.plans;
create policy "read published plans" on public.plans for select to anon, authenticated
using (published or public.is_admin());
drop policy if exists "admins insert plans" on public.plans;
create policy "admins insert plans" on public.plans for insert to authenticated
with check (public.is_admin());
drop policy if exists "admins update plans" on public.plans;
create policy "admins update plans" on public.plans for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete plans" on public.plans;
create policy "admins delete plans" on public.plans for delete to authenticated
using (public.is_admin());

drop policy if exists "read own subscriptions" on public.subscriptions;
create policy "read own subscriptions" on public.subscriptions for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "admins manage subscriptions" on public.subscriptions;
create policy "admins manage subscriptions" on public.subscriptions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read own daily like usage" on public.daily_like_usage;
create policy "read own daily like usage" on public.daily_like_usage for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "admins manage daily like usage" on public.daily_like_usage;
create policy "admins manage daily like usage" on public.daily_like_usage for all to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select on public.user_roles to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.private_profiles to authenticated;
grant select, insert, update, delete on public.profile_photos to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update on public.profile_views to authenticated;
grant insert on public.reports to authenticated;
grant select on public.plans to anon, authenticated;
grant insert, update, delete on public.plans to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.daily_like_usage to authenticated;
grant insert, update, delete on public.subscriptions, public.daily_like_usage to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "read visible profile photo files" on storage.objects;
create policy "read visible profile photo files" on storage.objects for select to authenticated
using (
  bucket_id = 'profile-photos'
  and (public.can_view_profile(public.profile_photo_owner(name))
       or public.profile_photo_owner(name) = (select auth.uid())
       or public.is_admin())
);
drop policy if exists "upload own profile photo files" on storage.objects;
create policy "upload own profile photo files" on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos' and public.profile_photo_owner(name) = (select auth.uid()));
drop policy if exists "update own profile photo files" on storage.objects;
create policy "update own profile photo files" on storage.objects for update to authenticated
using (bucket_id = 'profile-photos' and public.profile_photo_owner(name) = (select auth.uid()))
with check (bucket_id = 'profile-photos' and public.profile_photo_owner(name) = (select auth.uid()));
drop policy if exists "delete own profile photo files" on storage.objects;
create policy "delete own profile photo files" on storage.objects for delete to authenticated
using (bucket_id = 'profile-photos' and public.profile_photo_owner(name) = (select auth.uid()));
