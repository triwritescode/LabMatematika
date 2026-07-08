do $$
declare uid uuid := '0c8509cb-b6c7-4b1a-b4ef-c3e1ba7a8beb';
begin
  delete from public.level_mastery  where user_id = uid;
  delete from public.lab_meta       where user_id = uid;
  delete from public.tingkat_passed where user_id = uid;
  delete from public.active_days    where user_id = uid;
  delete from public.user_stats     where user_id = uid;
  delete from public.profiles       where id = uid;
end $$;