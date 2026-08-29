-- Section 21 (Privacy): users must be able to export their data. This RPC
-- runs as the calling user (not security definer), so RLS on every
-- underlying table still applies — it can only ever return the caller's
-- own rows.

create or replace function public.export_my_data()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'preferences', (select to_jsonb(pr) from public.user_preferences pr where pr.user_id = auth.uid()),
    'goals', (select coalesce(jsonb_agg(g), '[]'::jsonb) from public.goals g where g.user_id = auth.uid()),
    'motivations', (select coalesce(jsonb_agg(m), '[]'::jsonb) from public.motivations m where m.user_id = auth.uid()),
    'motivation_photos', (select coalesce(jsonb_agg(mp), '[]'::jsonb) from public.motivation_photos mp where mp.user_id = auth.uid()),
    'drinking_events', (select coalesce(jsonb_agg(d), '[]'::jsonb) from public.drinking_events d where d.user_id = auth.uid()),
    'cravings', (select coalesce(jsonb_agg(c), '[]'::jsonb) from public.cravings c where c.user_id = auth.uid()),
    'craving_interventions', (select coalesce(jsonb_agg(ci), '[]'::jsonb) from public.craving_interventions ci where ci.user_id = auth.uid()),
    'daily_checkins', (select coalesce(jsonb_agg(dc), '[]'::jsonb) from public.daily_checkins dc where dc.user_id = auth.uid()),
    'user_triggers', (select coalesce(jsonb_agg(ut), '[]'::jsonb) from public.user_triggers ut where ut.user_id = auth.uid()),
    'achievements', (select coalesce(jsonb_agg(a), '[]'::jsonb) from public.achievements a where a.user_id = auth.uid()),
    'ai_conversations', (select coalesce(jsonb_agg(ac), '[]'::jsonb) from public.ai_conversations ac where ac.user_id = auth.uid()),
    'ai_messages', (select coalesce(jsonb_agg(am), '[]'::jsonb) from public.ai_messages am where am.user_id = auth.uid()),
    'exported_at', now()
  );
$$;

grant execute on function public.export_my_data() to authenticated;
