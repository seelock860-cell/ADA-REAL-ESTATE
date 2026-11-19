-- ADA REAL ESTATE — Complete Supabase Database, RLS & Storage Schema
-- Run this script in your Supabase Project SQL Editor.

-- 1. Enable UUID extension
create extension if not exists "pgcrypto";

-- 2. Profiles table (linked to Supabase Auth users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

-- Automatically create a profile row when a new Auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Security helper: check if current authenticated user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- 3. Property Categories table
create table if not exists public.property_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.property_categories (name, slug, sort_order) values
  ('Houses for Sale', 'houses-for-sale', 1),
  ('Houses for Rent', 'houses-for-rent', 2),
  ('Apartments', 'apartments', 3),
  ('Land for Sale', 'land-for-sale', 4),
  ('Luxury Properties', 'luxury-properties', 5),
  ('Commercial Properties', 'commercial-properties', 6),
  ('Duplexes', 'duplexes', 7),
  ('Terraced Houses', 'terraced-houses', 8)
on conflict (name) do nothing;

-- 4. Properties table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  category text not null,
  listing_type text not null default 'sale' check (listing_type in ('sale', 'rent')),
  description text not null,
  location text not null,
  city text not null default 'Port Harcourt',
  address text not null,
  price numeric(15, 2) not null default 0,
  house_rent numeric(15, 2),
  caution_fee numeric(15, 2),
  agency_fee numeric(15, 2),
  legal_fee numeric(15, 2),
  service_charge numeric(15, 2),
  other_charges numeric(15, 2),
  total_initial_payment numeric(15, 2),
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  toilets integer not null default 0,
  parking_spaces integer not null default 0,
  features text[] not null default '{}',
  availability text not null default 'Available' check (availability in ('Available', 'Sold', 'Rented')),
  is_published boolean not null default true,
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_properties_published_created on public.properties (is_published, created_at desc);
create index if not exists idx_properties_category on public.properties (category);
create index if not exists idx_properties_availability on public.properties (availability);

-- 5. Property Images table
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  is_main boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_property_images_property on public.property_images (property_id, sort_order);

-- 6. Property Videos table
create table if not exists public.property_videos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  title text,
  created_at timestamptz not null default now()
);

create index if not exists idx_property_videos_property on public.property_videos (property_id);

-- 7. Enquiries table
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text not null,
  email text,
  property_id uuid references public.properties(id) on delete set null,
  property_title text,
  enquiry_type text not null default 'General Enquiry' check (enquiry_type in ('General Enquiry', 'Inspection Request', 'Agent Contact')),
  message text not null,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Scheduled', 'Closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_enquiries_created on public.enquiries (created_at desc);

-- 8. Testimonials table
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_role text not null,
  location text not null,
  quote text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- 9. Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.property_categories enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_videos enable row level security;
alter table public.enquiries enable row level security;
alter table public.testimonials enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

-- Categories Policies
drop policy if exists "Public can view active categories" on public.property_categories;
create policy "Public can view active categories"
  on public.property_categories for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage categories" on public.property_categories;
create policy "Admins can manage categories"
  on public.property_categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- Properties Policies
drop policy if exists "Public can view published properties" on public.properties;
create policy "Public can view published properties"
  on public.properties for select
  using (is_published = true or public.is_admin());

drop policy if exists "Admins can insert properties" on public.properties;
create policy "Admins can insert properties"
  on public.properties for insert
  with check (public.is_admin());

drop policy if exists "Admins can update properties" on public.properties;
create policy "Admins can update properties"
  on public.properties for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete properties" on public.properties;
create policy "Admins can delete properties"
  on public.properties for delete
  using (public.is_admin());

-- Property Images Policies
drop policy if exists "Public can view images of published properties" on public.property_images;
create policy "Public can view images of published properties"
  on public.property_images for select
  using (
    public.is_admin() or exists (
      select 1 from public.properties p
      where p.id = property_id and p.is_published = true
    )
  );

drop policy if exists "Admins can manage property images" on public.property_images;
create policy "Admins can manage property images"
  on public.property_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- Property Videos Policies
drop policy if exists "Public can view videos of published properties" on public.property_videos;
create policy "Public can view videos of published properties"
  on public.property_videos for select
  using (
    public.is_admin() or exists (
      select 1 from public.properties p
      where p.id = property_id and p.is_published = true
    )
  );

drop policy if exists "Admins can manage property videos" on public.property_videos;
create policy "Admins can manage property videos"
  on public.property_videos for all
  using (public.is_admin())
  with check (public.is_admin());

-- Enquiries Policies
drop policy if exists "Public can submit enquiries" on public.enquiries;
create policy "Public can submit enquiries"
  on public.enquiries for insert
  with check (true);

drop policy if exists "Admins can view and manage enquiries" on public.enquiries;
create policy "Admins can view and manage enquiries"
  on public.enquiries for select
  using (public.is_admin());

drop policy if exists "Admins can update enquiries" on public.enquiries;
create policy "Admins can update enquiries"
  on public.enquiries for update
  using (public.is_admin());

drop policy if exists "Admins can delete enquiries" on public.enquiries;
create policy "Admins can delete enquiries"
  on public.enquiries for delete
  using (public.is_admin());

-- Testimonials Policies
drop policy if exists "Public can view published testimonials" on public.testimonials;
create policy "Public can view published testimonials"
  on public.testimonials for select
  using (is_published = true or public.is_admin());

drop policy if exists "Admins can manage testimonials" on public.testimonials;
create policy "Admins can manage testimonials"
  on public.testimonials for all
  using (public.is_admin())
  with check (public.is_admin());

-- 10. Storage Buckets & Storage Policies
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('property-videos', 'property-videos', true)
on conflict (id) do nothing;

drop policy if exists "Public read property images" on storage.objects;
create policy "Public read property images"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "Admins upload property images" on storage.objects;
create policy "Admins upload property images"
  on storage.objects for insert
  with check (bucket_id = 'property-images' and public.is_admin());

drop policy if exists "Admins update property images" on storage.objects;
create policy "Admins update property images"
  on storage.objects for update
  using (bucket_id = 'property-images' and public.is_admin());

drop policy if exists "Admins delete property images" on storage.objects;
create policy "Admins delete property images"
  on storage.objects for delete
  using (bucket_id = 'property-images' and public.is_admin());

drop policy if exists "Public read property videos" on storage.objects;
create policy "Public read property videos"
  on storage.objects for select
  using (bucket_id = 'property-videos');

drop policy if exists "Admins upload property videos" on storage.objects;
create policy "Admins upload property videos"
  on storage.objects for insert
  with check (bucket_id = 'property-videos' and public.is_admin());

drop policy if exists "Admins update property videos" on storage.objects;
create policy "Admins update property videos"
  on storage.objects for update
  using (bucket_id = 'property-videos' and public.is_admin());

drop policy if exists "Admins delete property videos" on storage.objects;
create policy "Admins delete property videos"
  on storage.objects for delete
  using (bucket_id = 'property-videos' and public.is_admin());

-- 11. Promote your first admin user after signing them up in Supabase Auth:
-- update public.profiles set role = 'admin' where email = 'your-admin-email@example.com';
