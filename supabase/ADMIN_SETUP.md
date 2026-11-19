# Admin portal setup

The portal uses Supabase Auth and the `user_roles` table. It does not contain a hard-coded admin password or a service-role key.

1. In Supabase, create an administrator account under **Authentication → Users**. Use the account's email and password to sign in at `admin-login.html`.
2. Copy that user's UUID from the Users page.
3. Run this in the Supabase SQL Editor, replacing the UUID with the administrator's UUID:

```sql
insert into public.user_roles (user_id, role)
values ('00000000-0000-0000-0000-000000000000', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

The `user_roles`, `plans`, `profiles`, and `subscriptions` tables and their row-level security policies must be installed from `schema.sql`. Admin changes to published plans and account subscriptions are stored in Supabase and are read by the website and Android app.
