-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, role text default 'user', created_at timestamptz default now()
);
create or replace function public.handle_new_user() returns trigger as $$
begin insert into public.profiles (id,email) values (new.id,new.email); return new; end;$$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- parts
create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null, file_key text not null, material text, process text default 'cnc_3axis',
  created_at timestamptz default now()
);

-- analysis_jobs
create table if not exists public.analysis_jobs (
  id uuid primary key default gen_random_uuid(), part_id uuid references public.parts(id) on delete cascade,
  status text not null default 'pending', certification text, tolerance_class text, post_process text, criticality text,
  input_url text, metrics_json jsonb, features_json jsonb, issues_json jsonb, error text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- qap
create table if not exists public.qap (
  id uuid primary key default gen_random_uuid(), part_id uuid references public.parts(id) on delete cascade,
  job_id uuid references public.analysis_jobs(id) on delete cascade, qap_json jsonb not null, pdf_key text, created_at timestamptz default now()
);

-- rls
alter table public.parts enable row level security;
alter table public.analysis_jobs enable row level security;
alter table public.qap enable row level security;
alter table public.profiles enable row level security;
create policy user_parts on public.parts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_jobs on public.analysis_jobs for all using (exists (select 1 from public.parts p where p.id = part_id and p.user_id = auth.uid())) with check (exists (select 1 from public.parts p where p.id = part_id and p.user_id = auth.uid()));
create policy user_qap on public.qap for all using (exists (select 1 from public.parts p where p.id = part_id and p.user_id = auth.uid())) with check (exists (select 1 from public.parts p where p.id = part_id and p.user_id = auth.uid()));
create policy user_profiles_select on public.profiles for select using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- admin check
create or replace function public.is_admin(uid uuid) returns boolean language sql as $$ select coalesce((select role = 'admin' from public.profiles where id = uid), false) $$;

-- claim function
create or replace function public.claim_job() returns public.analysis_jobs language plpgsql security definer as $$
declare j public.analysis_jobs; begin
  select * into j from public.analysis_jobs where status='pending' order by created_at asc limit 1 for update skip locked;
  if not found then return null; end if;
  update public.analysis_jobs set status='processing', updated_at=now() where id=j.id returning * into j; return j; end; $$;
grant execute on function public.claim_job() to service_role;
