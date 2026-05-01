Applying `supabase/schema.sql` to your Supabase project

1) Overview

 - The file `supabase/schema.sql` in this project contains the DB schema, RLS policies and seed data. It now includes `owner_id` on `public.circles` and owner-based RLS policies (so only the owner may update/delete their circle).

2) Apply the SQL (recommended)

 - Open your Supabase project in the web console.
 - Go to "SQL" → "Query Editor".
 - Open the file `supabase/schema.sql` in your editor or copy its contents.
 - Paste the SQL into the Query Editor and run it.

Notes:
 - Running the file will ALTER your schema and create/update policies. The seed INSERTs are idempotent (use `on conflict do update`), but the inserted rows do not set `owner_id` by default.
 - After applying the schema, any client that attempts to insert/update/delete rows will be subject to the new RLS policies.

3) If you have existing seeded circles and want to assign an owner

 - Pick a Supabase auth user UUID (for example your account's `id` shown under Authentication → Users).
 - Run a query like this (replace `<USER_UUID>` with the actual id):

```
update public.circles
set owner_id = '<USER_UUID>'
where id in ('c1','c2','c3','c4','c5','c6');
```

If you want to remove the seed rows and re-seed later, you can `delete from public.circles where id in (...)` then re-run the seed insert part.

4) Verify

 - Ensure your project settings have a JWT signing key (default created by Supabase) and that RLS is enabled.
 - After applying the SQL, try signing in via the app, then create/edit/delete a circle to confirm permission behavior.

5) Optional: apply via the Supabase CLI

If you prefer the CLI and have `supabase` installed and configured locally, you can run the SQL using the CLI against your project.

6) Security reminder

 - Do not expose your `service_role` key in the client. The app uses the anon key and RLS to protect updates.
