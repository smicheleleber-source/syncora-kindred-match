
-- pin search_path on update_updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Lock down SECURITY DEFINER function execution. These are called from
-- triggers and RLS policies (which run with elevated privileges), so no
-- client role needs EXECUTE.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_updated_at() from public, anon, authenticated;
