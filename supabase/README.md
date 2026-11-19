# Goodkind database setup

The website is currently a static GitHub Pages app. It stores demo profiles, sessions, likes, messages, and plans in each browser's `localStorage`, so that information does not sync between devices. The SQL in `schema.sql` creates a Supabase/PostgreSQL schema for shared, authenticated storage.

## Create the hosted database

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. Open the project's **SQL Editor**, create a query, paste in `schema.sql`, and run it.
3. In **Authentication → Providers**, enable Phone and configure an SMS provider. The current site's OTP is a demo flow, so database login will not be real phone verification until the app is connected to Supabase Auth.
4. In **Project Settings → API**, copy the project URL and the public `anon` key. Never put a `service_role` key in browser code or commit it to this repository.
5. Connect the website's auth and data operations to Supabase using those public values. Only after that connection is made will form submissions be stored in the hosted database.

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

The current standalone admin page still uses browser-only demo storage and its client-side demo login. Do not use that page to administer real member data: production plan/subscription actions must be moved behind authenticated server-side functions, and the site frontend must be connected to Supabase Auth and the tables above.
