create extension if not exists pgcrypto;

create table if not exists public.report_admins (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint report_admins_email_lowercase check (email = lower(email))
);

insert into public.report_admins (email)
values ('lyl549439629@gmail.com')
on conflict (email) do nothing;

create table if not exists public.report_page_state (
  id text primary key,
  report jsonb not null default '{}'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.report_page_state (id, report, theme)
values ('current', '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

create or replace function public.is_report_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.report_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_report_admin() to anon, authenticated;
grant select on public.report_page_state to anon, authenticated;
grant insert, update, delete on public.report_page_state to authenticated;
grant select on public.report_admins to authenticated;

alter table public.report_admins enable row level security;
alter table public.report_page_state enable row level security;

drop policy if exists "report admins can read admins" on public.report_admins;
create policy "report admins can read admins"
on public.report_admins
for select
to authenticated
using (public.is_report_admin());

drop policy if exists "anyone can read report page state" on public.report_page_state;
create policy "anyone can read report page state"
on public.report_page_state
for select
to anon, authenticated
using (id = 'current');

drop policy if exists "report admins can insert page state" on public.report_page_state;
create policy "report admins can insert page state"
on public.report_page_state
for insert
to authenticated
with check (id = 'current' and public.is_report_admin());

drop policy if exists "report admins can update page state" on public.report_page_state;
create policy "report admins can update page state"
on public.report_page_state
for update
to authenticated
using (id = 'current' and public.is_report_admin())
with check (id = 'current' and public.is_report_admin());

drop policy if exists "report admins can delete page state" on public.report_page_state;
create policy "report admins can delete page state"
on public.report_page_state
for delete
to authenticated
using (id = 'current' and public.is_report_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-assets',
  'report-assets',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone can read report assets" on storage.objects;
create policy "anyone can read report assets"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'report-assets');

drop policy if exists "report admins can upload report assets" on storage.objects;
create policy "report admins can upload report assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'report-assets' and public.is_report_admin());

drop policy if exists "report admins can update report assets" on storage.objects;
create policy "report admins can update report assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'report-assets' and public.is_report_admin())
with check (bucket_id = 'report-assets' and public.is_report_admin());

drop policy if exists "report admins can delete report assets" on storage.objects;
create policy "report admins can delete report assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'report-assets' and public.is_report_admin());
