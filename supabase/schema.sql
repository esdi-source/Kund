-- Enable UUID extension
create extension if not exists "pgcrypto";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  height numeric, -- cm
  weight numeric, -- kg
  birth_date date,
  gender text, -- 'male', 'female'
  activity_level numeric, -- BMR multiplier
  goal text, -- 'lose', 'maintain', 'gain'
  daily_calorie_target numeric, -- calculated or manual override
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- FOOD ITEMS (Local database + cache of scanned items)
create table public.food_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  brand text,
  calories_100g numeric not null,
  protein_100g numeric default 0,
  carbs_100g numeric default 0,
  fat_100g numeric default 0,
  barcode text,
  is_custom boolean default true, -- true if user manually created, false if cached from API
  created_at timestamptz default now()
);
alter table public.food_items enable row level security;
create policy "Users can view own food items" on public.food_items for select using (auth.uid() = user_id);
create policy "Users can insert own food items" on public.food_items for insert with check (auth.uid() = user_id);
create policy "Users can update own food items" on public.food_items for update using (auth.uid() = user_id);
create policy "Users can delete own food items" on public.food_items for delete using (auth.uid() = user_id);
create index food_items_barcode_idx on public.food_items(barcode);

-- RECIPES
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  total_calories numeric default 0,
  total_protein numeric default 0,
  total_carbs numeric default 0,
  total_fat numeric default 0,
  created_at timestamptz default now()
);
alter table public.recipes enable row level security;
create policy "Users can view own recipes" on public.recipes for select using (auth.uid() = user_id);
create policy "Users can manage own recipes" on public.recipes for all using (auth.uid() = user_id);

-- RECIPE INGREDIENTS
create table public.recipe_ingredients (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  food_item_id uuid references public.food_items(id) on delete cascade not null,
  amount_g numeric not null,
  created_at timestamptz default now()
);
alter table public.recipe_ingredients enable row level security;
-- Inherit access from recipe (technically dependent on recipe ownership, but simple RLS is to check via join or just trust app logic if strictly relational. 
-- Better: Add user_id to ingredients too or use a complex policy. For simplicity and perf, we can rely on recipe ownership if we only access via recipe, but clean RLS is safer.)
-- Let's just add user_id for easier RLS.
alter table public.recipe_ingredients add column user_id uuid references auth.users(id) not null;
create policy "Users can manage own recipe ingredients" on public.recipe_ingredients for all using (auth.uid() = user_id);

-- DIARY ENTRIES
create table public.diary_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default CURRENT_DATE,
  meal_type text not null, -- 'breakfast', 'lunch', 'dinner', 'snack'
  
  -- Can reference a food_item OR a recipe
  food_item_id uuid references public.food_items(id) on delete set null,
  recipe_id uuid references public.recipes(id) on delete set null,
  
  amount_g numeric, -- for food items
  servings numeric, -- for recipes
  
  -- Snapshot of macros
  calories numeric not null,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  
  created_at timestamptz default now()
);
alter table public.diary_entries enable row level security;
create policy "Users can manage own diary" on public.diary_entries for all using (auth.uid() = user_id);
create index diary_entries_date_idx on public.diary_entries(date);

-- WATER TRACKING
create table public.water_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default CURRENT_DATE,
  amount_ml numeric not null,
  created_at timestamptz default now()
);
alter table public.water_entries enable row level security;
create policy "Users can manage own water" on public.water_entries for all using (auth.uid() = user_id);

-- FAVORITES
create table public.favorites (
  user_id uuid references auth.users(id) on delete cascade not null,
  food_item_id uuid references public.food_items(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, food_item_id)
);
alter table public.favorites enable row level security;
create policy "Users can manage favorites" on public.favorites for all using (auth.uid() = user_id);

-- WORKOUTS (Plans)
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);
alter table public.workouts enable row level security;
create policy "Users can manage workouts" on public.workouts for all using (auth.uid() = user_id);

-- WORKOUT LOGS
create table public.workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default CURRENT_DATE,
  workout_id uuid references public.workouts(id) on delete set null,
  duration_minutes numeric,
  calories_burned numeric,
  created_at timestamptz default now()
);
alter table public.workout_logs enable row level security;
create policy "Users can manage workout logs" on public.workout_logs for all using (auth.uid() = user_id);

-- Handle user creation (Trigger for Profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
