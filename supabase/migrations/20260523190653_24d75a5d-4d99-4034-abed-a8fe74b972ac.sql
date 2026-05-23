
-- ============ ROLES ENUM ============
create type public.app_role as enum ('admin', 'approver', 'preparer', 'auditor', 'viewer');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  title text,
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- ============ SECURITY DEFINER ROLE CHECK ============
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- ============ AUDIT LOG (SoX 404) ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  resource_type text not null,
  resource_id text,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- ============ POLICIES: profiles ============
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Auditors can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.has_role(auth.uid(), 'auditor'));

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can update profiles"
  on public.profiles for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: user_roles ============
create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Auditors can view all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'auditor'));

create policy "Admins can grant roles"
  on public.user_roles for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can revoke roles"
  on public.user_roles for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: audit_logs (append-only) ============
create policy "Authenticated users can write audit entries"
  on public.audit_logs for insert
  to authenticated
  with check (auth.uid() = actor_id);

create policy "Admins can read all audit entries"
  on public.audit_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Auditors can read all audit entries"
  on public.audit_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'auditor'));

create policy "Users can read own audit entries"
  on public.audit_logs for select
  to authenticated
  using (auth.uid() = actor_id);

-- no update/delete policies on audit_logs = append-only

-- ============ TRIGGERS ============
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- Auto-create profile and bootstrap admin on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_admin_email constant text := 's.michele.leber@syncoraconnect.com';
begin
  insert into public.profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );

  if lower(new.email) = lower(bootstrap_admin_email) then
    insert into public.user_roles (user_id, role, granted_by)
    values (new.id, 'admin', new.id)
    on conflict do nothing;
  else
    insert into public.user_roles (user_id, role, granted_by)
    values (new.id, 'viewer', new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ INDEXES ============
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);
create index audit_logs_resource_idx on public.audit_logs(resource_type, resource_id, created_at desc);
create index user_roles_user_idx on public.user_roles(user_id);
