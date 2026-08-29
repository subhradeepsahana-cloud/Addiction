-- Global default drink types (user_id null = visible to everyone). Users
-- can still define custom drinks via drink_types rows with their own
-- user_id.

insert into public.drink_types (category, name, default_abv_percent, default_volume_ml, is_custom) values
  ('beer', 'Beer (regular)', 5.0, 355, false),
  ('beer', 'Beer (craft/strong)', 7.5, 355, false),
  ('wine', 'Wine (glass)', 12.5, 150, false),
  ('wine', 'Wine (large glass)', 12.5, 250, false),
  ('whisky', 'Whisky (single)', 40.0, 30, false),
  ('whisky', 'Whisky (double)', 40.0, 60, false),
  ('vodka', 'Vodka (single)', 40.0, 30, false),
  ('vodka', 'Vodka (double)', 40.0, 60, false),
  ('rum', 'Rum (single)', 40.0, 30, false),
  ('gin', 'Gin (single)', 40.0, 30, false),
  ('cocktail', 'Cocktail (standard)', 15.0, 200, false),
  ('other', 'Other', 10.0, 150, false)
on conflict do nothing;
