-- Run once in Supabase → SQL Editor. Creates the tables behind the About wall and the Writings likes and comments.
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

-- Writings: likes and comments on each post (post = a short id such as 'anthive')
create table if not exists public.post_likes (
  id bigint generated always as identity primary key,
  post text not null check (char_length(post) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.post_comments (
  id bigint generated always as identity primary key,
  post text not null check (char_length(post) between 1 and 60),
  name text check (name is null or char_length(name) <= 40),
  text text not null check (char_length(text) between 2 and 500),
  created_at timestamptz not null default now()
);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

create policy "anyone can read likes" on public.post_likes for select to anon using (true);
create policy "anyone can like" on public.post_likes for insert to anon with check (char_length(post) between 1 and 60);

create policy "anyone can read comments" on public.post_comments for select to anon using (true);
create policy "anyone can comment" on public.post_comments for insert to anon
  with check (char_length(text) between 2 and 500 and (name is null or char_length(name) <= 40));
