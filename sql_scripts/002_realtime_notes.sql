create or replace function public.touch_note()
returns trigger language plpgsql as $$
begin
  if new.id <> old.id or new.owner_id <> old.owner_id then
    raise exception 'Note owner and id cannot be changed';
  end if;
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end $$;

drop trigger if exists notes_touch on public.notes;
create trigger notes_touch before update on public.notes
for each row execute function public.touch_note();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end $$;
