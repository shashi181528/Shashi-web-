# Goodkind database setup

The website is currently a static GitHub Pages app. It stores demo profiles, sessions, likes, messages, and plans in each browser's `localStorage`, so that information does not sync between devices. The SQL in `schema.sql` creates a Supabase/PostgreSQL schema for shared, authenticated storage.

## Create the hosted database

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. Open the project's **SQL Editor**, create a query, paste in `schema.sql`, and run it.
3. In **Authentication → Providers**, enable Phone sign-in. For TextBee OTP delivery, follow [`TEXTBEE_OTP_SETUP.md`](TEXTBEE_OTP_SETUP.md) to deploy and configure the Supabase Send SMS Auth Hook.
4. In **Project Settings → API Keys**, copy the Project URL and the public publishable key (or the legacy `anon` key). The configured public values are stored in `supabase-config.js`; never put a secret or `service_role` key in browser code.
5. The site sends and verifies phone OTP through Supabase Auth, stores profile details in `profiles`/`private_profiles`, and uploads profile photos to the private Storage bucket. Phone Auth and a configured SMS delivery method must be enabled.

## Tables

- `profiles` stores public profile details; interests are limited to five.
- `private_profiles` stores date of birth and precise coordinates, readable only by the owner.
- `profile_photos` stores ordered paths for up to six private-bucket photos.
- `likes`, `messages`, `profile_views`, `blocks`, and `reports` store member activity.
- `plans`, `subscriptions`, and `daily_like_usage` store membership and usage records.
- `user_roles` provides an admin role table; users cannot grant themselves admin access.

Row Level Security is enabled on every application table. A member can read only their own private profile, conversations, subscription, and role. Public profile rows contain only the approximate city; precise location and birth date stay in `private_profiles`. Photo files are kept in a private Storage bucket.

## Grant an administrator role

After an administrator account has been created through Supabase Auth, find its UUID in **Authentication → Users**, then run this in the SQL Editor as the project owner:

```sql
insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID_HERE', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

The standalone admin portal authenticates with Supabase Auth and requires an administrator row in `user_roles`. Its plan and subscription actions use the row-level security policies above.
