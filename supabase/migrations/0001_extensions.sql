-- Extensions required by the schema.
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Generic updated_at trigger used by most tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
