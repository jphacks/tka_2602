create table if not exists public.detective_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 500),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.detective_notes enable row level security;

create policy "Users can read their own detective notes"
on public.detective_notes for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own detective notes"
on public.detective_notes for insert
to authenticated
with check ((select auth.uid()) = user_id);
