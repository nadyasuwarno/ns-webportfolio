-- Run once in Supabase → SQL Editor. Creates the two tables behind the About page.
-- Visitors can only add and read. Removing a post, or marking a suggestion planned or done,
-- is done by Nadya in the Table Editor.

create table if not exists public.firsts (
  id bigint generated always as identity primary key,
  text text not null check (char_length(text) between 2 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.next_firsts (
  id bigint generated always as identity primary key,
  text text not null check (char_length(text) between 2 and 120),
  status text not null default 'suggested' check (status in ('suggested', 'planned', 'done')),
  created_at timestamptz not null default now()
);

alter table public.firsts enable row level security;
alter table public.next_firsts enable row level security;

create policy "anyone can read firsts" on public.firsts for select to anon using (true);
create policy "anyone can add a first" on public.firsts for insert to anon with check (char_length(text) between 2 and 120);

create policy "anyone can read next firsts" on public.next_firsts for select to anon using (true);
create policy "anyone can suggest a first" on public.next_firsts for insert to anon
  with check (char_length(text) between 2 and 120 and status = 'suggested');
